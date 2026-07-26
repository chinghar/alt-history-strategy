import type { Ideology, PrimaryIndustry } from '../engine/core/types';

// Validated categorical palette (see dataviz skill: references/palette.md),
// dark-surface steps — this UI is dark-themed throughout.
const CATEGORICAL: readonly string[] = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
];

const NEUTRAL_LAND = '#26282f';
const NEUTRAL_BORDER = '#3a3d47';

/** Political overlay: one fixed hue per country, cycling only past the 8-color floor (map identity is reinforced by position + hover, not color alone). */
export function politicalColor(countryIndex: number): string {
  return CATEGORICAL[countryIndex % CATEGORICAL.length];
}

// Sequential ramps, light->dark, one hue per magnitude overlay (dataviz
// skill reference palette for blue; orange/aqua stepped in the same
// lightness pattern so multiple sequential overlays stay visually
// consistent without ever mixing hues within one overlay).
const SEQUENTIAL_BLUE: readonly string[] = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#0d366b',
];

const SEQUENTIAL_ORANGE: readonly string[] = [
  '#fde2d0',
  '#fbc7a1',
  '#f6a873',
  '#d95926',
  '#b8461a',
  '#8f3512',
  '#6b280d',
];

const SEQUENTIAL_AQUA: readonly string[] = [
  '#c9f1e4',
  '#a0e3cc',
  '#6fd0b0',
  '#199e70',
  '#12805a',
  '#0b6244',
  '#07472f',
];

function sequentialColor(value: number, min: number, max: number, ramp: readonly string[]): string {
  if (max <= min) return ramp[3];
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const idx = Math.round(t * (ramp.length - 1));
  return ramp[idx];
}

export function gdpColor(gdp: number, min: number, max: number): string {
  return sequentialColor(gdp, min, max, SEQUENTIAL_BLUE);
}

export function populationColor(population: number, min: number, max: number): string {
  return sequentialColor(population, min, max, SEQUENTIAL_ORANGE);
}

export function militaryColor(strength: number, min: number, max: number): string {
  return sequentialColor(strength, min, max, SEQUENTIAL_AQUA);
}

const IDEOLOGY_COLOR: Record<Ideology, string> = {
  conservative: CATEGORICAL[0],
  liberal: CATEGORICAL[1],
  nationalist: CATEGORICAL[2],
  traditionalist: CATEGORICAL[3],
  reformist: CATEGORICAL[4],
};

export function ideologyColor(ideology: Ideology): string {
  return IDEOLOGY_COLOR[ideology];
}

const INDUSTRY_COLOR: Record<PrimaryIndustry, string> = {
  industrial: CATEGORICAL[0],
  trade: CATEGORICAL[1],
  agrarian: CATEGORICAL[2],
  slave_agrarian: CATEGORICAL[7],
};

export function industryColor(industry: PrimaryIndustry): string {
  return INDUSTRY_COLOR[industry];
}

export { NEUTRAL_LAND, NEUTRAL_BORDER };
