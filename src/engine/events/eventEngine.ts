import type { EngineResult, GameEvent, Rng, WorldState } from '../core/types';
import { templateFlavorTextProvider } from '../flavor/flavorTextProvider';

/**
 * Surfaces the turn's most notable statistical movers as narrative events by
 * diffing against the world snapshot taken before this turn's other engines
 * ran. Structural events (alliances, government crises, ...) are emitted
 * directly by the engines that cause them; this engine covers the emergent,
 * "the news noticed this" layer.
 */
export function tick(world: WorldState, previousWorld: WorldState, rng: Rng): EngineResult {
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    const before = previousWorld.countries[country.id];
    if (!before) continue;

    if (country.gdpGrowth > 0.05) {
      events.push({
        id: `boom-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'economic_boom',
        countryIds: [country.id],
        text: templateFlavorTextProvider.boomHeadline(country.name, rng),
        severity: 'minor',
      });
    } else if (country.gdpGrowth < -0.02) {
      events.push({
        id: `recession-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'recession',
        countryIds: [country.id],
        text: templateFlavorTextProvider.recessionHeadline(country.name, rng),
        severity: 'notable',
      });
    }

    if (before.publicOpinion - country.publicOpinion > 15) {
      events.push({
        id: `unrest-${country.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'opinion_collapse',
        countryIds: [country.id],
        text: templateFlavorTextProvider.unrestHeadline(country.name, rng),
        severity: 'notable',
      });
    }
  }

  return { world, events };
}
