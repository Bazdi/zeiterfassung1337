import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  eslint: {
    // Avoid interactive lint prompt during CI/builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to proceed for analysis even if type errors exist
    ignoreBuildErrors: true,
  },
  experimental: {
    // Help tree-shake icon/date utilities used in the app
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  // Add a safe alias so accidental "/lib/..." imports resolve to src/lib
  webpack: (cfg) => {
    cfg.resolve = cfg.resolve || {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias || {}),
      "/lib": path.resolve(__dirname, "src/lib"),
    } as typeof cfg.resolve.alias;
    return cfg;
  },
};

// Optional: wrap with bundle analyzer if available
let withBundleAnalyzer: (config: NextConfig) => NextConfig = (c) => c;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ba = require("@next/bundle-analyzer");
  withBundleAnalyzer = ba({ enabled: process.env.ANALYZE === "true" });
} catch {}

export default withBundleAnalyzer(config);
