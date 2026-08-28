import Link from "next/link";

import { dataDirectory, listFiles } from "@crafty/scene-store";

import { CreateFileForm } from "../_components/create-file-form";

/**
 * Server Component file browser, owned by the editor zone (`/editor`). Reads
 * the store directly on the server — there is no client fetch, no loading
 * state, and no API round trip for the listing. The editor itself is a
 * client island; this surface is not.
 */
export const dynamic = "force-dynamic";

const formatUpdated = (updatedAtMs: number | undefined): string => {
  if (updatedAtMs === undefined) return "never saved";
  const minutes = Math.round((Date.now() - updatedAtMs) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default async function FileBrowserPage() {
  const files = listFiles(dataDirectory());
  return (
    <main className="browser-shell">
      <header className="browser-header">
        <div className="browser-brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div>
            <h1>Crafty</h1>
            <p>Local design files</p>
          </div>
        </div>
        <CreateFileForm />
      </header>

      {files.length === 0 ? (
        <section className="browser-empty">
          <h2>No files yet</h2>
          <p>Create a file above, or run <code>crafty import &lt;file.pen&gt; &lt;slug&gt;</code> to bring in a pen.dev document.</p>
           <Link className="browser-cta" href="/editor/untitled">Open the default file</Link>
        </section>
      ) : (
        <ul className="browser-grid">
          {files.map((file) => (
            <li key={file.slug}>
               <Link className="browser-card" href={`/editor/${file.slug}`}>
                <span className="browser-card-name">{file.name}</span>
                 <span className="browser-card-slug">/editor/{file.slug}</span>
                <span className="browser-card-meta">
                  {file.pageCount} page{file.pageCount === 1 ? "" : "s"} · {file.nodeCount} layer{file.nodeCount === 1 ? "" : "s"}
                </span>
                <span className="browser-card-meta">revision {file.revision} · {formatUpdated(file.updatedAtMs)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
