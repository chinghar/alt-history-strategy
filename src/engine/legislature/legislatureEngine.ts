import {
  clamp,
  type BillEffect,
  type BillStance,
  type Country,
  type CountryId,
  type EngineResult,
  type GameEvent,
  type Rng,
  type WorldState,
} from '../core/types';
import { BILL_REGISTRY, LEGISLATURE_CONFIGS } from './bills';

function applyBillEffect(country: Country, effect: BillEffect): Country {
  return {
    ...country,
    taxRate:
      effect.taxRateDelta !== undefined ? clamp(country.taxRate + effect.taxRateDelta, 0.05, 0.5) : country.taxRate,
    government:
      effect.stabilityDelta !== undefined
        ? { ...country.government, stability: clamp(country.government.stability + effect.stabilityDelta, 0, 100) }
        : country.government,
    publicOpinion:
      effect.opinionDelta !== undefined
        ? clamp(country.publicOpinion + effect.opinionDelta, 0, 100)
        : country.publicOpinion,
    policyGrowthBonus:
      effect.growthBonusDelta !== undefined
        ? country.policyGrowthBonus + effect.growthBonusDelta
        : country.policyGrowthBonus,
    debt: effect.debtDelta !== undefined ? Math.max(0, country.debt + effect.debtDelta) : country.debt,
  };
}

/**
 * Country-specific subgame: a handful of nations have a legislature that
 * periodically convenes to debate a real period bill and votes it up or
 * down. AI countries derive an implicit stance from ideology; the player
 * chooses explicitly via setBillStance. Resolution is deferred to the turn
 * after convening (same pattern as espionage) so there's always a window
 * to react — and every effect lands on fields the rest of the simulation
 * already reads (taxRate, stability, opinion, debt, policyGrowthBonus), so
 * this subgame changes the same shared world rather than running beside it.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const events: GameEvent[] = [];

  for (const config of Object.values(LEGISLATURE_CONFIGS)) {
    const country = countries[config.countryId];
    if (!country) continue;

    if (country.pendingBillId) {
      const bill = BILL_REGISTRY[country.pendingBillId];
      const stance: BillStance = country.billStance ?? (bill.ideologyLean === country.ideology ? 'support' : 'oppose');
      const opinionFactor = (country.publicOpinion - 50) / 200;
      const stanceFactor = stance === 'support' ? 0.2 : -0.2;
      const passChance = clamp(0.5 + opinionFactor + stanceFactor, 0.1, 0.9);
      const passed = rng.next() < passChance;

      const resolved = applyBillEffect(country, passed ? bill.passEffect : bill.failEffect);
      countries[config.countryId] = {
        ...resolved,
        pendingBillId: null,
        billStance: null,
        lastLegislativeSessionTurn: world.turn,
      };

      events.push({
        id: `bill-resolved-${config.countryId}-${bill.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: passed ? 'bill_passed' : 'bill_failed',
        countryIds: [config.countryId],
        text: passed
          ? `${config.name} passes the ${bill.name}.`
          : `${config.name} rejects the ${bill.name}.`,
        severity: 'major',
      });
    } else if (world.turn - country.lastLegislativeSessionTurn >= config.intervalTurns) {
      const billId = config.billIds[rng.int(0, config.billIds.length - 1)];
      const bill = BILL_REGISTRY[billId];
      countries[config.countryId] = { ...country, pendingBillId: billId };

      events.push({
        id: `bill-convened-${config.countryId}-${billId}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'bill_convened',
        countryIds: [config.countryId],
        text: `${config.name} convenes to debate the ${bill.name}.`,
        severity: 'notable',
      });
    }
  }

  return { world: { ...world, countries }, events };
}

/** Player decision: state a stance on the currently pending bill before it resolves next turn. */
export function setBillStance(world: WorldState, countryId: CountryId, stance: BillStance): WorldState {
  const country = world.countries[countryId];
  if (!country || !country.pendingBillId) return world;
  return {
    ...world,
    countries: { ...world.countries, [countryId]: { ...country, billStance: stance } },
  };
}
