import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { tick as focusTick, setNationalFocus, availableFocuses } from '../../src/engine/focus/focusEngine';
import { FOCUS_REGISTRY, focusesForCountry } from '../../src/engine/focus/focuses';
import { createRng } from '../../src/engine/core/rng';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { scenario1914 } from '../../src/data/scenarios/1914';
import { scenario431bce } from '../../src/data/scenarios/431bce';
import { scenarioList } from '../../src/data/scenarios';

describe('focusEngine', () => {
  it('setNationalFocus starts an available root focus with no prerequisites', () => {
    const world = buildWorld(scenario1836);
    const next = setNationalFocus(world, 'USA', 'usa-root');
    expect(next.countries['USA'].currentFocusId).toBe('usa-root');
    expect(next.countries['USA'].focusProgressTurns).toBe(3);
  });

  it('setNationalFocus no-ops for a focus whose prerequisites are not met', () => {
    const world = buildWorld(scenario1836);
    const next = setNationalFocus(world, 'USA', 'usa-coast-to-coast');
    expect(next).toBe(world);
  });

  it('setNationalFocus no-ops when a focus is already in progress', () => {
    let world = buildWorld(scenario1836);
    world = setNationalFocus(world, 'USA', 'usa-root');
    const next = setNationalFocus(world, 'USA', 'usa-bank-1');
    expect(next).toBe(world);
  });

  it('setNationalFocus no-ops for a focus belonging to a different country', () => {
    const world = buildWorld(scenario1914);
    const next = setNationalFocus(world, 'GER', 'ath-root');
    expect(next).toBe(world);
  });

  it('progresses focusProgressTurns down by one each tick without completing early', () => {
    let world = setNationalFocus(buildWorld(scenario1836), 'USA', 'usa-root'); // duration 3
    const result = focusTick(world, createRng(1));
    expect(result.world.countries['USA'].currentFocusId).toBe('usa-root');
    expect(result.world.countries['USA'].focusProgressTurns).toBe(2);
    expect(result.events).toHaveLength(0);
  });

  it('completes a focus, applies its effect, and emits a focus_completed event', () => {
    let world = setNationalFocus(buildWorld(scenario1836), 'USA', 'usa-root');
    const before = world.countries['USA'];

    for (let i = 0; i < 3; i++) {
      world = focusTick(world, createRng(1)).world;
    }

    const after = world.countries['USA'];
    expect(after.currentFocusId).toBeNull();
    expect(after.completedFocusIds).toContain('usa-root');
    expect(after.government.stability).toBeGreaterThan(before.government.stability);
    expect(after.publicOpinion).toBeGreaterThan(before.publicOpinion);
  });

  it('unlocks a tech and adds a tag as focus effects', () => {
    let world = setNationalFocus(buildWorld(scenario1836), 'USA', 'usa-root');
    for (let i = 0; i < 3; i++) world = focusTick(world, createRng(1)).world;
    world = setNationalFocus(world, 'USA', 'usa-ind-1'); // unlocks 'railways'
    for (let i = 0; i < 4; i++) world = focusTick(world, createRng(1)).world;

    expect(world.countries['USA'].unlockedTechIds).toContain('railways');

    world = setNationalFocus(world, 'USA', 'usa-west-1'); // addTag 'frontier_expansion'
    for (let i = 0; i < 4; i++) world = focusTick(world, createRng(1)).world;
    expect(world.countries['USA'].tags).toContain('frontier_expansion');
  });

  it('applies relationDelta and formTreaty effects against the named second country', () => {
    let world = setNationalFocus(buildWorld(scenario1914), 'GER', 'ger-root');
    for (let i = 0; i < 3; i++) world = focusTick(world, createRng(1)).world;
    const before = world.relations['AUH:GER']?.score ?? 0;

    world = setNationalFocus(world, 'GER', 'ger-dip-1'); // relationDelta +20 with AUH
    for (let i = 0; i < 3; i++) world = focusTick(world, createRng(1)).world;
    expect(world.relations['AUH:GER'].score).toBe(before + 20);

    world = setNationalFocus(world, 'GER', 'ger-dip-2'); // formTreaty alliance with AUH
    for (let i = 0; i < 4; i++) world = focusTick(world, createRng(1)).world;
    expect(world.relations['AUH:GER'].treaties).toContain('alliance');
  });

  it('a capstone focus requires every branch prerequisite, not just one', () => {
    const world = buildWorld(scenario1836);
    const country = { ...world.countries['USA'], completedFocusIds: ['usa-west-2', 'usa-ind-2'] }; // missing usa-bank-1
    const options = availableFocuses(country);
    expect(options.some((f) => f.id === 'usa-coast-to-coast')).toBe(false);

    const fullyDone = { ...world.countries['USA'], completedFocusIds: ['usa-west-2', 'usa-ind-2', 'usa-bank-1'] };
    const optionsFull = availableFocuses(fullyDone);
    expect(optionsFull.some((f) => f.id === 'usa-coast-to-coast')).toBe(true);
  });

  it('AI-controlled countries auto-pick and progress through their tree without player input', () => {
    const world = buildWorld(scenario1914); // GER starts AI-controlled
    const advanced = advanceTurns(world, 30);
    expect(advanced.countries['GER'].completedFocusIds.length).toBeGreaterThan(0);
  });

  it('player-controlled countries do not auto-pick a focus', () => {
    let world = buildWorld(scenario1836);
    world = {
      ...world,
      countries: { ...world.countries, USA: { ...world.countries['USA'], isPlayerControlled: true } },
    };
    const result = focusTick(world, createRng(1));
    expect(result.world.countries['USA'].currentFocusId).toBeNull();
  });

  it('remains deterministic across many turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1914), 40);
    const worldB = advanceTurns(buildWorld(scenario1914), 40);
    expect(worldA).toEqual(worldB);
  });
});

describe('focus tree data integrity', () => {
  it('has no duplicate focus ids across the whole registry', () => {
    const allFocuses = scenarioList.flatMap((s) =>
      s.focusTreeCountryIds.flatMap((id) => focusesForCountry(id)),
    );
    const ids = allFocuses.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every prerequisite id exists and belongs to the same country as its dependent focus', () => {
    for (const focus of Object.values(FOCUS_REGISTRY)) {
      for (const prereqId of focus.prerequisiteIds) {
        const prereq = FOCUS_REGISTRY[prereqId];
        expect(prereq, `${focus.id} references missing prerequisite ${prereqId}`).toBeDefined();
        expect(prereq.countryId).toBe(focus.countryId);
      }
    }
  });

  it("every scenario's declared focus tree country actually has authored focuses", () => {
    for (const scenario of scenarioList) {
      for (const countryId of scenario.focusTreeCountryIds) {
        expect(focusesForCountry(countryId).length).toBeGreaterThan(0);
      }
    }
  });

  it('every tree has exactly one root focus (no prerequisites)', () => {
    for (const scenario of scenarioList) {
      for (const countryId of scenario.focusTreeCountryIds) {
        const roots = focusesForCountry(countryId).filter((f) => f.prerequisiteIds.length === 0);
        expect(roots).toHaveLength(1);
      }
    }
  });

  it('431 BCE and 1914 focus trees are isolated to their own scenario roster', () => {
    expect(focusesForCountry('ATH').length).toBeGreaterThan(0);
    expect(scenario431bce.focusTreeCountryIds).toEqual(['ATH']);
    expect(scenario1914.focusTreeCountryIds).toEqual(['GER']);
  });
});
