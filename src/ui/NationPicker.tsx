import { useGameStore } from '../state/gameStore';

export function NationPicker() {
  const world = useGameStore((s) => s.world);
  const setPlayerCountry = useGameStore((s) => s.setPlayerCountry);

  const countries = Object.values(world.countries).sort((a, b) => b.gdp - a.gdp);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/95 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-semibold text-gray-100 mb-1">Choose Your Nation</h1>
        <p className="text-sm text-gray-500 mb-6">
          The World of 1836. Every other power is run by its own AI government from this moment on —
          your choices are the only ones that don't follow the historical script.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => setPlayerCountry(country.id)}
              className="text-left rounded-lg bg-[#181a21] hover:bg-[#20232c] border border-white/5 hover:border-[#3987e5]/50 p-3 transition-colors"
            >
              <div className="font-semibold text-gray-100">{country.name}</div>
              <div className="text-xs text-gray-500 capitalize mb-2">
                {country.government.type.replace('_', ' ')} · {country.ideology}
              </div>
              <div className="text-xs text-gray-400">GDP {Math.round(country.gdp).toLocaleString()}</div>
              <div className="text-xs text-gray-400">Stability {Math.round(country.government.stability)}/100</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
