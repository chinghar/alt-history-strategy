import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { queueEspionageMission, tick as espionageTick } from '../../src/engine/espionage/espionageEngine';
import { relationKey, type Rng, type WorldState } from '../../src/engine/core/types';

// Deterministic stubs so success/failure outcomes are exact, not probabilistic.
const alwaysSucceed: Rng = { next: () => 0, int: (min) => min };
const alwaysFail: Rng = { next: () => 0.99, int: (min) => min };

describe('espionageEngine', () => {
  it('queues a mission and no-ops for self-targeting', () => {
    const world = buildWorld(scenario1836);
    const queued = queueEspionageMission(world, 'PRU', 'AUT', 'destabilize');
    expect(queued.pendingEspionageMissions).toEqual([{ agentId: 'PRU', targetId: 'AUT', mission: 'destabilize' }]);

    const selfTarget = queueEspionageMission(world, 'PRU', 'PRU', 'destabilize');
    expect(selfTarget).toBe(world);
  });

  it('a successful destabilize mission reduces target stability and opinion, and clears the queue', () => {
    let world = buildWorld(scenario1836);
    world = queueEspionageMission(world, 'PRU', 'AUT', 'destabilize');
    const before = world.countries['AUT'];

    const result = espionageTick(world, alwaysSucceed);
    world = result.world;

    expect(world.countries['AUT'].government.stability).toBeLessThan(before.government.stability);
    expect(world.countries['AUT'].publicOpinion).toBeLessThan(before.publicOpinion);
    expect(world.pendingEspionageMissions).toHaveLength(0);
    expect(result.events[0].type).toBe('espionage_success');
  });

  it('a successful sabotage mission damages one of the target provinces', () => {
    let world = buildWorld(scenario1836);
    world = queueEspionageMission(world, 'PRU', 'AUT', 'sabotage');
    const targetProvinceId = world.countries['AUT'].provinceIds[0]; // stubbed int() always returns min (first province)
    const before = world.provinces[targetProvinceId].economicOutput;

    const result = espionageTick(world, alwaysSucceed);
    world = result.world;

    expect(world.provinces[targetProvinceId].economicOutput).toBeLessThan(before);
  });

  it('a successful steal_tech mission copies a tech the target has and the agent lacks', () => {
    let world: WorldState = buildWorld(scenario1836);
    world = {
      ...world,
      countries: {
        ...world.countries,
        AUT: { ...world.countries['AUT'], unlockedTechIds: ['telegraph'], techGrowthBonus: 0.006 },
      },
    };
    world = queueEspionageMission(world, 'PRU', 'AUT', 'steal_tech');

    const result = espionageTick(world, alwaysSucceed);
    world = result.world;

    expect(world.countries['PRU'].unlockedTechIds).toContain('telegraph');
    expect(world.countries['PRU'].techGrowthBonus).toBeCloseTo(0.006);
  });

  it('a failed mission damages relations instead of the target, and emits an exposure event', () => {
    let world = buildWorld(scenario1836);
    world = queueEspionageMission(world, 'PRU', 'AUT', 'destabilize');
    const targetBefore = world.countries['AUT'];

    const result = espionageTick(world, alwaysFail);
    world = result.world;

    expect(world.countries['AUT']).toEqual(targetBefore); // untouched — the mission simply failed
    expect(world.relations[relationKey('PRU', 'AUT')].score).toBe(10 - 30); // starts at 10 in the 1836 scenario
    expect(result.events[0].type).toBe('espionage_exposed');
  });

  it('remains deterministic across turns with queued espionage missions', () => {
    const withMission = () => queueEspionageMission(buildWorld(scenario1836), 'PRU', 'AUT', 'destabilize');
    const worldA = advanceTurns(withMission(), 15);
    const worldB = advanceTurns(withMission(), 15);
    expect(worldA).toEqual(worldB);
  });
});
