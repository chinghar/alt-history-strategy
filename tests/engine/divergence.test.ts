import { describe, expect, it } from 'vitest';
import { getDivergenceVerdict, VERDICT_LABEL } from '../../src/engine/probability/divergence';

describe('getDivergenceVerdict', () => {
  it('bands probabilities into the five verdicts at the documented thresholds', () => {
    expect(getDivergenceVerdict(1)).toBe('already-happened');
    expect(getDivergenceVerdict(0.85)).toBe('already-happened');
    expect(getDivergenceVerdict(0.84999)).toBe('on-track');

    expect(getDivergenceVerdict(0.65)).toBe('on-track');
    expect(getDivergenceVerdict(0.64999)).toBe('uncertain');

    expect(getDivergenceVerdict(0.35)).toBe('uncertain');
    expect(getDivergenceVerdict(0.34999)).toBe('diverging');

    expect(getDivergenceVerdict(0.15)).toBe('diverging');
    expect(getDivergenceVerdict(0.14999)).toBe('averted');

    expect(getDivergenceVerdict(0)).toBe('averted');
  });

  it('every verdict has a corresponding label', () => {
    const verdicts = ['already-happened', 'on-track', 'uncertain', 'diverging', 'averted'] as const;
    for (const v of verdicts) {
      expect(VERDICT_LABEL[v]).toBeTruthy();
    }
  });
});
