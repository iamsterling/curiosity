import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOG = path.join(ROOT, "docs/status/capabilities.json");
const SDK_ACCEPTANCE_RECEIPT = "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-r4-acceptance-receipt.json";
const UNSAFE_REPOSITORY_PATHS = [
  "/etc/hosts",
  "../etc/hosts",
  "apps//runtime/file.ts",
  "apps/./runtime/file.ts",
  "apps/runtime/../plugin/file.ts",
  "apps/runtime/",
  "apps\\runtime\\file.ts",
  "\\\\server\\share\\file.ts",
  "C:\\Windows\\system.ini",
  "C:/Windows/system.ini",
  "https://example.invalid/file.ts",
  "file:///etc/hosts",
  "apps/%2e%2e/%2fetc/hosts",
  "apps%5cruntime%5c..%5chosts",
  "apps/%252e%252e/file.ts",
  "apps/runtime/\0file.ts",
  "docs/cafe\u0301.md",
];
const implementation = () => import("./status-model.mjs");
const catalog = async () => JSON.parse(await readFile(CATALOG, "utf8"));

const rejectsWith = async (operation, code) => {
  await assert.rejects(operation, (error) => {
    assert.match(String(error?.message), new RegExp(`^${code}(?:$|:)`, "u"));
    return true;
  });
};

const invalidCatalog = async (mutate, code) => {
  const { validateCatalog } = await implementation();
  const value = await catalog();
  mutate(value);
  assert.throws(() => validateCatalog(value), new RegExp(`^${code}(?:$|:)`, "u"));
};

const validCatalog = async (mutate) => {
  const { validateCatalog } = await implementation();
  const value = await catalog();
  mutate(value);
  assert.equal(validateCatalog(value), value);
};

const overlay = (base, changes, historicalChanges = {}) => ({
  assertPath: (relative) => base.assertPath(relative),
  exists: async (relative) => {
    base.assertPath(relative);
    return relative in changes ? changes[relative] !== null : base.exists(relative);
  },
  read: async (relative) => {
    base.assertPath(relative);
    if (relative in changes) {
      if (changes[relative] === null) {
        const error = new Error(`ENOENT: ${relative}`);
        error.code = "ENOENT";
        throw error;
      }
      return changes[relative];
    }
    return base.read(relative);
  },
  listFiles: async (relative) => {
    base.assertPath(relative);
    const files = new Set(await base.listFiles(relative));
    for (const [file, value] of Object.entries(changes)) {
      base.assertPath(file);
      if (file === relative || file.startsWith(`${relative}/`)) value === null ? files.delete(file) : files.add(file);
    }
    return [...files].sort();
  },
  historicalIdentity: async (relative) => {
    base.assertPath(relative);
    const historicalChange = historicalChanges[relative] ?? {};
    const identity = { ...(await base.historicalIdentity(relative)), ...historicalChange };
    if (!(relative in changes)) return identity;
    if (Object.hasOwn(historicalChange, "worktreeChanged")) return identity;
    const changed = changes[relative];
    if (changed === null) return { ...identity, worktreeChanged: true };
    const original = await base.read(relative);
    const normalized = (value) => value.replaceAll("\r\n", "\n");
    return { ...identity, worktreeChanged: normalized(changed) !== normalized(original) };
  },
});

test("root README is Curiosity-authored and contains canonical status markers", async () => {
  const readme = await readFile(path.join(ROOT, "README.md"), "utf8");
  assert.doesNotMatch(readme, /Turborepo starter|create-turbo/u);
  for (const marker of ["workspace", "status"])
    assert.match(readme, new RegExp(`<!-- status:${marker}:(?:start|end) -->`, "gu"));
});

test("schema validation rejects missing fields and invalid enums", async (context) => {
  await context.test("required owner", () => invalidCatalog((value) => delete value.capabilities[0].owners, "STATUS_REQUIRED"));
  await context.test("status enum", () => invalidCatalog((value) => (value.capabilities[0].status = "Ready"), "STATUS_ENUM"));
  await context.test("additional capability property", () =>
    invalidCatalog((value) => (value.capabilities[0].publicationClaim = true), "STATUS_SCHEMA"));
  await context.test("bad environment array element", () =>
    invalidCatalog((value) => value.capabilities[0].scope.environments.push("prod-ish"), "STATUS_SCHEMA"));
  await context.test("bad reference kind enum", () =>
    invalidCatalog((value) => (value.capabilities[0].evidence.refs[0].kind = "proof"), "STATUS_ENUM"));
  await context.test("schema independently rejects unsafe reference and guard paths", async () => {
    const Ajv2020 = (await import("ajv/dist/2020.js")).default;
    const schema = JSON.parse(await readFile(path.join(ROOT, "docs/status/schema.json"), "utf8"));
    const validate = new Ajv2020({ strict: true }).compile(schema);
    for (const unsafe of UNSAFE_REPOSITORY_PATHS) {
      const value = await catalog();
      value.capabilities[0].evidence.refs[0].ref = `${unsafe}#localhost`;
      assert.equal(validate(value), false, `reference:${unsafe}`);
    }
    const guardValue = await catalog();
    guardValue.capabilities[0].guards[0].path = "apps/./runtime.ts";
    assert.equal(validate(guardValue), false, "guard:apps/./runtime.ts");
    const fragmentValue = await catalog();
    fragmentValue.capabilities[0].evidence.refs[0].ref =
      "apps/plugin/opencode2/tests/unit/plugin-entrypoint.test.mjs#---";
    assert.equal(validate(fragmentValue), false, "punctuation-only fragment");
  });
});

test("repository evidence paths are confined and normalized", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  for (const unsafe of UNSAFE_REPOSITORY_PATHS)
    await context.test(`semantic reference rejection: ${JSON.stringify(unsafe)}`, () =>
      invalidCatalog((value) => {
        value.capabilities[0].evidence.refs[0].ref = `${unsafe}#reviewer probe`;
      }, "STATUS_PATH_INVALID"));
  await context.test("semantic guard rejection", () =>
    invalidCatalog((value) => {
      value.capabilities[0].guards[0].path = "/etc/hosts";
    }, "STATUS_PATH_INVALID"));
  await context.test("verifier rejects an absolute reference before host access", async () => {
    const value = await catalog();
    value.capabilities[0].evidence.refs[0].ref = "/etc/hosts#localhost";
    await rejectsWith(() => verifySourceContracts(value, createFileRepository(ROOT)), "STATUS_PATH_INVALID");
  });
  await context.test("test overlay rejects unsafe virtual paths before access", async () => {
    const repository = overlay(createFileRepository(ROOT), { "/etc/hosts": "virtual host bytes\n" });
    await rejectsWith(() => repository.read("/etc/hosts"), "STATUS_PATH_INVALID");
  });
  await context.test("filesystem adapter rejects symlink escape and non-regular targets", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "curiosity-status-path-"));
    try {
      await mkdir(path.join(fixture, "nested"));
      await mkdir(path.join(fixture, "outside"));
      await writeFile(path.join(fixture, "outside", "evidence.txt"), "outside evidence\n");
      await symlink("/etc/hosts", path.join(fixture, "nested", "escape"));
      await symlink(path.join(fixture, "outside"), path.join(fixture, "nested", "escape-parent"));
      const repository = createFileRepository(fixture);
      await rejectsWith(() => repository.read("nested/escape"), "STATUS_PATH_SYMLINK");
      await rejectsWith(() => repository.read("nested/escape-parent/evidence.txt"), "STATUS_PATH_SYMLINK");
      await rejectsWith(() => repository.read("nested"), "STATUS_PATH_NOT_REGULAR");
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
  await context.test("filesystem adapter accepts a valid nested regular file", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "curiosity-status-path-"));
    try {
      await mkdir(path.join(fixture, "nested", "deeper"), { recursive: true });
      await writeFile(path.join(fixture, "nested", "deeper", "evidence.txt"), "bounded evidence\n");
      const repository = createFileRepository(fixture);
      assert.equal(await repository.read("nested/deeper/evidence.txt"), "bounded evidence\n");
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  });
});

test("recursive discovery fails closed on unexpected symlinks", async (context) => {
  const { createFileRepository } = await implementation();
  const fixture = await mkdtemp(path.join(os.tmpdir(), "curiosity-status-discovery-"));
  try {
    await mkdir(path.join(fixture, "scan", "nested"), { recursive: true });
    await mkdir(path.join(fixture, "outside"));
    await writeFile(path.join(fixture, "outside", "outside.txt"), "outside\n");
    await writeFile(path.join(fixture, "scan", "nested", "inside.txt"), "inside\n");
    const repository = createFileRepository(fixture);
    await context.test("outside-root symlink", async () => {
      const link = path.join(fixture, "scan", "outside-link");
      await symlink(path.join(fixture, "outside", "outside.txt"), link);
      try {
        await rejectsWith(() => repository.listFiles("scan"), "STATUS_PATH_SYMLINK");
      } finally {
        await unlink(link);
      }
    });
    await context.test("in-root symlink", async () => {
      const link = path.join(fixture, "scan", "inside-link");
      await symlink(path.join(fixture, "scan", "nested", "inside.txt"), link);
      try {
        await rejectsWith(() => repository.listFiles("scan"), "STATUS_PATH_SYMLINK");
      } finally {
        await unlink(link);
      }
    });
    await context.test("explicit ignored directory remains untraversed", async () => {
      await mkdir(path.join(fixture, "scan", "node_modules"));
      await symlink(path.join(fixture, "outside", "outside.txt"), path.join(fixture, "scan", "node_modules", "ignored-link"));
      assert.deepEqual(await repository.listFiles("scan"), ["scan/nested/inside.txt"]);
    });
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("generated writes are root-confined atomic replacements", async (context) => {
  const { noFollowFlag, writeGeneratedOutputs } = await implementation();
  const outputs = () => new Map([
    ["README.md", "new readme\n"],
    ["docs/status/current.md", "new current\n"],
  ]);
  const fixture = async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "curiosity-status-write-"));
    await mkdir(path.join(root, "docs", "status"), { recursive: true });
    await writeFile(path.join(root, "README.md"), "old readme\n", { mode: 0o644 });
    await writeFile(path.join(root, "docs", "status", "current.md"), "old current\n", { mode: 0o644 });
    return root;
  };
  await context.test("exact allowlist only", async () => {
    const root = await fixture();
    try {
      const changed = outputs();
      changed.set("docs/status/extra.md", "extra\n");
      await rejectsWith(() => writeGeneratedOutputs(changed, root), "STATUS_GENERATED_WRITE_ALLOWLIST");
      assert.equal(await readFile(path.join(root, "README.md"), "utf8"), "old readme\n");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("missing allowlisted output is rejected", async () => {
    const root = await fixture();
    try {
      const changed = outputs();
      changed.delete("README.md");
      await rejectsWith(() => writeGeneratedOutputs(changed, root), "STATUS_GENERATED_WRITE_ALLOWLIST");
      assert.equal(await readFile(path.join(root, "README.md"), "utf8"), "old readme\n");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("symlinked root cannot modify target bytes", async () => {
    const root = await fixture();
    const link = `${root}-link`;
    try {
      await symlink(root, link);
      await rejectsWith(() => writeGeneratedOutputs(outputs(), link), "STATUS_GENERATED_WRITE_SYMLINK");
      assert.equal(await readFile(path.join(root, "README.md"), "utf8"), "old readme\n");
    } finally {
      await rm(link, { force: true });
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("target symlink cannot modify external bytes", async () => {
    const root = await fixture();
    const external = path.join(path.dirname(root), `${path.basename(root)}-external.md`);
    try {
      await writeFile(external, "external target\n");
      await unlink(path.join(root, "README.md"));
      await symlink(external, path.join(root, "README.md"));
      await rejectsWith(() => writeGeneratedOutputs(outputs(), root), "STATUS_GENERATED_WRITE_SYMLINK");
      assert.equal(await readFile(external, "utf8"), "external target\n");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(external, { force: true });
    }
  });
  await context.test("parent symlink cannot modify external bytes", async () => {
    const root = await fixture();
    const external = await mkdtemp(path.join(os.tmpdir(), "curiosity-status-write-external-"));
    try {
      await mkdir(path.join(external, "status"));
      await writeFile(path.join(external, "status", "current.md"), "external parent target\n");
      await rm(path.join(root, "docs"), { recursive: true });
      await symlink(external, path.join(root, "docs"));
      await rejectsWith(() => writeGeneratedOutputs(outputs(), root), "STATUS_GENERATED_WRITE_SYMLINK");
      assert.equal(await readFile(path.join(external, "status", "current.md"), "utf8"), "external parent target\n");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(external, { recursive: true, force: true });
    }
  });
  await context.test("non-directory parent is rejected", async () => {
    const root = await fixture();
    try {
      await rm(path.join(root, "docs"), { recursive: true });
      await writeFile(path.join(root, "docs"), "not a directory\n");
      await rejectsWith(() => writeGeneratedOutputs(outputs(), root), "STATUS_GENERATED_WRITE_PARENT");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("non-regular target is rejected", async () => {
    const root = await fixture();
    try {
      await unlink(path.join(root, "README.md"));
      await mkdir(path.join(root, "README.md"));
      await rejectsWith(() => writeGeneratedOutputs(outputs(), root), "STATUS_GENERATED_WRITE_TARGET");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("successful replacement is bounded and leaves no temp", async () => {
    const root = await fixture();
    try {
      await writeGeneratedOutputs(outputs(), root);
      assert.equal(await readFile(path.join(root, "README.md"), "utf8"), "new readme\n");
      assert.equal(await readFile(path.join(root, "docs", "status", "current.md"), "utf8"), "new current\n");
      assert.equal((await stat(path.join(root, "README.md"))).mode & 0o777, 0o644);
      assert.deepEqual((await readdir(root)).filter((name) => name.includes(".status-write-")), []);
      assert.deepEqual((await readdir(path.join(root, "docs", "status"))).filter((name) => name.includes(".status-write-")), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("rename fault cleans exclusive temp", async () => {
    const root = await fixture();
    try {
      await rejectsWith(() => writeGeneratedOutputs(outputs(), root, {
        rename: async () => {
          const error = new Error("injected rename fault");
          error.code = "EIO";
          throw error;
        },
      }), "STATUS_GENERATED_WRITE");
      assert.deepEqual((await readdir(root)).filter((name) => name.includes(".status-write-")), []);
      assert.deepEqual((await readdir(path.join(root, "docs", "status"))).filter((name) => name.includes(".status-write-")), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  await context.test("O_NOFOLLOW portability fallback is explicit", () => {
    assert.equal(noFollowFlag({}), 0);
    assert.equal(noFollowFlag({ O_NOFOLLOW: 0x20000 }), 0x20000);
  });
});

test("closed Wave 1 inventory rejects omissions, duplicates, and unknown IDs", async (context) => {
  for (const id of ["plugin-authoritative-writes", "runtime-sdk-v2", "retired-daemon", "retired-marker-agent"])
    await context.test(`omitted ${id}`, () =>
      invalidCatalog((value) => (value.capabilities = value.capabilities.filter((item) => item.id !== id)), "STATUS_CAPABILITY_INVENTORY"));
  await context.test("duplicate", () =>
    invalidCatalog((value) => value.capabilities.push(structuredClone(value.capabilities[0])), "STATUS_DUPLICATE_ID"));
  await context.test("unknown replacement", () =>
    invalidCatalog((value) => (value.capabilities[0].id = "unreviewed-capability"), "STATUS_CAPABILITY_INVENTORY"));
});

test("capability guards must bind to that record's declared evidence", () =>
  invalidCatalog((value) => {
    const unrelated = value.capabilities.find(({ id }) => id === "starter-scaffolds").guards[0];
    value.capabilities[0].guards = [structuredClone(unrelated)];
  }, "STATUS_GUARD_UNBOUND"));

test("unknown observations cannot be enabled", () =>
  invalidCatalog((value) => {
    value.capabilities[0].observation.state = "unknown";
    value.capabilities[0].availability.state = "enabled";
  }, "STATUS_UNKNOWN_ENABLED"));

test("Current requires sufficient evidence and authority", async (context) => {
  await context.test("missing evidence", () =>
    invalidCatalog((value) => (value.capabilities[0].evidence.state = "missing"), "STATUS_CURRENT_EVIDENCE"));
  await context.test("contradictory evidence", () =>
    invalidCatalog((value) => (value.capabilities[0].evidence.state = "contradictory"), "STATUS_CURRENT_EVIDENCE"));
  await context.test("unauthorized authority", () =>
    invalidCatalog((value) => (value.capabilities[0].authority.state = "unauthorized"), "STATUS_CURRENT_AUTHORITY"));
});

test("consequential contradictions and missing authority fail closed", async (context) => {
  const experimental = (value) => value.capabilities.find(({ id }) => id === "plugin-search-surface");
  for (const authority of ["unknown", "forbidden", "unauthorized"])
    await context.test(`Experimental authority ${authority}`, () =>
      invalidCatalog((value) => (experimental(value).authority.state = authority), "STATUS_FAIL_CLOSED"));
  await context.test("Experimental contradictory evidence", () =>
    invalidCatalog((value) => (experimental(value).evidence.state = "contradictory"), "STATUS_FAIL_CLOSED"));
  await context.test("Experimental contradictory qualification", () =>
    invalidCatalog((value) => (experimental(value).qualification.state = "contradictory"), "STATUS_FAIL_CLOSED"));
  await context.test("Retired contradictory evidence", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "retired-daemon");
      item.evidence.state = "contradictory";
    }, "STATUS_FAIL_CLOSED"));
  await context.test("platform qualification missing", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-private-runtime-search");
      item.qualification.state = "unknown";
      item.qualification.platforms = [];
    }, "STATUS_FAIL_CLOSED"));
  await context.test("implemented but unauthorized Deferred remains representable", () =>
    validCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-engineering-intent");
      item.authority.state = "unauthorized";
      item.status = "Deferred";
      item.availability.state = "disabled";
      item.availability.environments = [];
      item.verdict = { decision: "NO-GO", rationaleCode: "fail-closed-deferred" };
    }));
  await context.test("missing platform qualification remains orthogonal when Deferred", () =>
    validCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-private-runtime-search");
      item.qualification.state = "unknown";
      item.qualification.platforms = [];
      item.status = "Deferred";
      item.availability.state = "disabled";
      item.availability.environments = [];
      item.verdict = { decision: "NO-GO", rationaleCode: "fail-closed-deferred" };
    }));
});

test("availability is scope-qualified and consequential unknowns fail closed", async (context) => {
  const first = (value) => value.capabilities.find(({ id }) => id === "plugin-identity-config");
  await context.test("availability environment outside scope", () =>
    invalidCatalog((value) => first(value).availability.environments.push("test"), "STATUS_AVAILABILITY_SCOPE"));
  await context.test("production enabled outside production scope", () =>
    invalidCatalog((value) => (first(value).availability.production = "enabled"), "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
  await context.test("production scope without production availability", () =>
    invalidCatalog((value) => {
      const item = first(value);
      item.scope.environments.push("production");
      item.availability.production = "enabled";
    }, "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
  await context.test("production scope with disabled production flag", () =>
    invalidCatalog((value) => {
      first(value).scope.environments.push("production");
    }, "STATUS_WAVE1_PRODUCTION_ENVIRONMENT"));
  await context.test("production availability with disabled production flag", () =>
    invalidCatalog((value) => {
      first(value).availability.environments.push("production");
    }, "STATUS_WAVE1_PRODUCTION_ENVIRONMENT"));
  await context.test("enabled availability cannot be nowhere", () =>
    invalidCatalog((value) => {
      first(value).availability.environments = [];
    }, "STATUS_AVAILABILITY_ENV_REQUIRED"));
  await context.test("conditional availability cannot be nowhere", () =>
    invalidCatalog((value) => {
      value.capabilities.find(({ id }) => id === "plugin-search-surface").availability.environments = [];
    }, "STATUS_AVAILABILITY_ENV_REQUIRED"));
  await context.test("observation-only availability cannot be nowhere", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-hooks-event-capture");
      item.availability.state = "observation-only";
      item.availability.environments = [];
    }, "STATUS_AVAILABILITY_ENV_REQUIRED"));
  await context.test("observation-only availability is active in declared non-production scope", () =>
    validCatalog((value) => {
      value.capabilities.find(({ id }) => id === "plugin-hooks-event-capture").availability.state = "observation-only";
    }));
  await context.test("disabled availability cannot name an environment", () =>
    invalidCatalog((value) => {
      value.capabilities.find(({ id }) => id === "runtime-unified-evidence").availability.environments = ["test"];
    }, "STATUS_DISABLED_AVAILABILITY_ENVIRONMENT"));
  await context.test("absent availability cannot name an environment", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "retired-daemon");
      item.availability.state = "absent";
      item.availability.environments = ["test"];
    }, "STATUS_DISABLED_AVAILABILITY_ENVIRONMENT"));
  await context.test("absent availability is valid only nowhere", () =>
    validCatalog((value) => {
      value.capabilities.find(({ id }) => id === "retired-daemon").availability.state = "absent";
    }));
  for (const [facet, state] of [["evidence", "partial"], ["authority", "limited"], ["qualification", "conditional"]])
    await context.test(`production enabled with ${facet} ${state}`, () =>
      invalidCatalog((value) => {
        const item = first(value);
        item.scope.environments.push("production");
        item.availability.environments.push("production");
        item.availability.production = "enabled";
        item[facet].state = state;
      }, "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
  await context.test("generic repository refs cannot promote production", () =>
    invalidCatalog((value) => {
      const item = first(value);
      item.scope.environments.push("production");
      item.availability.environments.push("production");
      item.availability.production = "enabled";
    }, "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
  await context.test("deployment enabled outside production scope", () =>
    invalidCatalog((value) => (first(value).availability.deployment = "enabled"), "STATUS_WAVE1_DEPLOYMENT_FORBIDDEN"));
  for (const [facet, state] of [["evidence", "partial"], ["authority", "limited"], ["qualification", "conditional"]])
    await context.test(`deployment enabled with ${facet} ${state}`, () =>
      invalidCatalog((value) => {
        const item = first(value);
        item.scope.environments.push("production");
        item.availability.environments.push("production");
        item.availability.deployment = "enabled";
        item[facet].state = state;
      }, "STATUS_WAVE1_DEPLOYMENT_FORBIDDEN"));
  await context.test("Experimental deployment cannot be enabled", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-search-surface");
      item.scope.environments.push("production");
      item.availability.environments.push("production");
      item.availability.deployment = "enabled";
    }, "STATUS_WAVE1_DEPLOYMENT_FORBIDDEN"));
  await context.test("generic repository refs cannot promote deployment", () =>
    invalidCatalog((value) => {
      const item = first(value);
      item.scope.environments.push("production");
      item.availability.environments.push("production");
      item.availability.deployment = "enabled";
    }, "STATUS_WAVE1_DEPLOYMENT_FORBIDDEN"));
  for (const [id, field] of [
    ["plugin-identity-config", "state"],
    ["plugin-identity-config", "production"],
    ["plugin-search-surface", "deployment"],
    ["runtime-sdk-v2", "deployment"],
  ])
    await context.test(`${id} unknown ${field}`, () =>
      invalidCatalog((value) => {
        value.capabilities.find((item) => item.id === id).availability[field] = "unknown";
      }, "STATUS_AVAILABILITY_UNKNOWN"));
  await context.test("unknown authority is representable only after actual fail-closed values and blocker", () =>
    validCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-search-surface");
      item.authority.state = "unknown";
      item.status = "Deferred";
      item.availability.state = "disabled";
      item.availability.environments = [];
      item.availability.production = "disabled";
      item.availability.deployment = "disabled";
      item.verdict = { decision: "NO-GO", rationaleCode: "fail-closed-deferred" };
      item.blockerCodes = ["broader-delivery-authority-required"];
    }));
  await context.test("unknown observation is representable only as disabled Deferred with a blocker", () =>
    validCatalog((value) => {
      const item = first(value);
      item.observation.state = "unknown";
      item.status = "Deferred";
      item.availability.state = "disabled";
      item.availability.environments = [];
      item.availability.production = "disabled";
      item.availability.deployment = "disabled";
      item.verdict = { decision: "NO-GO", rationaleCode: "fail-closed-deferred" };
      item.blockerCodes = ["implementation-authority-required"];
    }));
  await context.test("Deferred requires an explicit blocker", () =>
    invalidCatalog((value) => {
      value.capabilities.find(({ id }) => id === "runtime-sdk-v2").blockerCodes = [];
    }, "STATUS_DEFERRED_BLOCKER"));
  await context.test("schema closes production environments and flags", async () => {
    const schema = JSON.parse(await readFile(path.join(ROOT, "docs/status/schema.json"), "utf8"));
    assert.doesNotMatch(JSON.stringify(schema.$defs.scope.properties.environments.items), /production/u);
    assert.doesNotMatch(JSON.stringify(schema.$defs.capability.properties.availability.properties.environments.items), /production/u);
    assert.deepEqual(schema.$defs.capability.properties.availability.properties.production, { const: "disabled" });
    assert.deepEqual(schema.$defs.capability.properties.availability.properties.deployment, { const: "disabled" });
  });
});

test("Current facets require distinct appropriately guarded sources", async (context) => {
  const first = (value) => value.capabilities.find(({ id }) => id === "plugin-identity-config");
  for (const facet of ["observation", "evidence", "authority", "delivery", "qualification"])
    await context.test(`missing ${facet} refs`, () =>
      invalidCatalog((value) => (first(value)[facet].refs = []), "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("evidence cannot use an observation source", () =>
    invalidCatalog((value) => (first(value).evidence.refs = structuredClone(first(value).observation.refs)), "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("authority cannot use an observation source", () =>
    invalidCatalog((value) => (first(value).authority.refs = structuredClone(first(value).observation.refs)), "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("guard from another capability cannot bind Current evidence", () =>
    invalidCatalog((value) => {
      const item = first(value);
      item.evidence.refs = structuredClone(value.capabilities.find(({ id }) => id === "plugin-hooks-event-capture").evidence.refs);
    }, "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("deleting the exact evidence guard unbinds the facet", () =>
    invalidCatalog((value) => {
      const item = first(value);
      const evidencePath = item.evidence.refs[0].ref.split("#")[0];
      item.guards = item.guards.filter(({ path: guardPath }) => guardPath !== evidencePath);
    }, "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("one observation ref cannot also satisfy delivery", () =>
    invalidCatalog((value) => {
      const item = first(value);
      item.delivery.refs = [structuredClone(item.observation.refs[0])];
    }, "STATUS_CURRENT_FACET_DISTINCT"));
  for (const facet of ["evidence", "authority", "delivery", "qualification"])
    await context.test(`external ${facet} cannot establish Current`, () =>
      invalidCatalog((value) => {
        first(value)[facet].refs = [{ kind: "external", ref: `external.example/review#${facet}` }];
      }, "STATUS_CURRENT_FACET_SOURCE"));
  await context.test("external observation must remain unknown and fail closed", () =>
    invalidCatalog((value) => {
      first(value).observation.refs = [{ kind: "external", ref: "external.example/report#observation" }];
    }, "STATUS_EXTERNAL_OBSERVATION"));
});

test("platform claims require exact qualification", () =>
  invalidCatalog((value) => {
    value.capabilities[0].scope.platforms = ["darwin-arm64"];
    value.capabilities[0].qualification.platforms = [];
  }, "STATUS_PLATFORM_UNQUALIFIED"));

test("Experimental and Deferred capabilities cannot be production-enabled", async (context) => {
  await context.test("Experimental", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ status }) => status === "Experimental");
      item.availability.production = "enabled";
    }, "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
  await context.test("Deferred", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ status }) => status === "Deferred");
      item.availability.production = "enabled";
    }, "STATUS_WAVE1_PRODUCTION_FORBIDDEN"));
});

test("receipts alone cannot promote qualification", () =>
  invalidCatalog((value) => {
    const item = value.capabilities.find(({ id }) => id === "runtime-sdk-v2");
    item.qualification.state = "qualified";
    item.qualification.refs = [
      { kind: "receipt", ref: "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r4.json#candidate" },
    ];
  }, "STATUS_RECEIPT_NOT_QUALIFICATION"));

test("Wave 1 mechanically forbids publication promotion", async (context) => {
  await context.test("registry readiness", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-registry-readiness");
      item.availability.publication = "published";
    }, "STATUS_WAVE1_PUBLICATION_FORBIDDEN"));
  await context.test("bogus external publication marker", () =>
    invalidCatalog((value) => {
      const item = value.capabilities.find(({ id }) => id === "plugin-registry-readiness");
      item.assertion.refs.push({ kind: "external", ref: "registry.example/package#published" });
      item.availability.publication = "published";
    }, "STATUS_WAVE1_PUBLICATION_FORBIDDEN"));
});

test("policy and verdict prose are closed and structurally generated", async (context) => {
  for (const claim of ["grants-lifecycle-authority", "published", "production-ready", "deployment-enabled"])
    await context.test(`bogus ${claim} policy`, () =>
      invalidCatalog((value) => {
        value.policy.code = claim;
      }, "STATUS_POLICY"));
  for (const claim of ["grants-lifecycle-authority", "published", "production-ready", "deployment-enabled"])
    await context.test(`bogus ${claim} rationale`, () =>
      invalidCatalog((value) => {
        value.capabilities[0].verdict.rationaleCode = claim;
      }, "STATUS_VERDICT_RATIONALE"));
});

test("source contracts detect workspace, composition, export, and capability report mismatches", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const verify = (changes, code) =>
    rejectsWith(() => verifySourceContracts(value, overlay(repository, changes)), code);
  const rootPackage = JSON.parse(await repository.read("package.json"));
  rootPackage.workspaces = rootPackage.workspaces.filter((item) => item !== "apps/plugin/*");
  await context.test("workspace", () => verify({ "package.json": `${JSON.stringify(rootPackage)}\n` }, "STATUS_WORKSPACE_MISMATCH"));
  const plugin = await repository.read("apps/plugin/opencode2/src/plugin/plugin.ts");
  await context.test("composition", () =>
    verify({ "apps/plugin/opencode2/src/plugin/plugin.ts": plugin.replace("structuredToolsFeature", "missingFeature") }, "STATUS_COMPOSITION_MISMATCH"));
  const pluginPackage = JSON.parse(await repository.read("apps/plugin/opencode2/package.json"));
  delete pluginPackage.exports["./server"];
  await context.test("exports", () =>
    verify({ "apps/plugin/opencode2/package.json": `${JSON.stringify(pluginPackage)}\n` }, "STATUS_EXPORT_MISMATCH"));
  const report = await repository.read("apps/plugin/opencode2/src/platform/real-host/index.ts");
  await context.test("capability report", () =>
    verify({ "apps/plugin/opencode2/src/platform/real-host/index.ts": report.replace('reload: { status: "disabled"', 'reload: { status: "enabled"') }, "STATUS_CAPABILITY_REPORT_MISMATCH"));
});

test("every Wave 1 capability has a fail-closed exact source contract", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  assert.equal(value.capabilities.length, 27);
  for (const capability of value.capabilities) {
    assert.ok(capability.guards.length > 0, capability.id);
    await context.test(capability.id, async () => {
      const guard = capability.guards[0];
      const changes = guard.mode === "absent"
        ? { [guard.path]: "unreviewed surface\n" }
        : { [guard.path]: `${await repository.read(guard.path)}\n// unreviewed change\n` };
      const code = capability.id === "runtime-m7-historical"
        ? "STATUS_M7_HISTORICAL_CHANGED"
        : capability.id === "runtime-sdk-v2"
          ? "STATUS_SDK_RECEIPT_INVALID"
          : capability.status === "Retired"
            ? "STATUS_RETIRED_SURFACE_PRESENT"
            : guard.mode === "absent" ? "STATUS_ABSENCE_GUARD" : "STATUS_SOURCE_CHANGED";
      await rejectsWith(() => verifySourceContracts(value, overlay(repository, changes)), code);
    });
  }
});

test("M5 endpoint and policy mutations invalidate the runtime-m5 review", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const source = await repository.read("apps/runtime/src/repository-search.ts");
  const policy = await repository.read("apps/runtime/tests/repository-search.test.ts");
  await context.test("endpoint", () => rejectsWith(() => verifySourceContracts(value, overlay(repository, {
    "apps/runtime/src/repository-search.ts": source.replace("https://search.formerhuman.com/agent-search", "https://search.example/agent-search"),
  })), "STATUS_SOURCE_CHANGED"));
  await context.test("policy test", () => rejectsWith(() => verifySourceContracts(value, overlay(repository, {
    "apps/runtime/tests/repository-search.test.ts": policy.replace("provider_redirect_rejected", "provider_redirect_allowed"),
  })), "STATUS_SOURCE_CHANGED"));
});

test("M7 immutable acceptance and changed source candidate cannot be conflated", async () => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const historical = value.capabilities.find(({ id }) => id === "runtime-m7-historical");
  historical.scope.constraints = historical.scope.constraints.map((constraint) =>
    constraint.startsWith("source commit ") ? "source commit de8a4ec674d16d87a184c29b668fc06003caeb6a" : constraint);
  await rejectsWith(() => verifySourceContracts(value, createFileRepository(ROOT)), "STATUS_M7_CONFLATION");
});

test("Current qualification evidence must execute through a required verification entrypoint", async () => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const capability = value.capabilities.find(({ id }) => id === "plugin-structured-tools");
  capability.qualification.refs = [{
    kind: "test",
    ref: "apps/plugin/opencode2/tests/real-host/serve-isolation.test.mjs#repeated isolated exact-host smokes import set up and register the exported Effect plugin",
  }];
  await rejectsWith(
    () => verifySourceContracts(value, createFileRepository(ROOT)),
    "STATUS_QUALIFICATION_EXECUTION_CLOSURE",
  );
});

test("source contracts detect ADR omissions and preserve the exact historical preflight", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const pluginIndex = await repository.read("apps/plugin/opencode2/docs/architecture/README.md");
  await context.test("ADR index", () =>
    rejectsWith(
      () => verifySourceContracts(value, overlay(repository, { "apps/plugin/opencode2/docs/architecture/README.md": pluginIndex.replace("0031-registry-ready-package-and-black-box-proof.md", "omitted.md") })),
      "STATUS_ADR_INDEX_OMISSION",
    ));
  const snapshotPath = "apps/plugin/opencode2/docs/architecture/preflight-2026-08-12.md";
  const snapshot = await repository.read(snapshotPath);
  await context.test("historical snapshot deletion", () =>
    rejectsWith(
      () => verifySourceContracts(value, overlay(repository, { [snapshotPath]: null })),
      "STATUS_HISTORICAL_SNAPSHOT_CHANGED",
    ));
  await context.test("historical byte mutation", () =>
    rejectsWith(
      () => verifySourceContracts(value, overlay(repository, { [snapshotPath]: `${snapshot}\nmanual banner\n` })),
      "STATUS_HISTORICAL_SNAPSHOT_CHANGED",
    ));
  await context.test("historical baseline commit zeroed", () =>
    rejectsWith(
      () => verifySourceContracts(value, overlay(repository, { [snapshotPath]: snapshot.replace("74fe8c51fd2e5fe6b525f95a1b51b1b6f58a4d7d", "0000000000000000000000000000000000000000") })),
      "STATUS_HISTORICAL_SNAPSHOT_CHANGED",
    ));
  await context.test("staged rewrite plus catalog rehash", () => {
    const changedCatalog = structuredClone(value);
    changedCatalog.sourceContracts.historicalSnapshots[0].sha256 = "0".repeat(64);
    return rejectsWith(
      () => verifySourceContracts(changedCatalog, overlay(repository, { [snapshotPath]: `${snapshot}\nstaged rewrite\n` }, {
        [snapshotPath]: { indexBlob: "0".repeat(40), worktreeChanged: false },
      })),
      "STATUS_HISTORICAL_SNAPSHOT_CHANGED",
    );
  });
  await context.test("CRLF-normalized checkout", () =>
    verifySourceContracts(value, overlay(repository, { [snapshotPath]: snapshot.replaceAll("\n", "\r\n") })));
});

test("retired product surfaces fail if they reappear", async () => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  await rejectsWith(
    () => verifySourceContracts(value, overlay(repository, { "apps/plugin/opencode2/tools/loopd.mjs": "export {};\n" })),
    "STATUS_RETIRED_SURFACE_PRESENT",
  );
});

test("unknown guarded source changes fail closed", async () => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const source = await repository.read("apps/runtime/src/index.ts");
  await rejectsWith(
    () => verifySourceContracts(value, overlay(repository, { "apps/runtime/src/index.ts": `${source}\n// unclassified change\n` })),
    "STATUS_SOURCE_CHANGED",
  );
});

test("SDK r4 acceptance receipt is decisive contradictory evidence", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const receipt = JSON.parse(await repository.read(SDK_ACCEPTANCE_RECEIPT));
  const verify = (changes, code = "STATUS_SDK_RECEIPT_INVALID", changedCatalog = value) =>
    rejectsWith(() => verifySourceContracts(changedCatalog, overlay(repository, changes)), code);
  await context.test("deleted", () => verify({ [SDK_ACCEPTANCE_RECEIPT]: null }, "STATUS_SDK_RECEIPT_MISSING"));
  await context.test("artifact match changed", () => {
    const changed = structuredClone(receipt);
    changed.reproduction[0].artifactMatches = true;
    return verify({ [SDK_ACCEPTANCE_RECEIPT]: `${JSON.stringify(changed)}\n` });
  });
  await context.test("profile receipt match field deleted", () => {
    const changed = structuredClone(receipt);
    delete changed.reproduction[0].profileReceiptMatches;
    return verify({ [SDK_ACCEPTANCE_RECEIPT]: `${JSON.stringify(changed)}\n` });
  });
  await context.test("executable verdict changed", () => {
    const changed = structuredClone(receipt);
    changed.executableVerdicts.regressionsPassed = false;
    return verify({ [SDK_ACCEPTANCE_RECEIPT]: `${JSON.stringify(changed)}\n` });
  });
  await context.test("continuation changed", () => {
    const changed = structuredClone(receipt);
    changed.continuationAuthorization.priorArtifactHashesSuperseded = false;
    return verify({ [SDK_ACCEPTANCE_RECEIPT]: `${JSON.stringify(changed)}\n` });
  });
  await context.test("decision anchor deleted", () => {
    const changed = structuredClone(value);
    const item = changed.capabilities.find(({ id }) => id === "runtime-sdk-v2");
    item.evidence.refs = item.evidence.refs.filter(({ kind }) => kind !== "decision");
    return verify({}, "STATUS_SDK_RECEIPT_ANCHOR", changed);
  });
});

test("evidence fragments are meaningful canonical exact-normalized anchors", async (context) => {
  const { createFileRepository, verifySourceContracts } = await implementation();
  const repository = createFileRepository(ROOT);
  await context.test("missing exact normalized phrase", async () => {
    const value = await catalog();
    value.capabilities[0].evidence.refs[0].ref =
      "apps/plugin/opencode2/tests/unit/plugin-entrypoint.test.mjs#missing stable test";
    await rejectsWith(() => verifySourceContracts(value, repository), "STATUS_EVIDENCE_REFERENCE");
  });
  for (const fragment of ["", "---", "...", " ", "test  anchor", "test anchor ", "te\u200bst anchor"])
    await context.test(`invalid canonical fragment ${JSON.stringify(fragment)}`, () =>
      invalidCatalog((value) => {
        value.capabilities[0].evidence.refs[0].ref =
          `apps/plugin/opencode2/tests/unit/plugin-entrypoint.test.mjs#${fragment}`;
      }, "STATUS_REFERENCE_FRAGMENT"));
  await context.test("punctuation cannot normalize to an empty match", async () => {
    const value = await catalog();
    value.capabilities[0].evidence.refs[0].ref =
      "apps/plugin/opencode2/tests/unit/plugin-entrypoint.test.mjs#---";
    await rejectsWith(() => verifySourceContracts(value, repository), "STATUS_REFERENCE_FRAGMENT");
  });
});

test("generated current view and canonical README reject drift", async (context) => {
  const { checkGeneratedOutputs, createFileRepository, renderOutputs, validateCatalog, validateTemplateVisibleText } = await implementation();
  const value = await catalog();
  const repository = createFileRepository(ROOT);
  const outputs = await renderOutputs(value, repository);
  assert.deepEqual([...outputs.keys()], ["docs/status/current.md", "README.md"]);
  await checkGeneratedOutputs(outputs, repository);
  for (const target of ["docs/status/current.md", "README.md"])
    await context.test(target, async () => {
      const changed = `${await repository.read(target)}\nmanual drift\n`;
      await rejectsWith(() => checkGeneratedOutputs(outputs, overlay(repository, { [target]: changed })), "STATUS_GENERATED_DRIFT");
    });
  await context.test("direct README production/publication overclaim", async () => {
    const changed = `${await repository.read("README.md")}\nThe plugin is published and production-ready.\n`;
    const changedRepository = overlay(repository, { "README.md": changed });
    const canonicalOutputs = await renderOutputs(value, changedRepository);
    await rejectsWith(() => checkGeneratedOutputs(canonicalOutputs, changedRepository), "STATUS_GENERATED_DRIFT");
  });
  await context.test("template production/publication overclaim", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin is published and production-ready.\n`;
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_CLAIM");
  });
  await context.test("template status overclaim", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin is Current.\n`;
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_CLAIM");
  });
  await context.test("template remains-Current status assertion", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\nThe plugin remains Current.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template table status assertion", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n| Capability | Status |\n| --- | --- |\n| Plugin | Current |\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template table formatting-split overclaim", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n| Capability | Note |\n| --- | --- |\n| Plugin | pro**duc**tion |\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template nested list and blockquote overclaims", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n> Review\n> - The plugin remains **Current**.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template HTML-visible overclaim", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n<div>The plugin remains <strong>Current</strong>.</div>\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template inline-code overclaim", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin is \`production-ready\`.\n`;
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_CLAIM");
  });
  await context.test("template markdown-split production", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin runs in pro**duc**tion.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template entity-split production", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin runs in prod&#117;ction.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template plain runs in production", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin runs in production.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template authority-grant noun phrase", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThis page documents authority grants.\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template link-visible split production", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nSee [pro**duc**tion](https://example.invalid).\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
  });
  await context.test("template HTML-entity overclaim", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nThe plugin is pub&#108;ished.\n`;
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_CLAIM");
  });
  for (const [name, claim] of [
    ["zero-width production", "The plugin runs in pro\u200bduction."],
    ["zero-width published", "The plugin is pub\u2060lished."],
    ["compatibility production", "The plugin runs in ｐｒｏｄｕｃｔｉｏｎ."],
    ["contextual lower-case current", "The plugin is classified as current."],
    ["status-is lower-case current", "The plugin status is current."],
  ])
    await context.test(name, async () => {
      const changed = `${await repository.read("tools/status/README.template.md")}\n${claim}\n`;
      assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_CLAIM(?:$|:)/u);
    });
  await context.test("neutral current-directory navigation", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nOpen the current directory before running a check.\n`;
    assert.doesNotThrow(() => validateTemplateVisibleText(changed));
  });
  await context.test("capitalized neutral Current directory", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nOpen the Current directory before running a check.\n`;
    assert.doesNotThrow(() => validateTemplateVisibleText(changed));
  });
  await context.test("neutral current-directory table cell", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n| Navigation | Location |\n| --- | --- |\n| Open | Current directory |\n`;
    assert.doesNotThrow(() => validateTemplateVisibleText(changed));
  });
  await context.test("extra generated marker pair cannot hide a claim", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n<!-- status:status:start -->\nproduction\n<!-- status:status:end -->\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_MARKER(?:$|:)/u);
  });
  await context.test("nested generated markers are rejected", async () => {
    const source = await repository.read("tools/status/README.template.md");
    const changed = source.replace(
      "{{WORKSPACE_TABLE}}",
      "<!-- status:status:start -->\nproduction\n<!-- status:status:end -->\n{{WORKSPACE_TABLE}}",
    );
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_MARKER(?:$|:)/u);
  });
  await context.test("unknown status marker is rejected", async () => {
    const changed = `${await repository.read("tools/status/README.template.md")}\n<!-- status:hidden:start -->\npublished\n<!-- status:hidden:end -->\n`;
    assert.throws(() => validateTemplateVisibleText(changed), /^STATUS_TEMPLATE_MARKER(?:$|:)/u);
  });
  await context.test("unreviewed benign template mutation changes identity", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = `${await repository.read(templatePath)}\nNavigation note.\n`;
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_IDENTITY");
  });
  await context.test("mutable catalog prose is rejected and not rendered", async () => {
    const changed = structuredClone(value);
    changed.capabilities[0].assertion.statement = "The plugin is published and deployment is enabled.";
    changed.capabilities[0].blockers = ["Runs live in production"];
    changed.capabilities[0].title = "Published production-ready plugin";
    changed.workspaces[0].summary = "Deployed production service";
    assert.throws(() => validateCatalog(changed), /^STATUS_SCHEMA(?:$|:)/u);
    const outputs = await renderOutputs(changed, repository);
    assert.doesNotMatch(
      [...outputs.values()].join("\n"),
      /The plugin is published and deployment is enabled|Published production-ready plugin|Runs live in production|Deployed production service/u,
    );
  });
  await context.test("template required neutral structure", async () => {
    const templatePath = "tools/status/README.template.md";
    const changed = (await repository.read(templatePath)).replace("## Verification entry points", "## Commands");
    await rejectsWith(() => renderOutputs(value, overlay(repository, { [templatePath]: changed })), "STATUS_TEMPLATE_STRUCTURE");
  });
});

test("new status tooling is Node 18 compatible", async () => {
  const files = ["status-generated-write.mjs", "status-language.mjs", "status-model.mjs", "status-paths.mjs", "status-registry.mjs", "status-render.mjs", "status-repository.mjs", "status-validation.mjs", "status.mjs", "status.test.mjs"];
  for (const file of files)
    assert.doesNotMatch(await readFile(path.join(ROOT, "tools/status", file), "utf8"), /import\.meta\.dirname/u, file);
});
