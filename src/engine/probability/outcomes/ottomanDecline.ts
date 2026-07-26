import { clamp, type HistoricalOutcomeTracker } from '../../core/types';
import { countriesWithTag } from '../../core/queries';

/**
 * Rises with fiscal strain (debt/GDP), domestic instability, and a widening
 * military gap against rival great powers — the real pressures behind the
 * 19th/20th-century Ottoman decline, tracked continuously rather than
 * assumed inevitable.
 */
export const ottomanDeclineTracker: HistoricalOutcomeTracker = {
  id: 'ottoman-decline',
  label: 'Fall of the "Sick Man of Europe"',
  realWorldReference: 'Ottoman collapse/dissolution, 1908-1922',
  estimate(world) {
    const ottoman = world.countries['OTT'];
    if (!ottoman) return 0;

    const debtRatio = ottoman.gdp > 0 ? clamp(ottoman.debt / ottoman.gdp, 0, 2) / 2 : 0.5;
    const instabilityFactor = (100 - ottoman.government.stability) / 100;

    const rivals = countriesWithTag(world, 'great_power').filter((c) => c.id !== 'OTT');
    const avgRivalMilitary = rivals.length
      ? rivals.reduce((sum, c) => sum + c.militaryStrength, 0) / rivals.length
      : ottoman.militaryStrength;
    const militaryGap = avgRivalMilitary > 0 ? clamp(1 - ottoman.militaryStrength / avgRivalMilitary, 0, 1) : 0;

    return clamp(0.2 + debtRatio * 0.3 + instabilityFactor * 0.25 + militaryGap * 0.25, 0, 1);
  },
};
