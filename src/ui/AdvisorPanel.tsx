import { useGameStore } from '../state/gameStore';
import { getRecommendations, type RecommendationSeverity } from '../engine/advisor/advisorEngine';

const SEVERITY_STYLE: Record<RecommendationSeverity, string> = {
  critical: 'border-red-500/40 text-red-300',
  warning: 'border-amber-500/40 text-amber-300',
  info: 'border-[#3987e5]/40 text-[#8fb8ec]',
  good: 'border-emerald-500/40 text-emerald-300',
};

const SEVERITY_LABEL: Record<RecommendationSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Notice',
  good: 'Good',
};

export function AdvisorPanel() {
  const world = useGameStore((s) => s.world);
  const playerCountryId = useGameStore((s) => s.playerCountryId);

  if (!playerCountryId) return null;

  const recommendations = getRecommendations(world, playerCountryId);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-gray-500">Advisor</h3>
      {recommendations.map((rec) => (
        <div key={rec.id} className={`text-xs border-l-2 pl-2 py-0.5 ${SEVERITY_STYLE[rec.severity]}`}>
          <span className="text-[10px] uppercase tracking-wide opacity-70 mr-1.5">{SEVERITY_LABEL[rec.severity]}</span>
          {rec.text}
        </div>
      ))}
    </div>
  );
}
