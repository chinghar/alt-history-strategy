import { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { FORCEABLE_EVENTS, type ForceableEventType } from '../engine/sandbox/forceEvents';
import type { CountryId } from '../engine/core/types';

export function SandboxPanel() {
  const world = useGameStore((s) => s.world);
  const closeSandbox = useGameStore((s) => s.closeSandbox);
  const forceEvent = useGameStore((s) => s.forceEvent);

  const countries = Object.values(world.countries).sort((a, b) => a.name.localeCompare(b.name));
  const [selectedType, setSelectedType] = useState<ForceableEventType>(FORCEABLE_EVENTS[0].id);
  const [countryId, setCountryId] = useState<CountryId>(countries[0]?.id ?? '');
  const [secondCountryId, setSecondCountryId] = useState<CountryId>(countries[1]?.id ?? countries[0]?.id ?? '');
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const eventDef = FORCEABLE_EVENTS.find((e) => e.id === selectedType)!;

  function handleTrigger() {
    if (!countryId) return;
    if (eventDef.needsSecondCountry && (!secondCountryId || secondCountryId === countryId)) return;
    const before = world.eventLog.length;
    forceEvent(selectedType, countryId, eventDef.needsSecondCountry ? secondCountryId : null);
    const after = useGameStore.getState().world.eventLog;
    setLastTriggered(after.length > before ? after[after.length - 1].text : 'Nothing happened — that event may not apply right now (e.g. no war to end, no tech left to unlock).');
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c10]/97 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#181a21] rounded-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Sandbox — Force an Event</h2>
            <p className="text-xs text-gray-500 mt-1">
              Trigger something on any country, then click Next Turn to watch the normal simulation react to it.
            </p>
          </div>
          <button
            onClick={closeSandbox}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-md"
          >
            Close
          </button>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Event</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {FORCEABLE_EVENTS.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedType(e.id)}
                className={`text-left px-2.5 py-1.5 rounded text-xs border ${
                  selectedType === e.id
                    ? 'border-[#3987e5] bg-[#3987e5]/10 text-[#8fb8ec]'
                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{eventDef.description}</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              {eventDef.needsSecondCountry ? 'First country' : 'Country'}
            </h3>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-sm text-gray-200"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {eventDef.needsSecondCountry && (
            <div className="flex-1">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Second country</h3>
              <select
                value={secondCountryId}
                onChange={(e) => setSecondCountryId(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-sm text-gray-200"
              >
                {countries
                  .filter((c) => c.id !== countryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleTrigger}
          className="w-full px-4 py-2 text-sm font-medium bg-[#3987e5] hover:bg-[#256abf] text-white rounded-md"
        >
          Trigger Event
        </button>

        {lastTriggered && (
          <div className="text-xs text-gray-300 bg-black/30 rounded-md px-3 py-2 border-l-2 border-[#3987e5]/60">
            {lastTriggered}
          </div>
        )}
      </div>
    </div>
  );
}
