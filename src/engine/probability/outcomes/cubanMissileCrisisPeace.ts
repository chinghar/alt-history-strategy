import { clamp, relationKey, type HistoricalOutcomeTracker } from '../../core/types';
import { findWarBetween } from '../../core/queries';

/**
 * Inverted from every other tracker in this registry: the real 1962 outcome
 * was that superpower war was *avoided*, so this tracks whether that keeps
 * holding rather than whether some dramatic change happens. It falls as
 * USA-USSR relations sour and collapses to near-zero the moment they
 * actually go to war — the closest this engine gets to modeling nuclear
 * deterrence rather than conventional great-power politics.
 */
export const cubanMissileCrisisPeaceTracker: HistoricalOutcomeTracker = {
  id: 'cuban-missile-crisis-peace',
  label: 'Cuban Missile Crisis Resolves Peacefully',
  realWorldReference: 'Negotiated withdrawal avoids nuclear war, October 1962',
  estimate(world) {
    const usa = world.countries['USA'];
    const ussr = world.countries['USR'];
    if (!usa || !ussr) return 0;

    if (findWarBetween(world, 'USA', 'USR')) return 0.02;

    const relation = world.relations[relationKey('USA', 'USR')];
    const relationFactor = relation ? (relation.score + 100) / 200 : 0.5;

    return clamp(0.1 + relationFactor * 0.85, 0, 1);
  },
};
