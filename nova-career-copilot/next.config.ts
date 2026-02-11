import type { NextConfig } from "next";

const nextConfig: any = {
  serverExternalPackages: ["pdfjs-dist"],
  webpack: (config: any) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: "./src/lib/canvas-mock.ts",
      },
    },
  },
};

export default nextConfig;
