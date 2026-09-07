/**
 * A site: a second geography drawn on the same stage as the overworld, at its
 * own scale, walked by its own people. The city, the village, and the house
 * are each one (`sites/`), and everything the page, the build, and the spec
 * need to tell them apart is on the record here rather than in the page.
 *
 * Browser-safe: the node build imports it to check a map's places against
 * the names, and the page imports it to label them.
 */
import type { SiteYear } from "./almanac";
import type { FeatureNote, Localized } from "./legend";
import type { StageArchetype } from "../lib/types";
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
  archetype: StageArchetype;
  order: Order;
  label: Localized;
  home?: string;
}

/** one thing the plan is drawn from, for the page's sources list */
export interface SiteSource {
  name: string;
  text: string;
}

export interface Site {
  id: SiteId;
  /** the route under `/craft` */
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
  folk: readonly Townsperson[];
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
