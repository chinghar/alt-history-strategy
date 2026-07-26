import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { recomputeAllProbabilities } from '../../src/engine/probability/historicalProbabilityEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario431bce } from '../../src/data/scenarios/431bce';
import { scenario1200ce } from '../../src/data/scenarios/1200ce';
import { scenario1914 } from '../../src/data/scenarios/1914';
import { scenario1962 } from '../../src/data/scenarios/1962';
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

  it('1200 CE only carries its own three trackers', () => {
    const world = buildWorld(scenario1200ce);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['mongol-conquest', 'fall-of-constantinople', 'khwarezmian-destruction'].sort(),
    );
  });

  it('1914 only carries its own three trackers, including the reused Ottoman Decline tracker', () => {
    const world = buildWorld(scenario1914);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['great-war-outbreak', 'russian-revolution', 'ottoman-decline'].sort(),
    );
  });

  it('1962 only carries its own three trackers', () => {
    const world = buildWorld(scenario1962);
    expect(Object.keys(world.probabilities).sort()).toEqual(
      ['cuban-missile-crisis-peace', 'sino-soviet-split', 'japanese-economic-miracle'].sort(),
    );
  });

  it('1200 CE has a genuinely global 13-country roster', () => {
    const world = buildWorld(scenario1200ce);
    expect(Object.keys(world.countries)).toHaveLength(13);
    for (const id of ['MON', 'SNG', 'JIN', 'BYZ', 'KHR', 'DEL', 'VEN', 'KHM']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('1914 has a 10-country roster split across the two alliance blocs', () => {
    const world = buildWorld(scenario1914);
    expect(Object.keys(world.countries)).toHaveLength(10);
    for (const id of ['GER', 'AUH', 'RUS', 'FRA', 'GBR', 'OTT', 'ITA', 'SRB', 'JPN', 'USA']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('1962 has a 10-country roster spanning both Cold War blocs and the non-aligned world', () => {
    const world = buildWorld(scenario1962);
    expect(Object.keys(world.countries)).toHaveLength(10);
    for (const id of ['USA', 'USR', 'CHN', 'GBR', 'FRA', 'FRG', 'GDR', 'CUB', 'IND', 'JPN']) {
      expect(world.countries[id]).toBeDefined();
    }
  });

  it('only 1836/1914 activate a US/UK-style legislature; 1200 CE has none', () => {
    expect(buildWorld(scenario1200ce).activeLegislatureCountryIds).toEqual([]);
    expect(buildWorld(scenario1914).activeLegislatureCountryIds).toEqual(['GER', 'RUS']);
    expect(buildWorld(scenario1962).activeLegislatureCountryIds).toEqual(['USR']);
  });

  it('stamps scenarioId onto WorldState for save-slot routing', () => {
    expect(buildWorld(scenario1836).scenarioId).toBe('1836');
    expect(buildWorld(scenario431bce).scenarioId).toBe('431bce');
    expect(buildWorld(scenario1200ce).scenarioId).toBe('1200ce');
    expect(buildWorld(scenario1914).scenarioId).toBe('1914');
    expect(buildWorld(scenario1962).scenarioId).toBe('1962');
    expect(buildWorld(scenario2150).scenarioId).toBe('2150');
  });

  it('is deterministic for the 1200 CE scenario across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1200ce), 25);
    const worldB = advanceTurns(buildWorld(scenario1200ce), 25);
    expect(worldA).toEqual(worldB);
  });

  it('is deterministic for the 1914 scenario across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1914), 25);
    const worldB = advanceTurns(buildWorld(scenario1914), 25);
    expect(worldA).toEqual(worldB);
  });

  it('is deterministic for the 1962 scenario across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1962), 25);
    const worldB = advanceTurns(buildWorld(scenario1962), 25);
    expect(worldA).toEqual(worldB);
  });

  it('the Cuban Missile Crisis Peace tracker falls as USA-USSR relations sour and collapses once they go to war', () => {
    let world = buildWorld(scenario1962);
    const before = world.probabilities['cuban-missile-crisis-peace'].current;

    const relations = {
      ...world.relations,
      'USA:USR': { a: 'USA', b: 'USR', score: -100, treaties: [] },
    } as typeof world.relations;
    world = recomputeAllProbabilities({ ...world, relations });
    expect(world.probabilities['cuban-missile-crisis-peace'].current).toBeLessThan(before);

    const wars = {
      war1: {
        id: 'war1',
        attackers: ['USA'],
        defenders: ['USR'],
        startTurn: 0,
        startYear: 1962,
        exhaustion: { USA: 0, USR: 0 },
      },
    };
    world = recomputeAllProbabilities({ ...world, wars });
    expect(world.probabilities['cuban-missile-crisis-peace'].current).toBeLessThan(0.1);
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
