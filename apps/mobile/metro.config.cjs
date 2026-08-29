const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const craftyPackagesRoot = `${path.join(workspaceRoot, "vendor/crafty/packages")}${path.sep}`;
const authorityPackageRoot = `${path.join(workspaceRoot, "packages/curiosity-authority")}${path.sep}`;
const config = getDefaultConfig(projectRoot);

config.watchFolders = [...new Set([...(config.watchFolders ?? []), workspaceRoot])];
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, "ui"])];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const importsNodeNextSource =
    context.originModulePath.startsWith(craftyPackagesRoot) ||
    context.originModulePath.startsWith(authorityPackageRoot);
  const isNodeNextRelativeImport = moduleName.startsWith(".") && moduleName.endsWith(".js");

  if (importsNodeNextSource && isNodeNextRelativeImport) {
    return context.resolveRequest(context, moduleName.slice(0, -3), platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
