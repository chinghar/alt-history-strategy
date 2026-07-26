import {
  clamp,
  relationKey,
  type Country,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type Rng,
  type War,
  type WorldState,
} from '../core/types';
import { getCountryRelations, getOtherParty, findWarBetween } from '../core/queries';

function alliesOf(world: WorldState, countryId: CountryId): CountryId[] {
  return getCountryRelations(world, countryId)
    .filter((r) => r.treaties.includes('alliance'))
    .map((r) => getOtherParty(r, countryId));
}

/**
 * Player/AI decision: declare war. Pulls in each side's existing allies —
 * this is how a local conflict cascades into a wider one without any
 * scripting, the same way alliance webs dragged the great powers into 1914.
 * No-ops if the two are already at war.
 */
export function declareWar(world: WorldState, attackerId: CountryId, defenderId: CountryId): WorldState {
  if (attackerId === defenderId) return world;
  if (findWarBetween(world, attackerId, defenderId)) return world;

  const attackerAllies = alliesOf(world, attackerId).filter((id) => id !== defenderId && id in world.countries);
  const defenders0 = new Set([defenderId, ...alliesOf(world, defenderId)]);
  const attackers = Array.from(new Set([attackerId, ...attackerAllies.filter((id) => !defenders0.has(id))]));
  const defenders = Array.from(defenders0).filter((id) => id in world.countries && !attackers.includes(id));

  const war: War = {
    id: `war-${attackerId}-${defenderId}-${world.turn}`,
    attackers,
    defenders,
    startTurn: world.turn,
    startYear: world.date.year,
    exhaustion: Object.fromEntries([...attackers, ...defenders].map((id) => [id, 0])),
  };

  const relations = { ...world.relations };
  for (const a of attackers) {
    for (const d of defenders) {
      const key = relationKey(a, d);
      const existing = relations[key] ?? { a, b: d, score: 0, treaties: [] };
      relations[key] = { ...existing, score: -100 };
    }
  }

  return { ...world, wars: { ...world.wars, [war.id]: war }, relations };
}

/**
 * Player decision: unilaterally end a war you're a party to. Cheaper than
 * fighting to capitulation, but not free — you're conceding, not winning.
 */
export function suePeace(world: WorldState, countryId: CountryId): WorldState {
  const war = Object.values(world.wars).find(
    (w) => w.attackers.includes(countryId) || w.defenders.includes(countryId),
  );
  if (!war) return world;

  const ownSide = war.attackers.includes(countryId) ? war.attackers : war.defenders;
  const countries = { ...world.countries };
  for (const id of ownSide) {
    const c = countries[id];
    if (!c) continue;
    countries[id] = {
      ...c,
      government: { ...c.government, stability: clamp(c.government.stability - 8, 0, 100) },
      publicOpinion: clamp(c.publicOpinion - 5, 0, 100),
      debt: c.debt + c.gdp * 0.05,
    };
  }

  const wars = { ...world.wars };
  delete wars[war.id];
  return { ...world, countries, wars };
}

const EXHAUSTION_PER_TURN_WINNER = 4;
const EXHAUSTION_PER_TURN_LOSER = 9;
const CAPITULATION_THRESHOLD = 100;

function sideStrength(world: WorldState, side: CountryId[]): number {
  return side.reduce((sum, id) => sum + (world.countries[id]?.militaryStrength ?? 0), 0);
}

function applyBattleLosses(country: Country, isLoser: boolean, rng: Rng): Country {
  const attritionRate = isLoser ? 0.05 : 0.015;
  const militaryStrength = Math.max(
    0,
    country.militaryStrength - country.militaryStrength * attritionRate - rng.next() * (isLoser ? 3 : 0.5),
  );
  return isLoser
    ? {
        ...country,
        militaryStrength,
        gdp: Math.max(1, country.gdp * 0.995),
        publicOpinion: clamp(country.publicOpinion - 1.5, 0, 100),
      }
    : { ...country, militaryStrength };
}

/** Resolves one round of combat per active war: a strength check with jitter, attrition for both sides, and capitulation once the losing side's average exhaustion maxes out. */
export function tick(world: WorldState, rng: Rng): EngineResult {
  let countries = { ...world.countries };
  const wars = { ...world.wars };
  const events: GameEvent[] = [];

  for (const war of Object.values(world.wars)) {
    const attackerRoll = sideStrength(world, war.attackers) * (0.8 + rng.next() * 0.4);
    const defenderRoll = sideStrength(world, war.defenders) * (0.8 + rng.next() * 0.4);
    const attackersWinning = attackerRoll >= defenderRoll;
    const winners = attackersWinning ? war.attackers : war.defenders;
    const losers = attackersWinning ? war.defenders : war.attackers;

    const exhaustion = { ...war.exhaustion };
    for (const id of winners) exhaustion[id] = clamp((exhaustion[id] ?? 0) + EXHAUSTION_PER_TURN_WINNER, 0, 100);
    for (const id of losers) exhaustion[id] = clamp((exhaustion[id] ?? 0) + EXHAUSTION_PER_TURN_LOSER, 0, 100);

    for (const id of losers) {
      const c = countries[id];
      if (c) countries[id] = applyBattleLosses(c, true, rng);
    }
    for (const id of winners) {
      const c = countries[id];
      if (c) countries[id] = applyBattleLosses(c, false, rng);
    }

    const loserExhaustionAvg = losers.reduce((sum, id) => sum + (exhaustion[id] ?? 0), 0) / losers.length;

    if (loserExhaustionAvg >= CAPITULATION_THRESHOLD) {
      for (const id of losers) {
        const c = countries[id];
        if (!c) continue;
        countries[id] = {
          ...c,
          government: { ...c.government, stability: clamp(c.government.stability - 15, 0, 100) },
          debt: c.debt + c.gdp * 0.1,
          publicOpinion: clamp(c.publicOpinion - 10, 0, 100),
        };
      }
      for (const id of winners) {
        const c = countries[id];
        if (!c) continue;
        countries[id] = { ...c, publicOpinion: clamp(c.publicOpinion + 8, 0, 100) };
      }

      delete wars[war.id];
      events.push({
        id: `war-end-${war.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'war_ended',
        countryIds: [...winners, ...losers],
        text: `${world.countries[winners[0]].name} forces the capitulation of ${losers
          .map((id) => world.countries[id].name)
          .join(', ')}, ending the war.`,
        severity: 'major',
      });
    } else {
      wars[war.id] = { ...war, exhaustion };
    }
  }

  return { world: { ...world, countries, wars }, events };
}
