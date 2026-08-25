import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const q1 = resolve(import.meta.dir, "..");
const repositoryRoot = resolve(q1, "../../../../..");

const digest = async (path: string) => {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(await Bun.file(path).arrayBuffer());
  return hasher.digest("hex");
};

describe("Q1-T01 retained-record completeness", () => {
  test("every bounded candidate has a verdict record", async () => {
    const required = [
      "ENTRY.md",
      "Q1-E01-candidate-matrix.md",
      "records/effect-4.0.0-beta.107.md",
      "records/build-test-stack.md",
      "records/ai-sdk.md",
      "records/sqlite-rust-tuple.md",
      "records/rust-toolchain-supervisor.md",
      "records/git-backends.md",
      "records/provenance-invalidation.md",
      "licenses/README.md",
    ];
    expect(required.filter((path) => !existsSync(join(q1, path)))).toEqual([]);

    const matrix = await readFile(
      join(q1, "Q1-E01-candidate-matrix.md"),
      "utf8",
    );
    for (const term of [
      "effect@4.0.0-beta.107",
      "**QUALIFIED**",
      "REJECTED_NO_CANDIDATE",
      "**UNKNOWN**",
      "I7",
      "Q2",
      "Q3",
    ]) {
      expect(matrix).toContain(term);
    }
  });

  test("qualified candidate license and notice bytes match retained digests", async () => {
    const expected = {
      "effect-4.0.0-beta.107-MIT.txt":
        "774c3bc5924ad8ae6c5a75f1c53db13feb238ade15989625c513d07b60dedf30",
      "typescript-5.9.2-Apache-2.0.txt":
        "a7d00bfd54525bc694b6e32f64c7ebcf5e6b7ae3657be5cc12767bce74654a47",
      "typescript-5.9.2-ThirdPartyNoticeText.txt":
        "1af3c68039c57e539422da82a4faada506ce6d0ea6f90e0b699d02dbcdb7a90c",
      "turbo-2.10.10-MIT.txt":
        "f7ac4712aa30551de5b97b30215010515d783638107f207bcce32a85bfffc05e",
      "bun-1.3.14-LICENSE.md":
        "2c6160ec8fb853f7e8f97d9b249e756c9b0ac44860a68b6bf4f1b0bcbc5c3741",
      "node-24.18.0-LICENSE.txt":
        "148eacf7863ef4329224a29398623077200a27194aa075569faf4a0a85566ca5",
    };
    for (const [file, sha256] of Object.entries(expected)) {
      expect(await digest(join(q1, "licenses", file))).toBe(sha256);
    }
  });

  test("qualified lock integrities remain present at the canonical root", async () => {
    const lock = await readFile(join(repositoryRoot, "bun.lock"), "utf8");
    for (const integrity of [
      "sha512-OoBAv8eF+yanc+C6xhgEUnWeXUSHA6ynnscYqpkAY9GSnzZWystsIjBowVqCkLpHGlnRtdIqYT3wHwpOY6JDnQ==",
      "sha512-CWBzXQrc/qOkhidw1OzBTQuYRbfyxDXJMVJ1XNwUHGROVmuaeiEm3OslpZ1RV96d7SKKjZKrSJu3+t/xlw3R9A==",
      "sha512-/90KTW+USzvYOPmafRZHVKLBsHXQ5810Ao/HdtJYAqguIhZ+XruS6eIUjqJUDtrSxaZYynNFht68qckGKAOWTA==",
      "sha512-VZYsxZ6yjyDosUqtiroAVSXPLmx/qBxdHJgIxdMH9RyNmLdOLOWtJnYMnI4qckwCgQMK85G3fu94/xk5+iBCgw==",
    ]) {
      expect(lock).toContain(integrity);
    }
  });
});
