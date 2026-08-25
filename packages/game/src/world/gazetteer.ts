import type { Language, Naming } from "../types";

/**
 * The gazetteer: every proper noun the chronicle's chapters may use, with
 * its rendering under each naming and language. Scenario prose is written
 * against keys (`{qin}`, `{shangdang}`) and rendered by `buildChapter`.
 *
 * `chronicle` is the period's real name (the lens the bench is named for),
 * `masked` an invented toponym of the same world (the disguise treatment),
 * `modern` a present-day name where a chapter declares one (the strait).
 * English renderings may carry a leading article ("the Royal Domain");
 * `{Key}` capitalizes, and a seat or scenario name drops the article.
 *
 * Real persons have no entry on purpose: seats are courts and bodies, and
 * the played text names no one (see `world/README` in the plan, rule 3).
 */

export type Localized = Record<Language, string>;

export interface GazetteerEntry {
  chronicle: Localized;
  masked: Localized;
  modern?: Localized;
}

export type Gazetteer = Record<string, GazetteerEntry>;

const entry = (
  chronicle: [string, string],
  masked: [string, string],
  modern?: [string, string],
): GazetteerEntry => ({
  chronicle: { en: chronicle[0], zh: chronicle[1] },
  masked: { en: masked[0], zh: masked[1] },
  ...(modern ? { modern: { en: modern[0], zh: modern[1] } } : {}),
});

/** the cast: states and bodies that hold seats (see `states.ts`) */
export const CAST_NAMES: Gazetteer = {
  qin: entry(
    ["Qin", "秦"],
    ["Upland", "上邦"],
    ["the interior power", "内陆强国"],
  ),
  zhao: entry(["Zhao", "赵"], ["Northmarch", "北塞"]),
  wei: entry(["Wei", "魏"], ["Midmarch", "中垣"]),
  han: entry(["Han", "韩"], ["Narrowdale", "狭谷"]),
  qi: entry(["Qi", "齐"], ["Saltmarch", "盐海"], ["the United States", "美国"]),
  chu: entry(["Chu", "楚"], ["Southreach", "南泽"]),
  yan: entry(["Yan", "燕"], ["Coldmarch", "寒塞"]),
  zhou: entry(["Zhou", "周"], ["the Royal Domain", "王畿"]),
  shu: entry(["Shu", "蜀"], ["Wheatmere", "麦泽"]),
  song: entry(["Song", "宋"], ["Sealmoor", "封泽"]),
  tao: entry(["Tao", "陶"], ["Hoarfell", "霜丘"]),
  wey: entry(["Wey", "卫"], ["Fordholm", "津邑"]),
  wu: entry(["Wu", "吴"], ["Broadland", "广陆"], ["the PRC", "中国大陆"]),
  yue: entry(["Yue", "越"], ["Shoalholm", "沙屿"], ["Taiwan", "台湾"]),
  dai: entry(["Dai", "代"], ["Stonereach", "石陬"]),
  zhongshan: entry(["Zhongshan", "中山"], ["Hillhold", "山邑"]),
  lu: entry(["Lu", "鲁"], ["Lowfield", "低田"]),
  hu: entry(["the Hu horsemen", "胡人"], ["the steppe horsemen", "漠骑"]),
  clan: entry(["the clan houses", "宗室"], ["the Old Marches", "旧族"]),
  jixia: entry(
    ["the masters of Jixia", "稷下先生"],
    ["the Hall of the Hundred", "百家之堂"],
  ),
  mohists: entry(["the Mohist order", "墨者"], ["the Wallwrights", "筑垣者"]),
  merchant: entry(
    ["the great merchant house", "大贾之家"],
    ["the house of Goldford", "金津之家"],
  ),
  council: entry(
    ["the covenant council", "合从之会"],
    ["the Oathfold", "盟会"],
  ),
};

/** places: cities, passes, rivers, regions */
export const PLACE_NAMES: Gazetteer = {
  shangdang: entry(["Shangdang", "上党"], ["Tallgate", "高门"]),
  quzhan: entry(["the Quzhan shore", "渠展"], ["the Brine Flats", "卤滩"]),
  liaodong: entry(["Liaodong", "辽东"], ["the Farshore", "远滨"]),
  yi: entry(["the Yi river", "易水"], ["the Coldwater", "寒水"]),
  ditch: entry(["the Great Ditch", "鸿沟"], ["the Long Cut", "长沟"]),
  changping: entry(["Changping", "长平"], ["the Long Flats", "平谷"]),
  handan: entry(["Handan", "邯郸"], ["Hartstead", "鹿城"]),
  daliang: entry(["Daliang", "大梁"], ["Bridgewater", "桥川"]),
  xianyang: entry(["Xianyang", "咸阳"], ["Highcourt", "高庭"]),
  hangu: entry(["the Hangu pass", "函谷关"], ["the Boxgate pass", "匣谷关"]),
  river: entry(["the River", "大河"], ["the Great River", "大川"]),
  linzi: entry(
    ["Linzi", "临淄"],
    ["Saltgate", "盐门"],
    ["Washington", "华盛顿"],
  ),
  ji: entry(["Ji", "蓟"], ["Coldhold", "寒城"]),
  puyang: entry(["Puyang", "濮阳"], ["Fordtown", "津城"]),
  yiyang: entry(["Yiyang", "宜阳"], ["Ironvale", "铁谷"]),
  jing: entry(["the Jing river", "泾水"], ["the Greywater", "灰水"]),
  luo: entry(["the Luo river", "洛水"], ["the Kingswater", "王水"]),
  dukang: entry(["Dukang", "督亢"], ["the Fenlands", "泽田"]),
  yangcheng: entry(["Yangcheng", "阳城"], ["Southwall", "南垣"]),
  chengdu: entry(["Chengdu", "成都"], ["Millstead", "磨城"]),
  ye: entry(["Ye", "邺"], ["Weirtown", "堰城"]),
  jinyang: entry(["Jinyang", "晋阳"], ["Damsend", "堤城"]),
  ying: entry(["Ying", "郢"], ["Southcourt", "南庭"]),
  gulf: entry(
    ["the Gulf", "渤海"],
    ["the Shoalwater gulf", "浅湾"],
    ["the Pacific", "太平洋"],
  ),
  langya: entry(["Langya", "琅琊"], ["Hookhead", "钩岬"], ["Okinawa", "冲绳"]),
  gusu: entry(["Gusu", "姑苏"], ["Broadholm", "广城"], ["Beijing", "北京"]),
  kuaiji: entry(["Kuaiji", "会稽"], ["Shoalhead", "沙岭"], ["Taipei", "台北"]),
  jiang: entry(
    ["the Jiang", "大江"],
    ["the Broadwater", "阔水"],
    ["the Yangtze", "长江"],
  ),
  hanzhong: entry(["Hanzhong", "汉中"], ["the Middle Vale", "中谷"]),
  guanzhong: entry(["Guanzhong", "关中"], ["the Inner Passes", "关内"]),
  taihang: entry(
    ["the Taihang range", "太行山"],
    ["the Greatwall range", "长岭"],
  ),
  huai: entry(["the Huai", "淮水"], ["the Southwater", "南水"]),
};

/**
 * Features the map draws that no chapter names: the lesser rivers, the sea,
 * the marshes, and the trunk roads. They are deliberately outside
 * `PLACE_NAMES`, because `mentionsOf` sweeps that table to aim a stage
 * direction and every key it may return has to be a place the map carries.
 * These are stretches of country, not points, and the explorer names them
 * when a reader clicks the ground itself (`FEATURE_NOTES` in the app).
 */
export const FEATURE_NAMES: Gazetteer = {
  weishui: entry(["the Wei river", "渭水"], ["the Millwater", "碾水"]),
  fen: entry(["the Fen river", "汾水"], ["the Ashwater", "烬水"]),
  hanshui: entry(["the Han river", "汉水"], ["the Southbend", "南曲"]),
  min: entry(["the Min river", "岷江"], ["the Fallwater", "急水"]),
  sea: entry(
    ["the Eastern Sea", "东海"],
    ["the Outer Sea", "外海"],
    ["the Western Pacific", "西太平洋"],
  ),
  yunmeng: entry(["the Yunmeng marshes", "云梦泽"], ["the Reedmere", "苇泽"]),
  passroad: entry(
    ["the road through the passes", "关道"],
    ["the Boxgate road", "匣谷道"],
  ),
  plankroad: entry(["the plank roads", "栈道"], ["the trestle roads", "架道"]),
};

export const GAZETTEER: Gazetteer = {
  ...CAST_NAMES,
  ...PLACE_NAMES,
  ...FEATURE_NAMES,
};

/** the rendering of one key, or undefined when the naming has none */
export const renderName = (
  gazetteer: Gazetteer,
  key: string,
  naming: Naming,
  language: Language,
): string | undefined => gazetteer[key]?.[naming]?.[language];
