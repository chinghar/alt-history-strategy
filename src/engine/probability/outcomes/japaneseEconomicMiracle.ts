import { clamp, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with Japan's sustained GDP growth rate and government stability —
 * the two real ingredients of the postwar "economic miracle" (double-digit
 * annual growth sustained for years, underpinned by political calm rare
 * elsewhere in the era).
 */
export const japaneseEconomicMiracleTracker: HistoricalOutcomeTracker = {
  id: 'japanese-economic-miracle',
  label: 'Japanese Economic Miracle',
  realWorldReference: "World's second-largest economy by 1968",
  estimate(world) {
    const japan = world.countries['JPN'];
    if (!japan) return 0;

    const growthFactor = clamp(japan.gdpGrowth / 0.08, 0, 1);
    const stabilityFactor = japan.government.stability / 100;

    return clamp(0.15 + growthFactor * 0.55 + stabilityFactor * 0.3, 0, 1);
  },
};
