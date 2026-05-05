import type { SocialKind } from "@/lib/profile";

// Small inline-SVG icons for the public-site footer. Stroke uses currentColor
// so the parent's text color drives them. 16x16 keeps them subtle.

const COMMON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SocialIcon({ kind }: { kind: SocialKind }) {
  switch (kind) {
    case "instagram":
      return (
        <svg {...COMMON_PROPS}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "vimeo":
      return (
        <svg {...COMMON_PROPS}>
          <path d="M22.396 7.164c-.093 2.026-1.507 4.802-4.245 8.327C15.323 19.172 12.93 21 10.97 21c-1.214 0-2.24-1.119-3.079-3.359C7.331 15.844 6.769 13.5 6.205 11s-1.169-3.643-1.816-3.643c-.141 0-.633.291-1.477.873L2 7.04c.928-.815 1.844-1.631 2.748-2.448C5.991 3.524 6.923 2.97 7.545 2.917c1.469-.141 2.374.864 2.715 3.014.368 2.32.622 3.762.766 4.324.435 1.969.913 2.953 1.435 2.953.405 0 1.014-.643 1.826-1.926.812-1.282 1.247-2.259 1.305-2.93.116-1.105-.318-1.658-1.305-1.658-.464 0-.943.107-1.435.319.952-3.123 2.771-4.641 5.456-4.557 1.992.058 2.929 1.348 2.813 3.871z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...COMMON_PROPS}>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...COMMON_PROPS}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
  }
}

export function MailIcon() {
  return (
    <svg {...COMMON_PROPS}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
