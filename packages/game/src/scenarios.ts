import { BadRequestError } from "@jaypie/errors";

import { ASSASSINS_MAP_TEXT } from "./scenario/assassinsMap";
import { BORROWED_ROAD_TEXT } from "./scenario/borrowedRoad";
import { CONSCRIPTION_ROLLS_TEXT } from "./scenario/conscriptionRolls";
import { CORRIDOR_STATES_TEXT } from "./scenario/corridorStates";
import { FAMINE_GRANARY_TEXT } from "./scenario/famineGranary";
import { HEAVY_COIN_TEXT } from "./scenario/heavyCoin";
import { HOSTAGE_PRINCE_TEXT } from "./scenario/hostagePrince";
import { LAMPARTH_VARIANTS } from "./scenario/lamparth2024";
import { LAND_REGISTER_TEXT } from "./scenario/landRegister";
import { RIVER_WORKS_TEXT } from "./scenario/riverWorks";
import { ROYAL_DOMAIN_TEXT } from "./scenario/royalDomain";
import { SALT_AND_IRON_TEXT } from "./scenario/saltAndIron";
import { SCHOOLS_OF_THE_HUNDRED_TEXT } from "./scenario/schoolsOfTheHundred";
import { STRAIT_STATES_TEXT } from "./scenario/straitStates";
import { TAIWAN_STRAIT } from "./scenario/taiwanStrait";
import type { RenderOptions, ScenarioText } from "./scenario/render";
import {
  buildChapter,
  DEFAULT_LANGUAGE,
  DEFAULT_NAMING,
  namingsOf,
} from "./scenario/render";
import type { Scenario } from "./types";

/**
 * Registration order is display order: the chronicle's chapters in order
 * (the prologue first), then the modern-noun twin of the prologue
 * (`taiwan-strait`, outside the chronicle), then the Lamparth 2024
 * replication cells. Chapters are texts rendered on demand under a naming
 * and a language; the Lamparth cells and `taiwan-strait` are plain
 * scenarios with one rendering.
 */
const TEXTS = new Map<string, ScenarioText>(
  [
    STRAIT_STATES_TEXT,
    LAND_REGISTER_TEXT,
    SALT_AND_IRON_TEXT,
    HEAVY_COIN_TEXT,
    FAMINE_GRANARY_TEXT,
    SCHOOLS_OF_THE_HUNDRED_TEXT,
    ROYAL_DOMAIN_TEXT,
    CONSCRIPTION_ROLLS_TEXT,
    BORROWED_ROAD_TEXT,
    CORRIDOR_STATES_TEXT,
    HOSTAGE_PRINCE_TEXT,
    RIVER_WORKS_TEXT,
    ASSASSINS_MAP_TEXT,
  ].map((text) => [text.id, text]),
);

const PLAIN = new Map<string, Scenario>(
  [TAIWAN_STRAIT, ...LAMPARTH_VARIANTS].map((scenario) => [
    scenario.id,
    scenario,
  ]),
);

/** rendered chapters, keyed by id, naming, language, and pivot */
const RENDERED = new Map<string, Scenario>();

const renderKey = (id: string, options: RenderOptions): string =>
  [
    id,
    options.naming ?? DEFAULT_NAMING,
    options.language ?? DEFAULT_LANGUAGE,
    options.pivot ?? "",
  ].join("|");

const isDefault = (options: RenderOptions): boolean =>
  (options.naming ?? DEFAULT_NAMING) === DEFAULT_NAMING &&
  (options.language ?? DEFAULT_LANGUAGE) === DEFAULT_LANGUAGE &&
  !options.pivot;

export const registerScenario = (scenario: Scenario): void => {
  PLAIN.set(scenario.id, scenario);
};

export const registerScenarioText = (text: ScenarioText): void => {
  TEXTS.set(text.id, text);
};

/**
 * A scenario by id, rendered under the options. A plain scenario (the
 * Lamparth cells, `taiwan-strait`) has one rendering and refuses any
 * other; a chapter renders under every naming it declares and both
 * languages, with an optional pivot.
 */
export const getScenario = (
  id: string,
  options: RenderOptions = {},
): Scenario => {
  const text = TEXTS.get(id);
  if (text) {
    const key = renderKey(id, options);
    let rendered = RENDERED.get(key);
    if (!rendered) {
      rendered = buildChapter(text, options);
      RENDERED.set(key, rendered);
    }
    return rendered;
  }
  const plain = PLAIN.get(id);
  if (!plain) {
    throw new BadRequestError(`Unknown scenario: ${id}`);
  }
  if (!isDefault(options)) {
    throw new BadRequestError(
      `${id} has one rendering; it takes no naming, language, or pivot`,
    );
  }
  return plain;
};

/** the chapter text behind a scenario id, when it is a chapter */
export const getScenarioText = (id: string): ScenarioText | undefined =>
  TEXTS.get(id);

/** every registered scenario in display order, in its default rendering */
export const listScenarios = (): Scenario[] => [
  ...[...TEXTS.keys()].map((id) => getScenario(id)),
  ...PLAIN.values(),
];

/** every chapter text in chronicle order */
export const listScenarioTexts = (): ScenarioText[] => [...TEXTS.values()];

/** the renderings a scenario id can take, default first */
export const renderingsOf = (id: string): RenderOptions[] => {
  const text = TEXTS.get(id);
  if (!text) return [{}];
  return namingsOf(text).flatMap((naming) =>
    (["en", "zh"] as const).map((language) => ({ naming, language })),
  );
};
