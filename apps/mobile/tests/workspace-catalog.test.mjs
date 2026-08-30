import assert from "node:assert/strict";
import test from "node:test";
import {
  findProject,
  initialWorkspaceCatalog,
} from "../src/workspace-catalog.ts";
import { projectCollectionRoute } from "../src/workspace-routes.ts";

test("dynamic routes resolve project identity from the catalog", () => {
  assert.deepEqual(findProject(initialWorkspaceCatalog.organizations, "curiosity"), {
    id: "curiosity",
    name: "Curiosity",
    organizationId: "curiosity",
  });
});

test("project routes carry stable identity without presentation query state", () => {
  assert.equal(
    projectCollectionRoute("local:123", "craft"),
    "/projects/local%3A123/craft",
  );
  assert.equal(projectCollectionRoute("curiosity", "sessions").includes("?"), false);
});
