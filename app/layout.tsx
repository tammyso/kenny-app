import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kenny — Videographer",
    template: "%s — Kenny",
  },
  description:
    "Brand films, weddings, music videos, and events. Get in touch for one-offs or retainers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Kenny",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    title: "Kenny — Videographer",
    description:
      "Brand films, weddings, music videos, and events. Get in touch for one-offs or retainers.",
    siteName: "Kenny",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kenny — Videographer",
    description:
      "Brand films, weddings, music videos, and events. Get in touch for one-offs or retainers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
