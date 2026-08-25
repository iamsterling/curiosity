import { loadThreadProjectionView } from "./thread-projections";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const statusCopy = {
  available: "Live event projection",
  unavailable: "Projection unavailable",
  unconfigured: "Projection not configured",
} as const;

export default async function Home() {
  const view = await loadThreadProjectionView();

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Curiosity</p>
          <h1>Threads</h1>
          <p className={styles.description}>
            A read-only view rebuilt from the independent harness event log.
          </p>
        </div>
        <p className={styles.status} data-status={view.status}>
          <span aria-hidden="true" />
          {statusCopy[view.status]}
        </p>
      </header>

      <section className={styles.threadPanel} aria-labelledby="thread-heading">
        <div className={styles.panelHeader}>
          <h2 id="thread-heading">Open threads</h2>
          <span>{view.threads.length}</span>
        </div>

        {view.threads.length > 0 ? (
          <ol className={styles.threadList}>
            {view.threads.map((thread) => (
              <li key={thread.threadId}>
                <div>
                  <h3>{thread.title}</h3>
                  <p>{thread.threadId}</p>
                </div>
                <dl>
                  <div>
                    <dt>Opened by</dt>
                    <dd>{thread.openedBy}</dd>
                  </div>
                  <div>
                    <dt>Sequence</dt>
                    <dd>#{thread.sequence}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.emptyState}>
            <p>No projected threads</p>
            <span>
              {view.status === "available"
                ? "The event log contains no thread.opened events."
                : "Configure a readable harness database to display threads."}
            </span>
          </div>
        )}
      </section>

      <footer className={styles.boundary}>
        Read surface only · command admission remains inside the sealed kernel
      </footer>
    </main>
  );
}
