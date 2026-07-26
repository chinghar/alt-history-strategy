import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { advanceTurns } from '../../src/engine/core/turnEngine';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { tick as wildcardTick } from '../../src/engine/events/wildcardEventsEngine';
import { createRng } from '../../src/engine/core/rng';

describe('wildcardEventsEngine', () => {
  it('occasionally fires a random event that changes the world, tagged and dated correctly', () => {
    let world = buildWorld(scenario1836);
    const rng = createRng(123);

    let fired = false;
    for (let i = 0; i < 60 && !fired; i++) {
      const result = wildcardTick(world, rng);
      if (result.events.length > 0) {
        fired = true;
        expect(result.events[0].type).toBe('wildcard_event');
        expect(result.events[0].text.length).toBeGreaterThan(0);
        expect(result.events[0].countryIds).toHaveLength(1);
        expect(result.world).not.toBe(world); // something in the world actually changed
      }
      world = result.world;
    }

    expect(fired).toBe(true);
  });

  it('is rare enough that most turns produce no wildcard events at all', () => {
    // With 16 countries at a 2.5% chance each, a quiet turn has probability
    // (1-0.025)^16 ≈ 0.67 — sample generously (60 turns) so the expected
    // ~40 quiet turns comfortably clears a conservative floor regardless
    // of seed variance.
    let world = buildWorld(scenario1836);
    const rng = createRng(5);
    let quietTurns = 0;

    for (let i = 0; i < 60; i++) {
      const result = wildcardTick(world, rng);
      world = result.world;
      if (result.events.length === 0) quietTurns++;
    }

    expect(quietTurns).toBeGreaterThan(25);
  });

  it('remains deterministic across turns', () => {
    const worldA = advanceTurns(buildWorld(scenario1836), 25);
    const worldB = advanceTurns(buildWorld(scenario1836), 25);
    expect(worldA).toEqual(worldB);
  });
});
