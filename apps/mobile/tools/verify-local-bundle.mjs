import { readdir, readFile } from "node:fs/promises";

const bundleRoot = new URL("../dist/_expo/static/js/ios/", import.meta.url);
const bundles = (await readdir(bundleRoot)).filter((file) =>
  file.endsWith(".hbc"),
);
if (bundles.length !== 1) throw new Error("MOBILE_LOCAL_BUNDLE_MISSING");

const bundle = await readFile(new URL(bundles[0], bundleRoot));
const forbidden = [
  "10.1.0.121",
  "EXPO_PUBLIC_CURIOSITY_URL",
  "/api/curiosity/chat",
  "SUPERVISOR_START_FAILED",
  "bun:sqlite",
  "node:crypto",
];
for (const value of forbidden)
  if (bundle.includes(Buffer.from(value)))
    throw new Error(`MOBILE_LOCAL_BUNDLE_FORBIDDEN:${value}`);

console.log("mobile local bundle excludes server and desktop authority paths");
