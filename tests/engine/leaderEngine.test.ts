import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { tick as leaderTick, forceLeadershipChange } from '../../src/engine/leadership/leaderEngine';
import { createRng } from '../../src/engine/core/rng';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario2150 } from '../../src/data/scenarios/2150';
import { scenarioList } from '../../src/data/scenarios';
import { COUNTRY_NAME_POOL, generateLeaderName } from '../../src/engine/leadership/namePools';

describe('leaderEngine', () => {
  it('holds an election for a republic once its term is up, changing the leader and bumping stability/opinion', () => {
    let world = buildWorld(scenario1836); // USA is a republic
    const originalLeader = world.countries['USA'].government.leaderName;
    const originalStability = world.countries['USA'].government.stability;
    const originalOpinion = world.countries['USA'].publicOpinion;

    // Elections are on a fixed 5-turn term, not probabilistic — advance exactly that far.
    world = { ...world, turn: 5 };
    const result = leaderTick(world, createRng(1));

    const changed = result.events.find((e) => e.type === 'leader_elected' && e.countryIds.includes('USA'));
    expect(changed).toBeDefined();
    expect(result.world.countries['USA'].government.leaderName).not.toBe(originalLeader);
    expect(result.world.countries['USA'].government.stability).toBeGreaterThan(originalStability);
    expect(result.world.countries['USA'].publicOpinion).toBeGreaterThan(originalOpinion);
    expect(result.world.countries['USA'].lastLeadershipChangeTurn).toBe(5);
  });

  it('does not hold an election before the term is up', () => {
    const world = buildWorld(scenario1836);
    const result = leaderTick({ ...world, turn: 2 }, createRng(1));
    expect(result.events.some((e) => e.countryIds.includes('USA'))).toBe(false);
    expect(result.world.countries['USA'].government.leaderName).toBe(world.countries['USA'].government.leaderName);
  });

  it('eventually holds a succession for a monarchy given enough turns (probabilistic, loop until observed)', () => {
    let world = buildWorld(scenario1836); // GBR is a constitutional_monarchy
    const originalLeader = world.countries['GBR'].government.leaderName;
    const rng = createRng(7);

    let changed = false;
    for (let turn = 6; turn < 200 && !changed; turn++) {
      const result = leaderTick({ ...world, turn }, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'leader_succession' && e.countryIds.includes('GBR'))) changed = true;
    }

    expect(changed).toBe(true);
    expect(world.countries['GBR'].government.leaderName).not.toBe(originalLeader);
  });

  it('gives an institutional country a "The ..." style title instead of a person name', () => {
    let world = buildWorld(scenario2150); // every 2150 country is institutional-led
    const originalLeader = world.countries['USA'].government.leaderName;
    world = { ...world, turn: 5 };
    const result = leaderTick(world, createRng(2));

    const usaChanged = result.events.find((e) => e.type === 'leader_elected' && e.countryIds.includes('USA'));
    expect(usaChanged).toBeDefined();
    expect(result.world.countries['USA'].government.leaderName).not.toBe(originalLeader);
    expect(result.world.countries['USA'].government.leaderName).toMatch(/^The /);
  });

  it('forceLeadershipChange immediately changes a leader regardless of tenure', () => {
    const world = buildWorld(scenario1836);
    const originalLeader = world.countries['PRU'].government.leaderName;
    const result = forceLeadershipChange(world, 'PRU', createRng(4));

    expect(result.events).toHaveLength(1);
    expect(result.world.countries['PRU'].government.leaderName).not.toBe(originalLeader);
    expect(result.world.countries['PRU'].lastLeadershipChangeTurn).toBe(world.turn);
  });

  it('forceLeadershipChange no-ops for an unknown country', () => {
    const world = buildWorld(scenario1836);
    const result = forceLeadershipChange(world, 'NOPE', createRng(1));
    expect(result.events).toHaveLength(0);
    expect(result.world).toBe(world);
  });

  it('remains deterministic across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 40);
    const worldB = advanceTurns(buildWorld(scenario1836), 40);
    expect(worldA).toEqual(worldB);
  });

  it('a long game eventually replaces every scenario\'s founding leader roster at least once', () => {
    // A blunter, whole-roster version of the "leaders don't update" bug report:
    // run 1836 far enough that election terms + a healthy chance at succession
    // should have cycled through most of the 22-country roster at least once.
    let world = buildWorld(scenario1836);
    const original = Object.fromEntries(
      Object.entries(world.countries).map(([id, c]) => [id, c.government.leaderName]),
    );
    world = advanceTurns(world, 150);

    const changedCount = Object.entries(world.countries).filter(
      ([id, c]) => c.government.leaderName !== original[id],
    ).length;
    expect(changedCount).toBeGreaterThan(Object.keys(world.countries).length / 2);
  });
});

describe('leader name pools', () => {
  it('every country id used across every scenario has an explicit cultural name pool entry (no silent fallback)', () => {
    const institutionalIds = new Set(scenarioList.flatMap((s) => s.institutionalLeadershipCountryIds));
    const allIds = new Set(scenarioList.flatMap((s) => s.countries.map((c) => c.id)));

    for (const id of allIds) {
      if (institutionalIds.has(id)) continue;
      expect(COUNTRY_NAME_POOL[id], `missing name pool for personal-led country "${id}"`).toBeDefined();
    }
  });

  it('generates a monarchy-style name (first name + numeral) for hereditary governments', () => {
    const name = generateLeaderName('PRU', 'absolute_monarchy', false, createRng(1));
    expect(name).toMatch(/^\w+ (II|III|IV|V|VI|VII)$/);
  });

  it('generates an elected-style name (title + first + last) for republics', () => {
    const name = generateLeaderName('FRA', 'republic', false, createRng(1));
    const parts = name.split(' ');
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });

  it('is deterministic for a given rng state', () => {
    const a = generateLeaderName('JPN', 'constitutional_monarchy', false, createRng(9));
    const b = generateLeaderName('JPN', 'constitutional_monarchy', false, createRng(9));
    expect(a).toBe(b);
  });
});
