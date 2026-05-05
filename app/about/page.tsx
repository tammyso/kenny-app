import Link from "next/link";
import type { Metadata } from "next";
import { KENNY_PROFILE } from "@/lib/profile";
import { MailIcon, SocialIcon } from "../social-icon";

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
        <nav className="mb-12 flex items-center justify-end gap-5 text-sm">
          <Link
            href="/submit"
            className="text-zinc-300 underline-offset-2 hover:text-zinc-50 hover:underline"
          >
            Work + contact
          </Link>
          <span className="text-zinc-50">About</span>
          <span aria-hidden className="h-4 w-px bg-zinc-700" />
          <div className="flex items-center gap-3 text-zinc-300">
            <a
              href={`mailto:${KENNY_PROFILE.email}`}
              aria-label={`Email ${KENNY_PROFILE.email}`}
              className="transition hover:text-zinc-100"
            >
              <MailIcon />
            </a>
            {KENNY_PROFILE.socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="transition hover:text-zinc-100"
              >
                <SocialIcon kind={social.kind} />
              </a>
            ))}
          </div>
        </nav>

        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            About
          </p>
          <h1 className="mt-3 text-5xl font-semibold text-zinc-50 sm:text-6xl">
            Hi, I&apos;m Kenny
          </h1>
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
