import path from "node:path"

import { verifyPreparedInputManifest } from "./prepared-input.mjs"

export const validationContainerArguments = ({ image, mode, preparedInput }) => {
  if (!new Set(["smoke", "stress"]).has(mode)) throw new Error("OPENCODE2_CONTAINER_MODE_INVALID")
  if (!path.isAbsolute(preparedInput)) throw new Error("OPENCODE2_CONTAINER_INPUT_INVALID")

  return [
    "run", "--rm", "--network", "none", "--read-only", "--init",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "256",
    "--workdir", "/tmp",
    "--mount", `type=bind,src=${preparedInput},dst=/input,readonly`,
    "--tmpfs", "/validation:rw,exec,nosuid,nodev,mode=1777,size=768m",
    "--tmpfs", "/tmp:rw,exec,nosuid,nodev,mode=1777,size=128m",
    image, "bun", "/input/validation-harness/validate.mjs", mode,
  ]
}

export const runVerifiedValidationContainer = async ({ execute, image, mode, preparedInput }) => {
  const args = validationContainerArguments({ image, mode, preparedInput })
  await verifyPreparedInputManifest(preparedInput)
  return execute(args)
}
