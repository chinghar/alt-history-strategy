import { create } from 'zustand';
import type { CountryId, TreatyType, WorldState } from '../engine/core/types';
import { buildWorld } from '../engine/core/worldFactory';
import { advanceTurn } from '../engine/core/turnEngine';
import { setTaxRate as applyTaxRate } from '../engine/economy/economyEngine';
import { setTreaty as applyTreaty } from '../engine/diplomacy/diplomacyEngine';
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
    let nextWorld = applyTreaty(world, playerCountryId, otherId, treaty, active);

    const playerName = nextWorld.countries[playerCountryId].name;
    const otherName = nextWorld.countries[otherId].name;
    const text =
      treaty === 'sanction'
        ? `${playerName} ${active ? 'imposes sanctions on' : 'lifts sanctions on'} ${otherName}.`
        : `${playerName} ${active ? 'forms' : 'withdraws from'} ${TREATY_PHRASE[treaty]} with ${otherName}.`;
    const event = {
      id: `player-treaty-${playerCountryId}-${otherId}-${treaty}-${nextWorld.turn}-${active}`,
      turn: nextWorld.turn,
      year: nextWorld.date.year,
      type: active ? 'treaty_formed' : 'treaty_revoked',
      countryIds: [playerCountryId, otherId],
      text,
      severity: 'notable' as const,
    };
    nextWorld = {
      ...nextWorld,
      eventLog: [...nextWorld.eventLog, event],
      timeline: [
        ...nextWorld.timeline,
        { id: `tl-${event.id}`, turn: event.turn, year: event.year, title: text, description: text, tags: [event.type] },
      ],
    };

    persist(nextWorld);
    set({ world: nextWorld });
  },

  resetScenario: () => {
    const world = buildWorld(scenario1836);
    persist(world);
    set({ world, selectedCountryId: null, playerCountryId: null });
  },
}));
