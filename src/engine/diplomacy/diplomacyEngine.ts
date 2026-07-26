import { clamp, relationKey, type EngineResult, type Rng, type WorldState } from '../core/types';

export function tick(world: WorldState, rng: Rng): EngineResult {
  const relations = { ...world.relations };

  for (const relation of Object.values(world.relations)) {
    const key = relationKey(relation.a, relation.b);
    const a = world.countries[relation.a];
    const b = world.countries[relation.b];

    let drift = 0;
    drift += a.ideology === b.ideology ? 0.3 : -0.1;
    if (relation.treaties.includes('trade_agreement')) drift += 0.5;
    if (relation.treaties.includes('alliance')) drift += 0.2;
    if (relation.treaties.includes('sanction')) drift -= 1.0;
    if (a.tags.some((tag) => tag !== 'great_power' && b.tags.includes(tag))) drift += 0.4;

    const jitter = (rng.next() - 0.5) * 0.6;
    relations[key] = {
      ...relation,
      score: clamp(relation.score + drift + jitter, -100, 100),
    };
  }

  return { world: { ...world, relations }, events: [] };
}
