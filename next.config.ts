import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Edit plans send several base64-encoded thumbnails up to the server
    // action; the default 1MB cap is too tight for that.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
