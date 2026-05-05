"use client";

import { useState } from "react";
import type { PortfolioItem } from "@/lib/portfolio";
import { getVideoEmbedUrl } from "@/lib/video-embed";

// Click-to-load embed: shows the static poster until tapped, then swaps in
// the iframe. Avoids loading 6 iframes upfront — the /submit page is the
// public face and needs to be fast.
export default function PortfolioCard({ item }: { item: PortfolioItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null;
  const isPlayable = embedUrl !== null;

  return (
    <figure className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition hover:border-zinc-700">
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        {isPlaying && embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title={item.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.posterUrl}
              alt={item.title}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
            {isPlayable && (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label={`Play ${item.title}`}
                className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 transition group-hover:scale-105">
                  <svg
                    width="20"
                    height="22"
                    viewBox="0 0 20 22"
                    fill="currentColor"
                    className="ml-1 text-zinc-900"
                    aria-hidden
                  >
                    <path d="M0 0 L0 22 L20 11 Z" />
                  </svg>
                </span>
              </button>
            )}
          </>
        )}
      </div>
      <figcaption className="px-3 py-3">
        <p className="text-base font-medium text-zinc-100">{item.title}</p>
        <p className="text-sm text-zinc-500">{item.subtitle}</p>
      </figcaption>
    </figure>
  );
}
