import * as Schema from "effect/Schema";
import { FieldDefinitionSchema, freezeFieldDefinition, type FieldDefinition } from "./fields.js";

/**
 * A collection definition is the single source of truth for a content type.
 * Loading parses and deep-freezes: definitions are immutable once loaded, and
 * extension composes new definitions rather than mutating loaded ones.
 */

export const CollectionName = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(new RegExp("^[a-z][a-zA-Z0-9_-]*$"))),
);

export const CollectionDefinitionSchema = Schema.Struct({
  name: CollectionName,
  label: Schema.optional(Schema.String),
  system: Schema.Boolean,
  /** Opt-in surface for agent tools. Off by default, per the API spec. */
  agentExposed: Schema.Boolean,
  /** Published surface is servable to anonymous readers. */
  publicRead: Schema.Boolean,
  /** Admin live preview is offered for this collection. */
  previewable: Schema.Boolean,
  /** Integer schema version of this definition. */
  version: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1))),
  fields: Schema.Array(FieldDefinitionSchema),
  /** Bounded whole-document version retention per entry. */
  versionsMax: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1))),
});
export type CollectionDefinition = Schema.Schema.Type<typeof CollectionDefinitionSchema>;

export interface CollectionDefinitionInput {
  readonly name: string;
  readonly label?: string | undefined;
  readonly system: boolean;
  readonly agentExposed: boolean;
  readonly publicRead: boolean;
  readonly previewable: boolean;
  readonly version?: number;
  readonly fields: ReadonlyArray<{
    readonly name: string;
    readonly kind: string;
    readonly label?: string | undefined;
    readonly required: boolean;
    readonly constraints?: unknown;
    readonly defaultValue?: unknown;
    readonly description?: string | undefined;
  }>;
  readonly versionsMax?: number;
}

export function parseCollectionDefinition(input: CollectionDefinitionInput): CollectionDefinition {
  // Cast: the definition schema is recursive through field definitions; see
  // parseFieldDefinition for the same boundary note.
  return freezeCollectionDefinition(Schema.decodeUnknownSync(CollectionDefinitionSchema as any)({
    version: 1,
    versionsMax: 100,
    ...input,
  }));
}

export function freezeCollectionDefinition(def: CollectionDefinition): CollectionDefinition {
  def.fields.forEach(freezeFieldDefinition);
  Object.freeze(def.fields);
  return Object.freeze(def);
}

/** Field lookups on a loaded (frozen) definition. */
export function fieldByName(def: CollectionDefinition, name: string): FieldDefinition | undefined {
  return def.fields.find((f) => f.name === name);
}

export function withField(def: CollectionDefinition, field: FieldDefinition): CollectionDefinition {
  if (def.fields.some((f) => f.name === field.name)) {
    throw new Error(`field ${field.name} already defined on ${def.name}`);
  }
  return freezeCollectionDefinition({ ...def, fields: [...def.fields, field] });
}
