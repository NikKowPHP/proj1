import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
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