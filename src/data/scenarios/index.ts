import type { ScenarioDefinition } from '../../engine/core/worldFactory';
import { scenario1836 } from './1836';
import { scenario431bce } from './431bce';
import { scenario2150 } from './2150';

export const scenarios: Record<string, ScenarioDefinition> = {
  [scenario1836.id]: scenario1836,
  [scenario431bce.id]: scenario431bce,
  [scenario2150.id]: scenario2150,
};

export const scenarioList: ScenarioDefinition[] = [scenario431bce, scenario1836, scenario2150];

export const DEFAULT_SCENARIO_ID = scenario1836.id;
