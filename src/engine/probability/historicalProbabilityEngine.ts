import type { HistoricalOutcomeTracker, OutcomeId, ProbabilityTrack, WorldState } from '../core/types';
import { defaultOutcomeTrackers } from './outcomes';

const trackers: HistoricalOutcomeTracker[] = [...defaultOutcomeTrackers];

/** Extension point for mods/future eras to add their own tracked outcomes. */
export function registerOutcomeTracker(tracker: HistoricalOutcomeTracker): void {
  trackers.push(tracker);
}

export function getRegisteredTrackers(): readonly HistoricalOutcomeTracker[] {
  return trackers;
}

/**
 * Recomputes only the trackers the current scenario declared relevant
 * (world.activeOutcomeTrackerIds) — a 1938 scenario shouldn't carry a
 * "German Unification" bar, and a 431 BCE one shouldn't carry "Fall of the
 * Ottoman Empire". The registry itself stays global so mods/future eras can
 * add trackers without touching this file.
 */
export function recomputeAllProbabilities(world: WorldState): WorldState {
  const probabilities: Record<OutcomeId, ProbabilityTrack> = { ...world.probabilities };
  const active = trackers.filter((t) => world.activeOutcomeTrackerIds.includes(t.id));

  for (const tracker of active) {
    const value = Math.min(1, Math.max(0, tracker.estimate(world)));
    const existing = probabilities[tracker.id];
    probabilities[tracker.id] = {
      id: tracker.id,
      label: tracker.label,
      realWorldReference: tracker.realWorldReference,
      current: value,
      history: [...(existing?.history ?? []), { turn: world.turn, value }],
    };
  }

  return { ...world, probabilities };
}
