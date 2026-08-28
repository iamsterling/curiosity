import { spawn, type ChildProcess } from "node:child_process";
import { connect } from "node:net";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dataDirectory } from "@crafty/scene-store";

/**
 * Launches the zone servers that host Crafty's surfaces. The domain entry is
 * the base app (`dist/base`), a blank path-table app whose rewrites route
 * `/files/*` and `/api/*` to the editor zone and `/admin/*` to the admin
 * zone — all spawned here as standalone servers over loopback, with the same
 * `ZONE_*_URL` environment contract the base app's `next.config` reads.
 *
 * The CLI is a launcher, not an HTTP server: everything Crafty serves is
 * owned by Next. The editor zone's standalone also hosts the scene API and
 * (in deployed mode) the auth API.
 */

export interface ZoneHandle {
  process: ChildProcess;
  port: number;
  hostname: string;
  stop(): void;
  closed: Promise<void>;
}

const here = path.dirname(fileURLToPath(import.meta.url));

/** Loopback ports for the zone servers behind the base app. */
export const ZONE_PORTS = { admin: 4176, editor: 4175 } as const;

interface ZoneDefinition {
  name: keyof typeof ZONE_PORTS | "base";
  port: number;
  hostname: string;
  entryCandidates: string[];
}

const resolveEntry = (candidates: string[]): string | undefined => candidates.find((candidate) => existsSync(candidate));

const zoneDefinitions = (basePort: number, baseHostname: string): ZoneDefinition[] => {
  const editorEntry = resolveEntry([
    path.resolve(here, "../web/apps/web/editor/server.js"),
    path.resolve(here, "../../web/apps/web/editor/server.js"),
    path.resolve(here, "../../../apps/web/editor/.next/standalone/apps/web/editor/server.js"),
    path.resolve(process.cwd(), "apps/web/editor/.next/standalone/apps/web/editor/server.js")
  ]);
  const baseEntry = resolveEntry([
    path.resolve(here, "../base/apps/web/base/server.js"),
    path.resolve(here, "../../base/apps/web/base/server.js"),
    path.resolve(here, "../../../apps/web/base/.next/standalone/apps/web/base/server.js"),
    path.resolve(process.cwd(), "apps/web/base/.next/standalone/apps/web/base/server.js")
  ]);
  const adminEntry = resolveEntry([
    path.resolve(here, "../admin/apps/web/admin/server.js"),
    path.resolve(here, "../../admin/apps/web/admin/server.js"),
    path.resolve(here, "../../../apps/web/admin/.next/standalone/apps/web/admin/server.js"),
    path.resolve(process.cwd(), "apps/web/admin/.next/standalone/apps/web/admin/server.js")
  ]);
  if (!baseEntry) {
    throw new Error("The Crafty base server build was not found. Run `bun run build --filter @crafty/base` (or `bun run bundle`) first.");
  }
  if (!editorEntry) {
    throw new Error("The Crafty editor server build was not found. Run `bun run build --filter @crafty/editor-web` (or `bun run bundle`) first.");
  }
  const zones: ZoneDefinition[] = [
    { name: "base", port: basePort, hostname: baseHostname, entryCandidates: [baseEntry] },
    { name: "editor", port: ZONE_PORTS.editor, hostname: "127.0.0.1", entryCandidates: [editorEntry] }
  ];
  if (adminEntry) zones.push({ name: "admin", port: ZONE_PORTS.admin, hostname: "127.0.0.1", entryCandidates: [adminEntry] });
  return zones;
};

const waitForPort = async (zone: string, port: number, hostname: string, timeoutMs = 30_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const reachable = await new Promise<boolean>((resolve) => {
      const socket = connect({ port, host: hostname });
      const settle = (value: boolean): void => { socket.destroy(); resolve(value); };
      socket.once("connect", () => settle(true));
      socket.once("error", () => settle(false));
      socket.setTimeout(1000, () => settle(false));
    });
    if (reachable) return;
    if (Date.now() > deadline) throw new Error(`The Crafty ${zone} server did not start on ${hostname}:${port} within ${timeoutMs / 1000}s.`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

const spawnZone = (zone: ZoneDefinition, env: NodeJS.ProcessEnv): ZoneHandle => {
  const child = spawn(process.execPath, [zone.entryCandidates[0]!], {
    cwd: path.dirname(zone.entryCandidates[0]!),
    env,
    stdio: ["ignore", "inherit", "inherit"]
  });
  const closed = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  return { process: child, port: zone.port, hostname: zone.hostname, stop: () => { child.kill("SIGTERM"); }, closed };
};

/**
 * Starts every zone of the platform: the base app on the given port, the
 * editor zone on 4175, and the admin zone on 4176 when its build exists.
 * The base receives the `ZONE_*_URL` contract so its rewrites reach the
 * zones the launcher just spawned.
 */
export const startZones = async (options: { port: number; hostname?: string }): Promise<ZoneHandle[]> => {
  const hostname = options.hostname ?? "127.0.0.1";
  const zones = zoneDefinitions(options.port, hostname);
  const handles: ZoneHandle[] = [];
  try {
    for (const zone of zones) {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(zone.port),
        HOSTNAME: zone.hostname,
        CRAFTY_DATA_DIR: dataDirectory(),
        ZONE_EDITOR_URL: `http://127.0.0.1:${ZONE_PORTS.editor}`,
        ZONE_ADMIN_URL: `http://127.0.0.1:${ZONE_PORTS.admin}`
      };
      const handle = spawnZone(zone, env);
      handles.push(handle);
      await waitForPort(zone.name, zone.port, zone.hostname);
    }
    return handles;
  } catch (error) {
    for (const handle of handles) handle.stop();
    throw error;
  }
};

/** Frees the zone processes when the CLI itself is interrupted. */
export const forwardShutdown = (handles: ZoneHandle[]): void => {
  const stop = (): void => { for (const handle of handles) handle.stop(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  process.once("exit", stop);
};
