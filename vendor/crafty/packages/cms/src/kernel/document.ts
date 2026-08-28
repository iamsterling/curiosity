import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { assertValidOrThrow, fieldValueSchema, type FieldDefinition } from "./fields.js";
import { UnknownSchemaVersionError, UNKNOWN_SCHEMA_VERSION } from "./errors.js";

/**
 * Versioned document codecs. A stored document is an envelope
 * `{ version, data }`. Decode validates at the recorded version, upgrades
 * through an explicit version-by-version chain, and re-encodes only at the
 * latest version. Unknown or future versions are rejected — never coerced.
 */

export interface StoredEnvelope {
  readonly version: number;
  readonly data: unknown;
}

export interface VersionedSpec {
  /** All known shapes, keyed by version. */
  readonly versions: ReadonlyMap<number, ReadonlyArray<FieldDefinition>>;
  /** Explicit upgrade functions fromVersion -> data at fromVersion + 1. */
  readonly upgrades?: ReadonlyMap<number, (data: unknown) => unknown>;
}

export interface VersionedCodec {
  readonly latestVersion: number;
  decode(raw: unknown): Effect.Effect<StoredEnvelope, UnknownSchemaVersionError>;
  encode(data: unknown): StoredEnvelope;
  validate(data: Record<string, unknown>): void;
  dataCodec(): Schema.Schema<any>;
}

function decodeAt(shape: ReadonlyArray<FieldDefinition>, data: unknown): unknown {
  const fields: Record<string, Schema.Schema<any>> = {};
  for (const field of shape) {
    const value = fieldValueSchema(field);
    fields[field.name] = field.required ? value : Schema.optional(value);
  }
  // Cast: the struct is built dynamically from field schemas; the widened
  // `Schema<any>` member type hides the never decoding-services that
  // decodeUnknownSync demands, so the cast lands exactly at this boundary.
  const normalized = data && typeof data === "object" && !Array.isArray(data)
    ? Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
    : data;
  return Schema.decodeUnknownSync(Schema.Struct(fields) as any)(normalized);
}

function parseEnvelope(raw: unknown): StoredEnvelope | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const version = (raw as { version?: unknown }).version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return undefined;
  return { version, data: (raw as { data?: unknown }).data };
}

export function makeVersionedCodec(collection: string, spec: VersionedSpec): VersionedCodec {
  const versions = spec.versions;
  const latestVersion = Math.max(...versions.keys());
  const latestShape = versions.get(latestVersion);
  if (!latestShape) {
    throw new Error("versioned spec has no latest shape");
  }
  const known = [...versions.keys()];

  const dataCodec = (): Schema.Schema<any> => {
    const fields: Record<string, Schema.Schema<any>> = {};
    for (const field of latestShape) {
      const value = fieldValueSchema(field);
      fields[field.name] = field.required ? value : Schema.optional(value);
    }
    return Schema.Struct(fields);
  };

  const decode = (raw: unknown): Effect.Effect<StoredEnvelope, UnknownSchemaVersionError> => {
    const envelope = parseEnvelope(raw);
    if (envelope === undefined) {
      return Effect.fail(new UnknownSchemaVersionError({ code: UNKNOWN_SCHEMA_VERSION, collection, version: -1, known }));
    }
    const shape = versions.get(envelope.version);
    if (shape === undefined) {
      return Effect.fail(new UnknownSchemaVersionError({ code: UNKNOWN_SCHEMA_VERSION, collection, version: envelope.version, known }));
    }
    try {
      let data = decodeAt(shape, envelope.data);
      for (let v = envelope.version; v < latestVersion; v++) {
        const upgrade = spec.upgrades?.get(v);
        if (upgrade) {
          data = upgrade(data);
        }
      }
      if (envelope.version < latestVersion) {
        data = decodeAt(latestShape, data);
      }
      return Effect.succeed({ version: latestVersion, data });
    } catch {
      return Effect.fail(new UnknownSchemaVersionError({ code: UNKNOWN_SCHEMA_VERSION, collection, version: envelope.version, known }));
    }
  };

  const encode = (data: unknown): StoredEnvelope => {
    assertValidOrThrow(latestShape, data as Record<string, unknown>);
    return { version: latestVersion, data: Schema.encodeSync(dataCodec() as any)(data) };
  };

  const validate = (data: Record<string, unknown>): void => {
    assertValidOrThrow(latestShape, data);
  };

  return { latestVersion, decode, encode, validate, dataCodec };
}
