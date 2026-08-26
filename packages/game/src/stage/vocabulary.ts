/**
 * The direction vocabulary: every kind with its ladder band, its arity
 * rule (which place keys it takes), the archetype that plays it by
 * default, and the cue words the fallback reads a decision for. The
 * bands follow plan §3.1: every rung of every chapter's ladder maps to a
 * band, and every band has at least one direction (`stage.spec.ts` holds
 * the table to the registered chapters).
 */
import type { StageArchetype, StageDirectionKind, StageEffect } from "./types";

/** which place keys a kind takes */
export type PlaceRule =
  /** `from` and `to`, both required and distinct: a figure walks */
  | "route"
  /** `at`, required: something happens at a place */
  | "at"
  /** `at` optional, the actor's home when absent: a posture at court */
  | "home";

/**
 * Where a kind may be used. `game` kinds are the played vocabulary: the coder
 * is offered them, the fallback reads a decision for them, the random stager
 * draws from them. `annals` kinds belong to the authored episodes of the
 * period and reach none of those, which is what keeps a history out of a
 * staging (`stage.spec.ts` holds it).
 */
export type DirectionScope = "game" | "annals";

export interface DirectionRule {
  /** 0..7, the ladder band the kind belongs to */
  band: number;
  /** `game` when absent */
  scope?: DirectionScope;
  places: PlaceRule;
  actor: StageArchetype;
  effect?: StageEffect;
  /** default group size */
  count?: number;
  /** martial kinds meet as battles when they converge (see `weaveTurn`) */
  martial?: true;
  /** one line for the coder prompt and the key under the stage */
  gloss: string;
  /**
   * Lowercase substrings, en and zh, that pick the kind from a decision.
   * Annals kinds carry none: nothing reads a decision for them.
   */
  cues?: string[];
}

export const DIRECTIONS: Record<StageDirectionKind, DirectionRule> = {
  idle: {
    band: 0,
    places: "home",
    actor: "court",
    gloss: "the seat's figures stay at court; market stalls animate",
    cues: [
      "wait",
      "observe",
      "hold",
      "patience",
      "maintain",
      "观望",
      "静观",
      "按兵",
    ],
  },
  "market-open": {
    band: 0,
    places: "home",
    actor: "merchant",
    gloss: "the market at the seat's court opens and trades",
    cues: ["market", "trade", "commerce", "merchants", "开市", "通商", "市"],
  },
  envoy: {
    band: 1,
    places: "route",
    actor: "envoy",
    effect: "scroll",
    gloss: "a robed figure walks court to court; a scroll opens on arrival",
    cues: [
      "envoy",
      "embassy",
      "emissary",
      "letter",
      "mission",
      "delegation",
      "negotiat",
      "covenant",
      "treaty",
      "使",
      "书信",
      "遣",
      "盟约",
      "和谈",
    ],
  },
  hostage: {
    band: 1,
    places: "route",
    actor: "hostage",
    gloss: "a prince walks to another court and lodges there",
    cues: ["hostage", "prince", "质子", "为质", "质"],
  },
  petition: {
    band: 1,
    places: "home",
    actor: "peasant",
    count: 4,
    gloss: "figures gather before the hall with a petition",
    cues: [
      "petition",
      "plea",
      "remonstr",
      "appeal",
      "protest",
      "请愿",
      "上书",
      "谏",
      "抗议",
    ],
  },
  gold: {
    band: 2,
    places: "route",
    actor: "merchant",
    effect: "coin",
    gloss: "a cart of gold walks court to court; coin spills on arrival",
    cues: [
      "gold",
      "bribe",
      "gift",
      "silver",
      "subsid",
      "purchase",
      "buy",
      "pay ",
      "黄金",
      "贿",
      "赂",
      "赠",
      "收买",
      "金",
    ],
  },
  toll: {
    band: 2,
    places: "at",
    actor: "clerk",
    effect: "bar",
    gloss: "a barrier drops at a pass or ford and a clerk collects",
    cues: ["toll", "tariff", "customs", "duty", "关税", "征税", "税", "关卡"],
  },
  refuse: {
    band: 2,
    places: "home",
    actor: "court",
    gloss: "an arriving envoy is turned back at the seat's gate",
    cues: [
      "refuse",
      "reject",
      "decline",
      "turn back",
      "turn away",
      "dismiss",
      "rebuff",
      "拒",
      "却",
      "不受",
      "谢绝",
    ],
  },
  "seize-books": {
    band: 2,
    places: "at",
    actor: "clerk",
    count: 3,
    gloss: "clerks carry stacks of books out of the academy",
    cues: [
      "books",
      "writings",
      "licens",
      "censor",
      "confiscate the",
      "书籍",
      "禁书",
      "收书",
      "典籍",
    ],
  },
  "granary-close": {
    band: 3,
    places: "home",
    actor: "peasant",
    effect: "bar",
    gloss: "the granary's doors shut and a bar drops",
    cues: [
      "granar",
      "grain",
      "embargo",
      "withhold",
      "close the",
      "stop the supply",
      "仓",
      "粮",
      "粟",
      "禁运",
      "断",
    ],
  },
  "carts-back": {
    band: 3,
    places: "at",
    actor: "merchant",
    count: 2,
    gloss: "carts turn back at a ford or pass",
    cues: [
      "cart",
      "convoy",
      "halt the",
      "turn back the",
      "ford",
      "caravan",
      "车",
      "转运",
      "渡口",
      "商队",
    ],
  },
  price: {
    band: 3,
    places: "home",
    actor: "merchant",
    effect: "plate",
    gloss: "a scale and a countdown plate stand at the court",
    cues: [
      "price",
      "tally",
      "tallies",
      "weigh",
      "coin",
      "debase",
      "mint",
      "价",
      "钱",
      "铸",
      "币",
      "符",
    ],
  },
  column: {
    band: 4,
    places: "route",
    actor: "infantry",
    count: 6,
    effect: "dust",
    martial: true,
    gloss: "a column of infantry marches from court to a place",
    cues: [
      "march",
      "column",
      "levy",
      "levies",
      "mobiliz",
      "muster",
      "army",
      "troops",
      "reinforce",
      "soldiers",
      "advance",
      "深入",
      "进军",
      "发兵",
      "出兵",
      "军",
      "兵",
      "师",
      "征",
    ],
  },
  garrison: {
    band: 4,
    places: "at",
    actor: "infantry",
    count: 4,
    effect: "banner",
    martial: true,
    gloss: "a column stops at a wall, pass, or dike and raises banners",
    cues: [
      "garrison",
      "fortif",
      "hold the",
      "man the",
      "entrench",
      "defend",
      "defensive",
      "戍",
      "守",
      "驻",
      "固守",
      "设防",
    ],
  },
  "wall-build": {
    band: 4,
    places: "at",
    actor: "mohist",
    count: 3,
    gloss: "engineers raise a wall segment",
    cues: ["wall", "rampart", "build", "repair", "筑", "修城", "城墙", "垒"],
  },
  fleet: {
    band: 4,
    places: "route",
    actor: "boat",
    count: 3,
    martial: true,
    gloss: "boats sail from a harbor along a shore",
    cues: [
      "fleet",
      "ship",
      "boat",
      "sail",
      "harbor",
      "harbour",
      "naval",
      "舟",
      "船",
      "水师",
      "舰",
      "港",
    ],
  },
  raid: {
    band: 5,
    places: "route",
    actor: "cavalry",
    count: 4,
    effect: "fire",
    martial: true,
    gloss: "riders rush a town; fire on its granary or works",
    cues: [
      "raid",
      "strike",
      "seize",
      "burn",
      "plunder",
      "punitive",
      "袭",
      "掠",
      "夺",
      "焚",
      "劫",
    ],
  },
  "gates-taken": {
    band: 5,
    places: "at",
    actor: "infantry",
    effect: "banner",
    martial: true,
    gloss: "the banner on a gate tower swaps to the taker's colour",
    cues: [
      "gate",
      "occupy",
      "take the town",
      "take the city",
      "annex the",
      "夺门",
      "占",
      "据",
      "取城",
    ],
  },
  enforce: {
    band: 5,
    places: "at",
    actor: "clerk",
    count: 3,
    gloss: "clerks and guards go house to house",
    cues: [
      "enforce",
      "confiscat",
      "punish",
      "register",
      "rolls",
      "arrest",
      "impose",
      "compel",
      "强制",
      "籍",
      "罚",
      "拘",
      "查抄",
    ],
  },
  expel: {
    band: 5,
    places: "route",
    actor: "scholar",
    count: 3,
    gloss: "scholars walk out across a border",
    cues: ["expel", "banish", "exile", "expuls", "逐", "放逐", "驱", "流放"],
  },
  battle: {
    band: 6,
    places: "at",
    actor: "infantry",
    count: 8,
    effect: "arrows",
    martial: true,
    gloss: "two columns meet at a place; dust and arrows",
    cues: [
      "battle",
      "engage",
      "attack",
      "assault",
      "offensive",
      "decisive",
      "战",
      "击",
      "攻",
      "决战",
      "交锋",
    ],
  },
  siege: {
    band: 6,
    places: "at",
    actor: "infantry",
    count: 8,
    martial: true,
    gloss: "columns encircle a city",
    cues: [
      "siege",
      "besieg",
      "encircle",
      "invest",
      "surround",
      "围",
      "困",
      "围城",
    ],
  },
  execute: {
    band: 6,
    places: "home",
    actor: "court",
    gloss: "a figure falls in the market",
    cues: [
      "execut",
      "behead",
      "kill",
      "put to death",
      "诛",
      "杀",
      "斩",
      "处死",
    ],
  },
  "works-cut": {
    band: 6,
    places: "at",
    actor: "mohist",
    effect: "splash",
    gloss: "a weir breaks and water spreads",
    cues: [
      "weir",
      "dike",
      "dyke",
      "breach",
      "cut the",
      "sabotage",
      "堤",
      "堰",
      "决",
      "破坏",
    ],
  },
  sack: {
    band: 7,
    places: "at",
    actor: "infantry",
    effect: "fire",
    martial: true,
    gloss: "a city burns; its banner falls",
    cues: [
      "sack",
      "storm",
      "raze",
      "burn the city",
      "destroy",
      "屠",
      "焚城",
      "夷",
      "毁",
    ],
  },
  flood: {
    band: 7,
    places: "at",
    actor: "mohist",
    effect: "flood",
    gloss: "water spreads over a city",
    cues: [
      "flood",
      "drown",
      "turn the river",
      "inundat",
      "水淹",
      "灌",
      "决河",
      "淹",
    ],
  },
  extinguish: {
    band: 7,
    places: "home",
    actor: "court",
    effect: "grey",
    gloss: "a state's avatar greys",
    cues: [
      "annihilat",
      "extinguish",
      "destroy the state",
      "annex",
      "partition",
      "灭",
      "亡",
      "吞并",
      "瓜分",
    ],
  },
  tripods: {
    band: 7,
    places: "route",
    actor: "labourer",
    count: 3,
    gloss: "the royal tripods are carried off",
    cues: ["tripod", "鼎", "九鼎"],
  },

  // --- the Annals ------------------------------------------------------
  // Authored history only. Each carries a band so its caption groups with
  // the played kinds, and none of them is offered to the coder, the
  // fallback, or the random stager (`directionsFor`).
  decree: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "clerk",
    effect: "scroll",
    gloss: "a proclamation is read out and posted",
  },
  enthrone: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "court",
    effect: "bell",
    gloss: "a ruler takes the seat and the bells are struck",
  },
  abdicate: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "court",
    gloss: "a ruler gives the seat away and steps down",
  },
  debate: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "scholar",
    count: 4,
    gloss: "two files of scholars argue and one of them stands",
  },
  divine: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "diviner",
    gloss: "a shell is cracked and the answer is read off it",
  },
  funeral: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "court",
    count: 4,
    effect: "bell",
    gloss: "a body is carried out and the court stands in white",
  },
  measure: {
    band: 0,
    scope: "annals",
    places: "home",
    actor: "clerk",
    effect: "bronze",
    gloss: "one axle, one script, one weight: the standards are laid down",
  },
  audience: {
    band: 1,
    scope: "annals",
    places: "home",
    actor: "envoy",
    gloss: "a visitor is received before the dais and speaks",
  },
  covenant: {
    band: 1,
    scope: "annals",
    places: "at",
    actor: "court",
    count: 3,
    effect: "bronze",
    gloss: "an oath is sworn over a victim at an altar",
  },
  "jade-return": {
    band: 1,
    scope: "annals",
    places: "route",
    actor: "minister",
    effect: "jade",
    gloss: "a treasure is carried out of a court and brought home whole",
  },
  mint: {
    band: 2,
    scope: "annals",
    places: "home",
    actor: "clerk",
    effect: "coin",
    gloss: "coin is cast and the weight on it is changed",
  },
  "canal-cut": {
    band: 3,
    scope: "annals",
    places: "at",
    actor: "engineer",
    count: 4,
    effect: "splash",
    gloss: "a channel is cut and the water is let into it",
  },
  "tally-split": {
    band: 4,
    scope: "annals",
    places: "route",
    actor: "herald",
    effect: "tally",
    gloss: "the halves of a tiger tally travel to be matched at a camp",
  },
  usurp: {
    band: 5,
    scope: "annals",
    places: "home",
    actor: "chancellor",
    effect: "banner",
    gloss: "a minister's house takes the seat it served",
  },
  flee: {
    band: 5,
    scope: "annals",
    places: "route",
    actor: "retainer",
    count: 2,
    gloss: "a figure leaves a place at speed and is not received at the next",
  },
  assassinate: {
    band: 6,
    scope: "annals",
    places: "at",
    actor: "assassin",
    gloss: "a knife comes out where no weapon was allowed",
  },
  duel: {
    band: 6,
    scope: "annals",
    places: "at",
    actor: "general",
    effect: "arrows",
    gloss: "two commanders meet and one of them does not leave",
  },
  oxen: {
    band: 6,
    scope: "annals",
    places: "route",
    actor: "ox",
    count: 6,
    effect: "oxen-fire",
    gloss:
      "beasts with blades on their horns and fire at their tails charge out",
  },
  "tomb-burn": {
    band: 7,
    scope: "annals",
    places: "at",
    actor: "infantry",
    effect: "fire",
    gloss: "the ancestral tombs of a house are opened and fired",
  },
  bury: {
    band: 7,
    scope: "annals",
    places: "at",
    actor: "infantry",
    count: 6,
    effect: "stele",
    gloss: "ground is covered over an army and a stone is set on it",
  },
  surrender: {
    band: 7,
    scope: "annals",
    places: "at",
    actor: "court",
    gloss: "a gate opens without a fight and the seals are handed over",
  },
  partition: {
    band: 7,
    scope: "annals",
    places: "at",
    actor: "court",
    count: 3,
    effect: "grey",
    gloss: "a state is divided among the houses that held it",
  },
};

export const DIRECTION_KINDS = Object.keys(DIRECTIONS) as StageDirectionKind[];

export const scopeOf = (kind: StageDirectionKind): DirectionScope =>
  DIRECTIONS[kind].scope ?? "game";

/**
 * The kinds one scope may use. `game` is the played vocabulary and is what
 * the coder prompt, the fallback, and the random stager see; `annals` is
 * every kind, because an authored episode marches columns and lays sieges
 * like any other sequence and needs the historical kinds besides.
 */
export const directionsFor = (scope: DirectionScope): StageDirectionKind[] =>
  scope === "annals"
    ? DIRECTION_KINDS
    : DIRECTION_KINDS.filter((kind) => scopeOf(kind) === "game");

/** the played vocabulary, computed once */
export const GAME_KINDS: StageDirectionKind[] = directionsFor("game");

export const ARCHETYPES: StageArchetype[] = [
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
  "dowager",
  "chancellor",
  "minister",
  "eunuch",
  "herald",
  "guard",
  "diviner",
  "physician",
  "executioner",
  "persuader",
  "retainer",
  "spy",
  "engineer",
  "horse-archer",
  "charioteer",
  "drummer",
  "standard-bearer",
  "ox",
];

export const EFFECTS: StageEffect[] = [
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
  "night",
  "rain",
  "snow",
  "torch",
  "jade",
  "tally",
  "bronze",
  "bell",
  "stele",
  "oxen-fire",
];

/**
 * The archetypes and effects the played vocabulary names. The coder is
 * offered these rather than the whole list, because an archetype the Annals
 * added (the ox, the executioner, the dowager) belongs to a scene a model
 * never codes, and naming it in the prompt is an invitation to reach for it.
 * Validation still accepts every member of `ARCHETYPES` and `EFFECTS`.
 */
export const GAME_ARCHETYPES: StageArchetype[] = ARCHETYPES.filter(
  (archetype) =>
    GAME_KINDS.some((kind) => DIRECTIONS[kind].actor === archetype),
);

export const GAME_EFFECTS: StageEffect[] = EFFECTS.filter((effect) =>
  GAME_KINDS.some((kind) => DIRECTIONS[kind].effect === effect),
);

/** the eight bands of plan §3.1, by index */
export const BANDS: string[] = [
  "Ordinary",
  "Envoys and petitions",
  "Subversion and coin",
  "Grain and roads",
  "Levies and posture",
  "Seizure and raids",
  "War",
  "Annihilation",
];

export const BAND_COUNT = BANDS.length;

/**
 * The band a rung falls in. An eight-rung ladder maps rung to band; a
 * shorter ladder (the prologue has seven) stretches over the bands so its
 * top rung is annihilation and its bottom is ordinary.
 */
export const bandOf = (rung: number, ladderLength: number): number => {
  if (!Number.isFinite(rung)) return 0;
  const top = Math.max(ladderLength - 1, 1);
  const clamped = Math.min(Math.max(Math.round(rung), 0), top);
  if (ladderLength >= BAND_COUNT) return Math.min(clamped, BAND_COUNT - 1);
  return Math.round((clamped * (BAND_COUNT - 1)) / top);
};

/** the played kinds of one band, in vocabulary order */
export const directionsInBand = (band: number): StageDirectionKind[] =>
  GAME_KINDS.filter((kind) => DIRECTIONS[kind].band === band);

/** the consequence a band shows at the focus when no interaction derives one */
export const CONSEQUENCES: Record<number, StageDirectionKind | null> = {
  0: null,
  1: null,
  2: "toll",
  3: "granary-close",
  4: "garrison",
  5: "raid",
  6: "battle",
  7: "sack",
};
