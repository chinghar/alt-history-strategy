import { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { formatYear } from './formatYear';
import { TECH_REGISTRY } from '../engine/research/techs';

const GOVERNMENT_LABEL: Record<string, string> = {
  absolute_monarchy: 'Absolute Monarchy',
  constitutional_monarchy: 'Constitutional Monarchy',
  republic: 'Republic',
  empire: 'Empire',
  confederation: 'Confederation',
};

export function Encyclopedia() {
  const world = useGameStore((s) => s.world);
  const closeEncyclopedia = useGameStore((s) => s.closeEncyclopedia);
  const [selected, setSelected] = useState<string>('world');

  const countries = Object.values(world.countries).sort((a, b) => a.name.localeCompare(b.name));
  const country = selected === 'world' ? null : world.countries[selected];

  const entries = [...world.timeline]
    .filter((entry) => selected === 'world' || entry.countryIds.includes(selected))
    .sort((a, b) => a.turn - b.turn);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/97 flex p-6 gap-4 overflow-hidden">
      <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2 px-2">Encyclopedia</h2>
        <button
          onClick={() => setSelected('world')}
          className={`text-left text-sm px-2 py-1.5 rounded ${
            selected === 'world' ? 'bg-[#3987e5]/15 text-[#3987e5]' : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          World Overview
        </button>
        <div className="h-px bg-white/5 my-2" />
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`text-left text-sm px-2 py-1.5 rounded ${
              selected === c.id ? 'bg-[#3987e5]/15 text-[#3987e5]' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#12141a] rounded-lg overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-gray-100">{country ? country.name : 'World Overview'}</h1>
            {country ? (
              <p className="text-xs text-gray-500 mt-1">
                {GOVERNMENT_LABEL[country.government.type]} · {country.government.leaderName} ·{' '}
                <span className="capitalize">{country.ideology}</span>
                {country.unlockedTechIds.length > 0 && (
                  <>
                    {' '}
                    · Technologies: {country.unlockedTechIds.map((id) => TECH_REGISTRY[id]?.name ?? id).join(', ')}
                  </>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                {formatYear(world.date.year)} · {entries.length} recorded events across {countries.length} powers
              </p>
            )}
          </div>
          <button
            onClick={closeEncyclopedia}
            className="text-sm text-gray-500 hover:text-gray-300 px-2 py-1"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {entries.length === 0 && (
            <p className="text-sm text-gray-600">No recorded history yet — advance a few turns.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="border-l-2 border-white/10 pl-3">
              <div className="text-xs text-gray-500 tabular-nums">{formatYear(entry.year)}</div>
              <div className="text-sm text-gray-200">{entry.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
