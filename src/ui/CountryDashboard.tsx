import { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { findWarBetween, getCountryRelations, getOtherParty } from '../engine/core/queries';
import { clamp, type Country, type CountryId, type SpyMission, type TreatyType } from '../engine/core/types';
import { TECH_REGISTRY } from '../engine/research/techs';
import { BILL_REGISTRY, LEGISLATURE_CONFIGS } from '../engine/legislature/bills';

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

const ESPIONAGE_MISSIONS: { id: SpyMission; label: string }[] = [
  { id: 'destabilize', label: 'Destabilize' },
  { id: 'sabotage', label: 'Sabotage' },
  { id: 'steal_tech', label: 'Steal Tech' },
];

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
  const declareWar = useGameStore((s) => s.declareWar);
  const suePeace = useGameStore((s) => s.suePeace);
  const orderEspionage = useGameStore((s) => s.orderEspionage);

  const others = Object.values(world.countries)
    .filter((c) => c.id !== playerCountryId)
    .map((c) => {
      const relation = getCountryRelations(world, playerCountryId).find(
        (r) => getOtherParty(r, playerCountryId) === c.id,
      );
      const atWar = findWarBetween(world, playerCountryId, c.id) !== undefined;
      return { country: c, score: relation?.score ?? 0, treaties: relation?.treaties ?? [], atWar };
    })
    .sort((a, b) => Number(b.atWar) - Number(a.atWar) || b.score - a.score);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Diplomacy</h3>
      <div className="space-y-2">
        {others.map(({ country, score, treaties, atWar }) => (
          <div key={country.id} className="text-xs">
            <div className="flex justify-between">
              <span className={atWar ? 'text-red-300 font-medium' : 'text-gray-300'}>
                {country.name} {atWar && <span className="text-[10px]">(at war)</span>}
              </span>
              <span className={score >= 0 ? 'text-emerald-400' : 'text-red-400'}>{Math.round(score)}</span>
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {TREATY_ORDER.map((treaty) => {
                const active = treaties.includes(treaty);
                return (
                  <button
                    key={treaty}
                    disabled={atWar}
                    onClick={() => toggleTreaty(country.id, treaty, !active)}
                    className={`px-1.5 py-0.5 rounded text-[10px] border disabled:opacity-30 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-[#3987e5] border-[#3987e5] text-white'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30'
                    }`}
                  >
                    {TREATY_LABEL[treaty]}
                  </button>
                );
              })}
              {atWar ? (
                <button
                  onClick={() => suePeace()}
                  className="px-1.5 py-0.5 rounded text-[10px] border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                >
                  Sue for Peace
                </button>
              ) : (
                <button
                  onClick={() => declareWar(country.id)}
                  className="px-1.5 py-0.5 rounded text-[10px] border border-red-500/40 text-red-400 hover:bg-red-500/10"
                >
                  Declare War
                </button>
              )}
            </div>
            {!atWar && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {ESPIONAGE_MISSIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => orderEspionage(country.id, id)}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-[#9085e9]/40 text-[#9085e9] hover:bg-[#9085e9]/10"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchControls({ playerCountryId }: { playerCountryId: CountryId }) {
  const world = useGameStore((s) => s.world);
  const setResearchFocus = useGameStore((s) => s.setResearchFocus);
  const country = world.countries[playerCountryId];

  const current = country.currentResearchId ? TECH_REGISTRY[country.currentResearchId] : null;
  const progress = current ? clamp(country.researchPoints / current.cost, 0, 1) : 0;

  const available = world.availableTechIds
    .map((id) => TECH_REGISTRY[id])
    .filter(
      (tech) =>
        !country.unlockedTechIds.includes(tech.id) &&
        (!tech.prerequisiteId || country.unlockedTechIds.includes(tech.prerequisiteId)),
    );

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Research</h3>
      {current ? (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300">
            <span>{current.name}</span>
            <span className="tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
            <div className="h-full bg-[#199e70]" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 mb-2">No active research — choose a focus below.</p>
      )}
      <div className="space-y-1">
        {available.map((tech) => (
          <button
            key={tech.id}
            onClick={() => setResearchFocus(tech.id)}
            disabled={tech.id === country.currentResearchId}
            className={`w-full text-left px-2 py-1.5 rounded text-xs border ${
              tech.id === country.currentResearchId
                ? 'bg-[#199e70]/15 border-[#199e70]/50 text-gray-200'
                : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/30'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{tech.name}</span>
              <span className="tabular-nums text-gray-500">{tech.cost} RP</span>
            </div>
            <div className="text-gray-600">{tech.description}</div>
          </button>
        ))}
        {available.length === 0 && (
          <p className="text-xs text-gray-600">All available technologies researched.</p>
        )}
      </div>
    </div>
  );
}

function TechnologySummary({ country }: { country: Country }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Technology</h3>
      <p className="text-xs text-gray-400">
        {country.unlockedTechIds.length > 0
          ? country.unlockedTechIds.map((id) => TECH_REGISTRY[id]?.name ?? id).join(', ')
          : 'No technologies researched yet.'}
      </p>
    </div>
  );
}

function LegislatureControls({ playerCountryId }: { playerCountryId: CountryId }) {
  const world = useGameStore((s) => s.world);
  const castVote = useGameStore((s) => s.castVote);
  const country = world.countries[playerCountryId];
  const config = LEGISLATURE_CONFIGS[playerCountryId];
  if (!config) return null;

  const pendingBill = country.pendingBillId ? BILL_REGISTRY[country.pendingBillId] : null;

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1 capitalize">{config.name}</h3>
      {pendingBill ? (
        <div className="text-xs">
          <div className="text-gray-200 font-medium">{pendingBill.name}</div>
          <p className="text-gray-500 mt-0.5 mb-2">{pendingBill.description}</p>
          {country.billStance ? (
            <p className="text-gray-400">
              You've declared a stance to <span className="capitalize text-gray-200">{country.billStance}</span> this
              bill — resolution next turn.
            </p>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => castVote('support')}
                className="px-2 py-1 rounded text-[10px] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                Support
              </button>
              <button
                onClick={() => castVote('oppose')}
                className="px-2 py-1 rounded text-[10px] border border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Oppose
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-600 capitalize">{config.name} is not currently in session.</p>
      )}
    </div>
  );
}

function LegislatureSummary({ country }: { country: Country }) {
  const config = LEGISLATURE_CONFIGS[country.id];
  if (!config) return null;
  const bill = country.pendingBillId ? BILL_REGISTRY[country.pendingBillId] : null;
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1 capitalize">{config.name}</h3>
      <p className="text-xs text-gray-400 capitalize">
        {bill ? `Currently debating: ${bill.name}` : `${config.name} is not currently in session.`}
      </p>
    </div>
  );
}

function NationList() {
  const world = useGameStore((s) => s.world);
  const playerCountryId = useGameStore((s) => s.playerCountryId);
  const selectCountry = useGameStore((s) => s.selectCountry);

  const countries = Object.values(world.countries).sort((a, b) => b.gdp - a.gdp);

  return (
    <div className="rounded-lg bg-[#181a21] p-4">
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
        Nations — click the map or a name to inspect
      </h3>
      <div className="grid grid-cols-2 gap-1">
        {countries.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCountry(c.id)}
            className="text-left text-xs px-2 py-1 rounded hover:bg-white/5 text-gray-300"
          >
            {c.id === playerCountryId && <span className="text-[#3987e5]">★ </span>}
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

type DashboardTab = 'overview' | 'research' | 'legislature' | 'diplomacy';

function RelationsList({ country }: { country: Country }) {
  const world = useGameStore((s) => s.world);
  const relations = getCountryRelations(world, country.id)
    .map((r) => ({ relation: r, otherId: getOtherParty(r, country.id) }))
    .sort((a, b) => b.relation.score - a.relation.score);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-1">Relations</h3>
      {relations.length === 0 ? (
        <p className="text-xs text-gray-600">No notable relations recorded yet.</p>
      ) : (
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
      )}
    </div>
  );
}

export function CountryDashboard() {
  const world = useGameStore((s) => s.world);
  const selectedCountryId = useGameStore((s) => s.selectedCountryId);
  const playerCountryId = useGameStore((s) => s.playerCountryId);
  const [tab, setTab] = useState<DashboardTab>('overview');

  if (!selectedCountryId) {
    return <NationList />;
  }

  const country = world.countries[selectedCountryId];
  if (!country) return null;

  const isPlayerCountry = selectedCountryId === playerCountryId;
  const hasLegislature = Boolean(LEGISLATURE_CONFIGS[country.id]);

  const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'research', label: 'Research' },
    ...(hasLegislature ? [{ id: 'legislature' as const, label: 'Legislature' }] : []),
    { id: 'diplomacy', label: 'Diplomacy' },
  ];
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'overview';

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

      <div className="flex gap-1 bg-black/30 rounded-md p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1 text-xs rounded ${
              activeTab === t.id ? 'bg-[#3987e5] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
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
                      {p.name}{' '}
                      <span className="text-gray-600 capitalize">({p.primaryIndustry.replace('_', ' ')})</span>
                    </span>
                    <span className="tabular-nums">{Math.round(p.economicOutput)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'research' &&
        (isPlayerCountry ? <ResearchControls playerCountryId={country.id} /> : <TechnologySummary country={country} />)}

      {activeTab === 'legislature' &&
        hasLegislature &&
        (isPlayerCountry ? (
          <LegislatureControls playerCountryId={country.id} />
        ) : (
          <LegislatureSummary country={country} />
        ))}

      {activeTab === 'diplomacy' &&
        (isPlayerCountry ? <DiplomacyControls playerCountryId={country.id} /> : <RelationsList country={country} />)}
    </div>
  );
}
