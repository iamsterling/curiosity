import { access } from "node:fs/promises"

const credentialPaths = ["/run/secrets/git_token", "/run/secrets/git_known_hosts", "/run/ssh-agent"]
const credentialEnvironment = ["GIT_ASKPASS", "GIT_SSH_COMMAND", "OPENCODE2_GIT_TOKEN", "OPENCODE2_GIT_TOKEN_FILE", "OPENCODE2_GIT_URL", "SSH_AUTH_SOCK"]

for (const name of credentialEnvironment) {
  if (process.env[name]) throw new Error("CANDIDATE_CREDENTIAL_ENVIRONMENT_PRESENT")
}
for (const target of credentialPaths) {
  if (await access(target).then(() => true).catch(() => false)) throw new Error("CANDIDATE_CREDENTIAL_PATH_PRESENT")
}

console.log(JSON.stringify({ credentialFiles: false, credentialEnvironment: false, sshAgent: false }))
