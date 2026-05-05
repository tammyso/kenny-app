// Portfolio items shown on the /submit page above the inquiry form.
//
// Two ways to fill these in:
// 1) videoUrl — paste a YouTube or Vimeo URL (e.g.
//    "https://www.youtube.com/watch?v=...", "https://vimeo.com/123456").
//    Cards with a videoUrl render the actual video inline.
// 2) posterUrl only — falls back to a static thumbnail card. Useful when
//    the work isn't hosted on YouTube/Vimeo, or to keep page-load fast.
//
// Placeholder posters use picsum.photos so the demo page looks populated
// before kenny shares real reels.

export type PortfolioItem = {
  id: string;
  title: string;
  subtitle: string;
  posterUrl: string;
  videoUrl?: string;
};

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "brand-reel",
    title: "Brand reel",
    subtitle: "Spring campaign — apparel",
    posterUrl: "https://picsum.photos/seed/kenny-brand/640/360",
  },
  {
    id: "music-video",
    title: "Music video",
    subtitle: "Indie release — single shot",
    posterUrl: "https://picsum.photos/seed/kenny-music/640/360",
  },
  {
    id: "wedding",
    title: "Wedding film",
    subtitle: "Coastal ceremony — natural light",
    posterUrl: "https://picsum.photos/seed/kenny-wedding/640/360",
  },
  {
    id: "event",
    title: "Event recap",
    subtitle: "Two-day conference — speakers + crowd",
    posterUrl: "https://picsum.photos/seed/kenny-event/640/360",
  },
  {
    id: "retainer",
    title: "Retainer cut",
    subtitle: "Monthly social — brand client",
    posterUrl: "https://picsum.photos/seed/kenny-retainer/640/360",
  },
  {
    id: "behind",
    title: "Behind the scenes",
    subtitle: "On location — band documentary",
    posterUrl: "https://picsum.photos/seed/kenny-bts/640/360",
  },
];
