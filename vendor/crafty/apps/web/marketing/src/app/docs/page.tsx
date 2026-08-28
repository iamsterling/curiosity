import Link from "next/link";
import { SiteNav } from "../_components/site-nav";

/**
 * Stage-2 docs landing. Static content; the full documentation set lands
 * here as it is written.
 */
export default function DocsPage(): React.JSX.Element {
  return (
    <>
      <SiteNav />
      <main className="c-section">
        <div className="c-wrap">
          <h1 className="c-h1">Documentation</h1>
          <p className="c-subtitle mt-4">Placeholder — the docs index lands here.</p>
          <p className="mt-6">
            <Link href="/" className="text-[var(--accent)] hover:underline">
              Back home
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
