import Link from "next/link";
import type { Metadata } from "next";
import { KENNY_PROFILE } from "@/lib/profile";
import PublicNav from "../public-nav";

export const metadata: Metadata = {
  title: "About",
  description: "About Kenny — videographer based in New York.",
};

// Placeholder bio. Tammy: replace this once Kenny shares his real bio /
// about-me text. Keep it conversational.
const BIO_PARAGRAPHS = [
  "I'm Kenny — a videographer based in New York. I shoot brand films, weddings, music videos, and events for clients I'd love to work with again.",
  "What I care about: story over polish. Some of my favorite work is the unguarded moment — a couple actually laughing, a band actually playing, a brand actually in motion. Polish gets noticed; story gets remembered.",
  "I work with a small roster of clients on retainers and one-offs. If your project feels like a fit, I'd rather take fewer jobs and pour more into each than spread thin.",
];

const SHOOTS = [
  {
    label: "Brand films",
    blurb:
      "Recurring social cuts, hero campaigns, founder stories. Built for brands that want video as part of their voice, not a one-time launch.",
  },
  {
    label: "Weddings",
    blurb:
      "Documentary-leaning wedding films. Coverage that pays attention to the day instead of staging it.",
  },
  {
    label: "Music videos",
    blurb:
      "From single-shot performance pieces to narrative cuts. Independent artists, small labels, solo projects.",
  },
  {
    label: "Events",
    blurb:
      "Conferences, launches, brand activations. Recap reels and selects in fast turnaround.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <PublicNav />

        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            About
          </p>
        </div>

        <div className="space-y-5">
          {BIO_PARAGRAPHS.map((p, i) => (
            <p key={i} className="text-lg leading-relaxed text-zinc-300">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            What I shoot
          </p>
          <dl className="mt-4 space-y-5">
            {SHOOTS.map((s) => (
              <div key={s.label}>
                <dt className="text-base font-medium text-zinc-100">
                  {s.label}
                </dt>
                <dd className="mt-1 text-sm text-zinc-400">{s.blurb}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-14 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <p className="text-base text-zinc-300">
            Got a project in mind? I&apos;d love to hear about it.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Send me an inquiry
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-zinc-500">
          Based in {KENNY_PROFILE.city} · &copy; {new Date().getFullYear()} Kenny
        </footer>
      </main>
    </div>
  );
}
