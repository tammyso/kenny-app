"use client";

import { useState, useTransition } from "react";
import { postProjectComment } from "../../actions";

export default function ProjectComment({ inquiryId }: { inquiryId: string }) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [didPost, setDidPost] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await postProjectComment({
        inquiryId,
        commenterName: name,
        body,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDidPost(true);
      setBody("");
    });
  };

  return (
    <div className="mt-6 border-t border-zinc-200 pt-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Comments + revisions
      </p>
      {didPost ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Got it — Kenny will see this. Drop another note any time.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Note for Kenny — feedback, revision request, or just a thanks. Reference timestamps if helpful (e.g. 0:32)."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 transition focus:ring-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !name.trim() || !body.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send comment"}
        </button>
      </form>
    </div>
  );
}
