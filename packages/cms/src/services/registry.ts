import { parseCollectionDefinition, type CollectionDefinition, type CollectionDefinitionInput } from "../kernel/collection.js";
import { COLLECTION_IMMUTABLE, DEFINITION_STALE, ConflictError } from "../kernel/errors.js";

interface VersionedDefinition { readonly definition: CollectionDefinition; readonly versions: ReadonlyMap<number, CollectionDefinition>; }

/** Runtime content-type registry. Persistence is intentionally supplied by a later adapter. */
export class InMemoryContentTypeRegistry {
  private readonly definitions = new Map<string, VersionedDefinition>();

  constructor(systemDefinitions: ReadonlyArray<CollectionDefinition> = []) {
    for (const definition of systemDefinitions) {
      this.definitions.set(definition.name, { definition, versions: new Map([[definition.version, definition]]) });
    }
  }

  create(input: CollectionDefinitionInput): CollectionDefinition {
    if (this.definitions.get(input.name)?.definition.system) {
      throw new ConflictError({ code: COLLECTION_IMMUTABLE });
    }
    if (this.definitions.has(input.name)) throw new ConflictError({ code: DEFINITION_STALE, detail: input.name });
    const definition = parseCollectionDefinition({ ...input, system: false, version: 1 });
    this.definitions.set(definition.name, { definition, versions: new Map([[1, definition]]) });
    return definition;
  }

  update(name: string, expectedVersion: number, input: CollectionDefinitionInput): CollectionDefinition {
    const current = this.definitions.get(name);
    if (!current || current.definition.system) throw new ConflictError({ code: COLLECTION_IMMUTABLE, detail: name });
    if (current.definition.version !== expectedVersion) throw new ConflictError({ code: DEFINITION_STALE, detail: name });
    const definition = parseCollectionDefinition({ ...input, name, system: false, version: expectedVersion + 1 });
    const versions = new Map(current.versions);
    versions.set(definition.version, definition);
    this.definitions.set(name, { definition, versions });
    return definition;
  }

  get(name: string, version?: number): CollectionDefinition | undefined {
    const item = this.definitions.get(name);
    return version === undefined ? item?.definition : item?.versions.get(version);
  }

  list(): ReadonlyArray<CollectionDefinition> { return [...this.definitions.values()].map((item) => item.definition); }
}
