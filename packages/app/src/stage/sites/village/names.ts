/**
 * Every place the village's geography draws, named in both languages, and
 * every feature it names (the lanes, the field banks, the brook, the pond,
 * and the five 伍 as stretches of lane). `sites.spec.ts` holds both to
 * `art/sites/village/geography.json`, and the build refuses a place or a
 * feature missing here.
 */
import type { FeatureNote, Localized } from "../../legend";

/** the twenty-five households' surnames in register order, for the house names */
export const HOUSE_SURNAMES: readonly [string, string][] = [
  ["Man", "蛮"],
  ["Huang", "黄"],
  ["Wang", "王"],
  ["Zhang", "张"],
  ["Li", "李"],
  ["Chen", "陈"],
  ["Zhao", "赵"],
  ["Zhou", "周"],
  ["Wu", "吴"],
  ["Gao", "高"],
  ["Zheng", "郑"],
  ["Sun", "孙"],
  ["Yang", "杨"],
  ["Zhu", "朱"],
  ["Xu", "徐"],
  ["Hu", "胡"],
  ["Song", "宋"],
  ["Tian", "田"],
  ["Xu", "许"],
  ["Yin", "尹"],
  ["Guo", "郭"],
  ["Cao", "曹"],
  ["Cai", "蔡"],
  ["Ma", "马"],
  ["Han", "韩"],
];

/** `house-01` … `house-25` */
export const houseKeyOf = (n: number): string =>
  `house-${String(n).padStart(2, "0")}`;

const houseNames = (): Record<string, Localized> =>
  Object.fromEntries(
    HOUSE_SURNAMES.map(([en, zh], i) => [
      houseKeyOf(i + 1),
      i === 0
        ? { en: "the elder's house, the Man house", zh: "里典蛮氏之舍" }
        : { en: `the ${en} house`, zh: `${zh}氏之舍` },
    ]),
  );

export const VILLAGE_NAMES: Record<string, Localized> = {
  ...houseNames(),
  shrine: { en: "the altar of the soil", zh: "里社" },
  hall: { en: "the ward hall", zh: "序" },
  well: { en: "the village well", zh: "里井" },
  "well-south": { en: "the south well", zh: "南井" },
  granary: { en: "the granary", zh: "仓" },
  threshing: { en: "the threshing floor", zh: "场" },
  archery: { en: "the archery ground", zh: "射圃" },
  byre: { en: "the byre", zh: "牛牢" },
  silkshed: { en: "the silkworm shed", zh: "蚕室" },
  icehouse: { en: "the ice house", zh: "凌阴" },
  orchard: { en: "the mulberry plot", zh: "桑田" },
  ford: { en: "the ford", zh: "津" },
  washing: { en: "the washing place", zh: "沤池" },
  station: { en: "the post station", zh: "邮" },
  edge: { en: "the post road out", zh: "邮道之末" },
  crossroads: { en: "the crossroads", zh: "衢" },
  "gate-west": { en: "the west gate", zh: "西闾" },
  "gate-east": { en: "the east gate", zh: "东闾" },
  "gate-south": { en: "the south gate", zh: "南闾" },
  graves: { en: "the family graves", zh: "族墓" },
  hills: { en: "the hills", zh: "丘" },
  woods: { en: "the woods", zh: "林" },
  pond: { en: "the pond", zh: "陂" },
  marsh: { en: "the marsh", zh: "泽" },
  meadow: { en: "the meadow", zh: "牧" },
  "field-west": { en: "the west millet", zh: "西田之禾" },
  "field-north": { en: "the north broomcorn", zh: "北田之黍" },
  "field-south": { en: "the south wheat", zh: "南田之麦" },
  "field-east": { en: "the east beans", zh: "东田之菽" },
  "field-hemp": { en: "the hemp ground", zh: "麻田" },
  "field-paddy": { en: "the paddy", zh: "稻田" },
};

const wu = (
  n: number,
  zh: string,
  where: Localized,
  houses: string,
): FeatureNote => ({
  title: {
    en: `The ${["first", "second", "third", "fourth", "fifth"][n - 1]} 伍`,
    zh: `${zh}伍`,
  },
  what: {
    en: `${where.en}: ${houses}.`,
    zh: `${where.zh}。`,
  },
  history: {
    en: "The Zhouli's ward is twenty-five households in five groups of five, and Lord Shang's Qin kept the five as the 伍 that answered for one another: a crime hidden by one house was the fine of all five, and a grown boy hidden from the register was the elder's fault and the 伍老's. Each five is a stretch of lane, so the register's order is the map's.",
    zh: "周礼五家为邻、五邻为里；商君之法什伍相收司连坐，一家匿奸则五家同罚，匿敖童则典、老皆有罪。五家共一段里道，籍之序即图之序。",
  },
});

export const VILLAGE_FEATURES: Record<string, FeatureNote> = {
  brook: {
    title: { en: "The brook", zh: "溪" },
    what: {
      en: "The stream the village drinks from and crosses at the ford, with the washing place below the ford and the pond below that.",
      zh: "村所饮之水，涉于津；津下有沤池，池下有陂。",
    },
    history: {
      en: "The Fangmatan boards drew a district as its watercourses first and its settlements after, and a hamlet sat where a stream could be crossed and a field watered. The Qin field statutes forbade damming water in the spring, when the fields below needed it, and fined the ward that let a bank fail.",
      zh: "放马滩图先画水道，后画聚落；村居于可涉可溉之处。秦田律春月毋壅水，堤坏罚其里。",
    },
  },
  pond: {
    title: { en: "The pond", zh: "陂" },
    what: {
      en: "Still water beside the brook, for the ducks, the boys' fishing, and the winter's ice; the paddy lies in the wet ground below it.",
      zh: "溪侧止水，鹜与童子所钓，冬则凿冰；其下湿地为稻田。",
    },
    history: {
      en: "A pond held the brook's water through the dry months and grew the fish, the lotus, and the reeds a household did not have to plant. The same statutes that guarded the spring water forbade poisoning fish and taking them with nets before the summer, and the Seventh Month cuts its ice in the twelfth month and stores it in the first.",
      zh: "陂蓄溪水以度旱月，生鱼、荷、苇，不待种而有。秦律禁毒鱼、夏前置网；七月之诗二之日凿冰冲冲，三之日纳于凌阴。",
    },
  },
  lane: {
    title: { en: "The lanes", zh: "里道" },
    what: {
      en: "Three lanes: the cart track from the west fields through the crossroads to the ford and the post road, a branch south past the second well to the threshing floor, and a branch north to the altar, each gated where it leaves the houses.",
      zh: "三道：自西田经衢至津至邮道之车道，南支过南井至场，北支上至社，出舍处各有闾。",
    },
    history: {
      en: "A hamlet was a lane with houses on it, and the register that counted it went door by door along the lane. A 里 was a gated place: the Analects' villagers drive out the pestilence through it and the Qin statutes shut it at night. The post station on the road out is how a county's orders reached the ward and how the ward's grain, its fodder, and its conscripts went the other way.",
      zh: "村者一道两旁之舍，籍之所计沿道逐户。里有闾：乡人傩自闾而出，秦律夜闭闾。道外之邮，县令所以至里，里之粟、刍稾与卒所以出。",
    },
  },
  banks: {
    title: { en: "The field banks", zh: "阡陌" },
    what: {
      en: "The raised paths between the field blocks, nine plots to a block, that a farmer follows out to the plot he works.",
      zh: "田间之陌，九夫为一井，农夫循之至其所耕。",
    },
    history: {
      en: "Mencius describes the well-field as nine plots in a square with the middle one worked in common, and whatever the system was in practice the banks between plots were real: Lord Shang's reform in Qin 'opened the 阡陌', the north-south and east-west banks, and the Fangmatan boards draw a district's fields by their banks and roads. The Qin field statutes fined the ward whose banks were not kept.",
      zh: "孟子言井田九夫，中为公田；其制虽疑，田间之阡陌则实有之：商君开阡陌封疆，放马滩图以阡陌道路画田，秦田律阡陌不修者罚其里。",
    },
  },
  "wu-1": wu(
    1,
    "一",
    {
      en: "The lane at the crossroads, the elder's own five",
      zh: "衢侧之五家，里典所领",
    },
    "the elder's house, the Huang, the Wang, the Zhang, and the Li houses, with the hall between them",
  ),
  "wu-2": wu(
    2,
    "二",
    {
      en: "The south lane, from the crossroads to the threshing floor",
      zh: "南道自衢至场之五家",
    },
    "the Chen widow's, the Zhao, the Zhou, the Wu, and the Gao houses",
  ),
  "wu-3": wu(
    3,
    "三",
    { en: "The west lane, by the fields", zh: "西道近田之五家" },
    "the Zheng, the Sun, the Yang, the Zhu, and the Xu houses",
  ),
  "wu-4": wu(
    4,
    "四",
    {
      en: "The east lane, toward the ford and the station",
      zh: "东道向津与邮之五家",
    },
    "the Hu, the Song, the Tian, the Xu, and the Yin widow's houses",
  ),
  "wu-5": wu(
    5,
    "五",
    { en: "The north branch, below the altar", zh: "北道社下之五家" },
    "the Guo, the Cao, the Cai, the Ma, and the Han houses",
  ),
};

/** the places a stroll may start or end: anywhere a path leads */
export const VILLAGE_STROLL_PLACES: readonly string[] = Object.keys(
  VILLAGE_NAMES,
).filter((key) => !["hills", "marsh", "graves", "edge"].includes(key));
