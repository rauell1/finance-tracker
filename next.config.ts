import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/api/import": ["./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
