"use client";

import { useState, useTransition } from "react";
import { saveQuestionnaire, type QuestionnaireResponses } from "./actions";

const FIELDS: {
  key: keyof QuestionnaireResponses;
  label: string;
  placeholder: string;
  rows?: number;
}[] = [
  {
    key: "location",
    label: "Shoot location",
    placeholder: "Venue name + full address. Multiple locations? List them.",
    rows: 3,
  },
  {
    key: "schedule",
    label: "Run of show / schedule",
    placeholder:
      "Rough schedule for the day. When does Kenny need to arrive? Key moments and timing?",
    rows: 4,
  },
  {
    key: "must_have_shots",
    label: "Must-have shots",
    placeholder:
      "Specific moments, people, or details that absolutely need to be captured.",
    rows: 4,
  },
  {
    key: "music_vibe",
    label: "Music + vibe references",
    placeholder:
      "Songs, artists, or videos that capture the energy you want. Links welcome.",
    rows: 3,
  },
  {
    key: "day_of_contacts",
    label: "Day-of contacts",
    placeholder:
      "Who's the on-site point person? Name + phone for anyone Kenny might need to reach.",
    rows: 3,
  },
  {
    key: "notes",
    label: "Anything else",
    placeholder:
      "Restrictions, surprises, accessibility, food, dress code — anything Kenny should know.",
    rows: 3,
  },
];

export default function QuestionnaireForm({
  inquiryId,
}: {
  inquiryId: string;
  projectType: string | null;
}) {
  const initial = FIELDS.reduce<QuestionnaireResponses>(
    (acc, f) => ({ ...acc, [f.key]: "" }),
    {} as QuestionnaireResponses,
  );
  const [responses, setResponses] = useState<QuestionnaireResponses>(initial);
  const [error, setError] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveQuestionnaire(inquiryId, responses);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDidSubmit(true);
    });
  };

  if (didSubmit) {
    return (
      <div className="rounded-xl border border-emerald-900 bg-emerald-950 p-8 text-emerald-100">
        <h2 className="text-2xl font-semibold">Got it — thanks</h2>
        <p className="mt-3 text-sm text-emerald-200">
          Kenny&apos;s got everything he needs. He&apos;ll be in touch closer
          to the day if anything else comes up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <label
            htmlFor={field.key}
            className="text-sm font-medium text-zinc-200"
          >
            {field.label}
          </label>
          <textarea
            id={field.key}
            rows={field.rows ?? 3}
            value={responses[field.key]}
            onChange={(e) =>
              setResponses((r) => ({ ...r, [field.key]: e.target.value }))
            }
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-zinc-100/20 transition placeholder:text-zinc-500 focus:ring-2"
          />
        </div>
      ))}

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save details"}
      </button>
    </form>
  );
}
