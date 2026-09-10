/**
 * The almanac: the twelve months of the Xia calendar as the *Yueling* orders
 * them, each with the signs the pentads name, the ordinance, the weather, and
 * the light, so a site can be shown in any month of its year rather than in
 * one undated day. The months are shared by every site; what each site does
 * in them is its own `SiteYear` (`sites/years/`).
 *
 * Browser-safe and import-light: the scene reads the decor rules, the page
 * reads the months, and the spec holds both to the sources. Nothing here
 * reaches a model; a season is not a treatment on the bench (plan §7).
 *
 * Sources are lake ids with the line the passage starts on: `liji-zh` 月令
 * from line 1575, `yizhoushu-zh` 時訓解 from line 166 (the pentads),
 * `shijing-zh` 七月 from line 3823, `lvshichunqiu-zh` 十二紀 from line 1162.
 */
import type { Decor } from "./catalog";
import type { Localized } from "./legend";
import type { StageArchetype, StageEffect } from "../lib/types";

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Season = "spring" | "summer" | "autumn" | "winter";

export const MONTH_IDS: readonly Month[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];
export const SEASONS: readonly Season[] = [
  "spring",
  "summer",
  "autumn",
  "winter",
];

export const seasonOf = (month: Month): Season =>
  month <= 3
    ? "spring"
    : month <= 6
      ? "summer"
      : month <= 9
        ? "autumn"
        : "winter";

export const SEASON_LABELS: Record<Season, Localized> = {
  spring: { en: "spring", zh: "春" },
  summer: { en: "summer", zh: "夏" },
  autumn: { en: "autumn", zh: "秋" },
  winter: { en: "winter", zh: "冬" },
};

/** A passage in the lake: the document id and the line it starts on. */
export interface Cite {
  id: string;
  line?: number;
  /** what the passage is, for the page */
  note?: string;
}

/** The grade the scene lays over the view: the season's light. */
export type Light = "warm" | "amber" | "cold";

export interface MonthRecord {
  month: Month;
  /** the *Yueling*'s name (孟春 … 季冬) and a gloss */
  name: Localized;
  season: Season;
  /** the two solar terms the month spans */
  terms: Localized;
  /** the six pentads the *Yizhoushu* gives the month, in order */
  pentads: Localized[];
  /** what the month is for and what it forbids, after the *Yueling* */
  ordinance: Localized;
  /** the weather the scene draws, and how often a beat brings it */
  weather?: { kind: "snow" | "rain"; chance: number };
  light?: Light;
  /** whether the geese cross the sky */
  geese?: boolean;
  sources: Cite[];
}

const LIJI = (line: number, note: string): Cite => ({
  id: "liji-zh",
  line,
  note,
});
const PENTADS = (line: number): Cite => ({
  id: "yizhoushu-zh",
  line,
  note: "時訓解, the pentads",
});
const QIYUE: Cite = { id: "shijing-zh", line: 3823, note: "豳風·七月" };

export const MONTHS: readonly MonthRecord[] = [
  {
    month: 1,
    name: { en: "First month of spring", zh: "孟春" },
    season: "spring",
    terms: { en: "Start of Spring · Rain Water", zh: "立春·雨水" },
    pentads: [
      { en: "The east wind loosens the ice.", zh: "東風解凍" },
      { en: "The creatures that slept begin to stir.", zh: "蟄蟲始振" },
      { en: "The fish rise to the ice.", zh: "魚上冰" },
      { en: "The otter lays out its fish.", zh: "獺祭魚" },
      { en: "The wild geese come north.", zh: "鴻雁來" },
      { en: "The grass and the trees put out shoots.", zh: "草木萌動" },
    ],
    ordinance: {
      en: "The king prays for grain and ploughs the sacred field with his own hand; the field boundaries are repaired and the paths straightened. No tree is felled, no nest overturned, and no arms are raised.",
      zh: "天子祈穀于上帝，躬耕帝藉；修封疆，審端徑術。禁止伐木，毋覆巢，不可以稱兵。",
    },
    weather: { kind: "snow", chance: 0.15 },
    light: "cold",
    sources: [LIJI(1575, "月令 孟春"), PENTADS(166), QIYUE],
  },
  {
    month: 2,
    name: { en: "Second month of spring", zh: "仲春" },
    season: "spring",
    terms: { en: "Waking of Insects · Spring Equinox", zh: "驚蟄·春分" },
    pentads: [
      { en: "The peach begins to flower.", zh: "桃始華" },
      { en: "The oriole sings.", zh: "倉庚鳴" },
      { en: "The hawk turns into a dove.", zh: "鷹化為鳩" },
      { en: "The swallows arrive.", zh: "玄鳥至" },
      { en: "The thunder speaks.", zh: "雷乃發聲" },
      { en: "The lightning begins.", zh: "始電" },
    ],
    ordinance: {
      en: "On a chosen day the people sacrifice at the altar of the soil. Streams and pools are not drained, no wood is burned, the young and the small are nursed, and the prisons are lightened.",
      zh: "擇元日，命民社。毋竭川澤，毋漉陂池，毋焚山林；安萌芽，養幼少；省囹圄。",
    },
    weather: { kind: "rain", chance: 0.2 },
    sources: [LIJI(1590, "月令 仲春"), PENTADS(166), QIYUE],
  },
  {
    month: 3,
    name: { en: "Last month of spring", zh: "季春" },
    season: "spring",
    terms: { en: "Pure Brightness · Grain Rain", zh: "清明·穀雨" },
    pentads: [
      { en: "The paulownia flowers.", zh: "桐始華" },
      { en: "The field mice turn into quail.", zh: "田鼠化為鴽" },
      { en: "The rainbow is first seen.", zh: "虹始見" },
      { en: "The duckweed begins to grow.", zh: "萍始生" },
      { en: "The cooing dove preens its wings.", zh: "鳴鳩拂其羽" },
      { en: "The hoopoe alights on the mulberry.", zh: "戴勝降于桑" },
    ],
    ordinance: {
      en: "No mulberry is cut. The queen goes east to pick the leaves herself and the silkworm work begins; the dykes are repaired and the ditches cleared. The nets of the hunt do not leave the nine gates.",
      zh: "命野虞毋伐桑柘；后妃親東鄉躬桑，蠶事既登。修利隄防，道達溝瀆。田獵罝罘不出九門。",
    },
    weather: { kind: "rain", chance: 0.25 },
    sources: [
      LIJI(1604, "月令 季春"),
      { id: "huainanzi-zh", line: 293, note: "時則訓: 毋伐桑柘" },
      PENTADS(166),
      QIYUE,
    ],
  },
  {
    month: 4,
    name: { en: "First month of summer", zh: "孟夏" },
    season: "summer",
    terms: { en: "Start of Summer · Grain Full", zh: "立夏·小滿" },
    pentads: [
      { en: "The mole cricket sings.", zh: "螻蟈鳴" },
      { en: "The earthworms come out.", zh: "蚯蚓出" },
      { en: "The wild cucumber grows.", zh: "王瓜生" },
      { en: "The sow thistle flowers.", zh: "苦菜秀" },
      { en: "The tender grasses die.", zh: "靡草死" },
      { en: "The wheat harvest comes.", zh: "麥秋至" },
    ],
    ordinance: {
      en: "The officers go out to the fields to encourage the farmers, that no season be lost. The wheat is brought in and the cocoons are presented; the silk tax is taken. No great hunt, and the beasts are driven from the grain.",
      zh: "命野虞出行田原，勞農勸民，毋或失時。農乃登麥；蠶事畢，后妃獻繭，乃收繭稅。毋大田獵，驅獸毋害五穀。",
    },
    weather: { kind: "rain", chance: 0.3 },
    light: "warm",
    sources: [LIJI(1618, "月令 孟夏"), PENTADS(166), QIYUE],
  },
  {
    month: 5,
    name: { en: "Second month of summer", zh: "仲夏" },
    season: "summer",
    terms: { en: "Grain in Ear · Summer Solstice", zh: "芒種·夏至" },
    pentads: [
      { en: "The mantis is born.", zh: "螳蜋生" },
      { en: "The shrike begins to cry.", zh: "鵙始鳴" },
      { en: "The mockingbird falls silent.", zh: "反舌無聲" },
      { en: "The deer shed their horns.", zh: "鹿角解" },
      { en: "The cicada begins to sing.", zh: "蜩始鳴" },
      { en: "The pinellia sprouts.", zh: "半夏生" },
    ],
    ordinance: {
      en: "The great rain sacrifice is offered and the hills and springs are prayed to for the people. The millet comes in. At the longest day the gentleman fasts, keeps to his rooms, and stills his mind; no fire is lit to the south.",
      zh: "命有司為民祈祀山川百源，大雩帝。農乃登黍。日長至，君子齊戒，處必掩身，毋用火南方。",
    },
    weather: { kind: "rain", chance: 0.4 },
    light: "warm",
    sources: [LIJI(1627, "月令 仲夏"), PENTADS(166), QIYUE],
  },
  {
    month: 6,
    name: { en: "Last month of summer", zh: "季夏" },
    season: "summer",
    terms: { en: "Minor Heat · Major Heat", zh: "小暑·大暑" },
    pentads: [
      { en: "The warm wind arrives.", zh: "溫風至" },
      { en: "The cricket lives in the wall.", zh: "蟋蟀居壁" },
      { en: "The young hawk learns to fly.", zh: "鷹乃學習" },
      { en: "Rotten grass becomes fireflies.", zh: "腐草為螢" },
      { en: "The earth is soaked and the heat steams.", zh: "土潤溽暑" },
      { en: "The great rains fall in their season.", zh: "大雨時行" },
    ],
    ordinance: {
      en: "The trees are in full leaf and the foresters let no one cut them. No earthworks are raised, no lords assembled, no army moved. The weeds are cut and burned and water run over them to manure the fields.",
      zh: "樹木方盛，命虞人入山行木，毋有斬伐。不可以興土功，不可以合諸侯，不可以起兵動眾。燒薙行水，利以殺草，可以糞田疇。",
    },
    weather: { kind: "rain", chance: 0.5 },
    light: "warm",
    sources: [LIJI(1640, "月令 季夏"), PENTADS(166), QIYUE],
  },
  {
    month: 7,
    name: { en: "First month of autumn", zh: "孟秋" },
    season: "autumn",
    terms: { en: "Start of Autumn · End of Heat", zh: "立秋·處暑" },
    pentads: [
      { en: "The cool wind arrives.", zh: "涼風至" },
      { en: "The white dew falls.", zh: "白露降" },
      { en: "The cold cicada sings.", zh: "寒蟬鳴" },
      { en: "The hawk lays out its birds.", zh: "鷹乃祭鳥" },
      { en: "Heaven and earth grow stern.", zh: "天地始肅" },
      { en: "The farmers bring in the grain.", zh: "農乃登穀" },
    ],
    ordinance: {
      en: "The first grain is tasted by the king and offered at the temple. The dykes are finished and the breaches stopped against the floods; the walls and the houses are repaired. The generals choose their men and sharpen their weapons.",
      zh: "農乃登穀，天子嘗新，先薦寢廟。完隄防，謹壅塞，以備水潦；修宮室，坏牆垣，補城郭。命將帥選士厲兵。",
    },
    weather: { kind: "rain", chance: 0.2 },
    sources: [LIJI(1651, "月令 孟秋"), PENTADS(166), QIYUE],
  },
  {
    month: 8,
    name: { en: "Second month of autumn", zh: "仲秋" },
    season: "autumn",
    terms: { en: "White Dew · Autumn Equinox", zh: "白露·秋分" },
    pentads: [
      { en: "The wild geese come south.", zh: "鴻雁來" },
      { en: "The swallows return.", zh: "玄鳥歸" },
      { en: "The birds store their food.", zh: "群鳥養羞" },
      { en: "The thunder is stilled.", zh: "雷始收聲" },
      { en: "The creatures that sleep seal their doors.", zh: "蟄蟲坏戶" },
      { en: "The waters begin to dry.", zh: "水始涸" },
    ],
    ordinance: {
      en: "The old are cared for and given stools and staves. The people are hurried to gather and store, and to sow the wheat before the season passes. Day and night are equal, so the measures and weights are made true, and the gates and markets are eased for the merchants.",
      zh: "養衰老，授几杖。趣民收斂，務畜菜，多積聚；乃勸種麥，毋或失時。日夜分，同度量，平權衡；易關市，來商旅。",
    },
    geese: true,
    sources: [LIJI(1658, "月令 仲秋"), PENTADS(166), QIYUE],
  },
  {
    month: 9,
    name: { en: "Last month of autumn", zh: "季秋" },
    season: "autumn",
    terms: { en: "Cold Dew · Frost Descent", zh: "寒露·霜降" },
    pentads: [
      { en: "The geese arrive as guests.", zh: "鴻雁來賓" },
      {
        en: "The sparrows go into the sea and become clams.",
        zh: "雀入大水為蛤",
      },
      { en: "The chrysanthemum shows yellow.", zh: "鞠有黃華" },
      { en: "The dhole lays out its beasts.", zh: "豺乃祭獸" },
      { en: "The grass and the trees yellow and fall.", zh: "草木黃落" },
      { en: "The creatures that sleep all go under.", zh: "蟄蟲咸俯" },
    ],
    ordinance: {
      en: "The harvest is all in and the sacred field's grain is stored in the spirit granary. As the leaves fall the timber is cut for charcoal; the king teaches the hunt as a drill of arms. The doors are plastered against the cold.",
      zh: "農事備收，藏帝藉之收於神倉。草木黃落，乃伐薪為炭；天子乃教於田獵，以習五戎。蟄蟲咸俯在內，皆墐其戶。",
    },
    geese: true,
    light: "amber",
    sources: [LIJI(1672, "月令 季秋"), PENTADS(166), QIYUE],
  },
  {
    month: 10,
    name: { en: "First month of winter", zh: "孟冬" },
    season: "winter",
    terms: { en: "Start of Winter · Minor Snow", zh: "立冬·小雪" },
    pentads: [
      { en: "The water begins to freeze.", zh: "水始冰" },
      { en: "The ground begins to harden.", zh: "地始凍" },
      {
        en: "The pheasants go into the sea and become oysters.",
        zh: "雉入大水為蜃",
      },
      { en: "The rainbow hides.", zh: "虹藏不見" },
      {
        en: "Heaven's breath rises and earth's sinks.",
        zh: "天氣上騰，地氣下降",
      },
      { en: "All is shut up and winter is made.", zh: "閉塞而成冬" },
    ],
    ordinance: {
      en: "The king puts on furs. Everything is stored and covered; the walls are strengthened, the gates guarded, the locks repaired. The prayer for the coming year is made, the offering to the ancestors and the five household spirits is laid, and the great winter feast is drunk.",
      zh: "天子始裘。命百官謹蓋藏；坏城郭，戒門閭，修鍵閉。天子乃祈來年于天宗，臘先祖五祀，大飲烝。",
    },
    weather: { kind: "snow", chance: 0.2 },
    light: "cold",
    sources: [LIJI(1690, "月令 孟冬"), PENTADS(166), QIYUE],
  },
  {
    month: 11,
    name: { en: "Second month of winter", zh: "仲冬" },
    season: "winter",
    terms: { en: "Major Snow · Winter Solstice", zh: "大雪·冬至" },
    pentads: [
      { en: "The ice thickens.", zh: "冰益壯" },
      { en: "The ground begins to crack.", zh: "地始坼" },
      { en: "The night bird is silent.", zh: "鶡旦不鳴" },
      { en: "The tigers begin to pair.", zh: "虎始交" },
      { en: "The rue begins to grow.", zh: "芸始生" },
      {
        en: "The elk shed their horns and the springs stir.",
        zh: "麋角解，水泉動",
      },
    ],
    ordinance: {
      en: "At the shortest day the gentleman fasts and keeps within. No earthwork is begun, no roof opened, no levy raised. The brewers are ordered to have the grain ready and the yeast in season; a beast let stray or a store left out is anyone's to take.",
      zh: "日短至，君子齊戒，處必掩身。土事毋作，慎毋發蓋，毋發室屋，及起大眾。乃命大酋，秫稻必齊，麴糵必時。農有不收藏積聚者，馬牛畜獸有放佚者，取之不詰。",
    },
    weather: { kind: "snow", chance: 0.4 },
    light: "cold",
    sources: [LIJI(1704, "月令 仲冬"), PENTADS(166), QIYUE],
  },
  {
    month: 12,
    name: { en: "Last month of winter", zh: "季冬" },
    season: "winter",
    terms: { en: "Minor Cold · Major Cold", zh: "小寒·大寒" },
    pentads: [
      { en: "The geese turn north.", zh: "雁北鄉" },
      { en: "The magpie begins its nest.", zh: "鵲始巢" },
      { en: "The pheasant cries.", zh: "雉雊" },
      { en: "The hen broods.", zh: "雞乳" },
      { en: "The birds of prey strike hard.", zh: "征鳥厲疾" },
      { en: "The waters are frozen to the bottom.", zh: "水澤腹堅" },
    ],
    ordinance: {
      en: "The great exorcism drives out the year and a clay ox is carried out to send off the cold. The ice is cut while it is thickest and stored. The seed grain is issued, the farmers are set to pair their ploughing, and the ploughshares are mended and the field tools made ready.",
      zh: "命有司大難，旁磔，出土牛以送寒氣。冰方盛，水澤腹堅，命取冰。令告民出五種，命農計耦耕事，修耒耜，具田器。",
    },
    weather: { kind: "snow", chance: 0.4 },
    light: "cold",
    sources: [
      LIJI(1721, "月令 季冬"),
      { id: "zhouli-zh", note: "天官·凌人: the ice cut in the twelfth month" },
      PENTADS(166),
      QIYUE,
    ],
  },
];

export const monthRecord = (month: Month): MonthRecord => MONTHS[month - 1];

/**
 * The month the page opens on: the Xia year begins about February, so the
 * Gregorian month less one, and January is the last month of the old year.
 */
export const monthOfToday = (date: Date = new Date()): Month =>
  (((date.getMonth() + 11) % 12) + 1) as Month;

export const parseMonth = (value: string | null | undefined): Month | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? (n as Month) : null;
};

/**
 * The decor whose presence is seasonal, and the months it stands in. The
 * haystack rises with the harvest and is eaten by spring; the hemp stands
 * from sowing to retting; the lotus from leaf to seed; the ducks and the
 * sheep are on the water and the meadow while there is grass. Everything
 * else stands all year. Months wrap (the haystack runs 8 → 1).
 */
export const DECOR_MONTHS: Partial<Record<Decor, readonly Month[]>> = {
  haystack: [8, 9, 10, 11, 12, 1],
  hemp: [4, 5, 6, 7, 8],
  lotus: [5, 6, 7, 8, 9],
  ducks: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  sheep: [3, 4, 5, 6, 7, 8, 9, 10],
  // the registered village: the ice cut in the twelfth month and stacked on
  // the bank until it goes into the ice house; the melons of the seventh
  // month and the gourds of the eighth (七月食瓜，八月斷壺); the target stood
  // up for the drill of the eleventh; the levy's cartload of the ninth and
  // tenth; the coffin and the bier of the house's eleventh month
  ice: [12, 1, 2],
  melons: [5, 6, 7],
  gourds: [6, 7, 8],
  target: [11],
  cartload: [9, 10],
  coffin: [11],
  bier: [11],
  mingjing: [11],
  torches: [11, 12],
  victims: [4, 7, 10, 1],
  icecart: [12, 2, 6],
  caps: [2],
};

export const isShownInMonth = (decor: string, month: Month): boolean => {
  const months = DECOR_MONTHS[decor as Decor];
  return months === undefined || months.includes(month);
};

/**
 * The decor drawn once per season it changes in: the asset id the scene
 * shows in place of the plain one. Spring is the plain drawing (the plum in
 * blossom, the willow and the lotus in leaf); a season not named keeps the
 * plain drawing too.
 */
export const SEASONAL_DECOR: Partial<
  Record<Decor, Partial<Record<Season, string>>>
> = {
  plum: {
    summer: "decor.plum~summer",
    autumn: "decor.plum~summer",
    winter: "decor.plum~winter",
  },
  willow: { autumn: "decor.willow~autumn", winter: "decor.willow~winter" },
  lotus: { summer: "decor.lotus~summer", autumn: "decor.lotus~autumn" },
  // the jujube in red fruit in the eighth month (八月剝棗), the peach in
  // blossom in the spring (桃始華)
  jujube: { autumn: "decor.jujube~autumn" },
  peach: { spring: "decor.peach~spring" },
};

/** The asset a decor wears in a season, or its plain id. */
export const seasonalDecorId = (decor: string, season: Season): string => {
  const variants = SEASONAL_DECOR[decor as Decor];
  return variants?.[season] ?? `decor.${decor}`;
};

/** The id of a ground sheet as a season turns it: `terrain.field~autumn`. */
export const seasonalSheetId = (id: string, season: Season): string =>
  `${id}~${season}`;

/** `terrain.field~autumn` → { id: "terrain.field", season: "autumn" }. */
export const parseSeasonalId = (
  id: string,
): { id: string; season: Season } | null => {
  const at = id.lastIndexOf("~");
  if (at < 0) return null;
  const season = id.slice(at + 1) as Season;
  return SEASONS.includes(season) ? { id: id.slice(0, at), season } : null;
};

// --- the year, per site ---

export type TaskKind = "labour" | "till" | "stroll" | "gather";

/**
 * One thing a site's people do in a month. `who` is an archetype of the
 * site's people; the places are the site's; `weight` is how often the
 * ambient loop draws it (default 1); `line` is what the day log writes.
 */
export interface Task {
  who: StageArchetype;
  kind: TaskKind;
  at?: string;
  from?: string;
  to?: string;
  count?: number;
  weight?: number;
  effect?: StageEffect;
  line: Localized;
}

/** An observance of the month: a `rite` beat played once when the month opens. */
export interface Rite {
  title: Localized;
  who: StageArchetype;
  at: string;
  count?: number;
  effect?: StageEffect;
  line: Localized;
  cite: Cite;
}

export interface MonthPlan {
  /** what this site does this month, one or two sentences */
  note: Localized;
  tasks: Task[];
  rites?: Rite[];
}

export type SiteYear = Record<Month, MonthPlan>;

/** How often the ambient loop draws a task rather than a plain stroll. */
export const TASK_SHARE = 0.7;
