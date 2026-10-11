/**
 * The village's year of events (plan `20260909_Plan_village_year.md` §6):
 * each on a day of a month and at an hour, played as scenes of stage
 * directions in the town vocabulary, with who attends and what it changes
 * on the register. A festival and a collection are the same shape.
 *
 * A named villager acts under `village:<id>` with the sprite the register
 * gives them, a crowd under `village:<archetype>`; `changes` are folded by
 * `registerAt`. The rites the almanac's year keeps (`years/village.ts`) are
 * carried here as events with the same cites.
 */
import type { Cite, Month } from "../../almanac";
import { MONTH_IDS } from "../../almanac";
import type {
  StageActor,
  StageArchetype,
  StageDirection,
} from "../../../lib/types";
import type { Attendance, Hour, RegisterChange, SiteEvent } from "../../site";
import { FARMING_MONTHS, turnsOf, villager } from "./register";

const cite = (id: string, line: number, note: string): Cite => ({
  id,
  line,
  note,
});

// the lines the events are written from, each located in the lake
const ZHOULI_READ = cite(
  "zhouli-zh",
  521,
  "地官 黨正: 四時之孟月吉日，則屬民而讀邦法",
);
const ZHOULI_DRINK = cite(
  "zhouli-zh",
  521,
  "地官 黨正: 以禮屬民而飲酒于序，以正齒位",
);
const ZHOULI_WU = cite(
  "zhouli-zh",
  372,
  "春官 女巫: 掌歲時祓除、釁浴。旱暵則舞雩",
);
const ZHOULI_ZUSHI = cite(
  "zhouli-zh",
  522,
  "地官 族師: 登其族之夫家眾寡，辨其貴賤、老幼、廢疾",
);
const ZHOULI_MEI = cite("zhouli-zh", 541, "地官 媒氏: 中春之月，令會男女");
const ZHOULI_REVIEW = cite("zhouli-zh", 1344, "夏官 大司馬: 中冬教大閱");
const YILI_WEDDING = cite("yili-zh", 263, "士昬禮");
const YILI_ARCHERY = cite("yili-zh", 416, "鄉射禮");
const YILI_DRINK = cite("yili-zh", 475, "鄉飲酒禮");
const LIJI_SHE = cite("liji-zh", 501, "郊特牲: 唯為社事，單出里");
const LIJI_QIGU = cite("liji-zh", 1580, "月令 孟春: 祈穀于上帝");
const LIJI_SPRING_SHE = cite("liji-zh", 1590, "月令 仲春: 擇元日，命民社");
const LIJI_SILK = cite(
  "liji-zh",
  1606,
  "月令 季春: 后妃齊戒，親東鄉躬桑，以勸蠶事",
);
const LIJI_WHEAT = cite(
  "liji-zh",
  1618,
  "月令 孟夏: 農乃登麥 … 蠶事既畢，后妃獻繭",
);
const LIJI_YU = cite("liji-zh", 1627, "月令 仲夏: 大雩帝，用盛樂");
const LIJI_SHU = cite("liji-zh", 1628, "月令 仲夏: 農乃登黍");
const LIJI_DYE = cite("liji-zh", 1641, "月令 季夏: 命婦官染采");
const LIJI_BURN = cite("liji-zh", 1643, "月令 季夏: 燒薙行水");
const LIJI_NEW = cite("liji-zh", 1651, "月令 孟秋: 農乃登穀，天子嘗新");
const LIJI_SOW_WHEAT = cite("liji-zh", 1665, "月令 仲秋: 乃勸種麥，毋或失時");
const LIJI_HARVEST = cite("liji-zh", 1676, "月令 季秋: 農事備收");
const LIJI_FEAST = cite("liji-zh", 1697, "月令 孟冬: 大飲烝");
const LIJI_NUO = cite("liji-zh", 1721, "月令 季冬: 命有司大難，旁磔");
const LIJI_ZHA = cite("liji-zh", 1844, "雜記: 子貢觀於蜡 … 一國之人皆若狂");
const SHIJING_MEAL = cite("shijing-zh", 1074, "甫田: 以其婦子，饁彼南畝");
const SHIJING_DONGSHAN = cite("shijing-zh", 1307, "東山: 我徂東山，慆慆不歸");
const SHIJING_CLOTHES = cite("shijing-zh", 3823, "七月: 九月授衣");
const SHIJING_HEMP = cite("shijing-zh", 3828, "七月: 八月載績");
const SHIJING_RICE = cite("shijing-zh", 3833, "七月: 八月剝棗，十月穫稻");
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
const SHIJING_FEAST = cite(
  "shijing-zh",
  3838,
  "七月: 十月滌場，朋酒斯饗，曰殺羔羊",
);
const SHIJING_ZHENWEI = cite("shijing-zh", 3962, "溱洧: 士與女，方秉蕑兮");
const SHUIHUDI_OXEN = cite(
  "shuihudi-zh",
  361,
  "廄苑律: 以四月、七月、十月、正月膚田牛。卒歲，以正月大課之",
);
const SHUIHUDI_FU = cite("shuihudi-zh", 410, "傅律: 匿敖童 … 典、老贖耐");
const SHUIHUDI_SHU = cite("shuihudi-zh", 416, "戍律: 同居毋并行");
const SHUIHUDI_FODDER = cite(
  "shuihudi-zh",
  443,
  "田律: 入頃芻稾 … 頃入芻三石、稾二石",
);
const SHUIHUDI_YAO = cite("shuihudi-zh", 520, "徭律");
const YUELU_YAO = cite(
  "village-geng-wang-zh",
  173,
  "岳麓秦簡 徭律 (as Wang Yanhui quotes it): 田時先行富有賢人，以閒時行貧者",
);
const HANSHU_WOODS = cite("hanshu-zh", 6631, "食貨志: 伐薪樵");
const HANSHU_GENG = cite(
  "hanshu-zh",
  6635,
  "食貨志 董仲舒: 月為更卒，已復為正一歲，屯戍一歲",
);
const SHIJI_LA = cite("shiji-zh", 2122, "六國年表 秦惠文王十二年: 初臘");
const SHIJI_YEAR = cite("shiji-zh", 3991, "封禪書: 秦以冬十月為歲首");
const MENGZI_WELL = cite("mengzi-zh", 1460, "滕文公上: 死徙無出鄉，鄉田同井");
const SHANGJUN_REGISTER = cite("shangjunshu-zh", 114, "境內: 生者著，死者削");
const LVSHI_WHEAT = cite("lvshichunqiu-zh", 15, "仲秋紀: 乃勸種麥");
const LVSHI_SEASON = cite("lvshichunqiu-zh", 234, "審時");
const LUNYU_NUO = cite("lunyu-zh", 774, "鄉黨: 鄉人儺，朝服而立於阼階");
const FANYU_QIUYU = cite(
  "chunqiufanlu-zh",
  428,
  "求雨: 春旱求雨，令縣邑以水日禱社稷山川",
);
const DUDUAN_NUO = cite("duduan-zh", 104, "方相氏 … 執戈揚盾，帥百隸而時難");
const DUDUAN_LA = cite("duduan-zh", 107, "周曰大蠟，漢曰臘");
const FENGSU_LA = cite(
  "fengsutongyi-zh",
  390,
  "臘者，獵也，言田獵取獸以祭祀其先祖也",
);
const YUEFU_PEDLAR = cite("yuefu-zh", 5564, "陌上桑");
const SEASON_SHE = { id: "season-she-zh", note: "社日" } satisfies Cite;

/** a named villager, with the sprite the register gives them */
const person = (id: string, overlays?: string[]): StageActor => {
  const v = villager(id);
  return {
    seat: `village:${id}`,
    archetype: v.archetype,
    ...(v.sprite ? { variant: v.sprite } : {}),
    ...(overlays || v.overlays
      ? { overlays: [...(v.overlays ?? []), ...(overlays ?? [])] }
      : {}),
  };
};

/** a crowd of one archetype */
const crowd = (archetype: StageArchetype, overlays?: string[]): StageActor => ({
  seat: `village:${archetype}`,
  archetype,
  ...(overlays ? { overlays } : {}),
});

const route = (
  kind: StageDirection["kind"],
  actor: StageActor,
  from: string,
  to: string,
  extra: Partial<StageDirection> = {},
): StageDirection => ({ kind, actor, from, to, ...extra });
const at = (
  kind: StageDirection["kind"],
  actor: StageActor,
  place: string,
  extra: Partial<StageDirection> = {},
): StageDirection => ({ kind, actor, at: place, ...extra });

const house = (n: number): string => `house-${String(n).padStart(2, "0")}`;

const event = (
  id: string,
  month: Month,
  day: number,
  hour: Hour,
  title: { en: string; zh: string },
  line: { en: string; zh: string },
  cites: Cite[],
  script: StageDirection[][],
  extra: { attend?: Attendance; changes?: RegisterChange[] } = {},
): SiteEvent => ({
  id,
  month,
  day,
  hour,
  title,
  line,
  cite: cites,
  ...(extra.attend ? { attend: extra.attend } : {}),
  script,
  ...(extra.changes ? { changes: extra.changes } : {}),
});

/** the statutes read at the hall on the first day of each season's first month */
const statutes = (month: Month, andThen: StageDirection[][] = []): SiteEvent =>
  event(
    `m${month}-statutes`,
    month,
    1,
    5,
    { en: "The statutes read", zh: "读邦法" },
    {
      en: "On the first day of the season's first month the elder gathers the heads at the hall and reads them the statutes, to warn them.",
      zh: "四时之孟月吉日，里典属民于序，读邦法以纠戒之。",
    },
    [ZHOULI_READ],
    [
      [at("gather", crowd("peasant"), "hall", { count: 8 })],
      [at("rite", person("h01.qiang"), "hall", { pose: "read", count: 1 })],
      ...andThen,
    ],
    { attend: "heads" },
  );

/** the field officer at the byre with the ox-master, four times a year */
const oxenInspected = (
  month: Month,
  day: number,
  title: { en: string; zh: string },
  line: { en: string; zh: string },
  extra: StageDirection[][] = [],
): SiteEvent =>
  event(
    `m${month}-oxen`,
    month,
    day,
    5,
    title,
    line,
    [SHUIHUDI_OXEN],
    [
      [route("stroll", person("v.ji"), "station", "byre")],
      [
        at("inspect", person("v.ji"), "byre", { pose: "inspect" }),
        at("labour", person("h05.zhong"), "byre", { pose: "kneel" }),
        route("stroll", crowd("ox"), "byre", "meadow", { count: 3 }),
      ],
      ...extra,
    ],
    { attend: { villagers: ["v.ji", "h05.zhong", "h01.qiang"] } },
  );

/** the altar: every household leaves its house, the invocator's rite, the meat shared at the hall */
const altar = (
  id: string,
  month: Month,
  title: { en: string; zh: string },
  line: { en: string; zh: string },
  cites: Cite[],
): SiteEvent =>
  event(
    id,
    month,
    2,
    6,
    title,
    line,
    cites,
    [
      [
        route("stroll", crowd("peasant"), "crossroads", "shrine", { count: 3 }),
        route("stroll", crowd("matron"), "well", "shrine", { count: 3 }),
        route("stroll", crowd("child"), "crossroads", "shrine", { count: 2 }),
      ],
      [
        at("sacrifice", person("h05.shou"), "shrine", {
          count: 6,
          pose: "bow",
        }),
        at("rite", person("h01.qiang"), "shrine", { pose: "bow" }),
      ],
      [at("feast", person("h01.qiang"), "hall", { count: 8 })],
    ],
    { attend: "all" },
  );

/**
 * The month's 更卒 walk out on the first day and are away the month. Who goes
 * is the statute's rule (`VILLAGE_TURNS`): one man of a house that can spare
 * him while the fields are worked, five of the plain households in the slack
 * months. The tenth month has none, since the county's levy is its own event.
 */
const gengzu = (month: Month): SiteEvent | undefined => {
  const ids = turnsOf(month);
  if (ids.length === 0) return undefined;
  const farming = FARMING_MONTHS.includes(month);
  return event(
    `m${month}-gengzu`,
    month,
    1,
    4,
    farming
      ? { en: "A labour turn in the farming season", zh: "田时之更" }
      : { en: "The slack-season labour turns", zh: "闲时之更" },
    farming
      ? {
          en: "The fields are being worked, so the county calls one man only, from a house that can spare him: he walks out past the station to a month of the county's labour, and his household's day lacks him until it ends.",
          zh: "田时也，县发一丁，先行有余力之家：出邮道，为县更一月，其家一月无之。",
        }
      : {
          en: "The fields are in, and the tallies are called for the plain households: five of the ward's men, no two from one house, walk out past the station to a month of the county's labour.",
          zh: "田事毕，以券行贫者：里中五丁，同居毋并行，出邮道，为县更一月。",
        },
    farming
      ? [YUELU_YAO, SHUIHUDI_YAO, HANSHU_GENG]
      : [YUELU_YAO, SHUIHUDI_YAO, SHUIHUDI_SHU, HANSHU_GENG],
    [
      ids.map((id) =>
        route("stroll", person(id, ["pole"]), villager(id).home, "edge"),
      ),
    ],
    {
      attend: { villagers: [...ids] },
      changes: ids.map((id) => ({ villager: id, set: { away: month } })),
    },
  );
};

/** the pedlar on the fifteenth: the three lanes from the edge and back */
const pedlar = (month: Month): SiteEvent =>
  event(
    `m${month}-pedlar`,
    month,
    15,
    5,
    { en: "The pedlar", zh: "贩夫" },
    {
      en: "The pedlar comes in by the post road with his pole, walks the three lanes, stops at every gate, and goes out the way he came.",
      zh: "贩夫担而入自邮道，行三道，逐闾而止，复出。",
    },
    [YUEFU_PEDLAR],
    [
      [
        route("stroll", person("v.zi"), "edge", "crossroads", {
          pose: "carry",
        }),
      ],
      [
        route("stroll", person("v.zi"), "crossroads", "gate-west", {
          pose: "carry",
        }),
      ],
      [
        route("stroll", person("v.zi"), "gate-west", "gate-south", {
          pose: "carry",
        }),
      ],
      [
        route("stroll", person("v.zi"), "gate-south", "edge", {
          pose: "carry",
        }),
      ],
    ],
    { attend: { villagers: ["v.zi"] } },
  );

/** the ten men of the corvée party: two from each 伍 */
export const CORVEE_PARTY: readonly string[] = [
  "h02.an",
  "h04.jiu",
  "h08.ping",
  "h10.chang",
  "h13.lang",
  "h15.dang",
  "h17.guang",
  "h19.gui",
  "h21.rang",
  "h22.nu",
];

const YEAR_EVENTS: SiteEvent[] = [
  // 孟春
  statutes(1),
  event(
    "m1-prayer-grain",
    1,
    3,
    6,
    { en: "The prayer for grain", zh: "祈谷" },
    {
      en: "The elder leads the ward to the altar to pray for the year's grain, the first 伍老 speaking the invocation.",
      zh: "里典率里人于社祈谷，一伍之老为祝。",
    },
    [LIJI_QIGU],
    [
      [route("stroll", crowd("peasant"), "crossroads", "shrine", { count: 3 })],
      [
        at("sacrifice", person("h05.shou"), "shrine", {
          count: 6,
          pose: "bow",
        }),
        at("rite", person("h01.qiang"), "shrine", { count: 3, pose: "bow" }),
      ],
    ],
    { attend: "heads" },
  ),
  oxenInspected(
    1,
    8,
    { en: "The oxen reckoned", zh: "正月大课" },
    {
      en: "At the year's reckoning the field officer counts the ward's oxen at the byre and the ox-master is rewarded with wine and dried meat, or flogged, by how they have fared.",
      zh: "卒岁，以正月大课之：最者赐田啬夫壶酒束脯，赐牛长；殿者谇之，笞之。",
    },
  ),
  event(
    "m1-ice-stored",
    1,
    12,
    4,
    { en: "The ice stored", zh: "纳于凌阴" },
    {
      en: "A file of men carries the blocks cut on the pond up to the ice house in the hill.",
      zh: "三之日纳于凌阴：丁夫负冰自陂上凌阴。",
    },
    [SHIJING_ICE],
    [
      [
        route("stroll", crowd("peasant"), "pond", "icehouse", {
          count: 3,
          pose: "carry",
        }),
        at("labour", person("h05.zhong"), "pond", { pose: "kneel" }),
      ],
    ],
    { attend: "men" },
  ),
  // 仲春
  altar(
    "m2-spring-altar",
    2,
    { en: "The spring altar", zh: "春社" },
    {
      en: "On the chosen day every household leaves its house for the altar of the soil, the first 伍老 speaks the invocation, the elder makes the offering, and the meat is shared at the hall.",
      zh: "择元日命民社：唯为社事，单出里。一伍之老为祝，里典献，分胙于序。",
    },
    [LIJI_SPRING_SHE, LIJI_SHE, SEASON_SHE],
  ),
  event(
    "m2-wedding",
    2,
    15,
    10,
    { en: "A wedding", zh: "昬礼" },
    {
      en: "In the matchmaker's month the Wang son's household walks to the Zhou house at dusk and brings the Zhou daughter Wa back along the lane under the banner, the red sash on her shoulders; from the third month she is on the Wang register as a wife.",
      zh: "中春令会男女：昏时王氏之家往周氏，迎女娃归，执旗，女被红带；自三月著王氏籍为妻。",
    },
    [ZHOULI_MEI, YILI_WEDDING],
    [
      [
        route("receive", person("h03.sheng"), "house-03", "house-08", {
          count: 2,
        }),
      ],
      [
        route("wed", person("h08.wa", ["sash"]), "house-08", "house-03", {
          count: 6,
          effect: "banner",
        }),
      ],
      [at("feast", person("h03.ci"), "house-03", { count: 8 })],
    ],
    {
      attend: {
        villagers: [
          "h03.ci",
          "h03.ying",
          "h03.sheng",
          "h03.fang",
          "h08.ping",
          "h08.yuan",
          "h08.wa",
          "h08.rong",
        ],
      },
      changes: [
        {
          villager: "h08.wa",
          set: { household: "h03", relation: "son's wife", role: "wife" },
        },
      ],
    },
  ),
  // 季春
  event(
    "m3-lustration",
    3,
    3,
    6,
    { en: "The lustration", zh: "祓除" },
    {
      en: "On the first si day the young go down to the water below the ford with orchids in their hands and wash the winter off.",
      zh: "上巳祓除衅浴：士与女方秉蕑兮，下津水而浴。",
    },
    [ZHOULI_WU, SHIJING_ZHENWEI],
    [
      [
        route("stroll", crowd("maiden"), "crossroads", "washing", { count: 3 }),
        route("stroll", crowd("peasant"), "crossroads", "washing", {
          count: 3,
        }),
      ],
      [
        at("gather", crowd("maiden"), "washing", {
          count: 6,
          effect: "splash",
          pose: "wash",
        }),
        at("gather", crowd("child"), "washing", { count: 3, effect: "splash" }),
      ],
    ],
    { attend: "young" },
  ),
  event(
    "m3-paddy-hemp",
    3,
    8,
    5,
    { en: "The paddy flooded and the hemp sown", zh: "灌稻种麻" },
    {
      en: "The fourth 伍's men let the water into the paddy below the pond and set the rice; the second's sow the hemp ground by the washing place.",
      zh: "四伍之丁灌陂下稻田而莳稻，二伍之丁种麻于沤池之侧。",
    },
    [SHIJING_RICE, LVSHI_SEASON],
    [
      [
        route("till", person("h16.yang"), "house-16", "field-paddy", {
          count: 2,
          pose: "sow",
        }),
        route("till", person("h07.gan"), "house-07", "field-hemp", {
          count: 2,
          pose: "sow",
        }),
      ],
      [
        route("stroll", crowd("ox"), "byre", "field-paddy", {
          count: 2,
          pose: "plough",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m3-silkworms",
    3,
    10,
    5,
    { en: "The silkworms begin", zh: "亲蚕" },
    {
      en: "The women go to the mulberry with their baskets and to the shed with the leaves; from this day their day runs through the shed.",
      zh: "妇人执筐求桑，饲蚕于蚕室，自是日日经蚕室。",
    },
    [LIJI_SILK],
    [
      [route("stroll", crowd("matron"), "well", "orchard", { count: 3 })],
      [
        at("labour", crowd("matron"), "orchard", { count: 3, pose: "pick" }),
        at("labour", crowd("maiden"), "silkshed", { count: 2, pose: "carry" }),
      ],
    ],
    { attend: "women" },
  ),
  // 孟夏
  statutes(4),
  event(
    "m4-wheat",
    4,
    5,
    6,
    { en: "The wheat comes in", zh: "登麦" },
    {
      en: "The south blocks are reaped and the sheaves carried to the floor; the beans go in behind the reapers.",
      zh: "农乃登麦：刈南田，负禾至场，刈后即种菽。",
    },
    [LIJI_WHEAT],
    [
      [
        route("till", person("h07.gan"), "house-07", "field-south", {
          count: 2,
          pose: "reap",
        }),
        route("till", person("h21.tan"), "house-21", "field-south", {
          count: 2,
          pose: "reap",
        }),
      ],
      [
        route("stroll", crowd("peasant"), "field-south", "threshing", {
          count: 3,
          pose: "carry",
        }),
        at("labour", crowd("peasant"), "field-south", {
          count: 2,
          pose: "sow",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m4-cocoons",
    4,
    12,
    5,
    { en: "The cocoons presented", zh: "献茧" },
    {
      en: "The women reel the cocoons at the shed, and the elder receives the ward's silk at the hall, the tax on it reckoned by the mulberries.",
      zh: "蚕事既毕，妇人缫于蚕室，里典受茧于序，茧税以桑为均。",
    },
    [LIJI_WHEAT],
    [
      [at("labour", crowd("matron"), "silkshed", { count: 4, pose: "spin" })],
      [
        route("stroll", crowd("matron"), "silkshed", "hall", {
          count: 3,
          pose: "carry",
        }),
        at("rite", person("h01.qiang"), "hall", { pose: "stand" }),
      ],
    ],
    { attend: "women" },
  ),
  oxenInspected(
    4,
    20,
    { en: "The oxen inspected", zh: "肤田牛" },
    {
      en: "The field officer looks the ward's oxen over at the byre, as the stable statutes have him do in the fourth, seventh, tenth, and first months.",
      zh: "厩苑律：以四月、七月、十月、正月肤田牛。",
    },
  ),
  // 仲夏
  event(
    "m5-rain",
    5,
    8,
    6,
    { en: "The prayer for rain", zh: "雩" },
    {
      en: "The invocator dances for rain at the altar with the daughters of the ward, as the shamaness dances the yu in a drought.",
      zh: "大雩：祝与里女舞雩于社，旱暵则舞雩。",
    },
    [LIJI_YU, ZHOULI_WU, FANYU_QIUYU],
    [
      [route("stroll", crowd("maiden"), "crossroads", "shrine", { count: 3 })],
      [
        at("sacrifice", person("h05.shou"), "shrine", {
          count: 6,
          pose: "bow",
        }),
        at("gather", crowd("maiden"), "shrine", { count: 6 }),
        at("rite", person("h01.qiang"), "shrine", { pose: "bow" }),
      ],
    ],
    { attend: "young" },
  ),
  event(
    "m5-broomcorn",
    5,
    20,
    5,
    { en: "The broomcorn comes in", zh: "登黍" },
    {
      en: "The north block is reaped and the first new grain of the year is tasted at the altar.",
      zh: "农乃登黍：刈北田，以新黍荐于社。",
    },
    [LIJI_SHU],
    [
      [
        route("till", person("h22.nu"), "house-22", "field-north", {
          count: 2,
          pose: "reap",
        }),
      ],
      [
        route("stroll", crowd("peasant"), "field-north", "shrine", {
          count: 2,
          pose: "carry",
        }),
        at("rite", person("h01.qiang"), "shrine", { pose: "bow" }),
      ],
    ],
    { attend: "men" },
  ),
  // 季夏
  event(
    "m6-dyeing",
    6,
    6,
    5,
    { en: "The dyeing", zh: "染采" },
    {
      en: "The wives at the washing place with the vats, the cloth dyed black and yellow.",
      zh: "命妇官染采：妇人于沤池之侧染玄染黄。",
    },
    [LIJI_DYE],
    [
      [
        route("stroll", crowd("matron"), "well", "washing", {
          count: 3,
          pose: "carry",
        }),
      ],
      [at("labour", crowd("matron"), "washing", { count: 4, pose: "dye" })],
    ],
    { attend: "women" },
  ),
  event(
    "m6-burning",
    6,
    15,
    6,
    { en: "The stubble burned and the water let in", zh: "烧薙行水" },
    {
      en: "The men burn the cut weeds in the blocks and let the water in over them, which kills the weeds and feeds the ground.",
      zh: "烧薙行水，利以杀草，如以热汤，可以粪田畴。",
    },
    [LIJI_BURN],
    [
      [
        at("labour", crowd("peasant"), "field-west", {
          count: 4,
          effect: "smoke",
          pose: "hoe",
        }),
        at("labour", crowd("peasant"), "field-south", {
          count: 3,
          effect: "smoke",
          pose: "hoe",
        }),
      ],
    ],
    { attend: "men" },
  ),
  // 孟秋
  statutes(7),
  event(
    "m7-new-grain",
    7,
    7,
    6,
    { en: "The new grain tasted", zh: "尝新" },
    {
      en: "The elder offers the first of the harvest at the altar, and the children eat the melons at the crossroads.",
      zh: "农乃登谷，荐新于社；七月食瓜，童子食瓜于衢。",
    },
    [LIJI_NEW, SHIJING_MELON],
    [
      [at("rite", person("h01.qiang"), "shrine", { count: 3, pose: "bow" })],
      [at("gather", crowd("child"), "crossroads", { count: 3, pose: "play" })],
    ],
    { attend: "heads" },
  ),
  event(
    "m7-hemp",
    7,
    12,
    5,
    { en: "The hemp cut and retted", zh: "刈麻沤麻" },
    {
      en: "The men cut the hemp ground and the wives carry the stalks to the water to ret.",
      zh: "丁夫刈麻，妇人负之沤于池。",
    },
    [SHIJING_HEMP],
    [
      [
        at("labour", crowd("peasant"), "field-hemp", {
          count: 4,
          pose: "chop",
        }),
      ],
      [
        route("stroll", crowd("matron"), "field-hemp", "washing", {
          count: 3,
          pose: "carry",
        }),
        at("labour", crowd("matron"), "washing", { count: 3, pose: "wash" }),
      ],
    ],
    { attend: "all" },
  ),
  oxenInspected(
    7,
    20,
    { en: "The oxen inspected", zh: "肤田牛" },
    {
      en: "The seventh month's look at the ward's oxen.",
      zh: "七月肤田牛。",
    },
  ),
  // 仲秋
  altar(
    "m8-autumn-altar",
    8,
    { en: "The autumn altar", zh: "秋社" },
    {
      en: "The autumn altar as the spring's: every household out of its house, the invocation, the offering, the meat shared.",
      zh: "秋社如春社：单出里，祝，献，分胙。",
    },
    [LIJI_SHE, SEASON_SHE],
  ),
  event(
    "m8-jujubes",
    8,
    8,
    5,
    { en: "The jujubes beaten down and the gourds cut", zh: "剥枣断壶" },
    {
      en: "The children at the gate trees with poles and the wives at the fences.",
      zh: "八月剥枣，八月断壶：童子以竿击枣于门，妇人断壶于藩。",
    },
    [SHIJING_RICE, SHIJING_MELON],
    [
      [
        at("labour", crowd("child"), "house-02", { count: 3, pose: "carry" }),
        at("labour", crowd("matron"), "house-04", { count: 2, pose: "pick" }),
        at("labour", crowd("child"), "house-12", { count: 2, pose: "carry" }),
      ],
    ],
    { attend: "young" },
  ),
  event(
    "m8-register",
    8,
    10,
    5,
    { en: "The register taken", zh: "案比" },
    {
      en: "The county's clerk at the hall with the elder and the five 伍老: the households come 伍 by 伍 and file past, and the Zhou boy Rong is measured against the mark and entered as grown; from this day his sprite is a farmer's and his day a son's.",
      zh: "令史于序与里典、五老案比：五家为伍以次过，周氏子戎度于程，著籍为大，自是日为丁。",
    },
    [ZHOULI_ZUSHI, SHANGJUN_REGISTER, SHUIHUDI_FU],
    [
      [
        route("stroll", person("v.he"), "station", "hall"),
        at("gather", crowd("grandfather"), "hall", { count: 5 }),
      ],
      [
        at("register", person("v.he"), "hall", {
          pose: "write",
          effect: "scroll",
        }),
        at("labour", person("h01.qiang"), "hall", { pose: "stand" }),
      ],
      ...[1, 2, 3, 4, 5].map((n): StageDirection[] => [
        route("stroll", crowd("peasant"), house((n - 1) * 5 + 1), "hall", {
          count: 3,
        }),
        at("gather", crowd("peasant"), "hall", { count: 5 }),
      ]),
      [route("stroll", person("h08.rong"), "house-08", "hall")],
    ],
    {
      attend: "all",
      changes: [
        {
          villager: "h08.rong",
          set: { age: "大", role: "son", sprite: "sprite.farmer-c" },
        },
      ],
    },
  ),
  event(
    "m8-wheat-sown",
    8,
    15,
    5,
    { en: "The wheat sown", zh: "劝种麦" },
    {
      en: "The south blocks are tilled and the wheat sown on the ordinance's warning, the elder walking the banks to see it done, since a household that misses the time is punished.",
      zh: "乃劝种麦，毋或失时：耕南田种麦，里典巡陌视之，其有失时，行罪无疑。",
    },
    [LIJI_SOW_WHEAT, LVSHI_WHEAT],
    [
      [
        route("till", person("h07.gan"), "house-07", "field-south", {
          count: 2,
          pose: "sow",
        }),
        route("till", person("h09.fu"), "house-09", "field-south", {
          count: 2,
          pose: "sow",
        }),
        route("stroll", person("h01.qiang"), "house-01", "field-south", {
          pose: "stand",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m8-hemp-spun",
    8,
    20,
    5,
    { en: "The hemp spun", zh: "载绩" },
    {
      en: "In the eighth month the wives spin the hemp.",
      zh: "八月载绩。",
    },
    [SHIJING_HEMP],
    [
      [
        at("labour", crowd("matron"), "house-11", { count: 3, pose: "spin" }),
        at("labour", crowd("matron"), "house-17", { count: 3, pose: "spin" }),
      ],
    ],
    { attend: "women" },
  ),
  // 季秋
  event(
    "m9-harvest",
    9,
    3,
    5,
    { en: "The harvest", zh: "获" },
    {
      en: "Every villager who is not old is in the blocks: the men reap the millet on the west and the north, the wives and children carry, the beans are pulled on the east.",
      zh: "农事备收：丁夫刈禾于西田、北田，妇子馌而负之，拔菽于东田。",
    },
    [SHIJING_MEAL, LIJI_HARVEST],
    [
      [
        route("till", person("h11.yi"), "house-11", "field-west", {
          count: 2,
          pose: "reap",
        }),
        route("till", person("h02.an"), "house-02", "field-west", {
          count: 2,
          pose: "reap",
        }),
        route("till", person("h22.nu"), "house-22", "field-north", {
          count: 2,
          pose: "reap",
        }),
        route("till", person("h16.yang"), "house-16", "field-east", {
          count: 2,
          pose: "reap",
        }),
      ],
      [
        route("stroll", crowd("matron"), "house-12", "field-west", {
          count: 3,
          pose: "carry",
        }),
        route("stroll", crowd("child"), "house-13", "field-west", {
          count: 3,
          pose: "carry",
        }),
        route("stroll", crowd("matron"), "house-18", "field-east", {
          count: 3,
          pose: "carry",
        }),
      ],
      [
        at("labour", crowd("peasant"), "field-west", {
          count: 4,
          pose: "reap",
        }),
        at("labour", crowd("peasant"), "field-east", {
          count: 3,
          pose: "reap",
        }),
        at("labour", crowd("matron"), "field-west", {
          count: 3,
          pose: "carry",
        }),
      ],
    ],
    { attend: "all" },
  ),
  event(
    "m9-hemp-seed",
    9,
    12,
    5,
    { en: "The hemp seed gathered and the chestnuts", zh: "叔苴" },
    {
      en: "The wives gather the hemp seed on the hemp ground and the children the chestnuts under the gate trees.",
      zh: "九月叔苴：妇人拾麻子于麻田，童子拾栗于门。",
    },
    [SHIJING_MELON],
    [
      [
        at("labour", crowd("matron"), "field-hemp", { count: 3, pose: "pick" }),
        at("labour", crowd("child"), "house-06", { count: 2, pose: "carry" }),
      ],
    ],
    { attend: "women" },
  ),
  event(
    "m9-floor",
    9,
    15,
    5,
    { en: "The floor swept", zh: "筑场圃" },
    {
      en: "The men beat the threshing floor firm for the grain to come.",
      zh: "九月筑场圃：丁夫筑场。",
    },
    [SHIJING_FLOOR],
    [[at("labour", crowd("peasant"), "threshing", { count: 4, pose: "hoe" })]],
    { attend: "men" },
  ),
  event(
    "m9-levy",
    9,
    20,
    5,
    { en: "The fodder and straw levy", zh: "入顷刍稾" },
    {
      en: "Carts loaded at the floor, three shi of fodder and two of straw for every qing held, driven along the lane over the ford to the station with the elder walking beside them; the winter clothes issued at the hall after.",
      zh: "入顷刍稾：以其受田之数，顷入刍三石、稾二石，车自场过津至邮，里典从之；九月授衣于序。",
    },
    [SHUIHUDI_FODDER, SHIJING_CLOTHES],
    [
      [
        route("levy", crowd("peasant"), "threshing", "station", {
          count: 4,
          effect: "tally",
        }),
        route("stroll", person("h01.qiang"), "threshing", "station"),
      ],
      [at("gather", crowd("matron"), "hall", { count: 3 })],
    ],
    { attend: "heads" },
  ),
  // 孟冬
  statutes(10, [
    [
      route("stroll", person("h01.qiang"), "hall", "station", {
        pose: "carry",
      }),
    ],
  ]),
  event(
    "m10-year-opens",
    10,
    1,
    6,
    { en: "The year begins", zh: "岁首" },
    {
      en: "Qin's year opens in the tenth month: the elder carries the ward's tallies to the station for the county's reckoning.",
      zh: "秦以冬十月为岁首：里典上计，持券于邮。",
    },
    [SHIJI_YEAR, ZHOULI_READ],
    [
      [
        route("stroll", person("h01.qiang"), "house-01", "station", {
          pose: "carry",
        }),
      ],
    ],
    { attend: { villagers: ["h01.qiang", "v.ran"] } },
  ),
  event(
    "m10-rice",
    10,
    3,
    5,
    { en: "The rice reaped and the grain brought in", zh: "获稻纳禾稼" },
    {
      en: "The fourth 伍 in the paddy with sickles, the sheaves carried up to the floor, and every household's grain into the granary.",
      zh: "十月获稻：四伍之丁刈稻，负之至场；十月纳禾稼，户入粟于仓。",
    },
    [SHIJING_RICE, SHIJING_FLOOR],
    [
      [
        route("till", person("h16.yang"), "house-16", "field-paddy", {
          count: 2,
          pose: "reap",
        }),
      ],
      [
        route("stroll", crowd("peasant"), "field-paddy", "threshing", {
          count: 3,
          pose: "carry",
        }),
        route("stroll", crowd("ox"), "field-paddy", "threshing", {
          count: 2,
          pose: "plough",
        }),
      ],
      [
        route("stroll", crowd("peasant"), "threshing", "granary", {
          count: 3,
          pose: "carry",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m10-threshing-feast",
    10,
    5,
    6,
    { en: "The threshing and the feast", zh: "涤场飨" },
    {
      en: "The floor threshed through the day; at dusk the whole ward at the hall, the lamb killed, the horn raised: may our lord live for ever.",
      zh: "十月涤场，朋酒斯飨，曰杀羔羊；跻彼公堂，称彼兕觥，万寿无疆。",
    },
    [SHIJING_FEAST, LIJI_FEAST],
    [
      [
        at("labour", crowd("peasant"), "threshing", {
          count: 4,
          pose: "thresh",
        }),
        at("labour", crowd("ox"), "threshing", { count: 2, pose: "plough" }),
      ],
      [
        route("stroll", crowd("peasant"), "threshing", "hall", { count: 3 }),
        route("stroll", crowd("matron"), "well", "hall", { count: 3 }),
      ],
      [at("feast", person("h01.qiang"), "hall", { count: 8 })],
    ],
    { attend: "all" },
  ),
  event(
    "m10-corvee",
    10,
    12,
    5,
    { en: "The corvée party", zh: "徭" },
    {
      en: "The lieutenant at the hall: ten men mustered under the banner, two from each 伍, and walked out along the lane to the post road; they come back on the twenty-eighth.",
      zh: "士吏于序：发徭十人，伍各二，建旗，出里道至邮道；二十八日乃归。",
    },
    [SHUIHUDI_YAO, HANSHU_WOODS],
    [
      [
        route("stroll", person("v.meng"), "station", "hall"),
        route("stroll", crowd("peasant"), "crossroads", "hall", { count: 3 }),
      ],
      [
        at("labour", person("v.meng"), "hall", { pose: "command" }),
        at("muster", crowd("peasant"), "hall", { count: 6, effect: "banner" }),
      ],
      [
        route("stroll", crowd("peasant", ["pole"]), "hall", "edge", {
          count: 3,
          pose: "carry",
        }),
        route("stroll", person("h13.lang", ["pole"]), "hall", "edge", {
          pose: "carry",
        }),
      ],
    ],
    {
      attend: "men",
      changes: CORVEE_PARTY.map((id) => ({
        villager: id,
        set: { away: 10 as Month },
      })),
    },
  ),
  event(
    "m10-garrison",
    10,
    12,
    6,
    { en: "The garrison man", zh: "戍" },
    {
      en: "One man chosen for the frontier year: the lieutenant takes the Zhao son Zhong and not his father, because two of one household are never sent together. He walks out after the party and does not come back this year.",
      zh: "戍卒一人：士吏取赵氏子衷而不取其父，同居毋并行。从徭后出，是岁不归。",
    },
    [SHUIHUDI_SHU, HANSHU_GENG, SHIJING_DONGSHAN],
    [
      [at("labour", person("v.meng"), "crossroads", { pose: "command" })],
      [
        route("stroll", person("h07.zhong", ["pole"]), "house-07", "edge", {
          pose: "carry",
        }),
        at("labour", person("h07.shu"), "house-07", { pose: "kneel" }),
      ],
      [route("stroll", person("v.meng"), "crossroads", "edge")],
    ],
    {
      attend: {
        villagers: [
          "v.meng",
          "h07.gan",
          "h07.liao",
          "h07.zhong",
          "h07.shu",
          "h07.tian",
        ],
      },
      changes: [{ villager: "h07.zhong", set: { away: "year" } }],
    },
  ),
  oxenInspected(
    10,
    20,
    { en: "The oxen inspected", zh: "肤田牛" },
    {
      en: "The tenth month's look at the ward's oxen.",
      zh: "十月肤田牛。",
    },
  ),
  // 仲冬
  event(
    "m11-review",
    11,
    8,
    6,
    { en: "The great review and the archery", zh: "大阅乡射" },
    {
      en: "The lieutenant at the threshing floor: the ward's men drilled in ranks, two files of a 伍's men at a time, and shoot at the target on the archery ground.",
      zh: "中冬教大阅：士吏于场，里丁以伍为列习战，射侯于射圃。",
    },
    [ZHOULI_REVIEW, YILI_ARCHERY],
    [
      [
        route("stroll", person("v.meng"), "station", "threshing"),
        route("stroll", crowd("peasant"), "crossroads", "threshing", {
          count: 3,
        }),
      ],
      [
        at("labour", person("v.meng"), "threshing", { pose: "command" }),
        at("drill", crowd("peasant"), "threshing", {
          count: 8,
          pose: "stance",
        }),
      ],
      [
        at("drill", crowd("peasant"), "archery", {
          count: 8,
          effect: "arrows",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m11-woods",
    11,
    15,
    5,
    { en: "The woods", zh: "伐薪樵" },
    {
      en: "Every man to the woods for the winter's firewood.",
      zh: "冬，丁夫皆入林伐薪樵。",
    },
    [HANSHU_WOODS],
    [
      [route("stroll", crowd("peasant"), "gate-west", "woods", { count: 3 })],
      [at("labour", crowd("peasant"), "woods", { count: 4, pose: "chop" })],
      [
        route("stroll", crowd("peasant"), "woods", "crossroads", {
          count: 3,
          pose: "carry",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m11-burial",
    11,
    24,
    9,
    { en: "A burial", zh: "葬" },
    {
      en: "The Wu mother dies: the household carries her from the house to the graves on the hill, the second 伍 following; from the twelfth month she is struck from the register.",
      zh: "吴氏之母卒：其家舁之自舍至丘上族墓，二伍从之；自十二月死者削。",
    },
    [MENGZI_WELL, SHANGJUN_REGISTER],
    [
      [at("mourn", person("h09.yan"), "house-09", { count: 4 })],
      [
        route("inter", person("h09.fu"), "house-09", "graves", {
          count: 5,
          effect: "grey",
        }),
        route("stroll", crowd("peasant"), "house-07", "graves", { count: 3 }),
        route("stroll", crowd("matron"), "house-08", "graves", { count: 3 }),
      ],
    ],
    {
      attend: { wu: "wu-2" },
      changes: [{ villager: "h09.ai", set: { struck: true } }],
    },
  ),
  // 季冬
  event(
    "m12-zha",
    12,
    8,
    6,
    { en: "The year's-end sacrifice", zh: "蜡" },
    {
      en: "The whole ward at the altar to thank the eight spirits of the farming year, and then the hall, where the whole country is as if mad.",
      zh: "大蜡八：里人皆于社，报八神；既而于序，一国之人皆若狂。",
    },
    [LIJI_NUO, LIJI_ZHA, LIJI_SHE],
    [
      [
        route("stroll", crowd("peasant"), "crossroads", "shrine", { count: 3 }),
        route("stroll", crowd("matron"), "well", "shrine", { count: 3 }),
      ],
      [
        at("sacrifice", person("h05.shou"), "shrine", {
          count: 6,
          pose: "bow",
        }),
        at("rite", person("h01.qiang"), "shrine", { pose: "bow" }),
      ],
      [at("feast", person("h01.qiang"), "hall", { count: 8 })],
    ],
    { attend: "all" },
  ),
  event(
    "m12-drinking",
    12,
    8,
    9,
    { en: "The drinking rite in the hall", zh: "乡饮酒" },
    {
      en: "The elder seats the ward by age in the hall, the Han grandfather served first, and leaves last when the staff-bearers have gone.",
      zh: "饮酒于序，以正齿位：韩氏之父最老先席，杖者出，里典斯出矣。",
    },
    [ZHOULI_DRINK, YILI_DRINK, LUNYU_NUO],
    [
      [
        route("stroll", person("h25.kao"), "house-25", "hall", { pose: "sit" }),
        at("gather", crowd("grandfather"), "hall", { count: 5 }),
      ],
      [at("feast", person("h01.qiang"), "hall", { count: 8 })],
    ],
    { attend: "heads" },
  ),
  event(
    "m12-la",
    12,
    15,
    6,
    { en: "The La offering", zh: "腊" },
    {
      en: "The Qin year's-end offering: the men come back from the hunt in the woods with game, and the offering is made at the altar to the ancestors.",
      zh: "腊者猎也：丁夫自林田猎取兽而归，祭于社以享先祖。",
    },
    [SHIJI_LA, FENGSU_LA, DUDUAN_LA],
    [
      [
        route("stroll", crowd("peasant"), "woods", "shrine", {
          count: 3,
          pose: "carry",
        }),
      ],
      [
        at("sacrifice", person("h05.shou"), "shrine", {
          count: 6,
          pose: "bow",
        }),
      ],
    ],
    { attend: "men" },
  ),
  event(
    "m12-exorcism",
    12,
    20,
    10,
    { en: "The exorcism", zh: "傩" },
    {
      en: "The young men with drums and masks go from door to door along the three lanes driving the pestilence out, the elder standing in his court dress at the east steps.",
      zh: "乡人傩：少年鼓而蒙面，逐疫沿三道逐户，里典朝服而立于阼阶。",
    },
    [LIJI_NUO, LUNYU_NUO, DUDUAN_NUO],
    [
      [at("labour", person("h01.qiang"), "house-01", { pose: "stand" })],
      [
        route(
          "exorcise",
          crowd("peasant", ["mask"]),
          "gate-west",
          "crossroads",
          { count: 4, effect: "drum" },
        ),
      ],
      [
        route(
          "exorcise",
          crowd("peasant", ["mask"]),
          "crossroads",
          "gate-south",
          { count: 4, effect: "drum" },
        ),
      ],
      [
        route("exorcise", crowd("peasant", ["mask"]), "gate-south", "shrine", {
          count: 4,
          effect: "drum",
        }),
      ],
      [
        route("exorcise", crowd("peasant", ["mask"]), "shrine", "gate-east", {
          count: 4,
          effect: "drum",
        }),
      ],
    ],
    { attend: "all" },
  ),
  event(
    "m12-ice-cut",
    12,
    25,
    4,
    { en: "The ice cut", zh: "凿冰" },
    {
      en: "The men at the pond with picks in the cold, the blocks stacked on the bank.",
      zh: "二之日凿冰冲冲，积冰于岸。",
    },
    [SHIJING_ICE],
    [
      [at("labour", crowd("peasant"), "pond", { count: 4, pose: "chop" })],
      [
        route("stroll", crowd("peasant"), "pond", "icehouse", {
          count: 3,
          pose: "carry",
        }),
      ],
    ],
    { attend: "men" },
  ),
];

/** every event of the year: the dated ones, then the months' 更卒 and the pedlar */
export const VILLAGE_EVENTS: SiteEvent[] = [
  ...YEAR_EVENTS,
  ...MONTH_IDS.flatMap((month) => gengzu(month) ?? []),
  ...MONTH_IDS.map(pedlar),
].sort((a, b) => a.month - b.month || a.day - b.day || a.hour - b.hour);

/** the ids of every villager any event names, for the spec */
export const eventVillagerIds = (events: SiteEvent[]): string[] =>
  Array.from(
    new Set(
      events.flatMap((e) => [
        ...e.script
          .flat()
          .flatMap((d) =>
            d.actor.seat.startsWith("village:") && d.actor.seat.includes(".")
              ? [d.actor.seat.slice("village:".length)]
              : [],
          ),
        ...(e.changes ?? []).map((c) => c.villager),
        ...(e.attend && typeof e.attend === "object" && "villagers" in e.attend
          ? e.attend.villagers
          : []),
      ]),
    ),
  );
