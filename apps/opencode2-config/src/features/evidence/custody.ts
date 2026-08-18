import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { type FileHandle, link, lstat, mkdir, open, realpath, rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { canonicalJSON } from "../../core/canonical/index.js";
import { fail } from "./diagnostics.js";
import { bytesDigest } from "./identity.js";

export interface ObjectAad {
  readonly schemaVersion: 1;
  readonly profile: "development-bootstrap";
  readonly tenant: string;
  readonly objectId: string;
  readonly representationId: string;
  readonly representationType: string;
  readonly receiptId: string;
  readonly algorithm: "AES-256-GCM";
  readonly keyGeneration: string;
  readonly plaintextSize: number;
  readonly plaintextDigest: string;
  readonly sourceReceiptId?: string;
  readonly producer?: string;
  readonly producerVersion?: string;
  readonly transformationPolicyVersion?: string;
}

export interface EncryptedEnvelope {
  readonly custodyProtocolVersion: 1;
  readonly envelopeVersion: 1;
  readonly aadVersion: 1;
  readonly nonce: string;
  readonly ciphertext: string;
  readonly tag: string;
  readonly wrappedDek: string;
  readonly wrapNonce: string;
  readonly wrapTag: string;
}

export interface ObjectReceipt {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly objectId: string;
  readonly representationId: string;
  readonly path: string;
  readonly envelopeDigest: string;
  readonly plaintextDigest: string;
  readonly plaintextSize: number;
  readonly keyGeneration: string;
}

export type CustodyFaultStage =
  | "stage-create"
  | "stage-write"
  | "stage-sync"
  | "pre-link"
  | "link"
  | "post-link"
  | "directory-sync"
  | "existing-open"
  | "existing-read"
  | "existing-verify"
  | "cleanup"
  | "read-open"
  | "read-read"
  | "read-verify";

const encrypt = (
  key: Uint8Array,
  nonce: Uint8Array,
  plaintext: Uint8Array,
  aad: string,
): { ciphertext: Buffer; tag: Buffer } => {
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aad));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, tag: cipher.getAuthTag() };
};

const decrypt = (key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array, tag: Uint8Array, aad: string): Buffer => {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(Buffer.from(tag));
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    return fail("EVIDENCE_OBJECT_AUTHENTICATION_FAILED");
  }
};

interface DirectoryIdentity {
  readonly device: bigint;
  readonly inode: bigint;
  readonly realPath: string;
}

export class DevelopmentFilesystemCustody {
  readonly brand = "TEST/DEVELOPMENT ONLY DISPOSABLE FILESYSTEM CUSTODY";
  readonly #root: string;
  readonly #wrappingKey: Buffer;
  #rootIdentity?: DirectoryIdentity;
  readonly #directoryIdentities = new Map<string, DirectoryIdentity>();
  publicationBoundary?: (aad: ObjectAad) => void | Promise<void>;
  faultBoundary?: (stage: CustodyFaultStage, aad: ObjectAad) => void | Promise<void>;

  constructor(root: string, injectedSecret: Uint8Array) {
    if (!root) fail("EVIDENCE_CUSTODY_DISPOSABLE_ROOT_REQUIRED");
    this.#root = resolve(root);
    this.#wrappingKey = Buffer.from(
      hkdfSync(
        "sha256",
        injectedSecret,
        Buffer.from("evidence-development-bootstrap"),
        Buffer.from("object-dek-wrapping-v1"),
        32,
      ),
    );
  }

  async publish(
    plaintext: Uint8Array,
    aad: ObjectAad,
    beforeFinalPublication?: () => void | Promise<void>,
  ): Promise<{ receipt: ObjectReceipt; envelope: EncryptedEnvelope }> {
    this.#validateAad(aad);
    if (plaintext.byteLength !== aad.plaintextSize) return fail("EVIDENCE_OBJECT_SIZE_MISMATCH");
    if (bytesDigest(plaintext) !== aad.plaintextDigest) return fail("EVIDENCE_OBJECT_DIGEST_INVALID");
    const aadText = canonicalJSON({ custodyProtocolVersion: 1, envelopeVersion: 1, aadVersion: 1, ...aad });
    const dek = randomBytes(32);
    const nonce = randomBytes(12);
    const wrappedNonce = randomBytes(12);
    const body = encrypt(dek, nonce, plaintext, aadText);
    const wrapped = encrypt(this.#wrappingKey, wrappedNonce, dek, aadText);
    const envelope: EncryptedEnvelope = {
      custodyProtocolVersion: 1,
      envelopeVersion: 1,
      aadVersion: 1,
      nonce: nonce.toString("base64url"),
      ciphertext: body.ciphertext.toString("base64url"),
      tag: body.tag.toString("base64url"),
      wrappedDek: wrapped.ciphertext.toString("base64url"),
      wrapNonce: wrappedNonce.toString("base64url"),
      wrapTag: wrapped.tag.toString("base64url"),
    };
    const encoded = Buffer.from(canonicalJSON(envelope));
    const objectName = `${createHash("sha256").update(aad.objectId).digest("hex")}.object`;
    const finalDirectory = join(this.#root, "objects");
    const stageDirectory = join(this.#root, "staging");
    const finalPath = join(finalDirectory, objectName);
    const stagePath = join(stageDirectory, `${objectName}.${randomBytes(12).toString("hex")}.stage`);
    await this.#verifyRoot();
    await mkdir(finalDirectory, { recursive: true, mode: 0o700 });
    await mkdir(stageDirectory, { recursive: true, mode: 0o700 });
    await this.#verifyParents(true);
    await this.faultBoundary?.("stage-create", aad);
    await this.#verifyParents();
    const handle = await open(stagePath, "wx", 0o600);
    try {
      await this.#verifyParents();
      await this.faultBoundary?.("stage-write", aad);
      await this.#verifyParents();
      await handle.writeFile(encoded);
      await this.#verifyParents();
      await this.faultBoundary?.("stage-sync", aad);
      await this.#verifyParents();
      await handle.sync();
      await this.#verifyParents();
    } finally {
      await handle.close();
    }
    let publishedEnvelope = envelope;
    let publishedBytes = encoded;
    try {
      await this.faultBoundary?.("pre-link", aad);
      await this.publicationBoundary?.(aad);
      await beforeFinalPublication?.();
    } catch (error) {
      await this.#cleanupStage(stagePath);
      throw error;
    }
    try {
      await this.faultBoundary?.("link", aad);
      await beforeFinalPublication?.();
      await this.#verifyParents();
    } catch (error) {
      await this.#cleanupStage(stagePath);
      throw error;
    }
    try {
      await this.#verifyParents();
      await link(stagePath, finalPath);
      await this.#verifyParents();
      await this.faultBoundary?.("post-link", aad);
      await this.#verifyParents();
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code !== "EEXIST") {
        await this.#cleanupStage(stagePath);
        if (error instanceof Error && error.message === "EVIDENCE_CUSTODY_UNSAFE_PARENT") throw error;
        return fail("EVIDENCE_CUSTODY_EXCLUSIVE_PUBLICATION_UNSUPPORTED");
      }
      try {
        const existing = await this.#readRegularFile(finalPath, aad, "existing");
        const existingEnvelope = this.#decodeEnvelope(existing);
        const existingReceipt = this.#receipt(aad, finalPath, existing);
        const existingPlaintext = await this.read(existingReceipt, aad);
        if (
          bytesDigest(existingPlaintext) !== aad.plaintextDigest ||
          existingPlaintext.byteLength !== aad.plaintextSize
        )
          return fail("EVIDENCE_CUSTODY_PUBLICATION_CONFLICT");
        publishedEnvelope = existingEnvelope;
        publishedBytes = existing;
      } finally {
        await this.faultBoundary?.("cleanup", aad);
        await this.#cleanupStage(stagePath);
      }
    }
    await this.faultBoundary?.("directory-sync", aad);
    await this.#verifyParents();
    await this.#syncDirectory(finalDirectory);
    await this.faultBoundary?.("cleanup", aad);
    await this.#cleanupStage(stagePath);
    await this.#syncDirectory(stageDirectory);
    await this.#verifyParents();
    return { receipt: this.#receipt(aad, finalPath, publishedBytes), envelope: publishedEnvelope };
  }

  async read(receipt: ObjectReceipt, aad: ObjectAad): Promise<Buffer> {
    this.#validateAad(aad);
    const expectedPath = this.#objectPath(aad.objectId);
    if (
      receipt.schemaVersion !== 1 ||
      receipt.objectId !== aad.objectId ||
      receipt.representationId !== aad.representationId ||
      receipt.id !== aad.receiptId ||
      receipt.path !== expectedPath ||
      receipt.plaintextDigest !== aad.plaintextDigest ||
      receipt.plaintextSize !== aad.plaintextSize ||
      receipt.keyGeneration !== aad.keyGeneration
    )
      return fail("EVIDENCE_OBJECT_AUTHENTICATION_FAILED");
    const encoded = await this.#readRegularFile(receipt.path, aad, "read");
    if (bytesDigest(encoded) !== receipt.envelopeDigest) return fail("EVIDENCE_OBJECT_DIGEST_INVALID");
    const envelope = this.#decodeEnvelope(encoded);
    const aadText = canonicalJSON({ custodyProtocolVersion: 1, envelopeVersion: 1, aadVersion: 1, ...aad });
    const dek = decrypt(
      this.#wrappingKey,
      Buffer.from(envelope.wrapNonce, "base64url"),
      Buffer.from(envelope.wrappedDek, "base64url"),
      Buffer.from(envelope.wrapTag, "base64url"),
      aadText,
    );
    const plaintext = decrypt(
      dek,
      Buffer.from(envelope.nonce, "base64url"),
      Buffer.from(envelope.ciphertext, "base64url"),
      Buffer.from(envelope.tag, "base64url"),
      aadText,
    );
    if (bytesDigest(plaintext) !== aad.plaintextDigest || plaintext.byteLength !== aad.plaintextSize)
      return fail("EVIDENCE_OBJECT_DIGEST_INVALID");
    return plaintext;
  }

  async #readRegularFile(path: string, aad: ObjectAad, purpose: "read" | "existing"): Promise<Buffer> {
    if (typeof constants.O_NOFOLLOW !== "number") return fail("EVIDENCE_CUSTODY_NOFOLLOW_UNSUPPORTED");
    if (typeof constants.O_NONBLOCK !== "number") return fail("EVIDENCE_CUSTODY_NONBLOCK_UNSUPPORTED");
    await this.#verifyParents();
    let handle: FileHandle;
    try {
      handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (["EINVAL", "ENOTSUP", "EOPNOTSUPP"].includes(code)) return fail("EVIDENCE_CUSTODY_NOFOLLOW_UNSUPPORTED");
      if (code === "ELOOP") return fail("EVIDENCE_CUSTODY_UNSAFE_OBJECT");
      return fail("EVIDENCE_OBJECT_MISSING");
    }
    try {
      await this.#verifyParents();
      const stat = await handle.stat();
      if (!stat.isFile()) return fail("EVIDENCE_CUSTODY_UNSAFE_OBJECT");
      await this.faultBoundary?.(`${purpose}-open`, aad);
      await this.#verifyParents();
      const bytes = await handle.readFile();
      await this.#verifyParents();
      await this.faultBoundary?.(`${purpose}-read`, aad);
      await this.#verifyParents();
      await this.faultBoundary?.(`${purpose}-verify`, aad);
      await this.#verifyParents();
      return bytes;
    } finally {
      await handle.close();
    }
  }

  async #verifyRoot(): Promise<void> {
    const identity = await this.#directoryIdentity(this.#root);
    if (!this.#rootIdentity) {
      this.#rootIdentity = identity;
      return;
    }
    if (!this.#sameDirectory(this.#rootIdentity, identity)) return fail("EVIDENCE_CUSTODY_UNSAFE_PARENT");
  }

  async #verifyParents(establish = false): Promise<void> {
    await this.#verifyRoot();
    for (const path of [join(this.#root, "objects"), join(this.#root, "staging")]) {
      const identity = await this.#directoryIdentity(path);
      const qualified = this.#directoryIdentities.get(path);
      if (!qualified && establish) {
        this.#directoryIdentities.set(path, identity);
        continue;
      }
      if (!qualified || !this.#sameDirectory(qualified, identity)) return fail("EVIDENCE_CUSTODY_UNSAFE_PARENT");
    }
  }

  async #directoryIdentity(path: string): Promise<DirectoryIdentity> {
    try {
      const stat = await lstat(path, { bigint: true });
      if (stat.isSymbolicLink() || !stat.isDirectory()) return fail("EVIDENCE_CUSTODY_UNSAFE_PARENT");
      const resolved = await realpath(path);
      const root = this.#rootIdentity?.realPath ?? (path === this.#root ? resolved : await realpath(this.#root));
      const fromRoot = relative(root, resolved);
      if (fromRoot.startsWith("..") || resolve(root, fromRoot) !== resolved)
        return fail("EVIDENCE_CUSTODY_UNSAFE_PARENT");
      return { device: stat.dev, inode: stat.ino, realPath: resolved };
    } catch (error) {
      if (error instanceof Error && error.message === "EVIDENCE_CUSTODY_UNSAFE_PARENT") throw error;
      return fail("EVIDENCE_CUSTODY_UNSAFE_PARENT");
    }
  }

  #sameDirectory(left: DirectoryIdentity, right: DirectoryIdentity): boolean {
    return left.device === right.device && left.inode === right.inode && left.realPath === right.realPath;
  }

  async #cleanupStage(stagePath: string): Promise<void> {
    await this.#verifyParents();
    await rm(stagePath, { force: true });
    await this.#verifyParents();
  }

  async #syncDirectory(path: string): Promise<void> {
    await this.#verifyParents();
    const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      await this.#verifyParents();
      await handle.sync();
      await this.#verifyParents();
    } finally {
      await handle.close();
    }
  }

  #objectPath(objectId: string): string {
    const objectName = `${createHash("sha256").update(objectId).digest("hex")}.object`;
    return join(this.#root, "objects", objectName);
  }

  #receipt(aad: ObjectAad, path: string, encoded: Uint8Array): ObjectReceipt {
    return Object.freeze({
      schemaVersion: 1,
      id: aad.receiptId,
      objectId: aad.objectId,
      representationId: aad.representationId,
      path,
      envelopeDigest: bytesDigest(encoded),
      plaintextDigest: aad.plaintextDigest,
      plaintextSize: aad.plaintextSize,
      keyGeneration: aad.keyGeneration,
    });
  }

  #decodeEnvelope(encoded: Uint8Array): EncryptedEnvelope {
    let envelope: unknown;
    try {
      envelope = JSON.parse(Buffer.from(encoded).toString());
    } catch {
      return fail("EVIDENCE_OBJECT_DIGEST_INVALID");
    }
    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope))
      return fail("EVIDENCE_OBJECT_AUTHENTICATION_FAILED");
    const value = envelope as Record<string, unknown>;
    const keys = [
      "custodyProtocolVersion",
      "envelopeVersion",
      "aadVersion",
      "nonce",
      "ciphertext",
      "tag",
      "wrappedDek",
      "wrapNonce",
      "wrapTag",
    ];
    if (Object.keys(value).length !== keys.length || keys.some((key) => !(key in value)))
      return fail("EVIDENCE_OBJECT_AUTHENTICATION_FAILED");
    if (value.custodyProtocolVersion !== 1 || value.envelopeVersion !== 1 || value.aadVersion !== 1)
      return fail("EVIDENCE_OBJECT_VERSION_UNSUPPORTED");
    if (keys.slice(3).some((key) => typeof value[key] !== "string"))
      return fail("EVIDENCE_OBJECT_AUTHENTICATION_FAILED");
    return value as unknown as EncryptedEnvelope;
  }

  #validateAad(aad: ObjectAad): void {
    const required = [
      "schemaVersion",
      "profile",
      "tenant",
      "objectId",
      "representationId",
      "representationType",
      "receiptId",
      "algorithm",
      "keyGeneration",
      "plaintextSize",
      "plaintextDigest",
    ];
    const optional = ["sourceReceiptId", "producer", "producerVersion", "transformationPolicyVersion"];
    const keys = Object.keys(aad);
    if (keys.some((key) => ![...required, ...optional].includes(key)) || required.some((key) => !(key in aad)))
      fail("EVIDENCE_OBJECT_AAD_INVALID");
    if (aad.schemaVersion !== 1 || aad.profile !== "development-bootstrap" || aad.algorithm !== "AES-256-GCM")
      fail("EVIDENCE_OBJECT_AAD_INVALID");
    if (!Number.isSafeInteger(aad.plaintextSize) || aad.plaintextSize < 0) fail("EVIDENCE_OBJECT_AAD_INVALID");
  }
}
