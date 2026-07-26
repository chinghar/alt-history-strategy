import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with Byzantine fiscal/military weakness and with the deterioration
 * of Venice's relation with Constantinople — historically the real trigger:
 * Venice diverted the underfunded Fourth Crusade to Constantinople to
 * settle its own trade and debt grievances with the Byzantines, not out of
 * any planned anti-Byzantine campaign.
 */
export const fallOfConstantinopleTracker: HistoricalOutcomeTracker = {
  id: 'fall-of-constantinople',
  label: 'Sack of Constantinople',
  realWorldReference: 'Sacked by the Fourth Crusade, 1204',
  estimate(world) {
    const byz = world.countries['BYZ'];
    const ven = world.countries['VEN'];
    if (!byz) return 0;

    const debtRatio = byz.gdp > 0 ? clamp(byz.debt / byz.gdp, 0, 2) / 2 : 0.5;
    const instabilityFactor = (100 - byz.government.stability) / 100;

    let tensionFactor = 0.4;
    if (ven) {
      const relation = world.relations[relationKey('BYZ', 'VEN')];
      tensionFactor = relation ? (100 - relation.score) / 200 : 0.5;
    }

    return clamp(0.15 + debtRatio * 0.3 + instabilityFactor * 0.3 + tensionFactor * 0.25, 0, 1);
  },
};
