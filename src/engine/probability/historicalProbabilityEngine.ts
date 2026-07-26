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

export function recomputeAllProbabilities(world: WorldState): WorldState {
  const probabilities: Record<OutcomeId, ProbabilityTrack> = { ...world.probabilities };

  for (const tracker of trackers) {
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
