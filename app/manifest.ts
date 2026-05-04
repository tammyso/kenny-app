import type { MetadataRoute } from "next";

// Lets Kenny "Add to Home Screen" on iOS or Android and get a custom icon
// that opens the dashboard full-screen, no browser chrome — feels app-like.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kenny",
    short_name: "Kenny",
    description: "Inquiry dashboard, drafts, calendar, invoices, prospects.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
