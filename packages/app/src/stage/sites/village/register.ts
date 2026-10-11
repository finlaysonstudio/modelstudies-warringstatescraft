/**
 * The village's register: the Zhouli's 里 of twenty-five households in five
 * 伍, in the Liye form (the head's rank and name, then every member by
 * relation and age class, 大 grown, 小 small, 老 old), a hundred and five on
 * the register and a hundred and one drawn (plan
 * `20260909_Plan_village_year.md` §3). Three infants and one bedridden
 * mother are listed and never walk.
 *
 * Names are invented in one stock (plan §3.3): a one-character surname from
 * the ones the excavated documents attest for commoners and a one-character
 * given name of the plain Qin sort, the women's in the 女 radical the slips
 * use. No name is a person of the slips. The English is the romanization.
 *
 * Sprites: the archetypes with variants (`SPRITE_VARIANTS`) take one by the
 * household's index, offset by the member's place among its kind, so that a
 * 伍's five farmers are five different men and two brothers differ.
 */
import { NotFoundError } from "@jaypie/errors";

import type { StageArchetype } from "../../../lib/types";
import { SPRITE_VARIANTS } from "../../catalog";
import type { AgeClass, Household, Role, Sex, Villager, Wu } from "../../site";
import { houseKeyOf } from "./names";

interface MemberSpec {
  /** the id's tail, the romanization in lower case */
  key: string;
  /** the given name: romanized, then the character */
  name: [string, string];
  relation: string;
  age: AgeClass;
  sex: Sex;
  archetype: StageArchetype;
  role: Role;
  drawn?: boolean;
  overlays?: string[];
}

interface HouseholdSpec {
  n: number;
  wu: number;
  surname: string;
  rank: string;
  /** the plot the household's `plot` resolves to */
  plot: string;
  members: MemberSpec[];
  note?: { en: string; zh: string };
}

const m = (
  key: string,
  name: [string, string],
  relation: string,
  age: AgeClass,
  sex: Sex,
  archetype: StageArchetype,
  role: Role,
  extra: Partial<MemberSpec> = {},
): MemberSpec => ({
  key,
  name,
  relation,
  age,
  sex,
  archetype,
  role,
  ...extra,
});

const head = (key: string, name: [string, string]) =>
  m(key, name, "head", "大", "m", "peasant", "head");
const wife = (key: string, name: [string, string]) =>
  m(key, name, "wife", "大", "f", "matron", "wife");
const son = (key: string, name: [string, string]) =>
  m(key, name, "son", "大", "m", "peasant", "son");
const boy = (key: string, name: [string, string]) =>
  m(key, name, "son", "小", "m", "child", "child");
const girl = (key: string, name: [string, string]) =>
  m(key, name, "daughter", "小", "f", "girl", "child");
const maiden = (key: string, name: [string, string]) =>
  m(key, name, "daughter", "大", "f", "maiden", "daughter");
const sonswife = (key: string, name: [string, string]) =>
  m(key, name, "son's wife", "大", "f", "matron", "wife");
const grandson = (key: string, name: [string, string]) =>
  m(key, name, "grandson", "小", "m", "child", "child");
const granny = (key: string, name: [string, string], drawn = true) =>
  m(key, name, "mother", "老", "f", "granny", "old", { drawn });
const wulao = (key: string, name: [string, string]) =>
  m(key, name, "father", "老", "m", "grandfather", "wulao");
const infant = (key: string, name: [string, string]) =>
  m(key, name, "son", "小", "m", "child", "child", { drawn: false });

/**
 * The twenty-five households in register order, which is the map's: the
 * first 伍 at the crossroads, the second on the south lane, the third on
 * the west lane, the fourth on the east lane, the fifth on the north branch.
 */
const HOUSEHOLDS: HouseholdSpec[] = [
  {
    n: 1,
    wu: 1,
    surname: "蛮",
    rank: "不更",
    plot: "field-west",
    members: [
      m("qiang", ["Qiang", "强"], "head", "老", "m", "elder", "elder"),
      m("qian", ["Qian", "嗛"], "wife", "老", "f", "matron", "wife"),
      son("de", ["De", "得"]),
      sonswife("fei", ["Fei", "妃"]),
      grandson("wu", ["Wu", "午"]),
    ],
    note: {
      en: "The 里典, the elder of the ward, who answers to the county for its taxes, its conscripts, and its crimes.",
      zh: "里典，主一里之赋、卒、罪，对县。",
    },
  },
  {
    n: 2,
    wu: 1,
    surname: "黄",
    rank: "公士",
    plot: "field-west",
    members: [
      head("an", ["An", "安"]),
      wife("a", ["A", "阿"]),
      boy("hei", ["Hei", "黑"]),
      girl("tuo", ["Tuo", "驼"]),
      granny("zhu", ["Zhu", "妵"]),
    ],
  },
  {
    n: 3,
    wu: 1,
    surname: "王",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("ci", ["Ci", "疵"]),
      wife("ying", ["Ying", "婴"]),
      son("sheng", ["Sheng", "胜"]),
      maiden("fang", ["Fang", "妨"]),
    ],
    note: {
      en: "Two grown men in the house, so the son Sheng is the one the county calls at the harvest: his labour turn is the ninth month, and the father Ci's the eleventh.",
      zh: "户有二丁，子胜九月更于县，父疵十一月。",
    },
  },
  {
    n: 4,
    wu: 1,
    surname: "张",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("jiu", ["Jiu", "就"]),
      wife("xing", ["Xing", "𫰛"]),
      boy("xi", ["Xi", "喜"]),
      girl("hao", ["Hao", "好"]),
      infant("wei", ["Wei", "未"]),
    ],
  },
  {
    n: 5,
    wu: 1,
    surname: "李",
    rank: "公士",
    plot: "field-west",
    members: [
      head("qing", ["Qing", "庆"]),
      wife("wan", ["Wan", "婉"]),
      m("zhong", ["Zhong", "忠"], "son", "大", "m", "herdsman", "oxmaster"),
      wulao("shou", ["Shou", "寿"]),
    ],
    note: {
      en: "The son Zhong is the 牛長, the ox-master, with the ward's four oxen in his charge; the father Shou is the 伍老 of the first 伍 and the invocator at the altar.",
      zh: "子忠为牛长，掌里牛四；父寿为一伍之老，社祭为祝。",
    },
  },
  {
    n: 6,
    wu: 2,
    surname: "陈",
    rank: "大女子",
    plot: "field-west",
    members: [
      m("e", ["E", "娥"], "head", "大", "f", "matron", "widow"),
      maiden("jiao", ["Jiao", "姣"]),
      boy("she", ["She", "舍"]),
    ],
    note: {
      en: "A widow at the head of her household, as the Liye registers list women heads.",
      zh: "寡妇为户主，里耶籍有之。",
    },
  },
  {
    n: 7,
    wu: 2,
    surname: "赵",
    rank: "士伍",
    plot: "field-south",
    members: [
      head("gan", ["Gan", "敢"]),
      wife("liao", ["Liao", "嫽"]),
      son("zhong", ["Zhong", "衷"]),
      sonswife("shu", ["Shu", "姝"]),
      wulao("tian", ["Tian", "恬"]),
    ],
    note: {
      en: "The son Zhong is the garrison man of the tenth month, sent to the frontier for a year; the father Tian is the 伍老 of the second 伍.",
      zh: "子衷十月戍边一岁；父恬为二伍之老。",
    },
  },
  {
    n: 8,
    wu: 2,
    surname: "周",
    rank: "上造",
    plot: "field-south",
    members: [
      head("ping", ["Ping", "平"]),
      wife("yuan", ["Yuan", "媛"]),
      maiden("wa", ["Wa", "娃"]),
      boy("rong", ["Rong", "戎"]),
    ],
    note: {
      en: "The daughter Wa is the bride of the second month, married into the Wang house; the boy Rong reaches the height in the eighth month and is entered as grown.",
      zh: "女娃二月嫁王氏；子戎八月傅，著籍为大。",
    },
  },
  {
    n: 9,
    wu: 2,
    surname: "吴",
    rank: "士伍",
    plot: "field-south",
    members: [
      head("fu", ["Fu", "富"]),
      wife("yan", ["Yan", "妍"]),
      granny("ai", ["Ai", "娭"], false),
    ],
    note: {
      en: "The mother is bedridden: on the register, since it counts the old and the sick, and never on the map. She dies in the eleventh month.",
      zh: "母病卧，籍计老疾，不出户；十一月卒。",
    },
  },
  {
    n: 10,
    wu: 2,
    surname: "高",
    rank: "士伍",
    plot: "field-south",
    members: [
      head("ding", ["Ding", "定"]),
      wife("xu", ["Xu", "媭"]),
      m("chang", ["Chang", "敞"], "brother", "大", "m", "peasant", "brother"),
    ],
    note: {
      en: "Two grown men undivided: the household pays double under Lord Shang's ordinance.",
      zh: "二男不分异，倍其赋。",
    },
  },
  {
    n: 11,
    wu: 3,
    surname: "郑",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("yi", ["Yi", "益"]),
      wife("kua", ["Kua", "姱"]),
      son("chang", ["Chang", "昌"]),
      boy("bing", ["Bing", "兵"]),
      granny("pou", ["Pou", "婄"]),
    ],
  },
  {
    n: 12,
    wu: 3,
    surname: "孙",
    rank: "公士",
    plot: "field-west",
    members: [
      head("hu", ["Hu", "护"]),
      wife("su", ["Su", "素"]),
      girl("lv", ["Lü", "绿"]),
      wulao("liang", ["Liang", "良"]),
    ],
    note: {
      en: "The father Liang is the 伍老 of the third 伍.",
      zh: "父良为三伍之老。",
    },
  },
  {
    n: 13,
    wu: 3,
    surname: "杨",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("shi", ["Shi", "时"]),
      wife("yang", ["Yang", "姎"]),
      son("lang", ["Lang", "郎"]),
      girl("juan", ["Juan", "娟"]),
    ],
    note: {
      en: "The son Lang goes with the corvée party of the tenth month.",
      zh: "子郎十月从徭。",
    },
  },
  {
    n: 14,
    wu: 3,
    surname: "朱",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("chang", ["Chang", "常"]),
      wife("e", ["E", "妸"]),
      boy("lu", ["Lu", "禄"]),
      infant("ding", ["Ding", "丁"]),
    ],
  },
  {
    n: 15,
    wu: 3,
    surname: "徐",
    rank: "士伍",
    plot: "field-west",
    members: [
      head("hu", ["Hu", "虎"]),
      wife("gui", ["Gui", "姽"]),
      son("dang", ["Dang", "当"]),
      sonswife("wo", ["Wo", "婐"]),
      grandson("mao", ["Mao", "卯"]),
    ],
  },
  {
    n: 16,
    wu: 4,
    surname: "胡",
    rank: "上造",
    plot: "field-east",
    members: [
      head("yang", ["Yang", "央"]),
      wife("chan", ["Chan", "婵"]),
      maiden("chuo", ["Chuo", "婥"]),
      boy("qi", ["Qi", "齐"]),
      wulao("ji", ["Ji", "季"]),
    ],
    note: {
      en: "The father Ji is the 伍老 of the fourth 伍.",
      zh: "父季为四伍之老。",
    },
  },
  {
    n: 17,
    wu: 4,
    surname: "宋",
    rank: "士伍",
    plot: "field-east",
    members: [
      head("deng", ["Deng", "登"]),
      wife("mei", ["Mei", "媚"]),
      son("guang", ["Guang", "光"]),
      boy("shu", ["Shu", "舒"]),
    ],
  },
  {
    n: 18,
    wu: 4,
    surname: "田",
    rank: "公士",
    plot: "field-east",
    members: [
      head("yang", ["Yang", "阳"]),
      wife("yan", ["Yan", "嫣"]),
      girl("miao", ["Miao", "妙"]),
      granny("zheng", ["Zheng", "姃"]),
    ],
  },
  {
    n: 19,
    wu: 4,
    surname: "许",
    rank: "士伍",
    plot: "field-east",
    members: [
      head("zhang", ["Zhang", "章"]),
      wife("jing", ["Jing", "婧"]),
      m("gui", ["Gui", "贵"], "brother", "大", "m", "peasant", "brother"),
    ],
    note: {
      en: "Two grown men undivided: the household pays double.",
      zh: "二男不分异，倍其赋。",
    },
  },
  {
    n: 20,
    wu: 4,
    surname: "尹",
    rank: "大女子",
    plot: "field-east",
    members: [
      m("xu", ["Xu", "姁"], "head", "大", "f", "matron", "widow"),
      son("zu", ["Zu", "祖"]),
      sonswife("yuan", ["Yuan", "嫄"]),
      grandson("shen", ["Shen", "申"]),
    ],
    note: {
      en: "A widow at the head of her household.",
      zh: "寡妇为户主。",
    },
  },
  {
    n: 21,
    wu: 5,
    surname: "郭",
    rank: "士伍",
    plot: "field-south",
    members: [
      head("tan", ["Tan", "谈"]),
      wife("jie", ["Jie", "婕"]),
      son("rang", ["Rang", "让"]),
      maiden("huan", ["Huan", "嬛"]),
      wulao("shi", ["Shi", "石"]),
    ],
    note: {
      en: "The father Shi is the 伍老 of the fifth 伍.",
      zh: "父石为五伍之老。",
    },
  },
  {
    n: 22,
    wu: 5,
    surname: "曹",
    rank: "士伍",
    plot: "field-north",
    members: [
      head("nu", ["Nu", "奴"]),
      wife("yun", ["Yun", "妘"]),
      boy("quan", ["Quan", "犬"]),
      girl("wei", ["Wei", "娓"]),
    ],
  },
  {
    n: 23,
    wu: 5,
    surname: "蔡",
    rank: "公士",
    plot: "field-north",
    members: [
      head("bao", ["Bao", "豹"]),
      wife("xing", ["Xing", "婞"]),
      son("xiong", ["Xiong", "熊"]),
      sonswife("ji", ["Ji", "姞"]),
    ],
    note: {
      en: "A ranked house with two grown men, called while the fields are worked: the father Bao's labour turn is the fourth month and the son Xiong's the eighth, never the two together.",
      zh: "有爵之户，二丁，田时先行：父豹四月更，子熊八月，同居毋并行。",
    },
  },
  {
    n: 24,
    wu: 5,
    surname: "马",
    rank: "士伍",
    plot: "field-north",
    members: [
      head("lu", ["Lu", "鹿"]),
      wife("man", ["Man", "嫚"]),
      girl("xian", ["Xian", "妶"]),
      infant("xu", ["Xu", "戌"]),
    ],
  },
  {
    n: 25,
    wu: 5,
    surname: "韩",
    rank: "士伍",
    plot: "field-north",
    members: [
      head("shan", ["Shan", "山"]),
      wife("si", ["Si", "姒"]),
      boy("gu", ["Gu", "谷"]),
      granny("ni", ["Ni", "婗"]),
      m("kao", ["Kao", "考"], "father", "老", "m", "grandfather", "old"),
    ],
    note: {
      en: "The father Kao is the oldest man of the ward, the staff-bearer the drinking rite seats first.",
      zh: "父考最老，乡饮酒礼先席之。",
    },
  },
];

/** the variant a member of an archetype wears, spread by household and by place among its kind */
const spriteOf = (
  archetype: StageArchetype,
  householdIndex: number,
  kindIndex: number,
): string | undefined => {
  const variants = SPRITE_VARIANTS[archetype];
  if (!variants || variants.length < 2) return undefined;
  return variants[(householdIndex + kindIndex) % variants.length];
};

export const householdIdOf = (n: number): string =>
  `h${String(n).padStart(2, "0")}`;

const buildHousehold = (spec: HouseholdSpec, index: number): Household => {
  const id = householdIdOf(spec.n);
  const seen = new Map<StageArchetype, number>();
  const members: Villager[] = spec.members.map((member) => {
    const kindIndex = seen.get(member.archetype) ?? 0;
    seen.set(member.archetype, kindIndex + 1);
    const sprite = spriteOf(member.archetype, index, kindIndex);
    return {
      id: `${id}.${member.key}`,
      name: { en: member.name[0], zh: member.name[1] },
      relation: member.relation,
      age: member.age,
      sex: member.sex,
      archetype: member.archetype,
      ...(sprite ? { sprite } : {}),
      ...(member.overlays ? { overlays: member.overlays } : {}),
      role: member.role,
      drawn: member.drawn ?? true,
      home: houseKeyOf(spec.n),
    };
  });
  return {
    id,
    wu: `wu-${spec.wu}`,
    surname: spec.surname,
    rank: spec.rank,
    head: members[0]!.id,
    plot: spec.plot,
    members,
    ...(spec.note ? { note: spec.note } : {}),
  };
};

/** the twenty-five households, in register order */
export const VILLAGE_REGISTER: Household[] = HOUSEHOLDS.map(buildHousehold);

/** the five 伍, each with its 伍老 */
export const VILLAGE_WUS: Wu[] = [1, 2, 3, 4, 5].map((n) => {
  const households = VILLAGE_REGISTER.filter((h) => h.wu === `wu-${n}`);
  const old = households
    .flatMap((h) => h.members)
    .find((member) => member.role === "wulao");
  return {
    id: `wu-${n}`,
    order: n,
    households: households.map((h) => h.id),
    wulao: old?.id ?? "",
  };
});

const visitor = (
  id: string,
  name: [string, string],
  archetype: StageArchetype,
  role: Role,
  home: string,
  extra: Partial<Villager> = {},
): Villager => ({
  id,
  name: { en: name[0], zh: name[1] },
  relation: "visitor",
  age: "大",
  sex: "m",
  archetype,
  role,
  drawn: true,
  home,
  ...extra,
});

/**
 * The county's people and the ward's oxen. The post clerk is at the station
 * all year; the pedlar comes on the fifteenth; the county clerk in the
 * eighth month; the field officer in the first, fourth, seventh, and tenth;
 * the lieutenant in the tenth and eleventh. The oxen have no slot of their
 * own in the register's types, so they ride as visitors homed at the byre.
 */
export const VILLAGE_VISITORS: Villager[] = [
  visitor("v.ran", ["Ran", "冉"], "clerk", "postclerk", "station"),
  visitor("v.zi", ["Zi", "赀"], "carrier", "pedlar", "edge", {
    overlays: ["pole"],
  }),
  visitor("v.he", ["He", "贺"], "clerk", "countyclerk", "edge"),
  visitor("v.ji", ["Ji", "疾"], "fieldofficer", "fieldofficer", "edge"),
  visitor("v.meng", ["Meng", "猛"], "lieutenant", "lieutenant", "edge"),
  visitor("ox.luo", ["Luo", "荦"], "ox", "ox", "byre", { relation: "ox" }),
  visitor("ox.li", ["Li", "犁"], "ox", "ox", "byre", { relation: "ox" }),
  visitor("ox.gu", ["Gu", "牯"], "ox", "ox", "byre", { relation: "ox" }),
  visitor("ox.du", ["Du", "犊"], "ox", "ox", "byre", { relation: "ox" }),
];

/** every villager on the register and among the visitors, by id */
export const VILLAGER_BY_ID: ReadonlyMap<string, Villager> = new Map(
  [...VILLAGE_REGISTER.flatMap((h) => h.members), ...VILLAGE_VISITORS].map(
    (v) => [v.id, v],
  ),
);

/** a villager by id; a typo in an event is a thrown error at import */
export const villager = (id: string): Villager => {
  const found = VILLAGER_BY_ID.get(id);
  if (!found) throw new NotFoundError(`village: no villager ${id}`);
  return found;
};

/**
 * The months the fields are worked (田時): the second through the ninth, the
 * ploughing to the harvest. The rest is the slack season the statute sends
 * the poor in.
 */
export const FARMING_MONTHS: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9];

/**
 * The year's labour turns (更卒), by the month each man walks out. Every
 * grown man owes the county a month, and the Qin statute on labour service
 * says who goes when: 田時先行富有賢人，以閒時行貧者, in the farming season
 * the wealthy and able first, the poor in the slack season. So each farming
 * month takes one man, from a house with a rank or with a second grown man to
 * leave at the plough, and the unranked heads go five a month through the
 * winter. No month takes two of one household (同居毋并行). The tenth month
 * is not here: its ten are the party the county's levy takes (`CORVEE_PARTY`
 * in `events.ts`), which is those men's turn for the year. Two grown men
 * have no turn: the Zhao son, who leaves for the frontier in the tenth month,
 * and the ox-master, who is not called away from the ward's oxen.
 */
export const VILLAGE_TURNS: Readonly<Record<number, readonly string[]>> = {
  1: ["h07.gan", "h09.fu", "h11.chang", "h15.hu", "h19.zhang"],
  2: ["h18.yang"],
  3: ["h12.hu"],
  4: ["h23.bao"],
  5: ["h01.de"],
  6: ["h16.yang"],
  7: ["h05.qing"],
  8: ["h23.xiong"],
  9: ["h03.sheng"],
  11: ["h03.ci", "h11.yi", "h14.chang", "h20.zu", "h25.shan"],
  12: ["h10.ding", "h13.shi", "h17.deng", "h21.tan", "h24.lu"],
};

/** the men whose labour turn is a month; none in the tenth, the levy's own */
export const turnsOf = (month: number): readonly string[] =>
  VILLAGE_TURNS[month] ?? [];
