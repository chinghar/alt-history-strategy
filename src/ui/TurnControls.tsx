import type { MapOverlay } from '../state/gameStore';
import { useGameStore } from '../state/gameStore';

const OVERLAYS: { id: MapOverlay; label: string }[] = [
  { id: 'political', label: 'Political' },
  { id: 'gdp', label: 'GDP' },
  { id: 'ideology', label: 'Ideology' },
];

export function TurnControls() {
  const date = useGameStore((s) => s.world.date);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const resetScenario = useGameStore((s) => s.resetScenario);
  const overlay = useGameStore((s) => s.overlay);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const playerCountryId = useGameStore((s) => s.playerCountryId);
  const playerCountryName = useGameStore((s) =>
    s.playerCountryId ? s.world.countries[s.playerCountryId]?.name : null,
  );

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#181a21] rounded-lg">
      <div>
        <h1 className="text-base font-semibold text-gray-100">The World of 1836</h1>
        <p className="text-xs text-gray-500">
          Year {date.year}
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
