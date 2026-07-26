import type { HistoricalOutcomeTracker } from '../../core/types';
import { germanUnificationTracker } from './germanUnification';
import { americanCivilWarTracker } from './americanCivilWar';
import { ottomanDeclineTracker } from './ottomanDecline';
import { spartanVictoryTracker } from './spartanVictory';
import { macedonianHegemonyTracker } from './macedonianHegemony';
import { carthaginianDominanceTracker } from './carthaginianDominance';

export const defaultOutcomeTrackers: HistoricalOutcomeTracker[] = [
  germanUnificationTracker,
  americanCivilWarTracker,
  ottomanDeclineTracker,
  spartanVictoryTracker,
  macedonianHegemonyTracker,
  carthaginianDominanceTracker,
];
