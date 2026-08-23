#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

export const PLUGIN_VERIFICATION_PROFILE_PLANS = Object.freeze({
  linux: Object.freeze({ platform: "linux", commands: Object.freeze(["verify"]) }),
  darwin: Object.freeze({ platform: "darwin", architecture: "arm64", trusted: true, commands: Object.freeze(["verify", "test:real-host"]) }),
})

export const pluginVerificationProfilePlan = (profile, options = {}) => {
  const plan = PLUGIN_VERIFICATION_PROFILE_PLANS[profile]
  if (!plan) throw new Error(`PLUGIN_VERIFY_PROFILE_UNKNOWN:${profile}`)
  const platform = options.platform ?? process.platform
  const architecture = options.architecture ?? process.arch
  const trusted = options.trusted ?? process.env.CURIOSITY_TRUSTED_DARWIN_MANUAL === "1"
  if (profile === "linux") {
    if (platform !== "linux") throw new Error("PLUGIN_VERIFY_LINUX_REQUIRED")
    return plan.commands
  }
  if (platform !== "darwin" || architecture !== "arm64") throw new Error("PLUGIN_VERIFY_DARWIN_ARM64_REQUIRED")
  if (!trusted) throw new Error("PLUGIN_VERIFY_DARWIN_TRUSTED_MANUAL_REQUIRED")
  return plan.commands
}

export const assertPluginVerificationProfile = (profile, options = {}) => void pluginVerificationProfilePlan(profile, options)

const run = (script) => {
  const result = spawnSync("bun", ["run", script], { cwd: root, stdio: "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`PLUGIN_VERIFY_COMMAND_FAILED:${script}:${result.status}`)
}

export const verifyPluginProfile = (profile, options = {}, execute = run) => {
  const commands = pluginVerificationProfilePlan(profile, options)
  for (const command of commands) execute(command)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [profile, ...extra] = process.argv.slice(2)
  if (!profile || extra.length > 0) {
    console.error("usage: node tools/verification-profile.mjs <linux|darwin>")
    process.exitCode = 2
  } else {
    try {
      verifyPluginProfile(profile)
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  }
}
