import { clamp, type HistoricalOutcomeTracker } from '../../core/types';

/**
 * Rises with the industrial/slave-agrarian economic divergence between the
 * USA's provinces (produced organically by economyEngine's per-industry
 * growth rates) and with domestic instability. If player action narrows
 * that divergence, this probability falls — it isn't scripted to happen.
 */
export const americanCivilWarTracker: HistoricalOutcomeTracker = {
  id: 'american-civil-war',
  label: 'American Civil War',
  realWorldReference: 'Fought 1861-1865',
  estimate(world) {
    const usa = world.countries['USA'];
    if (!usa) return 0;

    // The republic has already fractured into a confederation — the
    // scenario this tracker watches for has, for all practical purposes,
    // already happened.
    if (usa.government.type === 'confederation') return 0.97;

    const provinces = usa.provinceIds.map((id) => world.provinces[id]);
    const industrialOutput = provinces
      .filter((p) => p.primaryIndustry === 'industrial')
      .reduce((sum, p) => sum + p.economicOutput, 0);
    const slaveOutput = provinces
      .filter((p) => p.primaryIndustry === 'slave_agrarian')
      .reduce((sum, p) => sum + p.economicOutput, 0);
    const total = industrialOutput + slaveOutput;
    if (total === 0) return 0.5;

    const divergence = Math.abs(industrialOutput - slaveOutput) / total;
    const instabilityFactor = (100 - usa.government.stability) / 100;
    const unrestFactor = provinces.length
      ? provinces.reduce((sum, p) => sum + p.unrest, 0) / (provinces.length * 100)
      : 0;

    return clamp(0.1 + divergence * 0.55 + instabilityFactor * 0.2 + unrestFactor * 0.15, 0, 1);
  },
};
