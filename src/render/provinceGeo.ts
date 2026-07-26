import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import usStatesTopology from 'us-atlas/states-10m.json';
import type { ProvinceId } from '../engine/core/types';
import { pathGenerator } from './worldGeo';

/**
 * Real sub-national geometry — proves province-level rendering is possible,
 * not just a country-level approximation. Scoped to the 1836 USA for now
 * (its four provinces are the ones the American Civil War tracker cares
 * about), using each state's actual 1836-era historical alignment: the six
 * New England states, the industrializing "Old Northwest" plus the Middle
 * Atlantic states, the Upper South border/tobacco states, and the Deep
 * South cotton states. Only the 25 states that existed in the Union in
 * 1836 are mapped; the rest of the modern map (states that didn't exist
 * yet, non-USA countries) simply isn't covered by this — same "closest
 * available data" honesty as every other geo simplification in this
 * project.
 */
const US_STATE_TO_PROVINCE: Record<string, ProvinceId> = {
  // New England
  Connecticut: 'USA-NE',
  Maine: 'USA-NE',
  Massachusetts: 'USA-NE',
  'New Hampshire': 'USA-NE',
  'Rhode Island': 'USA-NE',
  Vermont: 'USA-NE',
  // Mid-Atlantic + industrializing Old Northwest
  'New York': 'USA-MA',
  'New Jersey': 'USA-MA',
  Pennsylvania: 'USA-MA',
  Ohio: 'USA-MA',
  Indiana: 'USA-MA',
  Illinois: 'USA-MA',
  // Upper South
  Delaware: 'USA-US',
  Maryland: 'USA-US',
  Virginia: 'USA-US',
  'North Carolina': 'USA-US',
  Kentucky: 'USA-US',
  Missouri: 'USA-US',
  Tennessee: 'USA-US',
  // Deep South
  'South Carolina': 'USA-DS',
  Georgia: 'USA-DS',
  Alabama: 'USA-DS',
  Mississippi: 'USA-DS',
  Louisiana: 'USA-DS',
  Arkansas: 'USA-DS',
};

export interface StateFeature {
  name: string;
  provinceId: ProvinceId | null;
  path: string;
}

const stateFeatures = feature(
  usStatesTopology as never,
  (usStatesTopology as never as { objects: { states: never } }).objects.states,
) as unknown as FeatureCollection<Geometry, { name: string }>;

/** Every US state as SVG path data (in the same projection as the world map), tagged with its 1836 province where mapped. */
export const usProvinceFeatures: StateFeature[] = stateFeatures.features
  .map((f): StateFeature | null => {
    const path = pathGenerator(f);
    if (!path) return null;
    const provinceId: ProvinceId | null = US_STATE_TO_PROVINCE[f.properties.name] ?? null;
    return {
      name: f.properties.name,
      provinceId,
      path,
    };
  })
  .filter((f): f is StateFeature => f !== null);
