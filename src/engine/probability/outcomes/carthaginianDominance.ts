import { clamp, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with Carthage's combined economic and military weight relative to
 * its main western rival, Syracuse, and with Carthaginian fiscal health.
 * If Syracuse gets dragged into the Peloponnesian War and weakened, this
 * moves without anything touching Carthage directly.
 */
export const carthaginianDominanceTracker: HistoricalOutcomeTracker = {
  id: 'carthaginian-dominance',
  label: 'Carthaginian Dominance of the Western Mediterranean',
  realWorldReference: 'Peak Carthaginian power before the Punic Wars',
  estimate(world) {
    const carthage = world.countries['CAR'];
    const syracuse = world.countries['SYR'];
    if (!carthage) return 0;

    const rivalStrength = syracuse ? syracuse.gdp + syracuse.militaryStrength * 2 : 1;
    const ownStrength = carthage.gdp + carthage.militaryStrength * 2;
    const total = rivalStrength + ownStrength;
    const strengthFactor = total > 0 ? ownStrength / total : 0.5;

    const fiscalHealth = carthage.gdp > 0 ? clamp(1 - carthage.debt / carthage.gdp, 0, 1) : 0.5;

    return clamp(0.15 + strengthFactor * 0.6 + fiscalHealth * 0.25, 0, 1);
  },
};
