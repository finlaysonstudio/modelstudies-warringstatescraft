import { BadRequestError } from "@jaypie/errors";

import { TAIWAN_STRAIT } from "./scenario/taiwanStrait";
import type { Scenario } from "./types";

const SCENARIOS = new Map<string, Scenario>([
  [TAIWAN_STRAIT.id, TAIWAN_STRAIT],
]);

export const registerScenario = (scenario: Scenario): void => {
  SCENARIOS.set(scenario.id, scenario);
};

export const getScenario = (id: string): Scenario => {
  const scenario = SCENARIOS.get(id);
  if (!scenario) {
    throw new BadRequestError(`Unknown scenario: ${id}`);
  }
  return scenario;
};

export const listScenarios = (): Scenario[] => [...SCENARIOS.values()];
