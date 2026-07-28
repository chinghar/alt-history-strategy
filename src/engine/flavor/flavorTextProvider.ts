import type { Rng, SpyMission, TreatyType } from '../core/types';

/**
 * Turns a bare statistical delta or structural event into a newspaper-style
 * line. Template-based today, via combinatorial phrase slots rather than one
 * fixed string per event — the interface is still the seam for swapping in a
 * real LLM call later without touching any engine that consumes it, but the
 * near-term investment is in local variety instead: independently-varying
 * clauses combined at call time multiply a small phrase bank into many more
 * distinct sentences than picking one full template ever could, and several
 * methods branch on context (which spy mission succeeded, which reform path
 * a government took) so the text actually reflects what happened rather than
 * a generic catch-all line.
 */
export interface FlavorTextProvider {
  boomHeadline(countryName: string, rng: Rng): string;
  recessionHeadline(countryName: string, rng: Rng): string;
  unrestHeadline(countryName: string, rng: Rng): string;

  allianceFormed(a: string, b: string, rng: Rng): string;
  sanctionImposed(a: string, b: string, rng: Rng): string;
  diplomaticIncident(a: string, b: string, rng: Rng): string;
  treatyFormed(a: string, b: string, treaty: TreatyType, rng: Rng): string;
  treatyRevoked(a: string, b: string, treaty: TreatyType, rng: Rng): string;

  warDeclared(attacker: string, defender: string, rng: Rng): string;
  warCapitulation(winner: string, losers: string[], rng: Rng): string;
  territoryAnnexed(winner: string, loser: string, provinceName: string, rng: Rng): string;
  peaceSued(country: string, rng: Rng): string;

  governmentCrisis(country: string, rng: Rng): string;
  regimeChangeReform(country: string, rng: Rng): string;
  regimeChangeRevolution(country: string, rng: Rng): string;
  regimeChangeFracture(country: string, rng: Rng): string;
  regimeChangeReshuffle(country: string, rng: Rng): string;

  espionageOrdered(agent: string, target: string, rng: Rng): string;
  espionageExposed(agent: string, target: string, rng: Rng): string;
  espionageSuccess(target: string, mission: SpyMission, rng: Rng): string;

  billConvened(legislatureName: string, billName: string, rng: Rng): string;
  billPassed(legislatureName: string, billName: string, rng: Rng): string;
  billRejected(legislatureName: string, billName: string, rng: Rng): string;
  billStanceSet(country: string, stance: 'support' | 'oppose', rng: Rng): string;

  techUnlocked(country: string, techName: string, rng: Rng): string;

  resourceDiscovery(country: string, provinceName: string, rng: Rng): string;
  naturalDisaster(country: string, provinceName: string, rng: Rng): string;
  culturalFlourishing(country: string, rng: Rng): string;
  epidemic(country: string, rng: Rng): string;

  leaderElected(country: string, leaderName: string, rng: Rng): string;
  leaderSucceeds(country: string, leaderName: string, rng: Rng): string;

  focusCompleted(country: string, focusName: string, rng: Rng): string;
}

function pick<T>(options: readonly T[], rng: Rng): T {
  return options[rng.int(0, options.length - 1)];
}

/**
 * Builds one sentence from independently-varying slots. Each slot is drawn
 * separately, so N slots of M options each yield M^N distinct sentences from
 * only M*N lines of prose — e.g. 4 openers x 4 closers below covers 16
 * headlines for a routine economic swing from 8 lines of text.
 */
function combine(rng: Rng, ...slots: readonly (readonly string[])[]): string {
  return slots.map((options) => pick(options, rng)).join(' ');
}

function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const TREATY_LABEL: Record<TreatyType, string> = {
  alliance: 'an alliance',
  trade_agreement: 'a trade agreement',
  non_aggression: 'a non-aggression pact',
  sanction: 'sanctions',
};

export const templateFlavorTextProvider: FlavorTextProvider = {
  boomHeadline(countryName, rng) {
    return combine(
      rng,
      [
        `${countryName}'s economy roars ahead`,
        `Trade and output surge across ${countryName}`,
        `${countryName} posts its strongest growth in years`,
        `Prosperity spreads through ${countryName}`,
      ],
      [
        'as merchants and producers report a banner year.',
        'with coffers swelling on the back of brisk trade.',
        'confounding forecasts of a slower year ahead.',
        'buoyed by rising output across every sector.',
      ],
    );
  },

  recessionHeadline(countryName, rng) {
    return combine(
      rng,
      [
        `${countryName}'s economy contracts sharply`,
        `Hard times descend on ${countryName}`,
        `${countryName} slides toward recession`,
        `Output falters across ${countryName}`,
      ],
      [
        'rattling markets and merchants alike.',
        'as output falls and coffers thin.',
        'with little relief in sight.',
        'as confidence in the economy erodes.',
      ],
    );
  },

  unrestHeadline(countryName, rng) {
    return combine(
      rng,
      [
        `Public confidence in ${countryName}'s government collapses`,
        `Discontent spreads across ${countryName}`,
        `${countryName}'s leadership faces a sharp loss of popular support`,
        `Grumbling turns to open anger across ${countryName}`,
      ],
      [
        'as ordinary people grow restless.',
        'amid worsening conditions.',
        'and calls for change grow louder.',
        'that officials struggle to contain.',
      ],
    );
  },

  allianceFormed(a, b, rng) {
    return combine(
      rng,
      [
        `${a} and ${b} formalize an alliance`,
        `${a} and ${b} sign a pact of mutual defense`,
        `Diplomats from ${a} and ${b} announce a new alliance`,
      ],
      [
        'after years of warming relations.',
        "binding each to the other's defense.",
        'in a move that reshapes the regional balance of power.',
      ],
    );
  },

  sanctionImposed(a, b, rng) {
    return pick(
      [
        `${a} imposes sanctions on ${b}, citing deteriorating relations.`,
        `${a} cuts economic ties with ${b} amid rising hostility.`,
        `${a} moves to isolate ${b} economically as tensions boil over.`,
      ],
      rng,
    );
  },

  diplomaticIncident(a, b, rng) {
    return pick(
      [
        `A diplomatic incident strains relations between ${a} and ${b}.`,
        `An undiplomatic exchange between envoys sours relations between ${a} and ${b}.`,
        `${a} and ${b} trade accusations after a diplomatic incident.`,
      ],
      rng,
    );
  },

  treatyFormed(a, b, treaty, rng) {
    if (treaty === 'sanction') {
      return pick([`${a} imposes sanctions on ${b}.`, `${a} moves to cut economic ties with ${b}.`], rng);
    }
    return pick(
      [
        `${a} forms ${TREATY_LABEL[treaty]} with ${b}.`,
        `${a} and ${b} agree to ${TREATY_LABEL[treaty]}.`,
        `Negotiators finalize ${TREATY_LABEL[treaty]} between ${a} and ${b}.`,
      ],
      rng,
    );
  },

  treatyRevoked(a, b, treaty, rng) {
    if (treaty === 'sanction') {
      return pick([`${a} lifts sanctions on ${b}.`, `${a} restores economic ties with ${b}.`], rng);
    }
    return pick(
      [
        `${a} withdraws from ${TREATY_LABEL[treaty]} with ${b}.`,
        `${a} and ${b}'s ${TREATY_LABEL[treaty]} collapses.`,
        `${a} formally ends ${TREATY_LABEL[treaty]} with ${b}.`,
      ],
      rng,
    );
  },

  warDeclared(attacker, defender, rng) {
    return combine(
      rng,
      [
        `${attacker} declares war on ${defender}`,
        `${attacker} mobilizes and declares war on ${defender}`,
        `War breaks out as ${attacker} declares against ${defender}`,
      ],
      [
        'after months of rising tension.',
        'ending years of uneasy peace.',
        'and both sides begin mobilizing forces.',
        'in a move that stuns observers.',
      ],
    );
  },

  warCapitulation(winner, losers, rng) {
    const loserList = listNames(losers);
    return pick(
      [
        `${winner} forces the capitulation of ${loserList}, ending the war.`,
        `${loserList} sue for terms as ${winner} presses its advantage, ending the war.`,
        `${winner} claims victory as ${loserList} capitulate and the war ends.`,
      ],
      rng,
    );
  },

  territoryAnnexed(winner, loser, provinceName, rng) {
    return pick(
      [
        `${winner} annexes ${provinceName} from ${loser} in the peace settlement.`,
        `Under the peace terms, ${loser} cedes ${provinceName} to ${winner}.`,
        `${provinceName} passes to ${winner} as part of ${loser}'s surrender terms.`,
      ],
      rng,
    );
  },

  peaceSued(country, rng) {
    return pick(
      [
        `${country} sues for peace, ending the war.`,
        `${country} seeks terms to bring the war to a close.`,
        `Exhausted by the fighting, ${country} sues for peace.`,
      ],
      rng,
    );
  },

  governmentCrisis(country, rng) {
    return pick(
      [
        `${country}'s government teeters on the edge of collapse as stability craters.`,
        `Confidence in ${country}'s leadership evaporates as the government's grip weakens.`,
        `${country} is gripped by political crisis as the government loses control.`,
      ],
      rng,
    );
  },

  regimeChangeReform(country, rng) {
    return pick(
      [
        `${country}'s government concedes sweeping reforms to survive the crisis.`,
        `Facing collapse, ${country}'s rulers grant a new constitution rather than fall.`,
        `${country}'s crown yields to pressure, enacting reform to hold onto power.`,
      ],
      rng,
    );
  },

  regimeChangeRevolution(country, rng) {
    return pick(
      [
        `Revolution sweeps ${country} — the old regime is overthrown.`,
        `${country}'s government falls as revolution takes hold.`,
        `Crowds topple the old order in ${country} in a sudden revolution.`,
      ],
      rng,
    );
  },

  regimeChangeFracture(country, rng) {
    return pick(
      [
        `${country} fractures as constituent provinces break from the central government.`,
        `Central authority in ${country} disintegrates as regions go their own way.`,
        `${country} splinters into a loose confederation as the center fails to hold.`,
      ],
      rng,
    );
  },

  regimeChangeReshuffle(country, rng) {
    return pick(
      [
        `A new government takes power in ${country} after the old one collapses.`,
        `${country} installs a new government in the wake of the old regime's fall.`,
        `Power changes hands in ${country} as a new government forms from the wreckage.`,
      ],
      rng,
    );
  },

  espionageOrdered(agent, target, rng) {
    return pick(
      [
        `${agent} dispatches agents toward ${target}. The outcome will become clear next turn.`,
        `${agent} quietly authorizes an operation against ${target}. Results are expected next turn.`,
        `Agents loyal to ${agent} slip toward ${target} on a covert assignment.`,
      ],
      rng,
    );
  },

  espionageExposed(agent, target, rng) {
    return pick(
      [
        `${agent}'s espionage against ${target} is exposed, causing outrage.`,
        `${target}'s counterintelligence uncovers ${agent}'s operation, sparking a diplomatic row.`,
        `An operation run by ${agent} against ${target} unravels in public view.`,
      ],
      rng,
    );
  },

  espionageSuccess(target, mission, rng) {
    if (mission === 'destabilize') {
      return pick(
        [
          `Unrest flares in ${target} amid unconfirmed reports of foreign meddling.`,
          `Whispers of unrest spread through ${target}, fueled by agitators of unclear origin.`,
          `${target}'s government faces fresh unrest, its cause conveniently untraceable.`,
        ],
        rng,
      );
    }
    if (mission === 'sabotage') {
      return pick(
        [
          `An unexplained disruption hits production in ${target}.`,
          `A string of accidents idles output somewhere in ${target}.`,
          `${target}'s producers report mysterious losses no one can quite explain.`,
        ],
        rng,
      );
    }
    return pick(
      [
        `Sensitive knowledge from ${target} surfaces abroad under mysterious circumstances.`,
        `${target}'s researchers report papers gone missing from a secure archive.`,
        `Technical secrets long guarded in ${target} turn up in a rival's hands.`,
      ],
      rng,
    );
  },

  billConvened(legislatureName, billName, rng) {
    return pick(
      [
        `${legislatureName} convenes to debate the ${billName}.`,
        `${legislatureName} takes up the ${billName} for debate.`,
        `Debate opens in ${legislatureName} over the ${billName}.`,
      ],
      rng,
    );
  },

  billPassed(legislatureName, billName, rng) {
    return pick(
      [
        `${legislatureName} passes the ${billName}.`,
        `After heated debate, ${legislatureName} approves the ${billName}.`,
        `${legislatureName} votes through the ${billName}.`,
      ],
      rng,
    );
  },

  billRejected(legislatureName, billName, rng) {
    return pick(
      [
        `${legislatureName} rejects the ${billName}.`,
        `${legislatureName} votes down the ${billName}.`,
        `The ${billName} fails to win a majority in ${legislatureName}.`,
      ],
      rng,
    );
  },

  billStanceSet(country, stance, rng) {
    return pick(
      [
        `${country} declares a stance to ${stance} the pending bill.`,
        `${country}'s delegation signals it will ${stance} the pending bill.`,
      ],
      rng,
    );
  },

  techUnlocked(country, techName, rng) {
    return pick(
      [
        `${country} completes research into ${techName}.`,
        `${country}'s researchers unveil breakthroughs in ${techName}.`,
        `${country} announces the completion of ${techName}.`,
      ],
      rng,
    );
  },

  resourceDiscovery(country, provinceName, rng) {
    return pick(
      [
        `A valuable resource discovery in ${provinceName} spurs a local boom for ${country}.`,
        `Prospectors strike it rich in ${provinceName}, boosting ${country}'s fortunes.`,
        `${country} celebrates a windfall discovery of resources in ${provinceName}.`,
      ],
      rng,
    );
  },

  naturalDisaster(country, provinceName, rng) {
    return pick(
      [
        `A natural disaster strikes ${provinceName}, disrupting ${country}'s economy.`,
        `${provinceName} reels from a natural disaster that ripples through ${country}'s economy.`,
        `Disaster strikes ${provinceName}, and ${country} scrambles to respond.`,
      ],
      rng,
    );
  },

  culturalFlourishing(country, rng) {
    return pick(
      [
        `A wave of cultural achievement lifts national pride in ${country}.`,
        `${country} basks in a flourishing of arts and letters.`,
        `A golden moment for ${country}'s culture lifts spirits nationwide.`,
      ],
      rng,
    );
  },

  epidemic(country, rng) {
    return pick(
      [
        `An epidemic sweeps through ${country}, straining public order and finances.`,
        `Disease spreads across ${country}, taxing both the treasury and public patience.`,
        `${country} battles an outbreak that strains order and public finances alike.`,
      ],
      rng,
    );
  },

  leaderElected(country, leaderName, rng) {
    return pick(
      [
        `${leaderName} is elected to lead ${country} on a fresh mandate.`,
        `${country} installs ${leaderName} after a decisive election.`,
        `Voters hand power to ${leaderName} in ${country}'s latest election.`,
      ],
      rng,
    );
  },

  leaderSucceeds(country, leaderName, rng) {
    return pick(
      [
        `${leaderName} succeeds to power in ${country}.`,
        `${country} passes to new leadership under ${leaderName}.`,
        `${leaderName} assumes the throne of ${country}.`,
      ],
      rng,
    );
  },

  focusCompleted(country, focusName, rng) {
    return pick(
      [
        `${country} completes the national focus: ${focusName}.`,
        `${country} brings ${focusName} to fruition.`,
        `Years of planning culminate as ${country} completes ${focusName}.`,
      ],
      rng,
    );
  },
};
