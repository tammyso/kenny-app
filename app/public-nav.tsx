"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { KENNY_PROFILE } from "@/lib/profile";
import { MailIcon, SocialIcon } from "./social-icon";

const NAV_LINKS = [
  { href: "/submit", label: "Work + contact" },
  { href: "/packages", label: "Packages" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-12 flex items-center justify-between gap-5 text-sm">
      <Link href="/submit" className="flex min-w-0 items-center gap-4" aria-label="Oak One Eight Visualz — home">
        <Image
          src="/logo.png"
          alt="Oak One Eight Visualz"
          width={200}
          height={200}
          className="opacity-90 hover:opacity-100"
        />
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Videographer
          </p>
          <p
            className="text-5xl font-normal italic text-zinc-50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kenny
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-5">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            pathname === link.href
              ? "whitespace-nowrap text-zinc-50"
              : "whitespace-nowrap text-zinc-300 underline-offset-2 hover:text-zinc-50 hover:underline"
          }
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
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
      </div>
    </nav>
  );
}
