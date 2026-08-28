import assert from "node:assert/strict";
import test from "node:test";
import {
  cgroupV2MountIsReadonly,
  parseMountInfo,
} from "./font-security-harness.mjs";

test("cgroup v2 admission requires the live mount to be read-only", () => {
  const readonly = parseMountInfo(
    "1 0 0:1 / /sys/fs/cgroup ro,nosuid,nodev,noexec - cgroup2 cgroup rw",
  );
  const writable = parseMountInfo(
    "1 0 0:1 / /sys/fs/cgroup rw,nosuid,nodev,noexec - cgroup2 cgroup rw",
  );
  assert.equal(cgroupV2MountIsReadonly(readonly), true);
  assert.equal(cgroupV2MountIsReadonly(writable), false);
});
