import { randomBytes } from "node:crypto"
import { spawn } from "node:child_process"
import { access, mkdir, readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import {
  DOCUMENTED_HOST_COMMAND_IDS,
  EXPECTED_AGENTS,
  EXPECTED_COMMAND_IDS,
  EXPECTED_DEFAULT_AGENT,
  EXPECTED_HOOKS,
  EXPECTED_PLUGIN_ID,
  EXPECTED_PLUGIN_VERSION,
  EXPECTED_SKILL_IDS,
  EXPECTED_TOOL_IDS,
  PRESERVED_OPERATOR_COMMAND_IDS,
} from "./validation-contract.mjs"

const failure = (code, detail) => {
  const suffix = detail === undefined ? "" : `:${JSON.stringify(detail)}`
  return new Error(`${code}${suffix}`)
}
const fail = (code, detail) => { throw failure(code, detail) }
const requireValue = (condition, code, detail) => {
  if (!condition) fail(code, detail)
}
const sorted = (values) => [...values].sort()
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const STARTUP_OUTPUT_MAX_BYTES = 8_192

const redactStartupOutput = (value, secrets) => {
  let redacted = value
  for (const secret of [...secrets].sort((left, right) => right.length - left.length)) {
    redacted = redacted.replaceAll(secret, "[REDACTED]")
    redacted = redacted.replaceAll(secret.slice(0, 8), "[REDACTED]").replaceAll(secret.slice(-8), "[REDACTED]")
  }
  return redacted
    .replace(/(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/gu, "[REDACTED]")
    .replace(/-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/gu, "[REDACTED]")
    .replace(/AKIA[0-9A-Z]{16}/gu, "[REDACTED]")
    .replace(/xox[baprs]-[A-Za-z0-9-]{10,}/gu, "[REDACTED]")
    .replace(/(?:Basic|Bearer)\s+[A-Za-z0-9+/=_-]{8,}/giu, "[REDACTED]")
    .replace(/((?:api[_-]?key|secret|token|password)\s*[:=]\s*)(?:"[^"\r\n]{8,}"|'[^'\r\n]{8,}'|[^\s,;]{8,})/giu, "$1[REDACTED]")
}

const appendStartupOutput = (output, chunk, secrets) => {
  const sanitized = Buffer.from(redactStartupOutput(Buffer.from(chunk).toString("utf8"), secrets))
  const combined = Buffer.concat([...output, sanitized])
  output.baseURL ??= combined.toString("utf8").match(/server listening on (http:\/\/127\.0\.0\.1:\d+)/u)?.[1]
  if (combined.length > STARTUP_OUTPUT_MAX_BYTES) output.truncated = true
  output.splice(0, output.length, combined.subarray(Math.max(0, combined.length - STARTUP_OUTPUT_MAX_BYTES)))
}

const startupOutputDetail = (output, secrets) => {
  const sanitized = Buffer.from(redactStartupOutput(Buffer.concat(output).toString("utf8"), secrets))
  const truncated = output.truncated === true || sanitized.length > STARTUP_OUTPUT_MAX_BYTES
  return {
    output: sanitized.subarray(Math.max(0, sanitized.length - STARTUP_OUTPUT_MAX_BYTES)).toString("utf8"),
    ...(truncated ? { truncated: true } : {}),
  }
}

const waitFor = async (operation, code, timeout = 15_000) => {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try {
      const value = await operation()
      if (value !== undefined) return value
    } catch (error) {
      lastError = error
    }
    await delay(50)
  }
  if (lastError) throw lastError
  fail(code)
}

const processGroupMembersFromPS = (groupID) => new Promise((resolve, reject) => {
  const child = spawn("ps", ["-axo", "pid=,pgid="], { stdio: ["ignore", "pipe", "pipe"] })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    if (code !== 0) reject(failure("CONTAINER_HOST_PROCESS_INSPECTION_FAILED", Buffer.concat(stderr).toString("utf8")))
    else resolve(Buffer.concat(stdout).toString("utf8").trim().split("\n").map((line) => line.trim().split(/\s+/u).map(Number))
      .filter(([, processGroup]) => processGroup === groupID).map(([pid]) => pid).sort((left, right) => left - right))
  })
})

const processGroupMembers = async (groupID) => {
  const members = []
  const entries = await readdir("/proc", { withFileTypes: true }).catch((error) => error.code === "ENOENT" ? undefined : Promise.reject(error))
  if (entries === undefined) return processGroupMembersFromPS(groupID)
  for (const entry of entries.filter((item) => item.isDirectory() && /^\d+$/u.test(item.name))) {
    const stat = await readFile(path.join("/proc", entry.name, "stat"), "utf8").catch(() => "")
    const fields = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/u)
    if (fields[2] === String(groupID)) members.push(Number(entry.name))
  }
  return members.sort((left, right) => left - right)
}

const signalProcessGroup = (groupID, signal) => {
  try {
    process.kill(-groupID, signal)
  } catch (error) {
    if (error.code !== "ESRCH") throw error
  }
}

const waitForTermination = async ({ closed, groupID, timeout }) => {
  const deadline = Date.now() + timeout
  let survivors = await processGroupMembers(groupID)
  while ((!closed() || survivors.length > 0) && Date.now() < deadline) {
    await delay(50)
    survivors = await processGroupMembers(groupID)
  }
  return { reaped: closed(), stopped: closed() && survivors.length === 0, survivors }
}

const terminate = async (child) => {
  let closed = child.exitCode !== null || child.signalCode !== null
  const reaped = closed ? Promise.resolve() : new Promise((resolve) => child.once("close", () => {
    closed = true
    resolve()
  }))
  if (!Number.isSafeInteger(child.pid)) {
    await reaped
    return { survivors: [] }
  }
  signalProcessGroup(child.pid, "SIGTERM")
  const graceful = await waitForTermination({ closed: () => closed, groupID: child.pid, timeout: 10_000 })
  if (graceful.stopped) return { survivors: [] }
  signalProcessGroup(child.pid, "SIGKILL")
  const forced = await waitForTermination({ closed: () => closed, groupID: child.pid, timeout: 2_000 })
  if (!forced.stopped) fail("CONTAINER_HOST_PROCESS_SURVIVORS", { reaped: forced.reaped, survivors: forced.survivors })
  fail("CONTAINER_HOST_CLEAN_SHUTDOWN_FAILED")
}

const registration = (id, registrations, disposals) => {
  registrations.push(id)
  return { dispose: async () => disposals.push(id) }
}

export const validateInstalledPluginSetup = async ({ directory, pluginEntry, hostVersion }) => {
  await mkdir(directory, { recursive: true })
  const plugin = (await import(pathToFileURL(pluginEntry).href)).default
  requireValue(typeof plugin?.setup === "function", "SETUP_INSTRUMENTATION_ENTRYPOINT_INVALID")
  const agents = new Map()
  const definitions = []
  const registrations = []
  const disposals = []
  let eventSubscriptions = 0
  const context = {
    app: { name: "opencode2", version: hostVersion, channel: "beta" },
    options: { directory },
    agent: {
      transform: async (callback) => {
        callback({
          default: (id) => agents.set("default", id),
          get: () => ({}),
          remove: (id) => agents.delete(id),
          update: (id, update) => {
            const agent = { id, name: id, request: { settings: {}, headers: {}, body: {} }, mode: "primary", hidden: false, permissions: [] }
            update(agent)
            agents.set(id, agent)
          },
        })
        return registration("agent:transform", registrations, disposals)
      },
    },
    session: {
      hook: async (id) => registration(`session:${id}`, registrations, disposals),
      prompt: async () => fail("SETUP_INSTRUMENTATION_UNEXPECTED_PROMPT"),
      interrupt: async () => fail("SETUP_INSTRUMENTATION_UNEXPECTED_INTERRUPT"),
    },
    tool: {
      hook: async (id) => registration(`tool:${id}`, registrations, disposals),
      transform: async (callback) => {
        callback({ add: (definition) => definitions.push(definition) })
        return registration("tool:transform", registrations, disposals)
      },
    },
    event: {
      subscribe: ({ signal }) => {
        eventSubscriptions += 1
        return { async *[Symbol.asyncIterator]() {
          await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }))
        } }
      },
    },
  }
  let cleanup
  try {
    cleanup = await plugin.setup(context)
    const ids = definitions.map(({ name }) => name)
    requireValue(new Set(ids).size === ids.length, "SETUP_INSTRUMENTATION_TOOL_DUPLICATE", ids)
    requireValue(JSON.stringify(sorted(ids)) === JSON.stringify(EXPECTED_TOOL_IDS), "SETUP_INSTRUMENTATION_TOOL_IDS_MISMATCH", {
      actual: sorted(ids),
      expected: EXPECTED_TOOL_IDS,
    })
    for (const definition of definitions) {
      requireValue(typeof definition.description === "string" && definition.description.length > 0, "SETUP_INSTRUMENTATION_TOOL_DESCRIPTION_INVALID", definition.name)
      requireValue(typeof definition.execute === "function", "SETUP_INSTRUMENTATION_TOOL_EXECUTOR_MISSING", definition.name)
      requireValue(
        definition.input?.type === "object" &&
          definition.input?.properties && typeof definition.input.properties === "object" &&
          Array.isArray(definition.input?.required) && definition.input?.additionalProperties === false,
        "SETUP_INSTRUMENTATION_TOOL_SCHEMA_INVALID",
        definition.name,
      )
    }
    const hooks = registrations.filter((id) => id.startsWith("session:") || id.startsWith("tool:execute.")).sort()
    requireValue(JSON.stringify(hooks) === JSON.stringify(EXPECTED_HOOKS), "SETUP_INSTRUMENTATION_HOOK_SURFACE_MISMATCH", hooks)
    requireValue(eventSubscriptions === 1, "SETUP_INSTRUMENTATION_EVENT_SUBSCRIPTION_MISMATCH", eventSubscriptions)
    requireValue(agents.get("default") === EXPECTED_DEFAULT_AGENT, "SETUP_INSTRUMENTATION_DEFAULT_AGENT_MISMATCH", agents.get("default"))

    const approval = definitions.find(({ name }) => name === "ledger_approval_status")
    const approvalResult = await approval.execute({}, { sessionID: "setup-validation" })
    requireValue(
      JSON.stringify(JSON.parse(approvalResult.content)) === JSON.stringify({ authority: "bounded-root-input", confirmationViaTool: false }),
      "SETUP_INSTRUMENTATION_SAFE_EXECUTOR_MISMATCH",
    )
    const loopStatus = definitions.find(({ name }) => name === "native_loop_status")
    let loopDiagnostic
    try {
      await loopStatus.execute({}, { sessionID: "setup-validation" })
      fail("SETUP_INSTRUMENTATION_EMPTY_LOOP_UNEXPECTEDLY_PRESENT")
    } catch (error) {
      loopDiagnostic = error.code
    }
    requireValue(loopDiagnostic === "LOOP_NOT_STARTED", "SETUP_INSTRUMENTATION_LOOP_STATUS_DIAGNOSTIC_MISMATCH", loopDiagnostic)
    return {
      evidence: "installed-plugin setup instrumentation (not a host HTTP tool catalog)",
      tools: { count: ids.length, ids: sorted(ids), unique: true, objectSchemas: ids.length, executors: ids.length },
      hooks: { registered: hooks, eventSubscriptions },
      defaultAgent: agents.get("default"),
      safeExecutors: { ledger_approval_status: "passed", native_loop_status: "LOOP_NOT_STARTED" },
    }
  } finally {
    if (cleanup) {
      await cleanup()
      requireValue(
        JSON.stringify(disposals) === JSON.stringify(["tool:transform", "tool:execute.after", "tool:execute.before", "session:context"]),
        "SETUP_INSTRUMENTATION_CLEANUP_MISMATCH",
        disposals,
      )
    }
  }
}

const waitForHostListening = (child, output, secrets) => new Promise((resolve, reject) => {
  let settled = false
  const finish = (operation, value) => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    child.stdout.off("data", inspect)
    child.stderr.off("data", inspect)
    child.off("close", onClose)
    operation(value)
  }
  const inspect = () => {
    const baseURL = output.baseURL ?? Buffer.concat(output).toString("utf8").match(/server listening on (http:\/\/127\.0\.0\.1:\d+)/u)?.[1]
    if (baseURL) finish(resolve, baseURL)
  }
  const onClose = (code) => finish(reject, failure("CONTAINER_HOST_EARLY_EXIT", { code, ...startupOutputDetail(output, secrets) }))
  const onError = (error) => finish(reject, failure("CONTAINER_HOST_START_ERROR", { code: error.code, message: error.message }))
  const timeout = setTimeout(() => {
    const detail = startupOutputDetail(output, secrets)
    finish(reject, failure("CONTAINER_HOST_START_TIMEOUT", detail.output.length > 0 || detail.truncated ? detail : undefined))
  }, 15_000)
  child.stdout.on("data", inspect)
  child.stderr.on("data", inspect)
  child.once("close", onClose)
  child.once("error", onError)
  inspect()
})

const startHost = async ({ env, host, project }) => {
  const password = randomBytes(24).toString("base64url")
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`
  const output = []
  const hostEnv = { ...env, OPENCODE_PASSWORD: password }
  const secrets = [...new Set([
    password,
    `opencode:${password}`,
    authorization,
    ...Object.entries(hostEnv)
      .filter(([name, value]) => /(?:api[_-]?key|authorization|credential|password|secret|token)/iu.test(name) && typeof value === "string" && value.length >= 8)
      .map(([, value]) => value),
  ])]
  const child = spawn(host, ["serve", "--hostname", "127.0.0.1", "--port", "0", "--log-level", "all"], {
    cwd: project,
    env: hostEnv,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.stdout.on("data", (chunk) => appendStartupOutput(output, chunk, secrets))
  child.stderr.on("data", (chunk) => appendStartupOutput(output, chunk, secrets))
  try {
    const baseURL = await waitForHostListening(child, output, secrets)
    return { authorization, baseURL, child, output }
  } catch (error) {
    try {
      await terminate(child)
    } catch (cleanupError) {
      error.message = `${error.message}:cleanup:${JSON.stringify(cleanupError.message)}`
      error.cleanupError = cleanupError
    }
    throw error
  }
}

const api = async ({ authorization, baseURL }, { body, location, method = "GET", pathname, status = 200 }) => {
  const url = new URL(pathname, baseURL)
  if (location) url.searchParams.set("location[directory]", location)
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Authorization: authorization,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    method,
    signal: AbortSignal.timeout(5_000),
  })
  const text = await response.text()
  requireValue(response.status === status, "CONTAINER_HOST_HTTP_STATUS", { method, pathname, status: response.status, expected: status, body: text })
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    fail("CONTAINER_HOST_HTTP_JSON_INVALID", { pathname, text })
  }
}

const list = async (host, pathname, location) => {
  const payload = await api(host, { location, pathname })
  requireValue(Array.isArray(payload?.data), "CONTAINER_HOST_CATALOG_INVALID", pathname)
  return payload.data
}

const assertUniqueIDs = (items, field, code) => {
  const ids = items.map((item) => item?.[field])
  requireValue(ids.every((id) => typeof id === "string" && id.length > 0), code, ids)
  requireValue(new Set(ids).size === ids.length, `${code}_DUPLICATE`, ids)
  return ids
}

const validateCatalogs = async ({ configRoot, host, packageSpec, project }) => {
  const pluginReads = []
  for (let attempt = 0; attempt < 3; attempt += 1) pluginReads.push(await list(host, "/api/plugin", project))
  for (const inventory of pluginReads) {
    const ids = assertUniqueIDs(inventory, "id", "CONTAINER_HOST_PLUGIN_ID_INVALID")
    requireValue(ids.filter((id) => id === EXPECTED_PLUGIN_ID).length === 1, "CONTAINER_HOST_PLUGIN_COUNT_MISMATCH", ids)
  }
  requireValue(pluginReads.every((value) => JSON.stringify(value) === JSON.stringify(pluginReads[0])), "CONTAINER_HOST_PLUGIN_READ_UNSTABLE", pluginReads)

  const agentCatalog = await list(host, "/api/agent", project)
  const agentIDs = assertUniqueIDs(agentCatalog, "id", "CONTAINER_HOST_AGENT_ID_INVALID")
  for (const [id, expected] of Object.entries(EXPECTED_AGENTS)) {
    const matches = agentCatalog.filter((agent) => agent.id === id)
    requireValue(matches.length === 1, "CONTAINER_HOST_AGENT_COUNT_MISMATCH", { id, count: matches.length, agentIDs })
    const agent = matches[0]
    requireValue(agent.mode === expected.mode, "CONTAINER_HOST_AGENT_MODE_MISMATCH", { id, actual: agent.mode, expected: expected.mode })
    requireValue(Array.isArray(agent.permissions), "CONTAINER_HOST_AGENT_PERMISSIONS_INVALID", id)
    for (const action of ["web_search", "formerhuman_search"]) {
      const rules = agent.permissions.filter((rule) => rule.action === action && rule.resource === "*")
      requireValue(rules.length === 1 && rules[0].effect === expected.search, "CONTAINER_HOST_AGENT_SEARCH_PERMISSION_MISMATCH", {
        action,
        actual: rules,
        expected: expected.search,
        id,
      })
    }
  }

  const commandCatalog = await list(host, "/api/command", project)
  const commandIDs = assertUniqueIDs(commandCatalog, "name", "CONTAINER_HOST_COMMAND_ID_INVALID")
  for (const id of EXPECTED_COMMAND_IDS) requireValue(commandIDs.filter((value) => value === id).length === 1, "CONTAINER_HOST_COMMAND_MISSING", { commandIDs, id })
  const commandExtras = commandIDs.filter((id) => !EXPECTED_COMMAND_IDS.includes(id))
  requireValue(
    commandExtras.every((id) => DOCUMENTED_HOST_COMMAND_IDS.includes(id) || PRESERVED_OPERATOR_COMMAND_IDS.includes(id)),
    "CONTAINER_HOST_COMMAND_UNDOCUMENTED_EXTRA",
    commandExtras,
  )

  const skillCatalog = await list(host, "/api/skill", project)
  const skillIDs = assertUniqueIDs(skillCatalog, "id", "CONTAINER_HOST_SKILL_ID_INVALID")
  for (const id of EXPECTED_SKILL_IDS) {
    const matches = skillCatalog.filter((skill) => skill.id === id)
    requireValue(matches.length === 1, "CONTAINER_HOST_SKILL_COUNT_MISMATCH", { id, count: matches.length })
    const skill = matches[0]
    const normalizedLocation = String(skill.location).replace(/^file:\/\//u, "")
    requireValue(
      normalizedLocation === path.join(configRoot, "skills", id, "SKILL.md"),
      "CONTAINER_HOST_SKILL_LOCATION_MISMATCH",
      { actual: skill.location, expected: path.join(configRoot, "skills", id, "SKILL.md"), id },
    )
    requireValue(typeof skill.name === "string" && skill.name.length > 0, "CONTAINER_HOST_SKILL_METADATA_INVALID", { id, name: skill.name })
    requireValue(
      typeof skill.content === "string" && skill.content.trim().length > 0,
      "CONTAINER_HOST_SKILL_CONTENT_INVALID",
      { contentType: typeof skill.content, id },
    )
  }

  const config = await api(host, { location: project, pathname: "/api/config" })
  requireValue(Array.isArray(config) && config.length > 0, "CONTAINER_HOST_CONFIG_UNHEALTHY", config)
  requireValue(config.some((entry) => entry.type === "directory" && entry.path === configRoot), "CONTAINER_HOST_CONFIG_ROOT_MISSING", config)
  const documents = config.filter((entry) => entry.type === "document").map((entry) => entry.info)
  requireValue(
    documents.some((info) => Array.isArray(info?.plugins) && info.plugins.includes(packageSpec)),
    "CONTAINER_HOST_CONFIG_PLUGIN_DIRECTIVE_MISSING",
    documents,
  )
  const endpointDefaults = documents.map((info) => info?.default_agent).filter((value) => value !== undefined)
  requireValue(endpointDefaults.every((value) => value === EXPECTED_DEFAULT_AGENT), "CONTAINER_HOST_CONFIG_DEFAULT_AGENT_MISMATCH", endpointDefaults)
  return {
    agents: { count: Object.keys(EXPECTED_AGENTS).length, ids: sorted(Object.keys(EXPECTED_AGENTS)), hostCatalogCount: agentCatalog.length },
    commands: {
      hostBuiltIns: sorted(commandExtras.filter((id) => DOCUMENTED_HOST_COMMAND_IDS.includes(id))),
      hostCatalogCount: commandCatalog.length,
      pluginCount: EXPECTED_COMMAND_IDS.length,
      preservedOperatorCommands: sorted(commandExtras.filter((id) => PRESERVED_OPERATOR_COMMAND_IDS.includes(id))),
    },
    config: { endpointDefaultAgent: endpointDefaults.at(-1) ?? null, healthy: true },
    plugins: { id: EXPECTED_PLUGIN_ID, count: 1, stableReads: pluginReads.length },
    skills: { pluginCount: EXPECTED_SKILL_IDS.length, hostBuiltIns: sorted(skillIDs.filter((id) => !EXPECTED_SKILL_IDS.includes(id))), hostCatalogCount: skillCatalog.length },
  }
}

const readCapture = async (project) => {
  const directory = path.join(project, ".opencode", "opencode2-config", "capture", "v1", "events")
  const names = await readdir(directory).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error))
  return Promise.all(names.sort().map(async (name) => JSON.parse(await readFile(path.join(directory, name), "utf8"))))
}

const exerciseLocalEvents = async ({ host, project }) => {
  const created = await api(host, {
    body: { location: { directory: project }, title: "container functional event validation" },
    method: "POST",
    pathname: "/api/session",
  })
  const sessionID = created?.data?.id
  requireValue(typeof sessionID === "string" && sessionID.startsWith("ses"), "CONTAINER_HOST_SESSION_CREATE_INVALID", created)
  await api(host, {
    body: { metadata: { source: "container-functional-validation" }, resume: false, text: "deterministic synthetic event" },
    method: "POST",
    pathname: `/api/session/${sessionID}/synthetic`,
  })
  await api(host, {
    body: { command: "printf opencode2-container-local-event" },
    method: "POST",
    pathname: `/api/session/${sessionID}/shell`,
    status: 204,
  })
  return { runtimeDefaultAgent: created.data.agent ?? null, sessionID }
}

const activeProfile = async ({ configRoot, env, host: executable, hostVersion, packageSpec, project }) => {
  const host = await startHost({ env, host: executable, project })
  try {
    const catalogs = await waitFor(() => validateCatalogs({ configRoot, host, packageSpec, project }), "CONTAINER_HOST_CATALOG_TIMEOUT", 30_000)
    const activity = await exerciseLocalEvents({ host, project })
    const events = await waitFor(async () => {
      const current = await readCapture(project)
      return current.some((event) => event.sessionID === activity.sessionID) ? current : undefined
    }, "CONTAINER_HOST_EVENT_CAPTURE_MISSING")
    for (const event of events) {
      requireValue(event.pluginVersion === EXPECTED_PLUGIN_VERSION, "CONTAINER_HOST_CAPTURE_PLUGIN_VERSION_MISMATCH", event)
      requireValue(event.hostVersion === hostVersion, "CONTAINER_HOST_CAPTURE_HOST_VERSION_MISMATCH", event)
      requireValue(event.sourceKind === "host", "CONTAINER_HOST_CAPTURE_SOURCE_MISMATCH", event)
    }
    if (activity.runtimeDefaultAgent !== null) {
      requireValue(activity.runtimeDefaultAgent === EXPECTED_DEFAULT_AGENT, "CONTAINER_HOST_RUNTIME_DEFAULT_AGENT_MISMATCH", activity.runtimeDefaultAgent)
    }
    return {
      ...catalogs,
      config: { ...catalogs.config, runtimeDefaultAgent: activity.runtimeDefaultAgent, setupInstrumentationDefault: EXPECTED_DEFAULT_AGENT },
      events: {
        count: events.length,
        hostVersion,
        pluginVersion: EXPECTED_PLUGIN_VERSION,
        sessionBound: events.filter((event) => event.sessionID === activity.sessionID).length,
        sourceKinds: sorted(new Set(events.map((event) => event.sourceKind))),
        types: sorted(new Set(events.map((event) => event.type))),
      },
    }
  } finally {
    await terminate(host.child)
  }
}

const disabledProfile = async ({ env, host: executable, project }) => {
  const host = await startHost({
    env: { ...env, OPENCODE_CONFIG_CONTENT: JSON.stringify({ plugins: [`-${EXPECTED_PLUGIN_ID}`] }) },
    host: executable,
    project,
  })
  try {
    const plugins = await list(host, "/api/plugin", project)
    const agents = await list(host, "/api/agent", project)
    const commands = await list(host, "/api/command", project)
    const skills = await list(host, "/api/skill", project)
    requireValue(plugins.filter(({ id }) => id === EXPECTED_PLUGIN_ID).length === 0, "CONTAINER_DISABLED_PLUGIN_PRESENT", plugins)
    const customAgents = agents.filter(({ id }) => Object.hasOwn(EXPECTED_AGENTS, id))
    requireValue(customAgents.length === 0, "CONTAINER_DISABLED_CUSTOM_AGENT_PRESENT", customAgents)
    await exerciseLocalEvents({ host, project })
    await delay(500)
    const captures = await readCapture(project)
    requireValue(captures.length === 0, "CONTAINER_DISABLED_CAPTURE_PRESENT", captures)
    return {
      captures: 0,
      customAgents: 0,
      pluginRegistrations: 0,
      staticCommandsRemaining: commands.filter(({ name }) => EXPECTED_COMMAND_IDS.includes(name)).length,
      staticSkillsRemaining: skills.filter(({ id }) => EXPECTED_SKILL_IDS.includes(id)).length,
    }
  } finally {
    await terminate(host.child)
  }
}

export const validateFunctionalHost = async ({ configRoot, disabled, enabled, host, hostVersion, packageSpec }) => {
  await access(host)
  const version = await new Promise((resolve, reject) => {
    const child = spawn(host, ["--version"], { cwd: enabled.project, env: enabled.env, stdio: ["ignore", "pipe", "pipe"] })
    const stdout = []
    const stderr = []
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
    child.once("error", reject)
    child.once("close", (code) => resolve({ code, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8") }))
  })
  requireValue(version.code === 0 && version.stdout.trim() === `opencode2 v${hostVersion}`, "CONTAINER_PINNED_HOST_VERSION_MISMATCH", version)
  const active = await activeProfile({ configRoot, ...enabled, host, hostVersion, packageSpec })
  const negativeControl = await disabledProfile({ ...disabled, host })
  return { active, hostVersion, negativeControl }
}

export const validateColdResolverDenial = async ({ env, host: executable, project, resolutionAttempted }) => {
  const host = await startHost({ env, host: executable, project })
  try {
    const { agents, plugins } = await waitFor(async () => {
      const plugins = await list(host, "/api/plugin", project)
      const agents = await list(host, "/api/agent", project)
      return resolutionAttempted() ? { agents, plugins } : undefined
    }, "CONTAINER_COLD_DENIAL_RESOLUTION_NOT_ATTEMPTED", 30_000)
    const positivePlugins = plugins.filter(({ id }) => id === EXPECTED_PLUGIN_ID)
    const positiveAgents = agents.filter(({ id }) => Object.hasOwn(EXPECTED_AGENTS, id))
    requireValue(positivePlugins.length === 0, "CONTAINER_COLD_DENIAL_PLUGIN_PRESENT", positivePlugins)
    requireValue(positiveAgents.length === 0, "CONTAINER_COLD_DENIAL_AGENT_PRESENT", positiveAgents)
    return { customAgents: 0, pluginRegistrations: 0 }
  } finally {
    await terminate(host.child)
  }
}
