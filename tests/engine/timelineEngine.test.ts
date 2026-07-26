import { describe, expect, it } from 'vitest';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';
import { recordTimeline } from '../../src/engine/timeline/timelineEngine';
import type { GameEvent } from '../../src/engine/core/types';

describe('timelineEngine', () => {
  it('the origin entry lists every country in the scenario, so "World Overview" and every per-country encyclopedia page both see it', () => {
    const world = buildWorld(scenario1836);
    const origin = world.timeline.find((e) => e.id === 'origin')!;
    expect(origin.countryIds).toEqual(expect.arrayContaining(['USA', 'GBR', 'FRA', 'OTT']));
    expect(origin.countryIds).toHaveLength(scenario1836.countries.length);
  });

  it('carries countryIds through from the source event onto the recorded entry, so per-country filtering works', () => {
    const world = buildWorld(scenario1836);
    const event: GameEvent = {
      id: 'evt-1',
      turn: 1,
      year: 1837,
      type: 'alliance_formed',
      countryIds: ['PRU', 'AUT'],
      text: 'Prussia and Austria formalize an alliance.',
      severity: 'notable',
    };

    const next = recordTimeline(world, [event]);
    const entry = next.timeline.find((e) => e.id === 'tl-evt-1')!;

    expect(entry).toBeDefined();
    expect(entry.countryIds).toEqual(['PRU', 'AUT']);

    // What the Encyclopedia does: filter to entries mentioning a given country.
    const pruHistory = next.timeline.filter((e) => e.countryIds.includes('PRU'));
    const usaHistory = next.timeline.filter((e) => e.countryIds.includes('USA'));
    expect(pruHistory.map((e) => e.id)).toContain('tl-evt-1');
    expect(usaHistory.map((e) => e.id)).not.toContain('tl-evt-1');
  });

  it('drops minor-severity events (never promoted to the timeline) but keeps their countryIds when they are promoted', () => {
    const world = buildWorld(scenario1836);
    const minorEvent: GameEvent = {
      id: 'evt-minor',
      turn: 1,
      year: 1837,
      type: 'economic_boom',
      countryIds: ['GBR'],
      text: 'Merchants report a banner year.',
      severity: 'minor',
    };

    const next = recordTimeline(world, [minorEvent]);
    expect(next.timeline.find((e) => e.id === 'tl-evt-minor')).toBeUndefined();
  });
});
