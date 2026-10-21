import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  poweredByHeader: false,
  // Set NEXT_OUTPUT=export to produce a fully static site in ./out (no server needed).
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
