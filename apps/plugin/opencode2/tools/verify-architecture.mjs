import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
const root=path.resolve(import.meta.dirname,"..")
const walk=async d=>(await Promise.all((await readdir(d,{withFileTypes:true})).map(async e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]))).flat()
const source=(await walk(path.join(root,"src"))).filter(p=>/\.(?:ts|mjs)$/.test(p))
let definitions=0
for(const file of source){const text=await readFile(file,"utf8"); definitions+=(text.match(/Plugin\.define/g)||[]).length
 if(file.includes("/features/")&&/opencode-loop|opencode_loop_goal_/.test(text)) throw new Error(`LEGACY_IDENTITY_IN_PRODUCT:${path.relative(root,file)}`)
 if(file.includes("/core/")&&!file.includes("/canonical/")&&/node:|@opencode-ai|process\.|setTimeout|setInterval/.test(text)) throw new Error(`CORE_HOST_IMPORT:${path.relative(root,file)}`)
 if(file.includes("/features/")&&!/index\.(?:ts|mjs)$/.test(file)){const own=file.split("/features/")[1].split("/")[0]; for(const m of text.matchAll(/from ["']\.\.\/([^"']+)/g)){if(!m[1].startsWith(own)&&!m[1].startsWith("../core")&&!m[1].startsWith("../plugin")&&!m[1].startsWith("../platform")&&!/^[^/]+\/index\.(?:js|mjs)$/.test(m[1])) throw new Error(`PRIVATE_FEATURE_IMPORT:${path.relative(root,file)}`)}}
}
assert.equal(definitions,1,"the sole Promise entrypoint must use Plugin.define exactly once")
const manifest=JSON.parse(await readFile(path.join(root,"assets/manifest.json"),"utf8")); const identities = manifest.assets.map((asset) => `${asset.kind}:${asset.id}`); assert.equal(new Set(identities).size, identities.length, "asset identities must be unique");
const manifested=new Set(manifest.assets.map(x=>x.sourcePath));
for(const file of (await walk(path.join(root,"assets"))).filter(p=>!p.endsWith("manifest.json"))) assert.ok(manifested.has(path.relative(root,file).replaceAll("\\","/")),`unmanifested ${file}`)
for(const asset of manifest.assets) for(const dep of asset.dependencies){const [kind,id]=dep.split(":"); assert.ok(manifest.assets.some(x=>x.kind===kind&&x.id===id),`missing ${dep}`)}
console.log(`Architecture verified: ${source.length} source files, ${manifest.assets.length} assets, Promise setup entrypoint`)
