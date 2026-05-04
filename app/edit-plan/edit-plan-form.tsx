"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { generateEditPlan, type EditPlanImage } from "./actions";

// Minimal Web Speech API surface — the official types aren't in TS lib.dom by
// default, but this is all we use.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    [index: number]: { transcript: string };
  }>;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type LocalImage = {
  file: File;
  previewUrl: string;
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

// Phone photos are huge (3-5MB each); raw base64 of a few of them blows past
// the server-action body size limit. Downsize to ~1024px and re-encode as JPEG
// before sending — plenty of resolution for Claude to read a thumbnail.
const MAX_DIM = 1024;
const JPEG_QUALITY = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",", 2)[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const resizeFileToBase64 = async (
  file: File,
): Promise<{ base64: string; mediaType: "image/jpeg" }> => {
  const img = await loadImage(file);
  const ratio = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't create canvas context for resize");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't encode resized image"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  const base64 = await blobToBase64(blob);
  return { base64, mediaType: "image/jpeg" };
};

export default function EditPlanForm() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [brief, setBrief] = useState("");
  const [projectType, setProjectType] = useState("");
  const [targetLength, setTargetLength] = useState("");
  const [vibe, setVibe] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Voice memo state — Web Speech API only, no upload/transcription server.
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startRecording = () => {
    setError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser. Type the brief instead.");
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript + " ";
        else interimText += transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setBrief((prev) => {
          const trimmedFinal = finalText.trim();
          return prev ? `${prev.trim()} ${trimmedFinal}` : trimmedFinal;
        });
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterim("");
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      setError(`Voice error: ${event.error}. Try again or type the brief.`);
      setIsRecording(false);
      setInterim("");
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const next: LocalImage[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
        setError(`${file.name} skipped — only JPG, PNG, GIF, or WEBP.`);
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...next].slice(0, 12));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = () => {
    setError(null);
    setPlan(null);

    if (!brief.trim()) {
      setError("Brief is required.");
      return;
    }
    if (images.length === 0) {
      setError("Upload at least one thumbnail.");
      return;
    }

    startTransition(async () => {
      try {
        const payload: EditPlanImage[] = await Promise.all(
          images.map((img) => resizeFileToBase64(img.file)),
        );
        const result = await generateEditPlan({
          brief,
          projectType,
          targetLength,
          vibe,
          images: payload,
        });
        setPlan(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleCopy = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(plan);
    } catch {
      setError("Couldn't copy — select and copy manually.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">
          1. Upload thumbnails
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Take screenshots of key moments from each clip in Premiere. Up to 12
          thumbnails. They&apos;re sent to Claude for the plan and not stored.
        </p>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="mt-3 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
        />

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img, i) => (
              <div key={img.previewUrl} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Thumbnail ${i + 1}`}
                  className="aspect-video w-full rounded-md border border-zinc-200 object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-black"
                  aria-label={`Remove thumbnail ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">2. Brief</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            <span>Project type</span>
            <input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="Wedding, brand reel, music video..."
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            <span>Target length</span>
            <input
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value)}
              placeholder="60 seconds, 3 minutes..."
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            <span>Vibe / energy</span>
            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="Cinematic, punchy, intimate..."
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-700">
              What is this edit for? Audience, story arc, key moments to hit,
              anything special about the shoot.
            </span>
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  isRecording
                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isRecording ? "animate-pulse bg-red-600" : "bg-zinc-400"}`}
                  aria-hidden
                />
                {isRecording ? "Stop recording" : "Record voice memo"}
              </button>
            )}
          </div>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder={
              voiceSupported
                ? "Type or hit Record voice memo and just talk."
                : undefined
            }
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          {interim && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs italic text-amber-800">
              {interim}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || images.length === 0 || !brief.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Generating plan..." : "Generate plan"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {plan && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Edit plan</h2>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-900">
            {plan}
          </pre>
        </div>
      )}
    </div>
  );
}
