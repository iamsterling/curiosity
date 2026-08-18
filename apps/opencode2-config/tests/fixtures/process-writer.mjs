import { acquireLease, releaseLease } from "../../dist/platform/persistence/atomic-store.js"

const [root, target] = process.argv.slice(2)
try {
  const lease = await acquireLease(root)
  await new Promise((resolve) => setTimeout(resolve, 100))
  await releaseLease(lease)
  process.stdout.write("entered\n")
} catch (error) {
  process.stdout.write(`${error.code ?? "ERROR"}\n`)
  process.exitCode = 1
}
