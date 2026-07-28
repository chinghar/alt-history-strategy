import {
  clamp,
  relationKey,
  type Country,
  type CountryId,
  type EngineResult,
  type FocusDef,
  type FocusId,
  type GameEvent,
  type Rng,
  type WorldState,
} from '../core/types';
import { FOCUS_REGISTRY, focusesForCountry } from './focuses';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';

function isAvailable(country: Country, focus: FocusDef): boolean {
  if (country.completedFocusIds.includes(focus.id)) return false;
  return focus.prerequisiteIds.every((id) => country.completedFocusIds.includes(id));
}

/** All focuses this country could start working on right now. */
export function availableFocuses(country: Country): FocusDef[] {
  return focusesForCountry(country.id).filter((f) => isAvailable(country, f));
}

/**
 * Applies a completed focus's effect. Most fields land on the same shared
 * accumulators legislature bills and tech unlocks already feed
 * (policyGrowthBonus, techMilitaryBonus) rather than inventing new ones —
 * one growth/military bonus pool per country, fed from multiple systems.
 * relationDelta/formTreaty touch a second country's relation, so those are
 * applied by the caller against the working `relations` map, not here.
 */
function applyCountryEffect(country: Country, focus: FocusDef): Country {
  const effect = focus.effect;
  return {
    ...country,
    government:
      effect.stabilityDelta !== undefined
        ? { ...country.government, stability: clamp(country.government.stability + effect.stabilityDelta, 0, 100) }
        : country.government,
    publicOpinion:
      effect.opinionDelta !== undefined ? clamp(country.publicOpinion + effect.opinionDelta, 0, 100) : country.publicOpinion,
    taxRate: effect.taxRateDelta !== undefined ? clamp(country.taxRate + effect.taxRateDelta, 0.05, 0.5) : country.taxRate,
    debt: effect.debtDelta !== undefined ? Math.max(0, country.debt + effect.debtDelta) : country.debt,
    policyGrowthBonus:
      effect.growthBonusDelta !== undefined ? country.policyGrowthBonus + effect.growthBonusDelta : country.policyGrowthBonus,
    techMilitaryBonus:
      effect.militaryBonusDelta !== undefined
        ? country.techMilitaryBonus + effect.militaryBonusDelta
        : country.techMilitaryBonus,
    unlockedTechIds:
      effect.unlockTechId && !country.unlockedTechIds.includes(effect.unlockTechId)
        ? [...country.unlockedTechIds, effect.unlockTechId]
        : country.unlockedTechIds,
    tags: effect.addTag && !country.tags.includes(effect.addTag) ? [...country.tags, effect.addTag] : country.tags,
  };
}

/**
 * Advances every scenario-active country's national focus tree by one turn:
 * progresses the focus in flight, completes and applies it once its
 * duration elapses, and has non-player countries automatically start their
 * next available focus (mirroring how AI countries auto-pick a research
 * focus) so an AI-controlled tree country still climbs its tree over time.
 */
export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  let relations = world.relations;
  const events: GameEvent[] = [];

  for (const countryId of world.activeFocusTreeCountryIds) {
    const country = countries[countryId];
    if (!country) continue;

    if (country.currentFocusId) {
      const remaining = country.focusProgressTurns - 1;
      if (remaining > 0) {
        countries[countryId] = { ...country, focusProgressTurns: remaining };
        continue;
      }

      const focus = FOCUS_REGISTRY[country.currentFocusId];
      let updated = applyCountryEffect(country, focus);
      updated = { ...updated, currentFocusId: null, focusProgressTurns: 0, completedFocusIds: [...country.completedFocusIds, focus.id] };
      countries[countryId] = updated;

      if (focus.effect.relationDelta) {
        const { targetId, delta } = focus.effect.relationDelta;
        const key = relationKey(countryId, targetId);
        const relation = relations[key] ?? { a: countryId, b: targetId, score: 0, treaties: [] };
        relations = { ...relations, [key]: { ...relation, score: clamp(relation.score + delta, -100, 100) } };
      }
      if (focus.effect.formTreaty) {
        const { targetId, treaty } = focus.effect.formTreaty;
        const key = relationKey(countryId, targetId);
        const relation = relations[key] ?? { a: countryId, b: targetId, score: 0, treaties: [] };
        if (!relation.treaties.includes(treaty)) {
          relations = { ...relations, [key]: { ...relation, treaties: [...relation.treaties, treaty] } };
        }
      }

      events.push({
        id: `focus-completed-${countryId}-${focus.id}-${world.turn}`,
        turn: world.turn,
        year: world.date.year,
        type: 'focus_completed',
        countryIds: [countryId],
        text: flavor.focusCompleted(country.name, focus.name, rng),
        severity: 'notable',
      });
      continue;
    }

    if (country.isPlayerControlled) continue;

    const options = availableFocuses(country);
    if (options.length === 0) continue;
    const next = options[rng.int(0, options.length - 1)];
    countries[countryId] = { ...country, currentFocusId: next.id, focusProgressTurns: next.durationTurns };
  }

  return { world: { ...world, countries, relations }, events };
}

/** Player decision: begin working on a focus. No-ops if unavailable, already in progress, or already completed. */
export function setNationalFocus(world: WorldState, countryId: CountryId, focusId: FocusId): WorldState {
  const country = world.countries[countryId];
  const focus = FOCUS_REGISTRY[focusId];
  if (!country || !focus || focus.countryId !== countryId) return world;
  if (country.currentFocusId) return world;
  if (!isAvailable(country, focus)) return world;

  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: { ...country, currentFocusId: focusId, focusProgressTurns: focus.durationTurns },
    },
  };
}
