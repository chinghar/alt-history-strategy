import type { Ideology } from '../engine/core/types';

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

// Sequential blue ramp, light->dark (dataviz skill reference palette).
const SEQUENTIAL_BLUE: readonly string[] = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
  '#0d366b',
];

export function gdpColor(gdp: number, min: number, max: number): string {
  if (max <= min) return SEQUENTIAL_BLUE[3];
  const t = Math.min(1, Math.max(0, (gdp - min) / (max - min)));
  const idx = Math.round(t * (SEQUENTIAL_BLUE.length - 1));
  return SEQUENTIAL_BLUE[idx];
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

export { NEUTRAL_LAND, NEUTRAL_BORDER };
