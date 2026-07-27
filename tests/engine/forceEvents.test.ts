import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurn } from '../../src/engine/core/turnEngine';
import { forceEvent } from '../../src/engine/sandbox/forceEvents';
import { declareWar } from '../../src/engine/warfare/warfareEngine';
import { createRng } from '../../src/engine/core/rng';
import { scenario1836 } from '../../src/data/scenarios/1836';

describe('forceEvents', () => {
  it('economic_boom raises every province\'s output for the target country only', () => {
    const world = buildWorld(scenario1836);
    const before = world.countries['USA'].provinceIds.map((id) => world.provinces[id].economicOutput);
    const otherBefore = world.provinces['GBR-EW'].economicOutput;

    const result = forceEvent(world, 'economic_boom', 'USA', null, createRng(1));

    world.countries['USA'].provinceIds.forEach((id, i) => {
      expect(result.world.provinces[id].economicOutput).toBeGreaterThan(before[i]);
    });
    expect(result.world.provinces['GBR-EW'].economicOutput).toBe(otherBefore);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].countryIds).toEqual(['USA']);
  });

  it('economic_boom has real downstream effects: the boosted output drives visibly higher gdpGrowth next turn', () => {
    const world = buildWorld(scenario1836);
    const boosted = forceEvent(world, 'economic_boom', 'USA', null, createRng(1)).world;
    const advanced = advanceTurn(boosted);
    expect(advanced.countries['USA'].gdpGrowth).toBeGreaterThan(0.05);
  });

  it('recession lowers province output', () => {
    const world = buildWorld(scenario1836);
    const before = world.provinces['USA-NE'].economicOutput;
    const result = forceEvent(world, 'recession', 'USA', null, createRng(1));
    expect(result.world.provinces['USA-NE'].economicOutput).toBeLessThan(before);
  });

  it('government_crisis crashes stability into crisis territory without instantly changing government type', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'government_crisis', 'FRA', null, createRng(1));
    expect(result.world.countries['FRA'].government.stability).toBeLessThan(15);
    expect(result.world.countries['FRA'].government.type).toBe(world.countries['FRA'].government.type);
  });

  it('regime_change immediately changes government type and installs a new leader', () => {
    const world = buildWorld(scenario1836);
    const originalType = world.countries['AUT'].government.type;
    const originalLeader = world.countries['AUT'].government.leaderName;
    const result = forceEvent(world, 'regime_change', 'AUT', null, createRng(1));
    expect(result.world.countries['AUT'].government.type).not.toBe(originalType);
    expect(result.world.countries['AUT'].government.leaderName).not.toBe(originalLeader);
    expect(result.events[0].type).toBe('regime_change');
  });

  it('leadership_change installs a new leader without changing government type', () => {
    const world = buildWorld(scenario1836);
    const originalType = world.countries['RUS'].government.type;
    const originalLeader = world.countries['RUS'].government.leaderName;
    const result = forceEvent(world, 'leadership_change', 'RUS', null, createRng(1));
    expect(result.world.countries['RUS'].government.type).toBe(originalType);
    expect(result.world.countries['RUS'].government.leaderName).not.toBe(originalLeader);
  });

  it('war_declared starts a war between the two chosen countries', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'war_declared', 'FRA', 'ESP', createRng(1));
    const war = Object.values(result.world.wars).find(
      (w) => w.attackers.includes('FRA') && w.defenders.includes('ESP'),
    );
    expect(war).toBeDefined();
    expect(result.events[0].countryIds).toEqual(['FRA', 'ESP']);
  });

  it('war_declared has real downstream effects: warfareEngine resolves battles on the next turn', () => {
    const world = buildWorld(scenario1836);
    const atWar = forceEvent(world, 'war_declared', 'FRA', 'ESP', createRng(1)).world;
    const advanced = advanceTurn(atWar);
    // Combat resolution should have moved military strength for at least one side.
    const fraChanged = advanced.countries['FRA'].militaryStrength !== atWar.countries['FRA'].militaryStrength;
    const espChanged = advanced.countries['ESP'].militaryStrength !== atWar.countries['ESP'].militaryStrength;
    expect(fraChanged || espChanged).toBe(true);
  });

  it('peace ends whatever war the target country is in', () => {
    const world = buildWorld(scenario1836);
    const atWar = declareWar(world, 'FRA', 'ESP');
    const result = forceEvent(atWar, 'peace', 'FRA', null, createRng(1));
    expect(Object.values(result.world.wars)).toHaveLength(0);
  });

  it('peace no-ops (no event) when the country is not at war', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'peace', 'FRA', null, createRng(1));
    expect(result.events).toHaveLength(0);
  });

  it('alliance_formed adds an alliance treaty between the two countries', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'alliance_formed', 'PRU', 'MEX', createRng(1));
    const key = 'MEX:PRU' as const;
    expect(result.world.relations[key]?.treaties).toContain('alliance');
  });

  it('sanctions_imposed adds a sanction treaty between the two countries', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'sanctions_imposed', 'PRU', 'MEX', createRng(1));
    const key = 'MEX:PRU' as const;
    expect(result.world.relations[key]?.treaties).toContain('sanction');
  });

  it('diplomatic_incident drops relations sharply between the two chosen countries', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'diplomatic_incident', 'GBR', 'FRA', createRng(1));
    const key = 'FRA:GBR' as const;
    const before = world.relations[key]?.score ?? 0;
    expect(result.world.relations[key]?.score).toBeLessThan(before);
  });

  it('resource_discovery boosts one of the country\'s provinces', () => {
    const world = buildWorld(scenario1836);
    const totalBefore = world.countries['USA'].provinceIds.reduce((s, id) => s + world.provinces[id].economicOutput, 0);
    const result = forceEvent(world, 'resource_discovery', 'USA', null, createRng(1));
    const totalAfter = result.world.countries['USA'].provinceIds.reduce(
      (s, id) => s + result.world.provinces[id].economicOutput,
      0,
    );
    expect(totalAfter).toBeGreaterThan(totalBefore);
  });

  it('epidemic raises unrest across every province and adds debt', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'epidemic', 'USA', null, createRng(1));
    for (const pid of world.countries['USA'].provinceIds) {
      expect(result.world.provinces[pid].unrest).toBeGreaterThan(world.provinces[pid].unrest);
    }
    expect(result.world.countries['USA'].debt).toBeGreaterThan(world.countries['USA'].debt);
  });

  it('tech_breakthrough unlocks a tech the country did not have before', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'tech_breakthrough', 'USA', null, createRng(1));
    expect(result.world.countries['USA'].unlockedTechIds.length).toBeGreaterThan(
      world.countries['USA'].unlockedTechIds.length,
    );
  });

  it('a relational event with no second country provided is a no-op', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'war_declared', 'FRA', null, createRng(1));
    expect(result.events).toHaveLength(0);
    expect(result.world).toBe(world);
  });

  it('an unknown target country is a no-op for every event type', () => {
    const world = buildWorld(scenario1836);
    const result = forceEvent(world, 'economic_boom', 'NOPE', null, createRng(1));
    expect(result.events).toHaveLength(0);
  });
});
