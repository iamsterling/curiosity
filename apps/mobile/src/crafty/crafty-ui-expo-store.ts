import { Directory, File, Paths } from "expo-file-system";
import type { CraftyUiPackagePublicationStore } from "./crafty-ui-persistence";

const PACKAGE_DIRECTORY = "crafty-portability.ui";

const packageDirectoryFor = (projectId?: string): string =>
  projectId
    ? `${PACKAGE_DIRECTORY}-${projectId.replace(/[^a-zA-Z0-9._-]/gu, "-")}`
    : PACKAGE_DIRECTORY;

const readIfPresent = async (file: File): Promise<string | undefined> =>
  file.exists ? file.text() : undefined;

export class ExpoCraftyUiPackageStore implements CraftyUiPackagePublicationStore {
  private readonly directory: Directory;

  public constructor(projectId?: string) {
    this.directory = new Directory(Paths.document, packageDirectoryFor(projectId));
  }

  public readDocumentEntry = (path: string): Promise<string | undefined> =>
    readIfPresent(new File(this.directory, path));

  public readManifest = (): Promise<string | undefined> =>
    readIfPresent(new File(this.directory, "manifest.ui"));

  public writeImmutableDocument = async (
    path: string,
    bytes: string,
  ): Promise<void> => {
    this.ensureDirectory();
    const destination = new File(this.directory, path);
    if (destination.exists) {
      if ((await destination.text()) !== bytes) {
        throw new Error("UI_REVISION_EXISTS");
      }
      return;
    }
    const temporary = new File(this.directory, `${path}.tmp`);
    temporary.create({ overwrite: true });
    temporary.write(bytes);
    if ((await temporary.text()) !== bytes) {
      temporary.delete();
      throw new Error("DOCUMENT_PUBLICATION_FAILED");
    }
    await temporary.move(destination);
  };

  public publishManifest = async (bytes: string): Promise<void> => {
    this.ensureDirectory();
    const temporary = new File(this.directory, "manifest.ui.tmp");
    temporary.create({ overwrite: true });
    temporary.write(bytes);
    if ((await temporary.text()) !== bytes) {
      temporary.delete();
      throw new Error("DOCUMENT_PUBLICATION_FAILED");
    }
    await temporary.move(new File(this.directory, "manifest.ui"), {
      overwrite: true,
    });
  };

  private ensureDirectory(): void {
    this.directory.create({ idempotent: true, intermediates: true });
  }
}
