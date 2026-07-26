import {
  relationKey,
  type Country,
  type CountryId,
  type GovernmentType,
  type Ideology,
  type OutcomeId,
  type PrimaryIndustry,
  type Province,
  type ProvinceId,
  type Relation,
  type TechId,
  type TreatyType,
  type WorldState,
} from './types';
import { recomputeAllProbabilities } from '../probability/historicalProbabilityEngine';

export interface ScenarioProvinceDef {
  id: ProvinceId;
  name: string;
  population: number;
  economicOutput: number;
  primaryIndustry: PrimaryIndustry;
  unrest: number;
}

export interface ScenarioCountryDef {
  id: CountryId;
  name: string;
  government: GovernmentType;
  leaderName: string;
  stability: number;
  ideology: Ideology;
  taxRate: number;
  unemployment: number;
  publicOpinion: number;
  militaryStrength: number;
  debt: number;
  tags: string[];
  provinces: ScenarioProvinceDef[];
}

export interface ScenarioRelationDef {
  a: CountryId;
  b: CountryId;
  score: number;
  treaties: TreatyType[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  era: string;
  startYear: number;
  seed: number;
  countries: ScenarioCountryDef[];
  relations: ScenarioRelationDef[];
  /** Which Historical Probability trackers are relevant to this scenario's timeframe. */
  outcomeTrackerIds: OutcomeId[];
  /** Which entries in the global tech registry are researchable in this scenario's era. */
  techIds: TechId[];
}

/** Builds the initial WorldState from a hand-authored scenario definition. */
export function buildWorld(scenario: ScenarioDefinition): WorldState {
  const countries: Record<CountryId, Country> = {};
  const provinces: Record<ProvinceId, Province> = {};

  for (const c of scenario.countries) {
    for (const p of c.provinces) {
      provinces[p.id] = {
        id: p.id,
        countryId: c.id,
        name: p.name,
        population: p.population,
        economicOutput: p.economicOutput,
        primaryIndustry: p.primaryIndustry,
        unrest: p.unrest,
      };
    }

    const gdp = c.provinces.reduce((sum, p) => sum + p.economicOutput, 0);

    countries[c.id] = {
      id: c.id,
      name: c.name,
      isPlayerControlled: false,
      government: {
        type: c.government,
        leaderName: c.leaderName,
        stability: c.stability,
      },
      ideology: c.ideology,
      provinceIds: c.provinces.map((p) => p.id),
      gdp,
      gdpGrowth: 0.02,
      debt: c.debt,
      taxRate: c.taxRate,
      unemployment: c.unemployment,
      publicOpinion: c.publicOpinion,
      militaryStrength: c.militaryStrength,
      tags: c.tags,
      researchPoints: 0,
      unlockedTechIds: [],
      currentResearchId: null,
      techGrowthBonus: 0,
      techMilitaryBonus: 0,
    };
  }

  const relations: Record<string, Relation> = {};
  for (const r of scenario.relations) {
    relations[relationKey(r.a, r.b)] = {
      a: r.a,
      b: r.b,
      score: r.score,
      treaties: r.treaties,
    };
  }

  let world: WorldState = {
    scenarioId: scenario.id,
    seed: scenario.seed,
    turn: 0,
    date: { year: scenario.startYear, month: 1 },
    countries,
    provinces,
    relations,
    wars: {},
    pendingEspionageMissions: [],
    eventLog: [],
    timeline: [
      {
        id: 'origin',
        turn: 0,
        year: scenario.startYear,
        title: `${scenario.name} begins`,
        description: `The simulation starts in ${scenario.startYear} with ${scenario.countries.length} sovereign powers.`,
        tags: ['origin'],
      },
    ],
    probabilities: {},
    activeOutcomeTrackerIds: scenario.outcomeTrackerIds,
    availableTechIds: scenario.techIds,
  };

  world = recomputeAllProbabilities(world);
  return world;
}
