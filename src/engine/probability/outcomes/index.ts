import type { HistoricalOutcomeTracker } from '../../core/types';
import { germanUnificationTracker } from './germanUnification';
import { americanCivilWarTracker } from './americanCivilWar';
import { ottomanDeclineTracker } from './ottomanDecline';

export const defaultOutcomeTrackers: HistoricalOutcomeTracker[] = [
  germanUnificationTracker,
  americanCivilWarTracker,
  ottomanDeclineTracker,
];
