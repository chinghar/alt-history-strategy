import {
  clamp,
  relationKey,
  type CountryId,
  type EngineResult,
  type Rng,
  type TreatyType,
  type WorldState,
} from '../core/types';

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

/**
 * Player decision: unilaterally set or revoke a treaty between two
 * countries (mirrors how aiEngine forms treaties for AI countries, so the
 * player isn't held to a different standard). Creates the relation with a
 * neutral starting score if the two countries had no prior relation.
 */
export function setTreaty(
  world: WorldState,
  a: CountryId,
  b: CountryId,
  treaty: TreatyType,
  active: boolean,
): WorldState {
  const key = relationKey(a, b);
  const relation = world.relations[key] ?? { a, b, score: 0, treaties: [] };
  const treaties = active
    ? relation.treaties.includes(treaty)
      ? relation.treaties
      : [...relation.treaties, treaty]
    : relation.treaties.filter((t) => t !== treaty);

  return {
    ...world,
    relations: { ...world.relations, [key]: { ...relation, treaties } },
  };
}
