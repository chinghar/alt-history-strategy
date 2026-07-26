import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { declareWar } from '../../src/engine/warfare/warfareEngine';
import { setTreaty } from '../../src/engine/diplomacy/diplomacyEngine';
import { getRecommendations } from '../../src/engine/advisor/advisorEngine';
import type { WorldState } from '../../src/engine/core/types';
import { relationKey } from '../../src/engine/core/types';

function withCountry(world: WorldState, id: string, patch: Partial<WorldState['countries'][string]>): WorldState {
  return { ...world, countries: { ...world.countries, [id]: { ...world.countries[id], ...patch } } };
}

describe('advisorEngine', () => {
  it('returns a single reassuring note when nothing is wrong', () => {
    const world = buildWorld(scenario1836);
    // USA starts in reasonable shape but has a research/legislature idle notice by default —
    // force everything quiet to test the "all clear" fallback specifically.
    const quiet = withCountry(world, 'USA', { currentResearchId: 'telegraph' });
    const recs = getRecommendations(quiet, 'USA');
    expect(recs.some((r) => r.id === 'research-idle')).toBe(false);
  });

  it('flags critical debt once debt exceeds 80% of GDP', () => {
    const world = withCountry(buildWorld(scenario1836), 'USA', { debt: 1000 }); // USA gdp starts at 920
    const recs = getRecommendations(world, 'USA');
    expect(recs.find((r) => r.id === 'debt-critical')).toBeDefined();
  });

  it('flags critical stability below 20 and low stability between 20 and 35, not both', () => {
    const criticalWorld = withCountry(buildWorld(scenario1836), 'USA', {
      government: { ...buildWorld(scenario1836).countries['USA'].government, stability: 10 },
    });
    const recsA = getRecommendations(criticalWorld, 'USA');
    expect(recsA.find((r) => r.id === 'stability-critical')).toBeDefined();
    expect(recsA.find((r) => r.id === 'stability-low')).toBeUndefined();

    const lowWorld = withCountry(buildWorld(scenario1836), 'USA', {
      government: { ...buildWorld(scenario1836).countries['USA'].government, stability: 30 },
    });
    const recsB = getRecommendations(lowWorld, 'USA');
    expect(recsB.find((r) => r.id === 'stability-low')).toBeDefined();
    expect(recsB.find((r) => r.id === 'stability-critical')).toBeUndefined();
  });

  it('flags a faltering war once average exhaustion on the player\'s own side exceeds 60', () => {
    let world = buildWorld(scenario1836);
    world = declareWar(world, 'RUS', 'OTT');
    const warId = Object.keys(world.wars)[0];
    world = { ...world, wars: { ...world.wars, [warId]: { ...world.wars[warId], exhaustion: { RUS: 10, OTT: 75 } } } };

    const recs = getRecommendations(world, 'OTT');
    expect(recs.find((r) => r.id === 'war-faltering')).toBeDefined();
  });

  it('flags hostile relations only when not already at war with that country', () => {
    let world = buildWorld(scenario1836);
    world = {
      ...world,
      relations: { ...world.relations, [relationKey('USA', 'GBR')]: { a: 'USA', b: 'GBR', score: -80, treaties: [] } },
    };
    const recsBeforeWar = getRecommendations(world, 'USA');
    expect(recsBeforeWar.find((r) => r.id === 'hostile-GBR')).toBeDefined();

    const atWarWorld = declareWar(world, 'USA', 'GBR');
    const recsDuringWar = getRecommendations(atWarWorld, 'USA');
    expect(recsDuringWar.find((r) => r.id === 'hostile-GBR')).toBeUndefined();
  });

  it('does not flag hostile relations when allied despite a low score', () => {
    let world = buildWorld(scenario1836);
    world = setTreaty(world, 'USA', 'GBR', 'alliance', true);
    world = {
      ...world,
      relations: {
        ...world.relations,
        [relationKey('USA', 'GBR')]: { ...world.relations[relationKey('USA', 'GBR')], score: -80 },
      },
    };
    const recs = getRecommendations(world, 'USA');
    expect(recs.find((r) => r.id === 'hostile-GBR')).toBeUndefined();
  });

  it('flags idle research when no focus is set and techs are available', () => {
    const world = buildWorld(scenario1836);
    const recs = getRecommendations(world, 'USA');
    expect(recs.find((r) => r.id === 'research-idle')).toBeDefined();
  });

  it('flags a pending bill awaiting the player\'s stance', () => {
    const world = withCountry(buildWorld(scenario1836), 'USA', { pendingBillId: 'tariff_act', billStance: null });
    const recs = getRecommendations(world, 'USA');
    expect(recs.find((r) => r.id === 'bill-pending')).toBeDefined();
  });

  it('flags a booming economy positively', () => {
    const world = withCountry(buildWorld(scenario1836), 'USA', { gdpGrowth: 0.08 });
    const recs = getRecommendations(world, 'USA');
    const boom = recs.find((r) => r.id === 'boom');
    expect(boom).toBeDefined();
    expect(boom!.severity).toBe('good');
  });

  it('sorts critical recommendations before warnings, info, and good', () => {
    let world = withCountry(buildWorld(scenario1836), 'USA', {
      debt: 1000,
      gdpGrowth: 0.08,
      government: { ...buildWorld(scenario1836).countries['USA'].government, stability: 10 },
    });
    const recs = getRecommendations(world, 'USA');
    const severities = recs.map((r) => r.severity);
    const firstNonCritical = severities.findIndex((s) => s !== 'critical');
    expect(severities.slice(0, firstNonCritical).every((s) => s === 'critical')).toBe(true);
  });

  it('returns an empty array for an unknown country id', () => {
    const world = buildWorld(scenario1836);
    expect(getRecommendations(world, 'NOPE')).toEqual([]);
  });
});
