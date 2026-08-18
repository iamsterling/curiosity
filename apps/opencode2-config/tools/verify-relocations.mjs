import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
const root=new URL("../",import.meta.url); const map=JSON.parse(await readFile(new URL("docs/provenance/relocations.json",root),"utf8")); const historical=JSON.parse(await readFile(new URL("provenance/manifests/generic-consolidation-2026-08-11.json",root),"utf8"));
const expected=new Set(historical.entries.filter((item)=>["imported","adapted"].includes(item.treatment)&&item.destinationPath&&(/^(?:agents|commands|config|skills|scripts|test)\//.test(item.destinationPath)||["src/index.js","src/loop-state.mjs"].includes(item.destinationPath))).map((item)=>item.destinationPath));
const seen=new Set(); for(const item of map.mappings){assert.ok(!seen.has(item.historicalPath)); seen.add(item.historicalPath); if(item.currentPath){const digest=`sha256:${createHash("sha256").update(await readFile(new URL(item.currentPath,root))).digest("hex")}`; assert.equal(digest,item.currentDigest,item.currentPath)}else{assert.match(item.disposition,/deleted-from-product/)}}
assert.deepEqual([...seen].sort(),[...expected].sort(),"every relocated historical authored path must be mapped"); console.log(`Provenance relocation verified: ${map.mappings.length} mappings`)
