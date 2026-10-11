/**
 * A site: a second geography drawn on the same stage as the overworld, at its
 * own scale, walked by its own people. The city, the village, and the house
 * are each one (`sites/`), and everything the page, the build, and the spec
 * need to tell them apart is on the record here rather than in the page.
 *
 * Browser-safe: the node build imports it to check a map's places against
 * the names, and the page imports it to label them.
 */
import type { Cite, Month, SiteYear } from "./almanac";
import type { FeatureNote, Localized } from "./legend";
import type { StageArchetype, StageDirection } from "../lib/types";
import type { StageSet } from "./sets";

export type SiteId = "city" | "village" | "house";

/**
 * The class a figure belongs to, then its craft: the order the registers and
 * the Guanzi sort people by. The house adds the family and its servants,
 * which no register of a town lists as such.
 */
export type Order =
  | "official"
  | "artisan"
  | "merchant"
  | "farmer"
  | "household"
  | "convict"
  | "family"
  | "servant"
  | "retainer";

/**
 * One of a site's people: who walks it in the ambient loop, and where each
 * is found at work. `home` is where a labour beat stands the figure; a
 * figure with no home only strolls.
 */
export interface Townsperson {
  /** the villager id on a registered site; a city townsperson has none */
  id?: string;
  archetype: StageArchetype;
  order: Order;
  label: Localized;
  home?: string;
}

/** one thing the plan is drawn from, for the page's sources list */
export interface SiteSource {
  name: string;
  text: string;
  /**
   * when the witness wrote: the period's own, Qin, a Han witness read for
   * the customs the period left unrecorded, or later; the page marks it
   */
  era?: "warring-states" | "qin" | "han" | "later";
}

/**
 * The age classes a Qin register enters a person under: grown, small, old.
 * The Liye slips write them beside every member of a household.
 */
export type AgeClass = "大" | "小" | "老";

export type Sex = "m" | "f";

/**
 * A person's part in the site's year: the key its circuits (`Circuit.role`)
 * and its events are written against. The union covers both registered
 * sites; a site uses the members it names in its register and no other.
 */
export type Role =
  // the village's
  | "head"
  | "son"
  | "brother"
  | "wife"
  | "daughter"
  | "child"
  | "old"
  | "elder"
  | "oxmaster"
  | "wulao"
  | "widow"
  | "postclerk"
  | "pedlar"
  | "countyclerk"
  | "fieldofficer"
  | "lieutenant"
  | "ox"
  // the house's
  | "master"
  | "lady"
  | "dowager"
  | "concubine"
  | "heir"
  | "younglady"
  | "girl"
  | "steward"
  | "retainer"
  | "tutor"
  | "musician"
  | "gatekeeper"
  | "maid"
  | "cook"
  | "groom"
  | "porter"
  | "physician"
  | "invocator"
  | "diviner"
  | "caller"
  | "suitor"
  | "matchmaker";

/**
 * One entry of a household on the register: the Liye form, a relation to the
 * head and an age class, with what the map needs to draw the person. A
 * villager who is `drawn: false` is on the register (an infant, the
 * bedridden) and never on the map.
 */
export interface Villager {
  id: string;
  name: Localized;
  /** the relation to the head, as the register writes it (head, wife, son, ...) */
  relation: string;
  age: AgeClass;
  sex: Sex;
  archetype: StageArchetype;
  /** a sprite variant of the archetype (`SPRITE_VARIANTS`); the archetype's own by default */
  sprite?: string;
  /** overlays worn all year (`OVERLAYS`); a circuit stop may add more */
  overlays?: string[];
  role: Role;
  drawn: boolean;
  /** the place the person is homed at, and where a circuit's `home` resolves */
  home: string;
}

/** a household as the register lists it: the head's rank and name, then the members */
export interface Household {
  id: string;
  /** the 伍 it belongs to, where the site groups its households */
  wu?: string;
  surname: string;
  /** the head's rank (士伍, 公士, 上造, 不更, 大女子) */
  rank?: string;
  /** the head's villager id */
  head: string;
  /** the household's own field, where a circuit's `plot` resolves */
  plot?: string;
  members: Villager[];
  note?: Localized;
}

/** a grouping of households: the Zhouli's 伍, five households under a 伍老 */
export interface Wu {
  id: string;
  order: number;
  households: string[];
  /** the villager id of the 伍老 */
  wulao: string;
}

/**
 * What an event does to the register: a change of relation, household, age
 * class, role, or sprite, a month (or the whole year) away, or a striking
 * off. `registerAt` folds every change of every earlier month forward.
 */
export interface RegisterChange {
  villager: string;
  set: {
    relation?: string;
    household?: string;
    age?: AgeClass;
    role?: Role;
    sprite?: string;
    overlays?: string[];
    /** away for one month, or for the rest of the year */
    away?: Month | "year";
    struck?: true;
  };
}

/**
 * The double-hours of a day, 1 (子, the midnight watch) to 12 (亥). A
 * circuit's stops are keyed by them; the clock (`stage/clock.ts`) runs them.
 */
export type Hour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * The placeholders a circuit's `at` may name beside a place of the map:
 * `home` (the villager's), `well` (the nearest place of that marker), `plot`
 * (the household's field), `block` (through `Site.blockOf`), and `edge` (the
 * map's exit).
 */
export type StopPlace = "home" | "well" | "plot" | "block" | "edge" | string;

/** where a role stands at one hour of a month's day, and what it does there */
export interface Stop {
  hour: Hour;
  at: StopPlace;
  /** the pose the sprite holds there (`actions`); standing by default */
  pose?: string;
  /** overlays worn at this stop, added to the villager's own */
  overlays?: string[];
  line?: Localized;
  cite?: Cite;
}

/** a role's day in one month: the stops, in hour order */
export interface Circuit {
  role: Role;
  month: Month;
  stops: Stop[];
}

/** who an event gathers: everyone, the heads, the men, the women, the young, one 伍, named villagers, or nobody */
export type Attendance =
  | "all"
  | "heads"
  | "men"
  | "women"
  | "young"
  | "none"
  | { wu: string }
  | { villagers: string[] };

/**
 * One event of the site's year: a day and an hour, the scenes it plays
 * (each an array of directions played together), who attends, what it
 * changes on the register, and the lines it is cited to.
 */
export interface SiteEvent {
  id: string;
  month: Month;
  /** the day of the month, 1 to 30 */
  day: number;
  hour: Hour;
  title: Localized;
  line: Localized;
  cite: Cite[];
  attend?: Attendance;
  script: StageDirection[][];
  changes?: RegisterChange[];
}

export interface Site {
  id: SiteId;
  /** the route under `/world` */
  path: string;
  crumb: string;
  title: Localized;
  /** the page's opening paragraph */
  intro: string;
  /** the seat every direction acts for; it never flies a flag */
  seat: string;
  /** every place the map carries, named in both languages */
  names: Record<string, Localized>;
  /** every named feature the map draws */
  features: Record<string, FeatureNote>;
  /**
   * the people who walk it; a registered site derives this from its register
   * (`villagersOf`), and the city lists its townsfolk here directly
   */
  folk: readonly Townsperson[];
  /** metres a tile: the stride and the walk time read it */
  scale: number;
  /** the households on the register, where the site keeps one */
  register?: Household[];
  /** the register's groupings (the village's 伍) */
  wus?: Wu[];
  /** the people who come to the site and are not on its register */
  visitors?: Villager[];
  /** a role's day per month; a role with no circuit for a month strolls */
  circuits?: Circuit[];
  /** the year's events, in month order */
  events?: SiteEvent[];
  /** the place a household's `block` placeholder means in a month, where the site has one */
  blockOf?: (household: Household, month: Month) => string | undefined;
  /** the places a stroll may start or end */
  strollPlaces: readonly string[];
  /** the homes whose labour smokes */
  smoking: readonly string[];
  /** what the site does in each month of the year (`sites/years/`) */
  year: SiteYear;
  words: {
    awake: string;
    wake: string;
    firstStep: string;
    /** the label of the roofs checkbox; only a site with interiors carries one */
    roofs?: string;
    day: Localized;
    nothing: Localized;
    folk: Localized;
    folkNote: Localized;
  };
  sources: SiteSource[];
}

/** the built maps per set, beside the overworld's */
export const siteMapOf = (
  site: Pick<Site, "id">,
  set: StageSet,
): { url: string; features: string } => ({
  url: set.tile === 32 ? `/stage/${site.id}32.tmj` : `/stage/${site.id}.tmj`,
  features: `/stage/${site.id}.features.json`,
});

export const ORDER_LABELS: Record<Order, Localized> = {
  official: { en: "Officials", zh: "官" },
  artisan: { en: "Artisans", zh: "工" },
  merchant: { en: "Merchants", zh: "商" },
  farmer: { en: "Farmers", zh: "农" },
  household: { en: "Households", zh: "户" },
  convict: { en: "Convict labour", zh: "徒" },
  family: { en: "The family", zh: "家" },
  servant: { en: "Servants", zh: "仆" },
  retainer: { en: "Retainers and guests", zh: "客" },
};
