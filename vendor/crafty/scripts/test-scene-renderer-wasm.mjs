import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd().endsWith(`${path.sep}scene-renderer`) ? path.resolve(process.cwd(), "../..") : path.resolve(process.cwd());
const manifest = path.join(root, "packages/scene-renderer/rust/Cargo.toml");
// Keep test and release builds on the same tool-resolution contract. CI and
// hermetic wrappers may still provide CARGO explicitly.
const cargo = process.env.CARGO ?? "cargo";
const result = spawnSync(cargo, ["test", "--manifest-path", manifest], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
