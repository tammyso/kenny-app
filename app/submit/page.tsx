"use client";

import { useRef, useState, useTransition } from "react";
import { submitInquiry } from "../actions";

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

  const handleSubmit = (formData: FormData) => {
    setErrorMessage("");
    startTransition(async () => {
      const result = await submitInquiry(formData);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      setDidSubmit(true);
      formRef.current?.reset();
    });
  };

  if (didSubmit) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Thanks for reaching out
          </h1>
          <p className="mt-3 text-sm text-zinc-700">
            Your inquiry is in. Kenny will follow up within a day or two — keep
            an eye on your inbox.
          </p>
          <button
            type="button"
            onClick={() => setDidSubmit(false)}
            className="mt-6 inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Submit another inquiry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-12">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Videographer
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">Kenny</h1>
        <p className="mt-4 text-base text-zinc-700">
          Brand films, weddings, music videos, and events. I work with a small
          roster of clients on retainers and one-offs that lean into story over
          polish.
        </p>
        <p className="mt-3 text-sm text-zinc-600">
          Have a project in mind? Share a few details below and I&apos;ll be in
          touch.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <form ref={formRef} action={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="client_name"
                className="text-sm font-medium text-zinc-800"
              >
                Your name *
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="client_email"
                className="text-sm font-medium text-zinc-800"
              >
                Email *
              </label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="project_type"
                className="text-sm font-medium text-zinc-800"
              >
                Project type
              </label>
              <select
                id="project_type"
                name="project_type"
                defaultValue=""
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
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
                className="text-sm font-medium text-zinc-800"
              >
                Event date
              </label>
              <input
                id="event_date"
                name="event_date"
                type="date"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="budget_range"
              className="text-sm font-medium text-zinc-800"
            >
              Budget range
            </label>
            <select
              id="budget_range"
              name="budget_range"
              defaultValue=""
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
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
              className="text-sm font-medium text-zinc-800"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              placeholder="Optional details about your project — date flexibility, location, references, anything that helps."
            />
          </div>

          {errorMessage && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send inquiry"}
          </button>
        </form>
      </div>
    </main>
  );
}
