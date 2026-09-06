/**
 * The settlement: a model town of the period, drawn on the same stage as the
 * overworld but from its own map (`art/settlement/geography.json`, built by
 * `npm run stage:settlement`). It is a composite rather than a survey of one
 * site: the twin-city plan is Lingshou's (the Zhongshan capital at Sanji:
 * palace terraces along the north of the east city, offices and wards south
 * of them, the royal tombs in the north of the west city and the market,
 * orchards, and workshops below), the three gates a side and the temple-left,
 * altar-right rule are the Kaogongji's, the market well and the trades kept
 * to their own quarter are the Guanzi's, and the standing wall with its moat
 * is Xue's. No chapter is set here and no seat marches to it: the town is a
 * place for a reader to walk, and its people are the townsfolk the registers
 * counted rather than the courts the games are played between.
 *
 * Browser-safe: the node build imports it to check the map's places against
 * the names, and the page imports it to label them.
 */
import type { FeatureNote, Localized } from "./legend";
import type { StageArchetype } from "../lib/types";
import type { StageSet } from "./sets";

/** the built maps per set, beside the overworld's */
export const settlementMapOf = (
  set: StageSet,
): { url: string; features: string } => ({
  url: set.tile === 32 ? "/stage/settlement32.tmj" : "/stage/settlement.tmj",
  features: "/stage/settlement.features.json",
});

/** the one seat the town's directions act for; it never flies a flag */
export const TOWN_SEAT = "town";

/** every place the settlement map carries, named in both languages */
export const SETTLEMENT_NAMES: Record<string, Localized> = {
  palace: { en: "The Great Hall", zh: "大殿" },
  altar: { en: "Altar of Soil", zh: "社稷坛" },
  temple: { en: "Ancestral Temple", zh: "宗庙" },
  harem: { en: "Inner Palace", zh: "后宫" },
  archive: { en: "Hall of Records", zh: "藏室" },
  court: { en: "the court", zh: "朝" },
  office: { en: "Magistrate's Office", zh: "官署" },
  treasury: { en: "State Granary", zh: "太仓" },
  barracks: { en: "Garrison", zh: "营" },
  stable: { en: "Royal Stable", zh: "厩" },
  minister: { en: "Minister's House", zh: "卿第" },
  chancellor: { en: "Chancellor's House", zh: "相府" },
  "ward-1": { en: "East Ward", zh: "东里" },
  "ward-2": { en: "Gate Ward", zh: "门里" },
  "ward-3": { en: "Middle Ward", zh: "中里" },
  "ward-4": { en: "Well Ward", zh: "井里" },
  "ward-5": { en: "Elm Ward", zh: "榆里" },
  "ward-6": { en: "Corner Ward", zh: "隅里" },
  "ward-7": { en: "Granary Ward", zh: "仓里" },
  "ward-8": { en: "Stable Ward", zh: "厩里" },
  "ward-9": { en: "West Ward", zh: "西里" },
  "ward-10": { en: "Market Ward", zh: "市里" },
  tombs: { en: "the royal tombs", zh: "王陵" },
  orchard: { en: "the mulberry orchard", zh: "桑园" },
  market: { en: "Market Well", zh: "市井" },
  "stall-east": { en: "Grain Row", zh: "粟肆" },
  "stall-west": { en: "Cloth Row", zh: "布肆" },
  "stall-south": { en: "Meat Row", zh: "肉肆" },
  "stall-north": { en: "Pottery Row", zh: "陶肆" },
  kiln: { en: "Pottery Kiln", zh: "陶窑" },
  foundry: { en: "Bronze Foundry", zh: "铸铜坊" },
  smithy: { en: "Iron Smithy", zh: "铁冶" },
  dyeworks: { en: "Dyeworks", zh: "染坊" },
  carpenter: { en: "Carpenter's Shed", zh: "木工坊" },
  jadeworks: { en: "Jade Grinder's", zh: "玉作" },
  "gate-south": { en: "South Gate", zh: "南门" },
  "gate-east": { en: "East Gate", zh: "东门" },
  "gate-west": { en: "West Gate", zh: "西门" },
  "gate-north": { en: "North Gate", zh: "北门" },
  "gate-north-2": { en: "Little North Gate", zh: "北小门" },
  "gate-east-2": { en: "Upper East Gate", zh: "东上门" },
  "gate-east-3": { en: "Lower East Gate", zh: "东下门" },
  "gate-west-2": { en: "Upper West Gate", zh: "西上门" },
  "gate-west-3": { en: "Lower West Gate", zh: "西下门" },
  "gate-west-south": { en: "Market Gate", zh: "市门" },
  "gate-inner": { en: "Tomb Gate", zh: "陵门" },
  "gate-inner-2": { en: "Middle Gate", zh: "中门" },
  "gate-palace": { en: "Palace Gate", zh: "宫门" },
  "tower-ne": { en: "Northeast Tower", zh: "东北楼" },
  "tower-se": { en: "Southeast Tower", zh: "东南楼" },
  "tower-sw": { en: "Southwest Tower", zh: "西南楼" },
  "tower-nw": { en: "Northwest Tower", zh: "西北楼" },
  "tower-n": { en: "North Tower", zh: "北楼" },
  ferry: { en: "The Ferry", zh: "津" },
  bridge: { en: "Moat Bridge", zh: "濠桥" },
  "fields-east": { en: "the east fields", zh: "东郊" },
  "fields-west": { en: "the west fields", zh: "西郊" },
  "fields-south": { en: "the river fields", zh: "南郊" },
  hills: { en: "the hills", zh: "山" },
  stream: { en: "the river", zh: "水" },
  moat: { en: "the moat", zh: "城濠" },
  beacon: { en: "Beacon", zh: "烽" },
};

/** the named ground the map draws: what a click on a wall or an avenue reads */
export const SETTLEMENT_FEATURES: Record<string, FeatureNote> = {
  stream: {
    title: { en: "The river", zh: "河" },
    what: {
      en: "The river the town stands above, with its ferry and its fields.",
      zh: "城所临之河，有津有田。",
    },
    history: {
      en: "A capital sat on water: the Zhongshan capital above the Hutuo, Linzi on the Zi, Handan between two streams. The river fed the moat, floated timber and grain to the gate, and drew the line the Fangmatan boards traced first.",
      zh: "都城必临水：灵寿临滹沱，临淄临淄水，邯郸夹二水。河注城濠，浮木粟至门，放马滩图所先画者亦此。",
    },
  },
  moat: {
    title: { en: "The moat", zh: "城濠" },
    what: {
      en: "Water drawn round the outside of the wall, two tiles wide, crossed at the gates.",
      zh: "环城之水，宽二格，门前有桥。",
    },
    history: {
      en: "The earth for a rammed wall came out of the ditch beside it, so a wall and a moat are one work. The Mohist chapters want the moat deep and the bridge at the gate one that can be cut.",
      zh: "夯城之土出于旁壕，故城与濠为一功。墨子备城门欲濠深，门前之桥可断。",
    },
  },
  citywall: {
    title: { en: "The city wall", zh: "城垣" },
    what: {
      en: "The rammed-earth wall round both cities, with its gates and corner towers.",
      zh: "环两城之夯土墙，有门有角楼。",
    },
    history: {
      en: "Xue's still stands four to eight metres high on a base up to forty wide; the Zhongshan capital's enclosed four and a half kilometres by four. A wall was raised by the wards in rotation, each family so many days of earth, and the Book of Lord Shang counts it among the things a state must know the measure of.",
      zh: "薛城墙今犹高四至八米，基宽至四十米；灵寿城四千五百米见方。筑城以里轮役，一家若干日之土。商君书以城之大小为国所必知。",
    },
  },
  palacewall: {
    title: { en: "The palace wall", zh: "宫墙" },
    what: {
      en: "An inner wall round the palace terraces, the temple, and the altar.",
      zh: "环宫殿台基、宗庙、社坛之内墙。",
    },
    history: {
      en: "The Kaogongji sets a palace corner two zhi lower than the city's: the ruler's compound is a city inside the city, and the seven rammed-earth platforms at the Zhongshan capital sat inside such a line along the north wall.",
      zh: "考工记宫隅低于城隅二雉：宫为城中之城。灵寿城七座夯土台基即在北垣内此线之中。",
    },
  },
  avenue: {
    title: { en: "The royal way", zh: "御道" },
    what: {
      en: "The avenue from the palace gate through the court and the south gate to the ferry.",
      zh: "自宫门经朝、南门至津之大道。",
    },
    history: {
      en: "The ideal capital's nine avenues run nine chariot tracks wide. This one is the axis: the court in front of the palace, the town below it, and the road out to the river, so that a procession and a grain convoy use the same line.",
      zh: "营国九经九纬，经涂九轨。此为中轴：朝在宫前，城在其下，道出至河，仪仗与粟车同一线。",
    },
  },
  crossway: {
    title: { en: "The cross avenue", zh: "横街" },
    what: {
      en: "The avenue from the west gate through the market and both cities to the east gate.",
      zh: "自西门经市、两城至东门之横街。",
    },
    history: {
      en: "The market's traffic and the wards' meet on it, which is where the Guanzi puts the merchants: at the well, on the road, and away from the offices and the fields.",
      zh: "市之往来与里之往来会于此，管子所以处商于市井、于道、而远官府与田者也。",
    },
  },
};

/**
 * The townsfolk: who walks the town in the ambient loop, and where each is
 * found at work. `home` is where a labour beat stands the figure; a figure
 * with no home only strolls.
 */
export interface Townsperson {
  archetype: StageArchetype;
  /** class, then craft: the order the registers and the Guanzi sort people by */
  order:
    "official" | "artisan" | "merchant" | "farmer" | "household" | "convict";
  label: Localized;
  home?: string;
}

export const TOWNSFOLK: readonly Townsperson[] = [
  {
    archetype: "overseer",
    order: "official",
    label: { en: "market superintendent", zh: "司市" },
    home: "market",
  },
  {
    archetype: "clerk",
    order: "official",
    label: { en: "registrar", zh: "书吏" },
    home: "office",
  },
  {
    archetype: "guard",
    order: "official",
    label: { en: "gate guard", zh: "门卒" },
    home: "gate-south",
  },
  {
    archetype: "musician",
    order: "official",
    label: { en: "court musician", zh: "乐工" },
    home: "palace",
  },
  {
    archetype: "potter",
    order: "artisan",
    label: { en: "potter", zh: "陶人" },
    home: "kiln",
  },
  {
    archetype: "founder",
    order: "artisan",
    label: { en: "bronze founder", zh: "冶氏" },
    home: "foundry",
  },
  {
    archetype: "smith",
    order: "artisan",
    label: { en: "ironsmith", zh: "铁工" },
    home: "smithy",
  },
  {
    archetype: "carpenter",
    order: "artisan",
    label: { en: "carpenter", zh: "匠人" },
    home: "carpenter",
  },
  {
    archetype: "dyer",
    order: "artisan",
    label: { en: "dyer", zh: "染人" },
    home: "dyeworks",
  },
  {
    archetype: "jadeworker",
    order: "artisan",
    label: { en: "jade grinder", zh: "玉人" },
    home: "jadeworks",
  },
  {
    archetype: "weaver",
    order: "artisan",
    label: { en: "weaver", zh: "织妇" },
    home: "stall-west",
  },
  {
    archetype: "tanner",
    order: "artisan",
    label: { en: "tanner", zh: "鲍人" },
    home: "stall-south",
  },
  {
    archetype: "butcher",
    order: "merchant",
    label: { en: "butcher", zh: "屠" },
    home: "stall-south",
  },
  {
    archetype: "merchant",
    order: "merchant",
    label: { en: "grain dealer", zh: "粟贾" },
    home: "stall-east",
  },
  {
    archetype: "carrier",
    order: "farmer",
    label: { en: "water carrier", zh: "担水者" },
    home: "market",
  },
  {
    archetype: "peasant",
    order: "farmer",
    label: { en: "farmer", zh: "农" },
    home: "fields-south",
  },
  {
    archetype: "ox",
    order: "farmer",
    label: { en: "ox", zh: "牛" },
    home: "treasury",
  },
  {
    archetype: "matron",
    order: "household",
    label: { en: "matron", zh: "主妇" },
    home: "ward-3",
  },
  {
    archetype: "child",
    order: "household",
    label: { en: "child", zh: "童子" },
  },
  {
    archetype: "scholar",
    order: "household",
    label: { en: "retainer", zh: "门客" },
    home: "chancellor",
  },
  {
    archetype: "convict",
    order: "convict",
    label: { en: "convict labourer", zh: "城旦" },
    home: "tombs",
  },
];

/** the places a stroll may start or end: anything with a marker but a tower */
export const STROLL_PLACES: readonly string[] = Object.keys(
  SETTLEMENT_NAMES,
).filter(
  (key) =>
    !key.startsWith("tower-") &&
    !key.startsWith("fields-") &&
    ![
      "hills",
      "stream",
      "moat",
      "court",
      "tombs",
      "orchard",
      "beacon",
    ].includes(key),
);

export const ORDER_LABELS: Record<Townsperson["order"], Localized> = {
  official: { en: "Officials", zh: "官" },
  artisan: { en: "Artisans", zh: "工" },
  merchant: { en: "Merchants", zh: "商" },
  farmer: { en: "Farmers", zh: "农" },
  household: { en: "Households", zh: "户" },
  convict: { en: "Convict labour", zh: "徒" },
};
