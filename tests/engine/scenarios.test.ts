import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { recomputeAllProbabilities } from '../../src/engine/probability/historicalProbabilityEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario431bce } from '../../src/data/scenarios/431bce';
import { scenario2150 } from '../../src/data/scenarios/2150';

describe('scenario isolation', () => {
  it('1836 only carries its own four trackers', () => {
    const world = buildWorld(scenario1836);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['german-unification', 'american-civil-war', 'ottoman-decline', 'opium-war-british-victory'].sort(),
    );
  });

  it('431 BCE only carries its own four trackers', () => {
    const world = buildWorld(scenario431bce);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['spartan-victory', 'macedonian-hegemony', 'carthaginian-dominance', 'roman-ascendancy'].sort(),
    );
  });

  it('431 BCE starts with sane, non-degenerate probabilities', () => {
    const world = buildWorld(scenario431bce);
    for (const track of Object.values(world.probabilities)) {
      expect(track.current).toBeGreaterThan(0);
      expect(track.current).toBeLessThan(1);
    }
  });

  it('1836 has a genuinely global 22-country roster', () => {
    const world = buildWorld(scenario1836);
    expect(Object.keys(world.countries)).toHaveLength(22);
    for (const id of ['CHN', 'JPN', 'BRA', 'PER', 'SIC', 'MAR']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('431 BCE has a genuinely global 15-country roster', () => {
    const world = buildWorld(scenario431bce);
    expect(Object.keys(world.countries)).toHaveLength(15);
    for (const id of ['ROM', 'THR', 'KSH', 'MAG', 'CHU']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('2150 carries no Historical Probability trackers — nothing has happened yet', () => {
    const world = buildWorld(scenario2150);
    expect(Object.keys(world.probabilities)).toHaveLength(0);
  });

  it('2150 has a genuinely global 10-power roster including the Lunar Commonwealth', () => {
    const world = buildWorld(scenario2150);
    expect(Object.keys(world.countries)).toHaveLength(10);
    for (const id of ['USA', 'CHN', 'EUF', 'IND', 'AFU', 'RUS', 'PPA', 'SAU', 'LUC', 'ARC']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('stamps scenarioId onto WorldState for save-slot routing', () => {
    expect(buildWorld(scenario1836).scenarioId).toBe('1836');
    expect(buildWorld(scenario431bce).scenarioId).toBe('431bce');
    expect(buildWorld(scenario2150).scenarioId).toBe('2150');
  });

  it('is deterministic for the 2150 scenario across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario2150), 25);
    const worldB = advanceTurns(buildWorld(scenario2150), 25);
    expect(worldA).toEqual(worldB);
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
