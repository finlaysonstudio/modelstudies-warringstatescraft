import type { Localized } from "./gazetteer";

/**
 * The vocabulary sheet: offices, ranks, money, measures, weapons, and
 * institutions the chapters use, with the period term and the thing it
 * replaces from the first drafts (the anachronism table of the saga plan,
 * §1.3). Reference for authors and the cast page; nothing in the engine
 * reads it.
 */

export interface VocabularyEntry {
  term: Localized;
  /** what the first drafts said instead, when they did */
  replaces?: string;
  note: string;
}

export const VOCABULARY: VocabularyEntry[] = [
  {
    term: {
      en: "gold by the yi; bronze coin (spade, knife, round)",
      zh: "镒金；布币、刀币、圜钱",
    },
    replaces: "silver, bullion, vaults, deposits",
    note: "States cast coin; silver is an ornament, not money (Shiji 平準書).",
  },
  {
    term: {
      en: "a great merchant house (a thousand pieces of gold)",
      zh: "千金之贾",
    },
    replaces: "merchant republic, banking houses, loans, city fathers",
    note: "The Lü Buwei / Bai Gui / Fan Li type; no corporate republics, no debt instruments.",
  },
  {
    term: {
      en: "merchants; artisans under the state workshops",
      zh: "商贾；工官之下的百工",
    },
    replaces: "guilds",
    note: "No guilds as bodies.",
  },
  {
    term: {
      en: "vertical and horizontal covenants; a sworn assembly with a written oath",
      zh: "合从、连横；会盟、载书",
    },
    replaces: "league of cities, league assembly",
    note: "Covenants are among states, sworn on a buried victim with the text laid on it.",
  },
  {
    term: { en: "a dependency with its own lord and elders", zh: "附庸" },
    replaces: "Thing, Harbourmoot, fjord, isle",
    note: "Under fifty li, attached to a greater state (Mencius).",
  },
  {
    term: { en: "the Hu, the Rong, the Eastern Hu", zh: "胡、戎、东胡" },
    replaces: "Khanate",
    note: "The steppe peoples of the northern frontier.",
  },
  {
    term: { en: "a dowager regent ruling for a young king", zh: "太后临朝" },
    replaces: "reigning queen",
    note: "Queen Dowager Xuan of Qin is the type.",
  },
  {
    term: {
      en: "king (after 334), lord or marquis for small states; ministers, grandees, officers",
      zh: "王、君、侯；卿、大夫、士",
    },
    replaces: "knight, duke",
    note: "Rulers are kings after the meeting at Xuzhou; no knights.",
  },
  {
    term: { en: "li; a day's march of thirty li", zh: "里；一舍三十里" },
    replaces: "miles",
    note: "Distance in li; a march in she.",
  },
  {
    term: { en: "the fleet; deck ships and war boats", zh: "舟师；楼船、戈船" },
    replaces: "coast guard, cutter, junk, fast-boats",
    note: "Wu, Yue, and Qi kept fleets; deck ships carry marines.",
  },
  {
    term: {
      en: "funeral gifts; an indemnity in gold and towns",
      zh: "赙；以金与城邑为偿",
    },
    replaces: "blood-money",
    note: "Compensation for the dead is gifts to the house and towns to the state.",
  },
  {
    term: {
      en: "an assembly convened by a senior state; a covenant with named guarantors",
      zh: "会；有盟主之盟",
    },
    replaces: "arbitration court, college of assayers",
    note: "No standing courts between states.",
  },
  {
    term: {
      en: "the heavy coin; the state buying and selling to move prices; closing grain sales",
      zh: "大钱；轻重；闭籴",
    },
    replaces: "debasement, clearing halls",
    note: "The period's monetary levers (Guoyu 周語, Guanzi 輕重).",
  },
  {
    term: {
      en: "millet in the north; rice in Chu and the south",
      zh: "北粟南稻",
    },
    replaces: "rice beds in a northern state",
    note: "Grain is millet on the central plain.",
  },
  {
    term: {
      en: "exemption from service for merit or for grain delivered; household register; five-family bond",
      zh: "复；纳粟；户籍；什伍",
    },
    replaces: "exemptions purchased, census office",
    note: "Shangjunshu 境內; the register predates the reform (Shiji 秦本紀).",
  },
  {
    term: { en: "guest minister; twenty grades of rank", zh: "客卿；二十等爵" },
    replaces: "eighteen grades",
    note: "Qin's ranks were twenty.",
  },
  {
    term: {
      en: "crossbow; the trigger crossbow that looses at whoever approaches; the repeating-crossbow cart",
      zh: "弩；机弩；连弩之车",
    },
    note: "Mozi 備高臨; Shiji 秦始皇本紀 (機弩).",
  },
  {
    term: {
      en: "the beacon code: one fire for an enemy sighted, two for a border crossed",
      zh: "烽火：望见寇举一烽，入境举二烽",
    },
    note: "Mozi 號令.",
  },
  {
    term: { en: "hostage prince", zh: "质子" },
    note: "The exchange of hostages is the lowest rung of trust (Zuozhuan 隱公三年).",
  },
  {
    term: {
      en: "the tally: a split token whose halves must match to move troops",
      zh: "符",
    },
    note: "Stolen at Handan to move Wei's relief; split jade held a Mohist city.",
  },
];
