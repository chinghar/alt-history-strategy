import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with Britain's military-technological edge over Qing China (which
 * historically decided the war far more than raw numbers — China's
 * population and economy dwarfed Britain's), with the deterioration of
 * Anglo-Chinese relations over the Canton trade dispute, and with Chinese
 * domestic instability limiting the Qing court's ability to respond.
 */
export const opiumWarTracker: HistoricalOutcomeTracker = {
  id: 'opium-war-british-victory',
  label: 'British Victory in the Opium War',
  realWorldReference: 'Treaty of Nanking, 1842',
  estimate(world) {
    const gbr = world.countries['GBR'];
    const chn = world.countries['CHN'];
    if (!gbr || !chn) return 0;

    const militaryGap = gbr.militaryStrength > 0 ? clamp(1 - chn.militaryStrength / gbr.militaryStrength, 0, 1) : 0;
    const relation = world.relations[relationKey('GBR', 'CHN')];
    const tensionFactor = relation ? (100 - relation.score) / 200 : 0.5;
    const chinaInstability = (100 - chn.government.stability) / 100;

    return clamp(0.3 + militaryGap * 0.4 + tensionFactor * 0.15 + chinaInstability * 0.15, 0, 1);
  },
};
