import type { BillDef, BillId, LegislatureConfig } from '../core/types';

/**
 * Real period debates, chosen to be mechanically interesting and safely
 * non-sensitive (tariffs, banking, infrastructure, poor-law administration
 * — not the era's genuinely fraught political fights). Bills feed effects
 * straight into fields the rest of the simulation already reads (taxRate,
 * stability, opinion, debt, policyGrowthBonus) — the country-specific
 * subgame changes the same shared world, it doesn't run alongside it.
 */
const registry: BillDef[] = [
  // --- USA Congress (1836) ---
  {
    id: 'tariff_act',
    name: 'Tariff Act',
    description: 'Raises duties on imported manufactured goods to shield domestic industry.',
    ideologyLean: 'conservative',
    passEffect: { taxRateDelta: 0.02, growthBonusDelta: 0.005 },
    failEffect: { opinionDelta: -3 },
  },
  {
    id: 'national_bank_charter',
    name: 'National Bank Charter',
    description: "Rechartering the national bank to stabilize the currency and federal finances.",
    ideologyLean: 'liberal',
    passEffect: { debtDelta: -30, stabilityDelta: 5 },
    failEffect: { opinionDelta: -2 },
  },
  {
    id: 'internal_improvements_act',
    name: 'Internal Improvements Act',
    description: 'Federal funding for roads, canals, and harbors to knit the internal market together.',
    ideologyLean: 'nationalist',
    passEffect: { growthBonusDelta: 0.008, debtDelta: 20 },
    failEffect: {},
  },
  {
    id: 'public_land_sale_act',
    name: 'Public Land Sale Act',
    description: 'Accelerates the sale of federal land to settlers, raising revenue and easing westward settlement.',
    ideologyLean: 'reformist',
    passEffect: { debtDelta: -15, opinionDelta: 4 },
    failEffect: {},
  },
  {
    id: 'military_appropriations_bill',
    name: 'Military Appropriations Bill',
    description: 'Funds coastal fortifications and frontier garrisons.',
    ideologyLean: 'traditionalist',
    passEffect: { debtDelta: 15, stabilityDelta: 3 },
    failEffect: {},
  },

  // --- UK Parliament (1836) ---
  {
    id: 'corn_law_adjustment',
    name: 'Corn Law Adjustment',
    description: 'Adjusts tariffs on imported grain to protect domestic agriculture.',
    ideologyLean: 'conservative',
    passEffect: { taxRateDelta: 0.015 },
    failEffect: { opinionDelta: -3 },
  },
  {
    id: 'poor_law_amendment',
    name: 'Poor Law Amendment',
    description: 'Reorganizes parish relief into centrally administered workhouses.',
    ideologyLean: 'reformist',
    passEffect: { stabilityDelta: 5, opinionDelta: -2 },
    failEffect: {},
  },
  {
    id: 'factory_act',
    name: 'Factory Act',
    description: "Limits working hours for children and young persons in textile mills.",
    ideologyLean: 'liberal',
    passEffect: { opinionDelta: 6, growthBonusDelta: -0.003 },
    failEffect: { opinionDelta: -2 },
  },
  {
    id: 'railway_charter_expansion',
    name: 'Railway Charter Expansion',
    description: 'Streamlines parliamentary approval for new railway companies.',
    ideologyLean: 'nationalist',
    passEffect: { growthBonusDelta: 0.01, debtDelta: 25 },
    failEffect: {},
  },
  {
    id: 'municipal_reform_act',
    name: 'Municipal Corporations Act',
    description: 'Replaces closed town corporations with elected municipal councils.',
    ideologyLean: 'reformist',
    passEffect: { stabilityDelta: 6 },
    failEffect: {},
  },

  // --- Athenian Assembly (431 BCE) ---
  {
    id: 'naval_expansion_decree',
    name: 'Naval Expansion Decree',
    description: 'Funds new triremes for the Aegean fleet.',
    ideologyLean: 'nationalist',
    passEffect: { growthBonusDelta: 0.006, debtDelta: 12 },
    failEffect: {},
  },
  {
    id: 'grain_subsidy_decree',
    name: 'Grain Subsidy Decree',
    description: 'Subsidizes grain imports to keep bread prices low for citizens.',
    ideologyLean: 'reformist',
    passEffect: { stabilityDelta: 5, opinionDelta: 4 },
    failEffect: { opinionDelta: -2 },
  },
  {
    id: 'war_tax_decree',
    name: 'War Tax Decree (Eisphora)',
    description: 'A special levy on the wealthy to fund military operations.',
    ideologyLean: 'traditionalist',
    passEffect: { taxRateDelta: 0.02, debtDelta: -10 },
    failEffect: { opinionDelta: -2 },
  },

  // --- European Federal Parliament (2150) ---
  {
    id: 'orbital_infrastructure_act',
    name: 'Orbital Infrastructure Investment Act',
    description: 'Federal funding for cislunar shipyards and launch infrastructure.',
    ideologyLean: 'nationalist',
    passEffect: { growthBonusDelta: 0.01, debtDelta: 30 },
    failEffect: { opinionDelta: -2 },
  },
  {
    id: 'ai_governance_directive',
    name: 'AI Governance Directive',
    description: 'Binding federal rules on autonomous systems and algorithmic decision-making.',
    ideologyLean: 'reformist',
    passEffect: { stabilityDelta: 6, growthBonusDelta: -0.003 },
    failEffect: { opinionDelta: -3 },
  },
  {
    id: 'climate_adaptation_fund',
    name: 'Climate Adaptation Fund',
    description: 'Federal funding for coastal defenses, managed retreat, and resilient agriculture.',
    ideologyLean: 'liberal',
    passEffect: { stabilityDelta: 5, debtDelta: 20 },
    failEffect: { opinionDelta: -2 },
  },
];

export const BILL_REGISTRY: Record<BillId, BillDef> = Object.fromEntries(registry.map((b) => [b.id, b]));

export const LEGISLATURE_CONFIGS: Record<string, LegislatureConfig> = {
  USA: {
    countryId: 'USA',
    name: 'Congress',
    intervalTurns: 3,
    billIds: [
      'tariff_act',
      'national_bank_charter',
      'internal_improvements_act',
      'public_land_sale_act',
      'military_appropriations_bill',
    ],
  },
  GBR: {
    countryId: 'GBR',
    name: 'Parliament',
    intervalTurns: 3,
    billIds: ['corn_law_adjustment', 'poor_law_amendment', 'factory_act', 'railway_charter_expansion', 'municipal_reform_act'],
  },
  ATH: {
    countryId: 'ATH',
    name: 'the Athenian Assembly',
    intervalTurns: 3,
    billIds: ['naval_expansion_decree', 'grain_subsidy_decree', 'war_tax_decree'],
  },
  EUF: {
    countryId: 'EUF',
    name: 'the Federal Parliament',
    intervalTurns: 3,
    billIds: ['orbital_infrastructure_act', 'ai_governance_directive', 'climate_adaptation_fund'],
  },
};
