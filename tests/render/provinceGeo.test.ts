import { describe, expect, it } from 'vitest';
import { usProvinceFeatures } from '../../src/render/provinceGeo';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1836 } from '../../src/data/scenarios/1836';

function findState(name: string) {
  const f = usProvinceFeatures.find((s) => s.name === name);
  if (!f) throw new Error(`state not found in us-atlas data: ${name}`);
  return f;
}

describe('provinceGeo', () => {
  it('maps every 1836-era state to its correct historical province', () => {
    for (const name of ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont']) {
      expect(findState(name).provinceId).toBe('USA-NE');
    }
    for (const name of ['New York', 'New Jersey', 'Pennsylvania', 'Ohio', 'Indiana', 'Illinois']) {
      expect(findState(name).provinceId).toBe('USA-MA');
    }
    for (const name of ['Delaware', 'Maryland', 'Virginia', 'North Carolina', 'Kentucky', 'Missouri', 'Tennessee']) {
      expect(findState(name).provinceId).toBe('USA-US');
    }
    for (const name of ['South Carolina', 'Georgia', 'Alabama', 'Mississippi', 'Louisiana', 'Arkansas']) {
      expect(findState(name).provinceId).toBe('USA-DS');
    }
  });

  it('leaves states that did not exist in the 1836 Union unmapped', () => {
    for (const name of ['California', 'Texas', 'Michigan', 'Alaska', 'Hawaii']) {
      expect(findState(name).provinceId).toBeNull();
    }
  });

  it('every mapped provinceId corresponds to a real province in the 1836 scenario', () => {
    const world = buildWorld(scenario1836);
    const mappedIds = new Set(usProvinceFeatures.map((f) => f.provinceId).filter((id) => id !== null));
    expect(mappedIds).toEqual(new Set(['USA-NE', 'USA-MA', 'USA-US', 'USA-DS']));
    for (const id of mappedIds) {
      expect(world.provinces[id as string]).toBeDefined();
    }
  });

  it('generates non-empty SVG path data for every state', () => {
    expect(usProvinceFeatures.length).toBeGreaterThan(40); // 50 states + DC + territories, minus any that fail to render
    for (const f of usProvinceFeatures) {
      expect(f.path.length).toBeGreaterThan(0);
    }
  });
});
