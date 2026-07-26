import {
  relationKey,
  clamp,
  type EngineResult,
  type GameEvent,
  type Rng,
  type SpyMission,
  type WorldState,
} from '../core/types';
import { getCountryRelations, getOtherParty, isAtWar } from '../core/queries';
import { declareWar } from '../warfare/warfareEngine';
import { queueEspionageMission } from '../espionage/espionageEngine';

const WAR_RELATION_THRESHOLD = -80;
const WAR_STRENGTH_RATIO = 1.4;
const WAR_DECLARATION_CHANCE = 0.04;
const ESPIONAGE_RELATION_THRESHOLD = -50;
const ESPIONAGE_CHANCE = 0.03;
const SPY_MISSIONS: SpyMission[] = ['destabilize', 'sabotage', 'steal_tech'];

/**
 * Rule-based decisions for every AI-controlled country, run once per turn.
 * Deliberately simple heuristics for the vertical slice — this is the seam
 * where smarter, era-aware AI (or per-country personality profiles) plugs in
 * later without touching any other engine.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const relations = { ...world.relations };
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    if (country.isPlayerControlled) continue;

    const debtRatio = country.gdp > 0 ? country.debt / country.gdp : 0;
    let taxRate = country.taxRate;
    if (debtRatio > 0.6) {
      taxRate += 0.01;
    } else if (country.publicOpinion < 40 && taxRate > 0.15) {
      taxRate -= 0.01;
    }
    taxRate = clamp(taxRate + (rng.next() - 0.5) * 0.002, 0.05, 0.5);
    countries[country.id] = { ...countries[country.id], taxRate };

    for (const relation of getCountryRelations(world, country.id)) {
      const otherId = getOtherParty(relation, country.id);
      // Only the "lower" id acts, so an AI-AI pair is only evaluated once per
      // turn — except when the other side is the player, who never runs this
      // loop themselves, so whichever AI country holds the relation must act
      // regardless of id ordering or that pair would never get proposals.
      if (country.id > otherId && !world.countries[otherId]?.isPlayerControlled) continue;

      const key = relationKey(relation.a, relation.b);
      const current = relations[key] ?? relation;

      if (relation.score > 60 && !current.treaties.includes('alliance') && rng.next() < 0.15) {
        relations[key] = { ...current, treaties: [...current.treaties, 'alliance'] };
        events.push({
          id: `alliance-${key}-${world.turn}`,
          turn: world.turn,
          year: world.date.year,
          type: 'alliance_formed',
          countryIds: [relation.a, relation.b],
          text: `${world.countries[relation.a].name} and ${world.countries[relation.b].name} formalize an alliance.`,
          severity: 'notable',
        });
      } else if (relation.score < -60 && !current.treaties.includes('sanction') && rng.next() < 0.15) {
        relations[key] = { ...current, treaties: [...current.treaties, 'sanction'] };
        events.push({
          id: `sanction-${key}-${world.turn}`,
          turn: world.turn,
          year: world.date.year,
          type: 'sanction_imposed',
          countryIds: [relation.a, relation.b],
          text: `${world.countries[relation.a].name} imposes sanctions on ${world.countries[relation.b].name}.`,
          severity: 'notable',
        });
      }
    }
  }

  // Second pass: war declarations, evaluated against turn-start strength
  // figures but applied sequentially so allies dragged into an earlier
  // declaration this turn are correctly considered already-at-war.
  let warWorld: WorldState = { ...world, countries, relations };

  for (const country of Object.values(world.countries)) {
    if (country.isPlayerControlled || isAtWar(warWorld, country.id)) continue;

    for (const relation of getCountryRelations(world, country.id)) {
      const otherId = getOtherParty(relation, country.id);
      if (country.id > otherId && !world.countries[otherId]?.isPlayerControlled) continue;
      if (relation.treaties.includes('alliance')) continue;
      if (isAtWar(warWorld, otherId)) continue;

      const other = world.countries[otherId];
      const strengthRatio = other.militaryStrength > 0 ? country.militaryStrength / other.militaryStrength : 999;

      if (relation.score < WAR_RELATION_THRESHOLD && strengthRatio > WAR_STRENGTH_RATIO && rng.next() < WAR_DECLARATION_CHANCE) {
        const before = warWorld;
        warWorld = declareWar(warWorld, country.id, otherId);
        if (warWorld !== before) {
          events.push({
            id: `war-declared-${country.id}-${otherId}-${world.turn}`,
            turn: world.turn,
            year: world.date.year,
            type: 'war_declared',
            countryIds: [country.id, otherId],
            text: `${country.name} declares war on ${other.name}.`,
            severity: 'major',
          });
        }
      }
    }
  }

  // Third pass: espionage against hostile neighbors not already at war —
  // the lower-intensity option when a rival is too strong (or too distant
  // a threat) to justify open war.
  let next = warWorld;

  for (const country of Object.values(world.countries)) {
    if (country.isPlayerControlled) continue;

    for (const relation of getCountryRelations(world, country.id)) {
      const otherId = getOtherParty(relation, country.id);
      if (country.id > otherId && !world.countries[otherId]?.isPlayerControlled) continue;
      if (relation.treaties.includes('alliance')) continue;
      if (isAtWar(next, country.id) || isAtWar(next, otherId)) continue;

      if (relation.score < ESPIONAGE_RELATION_THRESHOLD && rng.next() < ESPIONAGE_CHANCE) {
        const mission = SPY_MISSIONS[rng.int(0, SPY_MISSIONS.length - 1)];
        next = queueEspionageMission(next, country.id, otherId, mission);
      }
    }
  }

  return { world: next, events };
}
