import type { CountryId, WorldState } from '../core/types';
import { findWarInvolving, getCountryRelations, getOtherParty, isAtWar } from '../core/queries';
import { TECH_REGISTRY } from '../research/techs';
import { BILL_REGISTRY, LEGISLATURE_CONFIGS } from '../legislature/bills';

export type RecommendationSeverity = 'critical' | 'warning' | 'info' | 'good';

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  text: string;
}

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = { critical: 0, warning: 1, info: 2, good: 3 };

/**
 * Pure, read-only synthesis across every system in the simulation into
 * actionable advice for the player — this is a query, not an engine phase:
 * it never mutates WorldState, just reads it fresh each time the UI asks.
 */
export function getRecommendations(world: WorldState, countryId: CountryId): Recommendation[] {
  const country = world.countries[countryId];
  if (!country) return [];

  const recs: Recommendation[] = [];

  const debtRatio = country.gdp > 0 ? country.debt / country.gdp : 0;
  if (debtRatio > 0.8) {
    recs.push({
      id: 'debt-critical',
      severity: 'critical',
      text: 'Debt is dangerously high relative to GDP — raise taxes or seek fiscal relief before creditors lose confidence.',
    });
  } else if (debtRatio > 0.5) {
    recs.push({ id: 'debt-elevated', severity: 'warning', text: 'Debt is climbing — keep an eye on your fiscal balance.' });
  }

  if (country.government.stability < 20) {
    recs.push({
      id: 'stability-critical',
      severity: 'critical',
      text: 'Government stability is critical — collapse or revolution may follow if this continues.',
    });
  } else if (country.government.stability < 35) {
    recs.push({
      id: 'stability-low',
      severity: 'warning',
      text: 'Government stability is low — address public discontent before it worsens.',
    });
  }

  if (country.publicOpinion < 30) {
    recs.push({
      id: 'opinion-low',
      severity: 'warning',
      text: 'Public opinion is low, which drags down stability — a tax cut or a legislative win could help.',
    });
  }

  if (country.unemployment > 20) {
    recs.push({ id: 'unemployment-high', severity: 'warning', text: 'Unemployment is high and weighing on public opinion.' });
  }

  const war = findWarInvolving(world, countryId);
  if (war) {
    const ownSide = war.attackers.includes(countryId) ? war.attackers : war.defenders;
    const avgExhaustion = ownSide.reduce((sum, id) => sum + (war.exhaustion[id] ?? 0), 0) / ownSide.length;
    if (avgExhaustion > 60) {
      recs.push({
        id: 'war-faltering',
        severity: 'critical',
        text: 'Your war effort is faltering — consider suing for peace before your forces are forced to capitulate.',
      });
    }
  }

  if (!isAtWar(world, countryId)) {
    for (const relation of getCountryRelations(world, countryId)) {
      if (relation.score < -70 && !relation.treaties.includes('alliance')) {
        const otherId = getOtherParty(relation, countryId);
        const otherName = world.countries[otherId]?.name ?? otherId;
        recs.push({
          id: `hostile-${otherId}`,
          severity: 'warning',
          text: `Relations with ${otherName} are hostile — they may move against you militarily or covertly.`,
        });
      }
    }
  }

  if (!country.currentResearchId) {
    const hasAvailable = world.availableTechIds.some((id) => {
      const tech = TECH_REGISTRY[id];
      return (
        !country.unlockedTechIds.includes(id) &&
        (!tech.prerequisiteId || country.unlockedTechIds.includes(tech.prerequisiteId))
      );
    });
    if (hasAvailable) {
      recs.push({ id: 'research-idle', severity: 'info', text: 'No active research — choose a focus to keep pace with rivals.' });
    }
  }

  if (country.pendingBillId && !country.billStance) {
    const config = LEGISLATURE_CONFIGS[countryId];
    const bill = BILL_REGISTRY[country.pendingBillId];
    if (config && bill) {
      recs.push({
        id: 'bill-pending',
        severity: 'info',
        text: `${config.name} awaits your position on the ${bill.name}.`,
      });
    }
  }

  if (country.gdpGrowth > 0.05) {
    recs.push({
      id: 'boom',
      severity: 'good',
      text: 'Your economy is booming — a strong moment to invest in research or military buildup.',
    });
  }

  if (recs.length === 0) {
    recs.push({ id: 'stable', severity: 'good', text: 'The nation is stable. No urgent concerns at this time.' });
  }

  return recs.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
