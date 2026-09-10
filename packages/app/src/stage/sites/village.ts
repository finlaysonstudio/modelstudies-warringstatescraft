/**
 * The village: a hamlet of the period at about ten metres a tile, drawn from
 * `art/sites/village/geography.json` by `npm run stage:sites`. It is a
 * composite of what the registers, the statutes, and the Odes say a hamlet
 * had: six farmhouses on a lane with a well between them, a granary and a
 * threshing floor, a byre for the shared oxen, the altar of soil on the rise
 * above with the family graves beyond it, mulberry and garden by the houses,
 * millet fields to three sides, a brook with its ford and its pond, and the
 * post station on the road out. No chapter is set here and no seat marches
 * to it; the people are the households a Liye register lists by ward.
 */
import type { FeatureNote, Localized } from "../legend";
import type { Site, Townsperson } from "../site";
import { VILLAGE_YEAR } from "./years/village";

export const VILLAGE_NAMES: Record<string, Localized> = {
  shrine: { en: "Altar of the Soil", zh: "里社" },
  well: { en: "the village well", zh: "里井" },
  granary: { en: "the granary", zh: "仓" },
  "house-1": { en: "the Wang house", zh: "王氏之舍" },
  "house-2": { en: "the Zhang house", zh: "张氏之舍" },
  "house-3": { en: "the weaver's house", zh: "织妇之舍" },
  "house-4": { en: "the Li house", zh: "李氏之舍" },
  "house-5": { en: "the Chen house", zh: "陈氏之舍" },
  "house-6": { en: "the Zhao house", zh: "赵氏之舍" },
  threshing: { en: "the threshing floor", zh: "场" },
  byre: { en: "the byre", zh: "牛牢" },
  ford: { en: "the ford", zh: "津" },
  station: { en: "the post station", zh: "邮" },
  elder: { en: "the elder's house", zh: "里正之舍" },
  orchard: { en: "the mulberry plot", zh: "桑" },
  graves: { en: "the family graves", zh: "族墓" },
  hills: { en: "the hills", zh: "丘" },
  woods: { en: "the woods", zh: "林" },
  "fields-west": { en: "the west fields", zh: "西田" },
  "fields-south": { en: "the south fields", zh: "南田" },
  "fields-east": { en: "the east fields", zh: "东田" },
  pond: { en: "the pond", zh: "陂" },
  marsh: { en: "the marsh", zh: "泽" },
  meadow: { en: "the meadow", zh: "牧" },
};

export const VILLAGE_FEATURES: Record<string, FeatureNote> = {
  brook: {
    title: { en: "The brook", zh: "溪" },
    what: {
      en: "The stream the village drinks from and crosses at the ford.",
      zh: "村所饮之水，涉于津。",
    },
    history: {
      en: "The Fangmatan boards drew a district as its watercourses first and its settlements after, and a hamlet sat where a stream could be crossed and a field watered. The Qin field statutes forbade damming water in the spring, when the fields below needed it, and fined the ward that let a bank fail.",
      zh: "放马滩图先画水道，后画聚落；村居于可涉可溉之处。秦田律春月毋壅水，堤坏罚其里。",
    },
  },
  pond: {
    title: { en: "The pond", zh: "陂" },
    what: {
      en: "Still water beside the brook, for the ducks and the fisher.",
      zh: "溪侧止水，鹜与渔者所在。",
    },
    history: {
      en: "A pond held the brook's water through the dry months and grew the fish, the lotus, and the reeds a household did not have to plant. The same statutes that guarded the spring water forbade poisoning fish and taking them with nets before the summer.",
      zh: "陂蓄溪水以度旱月，生鱼、荷、苇，不待种而有。秦律亦禁毒鱼、夏前置网。",
    },
  },
  lane: {
    title: { en: "The lane", zh: "里道" },
    what: {
      en: "The cart track through the village, from the west fields to the ford and the post road, with a branch up to the altar.",
      zh: "穿村之车道，自西田至津至邮道，一支上至社。",
    },
    history: {
      en: "A hamlet was a lane with houses on it, and the register that counted it went door by door along the lane. The post station on the road out is how a county's orders reached the ward and how the ward's grain and its conscripts went the other way.",
      zh: "村者一道两旁之舍，籍之所计沿道逐户。道外之邮，县令所以至里，里之粟与卒所以出。",
    },
  },
};

export const VILLAGERS: readonly Townsperson[] = [
  {
    archetype: "elder",
    order: "official",
    label: { en: "village elder", zh: "里正" },
    home: "elder",
  },
  {
    archetype: "clerk",
    order: "official",
    label: { en: "post clerk", zh: "邮人" },
    home: "station",
  },
  {
    archetype: "peasant",
    order: "farmer",
    label: { en: "farmer", zh: "农夫" },
    home: "fields-west",
  },
  {
    archetype: "herdsman",
    order: "farmer",
    label: { en: "herdsman", zh: "牧人" },
    home: "meadow",
  },
  {
    archetype: "woodcutter",
    order: "farmer",
    label: { en: "woodcutter", zh: "樵夫" },
    home: "woods",
  },
  {
    archetype: "fisher",
    order: "farmer",
    label: { en: "fisher", zh: "渔者" },
    home: "pond",
  },
  {
    archetype: "ox",
    order: "farmer",
    label: { en: "ox", zh: "牛" },
    home: "byre",
  },
  {
    archetype: "weaver",
    order: "artisan",
    label: { en: "weaver", zh: "织妇" },
    home: "house-3",
  },
  {
    archetype: "merchant",
    order: "merchant",
    label: { en: "grain dealer", zh: "粜者" },
  },
  {
    archetype: "carrier",
    order: "merchant",
    label: { en: "pedlar", zh: "贩夫" },
  },
  {
    archetype: "matron",
    order: "household",
    label: { en: "goodwife", zh: "主妇" },
    home: "house-2",
  },
  {
    archetype: "maiden",
    order: "household",
    label: { en: "mulberry girl", zh: "采桑女" },
    home: "orchard",
  },
  {
    archetype: "child",
    order: "household",
    label: { en: "child", zh: "童子" },
  },
];

/** the places a stroll may start or end: anywhere a path leads */
export const VILLAGE_STROLL_PLACES: readonly string[] = Object.keys(
  VILLAGE_NAMES,
).filter((key) => !["hills", "marsh"].includes(key));

export const VILLAGE: Site = {
  id: "village",
  path: "/craft/village",
  crumb: "Village",
  title: { en: "A Model Village", zh: "模范之里" },
  seat: "village",
  intro:
    "A hamlet of the period at ten times the town's scale, drawn from what the registers, the statutes, and the Odes say a hamlet had rather than from any one dig: six farmhouses on a lane with a well between them, a granary and a threshing floor, a byre for the shared oxen, the altar of the soil god on the rise above and the family graves beyond it, mulberry and garden beds by the houses, millet fields to three sides, a brook with its ford and its pond, and the post station on the road out. The houses are the Qin case form's one hall and two rooms, thatched; the plough and the oxen are what the stable statutes inspected; the altar and the threshing floor are the Odes' seventh-month calendar. Click any house, field, or the lane to read what it is. The figures are one ward of a Liye household register: the elder, the households, their hands, and the pedlar passing through.",
  names: VILLAGE_NAMES,
  features: VILLAGE_FEATURES,
  folk: VILLAGERS,
  strollPlaces: VILLAGE_STROLL_PLACES,
  scale: 10,
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
      en: "A Liye household register lists a ward door by door: the head, the wife, the sons and daughters by age, the old, and the field each holds. The Qin statutes set the elder over the ward for its taxes, its conscripts, and its crimes. The village's people are the entries of one such register, with the hands a hamlet had that a town did not.",
      zh: "里耶户籍逐户列一里：户主、妻、子女以齿、老者、所受之田。秦律以里正主一里之赋、卒、罪。此村之人即一籍之目，并村有而城无之手。",
    },
  },
  sources: [
    {
      name: "The Liye slips",
      text: "(Qianling, Hunan; 222–208 BCE): household registers listing every member of a ward by household, the rosters of hands and convicts, and the granary and post accounts of one county seat and its hamlets.",
    },
    {
      name: "The Shuihudi statutes",
      text: "(Yunmeng, Hubei; sealed 217 BCE): the field statutes on spring water, timber, and nets; the stable statutes on the oxen inspected four times a year; the case form that counts a burgled house's hall, rooms, doors, and the ten mulberries at its gate.",
    },
    {
      name: "The Odes",
      text: ": the seventh-month calendar of the farming year, the threshing floor built in the ninth month, the mulberry picked in the spring, the hemp sown and retted.",
    },
    {
      name: "The Fangmatan boards",
      text: "(Tianshui, Gansu; late third century BCE): the only contemporary maps of a locality, drawn as watercourses, roads, settlements, and timber.",
    },
    {
      name: "Mencius and the Book of Lord Shang",
      text: ": the homestead of five mu with mulberry at its wall and a hundred mu of field, and the thirteen counts of granaries, adults, the old and the weak, horses, oxen, fodder, and straw.",
    },
  ],
};
