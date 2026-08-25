import type {
  StageArchetype,
  StageDirectionKind,
  StageEffect,
} from "../lib/types";

/**
 * The stage's asset catalog: every id the scene may ask for. The vendor step
 * (`art/vendor/`) supplies what the purchased packs cover and the fallback
 * generator (`art/fallback/`) supplies every id in flat colour, so the scene
 * always finds something under each id.
 */
export const TERRAINS = [
  "grass",
  "loess",
  "steppe",
  "road",
  "cobble",
  "forest",
  "bamboo",
  "mountain",
  "marsh",
  "field",
] as const;
export type Terrain = (typeof TERRAINS)[number];

export const WATERS = ["river", "sea"] as const;
export type Water = (typeof WATERS)[number];

/**
 * Place markers, `image.<marker>`. The last five are chapter props (plan
 * §5.3): the salt works at the Brine Flats, the merchant house's market,
 * the Jixia academy, the altar and tripods of the royal domain, and the
 * weir on the Great Ditch.
 */
export const MARKERS = [
  "court",
  "town",
  "pass",
  "ford",
  "field",
  "works",
  "harbour",
  "camp",
  "hall",
  "saltern",
  "market",
  "academy",
  "altar",
  "weir",
] as const;
export type Marker = (typeof MARKERS)[number];

/**
 * Decorative set dressing, `decor.<name>`: images the map scatters for
 * visual interest. Not places — they carry no label and no game meaning.
 */
export const DECOR = [
  "pine",
  "bamboo",
  "beacon",
  "tumulus",
  "stele",
  "boat",
  "horses",
  "grove",
  "rocks",
] as const;
export type Decor = (typeof DECOR)[number];

/**
 * Markers with more than one rendering: the scene picks per place by a hash
 * of the place key, among the ids the loaded manifests actually carry, so
 * repeated buildings vary across the map without any data change.
 */
export const MARKER_VARIANTS: Partial<Record<Marker, string[]>> = {
  town: ["image.town", "image.town-b", "image.town-c"],
};

export const EFFECTS: readonly StageEffect[] = [
  "scroll",
  "coin",
  "bar",
  "plate",
  "dust",
  "banner",
  "fire",
  "smoke",
  "arrows",
  "splash",
  "flood",
  "grey",
];

export const ARCHETYPES: readonly StageArchetype[] = [
  "envoy",
  "general",
  "infantry",
  "crossbowman",
  "cavalry",
  "chariot",
  "merchant",
  "peasant",
  "clerk",
  "scholar",
  "mohist",
  "assassin",
  "hostage",
  "labourer",
  "court",
  "boat",
];

/**
 * Sprite ids per archetype in order of preference. The vendor names come
 * from `art/vendor/packs.json`; the last entry is the fallback sheet the
 * generator always writes.
 */
export const ARCHETYPE_SPRITES: Record<StageArchetype, string[]> = {
  envoy: ["sprite.envoy", "sprite.official"],
  general: ["sprite.general", "sprite.knight"],
  infantry: ["sprite.infantry", "sprite.soldier"],
  crossbowman: ["sprite.crossbowman", "sprite.knight"],
  cavalry: ["sprite.cavalry", "sprite.horse"],
  chariot: ["sprite.chariot"],
  merchant: ["sprite.merchant"],
  peasant: ["sprite.peasant", "sprite.peasant-red"],
  clerk: ["sprite.clerk"],
  scholar: ["sprite.scholar", "sprite.sage"],
  mohist: ["sprite.mohist", "sprite.monk"],
  assassin: ["sprite.assassin", "sprite.bravo"],
  hostage: ["sprite.hostage", "sprite.prince-blue"],
  labourer: ["sprite.labourer"],
  court: ["sprite.court", "sprite.king-gold"],
  boat: ["sprite.boat"],
};

export const terrainId = (terrain: Terrain): string => `terrain.${terrain}`;
export const waterId = (water: Water): string => `water.${water}`;
export const markerId = (marker: Marker): string => `image.${marker}`;
export const decorId = (decor: Decor): string => `decor.${decor}`;
export const effectId = (effect: StageEffect): string => `effect.${effect}`;

/** Seat colours by roster order (flags above a seat's actors). */
export const SEAT_COLORS = [
  0xe0533d, 0x3b82f6, 0xeab308, 0x22c55e, 0xa855f7, 0xf97316, 0x14b8a6,
  0xec4899,
];

export const seatColor = (index: number): number =>
  SEAT_COLORS[
    ((index % SEAT_COLORS.length) + SEAT_COLORS.length) % SEAT_COLORS.length
  ];

/** which place keys a direction takes (mirror of `PlaceRule` in the vocabulary) */
export type PlaceRule = "route" | "at" | "home";

export interface DirectionRule {
  /** 0..7, the ladder band the kind belongs to */
  band: number;
  places: PlaceRule;
  actor: StageArchetype;
  effect?: StageEffect;
  /** default group size */
  count?: number;
}

/** the eight band labels by index (a browser mirror of the vocabulary's `BANDS`) */
export const BAND_LABELS: string[] = [
  "Ordinary",
  "Envoys and petitions",
  "Subversion and coin",
  "Grain and roads",
  "Levies and posture",
  "Seizure and raids",
  "War",
  "Annihilation",
];

/**
 * Arity and defaults per direction (a browser mirror of the vocabulary's
 * rules; `catalog.spec.ts` holds it to `DIRECTIONS` in the game package).
 */
export const DIRECTION_RULES: Record<StageDirectionKind, DirectionRule> = {
  idle: { band: 0, places: "home", actor: "court" },
  "market-open": { band: 0, places: "home", actor: "merchant" },
  envoy: { band: 1, places: "route", actor: "envoy", effect: "scroll" },
  hostage: { band: 1, places: "route", actor: "hostage" },
  petition: { band: 1, places: "home", actor: "peasant", count: 4 },
  gold: { band: 2, places: "route", actor: "merchant", effect: "coin" },
  toll: { band: 2, places: "at", actor: "clerk", effect: "bar" },
  refuse: { band: 2, places: "home", actor: "court" },
  "seize-books": { band: 2, places: "at", actor: "clerk", count: 3 },
  "granary-close": { band: 3, places: "home", actor: "peasant", effect: "bar" },
  "carts-back": { band: 3, places: "at", actor: "merchant", count: 2 },
  price: { band: 3, places: "home", actor: "merchant", effect: "plate" },
  column: {
    band: 4,
    places: "route",
    actor: "infantry",
    count: 6,
    effect: "dust",
  },
  garrison: {
    band: 4,
    places: "at",
    actor: "infantry",
    count: 4,
    effect: "banner",
  },
  "wall-build": { band: 4, places: "at", actor: "mohist", count: 3 },
  fleet: { band: 4, places: "route", actor: "boat", count: 3 },
  raid: {
    band: 5,
    places: "route",
    actor: "cavalry",
    count: 4,
    effect: "fire",
  },
  "gates-taken": { band: 5, places: "at", actor: "infantry", effect: "banner" },
  enforce: { band: 5, places: "at", actor: "clerk", count: 3 },
  expel: { band: 5, places: "route", actor: "scholar", count: 3 },
  battle: {
    band: 6,
    places: "at",
    actor: "infantry",
    count: 8,
    effect: "arrows",
  },
  siege: { band: 6, places: "at", actor: "infantry", count: 8 },
  execute: { band: 6, places: "home", actor: "court" },
  "works-cut": { band: 6, places: "at", actor: "mohist", effect: "splash" },
  sack: { band: 7, places: "at", actor: "infantry", effect: "fire" },
  flood: { band: 7, places: "at", actor: "mohist", effect: "flood" },
  extinguish: { band: 7, places: "home", actor: "court", effect: "grey" },
  tripods: { band: 7, places: "route", actor: "labourer", count: 3 },
};

/** One-line captions per direction (a browser mirror of the vocabulary's glosses). */
export const DIRECTION_CAPTIONS: Record<
  StageDirectionKind,
  { en: string; zh: string }
> = {
  idle: { en: "holds court", zh: "守候" },
  "market-open": { en: "opens the markets", zh: "开市" },
  envoy: { en: "sends an envoy", zh: "遣使" },
  hostage: { en: "sends a hostage", zh: "送质" },
  petition: { en: "sends a petition", zh: "上书" },
  gold: { en: "sends gold", zh: "献金" },
  toll: { en: "levies a toll", zh: "征税" },
  refuse: { en: "refuses", zh: "拒绝" },
  "seize-books": { en: "seizes the registers", zh: "收籍" },
  "granary-close": { en: "closes the granaries", zh: "闭仓" },
  "carts-back": { en: "turns the carts back", zh: "却车" },
  price: { en: "fixes the price", zh: "定价" },
  column: { en: "marches a column", zh: "出兵" },
  garrison: { en: "garrisons", zh: "屯守" },
  "wall-build": { en: "raises walls", zh: "筑城" },
  fleet: { en: "launches a fleet", zh: "发舟师" },
  raid: { en: "raids", zh: "袭扰" },
  "gates-taken": { en: "takes the gates", zh: "夺门" },
  enforce: { en: "enforces", zh: "强行" },
  expel: { en: "expels", zh: "驱逐" },
  battle: { en: "gives battle", zh: "交战" },
  siege: { en: "lays siege", zh: "围城" },
  execute: { en: "executes", zh: "诛杀" },
  "works-cut": { en: "cuts the works", zh: "毁工" },
  sack: { en: "sacks", zh: "屠城" },
  flood: { en: "floods", zh: "水攻" },
  extinguish: { en: "extinguishes", zh: "灭国" },
  tripods: { en: "carries off the tripods", zh: "迁鼎" },
};
