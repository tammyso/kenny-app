// Kenny's contact details shown in the /submit footer. Edit this file as the
// real values come in — no env vars needed.

export type SocialKind = "instagram" | "vimeo" | "youtube" | "tiktok";

export const KENNY_PROFILE = {
  city: "New York", // change to Kenny's actual city
  email: "hello@kenny.com", // change to Kenny's actual email
  socials: [
    {
      kind: "instagram" as SocialKind,
      label: "Instagram",
      href: "https://instagram.com/kenny.video",
    },
    {
      kind: "vimeo" as SocialKind,
      label: "Vimeo",
      href: "https://vimeo.com/kenny",
    },
  ],
  // Where the review-request email points clients. Add Kenny's real Google
  // Business Profile review link, Yelp page, etc. when he shares them.
  reviewLinks: [
    { label: "Google", href: "https://g.page/r/your-google-business-profile/review" },
  ],
};
