import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
const pwaEnabled = process.env.NODE_ENV === "production";

const withPWA = withPWAInit({
  dest: "public",
  disable: !pwaEnabled,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // API calls (Network first)
    {
      urlPattern: /\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Pages and assets (Stale While Revalidate)
    {
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        request.mode === "navigate" ||
        ["style", "script", "image", "font"].includes(request.destination),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages-assets-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Don't show logs
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

export default withSentryConfig(
  withPWA(nextConfig as any),
  sentryWebpackPluginOptions
);