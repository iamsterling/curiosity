import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/i,
]
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean)
const hits = []
for (const file of files) {
  if (file.endsWith(".lock")) continue
  let text
  try { text = readFileSync(file, "utf8") } catch { continue }
  text.split("\n").forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) hits.push(`${file}:${index + 1}`)
  })
}
if (hits.length) {
  console.error(`SECRET_SCAN_MATCHES\n${hits.join("\n")}`)
  process.exit(1)
}
console.log(`Secret scan passed (${files.length} workspace files; lockfiles excluded from pattern scan)`)
