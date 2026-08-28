import { renderTuiFrame } from "../../src/tui/frame.js";
import { createStreamTextLayout } from "../../src/tui/stream-layout.js";
import { createStreamPresentation } from "../../src/tui/stream-presentation.js";
import { makeTerminalTheme } from "../../src/tui/theme.js";
import { percentile, type EfficiencyWorkload } from "./metrics.js";

const STREAM_CODE_POINTS = 20_000;
const STREAM_CHUNK_CODE_POINTS = 64;
const STREAM_CHUNKS = "x"
  .repeat(STREAM_CODE_POINTS)
  .match(new RegExp(`.{1,${STREAM_CHUNK_CODE_POINTS}}`, "gu"))!;
const theme = makeTerminalTheme(false);
const frameState = Object.freeze({
  animationTick: 0,
  columns: 120,
  effort: "medium",
  input: "",
  inputCursor: 0,
  messages: Object.freeze([]),
  modelId: "benchmark:deterministic",
  motion: "reduced" as const,
  rows: 40,
  scrollOffset: 0,
  status: "working" as const,
  submittedText: "Measure the harness",
  workingDirectory: "/workspace",
});

const runTuiRenderSample = () => {
  Bun.gc(true);
  const heapBefore = process.memoryUsage().heapUsed;
  const layout = createStreamTextLayout();
  const frameDurations: number[] = [];
  let previous: readonly string[] = [];
  let changedRows = 0;
  let outputBytes = 0;
  const started = performance.now();
  for (const chunk of STREAM_CHUNKS) {
    layout.append(chunk);
    const frameStarted = performance.now();
    const frame = renderTuiFrame({ ...frameState, streamingLayout: layout }, theme);
    frameDurations.push(performance.now() - frameStarted);
    frame.lines.forEach((line, index) => {
      if (line === previous[index]) return;
      changedRows += 1;
      outputBytes += Buffer.byteLength(line) + 12;
    });
    previous = frame.lines;
  }
  Bun.gc(true);
  return {
    changedRows,
    durationMs: performance.now() - started,
    frameDurations,
    heapDeltaBytes: Math.max(0, process.memoryUsage().heapUsed - heapBefore),
    metrics: layout.metrics(),
    outputBytes,
  };
};

export const runTuiRenderWorkload = (samples: number): EfficiencyWorkload => {
  runTuiRenderSample();
  const runs = Array.from({ length: samples }, runTuiRenderSample);
  return {
    metrics: {
      changed_rows_per_frame: percentile(
        runs.map(({ changedRows }) => changedRows / STREAM_CHUNKS.length),
        0.5,
      ),
      duration_p50_ms: percentile(
        runs.map(({ durationMs }) => durationMs),
        0.5,
      ),
      frame_p95_ms: percentile(
        runs.flatMap(({ frameDurations }) => frameDurations),
        0.95,
      ),
      heap_delta_bytes: percentile(
        runs.map(({ heapDeltaBytes }) => heapDeltaBytes),
        0.5,
      ),
      layout_rebuilds: Math.max(...runs.map(({ metrics }) => metrics.rebuilds)),
      output_byte_amplification: percentile(
        runs.map(({ outputBytes }) => outputBytes / STREAM_CODE_POINTS),
        0.5,
      ),
      work_amplification: Math.max(
        ...runs.map(
          ({ metrics }) => metrics.processedGraphemes / STREAM_CODE_POINTS,
        ),
      ),
    },
    units: {
      changed_rows_per_frame: "rows/frame",
      duration_p50_ms: "ms",
      frame_p95_ms: "ms",
      heap_delta_bytes: "bytes",
      layout_rebuilds: "count",
      output_byte_amplification: "output/input",
      work_amplification: "processed/input",
    },
  };
};

export const runEventLoopWorkload = async (): Promise<EfficiencyWorkload> => {
  Bun.gc(true);
  const heapBefore = process.memoryUsage().heapUsed;
  const layout = createStreamTextLayout();
  const lagSamples: number[] = [];
  let frames = 0;
  let expected = performance.now() + 5;
  const monitor = setInterval(() => {
    const now = performance.now();
    lagSamples.push(Math.max(0, now - expected));
    expected = now + 5;
  }, 5);
  const presentation = createStreamPresentation({
    onFrame: (delta) => {
      layout.append(delta);
      renderTuiFrame({ ...frameState, streamingLayout: layout }, theme);
      frames += 1;
    },
  });
  const started = performance.now();
  for (let index = 0; index < 4_096; index += 1) presentation.push("x");
  await presentation.drain();
  const durationMs = performance.now() - started;
  clearInterval(monitor);
  Bun.gc(true);
  return {
    metrics: {
      drain_duration_ms: durationMs,
      frame_count: frames,
      heap_delta_bytes: Math.max(0, process.memoryUsage().heapUsed - heapBefore),
      lag_max_ms: Math.max(0, ...lagSamples),
      lag_p95_ms: percentile(lagSamples, 0.95),
      raw_deltas_per_frame: 4_096 / frames,
    },
    units: {
      drain_duration_ms: "ms",
      frame_count: "count",
      heap_delta_bytes: "bytes",
      lag_max_ms: "ms",
      lag_p95_ms: "ms",
      raw_deltas_per_frame: "deltas/frame",
    },
  };
};
