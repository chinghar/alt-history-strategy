import { clamp, type HistoricalOutcomeTracker } from '../../core/types';
import { isAtWar } from '../../core/queries';

/**
 * Rises with Russian government instability, low public opinion, and — the
 * historically decisive factor — active war strain. It was the Eastern
 * Front's grinding losses, not domestic politics alone, that turned 1917's
 * unrest into an actual collapse of the Tsarist state. Already realized
 * (0.97) once Russia's government has actually changed to a republic or
 * confederation, matching the pattern used elsewhere for a tracker whose
 * outcome has already happened in the simulation.
 */
export const russianRevolutionTracker: HistoricalOutcomeTracker = {
  id: 'russian-revolution',
  label: 'Russian Revolution',
  realWorldReference: 'October Revolution overthrows the Tsar, 1917',
  estimate(world) {
    const russia = world.countries['RUS'];
    if (!russia) return 0;

    if (russia.government.type === 'republic' || russia.government.type === 'confederation') {
      return 0.97;
    }

    const instabilityFactor = (100 - russia.government.stability) / 100;
    const opinionFactor = (100 - russia.publicOpinion) / 100;
    const warStrainFactor = isAtWar(world, 'RUS') ? 0.3 : 0;

    return clamp(0.05 + instabilityFactor * 0.35 + opinionFactor * 0.3 + warStrainFactor, 0, 1);
  },
};
