import {
  clamp,
  relationKey,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type Rng,
  type SpyMission,
  type WorldState,
} from '../core/types';
import { TECH_REGISTRY } from '../research/techs';

/**
 * Player/AI decision: queue a spy mission. Resolution is deferred to the
 * next turn tick (see `tick` below) so it always uses that turn's seeded
 * rng — keeping the simulation deterministic even though the player can
 * order espionage at any moment, not just on turn boundaries.
 */
export function queueEspionageMission(
  world: WorldState,
  agentId: CountryId,
  targetId: CountryId,
  mission: SpyMission,
): WorldState {
  if (agentId === targetId) return world;
  return {
    ...world,
    pendingEspionageMissions: [...world.pendingEspionageMissions, { agentId, targetId, mission }],
  };
}

/** Resolves every mission queued since the last turn, then clears the queue. */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const provinces = { ...world.provinces };
  const relations = { ...world.relations };
  const events: GameEvent[] = [];

  for (const { agentId, targetId, mission } of world.pendingEspionageMissions) {
    const agent = countries[agentId];
    const target = countries[targetId];
    if (!agent || !target) continue;

    const successChance = clamp(0.5 + (100 - target.government.stability) / 200, 0.15, 0.85);
    const success = rng.next() < successChance;

    if (!success) {
      const key = relationKey(agentId, targetId);
      const relation = relations[key] ?? { a: agentId, b: targetId, score: 0, treaties: [] };
      relations[key] = { ...relation, score: clamp(relation.score - 30, -100, 100) };
      events.push({
        id: `spy-caught-${agentId}-${targetId}-${world.turn}-${events.length}`,
        turn: world.turn,
        year: world.date.year,
        type: 'espionage_exposed',
        countryIds: [agentId, targetId],
        text: `${agent.name}'s espionage against ${target.name} is exposed, causing outrage.`,
        severity: 'notable',
      });
      continue;
    }

    if (mission === 'destabilize') {
      const stability = clamp(target.government.stability - (10 + rng.next() * 10), 0, 100);
      const publicOpinion = clamp(target.publicOpinion - (5 + rng.next() * 5), 0, 100);
      countries[targetId] = { ...target, government: { ...target.government, stability }, publicOpinion };
    } else if (mission === 'sabotage' && target.provinceIds.length > 0) {
      const pid = target.provinceIds[rng.int(0, target.provinceIds.length - 1)];
      const province = provinces[pid];
      const factor = 1 - (0.08 + rng.next() * 0.08);
      provinces[pid] = { ...province, economicOutput: Math.max(1, province.economicOutput * factor) };
    } else if (mission === 'steal_tech') {
      const stealable = target.unlockedTechIds.filter((id) => !agent.unlockedTechIds.includes(id));
      if (stealable.length > 0) {
        const techId = stealable[rng.int(0, stealable.length - 1)];
        const tech = TECH_REGISTRY[techId];
        countries[agentId] = {
          ...agent,
          unlockedTechIds: [...agent.unlockedTechIds, techId],
          techGrowthBonus: agent.techGrowthBonus + (tech.effectKind === 'growth_bonus' ? tech.effectValue : 0),
          techMilitaryBonus: agent.techMilitaryBonus + (tech.effectKind === 'military_bonus' ? tech.effectValue : 0),
        };
      }
    }

    events.push({
      id: `spy-success-${agentId}-${targetId}-${world.turn}-${events.length}`,
      turn: world.turn,
      year: world.date.year,
      type: 'espionage_success',
      countryIds: [agentId, targetId],
      text: `Unconfirmed reports suggest foreign agents were active in ${target.name}.`,
      severity: 'minor',
    });
  }

  return {
    world: { ...world, countries, provinces, relations, pendingEspionageMissions: [] },
    events,
  };
}
