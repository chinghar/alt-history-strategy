import type { GameEvent, WorldState } from './types';
import { createRng, deriveSeed } from './rng';
import { tick as aiTick } from '../ai/aiEngine';
import { tick as diplomacyTick } from '../diplomacy/diplomacyEngine';
import { tick as politicsTick } from '../politics/politicsEngine';
import { tick as economyTick } from '../economy/economyEngine';
import { tick as researchTick } from '../research/researchEngine';
import { tick as militaryTick } from '../military/militaryEngine';
import { tick as warfareTick } from '../warfare/warfareEngine';
import { tick as espionageTick } from '../espionage/espionageEngine';
import { tick as eventsTick } from '../events/eventEngine';
import { recomputeAllProbabilities } from '../probability/historicalProbabilityEngine';
import { recordTimeline } from '../timeline/timelineEngine';

const MAX_EVENT_LOG = 300;

/**
 * Advances the world by one turn. Phase order — ai, espionage, diplomacy,
 * politics, economy, research, military, warfare, events, probability,
 * timeline — is fixed so that later phases always see the effects of
 * earlier ones within the same turn. Deterministic: identical (world, seed)
 * in always produces an identical WorldState out.
 */
export function advanceTurn(world: WorldState): WorldState {
  const turn = world.turn + 1;
  const rng = createRng(deriveSeed(world.seed, turn));
  const worldAtTurnStart = world;

  const turnEvents: GameEvent[] = [];
  let next = world;

  for (const phase of [
    aiTick,
    espionageTick,
    diplomacyTick,
    politicsTick,
    economyTick,
    researchTick,
    militaryTick,
    warfareTick,
  ]) {
    const result = phase(next, rng);
    next = result.world;
    turnEvents.push(...result.events);
  }

  const eventsResult = eventsTick(next, worldAtTurnStart, rng);
  next = eventsResult.world;
  turnEvents.push(...eventsResult.events);

  next = {
    ...next,
    turn,
    date: { ...next.date, year: next.date.year + 1 },
    eventLog: [...next.eventLog, ...turnEvents].slice(-MAX_EVENT_LOG),
  };

  next = recomputeAllProbabilities(next);
  next = recordTimeline(next, turnEvents);

  return next;
}

export function advanceTurns(world: WorldState, count: number): WorldState {
  let next = world;
  for (let i = 0; i < count; i++) {
    next = advanceTurn(next);
  }
  return next;
}
