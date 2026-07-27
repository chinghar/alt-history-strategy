import { create } from 'zustand';
import type { BillStance, CountryId, GameEvent, SpyMission, TreatyType, WorldState } from '../engine/core/types';
import { buildWorld } from '../engine/core/worldFactory';
import { advanceTurn } from '../engine/core/turnEngine';
import { createRng, deriveSeed } from '../engine/core/rng';
import { setTaxRate as applyTaxRate } from '../engine/economy/economyEngine';
import { setTreaty as applyTreaty } from '../engine/diplomacy/diplomacyEngine';
import { declareWar as applyDeclareWar, suePeace as applySuePeace } from '../engine/warfare/warfareEngine';
import { setResearchFocus as applySetResearchFocus } from '../engine/research/researchEngine';
import { queueEspionageMission as applyQueueEspionageMission } from '../engine/espionage/espionageEngine';
import { setBillStance as applySetBillStance } from '../engine/legislature/legislatureEngine';
import { templateFlavorTextProvider as flavor } from '../engine/flavor/flavorTextProvider';
import { forceEvent as applyForceEvent, type ForceableEventType } from '../engine/sandbox/forceEvents';
import { scenarios, DEFAULT_SCENARIO_ID } from '../data/scenarios';

export type MapOverlay = 'political' | 'gdp' | 'ideology' | 'population' | 'military' | 'provinces';

/**
 * Player actions fire between turns, outside any tick's seeded rng — but
 * flavor text still must never touch Math.random(), so each call derives its
 * own one-off Rng from the world's seed plus how many events have already
 * been logged this turn, keeping it deterministic without needing a live rng
 * threaded through the store.
 */
function playerActionRng(world: WorldState) {
  return createRng(deriveSeed(world.seed, world.turn * 1000 + world.eventLog.length));
}

interface GameStore {
  world: WorldState;
  playerCountryId: CountryId | null;
  selectedCountryId: CountryId | null;
  overlay: MapOverlay;
  pickerOpen: boolean;
  encyclopediaOpen: boolean;
  sandboxOpen: boolean;
  nextTurn: () => void;
  selectCountry: (id: CountryId | null) => void;
  setOverlay: (overlay: MapOverlay) => void;
  setPlayerCountry: (id: CountryId) => void;
  setTaxRate: (rate: number) => void;
  toggleTreaty: (otherId: CountryId, treaty: TreatyType, active: boolean) => void;
  declareWar: (otherId: CountryId) => void;
  suePeace: () => void;
  setResearchFocus: (techId: string) => void;
  orderEspionage: (otherId: CountryId, mission: SpyMission) => void;
  castVote: (stance: BillStance) => void;
  forceEvent: (type: ForceableEventType, countryId: CountryId, secondCountryId: CountryId | null) => void;
  loadScenario: (scenarioId: string) => void;
  resetScenario: () => void;
  openPicker: () => void;
  closePicker: () => void;
  openEncyclopedia: () => void;
  closeEncyclopedia: () => void;
  openSandbox: () => void;
  closeSandbox: () => void;
  exportSave: () => void;
  importSave: (json: string) => boolean;
}

const SAVE_KEY_PREFIX = 'alt-history-strategy:save:';

function saveKeyFor(scenarioId: string): string {
  return `${SAVE_KEY_PREFIX}${scenarioId}`;
}

function findPlayerCountryId(world: WorldState): CountryId | null {
  return Object.values(world.countries).find((c) => c.isPlayerControlled)?.id ?? null;
}

/** Resumes a scenario's save if one exists, otherwise builds it fresh. */
function loadWorldForScenario(scenarioId: string): WorldState {
  const raw = localStorage.getItem(saveKeyFor(scenarioId));
  if (raw) {
    try {
      return JSON.parse(raw) as WorldState;
    } catch {
      // fall through to a fresh world if the save is corrupt
    }
  }
  return buildWorld(scenarios[scenarioId]);
}

function persist(world: WorldState) {
  localStorage.setItem(saveKeyFor(world.scenarioId), JSON.stringify(world));
}

/** Loose structural check for imported save files — enough to catch garbage/corrupt input, not a full schema validator. */
function isValidWorldState(value: unknown): value is WorldState {
  if (!value || typeof value !== 'object') return false;
  const w = value as Partial<WorldState>;
  return (
    typeof w.scenarioId === 'string' &&
    w.scenarioId in scenarios &&
    typeof w.turn === 'number' &&
    typeof w.countries === 'object' &&
    w.countries !== null
  );
}

/** Appends a player-initiated event to both the news log and the historical record. */
function withPlayerEvent(
  world: WorldState,
  text: string,
  type: string,
  countryIds: CountryId[],
  severity: GameEvent['severity'] = 'notable',
): WorldState {
  const event: GameEvent = {
    id: `player-${type}-${countryIds.join('-')}-${world.turn}-${world.eventLog.length}`,
    turn: world.turn,
    year: world.date.year,
    type,
    countryIds,
    text,
    severity,
  };
  return {
    ...world,
    eventLog: [...world.eventLog, event],
    timeline: [
      ...world.timeline,
      {
        id: `tl-${event.id}`,
        turn: event.turn,
        year: event.year,
        title: text,
        description: text,
        tags: [type],
        countryIds,
      },
    ],
  };
}

const initialWorld = loadWorldForScenario(DEFAULT_SCENARIO_ID);

export const useGameStore = create<GameStore>((set, get) => ({
  world: initialWorld,
  playerCountryId: findPlayerCountryId(initialWorld),
  selectedCountryId: null,
  overlay: 'political',
  pickerOpen: findPlayerCountryId(initialWorld) === null,
  encyclopediaOpen: false,
  sandboxOpen: false,

  nextTurn: () => {
    const world = advanceTurn(get().world);
    persist(world);
    set({ world });
  },

  selectCountry: (id) => set({ selectedCountryId: id }),
  setOverlay: (overlay) => set({ overlay }),
  openPicker: () => set({ pickerOpen: true }),
  closePicker: () => set({ pickerOpen: false }),
  openEncyclopedia: () => set({ encyclopediaOpen: true }),
  closeEncyclopedia: () => set({ encyclopediaOpen: false }),
  openSandbox: () => set({ sandboxOpen: true }),
  closeSandbox: () => set({ sandboxOpen: false }),

  setPlayerCountry: (id) => {
    const { world } = get();
    const countries = Object.fromEntries(
      Object.entries(world.countries).map(([cid, c]) => [
        cid,
        { ...c, isPlayerControlled: cid === id },
      ]),
    );
    const nextWorld = { ...world, countries };
    persist(nextWorld);
    set({ world: nextWorld, playerCountryId: id, selectedCountryId: id, pickerOpen: false });
  },

  setTaxRate: (rate) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const nextWorld = applyTaxRate(world, playerCountryId, rate);
    persist(nextWorld);
    set({ world: nextWorld });
  },

  toggleTreaty: (otherId, treaty, active) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const applied = applyTreaty(world, playerCountryId, otherId, treaty, active);

    const playerName = applied.countries[playerCountryId].name;
    const otherName = applied.countries[otherId].name;
    const rng = playerActionRng(applied);
    const text = active
      ? flavor.treatyFormed(playerName, otherName, treaty, rng)
      : flavor.treatyRevoked(playerName, otherName, treaty, rng);

    const nextWorld = withPlayerEvent(applied, text, active ? 'treaty_formed' : 'treaty_revoked', [
      playerCountryId,
      otherId,
    ]);
    persist(nextWorld);
    set({ world: nextWorld });
  },

  declareWar: (otherId) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const applied = applyDeclareWar(world, playerCountryId, otherId);
    if (applied === world) return; // already at war

    const text = flavor.warDeclared(
      applied.countries[playerCountryId].name,
      applied.countries[otherId].name,
      playerActionRng(applied),
    );
    const nextWorld = withPlayerEvent(applied, text, 'war_declared', [playerCountryId, otherId], 'major');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  suePeace: () => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const applied = applySuePeace(world, playerCountryId);
    if (applied === world) return; // not at war

    const text = flavor.peaceSued(applied.countries[playerCountryId].name, playerActionRng(applied));
    const nextWorld = withPlayerEvent(applied, text, 'peace_sued', [playerCountryId], 'major');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  setResearchFocus: (techId) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const nextWorld = applySetResearchFocus(world, playerCountryId, techId);
    persist(nextWorld);
    set({ world: nextWorld });
  },

  orderEspionage: (otherId, mission) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const queued = applyQueueEspionageMission(world, playerCountryId, otherId, mission);
    if (queued === world) return;

    const text = flavor.espionageOrdered(
      queued.countries[playerCountryId].name,
      queued.countries[otherId].name,
      playerActionRng(queued),
    );
    const nextWorld = withPlayerEvent(queued, text, 'espionage_ordered', [playerCountryId, otherId], 'minor');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  castVote: (stance) => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const applied = applySetBillStance(world, playerCountryId, stance);
    if (applied === world) return; // no pending bill to vote on

    const text = flavor.billStanceSet(applied.countries[playerCountryId].name, stance, playerActionRng(applied));
    const nextWorld = withPlayerEvent(applied, text, 'bill_stance_set', [playerCountryId], 'minor');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  forceEvent: (type, countryId, secondCountryId) => {
    const { world } = get();
    const result = applyForceEvent(world, type, countryId, secondCountryId, playerActionRng(world));
    if (result.events.length === 0) return;

    const nextWorld = {
      ...result.world,
      eventLog: [...result.world.eventLog, ...result.events],
      timeline: [
        ...result.world.timeline,
        ...result.events.map((e) => ({
          id: `tl-${e.id}`,
          turn: e.turn,
          year: e.year,
          title: e.text,
          description: e.text,
          tags: [e.type],
          countryIds: e.countryIds,
        })),
      ],
    };
    persist(nextWorld);
    set({ world: nextWorld });
  },

  loadScenario: (scenarioId) => {
    const world = loadWorldForScenario(scenarioId);
    set({ world, selectedCountryId: null, playerCountryId: findPlayerCountryId(world), pickerOpen: true });
  },

  resetScenario: () => {
    const { world: current } = get();
    const world = buildWorld(scenarios[current.scenarioId]);
    persist(world);
    set({ world, selectedCountryId: null, playerCountryId: null, pickerOpen: true });
  },

  exportSave: () => {
    const { world } = get();
    const blob = new Blob([JSON.stringify(world, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.scenarioId}-turn${world.turn}-${world.date.year}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  importSave: (json) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return false;
    }
    if (!isValidWorldState(parsed)) return false;

    persist(parsed);
    set({
      world: parsed,
      selectedCountryId: null,
      playerCountryId: findPlayerCountryId(parsed),
      pickerOpen: false,
      encyclopediaOpen: false,
    });
    return true;
  },
}));
