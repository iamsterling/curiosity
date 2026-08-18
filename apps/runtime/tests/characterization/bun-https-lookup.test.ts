import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { request } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { X509Certificate } from "node:crypto";
import { createServer, type Server } from "node:https";
import { checkServerIdentity } from "node:tls";

let directory = "";
let certificate = Buffer.alloc(0);
let server: Server;
let port = 0;

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "curiosity-m5-tls-"));
  const key = join(directory, "key.pem");
  const cert = join(directory, "cert.pem");
  const generated = spawnSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=search.formerhuman.com", "-addext", "subjectAltName=DNS:search.formerhuman.com,DNS:pinned.formerhuman.com", "-keyout", key, "-out", cert], { stdio: "ignore" });
  if (generated.status !== 0) throw new Error("OPENSSL_CHARACTERIZATION_SETUP_FAILED");
  certificate = readFileSync(cert);
  server = createServer({ key: readFileSync(key), cert: certificate }, (_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"results":[]}');
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  port = (server.address() as { port: number }).port;
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  if (directory) rmSync(directory, { recursive: true, force: true });
});

const probe = (hostname: string, servername: string) => new Promise<number>((resolve, reject) => {
  const value = request({
    hostname, port, path: "/agent-search", method: "POST", ca: certificate, agent: false,
    servername, rejectUnauthorized: true,
    lookup: (_name, _options, callback) => {
      const pinned = callback as unknown as (error: null, addresses: Array<{ address: string; family: 4 }>) => void;
      pinned(null, [{ address: "127.0.0.1", family: 4 }]);
    },
  }, (response) => { response.resume(); response.once("end", () => resolve(response.statusCode ?? 0)); });
  value.once("error", reject);
  value.end("{}");
});

test("Bun 1.3.14 node:https honors custom lookup while verifying the requested hostname", async () => {
  expect(Bun.version).toBe("1.3.14");
  expect(await probe("search.formerhuman.com", "search.formerhuman.com")).toBe(200);
  const peer = new X509Certificate(certificate).toLegacyObject();
  expect(checkServerIdentity("search.formerhuman.com", peer)).toBeUndefined();
  expect((checkServerIdentity("wrong.example", peer) as NodeJS.ErrnoException | undefined)?.code).toBe("ERR_TLS_CERT_ALTNAME_INVALID");
});
