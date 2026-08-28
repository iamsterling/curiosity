import Link from "next/link";

/**
 * The fixed 64px bar every sticky stage measures itself against (the scroll
 * hooks receive `stickyTop: 64`). Server-rendered, like everything here.
 */
export function SiteNav(): React.JSX.Element {
  return (
    <header className="c-nav">
      <div className="c-wrap c-nav-inner">
        <Link href="/" className="c-brand">
          <span className="c-brand-mark" aria-hidden="true">
            C
          </span>
          <span>Crafty</span>
        </Link>
        <nav className="c-nav-links" aria-label="Site">
          <Link href="/docs/">Docs</Link>
          <Link href="/editor">Open the editor</Link>
        </nav>
      </div>
    </header>
  );
}
