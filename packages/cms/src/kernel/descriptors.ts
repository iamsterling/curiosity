import type { Operation, PermissionMap, TriState } from "./access.js";
import type { CollectionDefinition } from "./collection.js";
import type { FieldDefinition, FieldConstraints, FieldKind } from "./fields.js";

/**
 * Admin descriptors: serializable data the admin composes field primitives
 * from. Descriptors are plain data — the admin never receives components or
 * logic from the engine.
 */

export interface FieldDescriptor {
  readonly name: string;
  readonly kind: FieldKind;
  readonly label?: string;
  readonly required: boolean;
  readonly constraints?: FieldConstraints;
  readonly description?: string;
}

export interface CollectionDescriptor {
  readonly name: string;
  readonly label?: string;
  readonly system: boolean;
  readonly agentExposed: boolean;
  readonly publicRead: boolean;
  readonly previewable: boolean;
  readonly version: number;
  readonly versionsMax: number;
  readonly fields: ReadonlyArray<FieldDescriptor>;
  /** Tri-state permissions for this collection, from the caller's map. */
  readonly permissions: Readonly<Record<Operation, TriState>> | undefined;
}

export function describeField(field: FieldDefinition): FieldDescriptor {
  return {
    name: field.name,
    kind: field.kind,
    required: field.required,
    ...(field.label !== undefined ? { label: field.label } : {}),
    ...(field.constraints !== undefined ? { constraints: field.constraints } : {}),
    ...(field.description !== undefined ? { description: field.description } : {}),
  };
}

export function describeCollection(
  def: CollectionDefinition,
  permissions: PermissionMap | undefined,
): CollectionDescriptor {
  return {
    name: def.name,
    ...(def.label !== undefined ? { label: def.label } : {}),
    system: def.system,
    agentExposed: def.agentExposed,
    publicRead: def.publicRead,
    previewable: def.previewable,
    version: def.version,
    versionsMax: def.versionsMax,
    fields: Object.freeze(def.fields.map((field) => Object.freeze(describeField(field)))),
    permissions: permissions?.collections[def.name]
      ? Object.freeze({ ...permissions.collections[def.name] }) as Readonly<Record<Operation, TriState>>
      : undefined,
  };
}
