"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const FILTER_CHIPS = [
  { value: "flagged", label: "Flagged" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
] as const;

export default function DashboardToolbar() {
  const router = useRouter();
  const params = useSearchParams();
  const currentQ = params.get("q") ?? "";
  const activeFilter = params.get("filter");

  const [draftQ, setDraftQ] = useState(currentQ);

  // Keep the input in sync if the URL changes externally (e.g. clearing
  // filters from elsewhere).
  useEffect(() => {
    setDraftQ(currentQ);
  }, [currentQ]);

  const buildHref = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    return `/?${next.toString()}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref("q", draftQ));
  };

  const handleClear = () => {
    setDraftQ("");
    router.push(buildHref("q", null));
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <form
        onSubmit={handleSubmit}
        className="flex h-9 items-center overflow-hidden rounded-lg border border-zinc-300 bg-white"
      >
        <input
          type="text"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
          placeholder="Search name, email, project type..."
          className="h-full w-64 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        {currentQ && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 text-xs text-zinc-500 hover:text-zinc-800"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Filter:
        </span>
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() =>
                router.push(
                  buildHref("filter", isActive ? null : chip.value),
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            onClick={() => router.push(buildHref("filter", null))}
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
