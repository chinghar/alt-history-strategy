import { useGameStore } from '../state/gameStore';

export function ProbabilityPanel() {
  const probabilities = useGameStore((s) => s.world.probabilities);
  const tracks = Object.values(probabilities);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-gray-500">Historical Probability Engine</h3>
      {tracks.length === 0 && (
        <p className="text-xs text-gray-600">
          No historical benchmarks apply here — this far out, the future hasn't been written yet.
        </p>
      )}
      {tracks.map((track) => {
        const history = track.history;
        const previous = history.length > 1 ? history[history.length - 2].value : track.current;
        const delta = track.current - previous;
        const pct = Math.round(track.current * 100);

        return (
          <div key={track.id}>
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-gray-200">{track.label}</span>
              <span className="tabular-nums text-gray-100 font-medium">
                {pct}%
                {Math.abs(delta) > 0.001 && (
                  <span className={delta > 0 ? 'text-emerald-400 ml-1' : 'text-red-400 ml-1'}>
                    {delta > 0 ? '↑' : '↓'}
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-[#3987e5]" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-0.5">Real history: {track.realWorldReference}</p>
          </div>
        );
      })}
    </div>
  );
}
