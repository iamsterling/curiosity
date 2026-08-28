"use client";

import { Eyebrow } from "./primitives";
import { seg } from "./editor-demo";
import { usePrefersReducedMotion, useScrollScene } from "./use-scroll-scene";

/**
 * The setup, typed out rather than listed.
 *
 * A four-item list asks you to believe "four commands". A terminal that types
 * them, answers each one, and ends with a saved document shows it — and it is
 * the same shell the hero mocks, so the page keeps one continuous fiction.
 */

const NAV = 64;
/** Four steps, ending before 1 so the finished terminal holds for a beat. */
const SPAN = 0.23;

type Tone = "muted" | "ok" | "signal";

const TONE: Record<Tone, string> = {
  muted: "var(--muted)",
  ok: "var(--success)",
  signal: "var(--accent)"
};

const STEPS: {
  n: string;
  comment: string;
  cmd: string;
  out: [string, Tone][];
  note: string;
}[] = [
  {
    n: "01",
    comment: "Get the code",
    cmd: "git clone git@github.com:former-human/crafty.git",
    out: [["crafty 0.0.0 · main", "muted"]],
    note: "One repository. The document kernel, the renderer, and the design surface all build from it."
  },
  {
    n: "02",
    comment: "Bundle once",
    cmd: "bun install && bun run bundle",
    out: [["dist/ ready · bundled bun", "ok"]],
    note: "A self-contained directory with a bundled runtime — nothing to install on the machine you run it on."
  },
  {
    n: "03",
    comment: "Run the desktop face",
    cmd: "./dist/crafty",
    out: [
      ["design surface · secure loopback", "signal"],
      ["renderer verified · WebGPU", "muted"]
    ],
    note: "The surface opens in your browser on a secure loopback origin — WebGPU works without certificates."
  },
  {
    n: "04",
    comment: "Import a design",
    cmd: "./dist/crafty import screen.pen pricing",
    out: [
      ["saved · /files/pricing", "signal"],
      ["atomic write · revision kept", "muted"]
    ],
    note: "pen.dev designs land as documents — with the store's atomic writes and revisions behind them."
  }
];

const HEADING = "From clone to document in four commands";
const DESCRIPTION =
  "Get the code, bundle once, and open the design surface in the project you already work in.";

/** Per-step progress, sliced out of the section's 0→1. */
function beatAt(t: number, i: number) {
  const base = i * SPAN;
  return {
    line: seg(t, base, base + 0.02),
    typed: seg(t, base + 0.03, base + 0.13),
    settled: seg(t, base + 0.13, base + 0.15)
  };
}

function Step({
  step,
  t,
  index
}: {
  step: (typeof STEPS)[number];
  t: number;
  index: number;
}) {
  const { line, typed, settled } = beatAt(t, index);
  if (line <= 0) return null;

  const shown = step.cmd.slice(0, Math.round(step.cmd.length * typed));
  const base = index * SPAN;

  return (
    <div style={{ opacity: line }}>
      <div style={{ color: "var(--faint)" }}># {step.comment}</div>
      <div className="mt-1 flex gap-2">
        <span className="select-none" style={{ color: "var(--accent)" }}>
          $
        </span>
        <span style={{ color: "var(--text)" }}>
          {shown}
          {settled < 1 ? (
            <span
              className="c-caret ml-px inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em]"
              style={{ backgroundColor: "var(--text)" }}
            />
          ) : null}
        </span>
      </div>
      {step.out.map(([text, tone], k) => (
        <div
          key={text}
          className="mt-0.5 pl-4"
          style={{
            color: TONE[tone],
            opacity: seg(t, base + 0.15 + k * 0.02, base + 0.19 + k * 0.02)
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
}

function Terminal({ t }: { t: number }): React.JSX.Element {
  return (
    <div className="c-terminal">
      <div className="c-terminal-bar">
        <div className="c-terminal-dots">
          <span className="c-terminal-dot" />
          <span className="c-terminal-dot" />
          <span className="c-terminal-dot" />
        </div>
        <span className="c-terminal-label">zsh</span>
      </div>
      {/*
        Fixed height so appending a line never resizes the stage mid-scroll, and
        bottom-anchored so the step currently typing is always the one you can
        see — older commands scroll off the top exactly as a real shell does.
        Top-anchoring clipped the last step's output on any viewport shorter
        than the full log, which is most laptops.
      */}
      <div className="c-terminal-body">
        {STEPS.map((step, i) => (
          <Step key={step.n} step={step} t={t} index={i} />
        ))}
      </div>
      <div className="c-terminal-foot">
        <a className="c-terminal-link" href="/docs/">
          Full documentation
          <svg
            className="c-btn-arrow h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function StepRail({ p, active }: { p: number; active: number }): React.JSX.Element {
  return (
    <div className="c-beat-rail">
      {STEPS.map((item, i) => (
        <div key={item.n} className="c-beat">
          <div className="c-beat-track">
            <div
              className="c-beat-fill"
              style={{ width: `${Math.min(1, Math.max(0, p / SPAN - i)) * 100}%` }}
            />
          </div>
          <div className={`c-beat-label${i === active ? " c-beat-label--active" : ""}`}>
            {item.n}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuickstartScene(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const p = useScrollScene("[data-quickstart-section]", { stickyTop: NAV, steps: 600 });

  if (reduced) {
    return (
      <section data-quickstart-section className="c-section py-24 sm:py-32">
        <div className="c-wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Eyebrow index="03">Quick start</Eyebrow>
            <h2 className="c-h2 mt-4">{HEADING}</h2>
            <p className="c-subtitle mt-4">{DESCRIPTION}</p>
          </div>
          <Terminal t={1} />
        </div>
      </section>
    );
  }

  const active = Math.min(STEPS.length - 1, Math.floor(p / SPAN));
  const step = STEPS[active]!;

  return (
    <section data-quickstart-section className="c-scene c-scene--quickstart">
      <div className="c-scene-stage">
        <div className="c-scene-body">
          <div className="c-scene-rail">
            <Eyebrow index="03">Quick start</Eyebrow>
            <h2 className="c-h2 mt-4">{HEADING}</h2>
            <p className="c-muted mt-4 text-sm leading-relaxed">{DESCRIPTION}</p>

            <StepRail p={p} active={active} />

            <div key={step.n} className="c-row-in mt-8">
              <h3 className="c-h3">{step.comment}</h3>
              <p className="c-muted mt-2.5 text-sm leading-relaxed">{step.note}</p>
            </div>
          </div>

          <div className="c-scene-figure">
            <div className="w-full max-w-[620px]">
              <Terminal t={p} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
