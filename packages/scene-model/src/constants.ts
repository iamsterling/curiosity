/**
 * Unified world precision policy (contracts D1/D2): one documented zoom clamp
 * range shared by the kernel and the renderer contract, and one world pan
 * limit enforced at the viewport boundary. Kernel and renderer must import
 * these constants; never re-declare a clamp. They live in the scene model —
 * the leaf package every layer depends on — so the editor package can depend
 * on the renderer without a dependency cycle.
 */
export const ZOOM_MIN = 0.01 as const;
export const ZOOM_MAX = 256 as const;
export const WORLD_LIMIT = 1e6 as const;
