"use client";

import { useRef, useState, useTransition } from "react";
import { addProspect } from "./actions";

export default function NewProspectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await addProspect(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add prospect");
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Add a prospect</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-700">
          <span>Brand name</span>
          <input
            type="text"
            name="brand_name"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-700">
          <span>Contact name</span>
          <input
            type="text"
            name="contact_name"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-700 sm:col-span-2">
          <span>Contact email</span>
          <input
            type="email"
            name="contact_email"
            required
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-700 sm:col-span-2">
          <span>Why they&apos;re a fit</span>
          <textarea
            name="fit_notes"
            rows={3}
            placeholder="Specifics Kenny would reference in cold outreach — campaigns you've seen, gaps in their content, what feels promising about a retainer."
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add prospect"}
        </button>
      </div>
    </form>
  );
}
