import { describe, expect, it } from 'vitest';
import { japanProvinceFeatures } from '../../src/render/japanProvinceGeo';
import { buildWorld } from '../../src/engine/core/worldFactory';
import { scenario1962 } from '../../src/data/scenarios/1962';

function findPrefecture(name: string) {
  const f = japanProvinceFeatures.find((p) => p.name === name);
  if (!f) throw new Error(`prefecture not found in jpn-atlas data: ${name}`);
  return f;
}

describe('japanProvinceGeo', () => {
  it('maps Kanto-region prefectures to JPN-KANTO', () => {
    for (const name of ['Tokyo', 'Kanagawa', 'Saitama', 'Chiba', 'Ibaraki', 'Tochigi', 'Gunma']) {
      expect(findPrefecture(name).provinceId).toBe('JPN-KANTO');
    }
  });

  it('maps Kansai-region prefectures to JPN-KANSAI', () => {
    for (const name of ['Osaka', 'Kyoto', 'Hyogo', 'Nara', 'Shiga', 'Wakayama']) {
      expect(findPrefecture(name).provinceId).toBe('JPN-KANSAI');
    }
  });

  it('maps every other prefecture to JPN-REST', () => {
    for (const name of ['Hokkaido', 'Aomori', 'Aichi', 'Fukuoka', 'Okinawa']) {
      expect(findPrefecture(name).provinceId).toBe('JPN-REST');
    }
  });

  it('produces exactly the 47 prefectures, each mapped to a real 1962 province', () => {
    expect(japanProvinceFeatures).toHaveLength(47);
    const world = buildWorld(scenario1962);
    const mappedIds = new Set(japanProvinceFeatures.map((f) => f.provinceId).filter((id) => id !== null));
    expect(mappedIds).toEqual(new Set(['JPN-KANTO', 'JPN-KANSAI', 'JPN-REST']));
    for (const id of mappedIds) {
      expect(world.provinces[id as string]).toBeDefined();
    }
  });

  it('generates non-empty SVG path data for every prefecture', () => {
    for (const f of japanProvinceFeatures) {
      expect(f.path.length).toBeGreaterThan(0);
    }
  });
});
