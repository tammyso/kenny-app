// Portfolio items shown on the /submit page above the inquiry form. Edit this
// file (or move to the database later) once Kenny shares his real reels and
// stills. Each item shows as a card; if videoUrl is set, clicking opens an
// inline player. posterUrl is the static thumbnail.
//
// Placeholder content uses picsum.photos so the demo page looks populated
// before real assets land.

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
