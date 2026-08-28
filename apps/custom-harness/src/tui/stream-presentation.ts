const DEFAULT_FRAME_INTERVAL_MS = 24;
const DEFAULT_FRAME_CODE_POINTS = 64;
const DEFAULT_MAXIMUM_CODE_POINTS = 128 * 1024;

export interface StreamPresentationOptions {
  readonly frameCodePoints?: number;
  readonly frameIntervalMs?: number;
  readonly maximumCodePoints?: number;
  readonly onFrame: (delta: string) => void;
}

export interface StreamPresentation {
  readonly drain: () => Promise<void>;
  readonly push: (delta: string) => void;
  readonly stop: () => void;
}

export const createStreamPresentation = (
  options: StreamPresentationOptions,
): StreamPresentation => {
  const frameCodePoints = Math.max(
    1,
    options.frameCodePoints ?? DEFAULT_FRAME_CODE_POINTS,
  );
  const frameIntervalMs = Math.max(
    1,
    options.frameIntervalMs ?? DEFAULT_FRAME_INTERVAL_MS,
  );
  const maximumCodePoints = Math.max(
    1,
    options.maximumCodePoints ?? DEFAULT_MAXIMUM_CODE_POINTS,
  );
  const chunks: string[][] = [];
  const drainWaiters: Array<() => void> = [];
  let acceptedCodePoints = 0;
  let chunkIndex = 0;
  let chunkOffset = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const pending = (): boolean => chunkIndex < chunks.length;

  const settleDrains = (): void => {
    if (pending()) return;
    for (const resolve of drainWaiters.splice(0)) resolve();
  };

  const takeFrame = (): string => {
    const frame: string[] = [];
    while (frame.length < frameCodePoints && pending()) {
      const chunk = chunks[chunkIndex]!;
      const available = frameCodePoints - frame.length;
      const end = Math.min(chunk.length, chunkOffset + available);
      frame.push(...chunk.slice(chunkOffset, end));
      chunkOffset = end;
      if (chunkOffset >= chunk.length) {
        chunkIndex += 1;
        chunkOffset = 0;
      }
    }
    if (chunkIndex > 1_024 && chunkIndex * 2 > chunks.length) {
      chunks.splice(0, chunkIndex);
      chunkIndex = 0;
    }
    return frame.join("");
  };

  const schedule = (): void => {
    if (stopped || timer !== undefined || !pending()) return;
    timer = setTimeout(() => {
      timer = undefined;
      const delta = takeFrame();
      if (delta) options.onFrame(delta);
      if (pending()) schedule();
      else settleDrains();
    }, frameIntervalMs);
  };

  return Object.freeze({
    drain: async (): Promise<void> => {
      if (stopped || !pending()) return;
      schedule();
      await new Promise<void>((resolve) => drainWaiters.push(resolve));
    },
    push: (delta: string): void => {
      if (stopped || !delta || acceptedCodePoints >= maximumCodePoints) return;
      const codePoints = Array.from(delta);
      const accepted = codePoints.slice(
        0,
        maximumCodePoints - acceptedCodePoints,
      );
      if (accepted.length === 0) return;
      acceptedCodePoints += accepted.length;
      chunks.push(accepted);
      schedule();
    },
    stop: (): void => {
      if (stopped) return;
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      chunks.length = 0;
      chunkIndex = 0;
      chunkOffset = 0;
      settleDrains();
    },
  });
};
