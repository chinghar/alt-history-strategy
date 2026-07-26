import type { ScenarioDefinition } from '../../engine/core/worldFactory';
import { scenario1836 } from './1836';
import { scenario431bce } from './431bce';
import { scenario1200ce } from './1200ce';
import { scenario1914 } from './1914';
import { scenario1962 } from './1962';
import { scenario2150 } from './2150';

export const scenarios: Record<string, ScenarioDefinition> = {
  [scenario1836.id]: scenario1836,
  [scenario431bce.id]: scenario431bce,
  [scenario1200ce.id]: scenario1200ce,
  [scenario1914.id]: scenario1914,
  [scenario1962.id]: scenario1962,
  [scenario2150.id]: scenario2150,
};

export const scenarioList: ScenarioDefinition[] = [
  scenario431bce,
  scenario1200ce,
  scenario1836,
  scenario1914,
  scenario1962,
  scenario2150,
];

export const DEFAULT_SCENARIO_ID = scenario1836.id;
