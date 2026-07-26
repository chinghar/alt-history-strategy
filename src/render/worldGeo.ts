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
};

export interface CountryFeature {
  countryId: CountryId | null;
  geoName: string;
  path: string;
}

const worldFeatures = feature(
  worldTopology as never,
  (worldTopology as never as { objects: { countries: never } }).objects.countries,
) as unknown as FeatureCollection<Geometry, { name: string }>;

const geoNameToCountryId = new Map<string, CountryId>(
  Object.entries(COUNTRY_GEO_NAME).map(([id, name]) => [name, id]),
);

const projection = geoNaturalEarth1().fitSize([980, 500], worldFeatures);
const pathGenerator = geoPath(projection);

/** All land features as SVG path data, tagged with our CountryId where we simulate that country. */
export const countryFeatures: CountryFeature[] = worldFeatures.features
  .map((f) => {
    const path = pathGenerator(f);
    if (!path) return null;
    return {
      countryId: geoNameToCountryId.get(f.properties.name) ?? null,
      geoName: f.properties.name,
      path,
    };
  })
  .filter((f): f is CountryFeature => f !== null);

export const mapDimensions = { width: 980, height: 500 };
