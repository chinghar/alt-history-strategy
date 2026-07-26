import type { Rng } from './types';

/**
 * mulberry32 — small, fast, seeded PRNG. All simulation randomness must flow
 * through an Rng instance (never Math.random()) so that a given seed always
 * produces an identical timeline. This is what makes save/replay and the
 * determinism test possible.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  return { next, int };
}

/** Deterministically combines a base seed with a salt (e.g. turn number) into a new seed. */
export function deriveSeed(seed: number, salt: number): number {
  return Math.imul(seed ^ salt, 2654435761) >>> 0;
}
