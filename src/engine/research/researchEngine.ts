import { clamp, type Country, type CountryId, type EngineResult, type GameEvent, type Rng, type TechId, type WorldState } from '../core/types';
import { TECH_REGISTRY } from './techs';
import { templateFlavorTextProvider as flavor } from '../flavor/flavorTextProvider';

const FUNDING_RATE = 0.02; // fraction of GDP converted to research points each turn

export function isUnlockable(tech: (typeof TECH_REGISTRY)[string], country: Country): boolean {
  if (country.unlockedTechIds.includes(tech.id)) return false;
  if (tech.prerequisiteId && !country.unlockedTechIds.includes(tech.prerequisiteId)) return false;
  return true;
}

/** AI heuristic: weighted toward whichever category the country needs most. */
function pickResearchFocus(availableIds: TechId[], country: Country, rng: Rng): TechId | null {
  if (availableIds.length === 0) return null;
  const weighted = availableIds.map((id) => {
    const tech = TECH_REGISTRY[id];
    let weight = 1;
    if (tech.category === 'military' && country.militaryStrength < 100) weight += 2;
    if (tech.category === 'political' && country.publicOpinion < 50) weight += 2;
    if (tech.category === 'economic') weight += 1;
    return { id, weight };
  });
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng.next() * total;
  for (const w of weighted) {
    if (roll < w.weight) return w.id;
    roll -= w.weight;
  }
  return weighted[weighted.length - 1].id;
}

export function tick(world: WorldState, rng: Rng): EngineResult {
  const countries = { ...world.countries };
  const events: GameEvent[] = [];

  for (const country of Object.values(world.countries)) {
    const stabilityFactor = clamp(country.government.stability / 100, 0.3, 1);
    const gained = country.gdp * FUNDING_RATE * stabilityFactor;
    let researchPoints = country.researchPoints + gained;
    let currentResearchId = country.currentResearchId;
    let unlockedTechIds = country.unlockedTechIds;
    let techGrowthBonus = country.techGrowthBonus;
    let techMilitaryBonus = country.techMilitaryBonus;
    let publicOpinion = country.publicOpinion;
    let stability = country.government.stability;

    if (!currentResearchId && !country.isPlayerControlled) {
      const available = world.availableTechIds.filter((id) => isUnlockable(TECH_REGISTRY[id], country));
      currentResearchId = pickResearchFocus(available, country, rng);
    }

    if (currentResearchId) {
      const tech = TECH_REGISTRY[currentResearchId];
      if (tech && researchPoints >= tech.cost) {
        researchPoints -= tech.cost;
        unlockedTechIds = [...unlockedTechIds, tech.id];
        if (tech.effectKind === 'growth_bonus') techGrowthBonus += tech.effectValue;
        if (tech.effectKind === 'military_bonus') techMilitaryBonus += tech.effectValue;
        if (tech.effectKind === 'stability_boost') {
          stability = clamp(stability + tech.effectValue, 0, 100);
          publicOpinion = clamp(publicOpinion + tech.effectValue, 0, 100);
        }

        events.push({
          id: `tech-unlocked-${country.id}-${tech.id}-${world.turn}`,
          turn: world.turn,
          year: world.date.year,
          type: 'tech_unlocked',
          countryIds: [country.id],
          text: flavor.techUnlocked(country.name, tech.name, rng),
          severity: 'notable',
        });

        currentResearchId = null;
      }
    }

    countries[country.id] = {
      ...country,
      researchPoints,
      currentResearchId,
      unlockedTechIds,
      techGrowthBonus,
      techMilitaryBonus,
      publicOpinion,
      government: { ...country.government, stability },
    };
  }

  return { world: { ...world, countries }, events };
}

/** Player decision: choose what to research next. No-ops on an invalid/locked/already-unlocked tech. */
export function setResearchFocus(world: WorldState, countryId: CountryId, techId: TechId): WorldState {
  const country = world.countries[countryId];
  const tech = TECH_REGISTRY[techId];
  if (!country || !tech || !world.availableTechIds.includes(techId) || !isUnlockable(tech, country)) {
    return world;
  }
  return {
    ...world,
    countries: { ...world.countries, [countryId]: { ...country, currentResearchId: techId } },
  };
}
