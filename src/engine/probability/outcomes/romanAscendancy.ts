import { clamp, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with Rome's combined economic and military weight relative to its
 * eventual Mediterranean rivals — Carthage and Syracuse — and with Roman
 * domestic stability. Starts low and honest: in 431 BCE Rome is still a
 * middling regional city-state, centuries from the dominance history knows
 * it eventually reached.
 */
export const romanAscendancyTracker: HistoricalOutcomeTracker = {
  id: 'roman-ascendancy',
  label: 'Roman Ascendancy in the Mediterranean',
  realWorldReference: 'Dominates Italy by 275 BCE, defeats Carthage by 146 BCE',
  estimate(world) {
    const rome = world.countries['ROM'];
    if (!rome) return 0;

    const rivals = ['CAR', 'SYR'].map((id) => world.countries[id]).filter((c) => c !== undefined);
    const rivalStrength = rivals.length
      ? rivals.reduce((sum, c) => sum + c.gdp + c.militaryStrength * 2, 0) / rivals.length
      : 1;
    const ownStrength = rome.gdp + rome.militaryStrength * 2;
    const total = rivalStrength + ownStrength;
    const strengthFactor = total > 0 ? ownStrength / total : 0.5;
    const stabilityFactor = rome.government.stability / 100;

    return clamp(0.05 + strengthFactor * 0.55 + stabilityFactor * 0.25, 0, 1);
  },
};
