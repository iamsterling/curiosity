import { appendFile, open } from "node:fs/promises"
import net from "node:net"
import { spawn } from "node:child_process"

const [mode, target, secret] = process.argv.slice(2)
if (mode === "network") {
  const destination = new URL(target)
  const socket = net.connect(Number(destination.port), destination.hostname)
  socket.on("connect", () => process.exit(0))
  socket.on("error", () => process.exit(1))
} else if (mode === "proxy") {
  fetch(target).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))
} else if (mode === "outside-write") {
  open(target, "w").then((file) => file.close().then(() => process.exit(0))).catch(() => process.exit(1))
} else if (mode === "inside-write") {
  open(target, "w").then((file) => file.close().then(() => process.exit(0))).catch(() => process.exit(1))
} else if (mode === "secret-file") {
  appendFile(target, secret).then(() => process.exit(0))
} else if (mode === "secret-output") {
  process.stdout.write(secret)
} else if (mode === "detached-child") {
  const child = spawn(process.execPath, ["-e", `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(target)}, 'late'), 100)`], { detached: true, stdio: "ignore" })
  child.once("error", () => process.exit(1))
  child.once("spawn", () => { child.unref(); process.exit(0) })
}
