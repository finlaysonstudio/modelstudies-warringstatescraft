/**
 * The village: a ward (里) of the period at about ten metres a tile, drawn
 * from `art/sites/village/geography.json` by `npm run stage:sites`. It is
 * a composite of what the registers, the statutes, and the Odes say a ward
 * had: twenty-five farmsteads in five 伍 along three gated lanes, the hall,
 * two wells, the granary and the threshing floor, the byre for the ward's
 * oxen, the silkworm shed behind the mulberry, the ice house in the hill,
 * the altar of the soil on the rise with its tree and the graves beyond,
 * the fields in blocks of nine with their banks, every crop the sources
 * harvest in its own ground, the brook with its ford, its washing place, its
 * pond, and the paddy below, and the post station on the road out. No
 * chapter is set here and no seat marches to it; the people are the
 * households of one register (`register.ts`), each with a day for every
 * month (`circuits.ts`) and a year of events (`events.ts`).
 */
import type { Month } from "../../almanac";
import type { Household, Site } from "../../site";
import { villagersOf } from "../../register";
import { VILLAGE_YEAR } from "../years/village";
import { VILLAGE_CIRCUITS } from "./circuits";
import { VILLAGE_EVENTS } from "./events";
import {
  VILLAGE_FEATURES,
  VILLAGE_NAMES,
  VILLAGE_STROLL_PLACES,
} from "./names";
import { VILLAGE_REGISTER, VILLAGE_VISITORS, VILLAGE_WUS } from "./register";

export {
  VILLAGE_FEATURES,
  VILLAGE_NAMES,
  VILLAGE_STROLL_PLACES,
} from "./names";
export { VILLAGE_REGISTER, VILLAGE_VISITORS, VILLAGE_WUS } from "./register";
export { VILLAGE_CIRCUITS, VILLAGE_DAYS } from "./circuits";
export { VILLAGE_EVENTS } from "./events";

/** the field grounds, as the map lays them */
export const VILLAGE_BLOCKS = [
  "field-west",
  "field-north",
  "field-south",
  "field-east",
  "field-hemp",
  "field-paddy",
] as const;

/**
 * The blocks that want work in a month besides a household's own plot
 * (plan §4.3): the wheat in the fourth and eighth months, the beans in the
 * fifth and ninth, the paddy in the third and tenth, the hemp in the third
 * and seventh, the millets otherwise.
 */
export const BLOCK_WANTS: Partial<Record<Month, string[]>> = {
  3: ["field-paddy", "field-hemp"],
  4: ["field-south"],
  5: ["field-east", "field-north"],
  7: ["field-hemp", "field-west"],
  8: ["field-south"],
  9: ["field-east", "field-west"],
  10: ["field-paddy", "field-west"],
};

/**
 * The block a household's `block` resolves to in a month: its own plot or
 * one of the month's wanting blocks, picked by the household's place in its
 * 伍, so that in one month the five households of a 伍 walk to different
 * blocks.
 */
export const villageBlockOf = (
  household: Household,
  month: Month,
): string | undefined => {
  const candidates = Array.from(
    new Set([household.plot, ...(BLOCK_WANTS[month] ?? [])]),
  ).filter((key): key is string => Boolean(key));
  if (candidates.length === 0) return undefined;
  const wu = VILLAGE_WUS.find((w) => w.id === household.wu);
  const index = wu ? wu.households.indexOf(household.id) : 0;
  return candidates[Math.max(index, 0) % candidates.length];
};

const VILLAGE_BASE: Omit<Site, "folk"> = {
  id: "village",
  path: "/world/village",
  crumb: "Village",
  title: { en: "A Model Village", zh: "模範之里" },
  seat: "village",
  intro:
    "A ward of the period at ten times the town's scale, drawn from what the registers, the statutes, and the Odes say a ward had rather than from any one dig: twenty-five farmsteads in five groups of five along three gated lanes, a hall where the statutes are read and the drinking rite held, two wells, a granary and a threshing floor, a byre for the ward's four oxen, a silkworm shed behind the mulberry, an ice house dug into the hill, the altar of the soil on the rise with its old tree and the family graves beyond, the fields in blocks of nine with the banks between them and every crop the sources harvest standing in its own ground by the month, a brook with its ford, its washing place, and its pond, the paddy in the wet ground below, and the post station on the road out. The people are the entries of one register: a hundred and five in twenty-five households, a hundred and one of them walking, each with a day for every month of the year and a year of altars, weddings, levies, burials, and the county's visits. Click any house, field, or lane to read what it is.",
  names: VILLAGE_NAMES,
  features: VILLAGE_FEATURES,
  strollPlaces: VILLAGE_STROLL_PLACES,
  scale: 10,
  register: VILLAGE_REGISTER,
  wus: VILLAGE_WUS,
  visitors: VILLAGE_VISITORS,
  circuits: VILLAGE_CIRCUITS,
  events: VILLAGE_EVENTS,
  blockOf: villageBlockOf,
  smoking: [],
  year: VILLAGE_YEAR,
  words: {
    awake: "the village is awake · pause",
    wake: "wake the village",
    firstStep: "the village wakes when the map has loaded",
    day: { en: "The village's day", zh: "里中一日" },
    nothing: { en: "Nothing has stirred yet.", zh: "村尚未醒。" },
    folk: { en: "Who lives here", zh: "里中之人" },
    folkNote: {
      en: "A Liye household register lists a ward door by door: the head with his rank, the wife, the sons and daughters by age class, the old, and the field each holds. The Zhouli's ward is twenty-five households in five groups of five, and Lord Shang's Qin kept the five as the 伍 that answered for one another. The village's people are the entries of one such register, invented in one stock of one-character Qin-form names taken from no region and from no real person of the slips.",
      zh: "里耶戶籍逐戶列一里：戶主及其爵、妻、子女以齒、老者、所受之田。周禮之里二十五家，五家為伍；商君之秦以伍相保。此村之人即一籍之目，其名皆擬，一字之名如秦簡之例，不繫一地，不取簡中實有之人。",
    },
  },
  sources: [
    {
      name: "The Liye slips",
      text: "(Qianling, Hunan; 222–208 BCE): household registers listing every member of a ward by household, with rank, relation, and age class; the rosters of hands and convicts; the granary and post accounts of one county seat and its hamlets.",
      era: "qin",
    },
    {
      name: "The Shuihudi statutes",
      text: "(Yunmeng, Hubei; sealed 217 BCE): the field statutes on spring water, timber, nets, and the fodder and straw levy; the stable statutes on the oxen inspected four times a year and reckoned in the first month; the register statute that punishes the elder and the 伍老 for a grown boy hidden; the garrison statute that never sends two of one household together.",
      era: "qin",
    },
    {
      name: "The Zhouli",
      text: ": the ward of twenty-five households in five groups of five; the 黨正 who reads the statutes in the first month of each season and seats the ward by age at the drinking rite; the 族師 who counts the old and the sick; the matchmaker's month; the shamaness's lustration and rain dance; the midwinter review.",
      era: "warring-states",
    },
    {
      name: "The Odes and the Yueling",
      text: ": the Seventh Month's calendar of the farming year, the mulberry, the hemp, the jujubes, the rice, the floor, the ice, the feast; the Yueling's months for the wheat, the two millets, the dyeing, the burning of the stubble, the sowing of the wheat, the year's-end sacrifice, and the exorcism.",
      era: "warring-states",
    },
    {
      name: "Mencius, the Lüshi Chunqiu, and the Book of Lord Shang",
      text: ": the well-field of nine plots, the six crops of a field in their seasons, the register on which the living are entered and the dead struck, and the double tax on a household that does not divide.",
      era: "warring-states",
    },
    {
      name: "Han witnesses",
      text: ": Dong Zhongshu on the month's labour turn and the year's garrison (Hanshu 食貨志), the Chunqiu Fanlu on praying for rain, the Duduan and the Fengsu Tongyi on the La and the exorcism, read for the customs the period left unrecorded.",
      era: "han",
    },
  ],
};

/**
 * The site, its `folk` derived from the register in a second step so that
 * everything reading `folk` reads the register too.
 */
export const VILLAGE: Site = {
  ...VILLAGE_BASE,
  folk: villagersOf({ ...VILLAGE_BASE, folk: [] }),
};
