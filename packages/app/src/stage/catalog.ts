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
  "road",
  "cobble",
  "forest",
  "mountain",
  "marsh",
  "field",
] as const;
export type Terrain = (typeof TERRAINS)[number];

export const WATERS = ["river", "sea"] as const;
export type Water = (typeof WATERS)[number];

/** Place markers, `image.<marker>`. */
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
] as const;
export type Marker = (typeof MARKERS)[number];

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
