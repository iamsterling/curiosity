#!/usr/bin/env node
import { spawn } from "node:child_process"

const child = spawn(process.execPath, ["--test", "tests/integration/release-candidate-install.test.mjs"], { stdio: "inherit" })
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exitCode = code ?? 1
})
