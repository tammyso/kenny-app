import type { Metadata } from "next";
import Link from "next/link";
import { KENNY_PROFILE } from "@/lib/profile";
import PublicNav from "../public-nav";

export const metadata: Metadata = {
  title: "Packages & Pricing",
  description:
    "Cinematic wedding films, event coverage, and photography add-ons by Oak One Eight Visualz.",
};

const WEDDING_FULL = [
  {
    name: "Essential Film",
    price: "$2,200+",
    tagline: "Perfect for intimate or streamlined wedding days",
    items: [
      "Up to 6 hours of coverage",
      "1 professional cinematographer",
      "5–7 minute cinematic highlight film",
      "Professionally licensed music",
      "Online delivery gallery",
      "6–8 week delivery timeline",
    ],
  },
  {
    name: "Signature Film",
    price: "$3,200+",
    tagline: "A complete cinematic story of the wedding day",
    highlight: true,
    items: [
      "Up to 8 hours of coverage",
      "1–2 cinematographers",
      "7–10 minute cinematic highlight film",
      "60–90 second teaser trailer",
      "Full ceremony or speeches film",
      "Online delivery gallery",
      "6–8 week delivery timeline",
    ],
  },
  {
    name: "Legacy Film",
    price: "$4,500+",
    tagline: "For couples who want everything captured and preserved",
    items: [
      "Up to 10–12 hours of coverage",
      "2 cinematographers",
      "10–15 minute cinematic wedding film",
      "Teaser trailer",
      "Full ceremony and speeches",
      "Drone footage (where permitted)",
      "Priority delivery (4–5 weeks)",
      "Online gallery + archive",
    ],
  },
  {
    name: "Signature Photo & Film",
    price: "$5,900",
    tagline: "A seamless photo + cinematic film experience with one creative team",
    items: [
      "Up to 8 hours of coverage",
      "Cinematic highlight film (7–10 min)",
      "Teaser trailer",
      "Ceremony or speeches film",
      "Professionally edited high-resolution images",
      "Online photo gallery with download access",
      "Priority communication & unified timeline planning",
    ],
  },
];

const WEDDING_FOCUSED = [
  {
    name: "Ceremony Film",
    price: "$1,600+",
    items: [
      "Coverage of the wedding ceremony only",
      "Pre-ceremony details + arrival coverage",
      "Cinematic edit of the full ceremony",
      "Short cinematic highlight (2–3 min)",
      "Professionally licensed music",
      "Online delivery gallery",
      "4–6 week delivery timeline",
    ],
  },
  {
    name: "Reception Film",
    price: "$1,900+",
    items: [
      "Coverage of the reception only",
      "Grand entrance, speeches, first dances, open dancing",
      "3–5 minute cinematic highlight film",
      "Full speeches and formal dances edit",
      "Professionally licensed music",
      "Online delivery gallery",
      "4–6 week delivery timeline",
    ],
  },
  {
    name: "Ceremony Photo & Film",
    price: "$2,300+",
    items: [
      "Ceremony video coverage",
      "Cinematic ceremony film + short highlight",
      "Select photography captured during the ceremony",
      "Professionally edited high-resolution images",
      "Online gallery for photos + video",
    ],
  },
  {
    name: "Reception Photo & Film",
    price: "$2,600+",
    items: [
      "Reception video coverage",
      "Cinematic highlight film",
      "Full speeches + dances edit",
      "Select photography during reception moments",
      "Online gallery for photos + video",
    ],
  },
  {
    name: "Heirloom Film",
    price: "$4,500+",
    items: [
      "Up to 10–12 hours of coverage",
      "2 cinematographers",
      "10–15 minute cinematic wedding film",
      "Teaser trailer",
      "Full ceremony and speeches",
      "Drone footage (where permitted)",
      "Priority delivery (4–5 weeks)",
      "Online gallery + archive",
    ],
  },
];

const WEDDING_ADDONS = [
  { label: "Extra coverage hour", price: "$250" },
  { label: "Drone footage", price: "$300" },
  { label: "Raw footage", price: "$400" },
  { label: "Rush delivery", price: "$500" },
  { label: "Social media edits (vertical)", price: "$300" },
  { label: "Same-day edit", price: "$1,200" },
];

const EVENT_PACKAGES = [
  {
    name: "Event Highlight",
    price: "$850",
    tagline: "Perfect for intimate or streamlined event days",
    items: [
      "Up to 4 hours of event day coverage",
      "3–5 minute cinematic highlight film",
      "20–30 second teaser trailer",
      "Professionally licensed music",
      "Online delivery gallery",
      "3–4 week delivery timeline",
    ],
  },
  {
    name: "Extended Film",
    price: "$1,400+",
    tagline: "A complete cinematic story of the event day",
    highlight: true,
    items: [
      "Up to 6 hours of coverage",
      "5–7 minute cinematic event film",
      "60–90 second teaser trailer",
      "Full speeches or key moments edit",
      "Professionally licensed music",
      "Online delivery gallery",
      "4–6 week delivery timeline",
    ],
  },
  {
    name: "Photography Add-on + Film",
    price: "$1,850",
    tagline: "A seamless photo + cinematic film experience with one creative team",
    items: [
      "Up to 6 hours of coverage",
      "Cinematic highlight film (3–5 min)",
      "30–60 second teaser trailer",
      "Professionally edited high-resolution images",
      "Online photo gallery with download access",
    ],
  },
];

const EVENT_ADDONS = [
  { label: "Extra coverage hour", price: "$200" },
  { label: "Drone footage", price: "$250" },
  { label: "Raw footage", price: "$300" },
  { label: "Rush delivery", price: "$400" },
  { label: "Social media edits (vertical)", price: "$250" },
  { label: "Same-day edit", price: "$1,200" },
];

function PackageCard({
  pkg,
}: {
  pkg: {
    name: string;
    price: string;
    tagline?: string;
    items: string[];
    highlight?: boolean;
  };
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        pkg.highlight
          ? "border-zinc-500 bg-zinc-800"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {pkg.name}
      </p>
      <p className="mt-1 text-3xl font-semibold text-zinc-50">{pkg.price}</p>
      {pkg.tagline && (
        <p className="mt-2 text-sm text-zinc-400">{pkg.tagline}</p>
      )}
      <ul className="mt-5 space-y-2">
        {pkg.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
            <span className="mt-0.5 shrink-0 text-zinc-500">—</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddonRow({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-3 text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className="font-medium text-zinc-100">{price}</span>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <PublicNav />

        <div className="mb-14 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Packages & Pricing
          </p>
          <h1
            className="mt-3 text-5xl font-normal italic text-zinc-50 sm:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What I offer
          </h1>
          <p className="mt-5 text-lg text-zinc-300">
            Every package includes a social media edit. All pricing is based on
            equipment, shoot time, travel, and editing. Travel over 1 hour may
            increase the total. A 30% non-refundable retainer secures your date
            upon signing.
          </p>
        </div>

        {/* Events */}
        <section className="mb-16">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Events
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_PACKAGES.map((pkg) => (
              <PackageCard key={pkg.name} pkg={pkg} />
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2">
            <p className="pt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Event add-ons
            </p>
            {EVENT_ADDONS.map((a) => (
              <AddonRow key={a.label} label={a.label} price={a.price} />
            ))}
            <div className="pb-1" />
          </div>
        </section>

        {/* Weddings — full day */}
        <section className="mb-10">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Weddings — full day
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEDDING_FULL.map((pkg) => (
              <PackageCard key={pkg.name} pkg={pkg} />
            ))}
          </div>
        </section>

        {/* Weddings — focused coverage */}
        <section className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Weddings — focused coverage
          </p>
          <p className="mb-6 text-sm text-zinc-400">
            For couples who only need ceremony or reception coverage — not the
            full day.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WEDDING_FOCUSED.map((pkg) => (
              <PackageCard key={pkg.name} pkg={pkg} />
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2">
            <p className="pt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Wedding add-ons
            </p>
            {WEDDING_ADDONS.map((a) => (
              <AddonRow key={a.label} label={a.label} price={a.price} />
            ))}
            <div className="pb-1" />
          </div>
        </section>

        <div className="mt-14 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <p className="text-base text-zinc-300">
            Not sure which package fits? Send me the details and I&apos;ll put
            together the right coverage for your day.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Send an inquiry
          </Link>
        </div>

        <footer className="mt-16 text-center text-xs text-zinc-500">
          Based in {KENNY_PROFILE.city} · &copy; {new Date().getFullYear()} Kenny
        </footer>
      </main>
    </div>
  );
}
