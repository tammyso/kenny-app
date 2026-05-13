"use client";

import Link from "next/link";
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
    <nav className="mb-12 flex items-center justify-end gap-5 text-sm">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            pathname === link.href
              ? "text-zinc-50"
              : "text-zinc-300 underline-offset-2 hover:text-zinc-50 hover:underline"
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
    </nav>
  );
}
