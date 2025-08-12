import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Disable sourcemap uploads for now to prevent build failures without a token.
  sourcemaps: {
    disable: true,
  },
};

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

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);