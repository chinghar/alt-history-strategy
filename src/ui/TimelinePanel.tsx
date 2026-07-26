import { useGameStore } from '../state/gameStore';
import { formatYear } from './formatYear';

export function TimelinePanel() {
  const timeline = useGameStore((s) => s.world.timeline);
  const recent = [...timeline].reverse().slice(0, 30);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Historical Record</h3>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {recent.map((entry) => (
          <div key={entry.id} className="text-sm border-l-2 border-white/10 pl-2">
            <div className="text-xs text-gray-500 tabular-nums">{formatYear(entry.year)}</div>
            <div className="text-gray-300">{entry.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
