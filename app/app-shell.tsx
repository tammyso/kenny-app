"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignOutButton from "./sign-out-button";
import { disconnectCalendar } from "./actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchExact?: boolean;
};

type ExternalLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const iconClass = "h-4 w-4 shrink-0";

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Inquiries",
    matchExact: true,
    icon: (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
      </svg>
    ),
  },
  {
    href: "/prospects",
    label: "Brand Prospects",
    icon: (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9v.01" />
        <path d="M9 12v.01" />
        <path d="M9 15v.01" />
        <path d="M9 18v.01" />
      </svg>
    ),
  },
  {
    href: "/edit-plan",
    label: "Template Planner",
    icon: (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="m17 14-5-3-5 3V8h10z" />
        <path d="M2 6 4 2h16l2 4" />
      </svg>
    ),
  },
];

const EXTERNAL_LINKS: ExternalLink[] = [
  {
    href: "https://calendar.google.com",
    label: "Google Calendar",
    icon: (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "https://dashboard.stripe.com/test/payments",
    label: "Stripe Payments",
    icon: (
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

const isActive = (pathname: string, item: NavItem) =>
  item.matchExact ? pathname === item.href : pathname.startsWith(item.href);

export default function AppShell({
  children,
  calendarConnected,
}: {
  children: React.ReactNode;
  calendarConnected: boolean;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-sm font-semibold text-white">
          K
        </span>
        <span className="text-lg font-semibold text-zinc-900">Kenny</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-6 border-t border-zinc-200 pt-3">
          <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Quick links
          </p>
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <span className="flex items-center gap-2.5">
                {link.icon}
                <span>{link.label}</span>
              </span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
                aria-hidden
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          ))}
        </div>
      </nav>
      <div className="space-y-2 border-t border-zinc-200 p-3">
        <a
          href="/submit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <span>View Public Site</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
        {calendarConnected ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs">
            <p className="font-medium text-emerald-800">Calendar connected</p>
            <form action={disconnectCalendar} className="mt-1">
              <button
                type="submit"
                className="text-emerald-700 underline-offset-2 hover:underline"
              >
                Disconnect
              </button>
            </form>
          </div>
        ) : (
          <a
            href="/api/google/connect"
            className="block rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Connect Google Calendar
          </a>
        )}
        <SignOutButton />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-semibold text-white">
            K
          </span>
          <span className="text-base font-semibold text-zinc-900">Kenny</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Menu
        </button>
      </header>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Close
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
