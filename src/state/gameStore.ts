import { create } from 'zustand';
import type { CountryId, WorldState } from '../engine/core/types';
import { buildWorld } from '../engine/core/worldFactory';
import { advanceTurn } from '../engine/core/turnEngine';
import { scenario1836 } from '../data/scenarios/1836';

export type MapOverlay = 'political' | 'gdp' | 'ideology';

interface GameStore {
  world: WorldState;
  selectedCountryId: CountryId | null;
  overlay: MapOverlay;
  nextTurn: () => void;
  selectCountry: (id: CountryId | null) => void;
  setOverlay: (overlay: MapOverlay) => void;
  resetScenario: () => void;
}

const SAVE_KEY = 'alt-history-strategy:save:1836';

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

export const useGameStore = create<GameStore>((set, get) => ({
  world: loadInitialWorld(),
  selectedCountryId: null,
  overlay: 'political',

  nextTurn: () => {
    const world = advanceTurn(get().world);
    localStorage.setItem(SAVE_KEY, JSON.stringify(world));
    set({ world });
  },

  selectCountry: (id) => set({ selectedCountryId: id }),
  setOverlay: (overlay) => set({ overlay }),

  resetScenario: () => {
    const world = buildWorld(scenario1836);
    localStorage.setItem(SAVE_KEY, JSON.stringify(world));
    set({ world, selectedCountryId: null });
  },
}));
