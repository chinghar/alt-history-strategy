import { clamp, type HistoricalOutcomeTracker, type WorldState } from '../../core/types';
import { getCountryRelations, getOtherParty } from '../../core/queries';

function blocStrength(world: WorldState, coreId: string): number {
  const core = world.countries[coreId];
  if (!core) return 0;
  let total = core.militaryStrength;
  for (const relation of getCountryRelations(world, coreId)) {
    if (relation.treaties.includes('alliance')) {
      const ally = world.countries[getOtherParty(relation, coreId)];
      if (ally) total += ally.militaryStrength;
    }
  }
  return total;
}

/**
 * Rises with the Peloponnesian League's (Sparta + allies) military weight
 * relative to the Delian League (Athens + allies), and with Athenian fiscal
 * and political strain — the real pressures of the war's opening years,
 * before any scripted plague or Sicilian disaster.
 */
export const spartanVictoryTracker: HistoricalOutcomeTracker = {
  id: 'spartan-victory',
  label: 'Spartan Victory',
  realWorldReference: 'Athens surrenders, 404 BCE',
  estimate(world) {
    const athens = world.countries['ATH'];
    const sparta = world.countries['SPA'];
    if (!athens || !sparta) return 0;

    const spartanBloc = blocStrength(world, 'SPA');
    const athenianBloc = blocStrength(world, 'ATH');
    const total = spartanBloc + athenianBloc;
    const strengthFactor = total > 0 ? spartanBloc / total : 0.5;

    const athenianStrain = (100 - athens.government.stability) / 100;
    const fiscalStrain = athens.gdp > 0 ? clamp(athens.debt / athens.gdp, 0, 2) / 2 : 0;

    return clamp(0.2 + strengthFactor * 0.45 + athenianStrain * 0.2 + fiscalStrain * 0.15, 0, 1);
  },
};
