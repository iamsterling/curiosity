import { createServer } from "node:http"
import { appendFile, readFile } from "node:fs/promises"
import path from "node:path"

const fail = (code, detail) => {
  const suffix = detail === undefined ? "" : `:${JSON.stringify(detail)}`
  throw new Error(`${code}${suffix}`)
}

const json = (response, status, value, head) => {
  const body = Buffer.from(`${JSON.stringify(value)}\n`)
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-length": body.length,
    "content-type": "application/json",
  })
  response.end(head ? undefined : body)
}

export const startLoopbackRegistry = async ({ catalogPath, inputRoot, logPath }) => {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"))
  if (catalog?.schemaVersion !== 1 || catalog.allowlistOnly !== true || catalog.noProxy !== true || !Array.isArray(catalog.packages)) {
    fail("OPENCODE2_REGISTRY_CATALOG_INVALID")
  }
  const packages = new Map()
  const tarballs = new Map()
  for (const record of catalog.packages) {
    const identity = `${record.name}@${record.version}`
    if (packages.has(identity) || tarballs.has(record.filename)) fail("OPENCODE2_REGISTRY_CATALOG_DUPLICATE", identity)
    packages.set(identity, record)
    tarballs.set(record.filename, record)
  }
  let phase = "startup"
  let sequence = 0
  let withholdProduct = false
  const records = []
  const recordRequest = async (entry) => {
    const complete = { sequence: ++sequence, phase, ...entry }
    records.push(complete)
    await appendFile(logPath, `${JSON.stringify(complete)}\n`, { encoding: "utf8", mode: 0o600 })
  }

  let origin
  const server = createServer(async (request, response) => {
    try {
      const method = request.method ?? ""
      const head = method === "HEAD"
      const url = new URL(request.url ?? "/", origin)
      if (method !== "GET" && !head) {
        await recordRequest({ kind: "denied", method, path: url.pathname, status: 405 })
        json(response, 405, { error: "method_not_allowed" }, head)
        return
      }
      if (url.pathname.startsWith("/__tarballs/")) {
        const filename = decodeURIComponent(url.pathname.slice("/__tarballs/".length))
        const packageRecord = tarballs.get(filename)
        const withheld = withholdProduct && packageRecord?.kind === "product"
        if (!packageRecord || withheld) {
          await recordRequest({
            kind: withheld ? "withheld-product-tarball" : "denied",
            method,
            path: url.pathname,
            ...(packageRecord ? { name: packageRecord.name, version: packageRecord.version } : {}),
            status: 404,
          })
          json(response, 404, { error: "not_found" }, head)
          return
        }
        const body = await readFile(path.join(inputRoot, "registry", "tarballs", filename))
        await recordRequest({ kind: "tarball", method, name: packageRecord.name, path: url.pathname, status: 200, version: packageRecord.version })
        response.writeHead(200, {
          "cache-control": "no-store",
          "content-length": body.length,
          "content-type": "application/octet-stream",
        })
        response.end(head ? undefined : body)
        return
      }
      let name
      try {
        name = decodeURIComponent(url.pathname.slice(1))
      } catch {
        name = ""
      }
      const versions = [...packages.values()].filter((record) => record.name === name)
      if (versions.length === 0) {
        await recordRequest({ kind: "denied", method, path: url.pathname, status: 404 })
        json(response, 404, { error: "not_found" }, head)
        return
      }
      const versionEntries = Object.fromEntries(versions.map((record) => [record.version, {
        ...record.manifest,
        dist: {
          integrity: record.archive.integrity,
          shasum: record.archive.sha1,
          tarball: `${origin}/__tarballs/${encodeURIComponent(record.filename)}`,
        },
      }]))
      await recordRequest({ kind: "packument", method, name, path: url.pathname, status: 200, versions: versions.map(({ version }) => version).sort() })
      json(response, 200, { name, "dist-tags": {}, versions: versionEntries }, head)
    } catch (error) {
      await recordRequest({ kind: "server-error", method: request.method ?? "", path: request.url ?? "", status: 500 }).catch(() => undefined)
      json(response, 500, { error: "registry_failure" }, false)
    }
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  if (typeof address !== "object" || address === null || address.address !== "127.0.0.1") fail("OPENCODE2_REGISTRY_LISTEN_INVALID")
  origin = `http://127.0.0.1:${address.port}`
  return {
    catalog,
    close: async () => {
      server.close()
      server.closeAllConnections()
    },
    origin,
    records,
    setPhase: (nextPhase, options = {}) => {
      if (!/^[a-z][a-z0-9-]{0,31}$/u.test(nextPhase)) fail("OPENCODE2_REGISTRY_PHASE_INVALID")
      phase = nextPhase
      withholdProduct = options.withholdProduct === true
    },
  }
}
