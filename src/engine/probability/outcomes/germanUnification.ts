import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';
import { countriesWithTag } from '../../core/queries';

/**
 * Rises with pan-German sentiment (average relation score between German
 * Confederation states) and with Prussia's economic weight relative to its
 * rivals — the two real drivers of 1871 unification under Prussian
 * leadership. Nothing here hardcodes "unification happens in year X".
 */
export const germanUnificationTracker: HistoricalOutcomeTracker = {
  id: 'german-unification',
  label: 'German Unification',
  realWorldReference: 'Unified under Prussia, 1871',
  estimate(world) {
    const states = countriesWithTag(world, 'german_state');
    if (states.length < 2) return 0;

    let pairScoreSum = 0;
    let pairCount = 0;
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const relation = world.relations[relationKey(states[i].id, states[j].id)];
        if (relation) {
          pairScoreSum += relation.score;
          pairCount++;
        }
      }
    }
    const avgRelation = pairCount > 0 ? pairScoreSum / pairCount : 0;
    const relationFactor = (avgRelation + 100) / 200;

    const prussia = states.find((s) => s.id === 'PRU');
    const totalGdp = states.reduce((sum, c) => sum + c.gdp, 0);
    // Prussia's GDP share of all tagged German states, 0..1, centered on 0.5 at parity.
    const dominanceFactor = prussia && totalGdp > 0 ? clamp(prussia.gdp / totalGdp, 0, 1) : 0.5;

    const nationalistShare = states.filter((s) => s.ideology === 'nationalist').length / states.length;

    return clamp(0.15 + relationFactor * 0.35 + dominanceFactor * 0.35 + nationalistShare * 0.15, 0, 1);
  },
};
