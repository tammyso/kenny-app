"use client";

import { useRef, useState, useTransition } from "react";
import { submitInquiry } from "../actions";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";

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
          <h1 className="mt-3 text-4xl font-semibold text-zinc-50">Kenny</h1>
          <p className="mt-4 text-base text-zinc-300">
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
                <figcaption className="px-3 py-2.5">
                  <p className="text-sm font-medium text-zinc-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500">{item.subtitle}</p>
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
            <p className="mt-3 text-base text-zinc-300">
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
                  placeholder="Optional details about your project — date flexibility, location, references, anything that helps."
                />
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
                {isPending ? "Sending..." : "Send inquiry"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
