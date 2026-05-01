"use client";

import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type FormState = {
  client_name: string;
  client_email: string;
  project_type: string;
  event_date: string;
  budget_range: string;
  message: string;
};

const PROJECT_TYPES = ["Wedding", "Brand", "Event", "Music Video", "Other"];
const BUDGET_RANGES = [
  "Under $1k",
  "$1k to $3k",
  "$3k to $7k",
  "$7k+",
  "Not sure",
];

const initialFormState: FormState = {
  client_name: "",
  client_email: "",
  project_type: "",
  event_date: "",
  budget_range: "",
  message: "",
};

export default function SubmitInquiryPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      ...form,
      project_type: form.project_type || null,
      event_date: form.event_date || null,
      budget_range: form.budget_range || null,
      message: form.message.trim() || null,
    };

    const { error } = await supabase.from("inquiries").insert(payload);

    if (error) {
      setErrorMessage("Unable to submit your inquiry. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Thanks! Your inquiry has been submitted.");
    setForm(initialFormState);
    setIsSubmitting(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Submit an Inquiry</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Share a few details and we will follow up soon.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="client_name"
                className="text-sm font-medium text-zinc-800"
              >
                Client Name *
              </label>
              <input
                id="client_name"
                type="text"
                required
                value={form.client_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, client_name: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="client_email"
                className="text-sm font-medium text-zinc-800"
              >
                Client Email *
              </label>
              <input
                id="client_email"
                type="email"
                required
                value={form.client_email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, client_email: event.target.value }))
                }
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
                Project Type
              </label>
              <select
                id="project_type"
                value={form.project_type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, project_type: event.target.value }))
                }
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
              <label htmlFor="event_date" className="text-sm font-medium text-zinc-800">
                Event Date
              </label>
              <input
                id="event_date"
                type="date"
                value={form.event_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, event_date: event.target.value }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="budget_range" className="text-sm font-medium text-zinc-800">
              Budget Range
            </label>
            <select
              id="budget_range"
              value={form.budget_range}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, budget_range: event.target.value }))
              }
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
            <label htmlFor="message" className="text-sm font-medium text-zinc-800">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
              placeholder="Optional details about your project..."
            />
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        </form>
      </div>
    </main>
  );
}
