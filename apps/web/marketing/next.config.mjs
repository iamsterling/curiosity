/**
 * The marketing zone: landing page and docs, statically exported and baked
 * into the base app's public/ at bundle time (zero runtime in the
 * distribution). In dev it runs as its own server on :4177 and the base
 * rewrites / and /docs/* to it.
 *
 * The assetPrefix keeps the exported assets out of the base app's own
 * /_next namespace: the export emits /marketing-static/_next/... and the
 * bundle copies the whole `out/` tree into the base's public/, so the base
 * serves them at the domain root without colliding with its own assets.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  assetPrefix: "/marketing-static",
  images: { unoptimized: true },
  // Docker dev: the container's file watcher cannot see bind-mount
  // events, so the dev server polls instead (the article recipe — the
  // Turbopack hot-reloader reads watchOptions.pollIntervalMs in Next 16).
  watchOptions: { pollIntervalMs: 1000 },
};

export default nextConfig;
