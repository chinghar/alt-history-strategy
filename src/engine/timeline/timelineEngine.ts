import type { GameEvent, WorldState } from '../core/types';

/** Promotes the turn's notable-or-bigger events into the permanent historical record. */
export function recordTimeline(world: WorldState, turnEvents: GameEvent[]): WorldState {
  const entries = turnEvents
    .filter((event) => event.severity === 'major' || event.severity === 'notable')
    .map((event) => ({
      id: `tl-${event.id}`,
      turn: event.turn,
      year: event.year,
      title: event.text,
      description: event.text,
      tags: [event.type],
      countryIds: event.countryIds,
    }));

  if (entries.length === 0) return world;
  return { ...world, timeline: [...world.timeline, ...entries] };
}
