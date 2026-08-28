import * as Schema from "effect/Schema";
import { fieldValueSchema } from "./fields.js";
import type { CollectionDefinition } from "./collection.js";
import type { Operation } from "./access.js";

/**
 * Agent tool projection: one tool per opted-in collection/operation, with
 * input and output schemas derived from the same field definitions as the
 * HTTP contracts. Collections without `agentExposed` produce no tools.
 */

export interface AgentTool {
  readonly name: string;
  readonly description: string;
  readonly collection: string;
  readonly operation: Operation;
  readonly inputSchema: unknown;
  readonly outputSchema: unknown;
}

function jsonSchemaOf(schema: Schema.Schema<unknown>): unknown {
  return Schema.toJsonSchemaDocument(schema);
}

const filterSchema = (): Schema.Schema<unknown> =>
  Schema.Struct({
    field: Schema.String,
    op: Schema.Literals(["eq", "neq", "lt", "lte", "gt", "gte", "in", "like"]),
    value: Schema.Json,
  });

const listInput = (): Schema.Schema<unknown> =>
  Schema.Struct({
    tenantId: Schema.NonEmptyString,
    filter: Schema.optional(Schema.Array(filterSchema())),
    page: Schema.optional(Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1)))),
    limit: Schema.optional(Schema.Int.pipe(Schema.check(Schema.isBetween({ minimum: 1, maximum: 100 })))),
  });

const getInput = (): Schema.Schema<unknown> =>
  Schema.Struct({
    tenantId: Schema.NonEmptyString,
    id: Schema.NonEmptyString,
  });

export function projectAgentTools(def: CollectionDefinition): ReadonlyArray<AgentTool> {
  if (!def.agentExposed) return [];
  const dataSchema = (() => {
    const fields: Record<string, Schema.Schema<unknown>> = {};
    for (const field of def.fields) fields[field.name] = fieldValueSchema(field);
    return Schema.Struct(fields);
  })();
  const entry = Schema.Struct({
    id: Schema.NonEmptyString,
    data: dataSchema,
    status: Schema.Literals(["draft", "published"]),
  });
  const tools: AgentTool[] = [
    {
      name: `cms_${def.name}_list`,
      description: `List ${def.name} entries (draft or published surface per caller permission).`,
      collection: def.name,
      operation: "list",
      inputSchema: jsonSchemaOf(listInput()),
      outputSchema: jsonSchemaOf(Schema.Array(entry)),
    },
    {
      name: `cms_${def.name}_get`,
      description: `Read a single ${def.name} entry.`,
      collection: def.name,
      operation: "read",
      inputSchema: jsonSchemaOf(getInput()),
      outputSchema: jsonSchemaOf(entry),
    },
    {
      name: `cms_${def.name}_create`,
      description: `Create a ${def.name} entry (draft).`,
      collection: def.name,
      operation: "create",
      inputSchema: jsonSchemaOf(Schema.Struct({ tenantId: Schema.NonEmptyString, data: dataSchema })),
      outputSchema: jsonSchemaOf(entry),
    },
    {
      name: `cms_${def.name}_update`,
      description: `Update a ${def.name} entry (draft).`,
      collection: def.name,
      operation: "update",
      inputSchema: jsonSchemaOf(Schema.Struct({ tenantId: Schema.NonEmptyString, id: Schema.NonEmptyString, data: dataSchema })),
      outputSchema: jsonSchemaOf(entry),
    },
    {
      name: `cms_${def.name}_publish`,
      description: `Publish the draft of a ${def.name} entry.`,
      collection: def.name,
      operation: "publish",
      inputSchema: jsonSchemaOf(getInput()),
      outputSchema: jsonSchemaOf(entry),
    },
  ];
  return tools;
}
