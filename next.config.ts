import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const nodeModulesRoot = join(projectRoot, "node_modules");

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: join(nodeModulesRoot, "tailwindcss/index.css"),
      "tw-animate-css": join(nodeModulesRoot, "tw-animate-css/dist/tw-animate.css"),
      "shadcn/tailwind.css": join(nodeModulesRoot, "shadcn/dist/tailwind.css"),
    },
  },
  // Keep pdfjs-dist and mammoth as Node.js externals — not bundled by Turbopack
  serverExternalPackages: ['pdfjs-dist', 'mammoth'],
  outputFileTracingIncludes: {
    '/api/resume/pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
