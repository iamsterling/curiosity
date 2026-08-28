import { spawn } from "node:child_process";
import path from "node:path";

import { dataDirectory } from "@crafty/scene-store";

import { forwardShutdown, startZones } from "./next-server.js";

const openBrowser = (url: string): void => {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
};

/**
 * Desktop face: the base app bound to loopback (a secure context, so WebGPU
 * works without certificates), the editor and admin zones behind it, plus
 * the system browser.
 */
export const serveDesktop = async (port: number): Promise<void> => {
  const handles = await startZones({ port, hostname: "127.0.0.1" }).catch((error: unknown) => {
    if (error instanceof Error && /EADDRINUSE/u.test(error.message)) {
      throw new Error(`Port ${port} is already in use — is another Crafty instance running?`);
    }
    throw error;
  });
  forwardShutdown(handles);
  const url = `http://127.0.0.1:${port}`;
  process.stdout.write(`Crafty is running at ${url}\n`);
  process.stdout.write(`Data directory: ${path.resolve(dataDirectory())}\n`);
  openBrowser(url);
  await Promise.all(handles.map((handle) => handle.closed));
};
