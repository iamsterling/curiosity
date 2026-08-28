import { dataDirectory, listFiles } from "@crafty/scene-store";
import { ArrowUpRight, Blocks } from "lucide-react";
import Link from "next/link";
import { CreateCraftForm } from "./create-craft-form";
import styles from "./editor.module.css";

export const dynamic = "force-dynamic";

const formatUpdated = (updatedAtMs: number | undefined): string => {
  if (updatedAtMs === undefined) return "Never saved";
  const minutes = Math.round((Date.now() - updatedAtMs) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function CraftPage() {
  const files = listFiles(dataDirectory());
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p>Visual workspace</p>
          <h1>Craft</h1>
          <span>
            Use Curiosity through a structured, agent-operable canvas.
          </span>
        </div>
        <CreateCraftForm />
      </header>

      <div className={styles.ruleHeader}>
        <h2>Canvases</h2>
        <span>{files.length}</span>
      </div>
      {files.length === 0 ? (
        <section className={styles.empty}>
          <Blocks aria-hidden="true" size={22} />
          <h2>No canvases yet</h2>
          <p>
            Create one above, or open the default workspace to start visually.
          </p>
          <Link href="/editor/untitled">
            Open default canvas <ArrowUpRight size={14} />
          </Link>
        </section>
      ) : (
        <ol className={styles.fileList}>
          {files.map((file) => (
            <li key={file.slug}>
              <Link href={`/editor/${file.slug}`}>
                <span className={styles.fileMark} aria-hidden="true" />
                <div>
                  <h3>{file.name}</h3>
                  <p>/editor/{file.slug}</p>
                </div>
                <dl>
                  <div>
                    <dt>Pages</dt>
                    <dd>{file.pageCount}</dd>
                  </div>
                  <div>
                    <dt>Layers</dt>
                    <dd>{file.nodeCount}</dd>
                  </div>
                  <div>
                    <dt>Revision</dt>
                    <dd>{file.revision}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatUpdated(file.updatedAtMs)}</dd>
                  </div>
                </dl>
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </li>
          ))}
        </ol>
      )}
      <footer className={styles.provenance}>
        Craft engine · imported from former-human/crafty@32ed027 ·
        Curiosity-owned surface
      </footer>
    </main>
  );
}
