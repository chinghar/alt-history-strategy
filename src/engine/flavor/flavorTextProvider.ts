import type { Rng } from '../core/types';

/**
 * Turns a bare statistical delta into a newspaper-style line. Template-based
 * today; the interface is the seam for swapping in a real LLM call later
 * without touching any engine that consumes it — the simulation numbers
 * never depend on the text, only the other way around.
 */
export interface FlavorTextProvider {
  boomHeadline(countryName: string, rng: Rng): string;
  recessionHeadline(countryName: string, rng: Rng): string;
  unrestHeadline(countryName: string, rng: Rng): string;
}

function pick<T>(options: readonly T[], rng: Rng): T {
  return options[rng.int(0, options.length - 1)];
}

export const templateFlavorTextProvider: FlavorTextProvider = {
  boomHeadline(countryName, rng) {
    return pick(
      [
        `${countryName}'s economy roars ahead as industry and trade surge.`,
        `Merchants and manufacturers report a banner year across ${countryName}.`,
        `${countryName} posts its strongest growth in a generation.`,
      ],
      rng,
    );
  },
  recessionHeadline(countryName, rng) {
    return pick(
      [
        `${countryName}'s economy contracts sharply, rattling markets.`,
        `Hard times descend on ${countryName} as output falls.`,
        `${countryName} slides toward recession amid falling output.`,
      ],
      rng,
    );
  },
  unrestHeadline(countryName, rng) {
    return pick(
      [
        `Public confidence in ${countryName}'s government collapses.`,
        `Discontent spreads across ${countryName} as opinion sours.`,
        `${countryName}'s leadership faces a sharp loss of popular support.`,
      ],
      rng,
    );
  },
};
