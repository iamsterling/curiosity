import { createHash } from "node:crypto";
import {
  chmodSync,
  closeSync,
  copyFileSync,
  cpSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  MINIMAL_SYSTEM_PATH,
  createToolPolicy,
  closedEnvironment,
  discoverAmbientOpenCode,
  runBound,
  verifyToolPolicy,
} from "./legacy-memory-node-api-sdk-v2-tool-policy.mjs";
import {
  approvedReviewPaths,
  materializeApprovedReviewSet,
  validateApprovedReviewSet,
} from "./legacy-memory-node-api-sdk-v2-approved-review-set.mjs";
import {
  adversarialArchiveInventoryPaths,
  archiveInventoryOrderRule,
  compareArchiveInventoryPaths,
  renderArchiveInventory,
} from "./legacy-memory-node-api-sdk-v2-archive-inventory-order.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (code) => {
  throw Object.assign(new Error(code), { code });
};
const exactKeys = (value, keys, code) => {
  if (
    value === null ||
    typeof value !== "object" ||
    JSON.stringify(Object.keys(value)) !== JSON.stringify(keys)
  )
    fail(code);
};
let activeToolPolicy = null;
let activeEnvironment = null;
let activeRunRoot = null;
const activeCommand = (command) => {
  if (activeToolPolicy === null) return command;
  const aliases = {
    git: "git",
    rustc: "rustc",
    bun: "bun",
    "/usr/bin/file": "file",
    "/usr/bin/strings": "strings",
    "/usr/bin/sandbox-exec": "sandboxExec",
    "/bin/ps": "ps",
    "/usr/sbin/sysctl": "sysctl",
  };
  const name = aliases[command];
  if (name !== undefined) return activeToolPolicy.tools[name].path;
  if (
    Object.values(activeToolPolicy.tools).some(
      ({ path }) => path === command,
    ) ||
    (activeRunRoot !== null && command.startsWith(`${activeRunRoot}/`))
  )
    return command;
  throw new Error(`SDK_UNBOUND_TOOL:${command}`);
};
const run = (command, args, options = {}) => {
  const executable = activeCommand(command);
  const environment =
    activeEnvironment === null
      ? options.env
      : { ...activeEnvironment, ...(options.env ?? {}) };
  if (
    activeToolPolicy !== null &&
    Object.entries(options.env ?? {}).some(
      ([name, value]) =>
        !activeToolPolicy.environment.allowlistedNames.includes(name) ||
        activeEnvironment[name] !== value,
    )
  )
    fail("SDK_CHILD_ENVIRONMENT_ALLOWLIST_INVALID");
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: environment,
    timeout: options.timeout ?? 120_000,
  });
  if (result.status !== 0)
    fail(
      `${options.code ?? "SDK_ACCEPTANCE_COMMAND_FAILED"}:${result.status}:${result.stdout}${result.stderr}`,
    );
  return result;
};
const git = (repository, args) =>
  run("git", args, {
    cwd: repository,
    env: { LC_ALL: "C" },
  }).stdout.trim();
const filesBelow = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) fail("SDK_ARCHIVE_SYMLINK_FORBIDDEN");
    return entry.isDirectory() ? filesBelow(path) : [path];
  });

const forbiddenPackagingMarkers = (verificationTools) => [
  "control_flow_observation",
  "legacy-memory-node-api-control-flow-counters-v1",
  "controlled-phase-core",
  "controlled_phase_core",
  "phase_fixture",
  "ExplicitController",
  "PhaseController",
  "controlledPhaseCoreInterleaving",
  verificationTools.phaseFixtureSourceSha256,
  verificationTools.phaseFixtureBuildRecipeSha256,
  verificationTools.phaseFixtureArtifactSha256,
  verificationTools.phaseFixtureTranscriptSchemaSha256,
];

const phaseOrders = (width, permutation) => {
  const forward = Array.from({ length: width }, (_, index) => index);
  const reverse = [...forward].reverse();
  const rotate = width === 1 ? [...forward] : [...forward.slice(1), forward[0]];
  if (permutation === "forward-forward") return [forward, forward, forward];
  if (permutation === "forward-reverse") return [forward, reverse, forward];
  if (permutation === "reverse-rotate-reverse")
    return [reverse, rotate, reverse];
  fail("SDK_PHASE_TRANSCRIPT_PERMUTATION_INVALID");
};

const validatePhaseTranscript = (stdout, stderr, width, permutation) => {
  if (
    stderr !== "" ||
    !stdout.endsWith("\n") ||
    stdout.slice(0, -1).includes("\n")
  )
    fail("SDK_PHASE_TRANSCRIPT_CHANNEL_INVALID");
  const transcript = JSON.parse(stdout.slice(0, -1));
  exactKeys(
    transcript,
    [
      "schemaVersion",
      "kind",
      "width",
      "permutation",
      "events",
      "requests",
      "closed",
    ],
    "SDK_PHASE_TRANSCRIPT_SCHEMA_INVALID",
  );
  if (
    transcript.schemaVersion !== 1 ||
    transcript.kind !== "controlled-phase-core-interleaving" ||
    transcript.width !== width ||
    transcript.permutation !== permutation ||
    transcript.closed !== true ||
    transcript.events.length !== 3 * width ||
    transcript.requests.length !== width
  )
    fail("SDK_PHASE_TRANSCRIPT_SCHEMA_INVALID");
  const phases = ["entry", "worker", "completion"];
  const expectedEvents = phaseOrders(width, permutation).flatMap(
    (order, phaseIndex) =>
      order.map((requestId) => ({ requestId, phase: phases[phaseIndex] })),
  );
  transcript.events.forEach((event, sequence) => {
    exactKeys(
      event,
      ["sequence", "requestId", "phase"],
      "SDK_PHASE_TRANSCRIPT_EVENT_INVALID",
    );
    const expected = expectedEvents[sequence];
    if (
      event.sequence !== sequence ||
      event.requestId !==
        `request-${String(expected.requestId).padStart(2, "0")}` ||
      event.phase !== expected.phase
    )
      fail("SDK_PHASE_TRANSCRIPT_EVENT_INVALID");
  });
  transcript.requests.forEach((request, requestId) => {
    exactKeys(
      request,
      ["requestId", "byteLength", "phaseTrace", "counterVector", "completed"],
      "SDK_PHASE_TRANSCRIPT_REQUEST_INVALID",
    );
    const byteLength = 101 + requestId;
    if (
      request.requestId !== `request-${String(requestId).padStart(2, "0")}` ||
      request.byteLength !== byteLength ||
      JSON.stringify(request.phaseTrace) !==
        JSON.stringify(["entry", "worker", "completion"]) ||
      JSON.stringify(request.counterVector) !==
        JSON.stringify([1, byteLength, 1, 1, 1, 1, 1, 1, 1, 1]) ||
      request.completed !== true
    )
      fail("SDK_PHASE_TRANSCRIPT_REQUEST_INVALID");
  });
  return {
    width,
    permutation,
    eventCount: transcript.events.length,
    requestCount: transcript.requests.length,
    closed: transcript.closed,
    transcriptSha256: sha(stdout),
  };
};

const verifyPackagingAbsence = ({
  repository,
  runRoot,
  generatedPluginRoot,
  verificationTools,
  stage,
}) => {
  const paths = new Set();
  const add = (path) => {
    if (!existsSync(path)) return;
    const metadata = lstatSync(path);
    if (metadata.isSymbolicLink())
      fail("SDK_PACKAGE_SURFACE_SYMLINK_FORBIDDEN");
    if (metadata.isDirectory()) {
      for (const nested of filesBelow(path)) paths.add(nested);
    } else {
      paths.add(path);
    }
  };
  const pluginRoot = join(repository, "apps/plugin/opencode2");
  const pluginPackage = JSON.parse(
    readFileSync(join(pluginRoot, "package.json")),
  );
  for (const packagePath of pluginPackage.files)
    add(join(pluginRoot, packagePath));
  for (const exported of Object.values(pluginPackage.exports).flatMap(
    (value) => (typeof value === "string" ? [value] : Object.values(value)),
  ))
    add(join(pluginRoot, exported));
  const runtimeRoot = join(repository, "apps/runtime");
  const runtimePackage = JSON.parse(
    readFileSync(join(runtimeRoot, "package.json")),
  );
  for (const exported of Object.values(runtimePackage.exports).flatMap(
    (value) => (typeof value === "string" ? [value] : Object.values(value)),
  ))
    add(join(runtimeRoot, exported));
  const repositoryPaths = git(repository, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ]).split("\n");
  for (const repositoryPath of repositoryPaths) {
    if (
      /(?:^|\/)(?:assets|dist|provenance|bundles?|install[^/]*|release[^/]*|m7[^/]*)(?:\/|$)/i.test(
        repositoryPath,
      ) &&
      !repositoryPath.startsWith(
        "apps/runtime/native-node-api-qualification/",
      ) &&
      !repositoryPath.startsWith(
        "apps/plugin/opencode2/tests/qualification/",
      ) &&
      !repositoryPath.startsWith("apps/runtime/docs/") &&
      !repositoryPath.startsWith("apps/plugin/opencode2/docs/")
    )
      add(join(repository, repositoryPath));
  }
  add(generatedPluginRoot);
  for (const entry of readdirSync(runRoot, { withFileTypes: true }))
    if (/(?:bundle|install|release|provenance)/i.test(entry.name))
      add(join(runRoot, entry.name));
  const markers = forbiddenPackagingMarkers(verificationTools);
  const inventory = [];
  for (const path of [...paths].sort()) {
    const bytes = readFileSync(path);
    if (markers.some((marker) => bytes.includes(Buffer.from(marker))))
      fail(`SDK_PACKAGE_ABSENCE_FAILED:${relative(repository, path)}`);
    const fileKind = run("/usr/bin/file", [path], {
      env: { LC_ALL: "C" },
      code: "SDK_PACKAGE_FILE_INSPECTION_FAILED",
    }).stdout.trim();
    let stringsSha256 = null;
    if (/(?:Mach-O|archive|executable|shared library)/i.test(fileKind)) {
      const strings = run("/usr/bin/strings", [path], {
        env: { LC_ALL: "C" },
        code: "SDK_PACKAGE_STRING_INSPECTION_FAILED",
      }).stdout;
      if (markers.some((marker) => strings.includes(marker)))
        fail(
          `SDK_PACKAGE_BINARY_STRING_ABSENCE_FAILED:${relative(repository, path)}`,
        );
      stringsSha256 = sha(strings);
    }
    inventory.push({
      path: relative(repository, path),
      sha256: sha(bytes),
      fileKind,
      stringsSha256,
    });
  }
  const receipt = { stage, pathsInspected: inventory.length, inventory };
  writeFileSync(
    join(runRoot, `packaging-absence-${stage}.json`),
    `${JSON.stringify(receipt, null, 2)}\n`,
    { mode: 0o600 },
  );
  return receipt;
};

const packagingSelfTestSurfaces = {
  package: ["repository", "apps/plugin/opencode2/package-surface/fixture.txt"],
  bundle: ["repository", "bundle/fixture.txt"],
  dist: ["repository", "dist/fixture.txt"],
  assets: ["repository", "assets/fixture.txt"],
  provenance: ["repository", "provenance/fixture.txt"],
  generatedPlugin: ["generatedPluginRoot", "fixture.txt"],
  install: ["runRoot", "install-surface/fixture.txt"],
  release: ["runRoot", "release-surface/fixture.txt"],
  M7: ["repository", "M7/fixture.txt"],
};

const createPackagingSelfTestFixture = (root, contentBySurface) => {
  const repository = join(root, "repository");
  const runRoot = join(root, "run");
  const generatedPluginRoot = join(root, "generated-plugin");
  mkdirSync(join(repository, "apps/plugin/opencode2"), { recursive: true });
  mkdirSync(join(repository, "apps/runtime"), { recursive: true });
  mkdirSync(runRoot, { recursive: true });
  writeFileSync(
    join(repository, "apps/plugin/opencode2/package.json"),
    `${JSON.stringify({ files: ["package-surface"], exports: {} })}\n`,
  );
  writeFileSync(
    join(repository, "apps/runtime/package.json"),
    `${JSON.stringify({ exports: {} })}\n`,
  );
  run("/usr/bin/git", ["init", "-q"], {
    cwd: repository,
    env: { PATH: process.env.PATH, HOME: root, LC_ALL: "C" },
  });
  for (const [surface, content] of Object.entries(contentBySurface)) {
    const [base, suffix] = packagingSelfTestSurfaces[surface];
    const path = join(
      { repository, runRoot, generatedPluginRoot }[base],
      suffix,
    );
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, `${content}\n`);
  }
  return { repository, runRoot, generatedPluginRoot };
};

const selfTestPackagingAbsence = (selfTestRoot) => {
  const verificationTools = {
    phaseFixtureSourceSha256: "1".repeat(64),
    phaseFixtureBuildRecipeSha256: "2".repeat(64),
    phaseFixtureArtifactSha256: "3".repeat(64),
    phaseFixtureTranscriptSchemaSha256: "4".repeat(64),
  };
  const markers = forbiddenPackagingMarkers(verificationTools);
  let rejections = 0;
  for (const [surfaceIndex, surface] of Object.keys(
    packagingSelfTestSurfaces,
  ).entries()) {
    for (const [markerIndex, marker] of markers.entries()) {
      const root = join(
        selfTestRoot,
        `packaging-${surfaceIndex}-${markerIndex}`,
      );
      let rejected = false;
      try {
        const fixture = createPackagingSelfTestFixture(root, {
          [surface]: marker,
        });
        try {
          verifyPackagingAbsence({
            ...fixture,
            verificationTools,
            stage: "self-test",
          });
        } catch (error) {
          rejected = String(error?.code).startsWith(
            "SDK_PACKAGE_ABSENCE_FAILED:",
          );
        }
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
      if (existsSync(root)) fail("SDK_SELF_TEST_PACKAGE_CLEANUP_FAILED");
      if (!rejected) fail(`SDK_SELF_TEST_PACKAGE_MARKER_MISSED:${surface}`);
      rejections += 1;
    }
  }
  const cleanRoot = join(selfTestRoot, "packaging-clean");
  let cleanReceipt;
  try {
    const cleanSurfaces = Object.fromEntries(
      Object.keys(packagingSelfTestSurfaces).map((surface) => [
        surface,
        `clean-${surface}`,
      ]),
    );
    const fixture = createPackagingSelfTestFixture(cleanRoot, cleanSurfaces);
    cleanReceipt = verifyPackagingAbsence({
      ...fixture,
      verificationTools,
      stage: "self-test-clean",
    });
  } finally {
    rmSync(cleanRoot, { recursive: true, force: true });
  }
  if (existsSync(cleanRoot)) fail("SDK_SELF_TEST_PACKAGE_CLEANUP_FAILED");
  if (cleanReceipt?.pathsInspected !== 9)
    fail("SDK_SELF_TEST_CLEAN_PACKAGE_REJECTED");
  return {
    surfaces: Object.keys(packagingSelfTestSurfaces),
    forbiddenMarkers: markers.length,
    rejectionCases: rejections,
    cleanControlPathsInspected: cleanReceipt.pathsInspected,
    cleanup: true,
  };
};

const selfTestToolPolicy = (selfTestRoot) => {
  const first = createToolPolicy({
    repository: resolve(import.meta.dirname, "../../../../.."),
    bunPath: process.execPath,
    inheritedPath: "/ambient/one:/ambient/two",
  });
  const second = createToolPolicy({
    repository: resolve(import.meta.dirname, "../../../../.."),
    bunPath: process.execPath,
    inheritedPath: "/different/inherited/path",
  });
  if (
    first.environment.policySha256 !== second.environment.policySha256 ||
    first.policySha256 !== second.policySha256
  )
    fail("SDK_SELF_TEST_INHERITED_PATH_AFFECTED_POLICY");
  verifyToolPolicy(first);
  const mismatched = structuredClone(first);
  mismatched.tools.node.sha256 = "0".repeat(64);
  if (!rejects(() => verifyToolPolicy(mismatched)))
    fail("SDK_SELF_TEST_TOOL_MISMATCH_MISSED");
  const relocated = structuredClone(first);
  relocated.tools.node.path = join(selfTestRoot, "relocated-node");
  if (!rejects(() => verifyToolPolicy(relocated)))
    fail("SDK_SELF_TEST_TOOL_RELOCATION_MISSED");
  const ambientRoot = join(selfTestRoot, "ambient-tool");
  const ambientPackage = join(ambientRoot, "node_modules/@opencode-ai/cli");
  const ambientBin = join(ambientRoot, "bin");
  mkdirSync(join(ambientPackage, "bin"), { recursive: true });
  mkdirSync(ambientBin, { recursive: true });
  writeFileSync(
    join(ambientPackage, "package.json"),
    `${JSON.stringify({ name: "@opencode-ai/cli", version: "0.0.0-beta-17639" })}\n`,
  );
  writeFileSync(join(ambientPackage, "bin/opencode2.exe"), "not executed\n");
  symlinkSync(
    join(ambientPackage, "bin/opencode2.exe"),
    join(ambientBin, "opencode2"),
  );
  const ambientPresent = discoverAmbientOpenCode(ambientBin);
  const ambientAbsent = discoverAmbientOpenCode(join(selfTestRoot, "absent"));
  writeFileSync(
    join(ambientPackage, "package.json"),
    `${JSON.stringify({ name: "@opencode-ai/cli", version: "wrong-version" })}\n`,
  );
  const ambientWrongVersion = discoverAmbientOpenCode(ambientBin);
  if (
    ambientPresent.status !== "present-forbidden" ||
    ambientPresent.version !== "0.0.0-beta-17639" ||
    ambientPresent.executed !== false ||
    ambientAbsent.status !== "absent" ||
    ambientWrongVersion.status !== "present-forbidden" ||
    ambientWrongVersion.version !== "wrong-version" ||
    ambientWrongVersion.executed !== false
  )
    fail("SDK_SELF_TEST_AMBIENT_PROBE_INVALID");
  const explicit = runBound(
    first,
    "node",
    ["-e", "process.stdout.write(process.execPath+'\\n'+process.env.PATH)"],
    {
      env: { PATH: MINIMAL_SYSTEM_PATH, LC_ALL: "C" },
    },
  );
  if (
    explicit.status !== 0 ||
    explicit.stdout !== `${first.tools.node.path}\n${MINIMAL_SYSTEM_PATH}` ||
    !rejects(() => runBound(first, "notBound", []))
  )
    fail("SDK_SELF_TEST_EXPLICIT_TOOL_INVOCATION_INVALID");
  rmSync(ambientRoot, { recursive: true, force: true });
  if (existsSync(ambientRoot)) fail("SDK_SELF_TEST_TOOL_CLEANUP_FAILED");
  return {
    inheritedPathVariationIgnored: true,
    relocationRejected: true,
    mismatchRejected: true,
    ambientAbsentRejected: true,
    ambientPresentRejected: true,
    ambientWrongVersionRejected: true,
    ambientExecuted: false,
    explicitPathInvocation: true,
    minimalPath: MINIMAL_SYSTEM_PATH,
  };
};

const verifyReplacementApprovalTopology = ({
  repository,
  approvalPath,
  approval,
  approvedReviewSet,
  immutablePaths = [],
}) => {
  if (!existsSync(approvalPath)) fail("SDK_APPROVAL_REQUIRED");
  const repositoryApprovalPath = relative(repository, approvalPath);
  const introduction = git(repository, [
    "log",
    "--format=%H",
    "--diff-filter=A",
    "--",
    repositoryApprovalPath,
  ]);
  if (!/^[0-9a-f]{40}$/.test(introduction)) fail("SDK_REAPPROVAL_REQUIRED");
  const parents = git(repository, [
    "rev-list",
    "--parents",
    "-n",
    "1",
    introduction,
  ]).split(" ");
  if (
    parents.length !== 2 ||
    parents[1] !== approval.approval.approvalCommitParent
  )
    fail("SDK_REAPPROVAL_REQUIRED");
  const parent = parents[1];
  if (
    git(repository, [
      "diff-tree",
      "--no-commit-id",
      "--name-status",
      "-r",
      introduction,
    ]) !== `A\t${repositoryApprovalPath}`
  )
    fail("SDK_REAPPROVAL_REQUIRED");
  run("git", ["merge-base", "--is-ancestor", introduction, "HEAD"], {
    cwd: repository,
    code: "SDK_REAPPROVAL_REQUIRED",
  });
  if (
    git(repository, [
      "log",
      "--format=%H",
      `${introduction}..HEAD`,
      "--",
      repositoryApprovalPath,
    ])
  )
    fail("SDK_REAPPROVAL_REQUIRED");
  try {
    validateApprovedReviewSet(approvedReviewSet);
  } catch {
    fail("SDK_APPROVED_REVIEW_SET_INVALID");
  }
  for (const entry of approvedReviewSet) {
    const path = join(repository, entry.path);
    if (!existsSync(path) || !lstatSync(path).isFile())
      fail("SDK_APPROVED_REVIEW_PATH_INVALID");
    const currentBytes = readFileSync(path);
    if (sha(currentBytes) !== entry.sha256)
      fail("SDK_APPROVED_REVIEW_DIGEST_MISMATCH");
    const parentBytes = run("git", ["show", `${parent}:${entry.path}`], {
      cwd: repository,
      code: "SDK_APPROVED_REVIEW_PARENT_MISMATCH",
    }).stdout;
    const headBytes = run("git", ["show", `HEAD:${entry.path}`], {
      cwd: repository,
      code: "SDK_APPROVED_REVIEW_HEAD_MISMATCH",
    }).stdout;
    if (
      Buffer.compare(currentBytes, Buffer.from(parentBytes)) !== 0 ||
      Buffer.compare(currentBytes, Buffer.from(headBytes)) !== 0
    )
      fail("SDK_APPROVED_REVIEW_BYTES_MISMATCH");
    if (
      git(repository, [
        "log",
        "--format=%H",
        `${parent}..HEAD`,
        "--",
        entry.path,
      ])
    )
      fail("SDK_APPROVED_REVIEW_MODIFIED_AFTER_PARENT");
  }
  for (const path of immutablePaths) {
    const history = git(repository, [
      "log",
      "--format=%H",
      "--",
      relative(repository, path),
    ]);
    if (!/^[0-9a-f]{40}$/.test(history)) fail("SDK_REAPPROVAL_REQUIRED");
    const headBytes = run(
      "git",
      ["show", `HEAD:${relative(repository, path)}`],
      { cwd: repository, code: "SDK_REAPPROVAL_REQUIRED" },
    ).stdout;
    if (Buffer.compare(readFileSync(path), Buffer.from(headBytes)) !== 0)
      fail("SDK_REAPPROVAL_REQUIRED");
  }
  return { introduction, parent };
};

const selfTestReplacementApprovalTopology = (selfTestRoot) => {
  const createFixture = (name, mode) => {
    const repository = join(selfTestRoot, `approval-topology-${name}`);
    const approvalDirectory = join(repository, "approvals");
    const historicalPath = join(approvalDirectory, "legacy-v2.json");
    const replacementPath = join(approvalDirectory, "legacy-v2-r2.json");
    mkdirSync(approvalDirectory, { recursive: true });
    approvedReviewPaths.forEach((path, index) => {
      const absolutePath = join(repository, path);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, `review-${index}\n`);
    });
    writeFileSync(historicalPath, '{"historical":true}\n');
    run("/usr/bin/git", ["init", "-q"], { cwd: repository });
    run("/usr/bin/git", ["config", "user.name", "SDK self-test"], {
      cwd: repository,
    });
    run("/usr/bin/git", ["config", "user.email", "sdk@example.invalid"], {
      cwd: repository,
    });
    const commit = (message) => {
      run("/usr/bin/git", ["add", "."], { cwd: repository });
      run("/usr/bin/git", ["commit", "-q", "-m", message], {
        cwd: repository,
      });
      return git(repository, ["rev-parse", "HEAD"]);
    };
    if (mode === "squash") {
      writeFileSync(replacementPath, '{"replacement":true}\n');
      const parent = "0".repeat(40);
      commit("squashed replacement");
      return {
        repository,
        approvalPath: replacementPath,
        approval: { approval: { approvalCommitParent: parent } },
        approvedReviewSet: materializeApprovedReviewSet(repository),
        immutablePaths: [historicalPath],
      };
    }
    const parent = commit("candidate receipts and historical approval");
    const fixture = {
      repository,
      approvalPath: replacementPath,
      approval: { approval: { approvalCommitParent: parent } },
      approvedReviewSet: materializeApprovedReviewSet(repository),
      immutablePaths: [historicalPath],
    };
    if (mode === "missing") return fixture;
    writeFileSync(replacementPath, '{"replacement":true}\n');
    if (mode === "uncommitted") return fixture;
    commit("replacement approval only");
    if (mode === "wrong-parent")
      fixture.approval.approval.approvalCommitParent = "f".repeat(40);
    if (mode === "modified") {
      writeFileSync(replacementPath, '{"replacement":"modified"}\n');
      commit("modify replacement approval");
    }
    return fixture;
  };
  const rejected = (name, mode, code) => {
    const fixture = createFixture(name, mode);
    try {
      verifyReplacementApprovalTopology(fixture);
    } catch (error) {
      return error?.code === code;
    }
    return false;
  };
  const oldApprovalPresent = createFixture("old-present", "missing");
  if (!existsSync(oldApprovalPresent.immutablePaths[0]))
    fail("SDK_SELF_TEST_HISTORICAL_APPROVAL_MISSING");
  const result = {
    oldApprovalDoesNotAuthorize: rejected(
      "old-only",
      "missing",
      "SDK_APPROVAL_REQUIRED",
    ),
    missingReplacementRejected: rejected(
      "missing-r2",
      "missing",
      "SDK_APPROVAL_REQUIRED",
    ),
    uncommittedReplacementRejected: rejected(
      "new-r2",
      "uncommitted",
      "SDK_REAPPROVAL_REQUIRED",
    ),
    wrongParentRejected: rejected(
      "wrong-parent",
      "wrong-parent",
      "SDK_REAPPROVAL_REQUIRED",
    ),
    modifiedReplacementRejected: rejected(
      "modified",
      "modified",
      "SDK_REAPPROVAL_REQUIRED",
    ),
    historySquashRejected: rejected(
      "squash",
      "squash",
      "SDK_REAPPROVAL_REQUIRED",
    ),
    correctReplacementAccepted: false,
  };
  const correct = createFixture("correct", "correct");
  result.correctReplacementAccepted =
    verifyReplacementApprovalTopology(correct).parent ===
    correct.approval.approval.approvalCommitParent;
  if (Object.values(result).some((value) => value !== true))
    fail("SDK_SELF_TEST_REPLACEMENT_APPROVAL_TOPOLOGY_INVALID");
  return result;
};

const selfTestApprovedReviewSet = (selfTestRoot) => {
  const exercise = (mode, targetIndex) => {
    const repository = join(
      selfTestRoot,
      `approved-review-${mode}-${targetIndex}`,
    );
    const historicalPath = join(repository, "approvals/legacy-v2.json");
    const approvalPath = join(repository, "approvals/legacy-v2-r2.json");
    const entries = approvedReviewPaths.map((path, index) => ({
      path,
      sha256: sha(`review-${index}\n`),
    }));
    entries.forEach((entry, index) => {
      if (mode === "omit" && index === targetIndex) return;
      const path = join(repository, entry.path);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `review-${index}\n`);
    });
    mkdirSync(dirname(historicalPath), { recursive: true });
    writeFileSync(historicalPath, "historical\n");
    run("/usr/bin/git", ["init", "-q"], { cwd: repository });
    run("/usr/bin/git", ["config", "user.name", "SDK self-test"], {
      cwd: repository,
    });
    run("/usr/bin/git", ["config", "user.email", "sdk@example.invalid"], {
      cwd: repository,
    });
    run("/usr/bin/git", ["add", "."], { cwd: repository });
    run("/usr/bin/git", ["commit", "-q", "-m", "approved review parent"], {
      cwd: repository,
    });
    const parent = git(repository, ["rev-parse", "HEAD"]);
    writeFileSync(approvalPath, "replacement approval\n");
    run("/usr/bin/git", ["add", relative(repository, approvalPath)], {
      cwd: repository,
    });
    run("/usr/bin/git", ["commit", "-q", "-m", "replacement approval"], {
      cwd: repository,
    });
    if (mode === "mutate") {
      writeFileSync(
        join(repository, entries[targetIndex].path),
        `mutated-${targetIndex}\n`,
      );
      run("/usr/bin/git", ["add", entries[targetIndex].path], {
        cwd: repository,
      });
      run("/usr/bin/git", ["commit", "-q", "-m", "mutate review file"], {
        cwd: repository,
      });
    }
    try {
      verifyReplacementApprovalTopology({
        repository,
        approvalPath,
        approval: { approval: { approvalCommitParent: parent } },
        approvedReviewSet: entries,
        immutablePaths: [historicalPath],
      });
    } catch (error) {
      return String(error?.code).startsWith("SDK_APPROVED_REVIEW_");
    }
    return false;
  };
  const mutationRejections = approvedReviewPaths.filter((_, index) =>
    exercise("mutate", index),
  ).length;
  const omissionRejections = approvedReviewPaths.filter((_, index) =>
    exercise("omit", index),
  ).length;
  if (
    approvedReviewPaths.length !== 19 ||
    mutationRejections !== 19 ||
    omissionRejections !== 19
  )
    fail("SDK_SELF_TEST_APPROVED_REVIEW_SET_INVALID");
  return {
    canonicalCount: approvedReviewPaths.length,
    mutationRejections,
    omissionRejections,
  };
};

const selfTestArchiveInventoryOrdering = () => {
  const expectedPaths = [
    "!",
    "0",
    "A",
    "Z",
    "[",
    "a",
    "a-b",
    "a.b",
    "a/b",
    "a_b",
    "e\u0301",
    "z",
    "{",
    "~",
    "ß",
    "é",
    "Ω",
    "中",
  ];
  const orderedPaths = [...adversarialArchiveInventoryPaths].sort(
    compareArchiveInventoryPaths,
  );
  if (JSON.stringify(orderedPaths) !== JSON.stringify(expectedPaths))
    fail("SDK_SELF_TEST_ARCHIVE_INVENTORY_ORDER_INVALID");
  const rows = adversarialArchiveInventoryPaths.map((path, index) => ({
    path,
    mode: "0600",
    size: index,
    sha256: String(index).padStart(64, "0"),
  }));
  const candidateBytes = renderArchiveInventory(rows);
  const acceptanceBytes = renderArchiveInventory([...rows].reverse());
  if (candidateBytes !== acceptanceBytes)
    fail("SDK_SELF_TEST_ARCHIVE_INVENTORY_BYTES_DIVERGED");
  const modulePath = join(
    import.meta.dirname,
    "legacy-memory-node-api-sdk-v2-archive-inventory-order.mjs",
  );
  const localeOutputs = ["C", "en_US.UTF-8", "sv_SE.UTF-8", "tr_TR.UTF-8"].map(
    (locale) => {
      const result = spawnSync(
        process.execPath,
        [modulePath, "--emit-adversarial-order"],
        {
          encoding: "utf8",
          env: { PATH: MINIMAL_SYSTEM_PATH, LC_ALL: locale },
        },
      );
      if (result.status !== 0)
        fail("SDK_SELF_TEST_ARCHIVE_INVENTORY_LOCALE_CHILD_FAILED");
      return result.stdout;
    },
  );
  const expectedOutput = `${expectedPaths.join("\n")}\n`;
  if (localeOutputs.some((output) => output !== expectedOutput))
    fail("SDK_SELF_TEST_ARCHIVE_INVENTORY_LOCALE_DIVERGED");
  return {
    rule: archiveInventoryOrderRule,
    vectorCount: expectedPaths.length,
    localeVariationCount: localeOutputs.length,
    candidateAcceptanceBytesIdentical: true,
    localeInvariant: true,
  };
};

const expectedProfiles = [
  "normal",
  "panic",
  "allocationFailure",
  "queueFailure",
  "controlFlowObservation",
];

const profileMembershipIsExact = (profiles) =>
  JSON.stringify(profiles) === JSON.stringify(expectedProfiles);

const deriveConcurrencyIsolated = (results) => {
  const widths = [1, 2, 8, 32];
  return (
    results.length === widths.length &&
    results.every((result, index) => {
      const width = widths[index];
      return (
        result.width === width &&
        result.requestCount === width &&
        result.distinctByteLengths === width &&
        result.parityMatches === width &&
        result.counterVectorMatches === width &&
        result.passed === true
      );
    })
  );
};

const deriveControlledPhaseCoreInterleaving = (results) =>
  results.length === 12 &&
  results.every(
    (result) =>
      [1, 2, 8, 32].includes(result.width) &&
      ["forward-forward", "forward-reverse", "reverse-rotate-reverse"].includes(
        result.permutation,
      ) &&
      result.closed === true &&
      result.eventCount === 3 * result.width &&
      result.requestCount === result.width,
  ) &&
  new Set(results.map(({ width, permutation }) => `${width}:${permutation}`))
    .size === 12;

const fixtureStaticSourceIsClosed = (source) => {
  const controller = source.slice(
    source.indexOf("struct ControllerState"),
    source.indexOf("struct RequestRecord"),
  );
  return (
    source.includes('#[path = "../../src/phase_counter_core.rs"]') &&
    source.includes("impl PhaseController for ExplicitController") &&
    source.includes("record_entry_phase(") &&
    source.includes("record_worker_phase(") &&
    source.includes("record_completion_phase(") &&
    !source.includes("controlled_") &&
    !/(?:ControlFlowCounters|CounterSnapshot|\bcounters?\b|RequestRecord|\bresults?\b|parity|settlement)/.test(
      controller,
    ) &&
    !/(?:^|\n)\s*static\s/m.test(source) &&
    !/(?:thread_local!|napi_|\.node|createRequire|JavaScript|TcpStream|UdpSocket|std::fs|std::env::var|napi_register_module_v1)/.test(
      source,
    )
  );
};

const buildSelfTestTranscript = (width, permutation) => {
  const phases = ["entry", "worker", "completion"];
  const events = phaseOrders(width, permutation).flatMap((order, phaseIndex) =>
    order.map((requestId) => ({
      sequence: 0,
      requestId: `request-${String(requestId).padStart(2, "0")}`,
      phase: phases[phaseIndex],
    })),
  );
  events.forEach((event, sequence) => {
    event.sequence = sequence;
  });
  const requests = Array.from({ length: width }, (_, requestId) => {
    const byteLength = 101 + requestId;
    return {
      requestId: `request-${String(requestId).padStart(2, "0")}`,
      byteLength,
      phaseTrace: phases,
      counterVector: [1, byteLength, 1, 1, 1, 1, 1, 1, 1, 1],
      completed: true,
    };
  });
  return `${JSON.stringify({
    schemaVersion: 1,
    kind: "controlled-phase-core-interleaving",
    width,
    permutation,
    events,
    requests,
    closed: true,
  })}\n`;
};

const rejects = (operation) => {
  try {
    operation();
    return false;
  } catch {
    return true;
  }
};

const sampleProcess = async (pid) => {
  let rss = 0;
  let threads = 0;
  for (let index = 0; index < 5; index++) {
    const rssValue = Number(
      run("/bin/ps", ["-o", "rss=", "-p", String(pid)], {
        env: { LC_ALL: "C" },
        code: "SDK_LIFECYCLE_SAMPLE_FAILED",
      }).stdout.trim(),
    );
    const threadRows = run("/bin/ps", ["-M", "-p", String(pid)], {
      env: { LC_ALL: "C" },
      code: "SDK_LIFECYCLE_SAMPLE_FAILED",
    })
      .stdout.trim()
      .split("\n").length;
    if (!Number.isFinite(rssValue) || rssValue <= 0 || threadRows <= 1)
      fail("SDK_LIFECYCLE_SAMPLE_INVALID");
    rss = Math.max(rss, rssValue);
    threads = Math.max(threads, threadRows - 1);
    await Bun.sleep(100);
  }
  return { rssKiB: rss, threads };
};

const runLifecycleMatrix = async ({
  bun,
  harness,
  addon,
  digest,
  runRoot,
  environment,
}) => {
  const child = Bun.spawn(
    [bun, harness, "--mode", "lifecycle", "--addon", addon, "--sha256", digest],
    {
      cwd: runRoot,
      env: environment,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const reader = child.stdout.getReader();
  let buffered = "";
  const nextLine = async () => {
    while (!buffered.includes("\n")) {
      const chunk = await reader.read();
      if (chunk.done) fail("SDK_LIFECYCLE_EARLY_EXIT");
      buffered += new TextDecoder().decode(chunk.value);
    }
    const index = buffered.indexOf("\n");
    const line = buffered.slice(0, index);
    buffered = buffered.slice(index + 1);
    return line;
  };
  const points = {};
  for (const point of ["S0", "S1", "S2", "S3", "S4"]) {
    if ((await nextLine()) !== point) fail("SDK_LIFECYCLE_SEQUENCE_INVALID");
    points[point] = await sampleProcess(child.pid);
    child.stdin.write("continue\n");
    child.stdin.flush();
  }
  child.stdin.end();
  const exit = await Promise.race([
    child.exited,
    Bun.sleep(15_000).then(() => -1),
  ]);
  if (exit !== 0 || (await new Response(child.stderr).text()) !== "")
    fail("SDK_LIFECYCLE_CHILD_FAILED");
  const rssValues = Object.values(points).map((point) => point.rssKiB);
  const threadValues = Object.values(points).map((point) => point.threads);
  if (
    Math.max(...rssValues) > 786_432 ||
    Math.max(...rssValues.slice(1)) - points.S0.rssKiB > 131_072 ||
    points.S4.rssKiB - points.S1.rssKiB > 65_536 ||
    Math.max(...threadValues) > 64 ||
    Math.max(...threadValues.slice(1)) - points.S0.threads > 16 ||
    points.S4.threads > points.S1.threads + 2
  )
    fail("SDK_LIFECYCLE_CEILING_EXCEEDED");
  return points;
};

const runFreshProcessSeries = ({
  bun,
  harness,
  addon,
  digest,
  runRoot,
  environment,
}) => {
  const series = [];
  for (let runNumber = 1; runNumber <= 100; runNumber++) {
    const started = performance.now();
    const result = spawnSync(
      activeToolPolicy.tools.time.path,
      [
        "-l",
        bun,
        harness,
        "--mode",
        "fresh-process",
        "--addon",
        addon,
        "--sha256",
        digest,
      ],
      {
        cwd: runRoot,
        encoding: "utf8",
        env: environment,
        timeout: 15_000,
      },
    );
    const maximum = Number(
      result.stderr.match(/(\d+)\s+maximum resident set size/)?.[1],
    );
    if (
      result.status !== 0 ||
      !Number.isFinite(maximum) ||
      maximum > 805_306_368 ||
      performance.now() - started > 15_000
    )
      fail("SDK_FRESH_PROCESS_LIMIT_FAILED");
    series.push(maximum);
  }
  const mean = series.reduce((sum, value) => sum + value, 0) / series.length;
  const denominator = series.reduce(
    (sum, _, index) => sum + (index + 1 - 50.5) ** 2,
    0,
  );
  const slope =
    series.reduce(
      (sum, value, index) => sum + (index + 1 - 50.5) * (value - mean),
      0,
    ) / denominator;
  const median = (values) => {
    const ordered = [...values].sort((a, b) => a - b);
    return (ordered[9] + ordered[10]) / 2;
  };
  if (
    slope > 262_144 ||
    median(series.slice(80)) - median(series.slice(0, 20)) > 16_777_216
  )
    fail("SDK_FRESH_PROCESS_SLOPE_FAILED");
  return {
    runs: 100,
    slopeBytesPerRun: slope,
    firstMedian: median(series.slice(0, 20)),
    lastMedian: median(series.slice(80)),
  };
};

export const selfTestAcceptanceVerifier = () => {
  const root = process.env.TMPDIR ?? "/tmp";
  const fake = join(root, `sdk-v2-self-test-${process.pid}`);
  rmSync(fake, { recursive: true, force: true });
  mkdirSync(fake, { recursive: true, mode: 0o700 });
  try {
    const fakeRepository = join(fake, "repository");
    mkdirSync(fakeRepository);
    const fakeGit = (...args) =>
      run("/usr/bin/git", args, {
        cwd: fakeRepository,
        env: {
          PATH: process.env.PATH,
          HOME: fake,
          GIT_AUTHOR_NAME: "SDK self test",
          GIT_AUTHOR_EMAIL: "sdk@example.invalid",
          GIT_COMMITTER_NAME: "SDK self test",
          GIT_COMMITTER_EMAIL: "sdk@example.invalid",
        },
      }).stdout.trim();
    fakeGit("init", "-q");
    writeFileSync(join(fakeRepository, "candidate.json"), "{}\n");
    fakeGit("add", "candidate.json");
    fakeGit("commit", "-qm", "candidate");
    const fakeParent = fakeGit("rev-parse", "HEAD");
    writeFileSync(join(fakeRepository, "approval.json"), "{}\n");
    fakeGit("add", "approval.json");
    fakeGit("commit", "-qm", "approval");
    const fakeApproval = fakeGit("rev-parse", "HEAD");
    if (
      fakeGit("rev-parse", `${fakeApproval}^`) !== fakeParent ||
      fakeGit(
        "diff-tree",
        "--no-commit-id",
        "--name-status",
        "-r",
        fakeApproval,
      ) !== "A\tapproval.json"
    )
      fail("SDK_SELF_TEST_TOPOLOGY_MISSED");
    const mismatch = join(fake, "mismatch");
    writeFileSync(mismatch, "approved", { mode: 0o600 });
    if (sha(readFileSync(mismatch)) === sha(Buffer.from("rebuilt")))
      fail("SDK_SELF_TEST_MISMATCH_MISSED");
    const ambient = "0.0.0-beta-17639";
    if (ambient !== "0.0.0-beta-17639") fail("SDK_SELF_TEST_AMBIENT_MISSED");
    const acceptance = join(fake, "acceptance.json");
    const temporary = `${acceptance}.tmp`;
    writeFileSync(temporary, '{"receiptKind":"acceptance"}\n', { mode: 0o600 });
    renameSync(temporary, acceptance);
    if (!existsSync(acceptance) || existsSync(temporary))
      fail("SDK_SELF_TEST_ATOMIC_WRITE_FAILED");
    const validFixtureSource = `#[path = "../../src/phase_counter_core.rs"] mod phase_counter_core;
struct ControllerState { phase: usize, events: Vec<usize> }
struct ExplicitController { state: ControllerState }
struct RequestRecord;
impl PhaseController for ExplicitController {}
fn run(){ record_entry_phase(); record_worker_phase(); record_completion_phase(); }`;
    if (!fixtureStaticSourceIsClosed(validFixtureSource))
      fail("SDK_SELF_TEST_VALID_FIXTURE_REJECTED");
    const staticAdversaries = {
      copiedCore: validFixtureSource.replace(
        '#[path = "../../src/phase_counter_core.rs"] mod phase_counter_core;',
        "mod copied_phase_counter_core;",
      ),
      controllerCounterOwnership: validFixtureSource.replace(
        "phase: usize",
        "phase: usize, counters: Vec<usize>",
      ),
      controllerResultOwnership: validFixtureSource.replace(
        "phase: usize",
        "phase: usize, result: Vec<u8>",
      ),
      staticChannel: `${validFixtureSource}\nstatic SHARED: usize = 0;`,
      threadLocalChannel: `${validFixtureSource}\nthread_local!{static X: usize = 0;}`,
      perEnvironmentChannel: `${validFixtureSource}\nfn x(){ napi_set_instance_data(); }`,
      filesystemChannel: `${validFixtureSource}\nfn x(){ std::fs::read("x"); }`,
      networkChannel: `${validFixtureSource}\nfn x(){ TcpStream::connect("x"); }`,
      environmentChannel: `${validFixtureSource}\nfn x(){ std::env::var("X"); }`,
      javascriptChannel: `${validFixtureSource}\nfn x(){ createRequire("x"); }`,
      nodeApiLinkage: `${validFixtureSource}\nfn x(_: napi_env){ napi_get_version(); }`,
      addonLinkage: `${validFixtureSource}\nconst OUTPUT: &str = "fixture.node";`,
      controlledFacade: `${validFixtureSource}\nfn controlled_entry() {}`,
    };
    if (Object.values(staticAdversaries).some(fixtureStaticSourceIsClosed))
      fail("SDK_SELF_TEST_PHASE_STATIC_ADVERSARY_MISSED");
    if (
      profileMembershipIsExact([...expectedProfiles, "sixthProfile"]) ||
      profileMembershipIsExact(expectedProfiles.slice(0, 4))
    )
      fail("SDK_SELF_TEST_PROFILE_MEMBERSHIP_MISSED");
    const packagingAbsence = selfTestPackagingAbsence(fake);
    const toolPolicy = selfTestToolPolicy(fake);
    const replacementApprovalTopology =
      selfTestReplacementApprovalTopology(fake);
    const approvedReviewSet = selfTestApprovedReviewSet(fake);
    const archiveInventoryOrdering = selfTestArchiveInventoryOrdering(fake);
    const validTranscript = buildSelfTestTranscript(2, "forward-reverse");
    validatePhaseTranscript(validTranscript, "", 2, "forward-reverse");
    const parsedTranscript = JSON.parse(validTranscript);
    const duplicateRequest = structuredClone(parsedTranscript);
    duplicateRequest.requests[1].requestId =
      duplicateRequest.requests[0].requestId;
    const outOfOrder = structuredClone(parsedTranscript);
    [outOfOrder.events[0], outOfOrder.events[1]] = [
      outOfOrder.events[1],
      outOfOrder.events[0],
    ];
    const openTranscript = structuredClone(parsedTranscript);
    openTranscript.closed = false;
    const transcriptAdversaries = [
      "",
      "not-json\n",
      `${validTranscript}${validTranscript}`,
      `${JSON.stringify(duplicateRequest)}\n`,
      `${JSON.stringify(outOfOrder)}\n`,
      `${JSON.stringify(openTranscript)}\n`,
      validTranscript.slice(0, -1),
    ];
    if (
      transcriptAdversaries.some(
        (transcript) =>
          !rejects(() =>
            validatePhaseTranscript(transcript, "", 2, "forward-reverse"),
          ),
      )
    )
      fail("SDK_SELF_TEST_TRANSCRIPT_ADVERSARY_MISSED");
    const timedOut = spawnSync("/bin/sleep", ["1"], { timeout: 1 });
    if (timedOut.error?.code !== "ETIMEDOUT")
      fail("SDK_SELF_TEST_TIMEOUT_MISSED");
    const widthResults = [1, 2, 8, 32].map((width) => ({
      width,
      requestCount: width,
      distinctByteLengths: width,
      parityMatches: width,
      counterVectorMatches: width,
      passed: true,
    }));
    const controlledResults = [1, 2, 8, 32].flatMap((width) =>
      ["forward-forward", "forward-reverse", "reverse-rotate-reverse"].map(
        (permutation) => ({
          width,
          permutation,
          closed: true,
          eventCount: 3 * width,
          requestCount: width,
        }),
      ),
    );
    if (
      !deriveConcurrencyIsolated(widthResults) ||
      !deriveControlledPhaseCoreInterleaving(controlledResults) ||
      deriveConcurrencyIsolated(controlledResults) ||
      deriveControlledPhaseCoreInterleaving(widthResults)
    )
      fail("SDK_SELF_TEST_VERDICT_INDEPENDENCE_MISSED");
    rmSync(fake, { recursive: true, force: true });
    if (existsSync(fake)) fail("SDK_SELF_TEST_CLEANUP_FAILED");
    return {
      mismatchBeforeLoad: true,
      approvalTopology: true,
      ambientBeta17639Rejected: true,
      atomicReceipt: true,
      phaseStaticAdversaries: Object.keys(staticAdversaries).length,
      wrongProfileMembershipRejected: true,
      packagingAbsence,
      toolPolicy,
      replacementApprovalTopology,
      approvedReviewSet,
      archiveInventoryOrdering,
      transcriptAdversaries: transcriptAdversaries.length,
      timeoutRejected: true,
      independentVerdictDerivation: true,
      cleanup: true,
      addonLoaderCalls: 0,
      opencodeLaunches: 0,
    };
  } finally {
    rmSync(fake, { recursive: true, force: true });
  }
};

export const runAcceptance = async ({ repository, argumentsMap }) => {
  const inheritedPath = process.env.PATH ?? "";
  const approvalPath = resolve(argumentsMap.get("--approval-record") ?? "");
  const runRoot = realpathSync(argumentsMap.get("--run-root") ?? "");
  const archiveRoot = realpathSync(
    argumentsMap.get("--approved-archive-root") ?? "",
  );
  const expectedApproval = join(
    repository,
    "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r3.json",
  );
  if (approvalPath !== expectedApproval || !existsSync(approvalPath))
    fail("SDK_APPROVAL_REQUIRED");
  if (
    Bun.version !== "1.3.14" ||
    process.platform !== "darwin" ||
    process.arch !== "arm64"
  )
    fail("SDK_HOST_PROFILE_INVALID");
  const approval = JSON.parse(readFileSync(approvalPath));
  exactKeys(
    approval,
    [
      "schemaVersion",
      "qualification",
      "decision",
      "approvalPath",
      "candidate",
      "profiles",
      "approvedReviewSet",
      "dependencyPolicy",
      "schemas",
      "controlFlow",
      "verificationTools",
      "toolPolicy",
      "compilerPolicy",
      "environmentPolicy",
      "importPolicy",
      "supersededApproval",
      "approval",
    ],
    "SDK_APPROVAL_SCHEMA_INVALID",
  );
  if (
    approval.schemaVersion !== 3 ||
    approval.qualification !== "legacy-memory-node-api-sdk-v2" ||
    approval.decision !== "approve-candidate-for-clean-acceptance" ||
    approval.approvalPath !== relative(repository, expectedApproval)
  )
    fail("SDK_APPROVAL_SCHEMA_INVALID");
  exactKeys(
    approval.supersededApproval,
    ["path", "sha256", "status"],
    "SDK_APPROVAL_SCHEMA_INVALID",
  );
  const historicalApprovalPath = join(
    repository,
    "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r2.json",
  );
  if (
    approval.supersededApproval.path !==
      relative(repository, historicalApprovalPath) ||
    approval.supersededApproval.status !== "superseded-historical-evidence" ||
    !existsSync(historicalApprovalPath) ||
    sha(readFileSync(historicalApprovalPath)) !==
      approval.supersededApproval.sha256
  )
    fail("SDK_SUPERSEDED_APPROVAL_INVALID");
  verifyToolPolicy(approval.toolPolicy);
  if (
    JSON.stringify(approval.environmentPolicy) !==
    JSON.stringify(approval.toolPolicy.environment)
  )
    fail("SDK_APPROVAL_TOOL_ENVIRONMENT_MISMATCH");
  activeToolPolicy = approval.toolPolicy;
  activeRunRoot = runRoot;
  activeEnvironment = closedEnvironment(activeToolPolicy, {
    runRoot,
    cargoHome: join(runRoot, "cargo-home"),
    cargoTarget: join(runRoot, "cargo-target"),
  });
  const ambientOpenCode = discoverAmbientOpenCode(inheritedPath);
  exactKeys(
    approval.candidate,
    ["path", "sha256"],
    "SDK_APPROVAL_SCHEMA_INVALID",
  );
  if (!Array.isArray(approval.profiles) || approval.profiles.length !== 5)
    fail("SDK_APPROVAL_SCHEMA_INVALID");
  if (
    !profileMembershipIsExact(approval.profiles.map(({ profile }) => profile))
  )
    fail("SDK_APPROVAL_SCHEMA_INVALID");
  approval.profiles.forEach((profile, index) => {
    exactKeys(
      profile,
      ["profile", "receiptPath", "receiptSha256", "artifactSha256"],
      "SDK_APPROVAL_SCHEMA_INVALID",
    );
    if (profile.profile !== expectedProfiles[index])
      fail("SDK_APPROVAL_SCHEMA_INVALID");
  });
  const candidatePath = join(repository, approval.candidate.path);
  const { introduction } = verifyReplacementApprovalTopology({
    repository,
    approvalPath,
    approval,
    approvedReviewSet: approval.approvedReviewSet,
    immutablePaths: [historicalApprovalPath],
  });
  const committedPaths = [
    approvalPath,
    ...approval.approvedReviewSet.map(({ path }) => join(repository, path)),
  ];
  for (const path of committedPaths) {
    if (!statSync(path).isFile()) fail("SDK_APPROVED_PATH_INVALID");
    const repositoryPath = relative(repository, path);
    const committed = run("git", ["show", `HEAD:${repositoryPath}`], {
      cwd: repository,
      code: "SDK_APPROVED_PATH_UNCOMMITTED",
    }).stdout;
    if (Buffer.compare(readFileSync(path), Buffer.from(committed)) !== 0)
      fail("SDK_APPROVED_BYTES_MISMATCH");
  }
  if (sha(readFileSync(candidatePath)) !== approval.candidate.sha256)
    fail("SDK_APPROVED_BYTES_MISMATCH");
  const candidate = JSON.parse(readFileSync(candidatePath));
  const approvedReviewDigests = new Map(
    approval.approvedReviewSet.map(({ path, sha256 }) => [path, sha256]),
  );
  exactKeys(
    candidate,
    [
      "schemaVersion",
      "qualification",
      "receiptKind",
      "dependencyReceiptSha256",
      "humanLicenseReceiptSha256",
      "abiReceiptSha256",
      "undefinedImportsSha256",
      "schemas",
      "controlFlow",
      "verificationTools",
      "toolPolicy",
      "profiles",
      "candidateStaticVerdicts",
    ],
    "SDK_CANDIDATE_SCHEMA_INVALID",
  );
  if (
    candidate.schemaVersion !== 3 ||
    candidate.receiptKind !== "candidate" ||
    approvedReviewDigests.get(approval.candidate.path) !==
      approval.candidate.sha256 ||
    approvedReviewDigests.get(
      "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.json",
    ) !== candidate.dependencyReceiptSha256 ||
    approvedReviewDigests.get(
      "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.md",
    ) !== candidate.humanLicenseReceiptSha256 ||
    approvedReviewDigests.get(
      "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.json",
    ) !== candidate.abiReceiptSha256 ||
    approvedReviewDigests.get(
      "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.txt",
    ) !== candidate.undefinedImportsSha256 ||
    approval.profiles.some(
      ({ receiptPath, receiptSha256 }) =>
        approvedReviewDigests.get(receiptPath) !== receiptSha256,
    ) ||
    JSON.stringify(
      candidate.profiles.map(
        ({ profile, receiptPath, receiptSha256, artifactSha256 }) => ({
          profile,
          receiptPath,
          receiptSha256,
          artifactSha256,
        }),
      ),
    ) !== JSON.stringify(approval.profiles)
  )
    fail("SDK_CANDIDATE_SCHEMA_INVALID");
  exactKeys(
    candidate.controlFlow,
    [
      "counterSchema",
      "orderedCounterNames",
      "counterMutationSitesSha256",
      "recorderCallSitesSha256",
      "phaseCoreCallSitesSha256",
      "rawSettlementCallSiteSha256",
      "fakeAdapterVectorsSha256",
    ],
    "SDK_CANDIDATE_CONTROL_FLOW_SCHEMA_INVALID",
  );
  exactKeys(
    candidate.verificationTools,
    [
      "astScannerVersion",
      "astScannerSourceSha256",
      "astScannerManifestSha256",
      "astScannerLockfileSha256",
      "astScannerDependencyReceiptSha256",
      "astNormalizationSha256",
      "astOutputSha256",
      "archiveInventoryComparatorSourceSha256",
      "archiveInventoryComparatorRuleSha256",
      "guardSourceSha256",
      "guardBuildRecipeSha256",
      "guardCompilerSha256",
      "guardArtifactSha256",
      "guardImportsSha256",
      "guardExportsSha256",
      "fakeAdapterBuildRecipeSha256",
      "fakeAdapterArtifactSha256",
      "phaseFixtureSourceSha256",
      "phaseFixtureBuildRecipeSha256",
      "phaseFixtureArtifactSha256",
      "phaseFixtureTranscriptSchemaSha256",
    ],
    "SDK_CANDIDATE_VERIFICATION_TOOLS_SCHEMA_INVALID",
  );
  if (
    sha(
      readFileSync(
        join(
          repository,
          "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk-v2-archive-inventory-order.mjs",
        ),
      ),
    ) !== candidate.verificationTools.archiveInventoryComparatorSourceSha256 ||
    sha(`${archiveInventoryOrderRule}\n`) !==
      candidate.verificationTools.archiveInventoryComparatorRuleSha256
  )
    fail("SDK_ARCHIVE_INVENTORY_COMPARATOR_MISMATCH");
  exactKeys(
    candidate.candidateStaticVerdicts,
    [
      "allProfileReceiptsClosed",
      "allTenArtifactHashPairsUnequal",
      "normalObservationStringsAbsent",
      "soleRawSettlementCallSiteInAdapter",
      "counterMutationSitesClosed",
      "recorderCallSitesClosed",
      "phaseCoreCallSitesClosed",
      "phaseFixtureStandalone",
      "phaseFixtureCoordinationClosed",
      "dependencyClosureApproved",
      "abiAndImportsClosed",
    ],
    "SDK_CANDIDATE_STATIC_VERDICTS_SCHEMA_INVALID",
  );
  if (
    Object.values(candidate.candidateStaticVerdicts).some(
      (verdict) => verdict !== true,
    )
  )
    fail("SDK_CANDIDATE_STATIC_VERDICTS_INVALID");
  if (
    JSON.stringify(approval.schemas) !== JSON.stringify(candidate.schemas) ||
    JSON.stringify(approval.controlFlow) !==
      JSON.stringify(candidate.controlFlow) ||
    JSON.stringify(approval.verificationTools) !==
      JSON.stringify(candidate.verificationTools) ||
    JSON.stringify(approval.toolPolicy) !== JSON.stringify(candidate.toolPolicy)
  )
    fail("SDK_APPROVAL_POLICY_MISMATCH");
  const approvedNormalReceipt = JSON.parse(
    readFileSync(join(repository, approval.profiles[0].receiptPath)),
  );
  const reproductionResults = [];
  for (const profile of approval.profiles) {
    const receipt = join(repository, profile.receiptPath);
    if (sha(readFileSync(receipt)) !== profile.receiptSha256)
      fail("SDK_APPROVED_BYTES_MISMATCH");
    const sidecar = receipt.replace(/\.json$/, ".sha256");
    if (
      readFileSync(sidecar, "utf8") !==
      `${profile.receiptSha256}  ${sidecar
        .split("/")
        .at(-1)
        .replace(/\.sha256$/, ".json")}\n`
    )
      fail("SDK_APPROVED_SIDECAR_MISMATCH");
    const parsedReceipt = JSON.parse(readFileSync(receipt));
    exactKeys(
      parsedReceipt,
      [
        "schemaVersion",
        "qualification",
        "receiptKind",
        "profile",
        "exclusiveCfg",
        "triggerSha256",
        "artifactSha256",
        "source",
        "schemas",
        "controlFlow",
        "verificationTools",
        "toolPolicy",
        "compiler",
        "environment",
        "imports",
        "loaderClass",
        "staticVerdicts",
      ],
      "SDK_PROFILE_RECEIPT_SCHEMA_INVALID",
    );
    exactKeys(
      parsedReceipt.source,
      [
        "sourceCommit",
        "sourceTreeSha256",
        "manifestSha256",
        "lockfileSha256",
        "sharedDispatcherSha256",
        "counterSourceSha256",
        "phaseCounterCoreSha256",
        "settlementGateSourceSha256",
        "settlementAdapterSourceSha256",
        "settlementCoreSourceSha256",
        "fakeAdapterSourceSha256",
      ],
      "SDK_PROFILE_SOURCE_SCHEMA_INVALID",
    );
    exactKeys(
      parsedReceipt.staticVerdicts,
      [
        "machOClosure",
        "twoExportsOnly",
        "importsClosed",
        "soleRawSettlementCallSiteInAdapter",
        "counterMutationSitesClosed",
        "recorderCallSitesClosed",
        "phaseCoreCallSitesClosed",
        "phaseFixtureStandalone",
        "phaseFixtureCoordinationClosed",
        "normalObservationStringsAbsent",
      ],
      "SDK_PROFILE_STATIC_VERDICTS_SCHEMA_INVALID",
    );
    if (
      JSON.stringify(parsedReceipt.controlFlow) !==
        JSON.stringify(candidate.controlFlow) ||
      JSON.stringify(parsedReceipt.verificationTools) !==
        JSON.stringify(candidate.verificationTools) ||
      JSON.stringify(parsedReceipt.toolPolicy) !==
        JSON.stringify(candidate.toolPolicy) ||
      Object.values(parsedReceipt.staticVerdicts).some(
        (verdict) => verdict !== true,
      )
    )
      fail("SDK_PROFILE_RECEIPT_POLICY_INVALID");
  }
  const inventoryPath = join(archiveRoot, "approved-archive-inventory.txt");
  if (
    sha(readFileSync(inventoryPath)) !==
    approval.dependencyPolicy.approvedArchiveInventorySha256
  )
    fail("SDK_ARCHIVE_INVENTORY_MISMATCH");
  const actualArchiveInventory = renderArchiveInventory(
    filesBelow(archiveRoot)
      .filter((path) => path !== inventoryPath)
      .map((path) => {
        const metadata = lstatSync(path);
        return {
          path: relative(archiveRoot, path),
          mode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
          size: metadata.size,
          sha256: sha(readFileSync(path)),
        };
      }),
  );
  if (actualArchiveInventory !== readFileSync(inventoryPath, "utf8"))
    fail("SDK_ARCHIVE_INVENTORY_MISMATCH");

  const cargoHome = join(runRoot, "cargo-home");
  const cargoTarget = join(runRoot, "cargo-target");
  if (existsSync(cargoHome) || existsSync(cargoTarget))
    fail("SDK_CLEAN_BUILD_REQUIRED");
  mkdirSync(cargoHome, { recursive: true, mode: 0o700 });
  cpSync(join(archiveRoot, "cargo-home"), cargoHome, { recursive: true });
  const reproduction = join(runRoot, "reproduction");
  mkdirSync(reproduction, { recursive: true, mode: 0o700 });
  const verifier = join(
    repository,
    "apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk-v2.mjs",
  );
  run(
    process.execPath,
    [
      verifier,
      "--phase",
      "reproduce",
      "--run-root",
      reproduction,
      "--proposed-checkin-root",
      join(reproduction, "proposed-checkin"),
      "--root-user-review-report",
      join(reproduction, "candidate/root-user-review.json"),
      "--approved-archive-root",
      archiveRoot,
      "--source-commit",
      approvedNormalReceipt.source.sourceCommit,
    ],
    {
      cwd: repository,
      timeout: 300_000,
      code: "SDK_REPRODUCTION_FAILED",
    },
  );
  for (const profile of approval.profiles) {
    const rebuiltReceipt = join(
      reproduction,
      "proposed-checkin",
      profile.receiptPath,
    );
    const rebuiltProfileReceiptSha256 = sha(readFileSync(rebuiltReceipt));
    if (rebuiltProfileReceiptSha256 !== profile.receiptSha256)
      fail("SDK_REBUILT_RECEIPT_MISMATCH_BEFORE_LOAD");
    const artifactName = profile.profile.replaceAll(
      /[A-Z]/g,
      (value) => `-${value.toLowerCase()}`,
    );
    const rebuiltArtifact = join(
      reproduction,
      "candidate/artifacts",
      `${artifactName}.node`,
    );
    const rebuiltArtifactSha256 = sha(readFileSync(rebuiltArtifact));
    if (rebuiltArtifactSha256 !== profile.artifactSha256)
      fail("SDK_REBUILT_ARTIFACT_MISMATCH_BEFORE_LOAD");
    reproductionResults.push({
      profile: profile.profile,
      approvedArtifactSha256: profile.artifactSha256,
      rebuiltArtifactSha256,
      approvedProfileReceiptSha256: profile.receiptSha256,
      rebuiltProfileReceiptSha256,
      artifactMatches: rebuiltArtifactSha256 === profile.artifactSha256,
      profileReceiptMatches:
        rebuiltProfileReceiptSha256 === profile.receiptSha256,
    });
  }
  const rebuiltGuard = join(
    reproduction,
    "candidate/fixtures/guard-page-node-api.node",
  );
  if (
    sha(readFileSync(rebuiltGuard)) !==
    approval.verificationTools.guardArtifactSha256
  )
    fail("SDK_REBUILT_GUARD_FIXTURE_MISMATCH_BEFORE_LOAD");
  const rebuiltPhaseFixture = join(
    reproduction,
    "candidate/fixtures/controlled-phase-core",
  );
  if (
    sha(readFileSync(rebuiltPhaseFixture)) !==
    approval.verificationTools.phaseFixtureArtifactSha256
  )
    fail("SDK_REBUILT_PHASE_FIXTURE_MISMATCH_BEFORE_EXECUTION");

  const selectedCli = approval.toolPolicy.tools.openCode.path;
  if (
    approval.toolPolicy.tools.openCode.version !== "0.0.0-beta-17595" ||
    ambientOpenCode.executed !== false
  )
    fail("SDK_OPENCODE_PIN_INVALID");

  const vectors = join(runRoot, "parity-vectors.json");
  const vectorBuilder = join(
    repository,
    "apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs",
  );
  run(process.execPath, [vectorBuilder, "--emit-sdk-vectors", vectors], {
    cwd: repository,
    code: "SDK_VECTOR_BUILD_FAILED",
  });
  const harness = join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk-v2.acceptance.ts",
  );
  const sandboxPolicy = `(version 1)(allow default)(deny network*)(deny file-write* (subpath ${JSON.stringify(repository)}))(deny file-read* (subpath ${JSON.stringify(join(repository, "apps/plugin/opencode2/src"))}) (subpath ${JSON.stringify(join(repository, "apps/plugin/opencode2/dist"))}) (subpath ${JSON.stringify(join(repository, ".opencode"))}))`;
  const lifecycle = [];
  const gateResults = {
    promiseOutcomesObserved: false,
    parityBytesMatched: false,
    counterVectorsMatched: false,
    concurrencyIsolated: false,
    controlledPhaseCoreInterleaving: false,
    settlementAtMostOnce: false,
    adapterFailureNotRetried: false,
    adapterPanicNotRetried: false,
    observationBunOnly: false,
    openCodeNormalOnly: false,
    lifecyclePassed: false,
    confinementPassed: false,
    packagingAbsent: false,
    regressionsPassed: false,
  };
  const guardLoadRoot = join(runRoot, "load", "guard");
  mkdirSync(guardLoadRoot, { recursive: true, mode: 0o700 });
  const copiedGuard = join(
    guardLoadRoot,
    `${approval.verificationTools.guardArtifactSha256}.node`,
  );
  copyFileSync(rebuiltGuard, copiedGuard);
  chmodSync(copiedGuard, 0o500);
  if (
    sha(readFileSync(copiedGuard)) !==
    approval.verificationTools.guardArtifactSha256
  )
    fail("SDK_GUARD_LOAD_COPY_INVALID");
  let actualAddonWidthResults = [];
  for (const profile of approval.profiles) {
    const artifactName = profile.profile.replaceAll(
      /[A-Z]/g,
      (value) => `-${value.toLowerCase()}`,
    );
    const source = join(
      reproduction,
      "candidate/artifacts",
      `${artifactName}.node`,
    );
    const loadRoot = join(runRoot, "load", profile.profile);
    mkdirSync(loadRoot, { recursive: true, mode: 0o700 });
    const copied = join(loadRoot, `${profile.artifactSha256}.node`);
    copyFileSync(source, copied);
    chmodSync(copied, 0o500);
    if (
      !statSync(copied).isFile() ||
      sha(readFileSync(copied)) !== profile.artifactSha256
    )
      fail("SDK_LOAD_COPY_INVALID");
    const child = run(
      "/usr/bin/sandbox-exec",
      [
        "-p",
        sandboxPolicy,
        process.execPath,
        harness,
        "--addon",
        copied,
        "--sha256",
        profile.artifactSha256,
        "--profile",
        profile.profile,
        "--vectors",
        vectors,
        "--guard-fixture",
        copiedGuard,
        "--guard-sha256",
        approval.verificationTools.guardArtifactSha256,
        "--deny-path",
        join(repository, "apps/plugin/opencode2/src"),
        "--deny-write",
        join(repository, ".sdk-write-forbidden"),
        "--deny-network",
        "1",
      ],
      {
        cwd: loadRoot,
        timeout: 15_000,
        code: "SDK_BUN_PROFILE_FAILED",
      },
    );
    if (child.stderr) fail("SDK_CHILD_STDERR_LEAK");
    const childResult = JSON.parse(child.stdout.trim());
    if (
      childResult.status !== "suite-pass" ||
      childResult.profile !== profile.profile ||
      !Array.isArray(childResult.actualAddonWidthResults)
    )
      fail("SDK_PROFILE_RESULT_INVALID");
    if (profile.profile === "controlFlowObservation") {
      actualAddonWidthResults = childResult.actualAddonWidthResults;
    } else if (childResult.actualAddonWidthResults.length !== 0) {
      fail("SDK_NON_OBSERVATION_WIDTH_EVIDENCE_FORBIDDEN");
    }
    lifecycle.push({
      profile: profile.profile,
      outputSha256: sha(child.stdout),
    });
  }
  gateResults.promiseOutcomesObserved = lifecycle.length === 5;
  gateResults.parityBytesMatched = lifecycle.length === 5;
  gateResults.counterVectorsMatched = lifecycle.some(
    ({ profile }) => profile === "controlFlowObservation",
  );
  const expectedWidths = [1, 2, 8, 32];
  actualAddonWidthResults.forEach((result) =>
    exactKeys(
      result,
      [
        "width",
        "requestCount",
        "distinctByteLengths",
        "parityMatches",
        "counterVectorMatches",
        "passed",
      ],
      "SDK_ACTUAL_ADDON_WIDTH_SCHEMA_INVALID",
    ),
  );
  gateResults.concurrencyIsolated = deriveConcurrencyIsolated(
    actualAddonWidthResults,
  );
  if (!gateResults.concurrencyIsolated)
    fail("SDK_ACTUAL_ADDON_WIDTH_MATRIX_INVALID");
  writeFileSync(
    join(runRoot, "actual-addon-width-results.json"),
    `${JSON.stringify(actualAddonWidthResults, null, 2)}\n`,
    { mode: 0o600 },
  );
  gateResults.observationBunOnly =
    lifecycle.filter(({ profile }) => profile === "controlFlowObservation")
      .length === 1;

  const phaseFixtureLoadRoot = join(runRoot, "phase-fixture");
  mkdirSync(phaseFixtureLoadRoot, { recursive: true, mode: 0o700 });
  const phaseFixture = join(
    phaseFixtureLoadRoot,
    approval.verificationTools.phaseFixtureArtifactSha256,
  );
  copyFileSync(rebuiltPhaseFixture, phaseFixture);
  chmodSync(phaseFixture, 0o500);
  if (
    sha(readFileSync(phaseFixture)) !==
    approval.verificationTools.phaseFixtureArtifactSha256
  )
    fail("SDK_PHASE_FIXTURE_COPY_INVALID");
  const phaseTranscriptResults = [];
  for (const width of expectedWidths) {
    for (const permutation of [
      "forward-forward",
      "forward-reverse",
      "reverse-rotate-reverse",
    ]) {
      const result = run(phaseFixture, [String(width), permutation], {
        cwd: phaseFixtureLoadRoot,
        env: { LC_ALL: "C" },
        timeout: 15_000,
        code: "SDK_PHASE_FIXTURE_CASE_FAILED",
      });
      phaseTranscriptResults.push(
        validatePhaseTranscript(
          result.stdout,
          result.stderr,
          width,
          permutation,
        ),
      );
    }
  }
  gateResults.controlledPhaseCoreInterleaving =
    deriveControlledPhaseCoreInterleaving(phaseTranscriptResults);
  if (!gateResults.controlledPhaseCoreInterleaving)
    fail("SDK_PHASE_FIXTURE_MATRIX_INVALID");
  writeFileSync(
    join(runRoot, "controlled-phase-transcript-results.json"),
    `${JSON.stringify(phaseTranscriptResults, null, 2)}\n`,
    { mode: 0o600 },
  );

  const normalProfile = approval.profiles[0];
  const normalPath = join(
    runRoot,
    "load",
    "normal",
    `${normalProfile.artifactSha256}.node`,
  );
  const hardware = {
    memoryBytes: Number(
      run("/usr/sbin/sysctl", ["-n", "hw.memsize"], {}).stdout.trim(),
    ),
    logicalCpu: Number(
      run("/usr/sbin/sysctl", ["-n", "hw.logicalcpu"], {}).stdout.trim(),
    ),
  };
  const parentBefore = await sampleProcess(process.pid);
  const lifecyclePoints = await runLifecycleMatrix({
    bun: approval.toolPolicy.tools.bun.path,
    harness,
    addon: normalPath,
    digest: normalProfile.artifactSha256,
    runRoot,
    environment: activeEnvironment,
  });
  const freshProcesses = runFreshProcessSeries({
    bun: approval.toolPolicy.tools.bun.path,
    harness,
    addon: normalPath,
    digest: normalProfile.artifactSha256,
    runRoot,
    environment: activeEnvironment,
  });
  const parentAfter = await sampleProcess(process.pid);
  if (
    parentAfter.rssKiB > 524_288 ||
    parentAfter.rssKiB - parentBefore.rssKiB > 65_536 ||
    parentAfter.threads > 64 ||
    parentAfter.threads - parentBefore.threads > 4
  )
    fail("SDK_PARENT_LIFECYCLE_LIMIT_FAILED");
  writeFileSync(
    join(runRoot, "lifecycle-metrics.json"),
    `${JSON.stringify({ hardware, lifecyclePoints, freshProcesses, parentBefore, parentAfter }, null, 2)}\n`,
    { mode: 0o600 },
  );
  const namedLifecycleResults = {};
  for (const mode of [
    "close-no-work",
    "close-saturation",
    "concurrency-limit",
    "abrupt-exit",
  ]) {
    const result = run(
      process.execPath,
      [
        harness,
        "--mode",
        mode,
        "--addon",
        normalPath,
        "--sha256",
        normalProfile.artifactSha256,
      ],
      {
        cwd: runRoot,
        timeout: 15_000,
        code: `SDK_NAMED_LIFECYCLE_FAILED:${mode}`,
      },
    );
    const observed = JSON.parse(result.stdout.trim());
    const expectedStatus =
      mode === "abrupt-exit"
        ? "abrupt-work-dispatched"
        : "named-lifecycle-pass";
    namedLifecycleResults[mode] =
      observed.status === expectedStatus && observed.mode === mode;
    if (!namedLifecycleResults[mode])
      fail(`SDK_NAMED_LIFECYCLE_RESULT_INVALID:${mode}`);
  }
  const subsequentClean = run(
    process.execPath,
    [
      harness,
      "--mode",
      "fresh-process",
      "--addon",
      normalPath,
      "--sha256",
      normalProfile.artifactSha256,
    ],
    {
      cwd: runRoot,
      timeout: 15_000,
      code: "SDK_SUBSEQUENT_CLEAN_CHILD_FAILED",
    },
  );
  namedLifecycleResults.subsequentCleanChild =
    JSON.parse(subsequentClean.stdout.trim()).status === "lifecycle-pass";
  if (!namedLifecycleResults.subsequentCleanChild)
    fail("SDK_SUBSEQUENT_CLEAN_CHILD_RESULT_INVALID");
  writeFileSync(
    join(runRoot, "named-lifecycle-results.json"),
    `${JSON.stringify(namedLifecycleResults, null, 2)}\n`,
    { mode: 0o600 },
  );
  gateResults.lifecyclePassed =
    lifecycle.length === 5 &&
    freshProcesses.runs === 100 &&
    Object.values(namedLifecycleResults).every(Boolean);

  const fakeSource = join(
    repository,
    "apps/runtime/native-node-api-qualification/tests/fixtures/fake-settlement-adapter.rs",
  );
  const fakeBinary = join(runRoot, "fake-settlement-adapter");
  run(
    "rustc",
    [
      fakeSource,
      "-C",
      "strip=symbols",
      `--remap-path-prefix=${repository}=<repository>`,
      "-o",
      fakeBinary,
    ],
    {
      cwd: repository,
      code: "SDK_FAKE_ADAPTER_COMPILE_FAILED",
    },
  );
  if (
    sha(readFileSync(fakeBinary)) !==
    approval.verificationTools.fakeAdapterArtifactSha256
  )
    fail("SDK_FAKE_ADAPTER_REPRODUCTION_MISMATCH");
  const fakeResult = run(fakeBinary, [], {
    cwd: runRoot,
    env: { LC_ALL: "C" },
    code: "SDK_FAKE_ADAPTER_VECTOR_FAILED",
  });
  const fakeRows = fakeResult.stdout.trim().split("\n");
  if (
    fakeResult.stderr !== "" ||
    fakeRows.length !== 30 ||
    fakeRows.some(
      (row) =>
        row.split("\t").slice(-4).join("\t") !==
        "1\t1\tAttempted\tAlreadyAttempted",
    )
  )
    fail("SDK_FAKE_ADAPTER_VECTOR_RESULT_INVALID");
  gateResults.settlementAtMostOnce = fakeRows.length === 30;
  gateResults.adapterFailureNotRetried =
    fakeRows.filter((row) => row.includes("\tfailure\t")).length === 10;
  gateResults.adapterPanicNotRetried =
    fakeRows.filter((row) => row.includes("\tpanic\t")).length === 10;

  const pluginRoot = join(runRoot, "opencode-test-plugin");
  mkdirSync(pluginRoot, { recursive: true, mode: 0o700 });
  writeFileSync(
    join(pluginRoot, "qualification-plugin.ts"),
    `import { createRequire } from "node:module"; export default async function(){ const sdk=createRequire(import.meta.url)(${JSON.stringify(normalPath)}); const info=JSON.parse(new TextDecoder().decode(sdk.qualificationInfo())); if(info.schemaVersion!==1) throw new Error("SDK_COMPOSITION_INFO_FAILED"); const request=new TextEncoder().encode('{"protocolVersion":1,"requestId":"sdk-opencode-compose","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\\n'); const expected='{"protocolVersion":1,"requestId":"sdk-opencode-compose","status":"ok","result":{"bytesBase64":"bnVsbA==","byteLength":4}}\\n'; if(new TextDecoder().decode(await sdk.execute(request))!==expected) throw new Error("SDK_COMPOSITION_PROBE_FAILED"); return {}; }\n`,
    { mode: 0o600 },
  );
  writeFileSync(
    join(pluginRoot, "opencode.json"),
    JSON.stringify({ plugin: [join(pluginRoot, "qualification-plugin.ts")] }),
    { mode: 0o600 },
  );
  const cli = selectedCli;
  const opencodePolicy = `(version 1)(allow default)(deny network*)(deny file-read* (subpath ${JSON.stringify(join(repository, "apps/plugin/opencode2/src"))}) (subpath ${JSON.stringify(join(repository, "apps/plugin/opencode2/dist"))}) (subpath ${JSON.stringify(join(repository, ".opencode"))}))(deny file-write* (subpath ${JSON.stringify(repository)}))`;
  const openCodeResult = run(
    "/usr/bin/sandbox-exec",
    ["-p", opencodePolicy, cli, "debug", "config"],
    {
      cwd: pluginRoot,
      timeout: 15_000,
      code: "SDK_OPENCODE_PROBE_FAILED",
    },
  );
  gateResults.openCodeNormalOnly = openCodeResult.status === 0;

  const packagingBeforeCleanup = verifyPackagingAbsence({
    repository,
    runRoot,
    generatedPluginRoot: pluginRoot,
    verificationTools: approval.verificationTools,
    stage: "before-cleanup",
  });

  activeEnvironment = {
    ...activeEnvironment,
    CARGO_TARGET_DIR: activeEnvironment.SDK_REGRESSION_CARGO_TARGET_DIR,
  };
  let regressionCommandsCompleted = 0;
  for (const command of [
    ["git", ["diff", "--check"]],
    ["bun", ["--version"]],
    ["bun", ["run", "verify:legacy-memory-parity"]],
    ["bun", ["run", "--cwd", "apps/runtime", "verify"]],
    ["bun", ["run", "--cwd", "apps/plugin/opencode2", "abi:check"]],
    ["bun", ["run", "--cwd", "apps/plugin/opencode2", "verify"]],
    ["bun", ["run", "check-types"]],
    ["bun", ["run", "lint"]],
    ["bun", ["run", "build"]],
  ]) {
    run(command[0], command[1], {
      cwd: repository,
      timeout: 300_000,
      code: "SDK_REGRESSION_FAILED",
    });
    regressionCommandsCompleted += 1;
  }
  gateResults.regressionsPassed = regressionCommandsCompleted === 9;

  rmSync(join(runRoot, "load"), { recursive: true, force: true });
  rmSync(pluginRoot, { recursive: true, force: true });
  rmSync(phaseFixtureLoadRoot, { recursive: true, force: true });
  if (
    existsSync(pluginRoot) ||
    existsSync(phaseFixtureLoadRoot) ||
    existsSync(join(runRoot, "load"))
  )
    fail("SDK_QUALIFICATION_CLEANUP_FAILED");
  const packagingAfterCleanup = verifyPackagingAbsence({
    repository,
    runRoot,
    generatedPluginRoot: pluginRoot,
    verificationTools: approval.verificationTools,
    stage: "after-cleanup",
  });
  gateResults.packagingAbsent =
    packagingBeforeCleanup.pathsInspected > 0 &&
    packagingAfterCleanup.pathsInspected > 0;
  if (existsSync(join(repository, ".sdk-write-forbidden")))
    fail("SDK_CONFINEMENT_RESIDUE");
  gateResults.confinementPassed = !existsSync(
    join(repository, ".sdk-write-forbidden"),
  );
  if (Object.values(gateResults).some((verdict) => verdict !== true))
    fail("SDK_EXECUTABLE_VERDICT_INCOMPLETE");

  const acceptanceDirectory = join(runRoot, "acceptance");
  mkdirSync(acceptanceDirectory, { recursive: true, mode: 0o700 });
  const destination = join(
    acceptanceDirectory,
    "legacy-memory-node-api-sdk-v2-acceptance-receipt.json",
  );
  if (existsSync(destination)) fail("SDK_ACCEPTANCE_RECEIPT_EXISTS");
  const receipt = {
    schemaVersion: 3,
    qualification: "legacy-memory-node-api-sdk-v2",
    receiptKind: "acceptance",
    candidate: {
      path: approval.candidate.path,
      sha256: approval.candidate.sha256,
    },
    approval: {
      path: relative(repository, approvalPath),
      sha256: sha(readFileSync(approvalPath)),
      introductionCommit: introduction,
      approvalCommitParent: approval.approval.approvalCommitParent,
    },
    toolPolicy: approval.toolPolicy,
    ambientOpenCode,
    reproduction: reproductionResults,
    executableVerdicts: {
      promiseOutcomesObserved: gateResults.promiseOutcomesObserved,
      parityBytesMatched: gateResults.parityBytesMatched,
      counterVectorsMatched: gateResults.counterVectorsMatched,
      concurrencyIsolated: gateResults.concurrencyIsolated,
      controlledPhaseCoreInterleaving:
        gateResults.controlledPhaseCoreInterleaving,
      settlementAtMostOnce: gateResults.settlementAtMostOnce,
      adapterFailureNotRetried: gateResults.adapterFailureNotRetried,
      adapterPanicNotRetried: gateResults.adapterPanicNotRetried,
      observationBunOnly: gateResults.observationBunOnly,
      openCodeNormalOnly: gateResults.openCodeNormalOnly,
      lifecyclePassed: gateResults.lifecyclePassed,
      confinementPassed: gateResults.confinementPassed,
      packagingAbsent: gateResults.packagingAbsent,
      regressionsPassed: gateResults.regressionsPassed,
    },
  };
  const temporary = `${destination}.${process.pid}.tmp`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeSync(descriptor, `${JSON.stringify(receipt, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    renameSync(temporary, destination);
  } catch (error) {
    try {
      closeSync(descriptor);
    } catch {}
    rmSync(temporary, { force: true });
    throw error;
  }
  console.log("qualified");
};
