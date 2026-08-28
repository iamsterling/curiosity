import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { migrateDocument, sceneToEditorDocument } from "@crafty/editor/kernel";
import { createSeedScene } from "@crafty/scene-model";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET, PUT } from "./route";

let dataDir = "";

beforeEach(() => {
  dataDir = mkdtempSync(path.join(os.tmpdir(), "crafty-document-route-"));
  process.env.CRAFTY_DATA_DIR = dataDir;
});

afterEach(() => {
  delete process.env.CRAFTY_DATA_DIR;
  rmSync(dataDir, { recursive: true, force: true });
});

const document = () => {
  const result = migrateDocument(sceneToEditorDocument(createSeedScene()));
  if (!result.ok || !result.document) throw new Error("seed document failed");
  return result.document;
};

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("document route", () => {
  it("gets a fresh canonical document and saves it through the package store", async () => {
    const initial = await GET(new Request("http://crafty.test/api/files/card/document"), params("card"));
    expect(initial.status).toBe(200);
    expect((await initial.json()).revision).toBe(0);

    const saved = await PUT(
      new Request("http://crafty.test/api/files/card/document", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedRevision: 0, document: document() })
      }),
      params("card")
    );
    expect(saved.status).toBe(200);
    expect((await saved.json()).revision).toBe(1);

    const loaded = await GET(new Request("http://crafty.test/api/files/card/document"), params("card"));
    expect(loaded.status).toBe(200);
    expect((await loaded.json()).revision).toBe(1);
  });

  it("returns the machine-readable stale revision for a conflicting save", async () => {
    const candidate = document();
    const first = await PUT(
      new Request("http://crafty.test/api/files/card/document", {
        method: "PUT",
        body: JSON.stringify({ expectedRevision: 0, document: candidate })
      }),
      params("card")
    );
    expect(first.status).toBe(200);

    const stale = await PUT(
      new Request("http://crafty.test/api/files/card/document", {
        method: "PUT",
        body: JSON.stringify({ expectedRevision: 0, document: candidate })
      }),
      params("card")
    );
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({
      error: {
        code: "DOCUMENT_REVISION_STALE",
        message: "The document was changed by another writer.",
        details: { currentRevision: 1 }
      }
    });
  });
});
