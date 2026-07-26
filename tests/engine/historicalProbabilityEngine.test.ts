import { describe, expect, it } from 'vitest';
import { recomputeAllProbabilities, getRegisteredTrackers } from '../../src/engine/probability/historicalProbabilityEngine';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';

describe('historicalProbabilityEngine', () => {
  it('registers the three default 1836 trackers', () => {
    const ids = getRegisteredTrackers().map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining(['german-unification', 'american-civil-war', 'ottoman-decline']),
    );
  });

  it('keeps every probability within [0, 1] and grows history each turn', () => {
    let world = buildWorld(scenario1836);
    world = recomputeAllProbabilities(world);
    world = advanceTurns(world, 10);

    for (const track of Object.values(world.probabilities)) {
      expect(track.current).toBeGreaterThanOrEqual(0);
      expect(track.current).toBeLessThanOrEqual(1);
      expect(track.history.length).toBeGreaterThan(1);
    }
  });

  it('raises the American Civil War probability as North/South provinces diverge', () => {
    const world = buildWorld(scenario1836);
    const early = world.probabilities['american-civil-war'].current;

    const later = advanceTurns(world, 40).probabilities['american-civil-war'].current;

    expect(later).toBeGreaterThan(early);
  });
});
