import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises as the USSR-China relation score deteriorates and as their public
 * opinion levels diverge — a rough proxy for the real ideological rift over
 * who spoke for world communism, which hardened from private disagreement
 * into open rupture through the early 1960s.
 */
export const sinoSovietSplitTracker: HistoricalOutcomeTracker = {
  id: 'sino-soviet-split',
  label: 'Sino-Soviet Split',
  realWorldReference: 'Ideological rift formalizes, c. 1960-1962',
  estimate(world) {
    const ussr = world.countries['USR'];
    const china = world.countries['CHN'];
    if (!ussr || !china) return 0;

    const relation = world.relations[relationKey('USR', 'CHN')];
    const tensionFactor = relation ? (100 - relation.score) / 200 : 0.5;
    const divergenceFactor = clamp(Math.abs(ussr.publicOpinion - china.publicOpinion) / 100, 0, 1);

    return clamp(0.2 + tensionFactor * 0.55 + divergenceFactor * 0.25, 0, 1);
  },
};
