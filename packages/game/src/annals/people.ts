/**
 * The named cast of the Annals. These are real people, named because the
 * Annals are education rather than instrument: a scripted history without
 * names is a map with captions.
 *
 * They are deliberately **not** in `GAZETTEER`. The chapters render their
 * text against gazetteer keys and every chapter spec sweeps that table for
 * a masked leak, so a person who entered it could be rendered into played
 * text by accident. Keeping them here makes that impossible rather than
 * merely forbidden (`wall.spec.ts`).
 */
import type { StageArchetype } from "../stage/types";

import type { Localized } from "./types";

export interface Person {
  key: string;
  name: Localized;
  /** the cast key of the state they served, when they served one */
  state?: string;
  /** how the stage draws them */
  archetype: StageArchetype;
  /** their office or standing, for the subtitle bar */
  title?: Localized;
}

const person = (
  key: string,
  name: [string, string],
  archetype: StageArchetype,
  state?: string,
  title?: [string, string],
): Person => ({
  key,
  name: { en: name[0], zh: name[1] },
  archetype,
  ...(state ? { state } : {}),
  ...(title ? { title: { en: title[0], zh: title[1] } } : {}),
});

export const PEOPLE: Person[] = [
  // reformers, ministers, and persuaders
  person("ximen-bao", ["Ximen Bao", "西门豹"], "engineer", "wei", [
    "governor of Ye",
    "邺令",
  ]),
  person("li-kui", ["Li Kui", "李悝"], "minister", "wei", ["chancellor", "相"]),
  person("wu-qi", ["Wu Qi", "吴起"], "general", "wei", [
    "commander in the west",
    "西河守",
  ]),
  person("shang-yang", ["Shang Yang", "商鞅"], "chancellor", "qin", [
    "chancellor",
    "大良造",
  ]),
  person("shen-buhai", ["Shen Buhai", "申不害"], "minister", "han", [
    "chancellor",
    "相",
  ]),
  person("zou-ji", ["Zou Ji", "邹忌"], "minister", "qi", ["chancellor", "相"]),
  person("su-qin", ["Su Qin", "苏秦"], "persuader", undefined, [
    "of the vertical covenant",
    "合从之士",
  ]),
  person("zhang-yi", ["Zhang Yi", "张仪"], "persuader", "qin", [
    "of the horizontal alliance",
    "连横之士",
  ]),
  person("fan-ju", ["Fan Ju", "范雎"], "chancellor", "qin", [
    "chancellor",
    "相",
  ]),
  person("lu-buwei", ["Lu Buwei", "吕不韦"], "merchant", "qin", [
    "chancellor",
    "相国",
  ]),
  person("li-si", ["Li Si", "李斯"], "minister", "qin", ["chancellor", "廷尉"]),
  person("han-fei", ["Han Fei", "韩非"], "scholar", "han", [
    "of the house of Han",
    "韩之诸公子",
  ]),
  person("lin-xiangru", ["Lin Xiangru", "蔺相如"], "minister", "zhao", [
    "envoy",
    "上大夫",
  ]),
  person("lu-zhonglian", ["Lu Zhonglian", "鲁仲连"], "persuader", "qi"),
  person("mao-sui", ["Mao Sui", "毛遂"], "retainer", "zhao"),
  person("zheng-guo", ["Zheng Guo", "郑国"], "engineer", "han", [
    "water engineer",
    "水工",
  ]),
  person("li-bing", ["Li Bing", "李冰"], "engineer", "qin", [
    "governor of Shu",
    "蜀守",
  ]),
  // generals
  person("sun-bin", ["Sun Bin", "孙膑"], "general", "qi", [
    "strategist",
    "军师",
  ]),
  person("pang-juan", ["Pang Juan", "庞涓"], "general", "wei"),
  person("bai-qi", ["Bai Qi", "白起"], "general", "qin", [
    "lord of Wu'an",
    "武安君",
  ]),
  person("lian-po", ["Lian Po", "廉颇"], "general", "zhao"),
  person("zhao-she", ["Zhao She", "赵奢"], "general", "zhao"),
  person("zhao-kuo", ["Zhao Kuo", "赵括"], "general", "zhao"),
  person("yue-yi", ["Yue Yi", "乐毅"], "general", "yan"),
  person("tian-dan", ["Tian Dan", "田单"], "general", "qi"),
  person("wang-jian", ["Wang Jian", "王翦"], "general", "qin"),
  person("wang-ben", ["Wang Ben", "王贲"], "general", "qin"),
  person("li-mu", ["Li Mu", "李牧"], "general", "zhao"),
  person("xiang-yan", ["Xiang Yan", "项燕"], "general", "chu"),
  person("meng-ao", ["Meng Ao", "蒙骜"], "general", "qin"),
  // sovereigns and the great houses
  person("marquess-wen", ["Marquess Wen", "魏文侯"], "court", "wei"),
  person("king-hui-wei", ["King Hui", "魏惠王"], "court", "wei"),
  person("king-wuling", ["King Wuling", "赵武灵王"], "court", "zhao"),
  person("king-zhaoxiang", ["King Zhaoxiang", "秦昭襄王"], "court", "qin"),
  person("king-wu-qin", ["King Wu", "秦武王"], "court", "qin"),
  person("king-xiaogong", ["Duke Xiao", "秦孝公"], "court", "qin"),
  person("dowager-xuan", ["Queen Dowager Xuan", "宣太后"], "dowager", "qin"),
  person("king-huai", ["King Huai", "楚怀王"], "court", "chu"),
  person("king-min", ["King Min", "齐湣王"], "court", "qi"),
  person("king-jian", ["King Jian", "齐王建"], "court", "qi"),
  person("king-hui-zhao", ["King Huiwen", "赵惠文王"], "court", "zhao"),
  person("king-nan", ["King Nan", "周赧王"], "court", "zhou"),
  person("lord-xinling", ["Lord Xinling", "信陵君"], "chancellor", "wei"),
  person("lord-pingyuan", ["Lord Pingyuan", "平原君"], "chancellor", "zhao"),
  person("lord-mengchang", ["Lord Mengchang", "孟尝君"], "chancellor", "qi"),
  person("prince-dan", ["Crown Prince Dan", "燕太子丹"], "court", "yan"),
  person("king-kuai", ["King Kuai", "燕王哙"], "court", "yan"),
  person("zi-zhi", ["Zi Zhi", "子之"], "chancellor", "yan"),
  person("ying-zheng", ["Ying Zheng", "嬴政"], "court", "qin", [
    "king of Qin",
    "秦王",
  ]),
  // others
  person("zhi-bo", ["Zhi Bo", "智伯"], "chancellor", "zhi"),
  person("zhao-xiangzi", ["Zhao Xiangzi", "赵襄子"], "court", "zhao"),
  person("jing-ke", ["Jing Ke", "荆轲"], "assassin", "yan"),
  person("qin-wuyang", ["Qin Wuyang", "秦舞阳"], "retainer", "yan"),
  person("gao-jianli", ["Gao Jianli", "高渐离"], "retainer", "yan"),
  person("nie-zheng", ["Nie Zheng", "聂政"], "assassin"),
  person("mencius", ["Mencius", "孟子"], "scholar"),
  person("xunzi", ["Xunzi", "荀子"], "scholar"),
  person("zhuangzi", ["Zhuangzi", "庄子"], "scholar"),
  person("tian-he", ["Tian He", "田和"], "chancellor", "qi"),
  person("lao-ai", ["Lao Ai", "嫪毐"], "eunuch", "qin"),
  person("tian-wen", ["the diviner", "太卜"], "diviner"),
];

export const PEOPLE_BY_KEY: Record<string, Person> = Object.fromEntries(
  PEOPLE.map((entry) => [entry.key, entry]),
);

export const personOf = (key: string): Person | undefined => PEOPLE_BY_KEY[key];
