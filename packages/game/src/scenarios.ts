import { BadRequestError } from "@jaypie/errors";

import { ASSASSINS_MAP } from "./scenario/assassinsMap";
import { BORROWED_ROAD } from "./scenario/borrowedRoad";
import { COINAGE_REFORM } from "./scenario/coinageReform";
import { CONSCRIPTION_ROLLS } from "./scenario/conscriptionRolls";
import { CORRIDOR_STATES } from "./scenario/corridorStates";
import { FAMINE_GRANARY } from "./scenario/famineGranary";
import { HOSTAGE_PRINCE } from "./scenario/hostagePrince";
import { LAMPARTH_VARIANTS } from "./scenario/lamparth2024";
import { LAND_REGISTER } from "./scenario/landRegister";
import { RIVER_WORKS } from "./scenario/riverWorks";
import { SALT_AND_IRON } from "./scenario/saltAndIron";
import { SCHOOLS_OF_THE_HUNDRED } from "./scenario/schoolsOfTheHundred";
import { STRAIT_STATES } from "./scenario/straitStates";
import { WEDGE_STATE } from "./scenario/wedgeState";
import type { Scenario } from "./types";

// Registration order is display order: Corridor States leads, then the
// strait, then the brainstorm candidates in plan order (international,
// economic, social policy), then later candidates as they are built, then
// the Lamparth 2024 replication cells.
const SCENARIOS = new Map<string, Scenario>(
  [
    CORRIDOR_STATES,
    STRAIT_STATES,
    HOSTAGE_PRINCE,
    ASSASSINS_MAP,
    RIVER_WORKS,
    WEDGE_STATE,
    SALT_AND_IRON,
    COINAGE_REFORM,
    LAND_REGISTER,
    SCHOOLS_OF_THE_HUNDRED,
    CONSCRIPTION_ROLLS,
    FAMINE_GRANARY,
    BORROWED_ROAD,
    ...LAMPARTH_VARIANTS,
  ].map((scenario) => [scenario.id, scenario]),
);

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
