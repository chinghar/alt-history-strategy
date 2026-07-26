import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { declareWar, suePeace, tick as warfareTick } from '../../src/engine/warfare/warfareEngine';
import { setTreaty } from '../../src/engine/diplomacy/diplomacyEngine';
import { createRng } from '../../src/engine/core/rng';
import { findWarBetween, isAtWar } from '../../src/engine/core/queries';
import { relationKey } from '../../src/engine/core/types';

describe('warfareEngine', () => {
  it('declares a war between two countries and craters their relation', () => {
    const world = buildWorld(scenario1836);
    const atWar = declareWar(world, 'GBR', 'GRC');

    const war = findWarBetween(atWar, 'GBR', 'GRC');
    expect(war).toBeDefined();
    expect(war!.attackers).toEqual(['GBR']);
    expect(war!.defenders).toEqual(['GRC']);
    expect(atWar.relations[relationKey('GBR', 'GRC')].score).toBe(-100);
  });

  it('is a no-op if the two countries are already at war', () => {
    const world = buildWorld(scenario1836);
    const atWar = declareWar(world, 'GBR', 'GRC');
    const again = declareWar(atWar, 'GBR', 'GRC');
    expect(Object.keys(again.wars)).toHaveLength(1);
  });

  it('pulls an existing ally into the defending side', () => {
    let world = buildWorld(scenario1836);
    world = setTreaty(world, 'GRC', 'FRA', 'alliance', true);

    const atWar = declareWar(world, 'GBR', 'GRC');
    const war = findWarBetween(atWar, 'GBR', 'GRC');
    expect(war!.defenders).toEqual(expect.arrayContaining(['GRC', 'FRA']));
  });

  it('resolves combat over time: the far weaker side loses strength and eventually capitulates', () => {
    let world = buildWorld(scenario1836);
    world = declareWar(world, 'GBR', 'GRC'); // GBR ~140 military vs GRC ~12
    const rng = createRng(42);

    let ended = false;
    for (let i = 0; i < 20 && !ended; i++) {
      const result = warfareTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'war_ended')) ended = true;
    }

    expect(ended).toBe(true);
    expect(isAtWar(world, 'GRC')).toBe(false);
    expect(world.countries['GBR'].publicOpinion).toBeGreaterThanOrEqual(60); // victor gets an opinion boost from a 60 baseline
  });

  it('suePeace ends the war immediately and penalizes the seceding side', () => {
    let world = buildWorld(scenario1836);
    world = declareWar(world, 'GBR', 'GRC');
    const beforeStability = world.countries['GRC'].government.stability;

    world = suePeace(world, 'GRC');

    expect(isAtWar(world, 'GRC')).toBe(false);
    expect(world.countries['GRC'].government.stability).toBeLessThan(beforeStability);
  });

  it('annexes the loser\'s lowest-output province to the primary winner on capitulation', () => {
    let world = buildWorld(scenario1836);
    world = {
      ...world,
      countries: {
        ...world.countries,
        RUS: { ...world.countries['RUS'], militaryStrength: 1000 }, // guarantees RUS wins every round regardless of jitter
      },
    };
    world = declareWar(world, 'RUS', 'OTT'); // OTT has two provinces: Anatolia (200) and Balkans (150, lower output)
    const rng = createRng(7);

    let ended = false;
    for (let i = 0; i < 20 && !ended; i++) {
      const result = warfareTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'war_ended')) ended = true;
    }

    expect(ended).toBe(true);
    expect(world.countries['RUS'].provinceIds).toContain('OTT-BK');
    expect(world.countries['OTT'].provinceIds).not.toContain('OTT-BK');
    expect(world.countries['OTT'].provinceIds).toContain('OTT-AN');
    expect(world.provinces['OTT-BK'].countryId).toBe('RUS');
  });

  it('never annexes a country\'s last remaining province', () => {
    let world = buildWorld(scenario1836);
    world = declareWar(world, 'GBR', 'GRC'); // GRC has exactly one province
    const rng = createRng(42);

    let ended = false;
    for (let i = 0; i < 20 && !ended; i++) {
      const result = warfareTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'war_ended')) ended = true;
    }

    expect(ended).toBe(true);
    expect(world.countries['GRC'].provinceIds).toEqual(['GRC-1']);
    expect(world.provinces['GRC-1'].countryId).toBe('GRC');
  });

  it('remains deterministic across turns once a war is in progress', () => {
    const base = declareWar(buildWorld(scenario1836), 'RUS', 'OTT');
    const worldA = advanceTurns(base, 15);
    const worldB = advanceTurns(declareWar(buildWorld(scenario1836), 'RUS', 'OTT'), 15);

    expect(worldA).toEqual(worldB);
  });
});
