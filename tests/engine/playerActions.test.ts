import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { setTaxRate } from '../../src/engine/economy/economyEngine';
import { setTreaty } from '../../src/engine/diplomacy/diplomacyEngine';
import { relationKey } from '../../src/engine/core/types';

describe('player actions', () => {
  it('setTaxRate updates and clamps the target country only', () => {
    const world = buildWorld(scenario1836);

    const raised = setTaxRate(world, 'USA', 0.3);
    expect(raised.countries['USA'].taxRate).toBeCloseTo(0.3);
    expect(raised.countries['GBR'].taxRate).toBe(world.countries['GBR'].taxRate);

    const clampedHigh = setTaxRate(world, 'USA', 5);
    expect(clampedHigh.countries['USA'].taxRate).toBeCloseTo(0.5);

    const clampedLow = setTaxRate(world, 'USA', -1);
    expect(clampedLow.countries['USA'].taxRate).toBeCloseTo(0.05);
  });

  it('setTreaty adds and removes a treaty, creating a relation if none existed', () => {
    const world = buildWorld(scenario1836);

    // USA and PRU have no authored relation in the 1836 scenario.
    expect(world.relations[relationKey('USA', 'PRU')]).toBeUndefined();

    const allied = setTreaty(world, 'USA', 'PRU', 'alliance', true);
    const relation = allied.relations[relationKey('USA', 'PRU')];
    expect(relation.treaties).toContain('alliance');

    const revoked = setTreaty(allied, 'USA', 'PRU', 'alliance', false);
    expect(revoked.relations[relationKey('USA', 'PRU')].treaties).not.toContain('alliance');
  });

  it('setTreaty is idempotent when adding a treaty that already exists', () => {
    const world = buildWorld(scenario1836);
    const once = setTreaty(world, 'GBR', 'FRA', 'trade_agreement', true);
    const twice = setTreaty(once, 'GBR', 'FRA', 'trade_agreement', true);
    expect(twice.relations[relationKey('GBR', 'FRA')].treaties.filter((t) => t === 'trade_agreement')).toHaveLength(1);
  });
});
