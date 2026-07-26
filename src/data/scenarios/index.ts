import type { ScenarioDefinition } from '../../engine/core/worldFactory';
import { scenario1836 } from './1836';
import { scenario431bce } from './431bce';

export const scenarios: Record<string, ScenarioDefinition> = {
  [scenario1836.id]: scenario1836,
  [scenario431bce.id]: scenario431bce,
};

export const scenarioList: ScenarioDefinition[] = [scenario431bce, scenario1836];

export const DEFAULT_SCENARIO_ID = scenario1836.id;
