import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";

import http from "node:http";

import { dataDirectory } from "@crafty/scene-store";

import { forwardShutdown, startZones } from "./next-server.js";

export interface Certificates {
  key: string;
  cert: string;
  caDer: string;
  addresses: string[];
}

const isTailscaleAddress = (address: string): boolean => {
  const octets = address.split(".").map(Number);
  return octets.length === 4 && octets[0] === 100 && octets[1]! >= 64 && octets[1]! <= 127;
};

const tailscaleIPv4Addresses = (): string[] =>
  Object.values(os.networkInterfaces())
    .flatMap((items) => (items ?? []).filter((item) => item.family === "IPv4" && !item.internal && isTailscaleAddress(item.address)).map((item) => item.address));

const openssl = (args: string[]): void => {
  const result = spawnSync("openssl", args, { stdio: "pipe" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`openssl failed: ${result.stderr?.toString().trim() ?? `status ${result.status}`}`);
};

export const ensureCertificates = (directory: string): Certificates => {
  mkdirSync(directory, { recursive: true });
  const caKey = path.join(directory, "crafty-ca-key.pem");
  const caCertificate = path.join(directory, "crafty-ca.pem");
  const caCertificateDer = path.join(directory, "crafty-ca.cer");
  const serverKey = path.join(directory, "crafty-key.pem");
  const serverCertificate = path.join(directory, "crafty-cert.pem");
  const request = path.join(directory, "crafty.csr");
  const serial = path.join(directory, "crafty-ca.srl");
  const extensions = path.join(directory, "crafty-ext.cnf");
  const addresses = tailscaleIPv4Addresses();
  if (addresses.length === 0) throw new Error("No Tailscale IPv4 address found. Connect Tailscale before running `crafty serve`.");
  writeFileSync(extensions, `subjectAltName=DNS:localhost,IP:127.0.0.1,${addresses.map((address) => `IP:${address}`).join(",")}\n`);
  if (!existsSync(caKey) || !existsSync(caCertificate)) openssl(["req", "-x509", "-new", "-nodes", "-newkey", "rsa:2048", "-keyout", caKey, "-out", caCertificate, "-days", "825", "-subj", "/CN=Crafty CA"]);
  openssl(["req", "-new", "-nodes", "-newkey", "rsa:2048", "-keyout", serverKey, "-out", request, "-subj", "/CN=Crafty"]);
  openssl(["x509", "-req", "-in", request, "-CA", caCertificate, "-CAkey", caKey, "-CAcreateserial", "-CAserial", serial, "-out", serverCertificate, "-days", "825", "-sha256", "-extfile", extensions]);
  if (!existsSync(caCertificateDer)) openssl(["x509", "-in", caCertificate, "-outform", "der", "-out", caCertificateDer]);
  return { key: serverKey, cert: serverCertificate, caDer: caCertificateDer, addresses };
};

/**
 * Serve face: TLS terminates here (or is skipped entirely in --http mode for
 * a reverse proxy like Traefik), and the zone servers run on loopback behind
 * it.
 *
 * Keeping HTTPS out of the app server means Next stays on its supported
 * `standalone` entry point, and the certificate story stays a transport
 * concern rather than an application one. The browser still sees a secure
 * origin, which WebGPU requires — the Dokploy deployment uses --http because
 * Traefik terminates TLS at the domain edge instead.
 */
export const serveNetwork = async (port: number, httpOnly: boolean): Promise<void> => {
  const directory = dataDirectory();
  const certificates = httpOnly ? null : ensureCertificates(directory);
  const upstreamPort = port + 1;
  const handles = await startZones({ port: upstreamPort, hostname: "127.0.0.1" });
  forwardShutdown(handles);

  const upstreamRequest = (request: http.IncomingMessage, response: http.ServerResponse): void => {
    const upstream = http.request(
      { host: "127.0.0.1", port: upstreamPort, method: request.method, path: request.url, headers: { ...request.headers, host: `127.0.0.1:${upstreamPort}` } },
      (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
      }
    );
    upstream.on("error", () => {
      if (!response.headersSent) response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "UPSTREAM_UNAVAILABLE", message: "The Crafty web server is not reachable." } }));
    });
    request.pipe(upstream);
  };

  const server = httpOnly
    ? http.createServer(upstreamRequest)
    : https.createServer({ key: readFileSync(certificates!.key), cert: readFileSync(certificates!.cert) }, upstreamRequest);

  await new Promise<void>((resolve, reject) => {
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") reject(new Error(`Port ${port} is already in use — is another Crafty instance running?`));
      else reject(error);
    });
    server.listen(port, "0.0.0.0", resolve);
  });

  if (certificates) {
    for (const address of certificates.addresses) process.stdout.write(`Crafty is available on https://${address}:${port}\n`);
    process.stdout.write(`Install the certificate ${certificates.caDer} on each device once (Settings > General > About > Certificate Trust Settings), then open the URL above.\n`);
  } else {
    process.stdout.write(`Crafty is available on http://0.0.0.0:${port} (TLS is off — terminate it at the reverse proxy).\n`);
  }
  await Promise.all(handles.map((handle) => handle.closed));
  server.close();
};
