import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdfjs-dist and mammoth as Node.js externals — not bundled by Turbopack
  serverExternalPackages: ['pdfjs-dist', 'mammoth'],
};

export default nextConfig;
