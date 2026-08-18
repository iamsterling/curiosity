import { readFile, stat } from "node:fs/promises"
import path from "node:path"

const isFile = async (file) => stat(file).then((value) => value.isFile(), () => false)

export const findWorkspaceRoot = async (start) => {
  let directory = path.resolve(start)
  while (true) {
    const packageFile = path.join(directory, "package.json")
    if (await isFile(packageFile) && await isFile(path.join(directory, "bun.lock"))) {
      const pkg = JSON.parse(await readFile(packageFile, "utf8"))
      if (pkg.workspaces) return directory
    }
    const parent = path.dirname(directory)
    if (parent === directory) throw new Error(`Unable to find Bun workspace root from ${start}`)
    directory = parent
  }
}
