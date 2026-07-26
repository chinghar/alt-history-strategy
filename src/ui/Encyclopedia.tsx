import { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { formatYear } from './formatYear';
import { TECH_REGISTRY } from '../engine/research/techs';
import { getDivergenceVerdict, VERDICT_LABEL, type DivergenceVerdict } from '../engine/probability/divergence';

const GOVERNMENT_LABEL: Record<string, string> = {
  absolute_monarchy: 'Absolute Monarchy',
  constitutional_monarchy: 'Constitutional Monarchy',
  republic: 'Republic',
  empire: 'Empire',
  confederation: 'Confederation',
};

const VERDICT_COLOR: Record<DivergenceVerdict, string> = {
  'already-happened': 'border-emerald-500/40 text-emerald-300',
  'on-track': 'border-[#3987e5]/40 text-[#8fb8ec]',
  uncertain: 'border-amber-500/40 text-amber-300',
  diverging: 'border-orange-500/40 text-orange-300',
  averted: 'border-red-500/40 text-red-300',
};

function HistoryComparedPage() {
  const probabilities = useGameStore((s) => s.world.probabilities);
  const tracks = Object.values(probabilities);

  if (tracks.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No historical benchmarks apply to this era — nothing here has happened yet to compare against.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => {
        const verdict = getDivergenceVerdict(track.current);
        return (
          <div key={track.id} className={`border-l-2 pl-3 ${VERDICT_COLOR[verdict]}`}>
            <div className="text-sm text-gray-100 font-medium">{track.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">Real history: {track.realWorldReference}</div>
            <div className="text-xs mt-1">
              <span className="tabular-nums font-medium">{Math.round(track.current * 100)}%</span>{' '}
              <span>{VERDICT_LABEL[verdict]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Encyclopedia() {
  const world = useGameStore((s) => s.world);
  const closeEncyclopedia = useGameStore((s) => s.closeEncyclopedia);
  const [selected, setSelected] = useState<string>('world');

  const countries = Object.values(world.countries).sort((a, b) => a.name.localeCompare(b.name));
  const country = selected === 'world' || selected === 'history' ? null : world.countries[selected];

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
        <button
          onClick={() => setSelected('history')}
          className={`text-left text-sm px-2 py-1.5 rounded ${
            selected === 'history' ? 'bg-[#3987e5]/15 text-[#3987e5]' : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          History Compared
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
            <h1 className="text-xl font-semibold text-gray-100">
              {selected === 'history' ? 'History Compared' : country ? country.name : 'World Overview'}
            </h1>
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
            ) : selected === 'history' ? (
              <p className="text-xs text-gray-500 mt-1">How your timeline has diverged from what really happened</p>
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
          {selected === 'history' ? (
            <HistoryComparedPage />
          ) : (
            <>
              {entries.length === 0 && (
                <p className="text-sm text-gray-600">No recorded history yet — advance a few turns.</p>
              )}
              {entries.map((entry) => (
                <div key={entry.id} className="border-l-2 border-white/10 pl-3">
                  <div className="text-xs text-gray-500 tabular-nums">{formatYear(entry.year)}</div>
                  <div className="text-sm text-gray-200">{entry.description}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
