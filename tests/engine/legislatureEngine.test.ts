import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { tick as legislatureTick, setBillStance } from '../../src/engine/legislature/legislatureEngine';
import { BILL_REGISTRY } from '../../src/engine/legislature/bills';
import { createRng } from '../../src/engine/core/rng';
import type { Rng } from '../../src/engine/core/types';

const alwaysPass: Rng = { next: () => 0, int: (min) => min };

describe('legislatureEngine', () => {
  it("convenes on schedule (interval 3) and resolves on the following tick", () => {
    let world = buildWorld(scenario1836);

    for (let t = 1; t <= 2; t++) {
      world = { ...world, turn: t };
      world = legislatureTick(world, createRng(1)).world;
      expect(world.countries['USA'].pendingBillId).toBeNull();
    }

    world = { ...world, turn: 3 };
    let result = legislatureTick(world, createRng(1));
    world = result.world;
    expect(world.countries['USA'].pendingBillId).not.toBeNull();
    expect(result.events.some((e) => e.type === 'bill_convened' && e.countryIds.includes('USA'))).toBe(true);

    world = { ...world, turn: 4 };
    result = legislatureTick(world, createRng(1));
    world = result.world;
    expect(world.countries['USA'].pendingBillId).toBeNull();
    expect(result.events.some((e) => ['bill_passed', 'bill_failed'].includes(e.type) && e.countryIds.includes('USA'))).toBe(
      true,
    );
  });

  it('a supported bill is more likely to pass than an opposed one, all else equal', () => {
    let world = buildWorld(scenario1836);
    world = { ...world, turn: 3 };
    world = legislatureTick(world, createRng(1)).world; // convenes a bill for USA

    // Isolate the stance's effect by pinning opinion to exactly 50 (opinionFactor = 0).
    const neutral = {
      ...world,
      turn: 4,
      countries: { ...world.countries, USA: { ...world.countries['USA'], publicOpinion: 50 } },
    };
    const supportWorld = setBillStance(neutral, 'USA', 'support');
    const opposeWorld = setBillStance(neutral, 'USA', 'oppose');

    // passChance: support = 0.5+0.2=0.70, oppose = 0.5-0.2=0.30 — a fixed 0.65 roll clears support, not oppose.
    const borderline: Rng = { next: () => 0.65, int: (min) => min };

    const supportResult = legislatureTick(supportWorld, borderline);
    const opposeResult = legislatureTick(opposeWorld, borderline);

    expect(supportResult.events.find((e) => e.countryIds.includes('USA'))!.type).toBe('bill_passed');
    expect(opposeResult.events.find((e) => e.countryIds.includes('USA'))!.type).toBe('bill_failed');
  });

  it("applies the pending bill's pass effect to the country and clears the session state", () => {
    let world = buildWorld(scenario1836);
    world = { ...world, turn: 3 };
    world = legislatureTick(world, createRng(1)).world;

    const billId = world.countries['USA'].pendingBillId!;
    const bill = BILL_REGISTRY[billId];

    world = { ...world, turn: 4 };
    const before = world.countries['USA'];
    const result = legislatureTick(world, alwaysPass);
    const after = result.world.countries['USA'];

    if (bill.passEffect.growthBonusDelta !== undefined) {
      expect(after.policyGrowthBonus).toBeCloseTo(before.policyGrowthBonus + bill.passEffect.growthBonusDelta);
    }
    expect(after.pendingBillId).toBeNull();
    expect(after.billStance).toBeNull();
    expect(after.lastLegislativeSessionTurn).toBe(4);
  });

  it('setBillStance no-ops when there is no pending bill', () => {
    const world = buildWorld(scenario1836);
    expect(world.countries['USA'].pendingBillId).toBeNull();
    const result = setBillStance(world, 'USA', 'support');
    expect(result).toBe(world);
  });

  it('remains deterministic across turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 20);
    const worldB = advanceTurns(buildWorld(scenario1836), 20);
    expect(worldA).toEqual(worldB);
  });
});
