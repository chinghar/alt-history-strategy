/**
 * Turns a tracker's continuous probability into a qualitative "how has this
 * diverged from real history" verdict — the synthesis layer behind the
 * Encyclopedia's "History Compared" view. Pure and boundary-tested: the
 * bands are deliberately wide (5 bands over [0,1]) so small turn-to-turn
 * jitter doesn't flip the verdict back and forth.
 */
export type DivergenceVerdict = 'already-happened' | 'on-track' | 'uncertain' | 'diverging' | 'averted';

export const VERDICT_LABEL: Record<DivergenceVerdict, string> = {
  'already-happened': 'Already happened in your timeline',
  'on-track': 'Still on track, much as in real history',
  uncertain: 'Genuinely uncertain — could go either way',
  diverging: 'Diverging from history, increasingly unlikely',
  averted: 'This future has been averted in your timeline',
};

export function getDivergenceVerdict(probability: number): DivergenceVerdict {
  if (probability >= 0.85) return 'already-happened';
  if (probability >= 0.65) return 'on-track';
  if (probability >= 0.35) return 'uncertain';
  if (probability >= 0.15) return 'diverging';
  return 'averted';
}
