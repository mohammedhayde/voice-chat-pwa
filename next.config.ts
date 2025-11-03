import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export' removed - Netlify supports full Next.js features including API routes
  turbopack: {}, // Empty turbopack config to silence warning
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Keep for optimization
  },
};

export default nextConfig;
