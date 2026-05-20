import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse v2 uses pdfjs-dist which resolves its worker via the filesystem.
  // Bundling it with Turbopack breaks the worker path lookup — keep it external
  // so Node.js loads it directly from node_modules at runtime.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@tavily/core"],
};

export default nextConfig;
