import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with the military gap between the Mongols and Khwarezm and with the
 * deterioration of their relation — historically, Khwarezm's shah executed
 * a Mongol trade delegation at Otrar in 1218, turning simmering tension
 * into the invasion that erased the empire within three years.
 */
export const khwarezmianDestructionTracker: HistoricalOutcomeTracker = {
  id: 'khwarezmian-destruction',
  label: 'Mongol Destruction of Khwarezm',
  realWorldReference: 'Khwarezmian Empire destroyed, 1219-1221',
  estimate(world) {
    const mongols = world.countries['MON'];
    const khwarezm = world.countries['KHR'];
    if (!mongols || !khwarezm) return 0;

    const militaryGap = mongols.militaryStrength > 0
      ? clamp(1 - khwarezm.militaryStrength / mongols.militaryStrength, 0, 1)
      : 0;
    const relation = world.relations[relationKey('MON', 'KHR')];
    const tensionFactor = relation ? (100 - relation.score) / 200 : 0.5;
    const instabilityFactor = (100 - khwarezm.government.stability) / 100;

    return clamp(0.15 + militaryGap * 0.4 + tensionFactor * 0.25 + instabilityFactor * 0.2, 0, 1);
  },
};
