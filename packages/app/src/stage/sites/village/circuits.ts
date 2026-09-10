/**
 * The village's circuits: where each role stands at each double-hour of a
 * month's day (plan `20260909_Plan_village_year.md` §5), authored by role
 * and month and flattened to the engine's `Circuit[]`. `register.ts`
 * resolves `home`, `well`, `plot`, `block`, and `edge` and jitters the
 * hours. The hours are 4 卯, 5 辰, 6 巳, 7 午, 8 未, 9 申, 10 酉.
 *
 * The roles that carry the year are the men (head, son, brother), the women
 * (wife, widow), the daughter, the child, the old, the 伍老, the elder, the
 * ox-master, and the ox. The visitors have a day for the months they come
 * and a single stop at the edge for the months they do not, so that a
 * visitor who is not here stands off the map rather than strolling it.
 */
import type { Cite, Month } from "../../almanac";
import { MONTH_IDS } from "../../almanac";
import type { Circuit, Hour, Role, Stop } from "../../site";

const cite = (id: string, line: number, note: string): Cite => ({
  id,
  line,
  note,
});
const SHIJING_QIYUE_MEAL = cite("shijing-zh", 1074, "甫田: 饁彼南畝，田畯至喜");
const SHIJING_MULBERRY = cite(
  "shijing-zh",
  3826,
  "七月: 女執懿筐，遵彼微行，爰求柔桑",
);
const SHIJING_HEMP = cite("shijing-zh", 3828, "七月: 八月載績");
const SHIJING_JUJUBE = cite("shijing-zh", 3833, "七月: 八月剝棗，十月穫稻");
const SHIJING_MELON = cite(
  "shijing-zh",
  3834,
  "七月: 七月食瓜，八月斷壺，九月叔苴",
);
const SHIJING_FLOOR = cite("shijing-zh", 3835, "七月: 九月築場圃，十月納禾稼");
const SHIJING_ICE = cite(
  "shijing-zh",
  3837,
  "七月: 二之日鑿冰沖沖，三之日納于凌陰",
);
const SHIJING_FEAST = cite("shijing-zh", 3838, "七月: 十月滌場，朋酒斯饗");
const LIJI_WHEAT = cite("liji-zh", 1618, "月令 孟夏: 農乃登麥");
const LIJI_MILLET = cite("liji-zh", 1628, "月令 仲夏: 農乃登黍");
const LIJI_DYE = cite("liji-zh", 1641, "月令 季夏: 命婦官染采");
const LIJI_BURN = cite("liji-zh", 1643, "月令 季夏: 燒薙行水");
const LIJI_SOW_WHEAT = cite("liji-zh", 1665, "月令 仲秋: 乃勸種麥，毋或失時");
const LIJI_HARVEST = cite("liji-zh", 1676, "月令 季秋: 農事備收");
const LIJI_SILK = cite("liji-zh", 1606, "月令 季春: 后妃齊戒，親東鄉躬桑");
const LVSHI_SEASON = cite("lvshichunqiu-zh", 234, "審時: 得時之稼");
const HANSHU_WOODS = cite(
  "hanshu-zh",
  6631,
  "食貨志: 冬，民既入，婦人同巷相從夜績; 伐薪樵",
);
const ZHOULI_READ = cite("zhouli-zh", 521, "地官 黨正: 正歲屬民讀法");
const SHUIHUDI_OXEN = cite(
  "shuihudi-zh",
  361,
  "廄苑律: 以四月、七月、十月、正月膚田牛",
);
const SHUIHUDI_YAO = cite("shuihudi-zh", 520, "徭律");
const YUEFU_PEDLAR = cite("yuefu-zh", 5564, "陌上桑: 羅敷善蠶桑，採桑城南隅");

const stop = (
  hour: Hour,
  at: string,
  pose?: string,
  line?: { en: string; zh: string },
  extra: Partial<Stop> = {},
): Stop => ({
  hour,
  at,
  ...(pose ? { pose } : {}),
  ...(line ? { line } : {}),
  ...extra,
});

type Days = Partial<Record<Month, Stop[]>>;

/** the men's year: head, son, and brother walk the same day */
const MEN: Days = {
  1: [
    stop(4, "byre", "sit", {
      en: "The ploughshares are mended before the season opens.",
      zh: "修耒耜，以待东作。",
    }),
    stop(5, "plot", "hoe", {
      en: "The field banks and the paths are repaired.",
      zh: "修封疆，审端径术。",
    }),
    stop(8, "well"),
    stop(9, "home", "sit"),
    stop(10, "home"),
  ],
  2: [
    stop(4, "byre"),
    stop(5, "block", "hoe", {
      en: "The east wind has loosened the ground: the block is ploughed behind the oxen.",
      zh: "东风解冻，随牛而耕。",
    }),
    stop(6, "block", "sow"),
    stop(7, "block", "hoe"),
    stop(8, "well"),
    stop(9, "block", "sow"),
    stop(10, "home"),
  ],
  3: [
    stop(4, "byre"),
    stop(
      5,
      "block",
      "sow",
      {
        en: "The millet is sown in its time; a crop sown in season fills the ear.",
        zh: "禾得时而种，其穗大。",
      },
      { cite: LVSHI_SEASON },
    ),
    stop(7, "block", "hoe"),
    stop(8, "well"),
    stop(9, "block", "sow"),
    stop(10, "home"),
  ],
  4: [
    stop(
      5,
      "field-south",
      "reap",
      {
        en: "The wheat comes in: the south blocks are reaped.",
        zh: "农乃登麦，刈南田。",
      },
      { cite: LIJI_WHEAT },
    ),
    stop(6, "field-south", "carry"),
    stop(7, "threshing", "carry"),
    stop(8, "well"),
    stop(9, "field-south", "sow", {
      en: "The beans go in behind the reapers.",
      zh: "刈麦之后即种菽。",
    }),
    stop(10, "home"),
  ],
  5: [
    stop(5, "block", "hoe", {
      en: "The millet is weeded and hoed through the heat.",
      zh: "耘耔于暑。",
    }),
    stop(
      6,
      "field-north",
      "reap",
      {
        en: "The broomcorn is the first grain of the year to come in.",
        zh: "农乃登黍，岁之首获。",
      },
      { cite: LIJI_MILLET },
    ),
    stop(7, "block", "hoe"),
    stop(8, "well"),
    stop(9, "block", "hoe"),
    stop(10, "home"),
  ],
  6: [
    stop(5, "block", "hoe"),
    stop(
      7,
      "block",
      "hoe",
      {
        en: "The stubble is burned and the water let in, to kill the weeds and feed the ground.",
        zh: "烧薙行水，利以杀草，可以粪田畴。",
      },
      { cite: LIJI_BURN },
    ),
    stop(8, "crossroads", "sit", {
      en: "The noon is spent under the willow at the crossroads.",
      zh: "午憩衢柳之下。",
    }),
    stop(9, "block", "hoe"),
    stop(10, "home"),
  ],
  7: [
    stop(
      5,
      "field-hemp",
      "chop",
      {
        en: "The hemp is cut and carried to the water to ret.",
        zh: "刈麻，沤之于池。",
      },
      { cite: SHIJING_HEMP },
    ),
    stop(6, "block", "reap"),
    stop(7, "block", "reap"),
    stop(8, "well"),
    stop(9, "block", "carry"),
    stop(10, "home"),
  ],
  8: [
    stop(5, "block", "reap"),
    stop(6, "threshing", "carry"),
    stop(
      7,
      "field-south",
      "sow",
      {
        en: "The wheat is sown on the ordinance's warning: a household that misses the time is punished.",
        zh: "乃劝种麦，毋或失时，其有失时，行罪无疑。",
      },
      { cite: LIJI_SOW_WHEAT },
    ),
    stop(8, "well"),
    stop(9, "block", "reap"),
    stop(10, "home"),
  ],
  9: [
    stop(
      5,
      "block",
      "reap",
      {
        en: "The harvest: every field brought in.",
        zh: "农事备收。",
      },
      { cite: LIJI_HARVEST },
    ),
    stop(6, "block", "carry"),
    stop(7, "threshing", "thresh"),
    stop(8, "well"),
    stop(9, "field-east", "reap", {
      en: "The beans are pulled on the east blocks.",
      zh: "拔菽于东田。",
    }),
    stop(10, "home"),
  ],
  10: [
    stop(
      5,
      "field-paddy",
      "reap",
      {
        en: "The rice is reaped in the paddy.",
        zh: "十月获稻。",
      },
      { cite: SHIJING_JUJUBE },
    ),
    stop(6, "threshing", "carry"),
    stop(
      7,
      "threshing",
      "thresh",
      {
        en: "The floor is swept and the grain threshed.",
        zh: "十月涤场。",
      },
      { cite: SHIJING_FEAST },
    ),
    stop(8, "well"),
    stop(9, "granary", "carry", {
      en: "Every household's grain into the granary.",
      zh: "纳禾稼于仓。",
    }),
    stop(10, "home", "sit"),
  ],
  11: [
    stop(4, "byre"),
    stop(
      5,
      "woods",
      "chop",
      {
        en: "The winter's work is firewood: every man to the woods.",
        zh: "冬则伐薪樵。",
      },
      { cite: HANSHU_WOODS },
    ),
    stop(6, "woods", "chop"),
    stop(7, "woods", "carry"),
    stop(8, "well"),
    stop(9, "home", "sit"),
    stop(10, "home"),
  ],
  12: [
    stop(4, "byre"),
    stop(
      5,
      "pond",
      "chop",
      {
        en: "The ice is cut on the pond.",
        zh: "二之日凿冰冲冲。",
      },
      { cite: SHIJING_ICE },
    ),
    stop(6, "pond", "carry"),
    stop(7, "icehouse", "carry"),
    stop(8, "well"),
    stop(9, "hall", "sit"),
    stop(10, "home"),
  ],
};

/** the women's year: wife, son's wife, and widow */
const WOMEN: Days = {
  1: [
    stop(4, "well", "draw"),
    stop(5, "home", "kneel", {
      en: "The new year's wine is brewed.",
      zh: "酿岁酒。",
    }),
    stop(7, "home"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  2: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "kneel"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  3: [
    stop(4, "well", "draw"),
    stop(
      5,
      "orchard",
      "pick",
      {
        en: "With the deep basket along the small paths, for the tender mulberry.",
        zh: "女执懿筐，遵彼微行，爰求柔桑。",
      },
      { cite: SHIJING_MULBERRY },
    ),
    stop(
      6,
      "silkshed",
      "carry",
      {
        en: "The silkworms are fed; from this month the day runs through the shed.",
        zh: "饲蚕，自是月日经蚕室。",
      },
      { cite: LIJI_SILK },
    ),
    stop(7, "home", "kneel"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  4: [
    stop(4, "well", "draw"),
    stop(5, "silkshed", "spin", {
      en: "The cocoons are reeled at the shed.",
      zh: "缫丝于蚕室。",
    }),
    stop(
      7,
      "block",
      "carry",
      {
        en: "Food carried out to the men in the south acres.",
        zh: "馌彼南亩。",
      },
      { cite: SHIJING_QIYUE_MEAL },
    ),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  5: [
    stop(4, "well", "draw"),
    stop(5, "field-hemp", "hoe", {
      en: "The hemp ground is weeded.",
      zh: "耘麻田。",
    }),
    stop(7, "block", "carry", undefined, { cite: SHIJING_QIYUE_MEAL }),
    stop(8, "home", "weave"),
    stop(9, "home", "pick", {
      en: "The mallow and the melons in the garden.",
      zh: "采葵摘瓜于圃。",
    }),
    stop(10, "well", "draw"),
  ],
  6: [
    stop(4, "well", "draw"),
    stop(
      5,
      "washing",
      "dye",
      {
        en: "The dyeing at the water with the vats.",
        zh: "染采于沤池之侧。",
      },
      { cite: LIJI_DYE },
    ),
    stop(7, "block", "carry", undefined, { cite: SHIJING_QIYUE_MEAL }),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  7: [
    stop(4, "well", "draw"),
    stop(
      5,
      "washing",
      "wash",
      {
        en: "The hemp is retted and stripped at the water.",
        zh: "沤麻剥麻于池。",
      },
      { cite: SHIJING_HEMP },
    ),
    stop(7, "block", "carry", undefined, { cite: SHIJING_QIYUE_MEAL }),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  8: [
    stop(4, "well", "draw"),
    stop(
      5,
      "home",
      "spin",
      {
        en: "In the eighth month the hemp is spun.",
        zh: "八月载绩。",
      },
      { cite: SHIJING_HEMP },
    ),
    stop(
      6,
      "home",
      "pick",
      {
        en: "The jujubes are beaten down and the gourds cut from the fence.",
        zh: "八月剥枣，八月断壶。",
      },
      { cite: SHIJING_JUJUBE },
    ),
    stop(7, "block", "carry", undefined, { cite: SHIJING_QIYUE_MEAL }),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  9: [
    stop(4, "well", "draw"),
    stop(5, "block", "reap", {
      en: "At the harvest the women are in the blocks with the children.",
      zh: "获时妇子皆在田。",
    }),
    stop(6, "block", "carry"),
    stop(7, "block", "carry"),
    stop(8, "threshing", "carry"),
    stop(10, "well", "draw"),
  ],
  10: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave", {
      en: "The loom all day now that the fields are in.",
      zh: "田事既毕，终日在机。",
    }),
    stop(7, "home", "weave"),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  11: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "weave"),
    stop(
      8,
      "home",
      "spin",
      {
        en: "The women of one lane spin together through the winter nights.",
        zh: "妇人同巷相从夜绩。",
      },
      { cite: HANSHU_WOODS },
    ),
    stop(10, "well", "draw"),
  ],
  12: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "weave"),
    stop(8, "home", "spin"),
    stop(9, "hall", "sit"),
    stop(10, "well", "draw"),
  ],
};

/** the grown daughters: the mulberry, the spindle, the shed, the hemp */
const DAUGHTER: Days = {
  1: [
    stop(4, "well", "draw"),
    stop(5, "home", "spin"),
    stop(7, "home", "weave"),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  2: [
    stop(4, "well", "draw"),
    stop(5, "home", "spin"),
    stop(7, "orchard", "pick"),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  3: [
    stop(4, "well", "draw"),
    stop(5, "orchard", "pick", undefined, { cite: SHIJING_MULBERRY }),
    stop(7, "silkshed", "carry"),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  4: [
    stop(4, "well", "draw"),
    stop(5, "silkshed", "spin"),
    stop(7, "silkshed", "carry"),
    stop(8, "field-hemp", "hoe"),
    stop(10, "well", "draw"),
  ],
  5: [
    stop(4, "well", "draw"),
    stop(5, "field-hemp", "hoe"),
    stop(7, "home", "spin"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  6: [
    stop(4, "well", "draw"),
    stop(5, "field-hemp", "hoe"),
    stop(7, "home", "spin"),
    stop(8, "washing", "wash"),
    stop(10, "well", "draw"),
  ],
  7: [
    stop(4, "well", "draw"),
    stop(5, "washing", "wash", undefined, { cite: SHIJING_HEMP }),
    stop(7, "home", "spin"),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  8: [
    stop(4, "well", "draw"),
    stop(5, "home", "spin", undefined, { cite: SHIJING_HEMP }),
    stop(6, "home", "pick", undefined, { cite: SHIJING_JUJUBE }),
    stop(8, "home", "spin"),
    stop(10, "well", "draw"),
  ],
  9: [
    stop(4, "well", "draw"),
    stop(5, "block", "carry"),
    stop(6, "block", "reap"),
    stop(8, "threshing", "carry"),
    stop(10, "well", "draw"),
  ],
  10: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "spin"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  11: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "spin"),
    stop(8, "home", "weave"),
    stop(10, "well", "draw"),
  ],
  12: [
    stop(4, "well", "draw"),
    stop(5, "home", "weave"),
    stop(7, "home", "spin"),
    stop(9, "hall", "sit"),
    stop(10, "well", "draw"),
  ],
};

/** the children: the ducks, the meadow, the crossroads, the gleaning */
const CHILD: Days = {
  1: [
    stop(5, "pond", "fish", {
      en: "The fish come up under the ice.",
      zh: "鱼上冰。",
    }),
    stop(7, "crossroads", "play"),
    stop(9, "home"),
  ],
  2: [
    stop(5, "pond", "play", {
      en: "The ducks are driven down to the pond.",
      zh: "驱鹜至陂。",
    }),
    stop(6, "meadow", "play"),
    stop(7, "crossroads", "play"),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  3: [
    stop(5, "pond", "play"),
    stop(6, "meadow", "play"),
    stop(7, "block", "carry", {
      en: "Water carried out to the block at noon.",
      zh: "午则负水至田。",
    }),
    stop(8, "crossroads", "play"),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  4: [
    stop(5, "pond", "play"),
    stop(6, "meadow", "play"),
    stop(7, "block", "carry"),
    stop(8, "crossroads", "play"),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  5: [
    stop(5, "pond", "play"),
    stop(6, "meadow", "play"),
    stop(7, "block", "carry"),
    stop(8, "home", "pick", {
      en: "The melons in the garden bed.",
      zh: "圃中之瓜。",
    }),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  6: [
    stop(5, "pond", "play"),
    stop(6, "meadow", "play"),
    stop(7, "block", "carry"),
    stop(8, "home", "pick"),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  7: [
    stop(5, "pond", "play"),
    stop(
      7,
      "crossroads",
      "play",
      {
        en: "In the seventh month the melons are eaten.",
        zh: "七月食瓜。",
      },
      { cite: SHIJING_MELON },
    ),
    stop(8, "block", "carry"),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  8: [
    stop(5, "pond", "play"),
    stop(
      6,
      "home",
      "carry",
      {
        en: "The jujubes beaten down from the gate tree with poles.",
        zh: "以竿剥枣于门。",
      },
      { cite: SHIJING_JUJUBE },
    ),
    stop(7, "block", "carry", {
      en: "Gleaning behind the reapers.",
      zh: "拾穗于刈者之后。",
    }),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  9: [
    stop(5, "block", "carry"),
    stop(7, "block", "carry"),
    stop(
      8,
      "home",
      "carry",
      {
        en: "The chestnuts from the gate tree.",
        zh: "拾栗于门。",
      },
      { cite: SHIJING_MELON },
    ),
    stop(9, "pond"),
    stop(10, "home"),
  ],
  10: [stop(5, "pond", "play"), stop(7, "threshing", "play"), stop(9, "home")],
  11: [
    stop(5, "crossroads", "play"),
    stop(7, "home"),
    stop(8, "crossroads", "play"),
    stop(9, "home"),
  ],
  12: [stop(5, "pond", "fish"), stop(7, "crossroads", "play"), stop(9, "home")],
};

/** the old: the grannies and the grandfather who is not a 伍老 */
const OLD: Days = {
  1: [stop(5, "home", "sit"), stop(7, "home", "spin"), stop(8, "home", "sit")],
  2: [stop(5, "home", "spin"), stop(7, "home", "sit"), stop(8, "home", "spin")],
  3: [stop(5, "home", "spin"), stop(7, "home", "sit"), stop(8, "home", "spin")],
  4: [
    stop(5, "home", "spin"),
    stop(7, "crossroads", "sit"),
    stop(8, "home", "spin"),
  ],
  5: [
    stop(5, "home", "spin"),
    stop(7, "crossroads", "sit"),
    stop(8, "home", "spin"),
  ],
  6: [
    stop(5, "home", "spin"),
    stop(7, "crossroads", "sit"),
    stop(8, "home", "spin"),
  ],
  7: [stop(5, "home", "spin"), stop(7, "home", "sit"), stop(8, "home", "spin")],
  8: [stop(5, "home", "spin"), stop(7, "home", "sit"), stop(8, "home", "spin")],
  9: [
    stop(5, "home", "spin"),
    stop(7, "threshing", "sit", {
      en: "The old watch the threshing from the edge of the floor.",
      zh: "老者坐场边观之。",
    }),
    stop(9, "home", "sit"),
  ],
  10: [stop(5, "home", "spin"), stop(7, "home", "sit"), stop(8, "home", "sit")],
  11: [stop(5, "home", "sit"), stop(7, "home", "spin"), stop(8, "home", "sit")],
  12: [stop(5, "home", "sit"), stop(7, "home", "spin"), stop(9, "hall", "sit")],
};

/** the five 伍老: the altar at dawn, the 伍's gate, the byre, the floor, the hall */
const WULAO: Days = {
  1: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "byre"),
    stop(8, "home", "sit"),
  ],
  2: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "byre"),
    stop(8, "home", "sit"),
  ],
  3: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "byre"),
    stop(8, "home", "sit"),
  ],
  4: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "crossroads", "sit"),
    stop(9, "home"),
  ],
  5: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "crossroads", "sit"),
    stop(9, "home"),
  ],
  6: [
    stop(4, "shrine", "bow"),
    stop(5, "home", "sit"),
    stop(7, "crossroads", "sit"),
    stop(9, "home"),
  ],
  7: [
    stop(4, "shrine", "bow"),
    stop(5, "granary", "sit"),
    stop(7, "threshing", "sit"),
    stop(9, "home"),
  ],
  8: [
    stop(4, "shrine", "bow"),
    stop(5, "granary", "sit"),
    stop(7, "threshing", "sit"),
    stop(9, "home"),
  ],
  9: [
    stop(4, "shrine", "bow"),
    stop(5, "granary", "sit"),
    stop(7, "threshing", "sit"),
    stop(9, "home"),
  ],
  10: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "sit"),
    stop(7, "home", "sit"),
    stop(9, "home"),
  ],
  11: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "sit"),
    stop(7, "home", "sit"),
    stop(9, "home"),
  ],
  12: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "sit"),
    stop(7, "shrine", "bow"),
    stop(9, "hall", "sit"),
  ],
};

/** the elder's year: the banks, the altar, the hall, the granary, the station */
const ELDER: Days = {
  1: [
    stop(4, "shrine", "bow"),
    stop(5, "field-west", "stand", {
      en: "The elder walks the banks to see the boundaries repaired.",
      zh: "里典巡阡陌，视封疆。",
    }),
    stop(7, "hall", "read", undefined, { cite: ZHOULI_READ }),
    stop(9, "home", "sit"),
  ],
  2: [
    stop(4, "shrine", "bow"),
    stop(5, "field-west", "stand"),
    stop(7, "hall", "read"),
    stop(9, "home", "sit"),
  ],
  3: [
    stop(4, "shrine", "bow"),
    stop(5, "field-paddy", "stand"),
    stop(7, "hall", "read"),
    stop(9, "home", "sit"),
  ],
  4: [
    stop(4, "shrine", "bow"),
    stop(5, "byre", "stand", undefined, { cite: SHUIHUDI_OXEN }),
    stop(7, "hall", "read", undefined, { cite: ZHOULI_READ }),
    stop(8, "well"),
    stop(9, "home", "sit"),
  ],
  5: [
    stop(4, "shrine", "bow"),
    stop(5, "field-north", "stand"),
    stop(7, "hall", "read"),
    stop(8, "well"),
    stop(9, "home", "sit"),
  ],
  6: [
    stop(4, "shrine", "bow"),
    stop(5, "field-south", "stand"),
    stop(7, "hall", "read"),
    stop(8, "crossroads", "sit"),
    stop(9, "home", "sit"),
  ],
  7: [
    stop(4, "shrine", "bow"),
    stop(5, "granary", "stand"),
    stop(7, "hall", "read", undefined, { cite: ZHOULI_READ }),
    stop(9, "home", "sit"),
  ],
  8: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "read", {
      en: "The register is gone over with the county's clerk.",
      zh: "与令史案比户籍。",
    }),
    stop(7, "field-south", "stand", undefined, { cite: LIJI_SOW_WHEAT }),
    stop(9, "home", "sit"),
  ],
  9: [
    stop(4, "shrine", "bow"),
    stop(5, "threshing", "stand"),
    stop(7, "granary", "stand"),
    stop(9, "station", "stand"),
  ],
  10: [
    stop(4, "shrine", "bow"),
    stop(5, "station", "carry", {
      en: "Qin's year opens in the tenth month: the ward's tallies go to the county.",
      zh: "秦以十月为岁首，里典上计于县。",
    }),
    stop(7, "hall", "read", undefined, { cite: ZHOULI_READ }),
    stop(9, "home", "sit"),
  ],
  11: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "read"),
    stop(7, "threshing", "stand"),
    stop(9, "home", "sit"),
  ],
  12: [
    stop(4, "shrine", "bow"),
    stop(5, "hall", "read"),
    stop(7, "shrine", "bow"),
    stop(9, "hall", "sit"),
  ],
};

/** the ox-master: the byre morning and evening, the oxen led out between */
const OXMASTER: Days = {
  1: [
    stop(4, "byre"),
    stop(5, "byre", "kneel", undefined, { cite: SHUIHUDI_OXEN }),
    stop(7, "meadow", "lead"),
    stop(10, "byre"),
  ],
  2: [
    stop(4, "byre"),
    stop(5, "block", "lead"),
    stop(7, "block", "lead"),
    stop(8, "well"),
    stop(9, "byre"),
    stop(10, "byre"),
  ],
  3: [
    stop(4, "byre"),
    stop(5, "block", "lead"),
    stop(7, "block", "lead"),
    stop(8, "well"),
    stop(9, "byre"),
    stop(10, "byre"),
  ],
  4: [
    stop(4, "byre", "kneel", undefined, { cite: SHUIHUDI_OXEN }),
    stop(5, "meadow", "lead"),
    stop(7, "meadow"),
    stop(9, "byre"),
  ],
  5: [
    stop(4, "byre"),
    stop(5, "meadow", "lead"),
    stop(7, "meadow"),
    stop(9, "byre"),
  ],
  6: [
    stop(4, "byre"),
    stop(5, "meadow", "lead"),
    stop(7, "meadow"),
    stop(9, "byre"),
  ],
  7: [
    stop(4, "byre", "kneel", undefined, { cite: SHUIHUDI_OXEN }),
    stop(5, "meadow", "lead"),
    stop(7, "meadow"),
    stop(9, "byre"),
  ],
  8: [
    stop(4, "byre"),
    stop(5, "meadow", "lead"),
    stop(7, "meadow"),
    stop(9, "byre"),
  ],
  9: [
    stop(4, "byre"),
    stop(5, "threshing", "lead"),
    stop(7, "meadow", "lead"),
    stop(9, "byre"),
  ],
  10: [
    stop(4, "byre", "kneel", undefined, { cite: SHUIHUDI_OXEN }),
    stop(5, "field-paddy", "lead"),
    stop(7, "threshing", "lead"),
    stop(9, "byre"),
  ],
  11: [
    stop(4, "byre"),
    stop(5, "meadow", "lead"),
    stop(7, "byre"),
    stop(9, "byre"),
  ],
  12: [
    stop(4, "byre"),
    stop(5, "meadow", "lead"),
    stop(7, "byre"),
    stop(9, "byre"),
  ],
};

/** the oxen: the plough, the meadow, the floor, the byre */
const OX: Days = {
  1: [
    stop(4, "byre", "lie"),
    stop(7, "meadow", "graze"),
    stop(9, "byre", "lie"),
  ],
  2: [
    stop(4, "byre", "lie"),
    stop(5, "block", "plough"),
    stop(7, "block", "plough"),
    stop(9, "byre", "lie"),
  ],
  3: [
    stop(4, "byre", "lie"),
    stop(5, "block", "plough"),
    stop(7, "block", "plough"),
    stop(9, "byre", "lie"),
  ],
  4: [stop(5, "meadow", "graze"), stop(9, "byre", "lie")],
  5: [stop(5, "meadow", "graze"), stop(9, "byre", "lie")],
  6: [stop(5, "meadow", "graze"), stop(9, "byre", "lie")],
  7: [stop(5, "meadow", "graze"), stop(9, "byre", "lie")],
  8: [stop(5, "meadow", "graze"), stop(9, "byre", "lie")],
  9: [
    stop(5, "threshing", "plough", {
      en: "The ox drags the sledge over the floor.",
      zh: "牛曳磟碡于场。",
    }),
    stop(9, "byre", "lie"),
  ],
  10: [
    stop(5, "field-paddy", "plough"),
    stop(7, "threshing", "plough"),
    stop(9, "byre", "lie"),
  ],
  11: [
    stop(4, "byre", "lie"),
    stop(7, "meadow", "graze"),
    stop(9, "byre", "lie"),
  ],
  12: [
    stop(4, "byre", "lie"),
    stop(7, "meadow", "graze"),
    stop(9, "byre", "lie"),
  ],
};

/** the post clerk: the station, and a walk of the lane morning and afternoon */
const POSTCLERK_DAY: Stop[] = [
  stop(4, "station", "stand"),
  stop(5, "crossroads"),
  stop(6, "station", "write"),
  stop(9, "crossroads"),
  stop(10, "station", "stand"),
];

/** the pedlar's walk of the three lanes from the edge to the crossroads and back */
const PEDLAR_DAY: Stop[] = [
  stop(5, "edge", undefined, undefined, { overlays: ["pole"] }),
  stop(
    6,
    "gate-east",
    "carry",
    {
      en: "The pedlar comes in by the east gate with his pole.",
      zh: "贩夫担而入东闾。",
    },
    { cite: YUEFU_PEDLAR },
  ),
  stop(7, "crossroads", "carry"),
  stop(8, "gate-west", "carry"),
  stop(9, "gate-south", "carry"),
  stop(10, "edge"),
];

const COUNTYCLERK_DAY: Stop[] = [
  stop(5, "station", "stand"),
  stop(6, "hall", "write", {
    en: "The county's clerk takes the register at the hall.",
    zh: "令史案比于序。",
  }),
  stop(8, "hall", "write"),
  stop(10, "edge"),
];

const FIELDOFFICER_DAY: Stop[] = [
  stop(
    5,
    "byre",
    "inspect",
    {
      en: "The field officer reckons the oxen at the byre.",
      zh: "田啬夫肤田牛于牢。",
    },
    { cite: SHUIHUDI_OXEN },
  ),
  stop(7, "hall", "write"),
  stop(9, "edge"),
];

const LIEUTENANT_MUSTER: Stop[] = [
  stop(5, "hall", "command", undefined, { cite: SHUIHUDI_YAO }),
  stop(7, "crossroads", "command"),
  stop(9, "edge"),
];
const LIEUTENANT_DRILL: Stop[] = [
  stop(5, "archery", "command"),
  stop(7, "threshing", "command"),
  stop(9, "edge"),
];

/** a visitor's stand-off stop for a month they are not here */
const AWAY: Stop[] = [stop(4, "edge")];

const everyMonth = (day: Stop[]): Days =>
  Object.fromEntries(MONTH_IDS.map((month) => [month, day])) as Days;

const inMonths = (months: Month[], day: Stop[]): Days =>
  Object.fromEntries(
    MONTH_IDS.map((month) => [month, months.includes(month) ? day : AWAY]),
  ) as Days;

/** the year's circuits by role, as authored */
export const VILLAGE_DAYS: Partial<Record<Role, Days>> = {
  head: MEN,
  son: MEN,
  brother: MEN,
  wife: WOMEN,
  widow: WOMEN,
  daughter: DAUGHTER,
  child: CHILD,
  old: OLD,
  wulao: WULAO,
  elder: ELDER,
  oxmaster: OXMASTER,
  ox: OX,
  postclerk: everyMonth(POSTCLERK_DAY),
  pedlar: everyMonth(PEDLAR_DAY),
  countyclerk: inMonths([8], COUNTYCLERK_DAY),
  fieldofficer: inMonths([1, 4, 7, 10], FIELDOFFICER_DAY),
  lieutenant: {
    ...inMonths([], AWAY),
    10: LIEUTENANT_MUSTER,
    11: LIEUTENANT_DRILL,
  },
};

/** the authored days flattened to the engine's shape */
export const flattenCircuits = (days: Partial<Record<Role, Days>>): Circuit[] =>
  (Object.entries(days) as [Role, Days][]).flatMap(([role, months]) =>
    (Object.entries(months) as unknown as [string, Stop[]][]).map(
      ([month, stops]) => ({
        role,
        month: Number(month) as Month,
        stops: [...stops].sort((a, b) => a.hour - b.hour),
      }),
    ),
  );

export const VILLAGE_CIRCUITS: Circuit[] = flattenCircuits(VILLAGE_DAYS);
