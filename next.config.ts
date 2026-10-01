import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/hero-:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent:  !process.env.CI,        // quiet locally, verbose in CI
  widenClientFileUpload: true,     // include lazy-loaded chunks in source map upload
  hideSourceMaps: true,            // don't serve .map files to browsers
  disableLogger: true,             // no SDK console noise in production
  automaticVercelMonitors: false,  // no cron monitors
});
