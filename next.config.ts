import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev indicator defaults to bottom-left, where it covers the sidebar
  // account row. Development only; it does not ship to production.
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
