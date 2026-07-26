import { useGameStore } from '../state/gameStore';
import { getCountryRelations, getOtherParty } from '../engine/core/queries';

const GOVERNMENT_LABEL: Record<string, string> = {
  absolute_monarchy: 'Absolute Monarchy',
  constitutional_monarchy: 'Constitutional Monarchy',
  republic: 'Republic',
  empire: 'Empire',
  confederation: 'Confederation',
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-white/5">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100 font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function CountryDashboard() {
  const world = useGameStore((s) => s.world);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);

  if (!selectedCountryId) {
    return (
      <div className="rounded-lg bg-[#181a21] p-4 text-sm text-gray-500">
        Click a country on the map to inspect it.
      </div>
    );
  }

  const country = world.countries[selectedCountryId];
  if (!country) return null;

  const relations = getCountryRelations(world, country.id)
    .map((r) => ({ relation: r, otherId: getOtherParty(r, country.id) }))
    .sort((a, b) => b.relation.score - a.relation.score);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{country.name}</h2>
        <p className="text-xs text-gray-500">
          {GOVERNMENT_LABEL[country.government.type]} · {country.government.leaderName} ·{' '}
          <span className="capitalize">{country.ideology}</span>
        </p>
      </div>

      <div>
        <StatRow label="GDP" value={Math.round(country.gdp).toLocaleString()} />
        <StatRow label="GDP Growth" value={`${(country.gdpGrowth * 100).toFixed(1)}%`} />
        <StatRow label="Debt" value={Math.round(country.debt).toLocaleString()} />
        <StatRow label="Tax Rate" value={`${Math.round(country.taxRate * 100)}%`} />
        <StatRow label="Unemployment" value={`${country.unemployment.toFixed(1)}%`} />
        <StatRow label="Public Opinion" value={`${Math.round(country.publicOpinion)}/100`} />
        <StatRow label="Government Stability" value={`${Math.round(country.government.stability)}/100`} />
        <StatRow label="Military Strength" value={Math.round(country.militaryStrength).toLocaleString()} />
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Provinces</h3>
        <div className="space-y-1">
          {country.provinceIds.map((pid) => {
            const p = world.provinces[pid];
            return (
              <div key={pid} className="flex justify-between text-xs text-gray-400">
                <span>
                  {p.name} <span className="text-gray-600 capitalize">({p.primaryIndustry.replace('_', ' ')})</span>
                </span>
                <span className="tabular-nums">{Math.round(p.economicOutput)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {relations.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Relations</h3>
          <div className="space-y-1">
            {relations.map(({ relation, otherId }) => (
              <div key={otherId} className="flex justify-between text-xs">
                <span className="text-gray-400">
                  {world.countries[otherId]?.name ?? otherId}
                  {relation.treaties.length > 0 && (
                    <span className="text-gray-600"> ({relation.treaties.join(', ')})</span>
                  )}
                </span>
                <span className={relation.score >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {Math.round(relation.score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
