import { useMemo, useState } from 'react';
import { countryFeatures, mapDimensions, type CountryFeature } from './worldGeo';
import { usProvinceFeatures, type ProvinceFeature } from './provinceGeo';
import { japanInsetDimensions, japanProvinceFeatures } from './japanProvinceGeo';
import {
  gdpColor,
  ideologyColor,
  industryColor,
  militaryColor,
  politicalColor,
  populationColor,
  NEUTRAL_BORDER,
  NEUTRAL_LAND,
} from './colors';
import { useGameStore } from '../state/gameStore';
import type { CountryId, WorldState } from '../engine/core/types';

function totalPopulation(world: WorldState, countryId: CountryId): number {
  const country = world.countries[countryId];
  if (!country) return 0;
  return country.provinceIds.reduce((sum, pid) => sum + (world.provinces[pid]?.population ?? 0), 0);
}

/** A geo feature can carry candidate ids from multiple eras; resolve to whichever one is actually in play. */
function resolveCountryId(feature: CountryFeature, world: WorldState): CountryId | null {
  return feature.countryIds.find((id) => id in world.countries) ?? null;
}

export function MapView() {
  const world = useGameStore((s) => s.world);
  const overlay = useGameStore((s) => s.overlay);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);
  const selectCountry = useGameStore((s) => s.selectCountry);
  const [hoveredId, setHoveredId] = useState<CountryId | null>(null);
  const [hoveredState, setHoveredState] = useState<ProvinceFeature | null>(null);

  const countryIndex = useMemo(() => {
    const map = new Map<CountryId, number>();
    Object.keys(world.countries).forEach((id, i) => map.set(id, i));
    return map;
  }, [world.countries]);

  const gdpRange = useMemo(() => {
    const values = Object.values(world.countries).map((c) => c.gdp);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [world.countries]);

  const populationRange = useMemo(() => {
    const values = Object.keys(world.countries).map((id) => totalPopulation(world, id));
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [world]);

  const militaryRange = useMemo(() => {
    const values = Object.values(world.countries).map((c) => c.militaryStrength);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [world.countries]);

  const hasMappedCountries = useMemo(
    () => countryFeatures.some((f) => resolveCountryId(f, world) !== null),
    [world],
  );

  // us-atlas shares real lon/lat with the world map's own projection, so its
  // states overlay pixel-perfectly on the main SVG. jpn-atlas ships
  // pre-projected planar coordinates instead (see japanProvinceGeo.ts) —
  // incompatible with that shared projection — so Japan renders as its own
  // small inset panel with a separate local coordinate space instead.
  const showUsInset =
    overlay === 'provinces' && usProvinceFeatures.some((f) => f.provinceId && f.provinceId in world.provinces);
  const showJapanInset =
    overlay === 'provinces' && japanProvinceFeatures.some((f) => f.provinceId && f.provinceId in world.provinces);
  const showProvinceInset = showUsInset || showJapanInset;

  function fillFor(countryId: CountryId | null): string {
    if (!countryId) return NEUTRAL_LAND;
    const country = world.countries[countryId];
    if (!country) return NEUTRAL_LAND;
    if (overlay === 'gdp') return gdpColor(country.gdp, gdpRange.min, gdpRange.max);
    if (overlay === 'ideology') return ideologyColor(country.ideology);
    if (overlay === 'population') {
      return populationColor(totalPopulation(world, countryId), populationRange.min, populationRange.max);
    }
    if (overlay === 'military') {
      return militaryColor(country.militaryStrength, militaryRange.min, militaryRange.max);
    }
    return politicalColor(countryIndex.get(countryId) ?? 0);
  }

  const hovered = hoveredId ? world.countries[hoveredId] : null;
  const hoveredProvince = hoveredState?.provinceId ? world.provinces[hoveredState.provinceId] : null;

  return (
    <div className="relative w-full h-full bg-[#12141a] rounded-lg overflow-hidden">
      <svg
        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
        className="w-full h-full"
        role="img"
        aria-label="World political map"
      >
        {countryFeatures.map((feature, i) => {
          const countryId = resolveCountryId(feature, world);
          const isSelected = countryId !== null && countryId === selectedCountryId;
          const isHovered = countryId !== null && countryId === hoveredId;
          return (
            <path
              key={`${feature.geoName}-${i}`}
              d={feature.path}
              fill={fillFor(countryId)}
              stroke={isSelected ? '#f3f4f6' : NEUTRAL_BORDER}
              strokeWidth={isSelected ? 1.5 : 0.5}
              opacity={isHovered ? 0.85 : 1}
              className={countryId ? 'cursor-pointer transition-opacity' : undefined}
              onMouseEnter={() => countryId && setHoveredId(countryId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => countryId && selectCountry(countryId)}
            />
          );
        })}
        {showUsInset &&
          usProvinceFeatures.map((state, i) => {
            const province = state.provinceId ? world.provinces[state.provinceId] : null;
            if (!province) return null;
            const isHovered = hoveredState?.name === state.name;
            return (
              <path
                key={`state-${state.name}-${i}`}
                d={state.path}
                fill={industryColor(province.primaryIndustry)}
                stroke="#0b0c10"
                strokeWidth={0.5}
                opacity={isHovered ? 0.85 : 1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => selectCountry(province.countryId)}
              />
            );
          })}
      </svg>
      {showJapanInset && (
        <div className="absolute top-3 right-3 rounded-md bg-black/60 p-2">
          <div className="text-[10px] text-gray-400 mb-1 text-center">Japan</div>
          <svg
            viewBox={`0 0 ${japanInsetDimensions.width} ${japanInsetDimensions.height}`}
            width={japanInsetDimensions.width}
            height={japanInsetDimensions.height}
            role="img"
            aria-label="Japan prefecture map"
          >
            {japanProvinceFeatures.map((state, i) => {
              const province = state.provinceId ? world.provinces[state.provinceId] : null;
              if (!province) return null;
              const isHovered = hoveredState?.name === state.name;
              return (
                <path
                  key={`jpn-${state.name}-${i}`}
                  d={state.path}
                  fill={industryColor(province.primaryIndustry)}
                  stroke="#0b0c10"
                  strokeWidth={0.5}
                  opacity={isHovered ? 0.85 : 1}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => selectCountry(province.countryId)}
                />
              );
            })}
          </svg>
        </div>
      )}
      {hoveredState && hoveredProvince ? (
        <div className="pointer-events-none absolute left-3 bottom-3 rounded-md bg-black/80 px-3 py-2 text-sm text-gray-100 shadow-lg">
          <div className="font-semibold">{hoveredState.name}</div>
          <div className="text-gray-400">
            {hoveredProvince.name} · <span className="capitalize">{hoveredProvince.primaryIndustry.replace('_', ' ')}</span> ·
            Output {Math.round(hoveredProvince.economicOutput)}
          </div>
        </div>
      ) : (
        hovered && (
          <div className="pointer-events-none absolute left-3 bottom-3 rounded-md bg-black/80 px-3 py-2 text-sm text-gray-100 shadow-lg">
            <div className="font-semibold">{hovered.name}</div>
            <div className="text-gray-400">
              GDP {Math.round(hovered.gdp)} · Population{' '}
              {totalPopulation(world, hoveredId!).toFixed(1)}M · Military {Math.round(hovered.militaryStrength)}
            </div>
          </div>
        )
      )}
      {!hasMappedCountries && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-md px-4 py-3 text-sm text-gray-300 max-w-xs text-center">
            Modern map geometry doesn't cover this era's borders yet — use the Nations list to
            inspect and select countries.
          </div>
        </div>
      )}
      {overlay === 'provinces' && !showProvinceInset && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-md px-4 py-3 text-sm text-gray-300 max-w-xs text-center">
            No province-level geometry for this era yet — currently available for the USA in 1836 and Japan in 1962.
          </div>
        </div>
      )}
    </div>
  );
}
