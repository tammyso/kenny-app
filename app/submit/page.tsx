"use client";

import { useRef, useState, useTransition } from "react";
import { submitInquiry } from "../actions";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";
import { KENNY_PROFILE } from "@/lib/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type LocalReference = {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  mediaType?: string;
};

const MAX_REFERENCES = 5;
const MAX_REF_DIM = 1600;
const REF_QUALITY = 0.85;

const REFERENCE_BUCKET = "inquiry-references";

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

const resizeToBlob = async (file: File): Promise<Blob> => {
  const img = await loadImage(file);
  const ratio = Math.min(MAX_REF_DIM / img.width, MAX_REF_DIM / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't create canvas context");
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Couldn't encode image"))),
      "image/jpeg",
      REF_QUALITY,
    );
  });
};

const PROJECT_TYPES = ["Wedding", "Brand", "Event", "Music Video", "Other"];
const BUDGET_RANGES = [
  "Under $1k",
  "$1k to $3k",
  "$3k to $7k",
  "$7k+",
  "Not sure",
];

export default function SubmitInquiryPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [didSubmit, setDidSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [references, setReferences] = useState<LocalReference[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleReferenceFiles = (files: FileList | null) => {
    if (!files) return;
    setErrorMessage("");
    const accepted: LocalReference[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setReferences((prev) => [...prev, ...accepted].slice(0, MAX_REFERENCES));
  };

  const removeReference = (idx: number) => {
    setReferences((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadReferences = async (): Promise<
    { url: string; mediaType: string }[]
  > => {
    if (references.length === 0) return [];
    const supabase = createSupabaseBrowserClient();
    const uploaded: { url: string; mediaType: string }[] = [];
    for (const [i, ref] of references.entries()) {
      const blob = await resizeToBlob(ref.file);
      const path = `${Date.now()}-${i}.jpg`;
      const { data, error } = await supabase.storage
        .from(REFERENCE_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error || !data) {
        throw new Error(`Couldn't upload reference: ${error?.message}`);
      }
      const { data: urlData } = supabase.storage
        .from(REFERENCE_BUCKET)
        .getPublicUrl(data.path);
      uploaded.push({ url: urlData.publicUrl, mediaType: "image/jpeg" });
    }
    return uploaded;
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage("");
    startTransition(async () => {
      try {
        setIsUploading(true);
        const uploaded = await uploadReferences();
        setIsUploading(false);
        if (uploaded.length > 0) {
          formData.set("client_references", JSON.stringify(uploaded));
        }
        const result = await submitInquiry(formData);
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }
        setDidSubmit(true);
        formRef.current?.reset();
        references.forEach((r) => URL.revokeObjectURL(r.previewUrl));
        setReferences([]);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong",
        );
      } finally {
        setIsUploading(false);
      }
    });
  };

  if (didSubmit) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <main className="mx-auto w-full max-w-2xl px-6 py-16">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-zinc-50">
              Thanks for reaching out
            </h1>
            <p className="mt-3 text-sm text-zinc-300">
              Your inquiry is in. Kenny will follow up within a day or two —
              keep an eye on your inbox.
            </p>
            <button
              type="button"
              onClick={() => setDidSubmit(false)}
              className="mt-6 inline-flex h-10 items-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Submit another inquiry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-14 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Videographer
          </p>
          <h1 className="mt-3 text-5xl font-semibold text-zinc-50 sm:text-6xl">
            Kenny
          </h1>
          <p className="mt-5 text-lg text-zinc-300">
            Brand films, weddings, music videos, and events. I work with a small
            roster of clients on retainers and one-offs that lean into story
            over polish.
          </p>
        </div>

        <div className="mb-14">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Selected work
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PORTFOLIO_ITEMS.map((item) => (
              <figure
                key={item.id}
                className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition hover:border-zinc-700"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
                <figcaption className="px-3 py-3">
                  <p className="text-base font-medium text-zinc-100">
                    {item.title}
                  </p>
                  <p className="text-sm text-zinc-500">{item.subtitle}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Get in touch
            </p>
            <p className="mt-3 text-lg text-zinc-300">
              Have a project in mind? Share a few details and I&apos;ll be in
              touch within a day or two.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-sm">
            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="client_name"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Your name *
                  </label>
                  <input
                    id="client_name"
                    name="client_name"
                    type="text"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition placeholder:text-zinc-500 focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="client_email"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Email *
                  </label>
                  <input
                    id="client_email"
                    name="client_email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition placeholder:text-zinc-500 focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="project_type"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Project type
                  </label>
                  <select
                    id="project_type"
                    name="project_type"
                    defaultValue=""
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition focus:ring-2"
                  >
                    <option value="">Select a project type</option>
                    {PROJECT_TYPES.map((projectType) => (
                      <option key={projectType} value={projectType}>
                        {projectType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="event_date"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Event date
                  </label>
                  <input
                    id="event_date"
                    name="event_date"
                    type="date"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition focus:ring-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="budget_range"
                  className="text-sm font-medium text-zinc-200"
                >
                  Budget range
                </label>
                <select
                  id="budget_range"
                  name="budget_range"
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition focus:ring-2"
                >
                  <option value="">Select a budget range</option>
                  {BUDGET_RANGES.map((budgetRange) => (
                    <option key={budgetRange} value={budgetRange}>
                      {budgetRange}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-zinc-200"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition placeholder:text-zinc-500 focus:ring-2"
                  placeholder="Optional details about your project — date flexibility, location, vibe, anything that helps."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Reference images <span className="text-zinc-500">(optional)</span>
                </label>
                <p className="text-xs text-zinc-500">
                  Pinterest pics, mood boards, screenshots — anything that
                  shows the look you want. Up to {MAX_REFERENCES}.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleReferenceFiles(e.target.files)}
                  className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-white"
                />
                {references.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {references.map((ref, i) => (
                      <div key={ref.previewUrl} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ref.previewUrl}
                          alt={`Reference ${i + 1}`}
                          className="aspect-square w-full rounded-md border border-zinc-800 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeReference(i)}
                          className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-black"
                          aria-label={`Remove reference ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMessage && (
                <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading
                  ? "Uploading..."
                  : isPending
                    ? "Sending..."
                    : "Send inquiry"}
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>Based in {KENNY_PROFILE.city}</span>
          <span aria-hidden className="text-zinc-700">·</span>
          <a
            href={`mailto:${KENNY_PROFILE.email}`}
            className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            {KENNY_PROFILE.email}
          </a>
          {KENNY_PROFILE.socials.map((social) => (
            <span key={social.href} className="contents">
              <span aria-hidden className="text-zinc-700">·</span>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
              >
                {social.handle}
              </a>
            </span>
          ))}
        </footer>
      </main>
    </div>
  );
}
