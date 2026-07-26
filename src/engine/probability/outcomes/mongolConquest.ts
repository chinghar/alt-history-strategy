import { clamp, type HistoricalOutcomeTracker } from '../../core/types';
import { countriesWithTag } from '../../core/queries';

/**
 * Rises with the Mongol Confederation's military dominance over its settled
 * neighbors and with its own internal cohesion (government stability) — the
 * two real drivers of the 13th-century conquests, which depended as much on
 * the confederation holding together under a single khan as on cavalry
 * tactics.
 */
export const mongolConquestTracker: HistoricalOutcomeTracker = {
  id: 'mongol-conquest',
  label: 'Mongol Conquest of Eurasia',
  realWorldReference: "Largest contiguous land empire in history, c. 1206-1368",
  estimate(world) {
    const mongols = countriesWithTag(world, 'steppe_power').find((c) => c.id === 'MON') ?? world.countries['MON'];
    if (!mongols) return 0;

    const neighbors = Object.values(world.countries).filter((c) => c.id !== 'MON');
    const avgNeighborMilitary = neighbors.length
      ? neighbors.reduce((sum, c) => sum + c.militaryStrength, 0) / neighbors.length
      : mongols.militaryStrength;
    const dominanceFactor = avgNeighborMilitary > 0 ? clamp(mongols.militaryStrength / avgNeighborMilitary - 1, 0, 1) : 0.5;

    const cohesionFactor = mongols.government.stability / 100;

    return clamp(0.1 + dominanceFactor * 0.55 + cohesionFactor * 0.35, 0, 1);
  },
};
