/**
 * A ref handle that callees are allowed to write through.
 *
 * React 19 types `RefObject<T>` as read-only in props position, but several
 * editor concerns (paste arming, live preferences) deliberately share a mutable
 * cell so a high-frequency handler can read the latest value without a
 * re-render. This states that intent explicitly.
 */
export interface MutableRef<T> {
  current: T;
}
