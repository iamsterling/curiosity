import * as Schema from "effect/Schema";
import { validationFailure, type ValidationIssue } from "./errors.js";
import { RichTextValueSchema } from "./richtext.js";

export const FIELD_NAME_PATTERN: string = "^[a-z][a-zA-Z0-9_]*$";

export const FieldName = Schema.NonEmptyString.pipe(
  Schema.check(Schema.isPattern(new RegExp(FIELD_NAME_PATTERN))),
);

export const FieldKind = Schema.Literals(["text", "number", "boolean", "datetime", "select", "richText", "reference", "asset", "group", "array"]);
export type FieldKind = Schema.Schema.Type<typeof FieldKind>;

export const MimeTypePattern = Schema.String.pipe(
  Schema.check(Schema.isPattern(new RegExp("^[a-z0-9]+/[a-z0-9.+-]+$"))),
);

const PositiveInt = Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(1)));
const NonNegativeInt = Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0)));

export const TextConstraints = Schema.Struct({
  minLength: Schema.optional(NonNegativeInt),
  maxLength: Schema.optional(PositiveInt),
  pattern: Schema.optional(Schema.String),
});

export const NumberConstraints = Schema.Struct({
  min: Schema.optional(Schema.Number),
  max: Schema.optional(Schema.Number),
  integer: Schema.optional(Schema.Boolean),
});

export const SelectConstraints = Schema.Struct({
  options: Schema.NonEmptyArray(Schema.String),
});

export const ReferenceConstraints = Schema.Struct({
  targetCollection: Schema.NonEmptyString,
});

export const AssetConstraints = Schema.Struct({
  accept: Schema.optional(Schema.Array(MimeTypePattern)),
});

export const FieldConstraints = Schema.Union([
  Schema.Struct({ type: Schema.Literals(["text"]), ...TextConstraints.fields }),
  Schema.Struct({ type: Schema.Literals(["number"]), ...NumberConstraints.fields }),
  Schema.Struct({ type: Schema.Literals(["boolean"]) }),
  Schema.Struct({ type: Schema.Literals(["datetime"]) }),
  Schema.Struct({ type: Schema.Literals(["select"]), ...SelectConstraints.fields }),
  Schema.Struct({ type: Schema.Literals(["richText"]) }),
  Schema.Struct({ type: Schema.Literals(["reference"]), ...ReferenceConstraints.fields }),
  Schema.Struct({ type: Schema.Literals(["asset"]), ...AssetConstraints.fields }),
  Schema.Struct({ type: Schema.Literals(["group"]), fields: Schema.Array(Schema.suspend((): Schema.Schema<any> => FieldDefinitionSchema)) }),
  Schema.Struct({ type: Schema.Literals(["array"]), item: Schema.suspend((): Schema.Schema<any> => FieldDefinitionSchema) }),
]);
export type FieldConstraints = Schema.Schema.Type<typeof FieldConstraints>;

export const FieldDefinitionSchema = Schema.Struct({
  name: FieldName,
  kind: FieldKind,
  label: Schema.optional(Schema.String),
  required: Schema.Boolean,
  constraints: Schema.optional(FieldConstraints),
  defaultValue: Schema.optional(Schema.Json),
  description: Schema.optional(Schema.String),
});
export type FieldDefinition = Schema.Schema.Type<typeof FieldDefinitionSchema>;

export interface FieldDefinitionInput {
  readonly name: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly required: boolean;
  readonly constraints?: unknown;
  readonly defaultValue?: unknown;
  readonly description?: string | undefined;
}

export function parseFieldDefinition(input: FieldDefinitionInput): FieldDefinition {
  // Cast: the definition schema is recursive (group/array embed field
  // definitions), and the widened recursive edge hides decoding-services —
  // runtime behavior is unaffected; this is a v4-beta typing boundary.
  return Schema.decodeUnknownSync(FieldDefinitionSchema as any)(input);
}

export function freezeFieldDefinition(field: FieldDefinition): FieldDefinition {
  if (field.constraints && field.constraints.type === "group") {
    field.constraints.fields.forEach(freezeFieldDefinition);
    Object.freeze(field.constraints.fields);
  } else if (field.constraints && field.constraints.type === "array") {
    freezeFieldDefinition(field.constraints.item);
  }
  if (field.constraints?.type === "select") Object.freeze(field.constraints.options);
  if (field.constraints?.type === "asset" && field.constraints.accept) Object.freeze(field.constraints.accept);
  if (field.constraints) Object.freeze(field.constraints);
  Object.freeze(field);
  return field;
}

const BAD_TYPE_ISSUE = (field: string): ValidationIssue => ({ field, rule: "CMS_BAD_TYPE" });

/** Builds the per-kind value schema for a field. `select` needs its options. */
export function fieldValueSchema(field: FieldDefinition): Schema.Schema<any> {
  switch (field.kind) {
    case "text":
      return Schema.String;
    case "number":
      return Schema.Number;
    case "boolean":
      return Schema.Boolean;
    case "datetime":
      return Schema.DateTimeUtcFromString;
    case "select": {
      const constraints = field.constraints?.type === "select" ? field.constraints : null;
      if (constraints) {
        return Schema.Literals(constraints.options);
      }
      return Schema.String;
    }
    case "richText":
      return RichTextValueSchema;
    case "reference":
    case "asset":
      return Schema.NonEmptyString;
    case "group": {
      const constraints = field.constraints?.type === "group" ? field.constraints : null;
      if (!constraints) return Schema.Record(Schema.String, Schema.Json) as any;
      const fields: Record<string, Schema.Schema<any>> = {};
      for (const sub of constraints.fields) fields[sub.name] = fieldValueSchema(sub);
      return Schema.Struct(fields) as any;
    }
    case "array": {
      const constraints = field.constraints?.type === "array" ? field.constraints : null;
      const item = constraints ? fieldValueSchema(constraints.item) : Schema.Json;
      return Schema.Array(item);
    }
  }
}

/**
 * Validates a field value against its kind and constraints, returning a
 * field-addressed issue list. `path` is the dotted field path prefix.
 */
export function validateFieldValue(field: FieldDefinition, value: unknown, path: string): ReadonlyArray<ValidationIssue> {
  const issues: ValidationIssue[] = [];
  if (value === undefined || value === null) {
    if (field.required) {
      issues.push({ field: path, rule: "CMS_REQUIRED_FIELD" });
    }
    return issues;
  }
  const constraints = field.constraints;
  switch (field.kind) {
    case "text": {
      if (typeof value !== "string") {
        issues.push(BAD_TYPE_ISSUE(path));
      } else if (constraints?.type === "text") {
        if (constraints.minLength !== undefined && value.length < constraints.minLength) {
          issues.push({ field: path, rule: "CMS_MIN_LENGTH", detail: `min=${constraints.minLength}` });
        }
        if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
          issues.push({ field: path, rule: "CMS_MAX_LENGTH", detail: `max=${constraints.maxLength}` });
        }
        if (constraints.pattern !== undefined && !new RegExp(constraints.pattern).test(value)) {
          issues.push({ field: path, rule: "CMS_PATTERN" });
        }
      }
      break;
    }
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        issues.push(BAD_TYPE_ISSUE(path));
      } else if (constraints?.type === "number") {
        if (constraints.integer === true && !Number.isInteger(value)) {
          issues.push({ field: path, rule: "CMS_BAD_TYPE", detail: "integer" });
        }
        if (constraints.min !== undefined && value < constraints.min) {
          issues.push({ field: path, rule: "CMS_MIN_VALUE", detail: `min=${constraints.min}` });
        }
        if (constraints.max !== undefined && value > constraints.max) {
          issues.push({ field: path, rule: "CMS_MAX_VALUE", detail: `max=${constraints.max}` });
        }
      }
      break;
    }
    case "boolean":
      if (typeof value !== "boolean") issues.push(BAD_TYPE_ISSUE(path));
      break;
    case "datetime": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        issues.push(BAD_TYPE_ISSUE(path));
      }
      break;
    }
    case "select": {
      if (typeof value !== "string") {
        issues.push(BAD_TYPE_ISSUE(path));
      } else if (constraints?.type === "select" && !constraints.options.includes(value)) {
        issues.push({ field: path, rule: "CMS_NOT_ONE_OF", detail: `allowed=${constraints.options.join(",")}` });
      }
      break;
    }
    case "richText": {
      try {
        Schema.decodeUnknownSync(RichTextValueSchema as any)(value);
      } catch {
        issues.push({ field: path, rule: "CMS_RICH_TEXT_INVALID" });
      }
      break;
    }
    case "reference":
    case "asset":
      if (typeof value !== "string" || value.length === 0) issues.push(BAD_TYPE_ISSUE(path));
      break;
    case "group": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        issues.push(BAD_TYPE_ISSUE(path));
        break;
      }
      const subFields = constraints?.type === "group" ? constraints.fields : [];
      const record = value as Record<string, unknown>;
      for (const sub of subFields) {
        issues.push(...validateFieldValue(sub, record[sub.name], `${path}.${sub.name}`));
      }
      break;
    }
    case "array": {
      if (!Array.isArray(value)) {
        issues.push(BAD_TYPE_ISSUE(path));
        break;
      }
      const item = constraints?.type === "array" ? constraints.item : null;
      if (item) {
        value.forEach((element, index) => {
          issues.push(...validateFieldValue(item, element, `${path}[${index}]`));
        });
      }
      break;
    }
  }
  return issues;
}

/** Validates an entire data payload against a definition's fields. */
export function validateFields(
  fields: ReadonlyArray<FieldDefinition>,
  data: Record<string, unknown>,
): ReadonlyArray<ValidationIssue> {
  const issues: ValidationIssue[] = [];
  for (const field of fields) {
    issues.push(...validateFieldValue(field, data[field.name], field.name));
  }
  return issues;
}

export function assertValidOrThrow(fields: ReadonlyArray<FieldDefinition>, data: Record<string, unknown>): void {
  const issues = validateFields(fields, data);
  if (issues.length > 0) {
    throw validationFailure(issues);
  }
}
