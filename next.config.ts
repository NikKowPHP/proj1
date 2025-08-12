import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This will allow all hostnames. Use with caution.
      },
    ],
  },
};

export default nextConfig;