import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const name = `${pkg.name}-v${pkg.version}.zip`
const result = spawnSync("zip", ["-r", name, ".", "-x", "*.git*", "node_modules/*"], { stdio: "inherit" })
process.exit(result.status ?? 0)
