import assert from "node:assert/strict";
import ts from "typescript";

export const REQUIRED_PLUGIN_VERIFICATION_PROFILE_PLANS = Object.freeze({
  linux: Object.freeze({ platform: "linux", commands: Object.freeze(["verify"]) }),
  darwin: Object.freeze({ platform: "darwin", architecture: "arm64", trusted: true, commands: Object.freeze(["verify", "test:real-host"]) }),
});

const EXPECTED_PROFILE_PLAN = `(profile, options = {}) => {
  const plan = PLUGIN_VERIFICATION_PROFILE_PLANS[profile]
  if (!plan) throw new Error(\`PLUGIN_VERIFY_PROFILE_UNKNOWN:\${profile}\`)
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
}`;

const EXPECTED_VERIFY_PROFILE = `(profile, options = {}, execute = run) => {
  const commands = pluginVerificationProfilePlan(profile, options)
  for (const command of commands) execute(command)
}`;

const EXPECTED_CLI = `if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
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
}`;

const EXPECTED_MODULE = `
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
export const PLUGIN_VERIFICATION_PROFILE_PLANS = Object.freeze({
  linux: Object.freeze({ platform: "linux", commands: Object.freeze(["verify"]) }),
  darwin: Object.freeze({ platform: "darwin", architecture: "arm64", trusted: true, commands: Object.freeze(["verify", "test:real-host"]) }),
})
export const pluginVerificationProfilePlan = ${EXPECTED_PROFILE_PLAN}
export const assertPluginVerificationProfile = (profile, options = {}) => void pluginVerificationProfilePlan(profile, options)
const run = (script) => {
  const result = spawnSync("bun", ["run", script], { cwd: root, stdio: "inherit" })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(\`PLUGIN_VERIFY_COMMAND_FAILED:\${script}:\${result.status}\`)
}
export const verifyPluginProfile = ${EXPECTED_VERIFY_PROFILE}
${EXPECTED_CLI}
`;

const fail = (detail) => { throw new Error(`VERIFICATION_PLUGIN_PROFILE_CONTRACT:${detail}`); };
const parse = (source) => ts.createSourceFile("verification-profile.mjs", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const declaration = (sourceFile, name) => sourceFile.statements
  .filter(ts.isVariableStatement)
  .flatMap(({ declarationList }) => [...declarationList.declarations])
  .find(({ name: declarationName }) => ts.isIdentifier(declarationName) && declarationName.text === name);
const unwrapFreeze = (expression) => {
  if (!ts.isCallExpression(expression) || expression.arguments.length !== 1) return expression;
  const callee = expression.expression;
  return ts.isPropertyAccessExpression(callee)
    && ts.isIdentifier(callee.expression)
    && callee.expression.text === "Object"
    && callee.name.text === "freeze"
    ? unwrapFreeze(expression.arguments[0])
    : expression;
};
const staticValue = (expression) => {
  const value = unwrapFreeze(expression);
  if (ts.isStringLiteral(value)) return value.text;
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (value.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(value)) return value.elements.map(staticValue);
  if (!ts.isObjectLiteralExpression(value)) fail("profile-plan-nonliteral");
  return Object.fromEntries(value.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) fail("profile-plan-property");
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : fail("profile-plan-key");
    return [name, staticValue(property.initializer)];
  }));
};
const syntaxSignature = (node, sourceFile) => [
  node.kind,
  ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node)
    || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isNumericLiteral(node) ? node.text : undefined,
  node.getChildren(sourceFile).map((child) => syntaxSignature(child, sourceFile)),
];
const expectedExpression = (source) => {
  const sourceFile = parse(`const expected = ${source};`);
  return { sourceFile, node: declaration(sourceFile, "expected").initializer };
};
const expectedStatement = (source) => {
  const sourceFile = parse(source);
  return { sourceFile, node: sourceFile.statements[0] };
};
const sameSyntax = (actual, actualFile, expected) => {
  try { assert.deepEqual(syntaxSignature(actual, actualFile), syntaxSignature(expected.node, expected.sourceFile)); }
  catch { return false; }
  return true;
};

export const verifyPluginProfileContract = ({ source, scripts }) => {
  const sourceFile = parse(source);
  const expectedModule = parse(EXPECTED_MODULE);
  if (!sameSyntax(sourceFile, sourceFile, { sourceFile: expectedModule, node: expectedModule })) fail("module-entrypoint");
  const plans = declaration(sourceFile, "PLUGIN_VERIFICATION_PROFILE_PLANS")?.initializer;
  if (!plans) fail("profile-plan-missing");
  try { assert.deepEqual(staticValue(plans), REQUIRED_PLUGIN_VERIFICATION_PROFILE_PLANS); }
  catch { fail("profile-plan-mismatch"); }

  const planFunction = declaration(sourceFile, "pluginVerificationProfilePlan")?.initializer;
  const verifyFunction = declaration(sourceFile, "verifyPluginProfile")?.initializer;
  if (!planFunction || !sameSyntax(planFunction, sourceFile, expectedExpression(EXPECTED_PROFILE_PLAN))) fail("profile-plan-entrypoint");
  if (!verifyFunction || !sameSyntax(verifyFunction, sourceFile, expectedExpression(EXPECTED_VERIFY_PROFILE))) fail("profile-executor-entrypoint");
  const direct = sourceFile.statements.find(ts.isIfStatement);
  if (!direct || !sameSyntax(direct, sourceFile, expectedStatement(EXPECTED_CLI))) fail("cli-entrypoint");

  if (scripts["verify:linux"] !== "node tools/verification-profile.mjs linux") fail("linux-script");
  if (scripts["verify:darwin"] !== "node tools/verification-profile.mjs darwin") fail("darwin-script");
  return true;
};
