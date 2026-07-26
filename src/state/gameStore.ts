import { create } from 'zustand';
import type { CountryId, GameEvent, TreatyType, WorldState } from '../engine/core/types';
import { buildWorld } from '../engine/core/worldFactory';
import { advanceTurn } from '../engine/core/turnEngine';
import { setTaxRate as applyTaxRate } from '../engine/economy/economyEngine';
import { setTreaty as applyTreaty } from '../engine/diplomacy/diplomacyEngine';
import { declareWar as applyDeclareWar, suePeace as applySuePeace } from '../engine/warfare/warfareEngine';
import { scenario1836 } from '../data/scenarios/1836';

export type MapOverlay = 'political' | 'gdp' | 'ideology';

const TREATY_PHRASE: Record<TreatyType, string> = {
  alliance: 'an alliance',
  trade_agreement: 'a trade agreement',
  non_aggression: 'a non-aggression pact',
  sanction: 'sanctions',
};

interface GameStore {
  world: WorldState;
  playerCountryId: CountryId | null;
  selectedCountryId: CountryId | null;
  overlay: MapOverlay;
  nextTurn: () => void;
  selectCountry: (id: CountryId | null) => void;
  setOverlay: (overlay: MapOverlay) => void;
  setPlayerCountry: (id: CountryId) => void;
  setTaxRate: (rate: number) => void;
  toggleTreaty: (otherId: CountryId, treaty: TreatyType, active: boolean) => void;
  declareWar: (otherId: CountryId) => void;
  suePeace: () => void;
  resetScenario: () => void;
}

const SAVE_KEY = 'alt-history-strategy:save:1836';

function findPlayerCountryId(world: WorldState): CountryId | null {
  return Object.values(world.countries).find((c) => c.isPlayerControlled)?.id ?? null;
}

function loadInitialWorld(): WorldState {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as WorldState;
    } catch {
      // fall through to a fresh world if the save is corrupt
    }
  }
  return buildWorld(scenario1836);
}

function persist(world: WorldState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(world));
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
      { id: `tl-${event.id}`, turn: event.turn, year: event.year, title: text, description: text, tags: [type] },
    ],
  };
}

const initialWorld = loadInitialWorld();

export const useGameStore = create<GameStore>((set, get) => ({
  world: initialWorld,
  playerCountryId: findPlayerCountryId(initialWorld),
  selectedCountryId: null,
  overlay: 'political',

  nextTurn: () => {
    const world = advanceTurn(get().world);
    persist(world);
    set({ world });
  },

  selectCountry: (id) => set({ selectedCountryId: id }),
  setOverlay: (overlay) => set({ overlay }),

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
    set({ world: nextWorld, playerCountryId: id, selectedCountryId: id });
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
    const text =
      treaty === 'sanction'
        ? `${playerName} ${active ? 'imposes sanctions on' : 'lifts sanctions on'} ${otherName}.`
        : `${playerName} ${active ? 'forms' : 'withdraws from'} ${TREATY_PHRASE[treaty]} with ${otherName}.`;

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

    const text = `${applied.countries[playerCountryId].name} declares war on ${applied.countries[otherId].name}.`;
    const nextWorld = withPlayerEvent(applied, text, 'war_declared', [playerCountryId, otherId], 'major');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  suePeace: () => {
    const { world, playerCountryId } = get();
    if (!playerCountryId) return;
    const applied = applySuePeace(world, playerCountryId);
    if (applied === world) return; // not at war

    const text = `${applied.countries[playerCountryId].name} sues for peace, ending the war.`;
    const nextWorld = withPlayerEvent(applied, text, 'peace_sued', [playerCountryId], 'major');
    persist(nextWorld);
    set({ world: nextWorld });
  },

  resetScenario: () => {
    const world = buildWorld(scenario1836);
    persist(world);
    set({ world, selectedCountryId: null, playerCountryId: null });
  },
}));
