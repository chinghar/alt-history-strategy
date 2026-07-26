import { clamp, type HistoricalOutcomeTracker } from '../../core/types';
import { countriesWithTag } from '../../core/queries';

/**
 * Rises with Macedon's military weight relative to the Greek poleis, and —
 * this is the point — with how exhausted those poleis have become. The
 * longer and more destructive the Peloponnesian War runs, the more this
 * climbs on its own: a genuine butterfly effect from a war fought a
 * continent away from Macedon.
 */
export const macedonianHegemonyTracker: HistoricalOutcomeTracker = {
  id: 'macedonian-hegemony',
  label: 'Macedonian Hegemony over Greece',
  realWorldReference: 'Philip II dominates Greece after Chaeronea, 338 BCE',
  estimate(world) {
    const macedon = world.countries['MAC'];
    const poleis = countriesWithTag(world, 'greek_polis');
    if (!macedon || poleis.length === 0) return 0;

    const avgPoleisStrength = poleis.reduce((sum, c) => sum + c.militaryStrength, 0) / poleis.length;
    const avgPoleisStability = poleis.reduce((sum, c) => sum + c.government.stability, 0) / poleis.length;

    const relativeStrength =
      avgPoleisStrength > 0 ? clamp(macedon.militaryStrength / avgPoleisStrength, 0, 3) / 3 : 0.5;
    const exhaustionFactor = (100 - avgPoleisStability) / 100;

    return clamp(0.05 + relativeStrength * 0.45 + exhaustionFactor * 0.5, 0, 1);
  },
};
