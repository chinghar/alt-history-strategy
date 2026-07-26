import { useGameStore } from '../state/gameStore';
import type { WorldState } from '../engine/core/types';

function sideLabel(world: WorldState, ids: string[]): string {
  return ids.map((id) => world.countries[id]?.name ?? id).join(' + ');
}

function averageExhaustion(exhaustion: Record<string, number>, ids: string[]): number {
  if (ids.length === 0) return 0;
  return ids.reduce((sum, id) => sum + (exhaustion[id] ?? 0), 0) / ids.length;
}

export function WarPanel() {
  const world = useGameStore((s) => s.world);
  const wars = Object.values(world.wars);

  if (wars.length === 0) return null;

  return (
    <div className="rounded-lg bg-[#181a21] p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-gray-500">Active Wars</h3>
      {wars.map((war) => {
        const attackerExhaustion = averageExhaustion(war.exhaustion, war.attackers);
        const defenderExhaustion = averageExhaustion(war.exhaustion, war.defenders);
        return (
          <div key={war.id} className="text-sm">
            <div className="text-gray-200">
              {sideLabel(world, war.attackers)} <span className="text-gray-600">vs</span>{' '}
              {sideLabel(world, war.defenders)}
            </div>
            <p className="text-xs text-gray-600 mb-1">Since {war.startYear}</p>
            <div className="space-y-1">
              <div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Attacker exhaustion</span>
                  <span>{Math.round(attackerExhaustion)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-[#e66767]" style={{ width: `${attackerExhaustion}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Defender exhaustion</span>
                  <span>{Math.round(defenderExhaustion)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-[#e66767]" style={{ width: `${defenderExhaustion}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
