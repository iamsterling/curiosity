import { dataDirectory, listFiles, snapshotDocument } from "@crafty/scene-store";

/**
 * Stage-2 admin landing: a files table read straight from the store on the
 * server — the same read path the editor zone's file browser uses. Auth
 * (stage 3) gates this zone in deployed mode; local mode stays open.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage(): Promise<React.JSX.Element> {
  const files = listFiles(dataDirectory());
  const snapshots = files.map((file) => {
    const result = snapshotDocument(dataDirectory(), file.slug);
    return { slug: file.slug, snapshot: result.ok ? result.value : null };
  });

  return (
    <main className="admin-shell">
      <h1>Administration</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Revision</th>
            <th>Pages</th>
            <th>Snapshot sha256</th>
            <th>Snapshot bytes</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map(({ slug, snapshot }) => (
            <tr key={slug}>
              <td><a href={`/files/${slug}`}>{slug}</a></td>
              <td>{snapshot ? String(snapshot.metadata.revision) : "—"}</td>
              <td>{files.find((file) => file.slug === slug)?.pageCount ?? "—"}</td>
              <td>{snapshot ? String(snapshot.metadata.sha256).slice(0, 16) : "—"}</td>
              <td>{snapshot ? String(snapshot.metadata.byteLength) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
