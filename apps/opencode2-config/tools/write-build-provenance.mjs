import { writeFile } from "node:fs/promises"
import { buildProvenance } from "./provenance-manifest.mjs"

const provenance = await buildProvenance()
await writeFile(
  new URL("../dist/provenance.json", import.meta.url),
  `${JSON.stringify(provenance)}\n`,
)
