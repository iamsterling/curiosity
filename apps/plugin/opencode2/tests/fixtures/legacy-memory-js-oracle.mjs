import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  canonicalJSON,
  digestCanonical,
} from "../../dist/core/canonical/index.js";
import {
  decodeLedgerEntity,
  replayLedgerEvents,
} from "../../dist/features/ledger/domain.js";
import { decodeLedgerEvent, Ledger } from "../../dist/features/ledger/index.js";
import { EventCapture } from "../../dist/features/hooks/event-capture.js";

const realize = (tag) => {
  switch (tag.kind) {
    case "json":
      return tag.value;
    case "undefined":
      return undefined;
    case "function":
      return () => undefined;
    case "symbol":
      return Symbol("fixture");
    case "bigint":
      return BigInt(tag.decimal);
    case "f64": {
      const bytes = Buffer.from(tag.bits, "hex");
      return bytes.readDoubleBE();
    }
    case "array": {
      const value = [];
      tag.items.forEach((item, index) => {
        if (item.kind !== "hole") value[index] = realize(item);
      });
      value.length = tag.items.length;
      return value;
    }
    case "object":
      return Object.fromEntries(
        tag.entries.map(({ key, value }) => [key, realize(value)]),
      );
    case "objectWithSymbolKey": {
      const value = Object.fromEntries(
        tag.entries.map(({ key, value }) => [key, realize(value)]),
      );
      value[Symbol("fixture")] = realize(tag.symbolValue);
      return value;
    }
    case "cycle": {
      const value = {};
      if (tag.shape === "direct") value.self = value;
      else {
        const child = {};
        value.child = child;
        child.parent = value;
      }
      return value;
    }
    default:
      throw new Error("tag");
  }
};
const bytes = (text) => ({
  bytesBase64: Buffer.from(text).toString("base64"),
  byteLength: Buffer.byteLength(text),
});
const entries = (map) =>
  [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
const view = (value) => ({
  intents: entries(value.intents),
  work: entries(value.work),
  claims: entries(value.claims),
  evidence: value.evidence,
  approvals: entries(value.approvals),
  resolutions: entries(value.resolutions),
  facts: entries(value.facts),
  captureGaps: entries(value.captureGaps),
});
const inventoryFile = async (root, relative) => {
  const content = await readFile(path.join(root, relative));
  return {
    path: relative,
    size: content.length,
    sha256: `sha256:${createHash("sha256").update(content).digest("hex")}`,
  };
};

export const observe = async (request) => {
  const { operation, input } = request;
  try {
    if (operation === "canonicalize" || operation === "digest") {
      const value = realize(input.value);
      let text;
      try {
        text = canonicalJSON(value);
      } catch {
        return {
          status: "error",
          diagnostic: {
            code: "PARITY_CANONICALIZATION_FAILED",
            path: "/input/value",
          },
        };
      }
      if (text === undefined)
        return {
          status: "error",
          diagnostic: {
            code:
              operation === "digest"
                ? "PARITY_CANONICAL_DIGEST_FAILED"
                : "PARITY_CANONICAL_RESULT_UNDEFINED",
            path: "/input/value",
          },
        };
      return {
        status: "ok",
        result:
          operation === "digest"
            ? { ...bytes(text), digest: digestCanonical(value) }
            : bytes(text),
      };
    }
    if (operation === "decodeLedgerEntity")
      return {
        status: "ok",
        result: { value: decodeLedgerEntity(input.value) },
      };
    if (operation === "decodeLedgerEvent")
      return {
        status: "ok",
        result: { value: decodeLedgerEvent(input.value) },
      };
    if (operation === "replayLedgerEvents") {
      const value = replayLedgerEvents(input.events);
      return {
        status: "ok",
        result: {
          digest: value.digest,
          events: value.events,
          entities: entries(value.entities),
        },
      };
    }
    const fixture = path.join(
      process.env.CURIOSITY_PARITY_FIXTURE_ROOT,
      input.root,
    );
    if (operation === "inspectLedger") {
      const value = await new Ledger(fixture).snapshot();
      const names = (await import("node:fs/promises")).readdir(
        path.join(fixture, "events"),
      );
      const inventory = [
        await inventoryFile(fixture, "schema-version"),
        ...(await Promise.all(
          (await names)
            .filter((name) => name.endsWith(".json"))
            .sort()
            .map((name) => inventoryFile(fixture, `events/${name}`)),
        )),
      ].sort((a, b) => a.path.localeCompare(b.path));
      return {
        status: "ok",
        result: {
          kind: "ledger-v1",
          schemaVersion: 1,
          inventory,
          sequence: value.sequence,
          digest: value.digest,
          view: view(value),
        },
      };
    }
    if (operation === "inspectEventCapture") {
      const names = await readdir(path.join(fixture, "events")).catch(
        (error) => {
          if (error.code === "ENOENT") return [];
          throw error;
        },
      );
      let value;
      try {
        value = await new EventCapture(fixture, {
          pluginVersion: "oracle",
          hostVersion: "oracle",
        }).snapshot();
      } catch (error) {
        for (const name of names
          .filter((name) => name.endsWith(".json"))
          .sort()) {
          try {
            JSON.parse(
              await readFile(path.join(fixture, "events", name), "utf8"),
            );
          } catch {
            throw { code: "CAPTURE_CORRUPT", path: `events/${name}` };
          }
        }
        throw error;
      }
      const inventory = await Promise.all(
        names
          .filter((name) => name.endsWith(".json"))
          .sort()
          .map((name) => inventoryFile(fixture, `events/${name}`)),
      );
      try {
        inventory.push(await inventoryFile(fixture, "gaps.json"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      inventory.sort((a, b) => a.path.localeCompare(b.path));
      return {
        status: "ok",
        result: {
          kind: "event-capture-v1",
          inventory,
          events: value.events,
          gaps: value.gaps,
        },
      };
    }
    throw new Error("operation");
  } catch (error) {
    return {
      status: "error",
      diagnostic: {
        code: error.code ?? "PARITY_INTERNAL_FAILURE",
        path: error.path ?? null,
      },
    };
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  let source = "";
  for await (const chunk of process.stdin) source += chunk;
  if (process.argv.includes("--number-batch")) {
    const values = JSON.parse(source).map((bits) => {
      const bytes = Buffer.from(bits, "hex");
      return canonicalJSON(bytes.readDoubleBE());
    });
    process.stdout.write(`${JSON.stringify(values)}\n`);
    process.exit(0);
  }
  const request = JSON.parse(source);
  process.stdout.write(
    `${JSON.stringify({ protocolVersion: 1, requestId: request.requestId, ...(await observe(request)) })}\n`,
  );
}
