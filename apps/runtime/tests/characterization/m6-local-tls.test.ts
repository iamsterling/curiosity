import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { X509Certificate } from "node:crypto";
import { createServer } from "node:https";
import { createM6ProjectCaTransport } from "../../src/admin.js";

const fixture = resolve(import.meta.dir, "../../fixtures/m6-owned/v1.0.0");
const servers: Array<{ stop(closeActiveConnections?: boolean): void }> = [];
afterEach(() => { for (const server of servers.splice(0)) server.stop(true); });

const startServer = async () => {
  const routes = JSON.parse(readFileSync(join(fixture, "controlled-routes.json"), "utf8"));
  const native = createServer({ key: readFileSync(join(fixture, "tls/server-key.pem")), cert: readFileSync(join(fixture, "tls/server.pem")) }, (request, response) => {
      const url = new URL(request.url!, "https://docs.m6-owned.test"); const controlled = routes[url.pathname];
      if (controlled) {
        response.statusCode = controlled.status; response.setHeader("content-type", controlled.contentType ?? "text/plain; charset=utf-8");
        if (controlled.contentEncoding) response.setHeader("content-encoding", controlled.contentEncoding); if (controlled.location) response.setHeader("location", controlled.location);
        if (controlled.generatedBytes) {
          let remaining = controlled.generatedBytes; const write = () => { if (!remaining) { response.end(); return; } const size = Math.min(16_384, remaining); remaining -= size; if (response.write(Buffer.alloc(size, 120))) setImmediate(write); else response.once("drain", write); }; write(); return;
        }
        response.end("controlled"); return;
      }
      const file = url.pathname === "/robots.txt" ? "robots.txt" : `site${url.pathname === "/" ? "/index.html" : url.pathname}`;
      response.setHeader("content-type", file.endsWith(".txt") ? "text/plain; charset=utf-8" : "text/html; charset=utf-8"); response.setHeader("content-encoding", "identity"); response.end(readFileSync(join(fixture, file)));
    });
  await new Promise<void>((resolveListen) => native.listen(0, "127.0.0.1", resolveListen)); const address = native.address(); if (!address || typeof address === "string") throw new Error("listen failed");
  const server = { port: address.port, stop(closeActiveConnections?: boolean) { if (closeActiveConnections) native.closeAllConnections(); native.close(); } };
  servers.push(server); return server;
};

test.serial("M6 fixture uses project-CA TLS, validates the logical host, and never resolves public DNS", async () => {
  const server = await startServer();
  const ca = readFileSync(join(fixture, "tls/ca.pem"), "utf8");
  const response = await createM6ProjectCaTransport({ port: server.port!, ca })(new URL("https://docs.m6-owned.test/robots.txt"), { method: "GET", kind: "robots", headers: { "accept-encoding": "identity" } });
  expect(response.status).toBe(200); expect(Buffer.from(response.body).toString()).toContain("CuriosityM6");
  const certificate = new X509Certificate(readFileSync(join(fixture, "tls/server.pem")));
  expect(certificate.checkHost("docs.m6-owned.test")).toBe("docs.m6-owned.test");
  expect(certificate.checkHost("wrong.m6-owned.test")).toBeUndefined();
  const transport = createM6ProjectCaTransport({ port: server.port!, ca });
  const request = { method: "GET" as const, kind: "page" as const, headers: { "accept-encoding": "identity" } };
  expect((await transport(new URL("https://docs.m6-owned.test/controlled/redirect/cross"), request)).headers.location).toBe("https://outside.test/");
  expect((await transport(new URL("https://docs.m6-owned.test/controlled/media"), request)).headers["content-type"]).toBe("application/pdf");
  expect((await transport(new URL("https://docs.m6-owned.test/controlled/encoding"), request)).headers["content-encoding"]).toBe("gzip");
  await expect(transport(new URL("https://docs.m6-owned.test/controlled/oversize-page"), request)).rejects.toThrow("page_too_large");
});

test.serial("a wrong-SNI request rejects once without poisoning a subsequent valid request", async () => {
  const server = await startServer(); const ca = readFileSync(join(fixture, "tls/ca.pem"), "utf8");
  const request = { method: "GET" as const, kind: "robots" as const, headers: { "accept-encoding": "identity" } };
  await expect(createM6ProjectCaTransport({ port: server.port!, ca, servername: "wrong.m6-owned.test" })(new URL("https://docs.m6-owned.test/robots.txt"), request)).rejects.toThrow();
  await Bun.sleep(20);
  const response = await createM6ProjectCaTransport({ port: server.port!, ca })(new URL("https://docs.m6-owned.test/robots.txt"), request);
  expect(response.status).toBe(200); expect(Buffer.from(response.body).toString()).toContain("CuriosityM6");
});
