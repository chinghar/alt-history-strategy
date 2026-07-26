import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';

describe('determinism', () => {
  it('produces an identical WorldState from the same seed after many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 25);
    const worldB = advanceTurns(buildWorld(scenario1836), 25);

    expect(worldA).toEqual(worldB);
  });

  it('diverges when the seed differs', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 25);
    const worldB = advanceTurns(buildWorld({ ...scenario1836, seed: scenario1836.seed + 1 }), 25);

    expect(worldA).not.toEqual(worldB);
  });
});
