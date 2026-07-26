import { describe, expect, it } from 'vitest';
import { templateFlavorTextProvider as flavor } from '../../src/engine/flavor/flavorTextProvider';
import { createRng } from '../../src/engine/core/rng';
import type { Rng } from '../../src/engine/core/types';

/** Runs a generator against many seeded rngs and returns the set of distinct outputs. */
function sampleDistinct(generate: (rng: Rng) => string, samples = 40): Set<string> {
  const outputs = new Set<string>();
  for (let seed = 0; seed < samples; seed++) {
    outputs.add(generate(createRng(seed)));
  }
  return outputs;
}

describe('templateFlavorTextProvider', () => {
  it('produces multiple distinct headlines for a routine economic swing (combinatorial slots)', () => {
    const boomOutputs = sampleDistinct((rng) => flavor.boomHeadline('Prussia', rng));
    const recessionOutputs = sampleDistinct((rng) => flavor.recessionHeadline('Prussia', rng));
    const unrestOutputs = sampleDistinct((rng) => flavor.unrestHeadline('Prussia', rng));

    // 4 openers x 4 closers = up to 16 distinct sentences; over 40 seeded
    // samples we should see well more variety than the old single-template
    // (1 distinct output) or simple 3-option pick (3 distinct outputs).
    expect(boomOutputs.size).toBeGreaterThan(5);
    expect(recessionOutputs.size).toBeGreaterThan(5);
    expect(unrestOutputs.size).toBeGreaterThan(5);

    for (const text of boomOutputs) expect(text).toContain('Prussia');
  });

  it('produces multiple distinct phrasings for structural events (simple pick)', () => {
    const allianceOutputs = sampleDistinct((rng) => flavor.allianceFormed('Prussia', 'Austria', rng));
    const warOutputs = sampleDistinct((rng) => flavor.warDeclared('Prussia', 'Austria', rng));

    expect(allianceOutputs.size).toBeGreaterThan(1);
    expect(warOutputs.size).toBeGreaterThan(1);
    for (const text of allianceOutputs) {
      expect(text).toContain('Prussia');
      expect(text).toContain('Austria');
    }
  });

  it('gives espionage success text that differs by mission type (context-aware, not a generic catch-all)', () => {
    const rng = createRng(7);
    const destabilize = flavor.espionageSuccess('Austria', 'destabilize', rng);
    const sabotage = flavor.espionageSuccess('Austria', 'sabotage', rng);
    const stealTech = flavor.espionageSuccess('Austria', 'steal_tech', rng);

    expect(destabilize).not.toBe(sabotage);
    expect(sabotage).not.toBe(stealTech);
    expect(destabilize).not.toBe(stealTech);
  });

  it('phrases regime-change outcomes distinctly per path (reform vs revolution vs fracture vs reshuffle)', () => {
    const rng = createRng(3);
    const reform = flavor.regimeChangeReform('France', rng);
    const revolution = flavor.regimeChangeRevolution('France', rng);
    const fracture = flavor.regimeChangeFracture('France', rng);
    const reshuffle = flavor.regimeChangeReshuffle('France', rng);

    const texts = [reform, revolution, fracture, reshuffle];
    expect(new Set(texts).size).toBe(4);
    for (const text of texts) expect(text).toContain('France');
  });

  it('formats treaty text per treaty type, including the sanction special case', () => {
    const rng = createRng(1);
    expect(flavor.treatyFormed('USA', 'Mexico', 'alliance', rng)).toMatch(/alliance/);
    expect(flavor.treatyFormed('USA', 'Mexico', 'sanction', rng)).toMatch(/sanction/i);
    expect(flavor.treatyRevoked('USA', 'Mexico', 'non_aggression', rng)).toMatch(/non-aggression/);
  });

  it('lists three or more war losers in readable prose', () => {
    const rng = createRng(1);
    const text = flavor.warCapitulation('Prussia', ['Austria', 'Bavaria', 'Saxony'], rng);
    expect(text).toContain('Austria, Bavaria, and Saxony');
  });

  it('is fully deterministic for a given rng state', () => {
    const a = flavor.boomHeadline('Prussia', createRng(42));
    const b = flavor.boomHeadline('Prussia', createRng(42));
    expect(a).toBe(b);
  });
});
