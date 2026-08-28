import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isTailscaleAddress = (address) => {
  const octets = address.split(".").map(Number);
  return (
    octets.length === 4 &&
    octets[0] === 100 &&
    octets[1] >= 64 &&
    octets[1] <= 127
  );
};
const tailscaleOrigins = Object.values(os.networkInterfaces()).flatMap(
  (items) =>
    (items ?? [])
      .filter(
        (item) =>
          item.family === "IPv4" &&
          !item.internal &&
          isTailscaleAddress(item.address),
      )
      .map((item) => item.address),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Zone asset prefix: this app is one zone of several on the same domain
  // (multi-zone platform, openspec/changes/multi-zone-platform). Its assets
  // must not collide with the base app's /_next/... — the base rewrites
  // /editor-static/* here. Never unset this in a deployment.
  assetPrefix: "/editor-static",
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "100.84.109.82",
    ...tailscaleOrigins,
  ],
  // Server runtime: the app ships a Next server (Server Components, route
  // handlers) rather than a static export. `standalone` traces the minimal
  // node_modules needed to run it, which the crafty binary launches.
  output: "standalone",
  outputFileTracingRoot: new URL("../../../", import.meta.url).pathname,
  // Turbopack's automatic root detection does not find the repo's bun.lock
  // for this nested workspace path; pin the root explicitly so the linked
  // packages (node_modules/.bun store at the repo root) stay compilable.
  turbopack: { root: new URL("../../../", import.meta.url).pathname },
  serverExternalPackages: [
    "@crafty/scene-store",
    "@crafty/scene-model",
    "@crafty/pen-import",
  ],
  // Docker dev: the container's file watcher cannot see bind-mount
  // events, so the dev server polls instead (the article recipe — the
  // Turbopack hot-reloader reads watchOptions.pollIntervalMs in Next 16).
  watchOptions: { pollIntervalMs: 1000 },
  experimental: {
    // The React debug channel splits the RSC payload: the shell rides the
    // inline stream and the remaining rows are pushed over the HMR
    // websocket (binary REACT_DEBUG_CHUNK messages). Through the base zone
    // the socket cannot connect (no upgrade proxy), so the payload stays
    // incomplete and hydration hangs with no error — a blank page with a
    // live-looking shell. Disabling it makes the inline payload complete,
    // so hydration does not depend on the HMR socket.
    reactDebugChannel: false,
  },
  webpack(config) {
    // Replace Next's dev HMR websocket client with the no-op stub (see
    // hmr-stub.js). The socket cannot connect through the base zone's
    // rewrite boundary — Next does not proxy websocket upgrades — and the
    // real client force-reloads the page after ~40s of failed retries,
    // which kept killing the renderer mid-initialization. Applies to the
    // webpack dev path (containers); the Turbopack dev path has its own
    // client. Revisit when the zone boundary gains an upgrade proxy.
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.normalModuleFactory.tap("DevHmrSocketStub", (nmf) => {
          nmf.hooks.beforeResolve.tap("DevHmrSocketStub", (result) => {
            if (!result) return;
            if (
              /web-socket$/.test(result.request) &&
              result.context.includes("next/dist")
            ) {
              result.request = path.join(
                path.dirname(fileURLToPath(import.meta.url)),
                "hmr-stub.js",
              );
            }
          });
        });
      },
    });
    return config;
  },
};

export default nextConfig;
