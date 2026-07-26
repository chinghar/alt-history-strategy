import { useGameStore } from '../state/gameStore';

const SEVERITY_COLOR: Record<string, string> = {
  minor: 'text-gray-500',
  notable: 'text-amber-400',
  major: 'text-red-400',
};

export function NewsFeed() {
  const eventLog = useGameStore((s) => s.world.eventLog);
  const recent = [...eventLog].reverse().slice(0, 30);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 h-full flex flex-col">
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">News</h3>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {recent.length === 0 && <p className="text-sm text-gray-600">No news yet — advance a turn.</p>}
        {recent.map((event) => (
          <div key={event.id} className="text-sm">
            <span className={`text-xs mr-2 tabular-nums ${SEVERITY_COLOR[event.severity]}`}>{event.year}</span>
            <span className="text-gray-300">{event.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
