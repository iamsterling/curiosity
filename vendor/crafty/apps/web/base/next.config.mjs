/**
 * The base app is the domain's path table, nothing else.
 *
 * Every path that belongs to a zone is rewritten here; the destination URLs
 * come from the environment so the same build runs as a bundled zone
 * (loopback URLs set by the launcher), as a dev supervisor target (dev ports),
 * and, later, against independently deployed zones (real domains). A path
 * that is not in the table is a 404 by construction.
 *
 * The rewrites are `afterFiles`: the base's own static routes (its single
 * `/api/health` route and the marketing static output in `public/`) must win
 * over the zone rewrites — notably `/api/:path+` must never swallow
 * `/api/health`.
 */

const zoneUrl = (name, fallback) => (process.env[name]?.length ? process.env[name] : fallback);

const editorUrl = zoneUrl("ZONE_EDITOR_URL", "http://127.0.0.1:4175");
const adminUrl = zoneUrl("ZONE_ADMIN_URL", "http://127.0.0.1:4176");
const marketingUrl = zoneUrl("ZONE_MARKETING_URL", undefined);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "100.84.109.82"],
  output: "standalone",
  outputFileTracingRoot: new URL("../../../", import.meta.url).pathname,
  // Turbopack's automatic root detection does not find the repo's bun.lock
  // for this nested workspace path; pin the root explicitly so the linked
  // packages (node_modules/.bun store at the repo root) stay compilable.
  turbopack: { root: new URL("../../../", import.meta.url).pathname },
  async rewrites() {
    return {
      beforeFiles: [
        // Marketing zone (dev only): when the marketing dev server is up,
        // the domain root and docs go to it. In the bundle there is no
        // ZONE_MARKETING_URL — the static export sits in this app's public/
        // and the filesystem wins over everything.
        ...(marketingUrl ? [
          { source: "/", destination: `${marketingUrl}/` },
          { source: "/docs", destination: `${marketingUrl}/docs` },
          { source: "/docs/:path+", destination: `${marketingUrl}/docs/:path+` },
          { source: "/marketing-static/:path+", destination: `${marketingUrl}/marketing-static/:path+` }
        ] : [])
      ],
      afterFiles: [
        // Editor zone: `/editor/*` is the public file browser/editor contract.
        { source: "/editor", destination: `${editorUrl}/editor` },
        { source: "/editor/:path+", destination: `${editorUrl}/editor/:path+` },
        // `/files/*` remains a compatibility alias for imported links and older
        // clients, but is not the canonical product URL.
        { source: "/files", destination: `${editorUrl}/editor` },
        { source: "/files/:path+", destination: `${editorUrl}/editor/:path+` },
        { source: "/api/:path+", destination: `${editorUrl}/api/:path+` },
        { source: "/editor-static/:path+", destination: `${editorUrl}/editor-static/:path+` },
        // Admin zone: mounted only when a URL is configured, so a bundle
        // without the admin zone keeps working.
        ...(adminUrl ? [
          { source: "/admin", destination: `${adminUrl}/` },
          { source: "/admin/:path+", destination: `${adminUrl}/:path+` },
          { source: "/admin-static/:path+", destination: `${adminUrl}/admin-static/:path+` }
        ] : [])
      ]
    };
  },
  // Docker dev: the container's file watcher cannot see bind-mount
  // events, so the dev server polls instead (the article recipe — the
  // Turbopack hot-reloader reads watchOptions.pollIntervalMs in Next 16).
  watchOptions: { pollIntervalMs: 1000 },
};

export default nextConfig;
