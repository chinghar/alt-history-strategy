import type { HistoricalOutcomeTracker } from '../../core/types';
import { germanUnificationTracker } from './germanUnification';
import { americanCivilWarTracker } from './americanCivilWar';
import { ottomanDeclineTracker } from './ottomanDecline';
import { spartanVictoryTracker } from './spartanVictory';
import { macedonianHegemonyTracker } from './macedonianHegemony';
import { carthaginianDominanceTracker } from './carthaginianDominance';
import { opiumWarTracker } from './opiumWar';
import { romanAscendancyTracker } from './romanAscendancy';

export const defaultOutcomeTrackers: HistoricalOutcomeTracker[] = [
  germanUnificationTracker,
  americanCivilWarTracker,
  ottomanDeclineTracker,
  spartanVictoryTracker,
  macedonianHegemonyTracker,
  carthaginianDominanceTracker,
  opiumWarTracker,
  romanAscendancyTracker,
];
