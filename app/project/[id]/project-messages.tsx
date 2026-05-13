"use client";

import { useState, useTransition } from "react";
import { submitProjectMessage } from "./actions";

type Message = {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
};

export default function ProjectMessages({
  inquiryId,
  messages: initialMessages,
}: {
  inquiryId: string;
  messages: Message[];
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await submitProjectMessage({ inquiryId, senderName: name, message: text });
        setText("");
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <section className="mt-12">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Messages
      </p>

      {initialMessages.length > 0 && (
        <ol className="mb-6 space-y-4">
          {initialMessages.map((msg) => (
            <li
              key={msg.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-zinc-900">
                  {msg.sender_name}
                </p>
                <p className="text-xs text-zinc-400">
                  {new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="mt-1 text-sm text-zinc-700">{msg.message}</p>
            </li>
          ))}
        </ol>
      )}

      {sent ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Message sent. Kenny will be in touch.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="mb-3 text-sm text-zinc-700">
            Have a question? Send Kenny a note.
          </p>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300"
            />
            <textarea
              placeholder="Your message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
