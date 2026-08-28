"use client";

import { sceneStateAt } from "./editor-demo";

type Scene = ReturnType<typeof sceneStateAt>;

/** `+4` / `−2` / `0` — signed, with a real minus sign rather than a hyphen. */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/**
 * One beat per chapter. Each names the piece of Crafty vocabulary that is on
 * screen *right now*, states what it buys you, and reads out the figures the
 * transcript is currently carrying.
 *
 * The split matters: `term`/`title`/`body` re-key on every chapter change and
 * animate in, while `readout` values update in place. So the prose swaps and
 * the instruments tick — instead of the whole card blinking on every beat.
 */
type Beat = {
  term: string;
  title: string;
  body: string;
  readout: (s: Scene) => [string, string | number][];
};

const BEATS: Record<string, Beat> = {
  "00": {
    term: "the document",
    title: "One kernel, one schema, no state.",
    body: "A blank page is a document before it is pixels. The tree holds everything; the canvas is only a projection of it.",
    readout: () => [
      ["session", "idle"],
      ["nodes", "0"]
    ]
  },
  "01": {
    term: "intent",
    title: "You state the task once.",
    body: "No system prompt to tune, no role-play preamble. A plain sentence is the whole interface, and it is the last instruction the run needs.",
    readout: () => [
      ["instructions", "1"],
      ["prompt tuning", "none"]
    ]
  },
  "02": {
    term: "the kernel",
    title: "One task convenes four layers.",
    body: "Kernel, document, renderer, store — distinct roles sharing one session, not four copies of the same process agreeing with itself.",
    readout: () => [
      ["layers", "4"],
      ["provider", "yours"]
    ]
  },
  "03": {
    term: "goal + context scan",
    title: "It reads before it writes.",
    body: "The session commits to a written goal, then scans the tree and the project around it — so the document it builds is about your work.",
    readout: (s) => [
      ["operations", s.ops],
      ["context", "AGENTS.md"]
    ]
  },
  "04": {
    term: "signal gathering",
    title: "Evidence before opinion.",
    body: "Layers grep and read, then report what they actually found. The first frame lands and the risks get named before any proposal.",
    readout: (s) => [
      ["tool calls", s.tools],
      ["nodes", s.nodes]
    ]
  },
  "05": {
    term: "component instance",
    title: "A reference, never a copy.",
    body: "A component is a definition; an instance is a reference plus a sparse delta. Update the definition and every use follows — that is the point.",
    readout: (s) => [
      ["threads", s.nodes],
      ["reactions", s.reactions]
    ]
  },
  "06": {
    term: "recorded dissent",
    title: "Disagreement is kept, not averaged.",
    body: "The renderer's counter stays threaded under the proposal with its own weight. A rejected idea remains readable — you can see what was traded away.",
    readout: (s) => [
      ["proposal", signed(s.weight)],
      ["counter", signed(s.counterWeight)]
    ]
  },
  "07": {
    term: "policy gate",
    title: "Nothing advances on vibes.",
    body: "Weights sum and writes check against the rules. Below the threshold, or one invalid change, and the plan stops at this line.",
    readout: (s) => [
      ["weight", signed(s.weight)],
      ["threshold", "0"],
      ["denials", "0"]
    ]
  },
  "08": {
    term: "validated command",
    title: "Every write is a command.",
    body: "Each change is applied through a validated, invertible command — and the packet the renderer receives carries no product semantics at all.",
    readout: (s) => [
      ["tool calls", s.tools],
      ["diff", "+1 −1"],
      ["denied", "0"]
    ]
  },
  "09": {
    term: "independent verifier",
    title: "Its default answer is REJECT.",
    body: "A separate pass probes the renderer and reads the failure. A lost device becomes a specific recovery instead of a confident closing summary.",
    readout: (s) => [
      ["retries", `${s.retries} of 3`],
      ["stance", "REJECT"]
    ]
  },
  "10": {
    term: "the .ui package",
    title: "The document outlives the session.",
    body: "Canonical, deterministic, versioned — the package is the artifact. Close the surface and the file keeps its revisions on disk.",
    readout: (s) => [
      ["nodes", s.nodes],
      ["tool calls", s.tools],
      ["dissents", s.dissents]
    ]
  }
};

const PHASE_COUNT = 7;

/**
 * The scroll-driven half of the hero column. Replaces the pitch in place once
 * the session has the floor: same column, same left edge, new job.
 */
export function HeroExplainer({ p, index }: { p: number; index: string }): React.JSX.Element {
  const beat = BEATS[index] ?? BEATS["00"]!;
  const scene = sceneStateAt(p);
  const rows = beat.readout(scene);

  // −1 before the first phase opens; clamp so the dot rail reads as "not yet"
  // rather than lighting up backwards.
  const reached = Math.max(0, scene.phaseIndex);

  return (
    <div className="c-guide">
      <div className="c-guide-head">
        <span className="c-eyebrow-dot" />
        <span className="c-eyebrow-index">{index}</span>
        <span className="c-guide-phase">{scene.phase?.name ?? "idle"}</span>
      </div>

      {/* Phase rail — seven dots for the lifecycle, with a hairline that fills
          across the current phase so the column keeps moving between beats. */}
      <div className="c-guide-rail">
        <div className="c-guide-dots">
          {Array.from({ length: PHASE_COUNT }, (_, i) => (
            <span
              key={i}
              className="c-guide-dot"
              style={{
                backgroundColor:
                  i < reached
                    ? "var(--accent-line)"
                    : i === reached && scene.phase
                      ? "var(--accent)"
                      : "var(--warp)"
              }}
            />
          ))}
        </div>
        <div className="c-guide-track">
          <div className="c-guide-fill" style={{ width: `${scene.phaseProgress * 100}%` }} />
        </div>
        <span className="c-guide-elapsed">{scene.elapsed.toFixed(1)}s</span>
      </div>

      {/* Prose swaps per beat; the key restarts the entrance animation. */}
      <div key={index} className="c-row-in c-guide-prose">
        <div className="c-guide-term">{beat.term}</div>
        <h2 className="c-guide-title">{beat.title}</h2>
        <p className="c-guide-body">{beat.body}</p>
      </div>

      {/* Instruments — outside the keyed subtree, so values tick in place
          instead of flying in again on every chapter change.

          Dropped on short viewports: below the `lg` row the rail stacks above
          the demo and the two share one stage, so the table's ~90px leaves the
          demo about one visible row. The counters restate what the transcript
          is already showing, so they are the right thing to give up. */}
      <dl className="c-guide-readout">
        {rows.map(([label, value]) => (
          <div key={label} className="c-guide-readout-row">
            <dt className="c-guide-readout-label">{label}</dt>
            <dd className="c-guide-readout-value">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
