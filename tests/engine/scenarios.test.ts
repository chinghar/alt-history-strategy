import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { recomputeAllProbabilities } from '../../src/engine/probability/historicalProbabilityEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario431bce } from '../../src/data/scenarios/431bce';

describe('scenario isolation', () => {
  it('1836 only carries its own three trackers', () => {
    const world = buildWorld(scenario1836);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['german-unification', 'american-civil-war', 'ottoman-decline'].sort(),
    );
  });

  it('431 BCE only carries its own three trackers', () => {
    const world = buildWorld(scenario431bce);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['spartan-victory', 'macedonian-hegemony', 'carthaginian-dominance'].sort(),
    );
  });

  it('431 BCE starts with sane, non-degenerate probabilities', () => {
    const world = buildWorld(scenario431bce);
    for (const track of Object.values(world.probabilities)) {
      expect(track.current).toBeGreaterThan(0);
      expect(track.current).toBeLessThan(1);
    }
  });

  it('stamps scenarioId onto WorldState for save-slot routing', () => {
    expect(buildWorld(scenario1836).scenarioId).toBe('1836');
    expect(buildWorld(scenario431bce).scenarioId).toBe('431bce');
  });

  it('is deterministic for the 431 BCE scenario across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario431bce), 25);
    const worldB = advanceTurns(buildWorld(scenario431bce), 25);
    expect(worldA).toEqual(worldB);
  });

  it('the Macedonian hegemony tracker rises as the Greek poleis grind each other down', () => {
    // Manually crash every polis's stability to simulate a long, exhausting
    // war and confirm the tracker responds without any code that knows
    // about "the war" specifically — it only reads avg polis stability.
    let world = buildWorld(scenario431bce);
    const poleisIds = ['ATH', 'SPA', 'COR', 'THB', 'SYR', 'ARG', 'CCY'];
    const before = world.probabilities['macedonian-hegemony'].current;

    const countries = { ...world.countries };
    for (const id of poleisIds) {
      countries[id] = {
        ...countries[id],
        government: { ...countries[id].government, stability: 10 },
      };
    }
    world = recomputeAllProbabilities({ ...world, countries });

    expect(world.probabilities['macedonian-hegemony'].current).toBeGreaterThan(before);
  });
});
