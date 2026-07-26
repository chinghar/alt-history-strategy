import { useGameStore } from '../state/gameStore';
import { scenarioList } from '../data/scenarios';
import { formatYear } from './formatYear';

export function NationPicker() {
  const world = useGameStore((s) => s.world);
  const playerCountryId = useGameStore((s) => s.playerCountryId);
  const setPlayerCountry = useGameStore((s) => s.setPlayerCountry);
  const loadScenario = useGameStore((s) => s.loadScenario);
  const closePicker = useGameStore((s) => s.closePicker);

  const countries = Object.values(world.countries).sort((a, b) => b.gdp - a.gdp);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/95 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-semibold text-gray-100">Choose Your Era & Nation</h1>
          {playerCountryId && (
            <button
              onClick={closePicker}
              className="text-sm text-gray-500 hover:text-gray-300 px-2 py-1"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {scenarioList.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => loadScenario(scenario.id)}
              className={`px-3 py-2 rounded-lg text-left border transition-colors ${
                world.scenarioId === scenario.id
                  ? 'bg-[#3987e5]/15 border-[#3987e5]/50'
                  : 'bg-[#181a21] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-sm font-medium text-gray-100">{scenario.name}</div>
              <div className="text-xs text-gray-500">
                {scenario.era} · {formatYear(scenario.startYear)}
              </div>
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Every other power is run by its own AI government from this moment on — your choices are
          the only ones that don't follow the historical script.
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
