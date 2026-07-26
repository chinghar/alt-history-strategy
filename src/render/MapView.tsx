import { useMemo, useState } from 'react';
import { countryFeatures, mapDimensions } from './worldGeo';
import { gdpColor, ideologyColor, politicalColor, NEUTRAL_BORDER, NEUTRAL_LAND } from './colors';
import { useGameStore } from '../state/gameStore';
import type { CountryId } from '../engine/core/types';

export function MapView() {
  const world = useGameStore((s) => s.world);
  const overlay = useGameStore((s) => s.overlay);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);
  const selectCountry = useGameStore((s) => s.selectCountry);
  const [hoveredId, setHoveredId] = useState<CountryId | null>(null);

  const countryIndex = useMemo(() => {
    const map = new Map<CountryId, number>();
    Object.keys(world.countries).forEach((id, i) => map.set(id, i));
    return map;
  }, [world.countries]);

  const gdpRange = useMemo(() => {
    const values = Object.values(world.countries).map((c) => c.gdp);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [world.countries]);

  function fillFor(countryId: CountryId | null): string {
    if (!countryId) return NEUTRAL_LAND;
    const country = world.countries[countryId];
    if (!country) return NEUTRAL_LAND;
    if (overlay === 'gdp') return gdpColor(country.gdp, gdpRange.min, gdpRange.max);
    if (overlay === 'ideology') return ideologyColor(country.ideology);
    return politicalColor(countryIndex.get(countryId) ?? 0);
  }

  const hovered = hoveredId ? world.countries[hoveredId] : null;

  return (
    <div className="relative w-full h-full bg-[#12141a] rounded-lg overflow-hidden">
      <svg
        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
        className="w-full h-full"
        role="img"
        aria-label="World political map, 1836"
      >
        {countryFeatures.map((feature, i) => {
          const isSelected = feature.countryId !== null && feature.countryId === selectedCountryId;
          const isHovered = feature.countryId !== null && feature.countryId === hoveredId;
          return (
            <path
              key={`${feature.geoName}-${i}`}
              d={feature.path}
              fill={fillFor(feature.countryId)}
              stroke={isSelected ? '#f3f4f6' : NEUTRAL_BORDER}
              strokeWidth={isSelected ? 1.5 : 0.5}
              opacity={isHovered ? 0.85 : 1}
              className={feature.countryId ? 'cursor-pointer transition-opacity' : undefined}
              onMouseEnter={() => feature.countryId && setHoveredId(feature.countryId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => feature.countryId && selectCountry(feature.countryId)}
            />
          );
        })}
      </svg>
      {hovered && (
        <div className="pointer-events-none absolute left-3 bottom-3 rounded-md bg-black/80 px-3 py-2 text-sm text-gray-100 shadow-lg">
          <div className="font-semibold">{hovered.name}</div>
          <div className="text-gray-400">
            GDP {Math.round(hovered.gdp)} · Opinion {Math.round(hovered.publicOpinion)}
          </div>
        </div>
      )}
    </div>
  );
}
