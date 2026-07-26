import { useGameStore } from '../state/gameStore';
import { getCountryRelations, getOtherParty } from '../engine/core/queries';
import type { CountryId, TreatyType } from '../engine/core/types';

const GOVERNMENT_LABEL: Record<string, string> = {
  absolute_monarchy: 'Absolute Monarchy',
  constitutional_monarchy: 'Constitutional Monarchy',
  republic: 'Republic',
  empire: 'Empire',
  confederation: 'Confederation',
};

const TREATY_LABEL: Record<TreatyType, string> = {
  alliance: 'Alliance',
  trade_agreement: 'Trade',
  non_aggression: 'Non-Aggression',
  sanction: 'Sanction',
};

const TREATY_ORDER: TreatyType[] = ['alliance', 'trade_agreement', 'non_aggression', 'sanction'];

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-white/5">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100 font-medium tabular-nums">{value}</span>
    </div>
  );
}

function TaxRateControl({ playerCountryId }: { playerCountryId: CountryId }) {
  const taxRate = useGameStore((s) => s.world.countries[playerCountryId].taxRate);
  const setTaxRate = useGameStore((s) => s.setTaxRate);

  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-white/5">
      <span className="text-gray-400">Tax Rate</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTaxRate(taxRate - 0.01)}
          className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
        >
          −
        </button>
        <span className="text-gray-100 font-medium tabular-nums w-10 text-center">
          {Math.round(taxRate * 100)}%
        </span>
        <button
          onClick={() => setTaxRate(taxRate + 0.01)}
          className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
        >
          +
        </button>
      </div>
    </div>
  );
}

function DiplomacyControls({ playerCountryId }: { playerCountryId: CountryId }) {
  const world = useGameStore((s) => s.world);
  const toggleTreaty = useGameStore((s) => s.toggleTreaty);

  const others = Object.values(world.countries)
    .filter((c) => c.id !== playerCountryId)
    .map((c) => {
      const relation = getCountryRelations(world, playerCountryId).find(
        (r) => getOtherParty(r, playerCountryId) === c.id,
      );
      return { country: c, score: relation?.score ?? 0, treaties: relation?.treaties ?? [] };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Diplomacy</h3>
      <div className="space-y-2">
        {others.map(({ country, score, treaties }) => (
          <div key={country.id} className="text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">{country.name}</span>
              <span className={score >= 0 ? 'text-emerald-400' : 'text-red-400'}>{Math.round(score)}</span>
            </div>
            <div className="flex gap-1 mt-1">
              {TREATY_ORDER.map((treaty) => {
                const active = treaties.includes(treaty);
                return (
                  <button
                    key={treaty}
                    onClick={() => toggleTreaty(country.id, treaty, !active)}
                    className={`px-1.5 py-0.5 rounded text-[10px] border ${
                      active
                        ? 'bg-[#3987e5] border-[#3987e5] text-white'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'
                    }`}
                  >
                    {TREATY_LABEL[treaty]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountryDashboard() {
  const world = useGameStore((s) => s.world);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);
  const playerCountryId = useGameStore((s) => s.playerCountryId);

  if (!selectedCountryId) {
    return (
      <div className="rounded-lg bg-[#181a21] p-4 text-sm text-gray-500">
        Click a country on the map to inspect it.
      </div>
    );
  }

  const country = world.countries[selectedCountryId];
  if (!country) return null;

  const isPlayerCountry = selectedCountryId === playerCountryId;

  const relations = getCountryRelations(world, country.id)
    .map((r) => ({ relation: r, otherId: getOtherParty(r, country.id) }))
    .sort((a, b) => b.relation.score - a.relation.score);

  return (
    <div className="rounded-lg bg-[#181a21] p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-100">{country.name}</h2>
          {isPlayerCountry && (
            <span className="text-[10px] uppercase tracking-wide bg-[#3987e5]/20 text-[#3987e5] px-1.5 py-0.5 rounded">
              Your Nation
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {GOVERNMENT_LABEL[country.government.type]} · {country.government.leaderName} ·{' '}
          <span className="capitalize">{country.ideology}</span>
        </p>
      </div>

      <div>
        <StatRow label="GDP" value={Math.round(country.gdp).toLocaleString()} />
        <StatRow label="GDP Growth" value={`${(country.gdpGrowth * 100).toFixed(1)}%`} />
        <StatRow label="Debt" value={Math.round(country.debt).toLocaleString()} />
        {isPlayerCountry ? (
          <TaxRateControl playerCountryId={country.id} />
        ) : (
          <StatRow label="Tax Rate" value={`${Math.round(country.taxRate * 100)}%`} />
        )}
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

      {isPlayerCountry ? (
        <DiplomacyControls playerCountryId={country.id} />
      ) : (
        relations.length > 0 && (
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
        )
      )}
    </div>
  );
}
