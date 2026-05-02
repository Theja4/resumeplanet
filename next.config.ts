import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Keep pdfjs-dist and mammoth as Node.js externals — not bundled by Turbopack
  serverExternalPackages: ['pdfjs-dist', 'mammoth'],
  outputFileTracingIncludes: {
    '/api/resume/pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
