import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import {
  derivePermissionMap,
  conjoinFilters,
  type AccessContext,
  type AccessDecision,
  type AccessRule,
  type Operation,
} from "./access.js";
import { projectAgentTools } from "./agent-tools.js";
import { parseCollectionDefinition, withField, type CollectionDefinition } from "./collection.js";
import { describeCollection } from "./descriptors.js";
import { makeVersionedCodec, type VersionedSpec } from "./document.js";
import {
  UNKNOWN_SCHEMA_VERSION,
  VALIDATION_FAILED,
  UnknownSchemaVersionError,
  ValidationFailure,
  type ValidationIssue,
} from "./errors.js";
import { assertValidOrThrow, parseFieldDefinition, validateFields, validateFieldValue } from "./fields.js";
import { richTextParagraph, type RichTextValue } from "./richtext.js";

const titleField = () => parseFieldDefinition({ name: "title", kind: "text", required: true });
const bodyField = () => parseFieldDefinition({ name: "body", kind: "richText", required: false });
const ageField = () => parseFieldDefinition({ name: "age", kind: "number", required: false });

function postDef(overrides: Partial<Parameters<typeof parseCollectionDefinition>[0]> = {}): CollectionDefinition {
  return parseCollectionDefinition({
    name: "posts",
    system: true,
    agentExposed: false,
    publicRead: true,
    previewable: true,
    fields: [titleField(), bodyField()],
    ...overrides,
  });
}

describe("field validation", () => {
  it("addresses required violations with a stable code", () => {
    const issues = validateFields(postDef().fields, {});
    expect(issues).toEqual([{ field: "title", rule: "CMS_REQUIRED_FIELD" }]);
  });

  it("addresses nested group fields with dotted paths", () => {
    const author = parseFieldDefinition({
      name: "author",
      kind: "group",
      required: true,
      constraints: { type: "group", fields: [titleField()] },
    });
    const issues = validateFields([author], { author: {} });
    expect(issues[0]).toMatchObject({ field: "author.title" });
  });

  it("reports min-length and select violations", () => {
    const slug = parseFieldDefinition({
      name: "slug",
      kind: "text",
      required: false,
      constraints: { type: "text", minLength: 3 },
    });
    const status = parseFieldDefinition({
      name: "status",
      kind: "select",
      required: false,
      constraints: { type: "select", options: ["draft", "published"] },
    });
    expect(validateFieldValue(slug, "ab", "slug")[0]?.rule).toBe("CMS_MIN_LENGTH");
    expect(validateFieldValue(status, "nope", "status")[0]?.rule).toBe("CMS_NOT_ONE_OF");
    expect(validateFieldValue(status, "draft", "status")).toEqual([]);
  });

  it("rejects malformed rich text", () => {
    const issues = validateFieldValue(bodyField(), { blocks: [{ kind: "paragraph" }] }, "body");
    expect(issues[0]?.rule).toBe("CMS_RICH_TEXT_INVALID");
  });

  it("throws a ValidationFailure carrying issues when invalid", () => {
    expect(() => assertValidOrThrow(postDef().fields, {})).toThrowError(ValidationFailure);
    try {
      assertValidOrThrow(postDef().fields, {});
      expect.unreachable();
    } catch (e) {
      const failure = e as ValidationFailure;
      expect(failure.code).toBe(VALIDATION_FAILED);
      expect(failure.issues[0]?.field).toBe("title");
    }
  });
});

describe("collection definitions", () => {
  it("parses and freezes a definition", () => {
    const def = postDef();
    expect(def.fields).toHaveLength(2);
    expect(() => {
      (def as { name: string }).name = "hacked";
    }).toThrow();
    expect(() => {
      (def.fields[0] as { required: boolean }).required = false;
    }).toThrow();
  });

  it("rejects invalid field names", () => {
    expect(() =>
      parseCollectionDefinition({
        name: "posts",
        system: true,
        agentExposed: false,
        publicRead: true,
        previewable: false,
        fields: [parseFieldDefinition({ name: "Bad Name", kind: "text", required: false })],
      }),
    ).toThrow();
  });

  it("composes new definitions without mutating the original", () => {
    const def = postDef();
    const extended = withField(def, ageField());
    expect(extended.fields).toHaveLength(3);
    expect(def.fields).toHaveLength(2);
  });
});

describe("versioned document codecs", () => {
  const v1 = [parseFieldDefinition({ name: "title", kind: "text", required: true })];
  const v2 = [
    parseFieldDefinition({ name: "title", kind: "text", required: true }),
    parseFieldDefinition({ name: "slug", kind: "text", required: false }),
  ];
  const v3 = [
    parseFieldDefinition({ name: "title", kind: "text", required: true }),
    parseFieldDefinition({ name: "slug", kind: "text", required: false }),
    parseFieldDefinition({ name: "tags", kind: "text", required: false }),
  ];
  const spec: VersionedSpec = {
    versions: new Map([[1, v1], [2, v2], [3, v3]]),
    upgrades: new Map<number, (d: unknown) => unknown>([
      [1, (d: unknown) => ({ ...(d as object), slug: "auto" })],
      [2, (d: unknown) => ({ ...(d as object), tags: undefined })],
    ]),
  };

  it("round-trips a document at the latest version", () => {
    const codec = makeVersionedCodec("posts", spec);
    const envelope = codec.encode({ title: "hello", slug: "hello", tags: "x" });
    expect(envelope.version).toBe(3);
    const decoded = Effect.runSync(codec.decode(envelope));
    expect(decoded.version).toBe(3);
    expect(decoded.data).toMatchObject({ title: "hello" });
  });

  it("upgrades an old document through the explicit chain", () => {
    const codec = makeVersionedCodec("posts", spec);
    const old = { version: 1, data: { title: "old" } };
    const decoded = Effect.runSync(codec.decode(old));
    expect(decoded.version).toBe(3);
    expect(decoded.data).toMatchObject({ title: "old", slug: "auto" });
  });

  it("rejects future versions with a stable code", () => {
    const codec = makeVersionedCodec("posts", spec);
    const exit = Effect.runSyncExit(codec.decode({ version: 4, data: {} }));
    expect(exit._tag).toBe("Failure");
    const failure = Effect.runSync(Effect.flip(codec.decode({ version: 4, data: {} })));
    expect(failure).toBeInstanceOf(UnknownSchemaVersionError);
    expect(failure.code).toBe(UNKNOWN_SCHEMA_VERSION);
    expect(failure.version).toBe(4);
  });

  it("rejects unknown versions with a stable code", () => {
    const codec = makeVersionedCodec("posts", spec);
    const failure = Effect.runSync(Effect.flip(codec.decode({ version: 7, data: {} })));
    expect(failure.code).toBe(UNKNOWN_SCHEMA_VERSION);
    expect(failure.known).toContain(3);
  });

  it("rejects data that fails the latest validation on encode", () => {
    const codec = makeVersionedCodec("posts", spec);
    expect(() => codec.encode({})).toThrowError(ValidationFailure);
  });
});

describe("rich text", () => {
  it("keeps link targets addressable as structured annotations", () => {
    const value = richTextParagraph("visit");
    (value.blocks[0]!.spans[0] as any).annotations = [{ type: "link", href: new URL("https://example.com/x") }];
    const href = value.blocks[0]?.spans[0]?.annotations?.[0]?.href;
    expect(href?.toString()).toBe("https://example.com/x");
    const asData: RichTextValue = JSON.parse(JSON.stringify(value)) as RichTextValue;
    expect(asData.blocks[0]?.spans[0]?.annotations?.[0]?.type).toBe("link");
  });
});

describe("descriptors and permission maps", () => {
  it("projects fields into descriptors", () => {
    const def = postDef();
    const descriptor = describeCollection(def, undefined);
    expect(descriptor.fields.map((f) => f.name)).toEqual(["title", "body"]);
    expect(descriptor.permissions).toBeUndefined();
    expect(descriptor.version).toBe(1);
  });

  it("derives a permission map where unreadable collections are absent", () => {
    const opMap = new Map<Operation, AccessRule>();
    opMap.set("read", () => ({ kind: "allow" }));
    opMap.set("create", () => ({ kind: "deny", code: "CMS_ACCESS_DENIED" }));
    const rulesMap = new Map([["posts", opMap]]);
    const map = derivePermissionMap(rulesMap, ["posts", "secrets"], {
      principal: { id: "u1", kind: "human" },
      tenantId: "t1",
    });
    expect(map.collections["posts"]?.read).toBe("allowed");
    expect(map.collections["posts"]?.create).toBe("denied");
    expect(map.collections["secrets"]).toBeUndefined();
  });

  it("marks constraint results as conditional", () => {
    const opMap = new Map<Operation, AccessRule>();
    opMap.set("read", () => ({ kind: "constraint", filter: { field: "author", op: "eq", value: "u1" } }));
    const rulesMap = new Map([["posts", opMap]]);
    const map = derivePermissionMap(rulesMap, ["posts"], {
      principal: { id: "u1", kind: "human" },
      tenantId: "t1",
    });
    expect(map.collections["posts"]?.read).toBe("conditional");
  });

  it("conjoins caller filters with constraints", () => {
    const filter = conjoinFilters(
      { field: "author", op: "eq", value: "u1" },
      { op: "or", clauses: [{ field: "status", op: "eq", value: "published" }] },
    );
    expect(filter.op).toBe("and");
    if (filter.op === "and") expect(filter.clauses).toHaveLength(2);
  });
});

describe("agent tools", () => {
  it("projects nothing for unexposed collections", () => {
    expect(projectAgentTools(postDef())).toEqual([]);
  });

  it("projects one tool per operation for exposed collections", () => {
    const tools = projectAgentTools(postDef({ agentExposed: true }));
    expect(tools.map((t) => t.name)).toEqual([
      "cms_posts_list",
      "cms_posts_get",
      "cms_posts_create",
      "cms_posts_update",
      "cms_posts_publish",
    ]);
    expect(tools[0]?.inputSchema).toBeTruthy();
    expect(tools[2]?.inputSchema).toBeTruthy();
  });
});
