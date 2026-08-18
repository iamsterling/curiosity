import type { FeatureCleanup, FeatureRegistration, OpenCodeContext } from "./contracts.js";
import { preservePrimaryError, runAllReverse } from "./lifecycle.js";

export const composeFeatures =
  (features: readonly FeatureRegistration[]) =>
  async (context: OpenCodeContext): Promise<FeatureCleanup> => {
    const cleanups: FeatureCleanup[] = [];
    try {
      for (const feature of features) {
        const cleanup = await feature.register(context);
        if (cleanup) cleanups.push(cleanup);
      }
    } catch (error) {
      try {
        await runAllReverse(cleanups);
      } catch (cleanupError) {
        throw preservePrimaryError(error, cleanupError);
      }
      throw error;
    }
    let cleaned = false;
    return async () => {
      if (cleaned) return;
      cleaned = true;
      await runAllReverse(cleanups);
    };
  };
