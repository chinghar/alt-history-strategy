import { geoIdentity, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import japanTopology from 'jpn-atlas/japan/japan.json';
import type { ProvinceId } from '../engine/core/types';
import type { ProvinceFeature } from './provinceGeo';

/**
 * Real sub-national geometry for the 1962 scenario's Japan, alongside 1836's
 * USA — the second proof that province-level rendering isn't a one-off.
 *
 * Unlike us-atlas, jpn-atlas ships pre-projected planar coordinates rather
 * than lon/lat (its own README renders it with a bare, unprojected
 * `d3.geoPath()`) — reusing worldGeo's geoNaturalEarth1() projection on this
 * data produces garbage. So this gets its own local geoIdentity() fitted to
 * a small inset viewport instead of the shared world-map projection;
 * MapView renders it as a separate inset panel rather than overlaid at the
 * same coordinates as the country polygon underneath, which is what
 * pixel-perfect alignment would require and this data can't support.
 *
 * The topology's prefecture features carry no name/properties field, only a
 * two-digit `id` — that's the standard JIS X 0401 prefecture code order
 * (01 Hokkaido ... 47 Okinawa), a fixed, well-documented numbering, not a
 * guess. Grouped into the same three provinces the 1962 scenario defines:
 * the Kanto plain (Tokyo's metropolitan core), the Kansai region (Osaka/
 * Kyoto), and the rest of the country.
 */
export const japanInsetDimensions = { width: 200, height: 180 };
const JIS_PREFECTURE_NAME: Record<string, string> = {
  '01': 'Hokkaido',
  '02': 'Aomori',
  '03': 'Iwate',
  '04': 'Miyagi',
  '05': 'Akita',
  '06': 'Yamagata',
  '07': 'Fukushima',
  '08': 'Ibaraki',
  '09': 'Tochigi',
  '10': 'Gunma',
  '11': 'Saitama',
  '12': 'Chiba',
  '13': 'Tokyo',
  '14': 'Kanagawa',
  '15': 'Niigata',
  '16': 'Toyama',
  '17': 'Ishikawa',
  '18': 'Fukui',
  '19': 'Yamanashi',
  '20': 'Nagano',
  '21': 'Gifu',
  '22': 'Shizuoka',
  '23': 'Aichi',
  '24': 'Mie',
  '25': 'Shiga',
  '26': 'Kyoto',
  '27': 'Osaka',
  '28': 'Hyogo',
  '29': 'Nara',
  '30': 'Wakayama',
  '31': 'Tottori',
  '32': 'Shimane',
  '33': 'Okayama',
  '34': 'Hiroshima',
  '35': 'Yamaguchi',
  '36': 'Tokushima',
  '37': 'Kagawa',
  '38': 'Ehime',
  '39': 'Kochi',
  '40': 'Fukuoka',
  '41': 'Saga',
  '42': 'Nagasaki',
  '43': 'Kumamoto',
  '44': 'Oita',
  '45': 'Miyazaki',
  '46': 'Kagoshima',
  '47': 'Okinawa',
};

const KANTO_CODES = new Set(['08', '09', '10', '11', '12', '13', '14']);
const KANSAI_CODES = new Set(['25', '26', '27', '28', '29', '30']);

function provinceFor(code: string): ProvinceId {
  if (KANTO_CODES.has(code)) return 'JPN-KANTO';
  if (KANSAI_CODES.has(code)) return 'JPN-KANSAI';
  return 'JPN-REST';
}

const prefectureFeatures = feature(
  japanTopology as never,
  (japanTopology as never as { objects: { prefectures: never } }).objects.prefectures,
) as unknown as FeatureCollection<Geometry, Record<string, never>>;

const japanProjection = geoIdentity().fitSize(
  [japanInsetDimensions.width, japanInsetDimensions.height],
  prefectureFeatures,
);
const japanPathGenerator = geoPath(japanProjection);

/** Every Japanese prefecture as SVG path data, in a local coordinate space sized for a small inset panel — see module doc comment for why this can't share the world map's projection. */
export const japanProvinceFeatures: ProvinceFeature[] = prefectureFeatures.features
  .map((f, i): ProvinceFeature | null => {
    const path = japanPathGenerator(f);
    if (!path) return null;
    const code = String((f as unknown as { id: string }).id ?? '').padStart(2, '0');
    return {
      name: JIS_PREFECTURE_NAME[code] ?? `Prefecture ${i + 1}`,
      provinceId: provinceFor(code),
      path,
    };
  })
  .filter((f): f is ProvinceFeature => f !== null);
