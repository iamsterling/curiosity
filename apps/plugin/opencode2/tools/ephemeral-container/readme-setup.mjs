const fail = (code, detail) => {
  const suffix = detail === undefined ? "" : `:${JSON.stringify(detail)}`
  throw new Error(`${code}${suffix}`)
}

const parseJsonc = (value) => {
  const withoutComments = value.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:])\/\/.*$/gmu, "$1")
  return JSON.parse(withoutComments.replace(/,\s*([}\]])/gu, "$1"))
}

const shellArgv = (value) => {
  const command = value.trim()
  if (!command || command.includes("\n") || /[;&|`$<>\\]/u.test(command)) fail("OPENCODE2_README_INSTALLER_COMMAND_UNSAFE")
  const argv = command.split(/\s+/u)
  if (argv.some((argument) => !/^[A-Za-z0-9@._/:=-]+$/u.test(argument))) fail("OPENCODE2_README_INSTALLER_ARG_INVALID")
  return argv
}

export const extractReadmeSetup = (readme, expectedPackageSpec) => {
  const sections = [...readme.matchAll(/<!-- registry-setup:start -->([\s\S]*?)<!-- registry-setup:end -->/gu)]
  if (sections.length !== 1) fail("OPENCODE2_README_SETUP_SECTION_COUNT_INVALID", sections.length)
  const source = sections[0][1]
  const blocks = [...source.matchAll(/```(jsonc|sh)\n([\s\S]*?)```/gu)]
  if (JSON.stringify(blocks.map((match) => match[1])) !== JSON.stringify(["jsonc", "sh", "sh"])) {
    fail("OPENCODE2_README_SETUP_BLOCKS_INVALID")
  }
  const configText = blocks[0][2]
  const config = parseJsonc(configText)
  if (JSON.stringify(config) !== JSON.stringify({ $schema: "https://opencode.ai/config.json", plugins: [expectedPackageSpec] })) {
    fail("OPENCODE2_README_CONFIG_INVALID")
  }
  const installerArgv = shellArgv(blocks[1][2])
  if (JSON.stringify(installerArgv) !== JSON.stringify(["bunx", "--bun", expectedPackageSpec])) fail("OPENCODE2_README_INSTALLER_INVALID")
  const verificationArgv = shellArgv(blocks[2][2])
  if (JSON.stringify(verificationArgv) !== JSON.stringify(["opencode2", "plugin", "list"])) fail("OPENCODE2_README_VERIFICATION_INVALID")
  if (/@latest|\blatest\b/u.test(source)) fail("OPENCODE2_README_LATEST_FORBIDDEN")
  return { config, configText, installerArgv, packageSpec: expectedPackageSpec, verificationArgv }
}
