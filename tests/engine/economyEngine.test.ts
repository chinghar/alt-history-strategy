import { describe, expect, it } from 'vitest';
import { tick } from '../../src/engine/economy/economyEngine';
import { setTreaty } from '../../src/engine/diplomacy/diplomacyEngine';
import { createRng } from '../../src/engine/core/rng';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';

describe('economyEngine', () => {
  it('grows industrial provinces faster than slave-agrarian ones over time', () => {
    let world = buildWorld(scenario1836);
    const industrialStart = world.provinces['USA-NE'].economicOutput;
    const slaveStart = world.provinces['USA-DS'].economicOutput;

    const rng = createRng(1);
    for (let i = 0; i < 30; i++) {
      world = tick(world, rng).world;
    }

    const industrialGrowth = world.provinces['USA-NE'].economicOutput / industrialStart;
    const slaveGrowth = world.provinces['USA-DS'].economicOutput / slaveStart;

    expect(industrialGrowth).toBeGreaterThan(slaveGrowth);
  });

  it('never produces negative GDP', () => {
    let world = buildWorld(scenario1836);
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      world = tick(world, rng).world;
    }
    for (const country of Object.values(world.countries)) {
      expect(country.gdp).toBeGreaterThan(0);
    }
  });

  it('grows a country faster with an active trade agreement than without one', () => {
    const base = buildWorld(scenario1836);
    const withTrade = setTreaty(base, 'GBR', 'FRA', 'trade_agreement', true);

    const baseResult = tick(base, createRng(1));
    const tradeResult = tick(withTrade, createRng(1));

    expect(tradeResult.world.countries['GBR'].gdp).toBeGreaterThan(baseResult.world.countries['GBR'].gdp);
  });
});
