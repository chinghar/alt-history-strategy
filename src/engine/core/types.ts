// Core data model for the simulation. Every type here must stay plain-data
// and JSON-serializable — no class instances, no functions, no Dates — so
// that WorldState can be saved, loaded, hashed for determinism checks, and
// eventually sent over the wire for multiplayer.

export type CountryId = string;
export type ProvinceId = string;
export type OutcomeId = string;
export type TechId = string;

export type GovernmentType =
  | 'absolute_monarchy'
  | 'constitutional_monarchy'
  | 'republic'
  | 'empire'
  | 'confederation';

export type Ideology =
  | 'conservative'
  | 'liberal'
  | 'nationalist'
  | 'traditionalist'
  | 'reformist';

export type PrimaryIndustry = 'agrarian' | 'slave_agrarian' | 'industrial' | 'trade';

export type TreatyType = 'alliance' | 'trade_agreement' | 'non_aggression' | 'sanction';

export interface Government {
  type: GovernmentType;
  leaderName: string;
  /** 0-100. Low stability raises the chance of collapse/reform events. */
  stability: number;
}

export interface Province {
  id: ProvinceId;
  countryId: CountryId;
  name: string;
  population: number;
  economicOutput: number;
  primaryIndustry: PrimaryIndustry;
  /** 0-100. High unrest drags down national stability and opinion. */
  unrest: number;
}

export interface Country {
  id: CountryId;
  name: string;
  isPlayerControlled: boolean;
  government: Government;
  ideology: Ideology;
  provinceIds: ProvinceId[];
  gdp: number;
  gdpGrowth: number;
  debt: number;
  taxRate: number;
  unemployment: number;
  /** 0-100. Feeds into government stability and AI decisions. */
  publicOpinion: number;
  militaryStrength: number;
  /**
   * Free-form group membership used by AI heuristics and Historical
   * Probability trackers to query related countries without hardcoding
   * country IDs into every engine (e.g. "german_state", "great_power").
   */
   tags: string[];
  researchPoints: number;
  unlockedTechIds: TechId[];
  currentResearchId: TechId | null;
  /** Permanent bonuses accumulated from unlocked technologies. */
  techGrowthBonus: number;
  techMilitaryBonus: number;
  /** Permanent bonus accumulated from passed legislation (see engine/legislature). */
  policyGrowthBonus: number;
  pendingBillId: BillId | null;
  billStance: BillStance | null;
  lastLegislativeSessionTurn: number;
  /** Turn of this country's last election/succession — see engine/leadership. */
  lastLeadershipChangeTurn: number;
  currentFocusId: FocusId | null;
  /** Turns remaining on the current focus, counting down to 0. */
  focusProgressTurns: number;
  completedFocusIds: FocusId[];
}

export type FocusId = string;

export interface FocusEffect {
  stabilityDelta?: number;
  opinionDelta?: number;
  taxRateDelta?: number;
  debtDelta?: number;
  /** Added to policyGrowthBonus — the same accumulator legislature bills feed. */
  growthBonusDelta?: number;
  /** Added to techMilitaryBonus — the same accumulator military tech feeds. */
  militaryBonusDelta?: number;
  unlockTechId?: TechId;
  addTag?: string;
  relationDelta?: { targetId: CountryId; delta: number };
  formTreaty?: { targetId: CountryId; treaty: TreatyType };
}

export interface FocusDef {
  id: FocusId;
  countryId: CountryId;
  name: string;
  description: string;
  /** Must all be completed before this focus becomes selectable. */
  prerequisiteIds: FocusId[];
  durationTurns: number;
  /** Grid position for the tree layout (column, row) — mirrors HOI4's branching-tree presentation. */
  x: number;
  y: number;
  effect: FocusEffect;
}

export type BillId = string;
export type BillStance = 'support' | 'oppose';

export interface BillEffect {
  taxRateDelta?: number;
  stabilityDelta?: number;
  opinionDelta?: number;
  growthBonusDelta?: number;
  debtDelta?: number;
}

export interface BillDef {
  id: BillId;
  name: string;
  description: string;
  /** Which ideology tends to favor this bill — shapes the AI's default stance. */
  ideologyLean: Ideology;
  passEffect: BillEffect;
  failEffect: BillEffect;
}

export interface LegislatureConfig {
  countryId: CountryId;
  name: string;
  intervalTurns: number;
  billIds: BillId[];
}

export type TechCategory = 'economic' | 'military' | 'political';
export type TechEffectKind = 'growth_bonus' | 'military_bonus' | 'stability_boost';

export interface TechDef {
  id: TechId;
  name: string;
  category: TechCategory;
  cost: number;
  effectKind: TechEffectKind;
  /** growth_bonus/military_bonus: permanent additive bonus. stability_boost: one-time add to stability + opinion. */
  effectValue: number;
  description: string;
  prerequisiteId?: TechId;
}

export type SpyMission = 'destabilize' | 'sabotage' | 'steal_tech';

export interface EspionageMission {
  agentId: CountryId;
  targetId: CountryId;
  mission: SpyMission;
}

export interface Relation {
  a: CountryId;
  b: CountryId;
  /** -100 (hostile) to 100 (close ally). */
  score: number;
  treaties: TreatyType[];
}

export type RelationKey = `${CountryId}:${CountryId}`;
export type WarId = string;

export interface War {
  id: WarId;
  attackers: CountryId[];
  defenders: CountryId[];
  startTurn: number;
  startYear: number;
  /** 0-100 per participant. A side capitulates once its average hits 100. */
  exhaustion: Record<CountryId, number>;
}

export interface GameEvent {
  id: string;
  turn: number;
  year: number;
  type: string;
  countryIds: CountryId[];
  text: string;
  severity: 'minor' | 'notable' | 'major';
}

export interface TimelineEntry {
  id: string;
  turn: number;
  year: number;
  title: string;
  description: string;
  tags: string[];
  countryIds: CountryId[];
}

export interface ProbabilityTrack {
  id: OutcomeId;
  label: string;
  realWorldReference: string;
  current: number;
  history: { turn: number; value: number }[];
}

/**
 * A single tracked "does this piece of real history still happen" question.
 * `estimate` must be a pure function of WorldState — no randomness, no side
 * effects — so probabilities are fully explainable from the current world.
 */
export interface HistoricalOutcomeTracker {
  id: OutcomeId;
  label: string;
  realWorldReference: string;
  estimate(world: WorldState): number;
}

export interface WorldDate {
  year: number;
  month: number;
}

export interface WorldState {
  scenarioId: string;
  seed: number;
  turn: number;
  date: WorldDate;
  countries: Record<CountryId, Country>;
  provinces: Record<ProvinceId, Province>;
  relations: Record<RelationKey, Relation>;
  wars: Record<WarId, War>;
  pendingEspionageMissions: EspionageMission[];
  eventLog: GameEvent[];
  timeline: TimelineEntry[];
  probabilities: Record<OutcomeId, ProbabilityTrack>;
  /** Which registered Historical Probability trackers apply to this scenario. */
  activeOutcomeTrackerIds: OutcomeId[];
  /** Which entries in the global tech registry are researchable in this scenario/era. */
  availableTechIds: TechId[];
  /**
   * Which entries in the global LEGISLATURE_CONFIGS registry are active this
   * scenario. Country-specific subgames are keyed by CountryId, and IDs like
   * 'GBR'/'USA'/'RUS' are deliberately reused across eras — without this
   * filter, 1914's United Kingdom would inherit 1836's already-repealed Corn
   * Law debates. Same scoping pattern as activeOutcomeTrackerIds.
   */
  activeLegislatureCountryIds: CountryId[];
  /**
   * Which countries are led by a named collective body ("The Federal
   * Commission") rather than an individual — leadership turnover generates
   * a new institutional title for these instead of a person's name. Scoped
   * per scenario because the same CountryId can be either depending on era
   * (e.g. 'USA' is personally led in 1836/1914/1962 but institutionally led
   * in 2150).
   */
  institutionalLeadershipCountryIds: CountryId[];
  /** Which countries have an authored national focus tree active this scenario — see engine/focus. */
  activeFocusTreeCountryIds: CountryId[];
}

/** Shape every simulation engine's per-turn tick conforms to. */
export interface EngineResult {
  world: WorldState;
  events: GameEvent[];
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number;
}

export function relationKey(a: CountryId, b: CountryId): RelationKey {
  return (a < b ? `${a}:${b}` : `${b}:${a}`) as RelationKey;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
