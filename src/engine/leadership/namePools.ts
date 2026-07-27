import type { CountryId, GovernmentType, Rng } from '../core/types';

interface NamePool {
  monarchFirstNames: readonly string[];
  electedFirstNames: readonly string[];
  lastNames: readonly string[];
  electedTitle: string;
}

function pick<T>(options: readonly T[], rng: Rng): T {
  return options[rng.int(0, options.length - 1)];
}

/**
 * Regional/cultural name pools for generated leaders. Not meant to be
 * linguistically exhaustive — a handful of plausible first/last names per
 * pool, combined the same way flavor text is (independent slots multiply a
 * small bank into real variety), so a long game doesn't keep the scenario's
 * original founding leader in office for centuries.
 */
const POOLS: Record<string, NamePool> = {
  greek: {
    monarchFirstNames: ['Alexander', 'Philip', 'Demetrius', 'Cleon', 'Nicias', 'Theron'],
    electedFirstNames: ['Alexios', 'Nikolaos', 'Ioannis', 'Dimitrios', 'Eleni', 'Kalliope'],
    lastNames: ['Komnenos', 'Doukas', 'Palaiologos', 'Angelos', 'Kantakouzenos'],
    electedTitle: 'Strategos',
  },
  persian: {
    monarchFirstNames: ['Darius', 'Xerxes', 'Cyrus', 'Nasser', 'Reza', 'Kavus'],
    electedFirstNames: ['Farrokh', 'Soraya', 'Kaveh', 'Roxana', 'Bahram'],
    lastNames: ['Pahlavi', 'Afshar', 'Zand', 'Qajari'],
    electedTitle: 'Vizier',
  },
  south_asian: {
    monarchFirstNames: ['Chandra', 'Ashoka', 'Bindusara', 'Suryavarman', 'Jayavarman', 'Indravarman'],
    electedFirstNames: ['Rajendra', 'Priya', 'Anand', 'Kavita', 'Devendra'],
    lastNames: ['Gupta', 'Sharma', 'Rao', 'Varma', 'Chatterjee'],
    electedTitle: 'Minister',
  },
  east_asian: {
    monarchFirstNames: ['Wu', 'Jing', 'Xuan', 'Zhao', 'Min', 'Cheng'],
    electedFirstNames: ['Wei', 'Fang', 'Jian', 'Li', 'Hui'],
    lastNames: ['Zhang', 'Wang', 'Chen', 'Liu', 'Yang'],
    electedTitle: 'Premier',
  },
  japanese: {
    monarchFirstNames: ['Tsunayoshi', 'Ienari', 'Yoshimune', 'Ietsuna', 'Yoshimasa'],
    electedFirstNames: ['Hiroshi', 'Kenji', 'Yumiko', 'Takeshi', 'Akiko'],
    lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito'],
    electedTitle: 'Prime Minister',
  },
  mongol: {
    monarchFirstNames: ['Ogedei', 'Guyuk', 'Mongke', 'Kublai', 'Chagatai', 'Jochi'],
    electedFirstNames: ['Batu', 'Subotai', 'Temuge', 'Sorkhokhtani'],
    lastNames: ['Borjigin', 'Khiyad'],
    electedTitle: 'Noyan',
  },
  french: {
    monarchFirstNames: ['Louis', 'Charles', 'Henri', 'Philippe', 'Francois'],
    electedFirstNames: ['Jean', 'Marie', 'Pierre', 'Camille', 'Antoine'],
    lastNames: ['Moreau', 'Girard', 'Lefevre', 'Rousseau', 'Aubert'],
    electedTitle: 'President',
  },
  anglo: {
    monarchFirstNames: ['George', 'Edward', 'William', 'Henry', 'Charles', 'Victoria'],
    electedFirstNames: ['James', 'Robert', 'Margaret', 'Thomas', 'Susan', 'Harold'],
    lastNames: ['Whitfield', 'Harrington', 'Bennett', 'Marshall', 'Coleman'],
    electedTitle: 'President',
  },
  germanic: {
    monarchFirstNames: ['Friedrich', 'Wilhelm', 'Otto', 'Ludwig', 'Maximilian'],
    electedFirstNames: ['Klaus', 'Ingrid', 'Heinrich', 'Ursula', 'Dieter'],
    lastNames: ['Muller', 'Schmidt', 'Weber', 'Fischer', 'Hoffmann'],
    electedTitle: 'Chancellor',
  },
  iberian: {
    monarchFirstNames: ['Alfonso', 'Fernando', 'Carlos', 'Joao', 'Sebastiao'],
    electedFirstNames: ['Miguel', 'Isabel', 'Rafael', 'Catarina', 'Diego'],
    lastNames: ['Fernandez', 'Silva', 'Costa', 'Vega', 'Morales'],
    electedTitle: 'President',
  },
  low_countries: {
    monarchFirstNames: ['Willem', 'Leopold', 'Filip', 'Alexander'],
    electedFirstNames: ['Hendrik', 'Anke', 'Pieter', 'Marijke'],
    lastNames: ['de Vries', 'Jansen', 'Peeters', 'Willems'],
    electedTitle: 'Minister-President',
  },
  nordic: {
    monarchFirstNames: ['Christian', 'Gustav', 'Haakon', 'Oscar', 'Frederik'],
    electedFirstNames: ['Erik', 'Astrid', 'Lars', 'Ingrid', 'Sven'],
    lastNames: ['Andersen', 'Nilsson', 'Larsen', 'Bergstrom'],
    electedTitle: 'Prime Minister',
  },
  african: {
    monarchFirstNames: ['Kwame', 'Amara', 'Tafari', 'Idris', 'Sekou'],
    electedFirstNames: ['Chinua', 'Ama', 'Kofi', 'Adaeze', 'Femi'],
    lastNames: ['Diallo', 'Okafor', 'Mensah', 'Toure', 'Osei'],
    electedTitle: 'President',
  },
  italian: {
    monarchFirstNames: ['Vittorio', 'Umberto', 'Alfonso', 'Ferdinando'],
    electedFirstNames: ['Giuseppe', 'Francesca', 'Marco', 'Lucia', 'Alessandro'],
    lastNames: ['Romano', 'Bruno', 'Ferrari', 'Colombo', 'Marino'],
    electedTitle: 'Prime Minister',
  },
  latin_american: {
    monarchFirstNames: ['Pedro', 'Agustin', 'Maximiliano'],
    electedFirstNames: ['Carlos', 'Rosa', 'Fidel', 'Esteban', 'Lucia'],
    lastNames: ['Hernandez', 'Castillo', 'Ortega', 'Reyes', 'Cruz'],
    electedTitle: 'President',
  },
  slavic: {
    monarchFirstNames: ['Nicholas', 'Alexander', 'Peter', 'Ivan', 'Paul'],
    electedFirstNames: ['Mikhail', 'Irina', 'Dmitri', 'Svetlana', 'Yuri'],
    lastNames: ['Volkov', 'Petrov', 'Ivanov', 'Sokolov', 'Popov'],
    electedTitle: 'General Secretary',
  },
  ottoman: {
    monarchFirstNames: ['Mehmed', 'Suleiman', 'Selim', 'Abdulhamid', 'Murad'],
    electedFirstNames: ['Kemal', 'Nur', 'Ahmet', 'Leyla', 'Osman'],
    lastNames: ['Yildiz', 'Kaya', 'Demir', 'Aydin'],
    electedTitle: 'Grand Vizier',
  },
};

/** Every non-institutional CountryId across every scenario maps to a cultural name pool. */
export const COUNTRY_NAME_POOL: Record<CountryId, string> = {
  // 431 BCE
  ATH: 'greek',
  SPA: 'greek',
  MAC: 'greek',
  THR: 'greek',
  PER: 'persian',
  MAG: 'south_asian',
  // 1200 CE
  MON: 'mongol',
  SNG: 'east_asian',
  JIN: 'east_asian',
  BYZ: 'greek',
  KHR: 'persian',
  DEL: 'south_asian',
  FRA: 'french',
  ENG: 'anglo',
  HRE: 'germanic',
  EGY: 'african',
  VEN: 'italian',
  KHM: 'south_asian',
  JPN: 'japanese',
  // 1836 additions
  USA: 'anglo',
  GBR: 'anglo',
  RUS: 'slavic',
  PRU: 'germanic',
  AUT: 'germanic',
  OTT: 'ottoman',
  ESP: 'iberian',
  PRT: 'iberian',
  NLD: 'low_countries',
  BEL: 'low_countries',
  DNK: 'nordic',
  SWE: 'nordic',
  GRC: 'greek',
  MEX: 'latin_american',
  CHN: 'east_asian',
  BRA: 'latin_american',
  SIC: 'italian',
  MAR: 'african',
  // 1914 additions
  GER: 'germanic',
  AUH: 'germanic',
  ITA: 'italian',
  SRB: 'slavic',
  // 1962 additions
  USR: 'slavic',
  FRG: 'germanic',
  GDR: 'germanic',
  CUB: 'latin_american',
  IND: 'south_asian',
};

const MONARCHY_TYPES: readonly GovernmentType[] = ['absolute_monarchy', 'constitutional_monarchy', 'empire'];
const REGNAL_NUMERALS = ['II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

const INSTITUTIONAL_ADJECTIVES = ['Reform', 'Unity', 'Continuity', 'Provisional', 'New', 'National'] as const;
const INSTITUTIONAL_BODIES = ['Council', 'Commission', 'Administration', 'Assembly', 'Secretariat', 'Presidium'] as const;

/**
 * Generates a new leader name/title on turnover. `isInstitutional` countries
 * (a named collective body, not a person — see WorldState doc comment) get
 * a fresh institutional title; everyone else gets a person's name styled to
 * their government type — a hereditary-sounding "{name} {numeral}" for
 * monarchies, an elected "{title} {first} {last}" otherwise.
 */
export function generateLeaderName(
  countryId: CountryId,
  government: GovernmentType,
  isInstitutional: boolean,
  rng: Rng,
): string {
  if (isInstitutional) {
    return `The ${pick(INSTITUTIONAL_ADJECTIVES, rng)} ${pick(INSTITUTIONAL_BODIES, rng)}`;
  }

  const pool = POOLS[COUNTRY_NAME_POOL[countryId] ?? 'anglo'];

  if (MONARCHY_TYPES.includes(government)) {
    return `${pick(pool.monarchFirstNames, rng)} ${pick(REGNAL_NUMERALS, rng)}`;
  }

  return `${pool.electedTitle} ${pick(pool.electedFirstNames, rng)} ${pick(pool.lastNames, rng)}`;
}
