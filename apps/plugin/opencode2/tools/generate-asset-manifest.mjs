import { createHash } from "node:crypto"
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
const root = path.resolve(import.meta.dirname, "..")
const walk = async (dir) => (await Promise.all((await readdir(dir,{withFileTypes:true})).map(async e => e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat()
const files=(await walk(path.join(root,"assets"))).filter(p=>!p.endsWith("manifest.json")).sort()
const entries=[]
const compatibilityDispositions = {
 "loop":"native-tool:native_loop_start", "loop-goal":"native-tool:native_loop_start", "loop-now":"native-tool:native_loop_start",
 "loop-status":"native-tool:native_loop_status", "loop-goal-status":"native-tool:native_loop_status",
 "loop-pause":"native-tool:native_loop_pause", "loop-goal-pause":"native-tool:native_loop_pause",
 "loop-resume":"native-tool:native_loop_resume", "loop-goal-resume":"native-tool:native_loop_resume",
 "loop-stop":"native-tool:native_loop_stop",
 "loop-progress":"ledger-proposal:ledger_progress_propose", "loop-goal-blocked":"ledger-proposal:ledger_progress_propose",
 "loop-goal-done":"ledger-proposal:ledger_resolution_propose",
 "loop-compact":"manual-guidance:HOST_COMPACTION_CONTROL", "loop-help":"manual-guidance:NATIVE_TOOL_INVENTORY",
 "loop-doctor":"manual-guidance:PACKAGE_DOCTOR",
 "loop-shell":"unsupported:OPENCODE2_COMPAT_SHELL_UNSUPPORTED",
}
for(const file of files){
 const sourcePath=path.relative(root,file).replaceAll("\\","/"); const rel=sourcePath.slice(7); const [category,...rest]=rel.split("/");
 const ext=path.extname(file); let kind=category.slice(0,-1); let id=rest.join("/").replace(new RegExp(`${ext.replace('.','\\.')}$`),"")
 if(category==="skills") { if (rest.join("/") === `${rest[0]}/SKILL.md`) id=rest[0]; else { kind="skill-resource"; id=rest.join("/").replace(new RegExp(`${ext.replace('.','\\.')}$`),"") } } if(category==="config") kind="config"
 const text=await readFile(file); const dependencies=[]
 if(category==="commands") for(const match of text.toString().matchAll(/^skill:\s*([\w-]+)\s*$/gm)) dependencies.push(`skill:${match[1]}`)
 const compatibility=category==="commands"&&id.startsWith("loop")||id==="opencode-loop-local"
 const compatibilityDisposition=compatibilityDispositions[id] ?? (compatibility ? `unsupported:OPENCODE2_COMPAT_${id.toUpperCase().replaceAll("-","_")}_UNSUPPORTED` : undefined)
 entries.push({id,kind,sourcePath,installDestination:category,dependencies,owningFeature:compatibility?"loop-compat":id==="handoff-compiler"||id==="compile-handoff"?"handoff":"platform",status:compatibility?"compatibility-deprecated":"active",...(compatibilityDisposition?{compatibilityDisposition}:{}),digest:`sha256:${createHash("sha256").update(text).digest("hex")}`})
}
await writeFile(path.join(root,"assets/manifest.json"),JSON.stringify({schemaVersion:1,generatedReleaseDigest:`sha256:${createHash("sha256").update(JSON.stringify(entries)).digest("hex")}`,assets:entries},null,2)+"\n")
