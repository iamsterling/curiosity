import { expect, test } from "bun:test";
import packageJson from "../package.json" with { type: "json" };

test("runtime verification builds the locked query-only release native fixture before Bun tests", () => {
  expect(packageJson.scripts["build:native"]).toBe("cargo build --manifest-path native/Cargo.toml --locked");
  expect(packageJson.scripts["build:native:release"]).toBe(
    "cargo build --manifest-path native/Cargo.toml --release --locked --no-default-features",
  );

  const releaseBuild = packageJson.scripts.verify.indexOf("bun run build:native:release");
  const bunTests = packageJson.scripts.verify.indexOf("bun test");
  expect(releaseBuild).toBeGreaterThanOrEqual(0);
  expect(bunTests).toBeGreaterThan(releaseBuild);
});
