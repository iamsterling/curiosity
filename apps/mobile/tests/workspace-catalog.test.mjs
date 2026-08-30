import assert from "node:assert/strict";
import test from "node:test";
import {
  findProject,
  initialWorkspaceCatalog,
} from "../src/workspace-catalog.ts";
import {
  collectionForPath,
  organizationAgentsRoute,
  organizationRecentRoute,
  projectCollectionRoute,
  projectIdForRouteParam,
  projectSessionRoute,
  routeIdForParam,
} from "../src/workspace-routes.ts";

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

test("project route params preserve non-default catalog identity", () => {
  assert.equal(projectIdForRouteParam("local%3A123"), "local:123");
  assert.equal(projectIdForRouteParam(["second-project"]), "second-project");
  assert.equal(projectIdForRouteParam(undefined), "curiosity");
});

test("organization and session routes carry explicit durable scope", () => {
  assert.equal(
    organizationRecentRoute("local:org"),
    "/organizations/local%3Aorg/recent",
  );
  assert.equal(
    organizationAgentsRoute("local:org"),
    "/organizations/local%3Aorg/agents",
  );
  assert.equal(
    projectSessionRoute("local:project", "thread/1"),
    "/projects/local%3Aproject/sessions/thread%2F1",
  );
  assert.equal(collectionForPath("/projects/p/sessions/thread-1"), "sessions");
  assert.equal(collectionForPath("/projects/audio/sessions/thread-1"), "sessions");
  assert.equal(routeIdForParam("thread%2F1"), "thread/1");
});
