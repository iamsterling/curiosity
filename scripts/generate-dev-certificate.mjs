import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const certificateDirectory = path.join(root, "apps/web/editor/certificates");
const caKey = path.join(certificateDirectory, "crafty-dev-ca-key.pem");
const caCertificate = path.join(certificateDirectory, "crafty-dev-ca.pem");
const caCertificateDer = path.join(certificateDirectory, "crafty-dev-ca.cer");
const serverKey = path.join(certificateDirectory, "crafty-dev-key.pem");
const serverCertificate = path.join(certificateDirectory, "crafty-dev-cert.pem");
const request = path.join(certificateDirectory, "crafty-dev.csr");
const serial = path.join(certificateDirectory, "crafty-dev-ca.srl");
const extensions = path.join(certificateDirectory, "crafty-dev-ext.cnf");

mkdirSync(certificateDirectory, { recursive: true });

const run = (args) => {
  const result = spawnSync("openssl", args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const isTailscaleAddress = (address) => {
  const octets = address.split(".").map(Number);
  return octets.length === 4 && octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127;
};

const interfaces = Object.values(os.networkInterfaces())
  .flatMap((items) => items ?? [])
  .filter((item) => item.family === "IPv4" && !item.internal)
  .map((item) => item.address);

const tailscaleAddresses = interfaces.filter(isTailscaleAddress);
// Prefer the tailnet address when there is one; fall back to the machine's
// own addresses so environments without a Tailscale interface (the compose
// dev container, a host with no tailnet) still get a usable certificate
// instead of a hard stop. Loud, because a cert that covers less than the
// tailnet is a silent regression for the iPad flow.
const addresses = tailscaleAddresses.length > 0 ? tailscaleAddresses : interfaces;
if (addresses.length === 0) {
  process.stdout.write("No IPv4 addresses found; signing for localhost only.\n");
}
const names = ["DNS:localhost", "IP:127.0.0.1", ...addresses.map((address) => `IP:${address}`)];

// Idempotent leaf: read the SANs of the existing certificate (if any) and
// only re-sign when the desired names are not already covered. The compose
// dev container and the host share this certificates directory — without the
// check, whichever starts last re-signs the leaf with its own SAN set and
// silently breaks the other's (a container boot would drop the tailnet
// address from the host's certificate). Names accumulate rather than shrink:
// a re-sign always keeps the existing SANs.
const existingNames = (() => {
  const result = spawnSync("openssl", ["x509", "-in", serverCertificate, "-noout", "-ext", "subjectAltName"], { cwd: root });
  if (result.status !== 0) return [];
  return result.stdout
    .toString()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("X509v3"))
    .join(", ")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith("DNS:") || entry.startsWith("IP Address:"))
    .map((entry) => entry.replaceAll("IP Address:", "IP:"));
})();
const covered = (wanted) => wanted.every((name) => existingNames.includes(name));
if (covered(names)) {
  process.stdout.write(`Development certificate is current (${existingNames.join(", ")}).\n`);
} else {
  const allNames = [...new Set([...existingNames, ...names])];
  writeFileSync(extensions, `subjectAltName=${allNames.join(",")}\n`);

  if (!existsSync(caKey) || !existsSync(caCertificate)) run(["req", "-x509", "-new", "-nodes", "-newkey", "rsa:2048", "-keyout", caKey, "-out", caCertificate, "-days", "825", "-subj", "/CN=Crafty Development CA"]);
  run(["req", "-new", "-nodes", "-newkey", "rsa:2048", "-keyout", serverKey, "-out", request, "-subj", "/CN=Crafty Development"]);
  run(["x509", "-req", "-in", request, "-CA", caCertificate, "-CAkey", caKey, "-CAcreateserial", "-CAserial", serial, "-out", serverCertificate, "-days", "825", "-sha256", "-extfile", extensions]);
  if (!existsSync(caCertificateDer)) run(["x509", "-in", caCertificate, "-outform", "der", "-out", caCertificateDer]);
  process.stdout.write(`Generated Crafty development certificates for ${allNames.filter((name) => !name.startsWith("DNS:localhost") && name !== "IP:127.0.0.1").map((name) => name.replace("IP:", "")).join(", ") || "localhost"}.\n`);
}
