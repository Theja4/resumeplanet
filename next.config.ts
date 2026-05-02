import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Keep pdfjs-dist and mammoth as Node.js externals — not bundled by Turbopack
  serverExternalPackages: ['pdfjs-dist', 'mammoth'],
  outputFileTracingIncludes: {
    '/api/resume/pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
