#!/usr/bin/env node
import { lookup } from "node:dns/promises"
import { connect } from "node:tls"
import { executeWebSearch, SEARCH_API_ENDPOINT } from "../dist/features/search/index.js"

const host = "search.formerhuman.com"
const token = process.env.OPENCODE2_SEARCH_TOKEN
if (!token) throw new Error("SEARCH_SMOKE_TOKEN_MISSING")

const addresses = await lookup(host, { all: true })
console.log(`dns: ok (${addresses.length} address records)`)

const certificate = await new Promise((resolve, reject) => {
  const socket = connect({ host, port: 443, servername: host, rejectUnauthorized: true }, () => {
    const peer = socket.getPeerCertificate()
    socket.end()
    resolve(peer)
  })
  socket.once("error", reject)
})
console.log(`tls: ok (subject=${certificate.subject?.CN ?? "unknown"}, validTo=${certificate.valid_to})`)

const redirect = await fetch(`http://${host}/`, { redirect: "manual" })
if (redirect.status < 300 || redirect.status >= 400 || !redirect.headers.get("location")?.startsWith(`https://${host}`))
  throw new Error("SEARCH_SMOKE_HTTPS_REDIRECT_FAILED")
console.log(`http-redirect: ok (${redirect.status})`)

const health = await fetch(`https://${host}/healthz`)
if (!health.ok) throw new Error(`SEARCH_SMOKE_HEALTH_FAILED:${health.status}`)
console.log(`health: ok (${health.status})`)

const rejected = await fetch(SEARCH_API_ENDPOINT, {
  method: "POST",
  redirect: "manual",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "OpenCode V2", maxResults: 1 }),
})
if (rejected.status !== 401 && rejected.status !== 403) throw new Error(`SEARCH_SMOKE_UNAUTHENTICATED_NOT_REJECTED:${rejected.status}`)
console.log(`unauthenticated-agent: rejected (${rejected.status})`)

const result = await executeWebSearch({ query: process.env.SEARCH_SMOKE_QUERY ?? "OpenCode V2", maxResults: 2 }, { token })
const payload = JSON.parse(result.content)
console.log(`authenticated-agent: ok (results=${payload.results.length}, partialFailures=${payload.partialFailures.length})`)

const cors = rejected.headers.get("access-control-allow-origin")
if (cors === "*") throw new Error("SEARCH_SMOKE_BROAD_CORS")
console.log(`cors: ${cors ? "narrow" : "absent"}`)
