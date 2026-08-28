import Link from "next/link";
import { CopyCommand } from "./copy-command";

export function CTA(): React.JSX.Element {
  return (
    <section className="c-cta">
      {/* Painted back to front: the blurred accent pool, the grid it falls on,
          and the grain last so it dithers the CSS ramps as well as the
          canvas's own gradients — wide near-black ramps band regardless of
          which layer produced them. */}
      <div className="c-cta-backdrop">
        <div className="c-cta-glow" aria-hidden />
        <div className="c-cta-grid" aria-hidden />
        <div className="c-grain c-grain-flat absolute inset-0" aria-hidden />
      </div>
      <div className="c-cta-content">
        <h2 className="c-cta-title">Give your agents a real document.</h2>
        <p className="c-cta-description">
          Structured files, validated commands, and a versioned record of every
          change — in a local surface you can leave running.
        </p>
        <div className="c-cta-actions">
          <CopyCommand command="./dist/crafty" className="sm:w-[260px]" />
          <Link href="/editor" className="c-btn c-btn--primary">
            Open the editor
            <svg
              className="c-btn-arrow h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
