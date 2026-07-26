import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import worldTopology from 'world-atlas/countries-110m.json';
import type { CountryId } from '../engine/core/types';

/**
 * Maps our simulated CountryIds to modern-day country geometry. This is a
 * deliberate simplification (see project plan): 1836 borders for Prussia,
 * Austria, and the Ottoman Empire looked very different from their modern
 * equivalents, but sourcing accurate historical GeoJSON is a separate data
 * task. Using the closest modern nation keeps the map honest-looking without
 * that scope.
 */
const COUNTRY_GEO_NAME: Record<CountryId, string> = {
  USA: 'United States of America',
  GBR: 'United Kingdom',
  FRA: 'France',
  RUS: 'Russia',
  PRU: 'Germany',
  AUT: 'Austria',
  OTT: 'Turkey',
  ESP: 'Spain',
  PRT: 'Portugal',
  NLD: 'Netherlands',
  BEL: 'Belgium',
  DNK: 'Denmark',
  SWE: 'Sweden',
  GRC: 'Greece',
  MEX: 'Mexico',
  EGY: 'Egypt',
  CHN: 'China',
  JPN: 'Japan',
  BRA: 'Brazil',
  PER: 'Iran',
  SIC: 'Italy',
  MAR: 'Morocco',
  // 2150 — supranational blocs approximated by their most populous/central
  // member, same simplification already used for pre-modern polities.
  // LUC (Lunar Commonwealth) is deliberately unmapped: it has no Earth
  // geography to render.
  EUF: 'France',
  IND: 'India',
  AFU: 'Nigeria',
  PPA: 'Japan',
  SAU: 'Brazil',
  ARC: 'Greenland',
  // 1200 CE — same "closest modern analog" simplification. JIN (Jin Dynasty,
  // northern China) is deliberately unmapped: world-atlas doesn't subdivide
  // China, and SNG already claims that polygon within this scenario's roster.
  MON: 'Mongolia',
  SNG: 'China',
  BYZ: 'Turkey',
  KHR: 'Uzbekistan',
  DEL: 'India',
  ENG: 'United Kingdom',
  HRE: 'Germany',
  VEN: 'Italy',
  KHM: 'Cambodia',
  // 1914
  GER: 'Germany',
  AUH: 'Austria',
  ITA: 'Italy',
  SRB: 'Serbia',
  // 1962 — FRG claims 'Germany'; GDR is deliberately unmapped rather than
  // sharing that polygon with FRG within the same active scenario.
  USR: 'Russia',
  FRG: 'Germany',
  CUB: 'Cuba',
};

export interface CountryFeature {
  /**
   * Every CountryId (across every scenario) that claims this geoName —
   * plural because different eras reuse the same modern polygon as their
   * closest approximation (1836's France and 2150's European Federation
   * both map to "France", for instance). Callers resolve to the one that
   * actually exists in the active WorldState.
   */
  countryIds: CountryId[];
  geoName: string;
  path: string;
}

const worldFeatures = feature(
  worldTopology as never,
  (worldTopology as never as { objects: { countries: never } }).objects.countries,
) as unknown as FeatureCollection<Geometry, { name: string }>;

const geoNameToCountryIds = new Map<string, CountryId[]>();
for (const [id, name] of Object.entries(COUNTRY_GEO_NAME)) {
  const existing = geoNameToCountryIds.get(name);
  if (existing) existing.push(id);
  else geoNameToCountryIds.set(name, [id]);
}

// Exported so provinceGeo.ts can reuse the identical projection — sub-national
// polygons need to be generated with the exact same projection as the world
// map they're overlaid on, or they won't align.
export const projection = geoNaturalEarth1().fitSize([980, 500], worldFeatures);
export const pathGenerator = geoPath(projection);

/** All land features as SVG path data, tagged with every CountryId (across all scenarios) that could render here. */
export const countryFeatures: CountryFeature[] = worldFeatures.features
  .map((f) => {
    const path = pathGenerator(f);
    if (!path) return null;
    return {
      countryIds: geoNameToCountryIds.get(f.properties.name) ?? [],
      geoName: f.properties.name,
      path,
    };
  })
  .filter((f): f is CountryFeature => f !== null);

export const mapDimensions = { width: 980, height: 500 };
