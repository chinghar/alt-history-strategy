import { useRef } from 'react';
import type { MapOverlay } from '../state/gameStore';
import { useGameStore } from '../state/gameStore';
import { scenarios } from '../data/scenarios';
import { formatYear } from './formatYear';

const OVERLAYS: { id: MapOverlay; label: string }[] = [
  { id: 'political', label: 'Political' },
  { id: 'gdp', label: 'GDP' },
  { id: 'ideology', label: 'Ideology' },
  { id: 'population', label: 'Population' },
  { id: 'military', label: 'Military' },
  { id: 'provinces', label: 'Provinces' },
];

export function TurnControls() {
  const date = useGameStore((s) => s.world.date);
  const scenarioId = useGameStore((s) => s.world.scenarioId);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const resetScenario = useGameStore((s) => s.resetScenario);
  const openPicker = useGameStore((s) => s.openPicker);
  const openEncyclopedia = useGameStore((s) => s.openEncyclopedia);
  const overlay = useGameStore((s) => s.overlay);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const playerCountryId = useGameStore((s) => s.playerCountryId);
  const playerCountryName = useGameStore((s) =>
    s.playerCountryId ? s.world.countries[s.playerCountryId]?.name : null,
  );
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    if (!importSave(text)) {
      alert("Couldn't load that save file — it doesn't look like a valid save for this game.");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#181a21] rounded-lg">
      <div>
        <h1 className="text-base font-semibold text-gray-100">{scenarios[scenarioId]?.name}</h1>
        <p className="text-xs text-gray-500">
          Year {formatYear(date.year)}
          {playerCountryId && <span> · Playing as {playerCountryName}</span>}
        </p>
      </div>

      <div className="flex items-center gap-1 bg-black/30 rounded-md p-1">
        {OVERLAYS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOverlay(o.id)}
            className={`px-2.5 py-1 text-xs rounded ${
              overlay === o.id ? 'bg-[#3987e5] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
        >
          Import
        </button>
        <button
          onClick={exportSave}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
        >
          Export
        </button>
        <button
          onClick={openEncyclopedia}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
        >
          Encyclopedia
        </button>
        <button
          onClick={openPicker}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
        >
          Change Era
        </button>
        <button
          onClick={resetScenario}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
        >
          Reset
        </button>
        <button
          onClick={nextTurn}
          className="px-4 py-1.5 text-sm font-medium bg-[#3987e5] hover:bg-[#256abf] text-white rounded-md"
        >
          Next Turn
        </button>
      </div>
    </div>
  );
}
