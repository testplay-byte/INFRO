import type { NextConfig } from "next";

/**
 * Static export is only enabled when BUILD_STATIC=true (used by the
 * GitHub Pages deployment workflow). During local development the app
 * runs as a normal Next.js dev server on port 3000 with no basePath so
 * the root "/" route renders as expected.
 */
const isStaticBuild = process.env.BUILD_STATIC === "true";

const nextConfig: NextConfig = {
  output: isStaticBuild ? "export" : "standalone",
  // Project site is served from https://<user>.github.io/INFRO/
  basePath: isStaticBuild ? "/INFRO" : undefined,
  assetPrefix: isStaticBuild ? "/INFRO/" : undefined,
  trailingSlash: isStaticBuild,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
