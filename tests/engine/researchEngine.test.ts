import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { tick as researchTick, setResearchFocus } from '../../src/engine/research/researchEngine';
import { createRng } from '../../src/engine/core/rng';

describe('researchEngine', () => {
  it('setResearchFocus sets a valid, unlockable tech and no-ops otherwise', () => {
    const world = buildWorld(scenario1836);

    const focused = setResearchFocus(world, 'USA', 'telegraph');
    expect(focused.countries['USA'].currentResearchId).toBe('telegraph');

    // gated behind a prerequisite not yet unlocked
    const gated = setResearchFocus(world, 'USA', 'steel_production');
    expect(gated).toBe(world);

    // tech id from the wrong era / nonexistent
    const invalid = setResearchFocus(world, 'USA', 'trireme_design');
    expect(invalid).toBe(world);
  });

  it('unlocks steel_production once railways is unlocked', () => {
    let world = buildWorld(scenario1836);
    const countries = {
      ...world.countries,
      USA: { ...world.countries['USA'], unlockedTechIds: ['railways'] },
    };
    world = { ...world, countries };

    const focused = setResearchFocus(world, 'USA', 'steel_production');
    expect(focused.countries['USA'].currentResearchId).toBe('steel_production');
  });

  it('accumulates research points from GDP and unlocks a tech once cost is met, applying its effect', () => {
    let world = buildWorld(scenario1836);
    world = setResearchFocus(world, 'GBR', 'telegraph'); // cost 500, growth_bonus +0.006
    const rng = createRng(1);

    let unlocked = false;
    for (let i = 0; i < 60 && !unlocked; i++) {
      const result = researchTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'tech_unlocked')) unlocked = true;
    }

    expect(unlocked).toBe(true);
    const gbr = world.countries['GBR'];
    expect(gbr.unlockedTechIds).toContain('telegraph');
    expect(gbr.currentResearchId).toBeNull();
    expect(gbr.techGrowthBonus).toBeCloseTo(0.006);
  });

  it('a stability_boost tech raises both stability and opinion, clamped to 100', () => {
    let world = buildWorld(scenario1836);
    const countries = {
      ...world.countries,
      GBR: {
        ...world.countries['GBR'],
        government: { ...world.countries['GBR'].government, stability: 95 },
        publicOpinion: 92,
      },
    };
    world = { ...world, countries };
    world = setResearchFocus(world, 'GBR', 'public_education'); // stability_boost +10
    const rng = createRng(2);

    let unlocked = false;
    for (let i = 0; i < 80 && !unlocked; i++) {
      const result = researchTick(world, rng);
      world = result.world;
      if (result.events.some((e) => e.type === 'tech_unlocked')) unlocked = true;
    }

    expect(unlocked).toBe(true);
    expect(world.countries['GBR'].government.stability).toBe(100);
    expect(world.countries['GBR'].publicOpinion).toBe(100);
  });

  it('AI-controlled countries auto-select research without player input', () => {
    let world = buildWorld(scenario1836);
    const rng = createRng(3);

    let anyAiFocused = false;
    for (let i = 0; i < 5 && !anyAiFocused; i++) {
      const result = researchTick(world, rng);
      world = result.world;
      anyAiFocused = Object.values(world.countries).some(
        (c) => !c.isPlayerControlled && c.currentResearchId !== null,
      );
    }

    expect(anyAiFocused).toBe(true);
  });

  it('remains deterministic across turns with research active', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 20);
    const worldB = advanceTurns(buildWorld(scenario1836), 20);
    expect(worldA).toEqual(worldB);
  });
});
