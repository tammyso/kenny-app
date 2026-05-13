import type { Metadata } from "next";
import Link from "next/link";
import { KENNY_PROFILE } from "@/lib/profile";
import PublicNav from "../public-nav";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about booking, payment, and delivery with Oak One Eight Visualz.",
};

const FAQS = [
  {
    q: "How does booking work?",
    a: "Reach out via the inquiry form with your event date and details. I'll send over a proposal with the right package, a contract, and an invoice. Your date is secured once the signed contract and 30% retainer are received.",
  },
  {
    q: "What is the retainer and when is the balance due?",
    a: "A 30% non-refundable retainer is due at signing — this confirms your booking and starts the project. For weddings, the remaining balance is due 14 days before the event. For other events, it's due 7 days prior. Failure to complete payment may result in cancellation of services.",
  },
  {
    q: "Can I pay in full instead of doing a retainer?",
    a: "Yes. You can pay the total amount upfront. Note that the 30% retainer portion remains non-refundable regardless of how you pay.",
  },
  {
    q: "What is your refund policy if I need to cancel?",
    a: "The 30% retainer is non-refundable. If you've paid in full and cancel 30 or more days before the shoot, you'll receive a 70% refund. Cancellations within 14 days of the event are non-refundable. Travel expenses, equipment rentals, food, and lodging are always non-refundable. If I need to cancel due to unforeseen circumstances, a full refund will be issued.",
  },
  {
    q: "How and when will I receive my video?",
    a: "Finished films are delivered via a private online gallery. Event packages deliver in 3–6 weeks depending on the package. Wedding packages deliver in 4–8 weeks. Rush delivery is available as an add-on if you need it sooner.",
  },
  {
    q: "Do you offer raw footage?",
    a: "Yes, raw footage is available as a paid add-on. It will be delivered as-is — no color grading or audio refinement. Pricing is $300 for events and $400 for weddings.",
  },
  {
    q: "How many revisions do I get?",
    a: "One complimentary revision is included after your edited video is delivered. Any additional revisions are $100 per request.",
  },
  {
    q: "What if the event runs over schedule?",
    a: "Overtime is billed at $250/hour for weddings and $200/hour for other events, subject to availability. It's always best to plan coverage time generously upfront.",
  },
  {
    q: "Do you offer photography?",
    a: "Photography is available as a paid add-on bundled with video coverage, at a reduced rate. It's captured selectively at the cinematographer's discretion and does not include posed sessions, extended portrait time, or full traditional coverage. Image quantity is not guaranteed — it varies based on event flow, lighting, and video priorities.",
  },
  {
    q: "Do you offer discounts?",
    a: "Discounts may be available for early booking, referrals, and package deals. Only one discount or promotional offer can be applied per event.",
  },
  {
    q: "Who owns the footage after delivery?",
    a: "You receive your delivered films and photos for personal use. Oak One Eight Visualz retains the right to use footage for portfolio, website, and promotional purposes unless we agree otherwise in writing.",
  },
  {
    q: "Why don't you offer hourly coverage?",
    a: "Events and weddings don't unfold in predictable blocks of time. My packages are built around complete story arcs — so moments can breathe naturally and nothing meaningful gets rushed or missed.",
  },
  {
    q: "What areas do you serve?",
    a: `Based in ${KENNY_PROFILE.city}. Travel is available — trips over 1 hour may increase the total investment to cover travel expenses.`,
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <PublicNav />

        <div className="mb-14 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            FAQ
          </p>
          <h1
            className="mt-3 text-5xl font-normal italic text-zinc-50 sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Common questions
          </h1>
        </div>

        <dl className="space-y-10">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <dt className="text-base font-medium text-zinc-100">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-400">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <p className="text-base text-zinc-300">
            Still have questions? Send me a note and I&apos;ll get back to you
            as soon as possible.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Get in touch
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-zinc-500">
          Based in {KENNY_PROFILE.city} · &copy; {new Date().getFullYear()} Kenny
        </footer>
      </main>
    </div>
  );
}
