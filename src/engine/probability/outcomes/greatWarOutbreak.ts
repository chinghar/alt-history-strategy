import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';
import { countriesWithTag, findWarBetween } from '../../core/queries';

/**
 * Rises with hostility between the two alliance blocs (average relation
 * score across every central_powers/entente pair) and jumps sharply once an
 * actual war links two great powers from opposite blocs — the alliance web
 * doing exactly what it did in August 1914, dragging a local dispute into a
 * general war.
 */
export const greatWarOutbreakTracker: HistoricalOutcomeTracker = {
  id: 'great-war-outbreak',
  label: 'Outbreak of the Great War',
  realWorldReference: 'General European war, August 1914',
  estimate(world) {
    const centralPowers = countriesWithTag(world, 'central_powers');
    const entente = countriesWithTag(world, 'entente');
    if (centralPowers.length === 0 || entente.length === 0) return 0;

    let scoreSum = 0;
    let pairCount = 0;
    let blocsAtWar = false;
    for (const cp of centralPowers) {
      for (const en of entente) {
        const relation = world.relations[relationKey(cp.id, en.id)];
        if (relation) {
          scoreSum += relation.score;
          pairCount++;
        }
        if (findWarBetween(world, cp.id, en.id)) blocsAtWar = true;
      }
    }
    const avgScore = pairCount > 0 ? scoreSum / pairCount : 0;
    const tensionFactor = (100 - avgScore) / 200;

    return clamp(0.1 + tensionFactor * 0.6 + (blocsAtWar ? 0.3 : 0), 0, 1);
  },
};
