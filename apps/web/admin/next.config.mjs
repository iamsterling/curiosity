/**
 * The admin zone: system administration surfaces (files, revisions,
 * snapshots, and from stage 3, users/sessions). Server Components read
 * scene-store directly; auth (better-auth) gates this zone in deployed mode.
 *
 * The base app rewrites /admin and /admin/* here (path-preserving), so this
 * app's routes live at its own root. Its assets ride /admin-static, which
 * the base also rewrites.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/admin-static",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  output: "standalone",
  outputFileTracingRoot: new URL("../../../", import.meta.url).pathname,
  turbopack: { root: new URL("../../../", import.meta.url).pathname },
  serverExternalPackages: ["@crafty/scene-store"],
  // Docker dev: the container's file watcher cannot see bind-mount
  // events, so the dev server polls instead (the article recipe — the
  // Turbopack hot-reloader reads watchOptions.pollIntervalMs in Next 16).
  watchOptions: { pollIntervalMs: 1000 },
  experimental: {
    // The React debug channel splits the RSC payload: the shell rides the
    // inline stream and the remaining rows are pushed over the HMR
    // websocket. Through the base zone the socket cannot connect (no
    // upgrade proxy), so the payload stays incomplete and hydration hangs
    // with no error. Disabling it makes the inline payload complete.
    reactDebugChannel: false,
  },
};

export default nextConfig;
