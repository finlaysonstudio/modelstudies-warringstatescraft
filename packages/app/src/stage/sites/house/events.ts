/**
 * The house's year of events (plan `20260909_Plan_house_year.md` §6): the
 * *Yili* played through on the days the *Yili*, the *Liji*, and the *Simin
 * yueling* fix them, every script staged by the east steps and the west as
 * the *Yili* stages its rites. The heir capped and named in the second
 * month, the four seasonal sacrifices at the shrine, the daughter asked for
 * with a goose in the eighth and driven out at dusk in the ninth, the
 * master's mission in the tenth, the caller with a pheasant in the eleventh,
 * the old tutor's death, laying out, and burial, and the exorcism at the
 * year's end.
 *
 * Every actor is a seat of the house: `house:<villagerId>` for a named
 * person and `house:<archetype>` for a crowd. Every kind is a key of
 * `DIRECTION_RULES`; the cappings, the divining, and the calling back are
 * poses on a `rite`, a `sacrifice`, or a `mourn` rather than kinds of their
 * own. The register changes ride on the events that cause them: the capping
 * (the capped sprite, the age class), the marriage (away for the year, then
 * struck), the mission (away the month), and the death (hemp on the
 * household from the eleventh month, the tutor struck from the twelfth).
 * The death is the tutor's, a 士 of the house whose rite is exactly the
 * *Yili*'s 士喪禮, so that the year's other rites are not suspended.
 */
import type { Cite, Month } from "../../almanac";
import type {
  StageActor,
  StageArchetype,
  StageDirection,
  StageDirectionKind,
  StageEffect,
} from "../../../lib/types";
import type { Attendance, Hour, RegisterChange, SiteEvent } from "../../site";
import { HOUSE_MEMBERS, houseVillager } from "./register";

// --- the sources --------------------------------------------------------

const yili = (line: number, note: string): Cite => ({
  id: "yili-zh",
  line,
  note,
});
const liji = (line: number, note: string): Cite => ({
  id: "liji-zh",
  line,
  note,
});
const simin = (line: number, note: string): Cite => ({
  id: "siminyueling-zh",
  line,
  note,
});

const YILI_CAPPING = yili(226, "士冠禮");
const YILI_WEDDING = yili(263, "士昬禮");
const YILI_CALL = yili(347, "士相見禮");
const YILI_DEATH = yili(301, "士喪禮");
const YILI_BURIAL = yili(86, "既夕禮");
const YILI_REPOSE = yili(367, "士虞禮");
const YILI_MOURNING_DRESS = yili(175, "喪服");
const YILI_SHI_SACRIFICE = yili(387, "特牲饋食禮");
const YILI_DAFU_SACRIFICE = yili(196, "少牢饋食禮");
const YILI_LEFTOVERS = yili(547, "有司");
const YILI_BANQUET = yili(509, "燕禮");
const YILI_DRINKING = yili(475, "鄉飲酒禮");
const YILI_MISSION = yili(133, "聘禮");
const LIJI_SEASONS = liji(1405, "王制: 春曰礿，夏曰禘，秋曰嘗，冬曰烝");
const LIJI_BURIAL = liji(
  1404,
  "王制: 大夫、士、庶人三日而殯，三月而葬; the Zuozhuan's 士踰月 is what the twelfth-month burial follows",
);
const LIJI_CALLING = liji(695, "禮運: 升屋而號，告曰：皋！某復");
const LIJI_COURT = liji(1547, "玉藻: 朝，辨色始入");
const LIJI_SILK = liji(1606, "月令 季春: 后妃齊戒，親東鄉躬桑");
const LIJI_GAOMEI = liji(1591, "月令 仲春: 玄鳥至，以大牢祠于高禖");
const LIJI_NEW_GRAIN = liji(1651, "月令 孟秋: 天子嘗新，先薦寢廟");
const LIJI_LA = liji(1698, "月令 孟冬: 臘先祖五祀");
const LIJI_NUO = liji(1721, "月令 季冬: 命有司大難，旁磔，出土牛");
const LUNYU_NUO: Cite = {
  id: "lunyu-zh",
  line: 774,
  note: "鄉黨: 鄉人儺，朝服而立於阼階",
};
const CHUCI_ZHAOHUN: Cite = { id: "chuci-zh", line: 396, note: "招魂" };
const ZHOULI_ICE: Cite = {
  id: "zhouli-zh",
  line: 1154,
  note: "天官 凌人: 夏，頒冰掌事",
};
const ZHOULI_WITCH: Cite = {
  id: "zhouli-zh",
  line: 372,
  note: "春官 女巫: 掌歲時祓除、釁浴",
};
const ZHOULI_PHYSICIAN: Cite = {
  id: "zhouli-zh",
  line: 1137,
  note: "天官 醫師: 掌醫之政令",
};
const SHANGSI: Cite = {
  id: "season-shangsi-zh",
  note: "上巳: the third-month lustration at the water",
};
const BAIHUTONG_CAPPING: Cite = {
  id: "baihutong-zh",
  line: 544,
  note: "紼冕 (Han): the caps and what a capping makes of a man",
};
const BAIHUTONG_MARRIAGE: Cite = {
  id: "baihutong-zh",
  line: 497,
  note: "嫁娶 (Han): the six rites glossed",
};
const SIMIN_FIRST_DAY = simin(16, "正月之旦，是謂正日。躬率妻孥，絜祀祖禰");
const SIMIN_WINE = simin(26, "正月: 各上椒酒于其家長，稱觴舉壽");
const SIMIN_BREWING = simin(56, "正月: 命典饋釀春酒");
const SIMIN_REST = simin(117, "五月: 芒種節後，陽氣始虧，陰慝將萌");
const SIMIN_SUMMER_CLOTH = simin(136, "六月: 命女紅織縑縳");
const SIMIN_AIRING = simin(151, "七月: 曝經書及衣裳");
const SIMIN_CLOTHES = simin(160, "八月: 趣練縑帛，染采色");
const SIMIN_LA = simin(192, "十二月: 遂臘先祖、五祀");

// --- the authoring shorthand --------------------------------------------

type Line = [string, string];

interface ActorOptions {
  overlays?: string[];
  /** the capped heir after the second month */
  capped?: boolean;
}

/** a named person of the house as an actor, under the seat `house:<id>` */
const person = (id: string, options: ActorOptions = {}): StageActor => {
  const villager = houseVillager(id);
  // only the heir has a capped sprite; every other actor keeps its own
  const variant =
    options.capped && villager.archetype === "heir"
      ? "sprite.heir-capped"
      : villager.sprite;
  return {
    seat: `house:${id}`,
    archetype: villager.archetype,
    ...(variant ? { variant } : {}),
    ...(options.overlays ? { overlays: options.overlays } : {}),
  };
};

/** a crowd of one archetype, under the seat `house:<archetype>` */
const crowd = (
  archetype: StageArchetype,
  options: ActorOptions = {},
): StageActor => ({
  seat: `house:${archetype}`,
  archetype,
  ...(options.overlays ? { overlays: options.overlays } : {}),
});

interface DirectionOptions {
  count?: number;
  effect?: StageEffect;
  pose?: string;
}

/** a route direction: the actor walks `from` one place `to` another */
const go = (
  kind: StageDirectionKind,
  actor: StageActor,
  from: string,
  to: string,
  options: DirectionOptions = {},
): StageDirection => ({ kind, actor, from, to, ...options });

/** an `at` direction: the actor stands, kneels, or works at one place */
const at = (
  kind: StageDirectionKind,
  actor: StageActor,
  place: string,
  options: DirectionOptions = {},
): StageDirection => ({ kind, actor, at: place, ...options });

/** the household walking to one place from their homes, one direction each */
const household = (
  ids: string[],
  to: string,
  options: ActorOptions & DirectionOptions = {},
): StageDirection[] =>
  ids.map((id) => {
    const { overlays, capped, ...rest } = options;
    return go(
      "stroll",
      person(id, { overlays, capped }),
      houseVillager(id).home,
      to,
      rest,
    );
  });

interface EventSpec {
  id: string;
  month: Month;
  day: number;
  hour: Hour;
  title: Line;
  line: Line;
  cite: Cite[];
  attend?: Attendance;
  script: StageDirection[][];
  changes?: RegisterChange[];
}

const event = (spec: EventSpec): SiteEvent => ({
  id: spec.id,
  month: spec.month,
  day: spec.day,
  hour: spec.hour,
  title: { en: spec.title[0], zh: spec.title[1] },
  line: { en: spec.line[0], zh: spec.line[1] },
  cite: spec.cite,
  ...(spec.attend ? { attend: spec.attend } : {}),
  script: spec.script,
  ...(spec.changes ? { changes: spec.changes } : {}),
});

const FAMILY = [
  "bing.ao",
  "bing.jiang",
  "bing.jia",
  "bing.shu",
  "bing.ji",
  "bing.gui",
];
const RETAINERS = ["bing.sima", "bing.xiang", "bing.shi"];
/** the men of the house and its retainers, who wear hemp for the tutor */
const MOURNERS = [
  "bing.ao",
  "bing.jia",
  "bing.shu",
  "bing.steward",
  ...RETAINERS,
];
const ALL_DRAWN = HOUSE_MEMBERS.filter((m) => m.drawn).map((m) => m.id);

const HEMP: RegisterChange[] = MOURNERS.map((villager) => ({
  villager,
  set: { overlays: ["hemp"] },
}));

// --- the seasonal sacrifices ---------------------------------------------

/** a sacrifice at the shrine as a 士's is staged: the invocator, the household in their places */
const seasonalSacrifice = ({
  id,
  month,
  day,
  title,
  line,
  leader,
  cite,
}: {
  id: string;
  month: Month;
  day: number;
  title: Line;
  line: Line;
  /** the master, or the steward standing in for him */
  leader: string;
  cite: Cite[];
}): SiteEvent =>
  event({
    id,
    month,
    day,
    hour: 4,
    title,
    line,
    cite,
    attend: "all",
    script: [
      [
        go("receive", person("visitor.invocator"), "edge", "shrine", {
          count: 1,
        }),
      ],
      [
        ...household([leader, "bing.jiang"], "shrine"),
        ...household(RETAINERS, "shrine"),
      ],
      [
        at("sacrifice", person("visitor.invocator"), "shrine", {
          count: 1,
          pose: "kneel",
        }),
        at("gather", person(leader), "shrine", { count: 1, pose: "kneel" }),
        at("gather", person("bing.jiang"), "shrine", {
          count: 1,
          pose: "serve",
        }),
        at("gather", crowd("retainer"), "shrine", { count: 3, pose: "bow" }),
      ],
    ],
  });

/** the physician's monthly call, on the tenth at 巳 */
const physicianVisit = (month: Month): SiteEvent =>
  event({
    id: `physician-${month}`,
    month,
    day: 10,
    hour: 6,
    title: ["The physician's visit", "醫至"],
    line: [
      "The physician is let in at the gate, sees the lady in the chamber, and goes out by the street.",
      "醫入門，視夫人於寢，由街而出。",
    ],
    cite: [ZHOULI_PHYSICIAN],
    attend: {
      villagers: ["visitor.physician", "bing.jiang", "bing.gatekeeper"],
    },
    script: [
      [
        go("receive", person("visitor.physician"), "edge", "chamber", {
          count: 1,
        }),
      ],
      [
        at("gather", person("visitor.physician"), "chamber", {
          count: 1,
          pose: "stand",
        }),
      ],
      [go("stroll", person("visitor.physician"), "chamber", "edge")],
    ],
  });

// --- the year -----------------------------------------------------------

export const HOUSE_EVENTS: SiteEvent[] = [
  event({
    id: "first-day",
    month: 1,
    day: 1,
    hour: 4,
    title: ["The first day's sacrifice", "正日"],
    line: [
      "The master leads the lady and the children to the shrine at dawn, and the wine is carried in to the dowager, the youngest offering first.",
      "正日昧爽，主人躬率妻孥絜祀於廟，進椒酒於太夫人，自少者始。",
    ],
    cite: [SIMIN_FIRST_DAY, SIMIN_WINE],
    attend: "all",
    script: [
      household(FAMILY, "shrine"),
      [
        at("rite", person("bing.ao"), "shrine", { count: 1, pose: "kneel" }),
        at("gather", person("bing.jiang"), "shrine", {
          count: 1,
          pose: "kneel",
        }),
        at("gather", crowd("child"), "shrine", { count: 2, pose: "kneel" }),
      ],
      [
        ...household(FAMILY, "chamber"),
        at("gather", person("bing.dowager"), "chamber", {
          count: 1,
          pose: "sit",
        }),
      ],
      [
        at("gather", person("bing.gui"), "chamber", { count: 1, pose: "bow" }),
        at("gather", person("bing.ao"), "chamber", { count: 1, pose: "bow" }),
      ],
    ],
  }),
  event({
    id: "court-greeting",
    month: 1,
    day: 1,
    hour: 5,
    title: ["The court greeting", "朝賀"],
    line: [
      "The groom brings the chariot to the gate and the master goes out in court dress to greet the lord.",
      "圉人駕車於門，主人朝服出，朝賀於君。",
    ],
    cite: [LIJI_COURT],
    attend: { villagers: ["bing.ao", "bing.groom", "bing.gatekeeper"] },
    script: [
      [at("labour", person("bing.groom"), "gate", { pose: "lead" })],
      [go("stroll", person("bing.ao"), "dais", "edge")],
    ],
  }),
  event({
    id: "spring-brewing",
    month: 1,
    day: 10,
    hour: 6,
    title: ["The spring brewing", "釀春酒"],
    line: [
      "The cooks set the spring wine to ferment at the kitchen and the maids carry water from the well.",
      "庖人釀春酒於庖，婢汲井水以供。",
    ],
    cite: [SIMIN_BREWING],
    attend: {
      villagers: ["bing.cook-a", "bing.cook-b", "bing.maid-a", "bing.maid-c"],
    },
    script: [
      [
        at("labour", person("bing.cook-a"), "kitchen", { pose: "cook" }),
        at("labour", person("bing.cook-b"), "kitchen", { pose: "chop" }),
      ],
      [
        go("stroll", person("bing.maid-a"), "loom", "well", { pose: "draw" }),
        go("stroll", person("bing.maid-c"), "kitchen", "well", {
          pose: "draw",
        }),
      ],
    ],
  }),
  event({
    id: "capping-divined",
    month: 2,
    day: 3,
    hour: 4,
    title: ["The capping divined", "筮日"],
    line: [
      "The diviner casts the stalks at the shrine gate to fix the day; the master stands east of the gate facing west.",
      "筮於廟門。主人即位於門東，西面；筮人執筴，卒筮，告吉。",
    ],
    cite: [YILI_CAPPING],
    attend: { villagers: ["bing.ao", "bing.steward", "visitor.diviner"] },
    script: [
      [
        go("receive", person("visitor.diviner"), "edge", "shrine", {
          count: 1,
        }),
      ],
      [
        at("rite", person("visitor.diviner"), "shrine", {
          count: 1,
          pose: "divine",
        }),
        at("gather", person("bing.ao"), "shrine", { count: 1, pose: "stand" }),
        at("gather", person("bing.steward"), "shrine", {
          count: 1,
          pose: "stand",
        }),
      ],
    ],
  }),
  event({
    id: "capping",
    month: 2,
    day: 15,
    hour: 5,
    title: ["The capping", "冠禮"],
    line: [
      "The guest of honour is received at the gate; the heir is capped three times at the east steps and given his courtesy name, Bojia, at the west; he visits the lady and the dowager, and the guest is feasted.",
      "賓至門，主人迎之。三加於阼階，字之於西階曰伯賈；冠者見於母、見於太夫人，醴賓。",
    ],
    cite: [YILI_CAPPING, BAIHUTONG_CAPPING],
    attend: "all",
    script: [
      [go("receive", person("visitor.caller"), "edge", "gate", { count: 2 })],
      [
        go("receive", person("visitor.caller"), "gate", "west-steps", {
          count: 2,
        }),
        go("stroll", person("bing.ao"), "dais", "east-steps"),
        go("stroll", person("bing.jia"), "wing-west", "east-steps"),
      ],
      [
        at("gather", person("bing.jia"), "east-steps", {
          count: 1,
          pose: "kneel",
        }),
        at("rite", person("visitor.caller"), "east-steps", {
          count: 1,
          pose: "stand",
        }),
        at("gather", crowd("retainer"), "east-steps", {
          count: 2,
          pose: "stand",
        }),
        at("gather", person("bing.ao"), "east-steps", {
          count: 1,
          pose: "stand",
        }),
      ],
      [
        at("gather", person("bing.jia", { capped: true }), "west-steps", {
          count: 1,
          pose: "bow",
        }),
        at("gather", person("visitor.caller"), "west-steps", {
          count: 1,
          pose: "stand",
        }),
      ],
      [
        go(
          "stroll",
          person("bing.jia", { capped: true }),
          "west-steps",
          "chamber",
          {
            pose: "bow",
          },
        ),
        at("gather", person("bing.jiang"), "chamber", {
          count: 1,
          pose: "sit",
        }),
        at("gather", person("bing.dowager"), "chamber", {
          count: 1,
          pose: "sit",
        }),
      ],
      [
        at("feast", person("bing.ao"), "hall", { count: 1, pose: "sit" }),
        at("gather", person("visitor.caller"), "hall", {
          count: 1,
          pose: "sit",
        }),
        at("gather", person("bing.jia", { capped: true }), "hall", {
          count: 1,
          pose: "sit",
        }),
      ],
    ],
    changes: [
      {
        villager: "bing.jia",
        set: { sprite: "sprite.heir-capped", age: "大" },
      },
    ],
  }),
  event({
    id: "gaomei",
    month: 2,
    day: 20,
    hour: 6,
    title: ["The prayer at the swallows' coming", "祠高禖"],
    line: [
      "On the day the swallows come, the lady prays for children before the tablets.",
      "玄鳥至之日，夫人於神主前祈嗣。",
    ],
    cite: [LIJI_GAOMEI],
    attend: { villagers: ["bing.jiang", "bing.jishi", "bing.maid-d"] },
    script: [
      household(["bing.jiang", "bing.jishi"], "tablets"),
      [
        at("rite", person("bing.jiang"), "tablets", {
          count: 1,
          pose: "kneel",
        }),
        at("gather", person("bing.jishi"), "tablets", {
          count: 1,
          pose: "kneel",
        }),
      ],
    ],
  }),
  event({
    id: "lustration",
    month: 3,
    day: 3,
    hour: 6,
    title: ["The washing at the pond", "祓禊"],
    line: [
      "On the first si day the household goes down to the pond with orchids to wash the winter's ill away.",
      "上巳，闔家執蘭臨池，祓除不祥。",
    ],
    cite: [ZHOULI_WITCH, SHANGSI],
    attend: "all",
    script: [
      household(["bing.jiang", "bing.ji", "bing.gui", "bing.jishi"], "pond"),
      [
        at("rite", person("bing.jiang"), "pond", { count: 1, pose: "stand" }),
        at("gather", crowd("maid"), "pond", { count: 3, pose: "draw" }),
        at("gather", person("bing.shu"), "pond", { count: 1, pose: "play" }),
      ],
    ],
  }),
  event({
    id: "silkworms",
    month: 3,
    day: 10,
    hour: 5,
    title: ["The silkworms", "親蠶"],
    line: [
      "The lady fasts and picks the first mulberry leaves herself; the maids feed the trays in the women's rooms.",
      "夫人齊戒躬桑，婢飼箔於東房。",
    ],
    cite: [LIJI_SILK],
    attend: {
      villagers: ["bing.jiang", "bing.maid-a", "bing.maid-d", "bing.gui"],
    },
    script: [
      [go("stroll", person("bing.jiang"), "bed", "garden", { pose: "carry" })],
      [
        go("stroll", person("bing.jiang"), "garden", "east-rooms", {
          pose: "carry",
        }),
        at("labour", person("bing.maid-a"), "east-rooms", { pose: "carry" }),
        at("labour", person("bing.maid-d"), "east-rooms", { pose: "carry" }),
      ],
    ],
  }),
  seasonalSacrifice({
    id: "spring-sacrifice",
    month: 3,
    day: 20,
    title: ["The spring sacrifice", "礿"],
    line: [
      "The spring sacrifice at the shrine: the invocator announces, the master kneels, the lady serves the dishes, the retainers assist.",
      "春礿於廟：祝告，主人拜，主婦薦豆，家臣相。",
    ],
    leader: "bing.ao",
    cite: [LIJI_SEASONS, YILI_SHI_SACRIFICE],
  }),
  event({
    id: "summer-sacrifice",
    month: 4,
    day: 12,
    hour: 4,
    title: ["The summer sacrifice by the book", "禘 · 少牢饋食"],
    line: [
      "A great officer's sacrifice: the day divined, the sheep and the pig inspected at the shrine gate, the invocator, the master and the lady in their places, a retainer seated as the personator and served, and the leftovers shared out to the gate.",
      "少牢饋食：筮日，視牲於廟門，祝、主人、主婦即位，家臣為尸，尸食，餕餘及於門。",
    ],
    cite: [YILI_DAFU_SACRIFICE, YILI_LEFTOVERS, LIJI_SEASONS],
    attend: "all",
    script: [
      [
        go("receive", person("visitor.diviner"), "edge", "shrine", {
          count: 1,
        }),
        at("rite", person("visitor.diviner"), "shrine", {
          count: 1,
          pose: "divine",
        }),
      ],
      [
        go("stroll", person("bing.cook-a"), "hearth", "shrine", {
          pose: "lead",
        }),
        go("stroll", person("bing.cook-b"), "hearth", "shrine", {
          pose: "chop",
        }),
      ],
      [
        go("receive", person("visitor.invocator"), "edge", "shrine", {
          count: 1,
        }),
        ...household(["bing.ao", "bing.jiang", "bing.steward"], "shrine"),
        ...household(RETAINERS, "shrine"),
      ],
      [
        at("sacrifice", person("visitor.invocator"), "shrine", {
          count: 1,
          pose: "kneel",
        }),
        at("gather", person("bing.xiang"), "shrine", { count: 1, pose: "sit" }),
        at("gather", person("bing.ao"), "shrine", { count: 1, pose: "kneel" }),
        at("gather", person("bing.jiang"), "shrine", {
          count: 1,
          pose: "serve",
        }),
        at("gather", person("bing.steward"), "shrine", {
          count: 1,
          pose: "carry",
        }),
        at("gather", crowd("retainer"), "shrine", { count: 2, pose: "bow" }),
      ],
      [
        go("stroll", person("bing.steward"), "shrine", "gate", {
          pose: "carry",
        }),
        go("stroll", person("bing.porter"), "bins", "gate", { pose: "carry" }),
      ],
    ],
  }),
  event({
    id: "ice-issued",
    month: 5,
    day: 1,
    hour: 6,
    title: ["The ice issued", "頒冰"],
    line: [
      "The ice cart stands at the gate; the steward receives it and the porter carries the blocks in to the chest in the hall.",
      "冰車在門，宰受之，僕負冰入堂之冰鑑。",
    ],
    cite: [ZHOULI_ICE],
    attend: { villagers: ["bing.steward", "bing.porter", "bing.gatekeeper"] },
    script: [
      [at("register", person("bing.steward"), "gate", { pose: "write" })],
      [
        go("stroll", person("bing.porter"), "gate", "hall", {
          pose: "carry",
          count: 2,
        }),
      ],
    ],
  }),
  event({
    id: "summer-rest",
    month: 5,
    day: 15,
    hour: 5,
    title: ["The summer rest", "夏至"],
    line: [
      "No lessons on the longest day: the household keeps still in the pavilion over the water.",
      "日長至，罷學，闔家靜處於榭。",
    ],
    cite: [SIMIN_REST],
    attend: "all",
    script: [
      household(
        [
          "bing.ao",
          "bing.jiang",
          "bing.dowager",
          "bing.jia",
          "bing.shu",
          "bing.gui",
        ],
        "pavilion",
        {
          capped: true,
        },
      ),
      [
        at("gather", person("bing.ao"), "pavilion", { count: 1, pose: "sit" }),
        at("gather", person("bing.jiang"), "pavilion", {
          count: 1,
          pose: "sit",
        }),
        at("gather", person("bing.dowager"), "pavilion", {
          count: 1,
          pose: "sit",
        }),
        at("gather", person("bing.jia", { capped: true }), "pavilion", {
          count: 1,
          pose: "sit",
        }),
        at("gather", crowd("child"), "pavilion", { count: 2, pose: "play" }),
        at("gather", crowd("maid"), "pavilion", { count: 2, pose: "stand" }),
      ],
    ],
  }),
  event({
    id: "summer-clothes",
    month: 6,
    day: 6,
    hour: 5,
    title: ["The summer clothes", "織縑縳"],
    line: [
      "The maids weave the summer's fine cloth at the loom and lay it in the chest.",
      "婢織縑縳於機，斂於衣箱。",
    ],
    cite: [SIMIN_SUMMER_CLOTH],
    attend: { villagers: ["bing.maid-a", "bing.maid-b", "bing.ji"] },
    script: [
      [
        at("labour", person("bing.maid-a"), "loom", { pose: "weave" }),
        at("gather", person("bing.ji"), "loom", { count: 1, pose: "weave" }),
      ],
      [go("stroll", person("bing.maid-b"), "loom", "chest", { pose: "carry" })],
    ],
  }),
  event({
    id: "airing",
    month: 7,
    day: 7,
    hour: 5,
    title: ["The books and clothes aired", "曝書衣"],
    line: [
      "On the seventh of the seventh the slips are laid out in the court, the master and the tutor among them, and the garments hung on the rack in the sun.",
      "七月七日，曝經書於庭，主人與傅在焉；曝衣裳於架。",
    ],
    cite: [SIMIN_AIRING],
    attend: {
      villagers: [
        "bing.ao",
        "bing.tutor",
        "bing.porter",
        "bing.maid-b",
        "bing.jia",
      ],
    },
    script: [
      [
        go("stroll", person("bing.porter"), "wing-east", "court", {
          pose: "carry",
        }),
        go("stroll", person("bing.maid-b"), "chest", "court", {
          pose: "carry",
        }),
      ],
      [
        at("gather", person("bing.ao"), "court", { count: 1, pose: "read" }),
        at("gather", person("bing.tutor"), "court", { count: 1, pose: "read" }),
        at("gather", person("bing.jia", { capped: true }), "court", {
          count: 1,
          pose: "read",
        }),
        at("labour", person("bing.maid-b"), "court", { pose: "carry" }),
      ],
    ],
  }),
  event({
    id: "new-grain",
    month: 7,
    day: 15,
    hour: 6,
    title: ["Tasting the new grain", "嘗新"],
    line: [
      "The master offers the first millet at the tablets before the family eats of it.",
      "主人以新粟薦於神主，然後食。",
    ],
    cite: [LIJI_NEW_GRAIN],
    attend: { villagers: ["bing.ao", "bing.jiang", "bing.cook-a"] },
    script: [
      [
        go("stroll", person("bing.cook-a"), "hearth", "tablets", {
          pose: "carry",
        }),
        ...household(["bing.ao", "bing.jiang"], "tablets"),
      ],
      [
        at("rite", person("bing.ao"), "tablets", { count: 1, pose: "kneel" }),
        at("gather", person("bing.jiang"), "tablets", {
          count: 1,
          pose: "serve",
        }),
      ],
    ],
  }),
  event({
    id: "goose",
    month: 8,
    day: 5,
    hour: 5,
    title: ["The goose at the gate", "納采 · 問名"],
    line: [
      "The suitor's messenger comes to the gate with a goose, is refused three times and led in to the hall, and asks the daughter's name.",
      "使者執雁至門，三辭而入於堂，納采，問名。",
    ],
    cite: [YILI_WEDDING, BAIHUTONG_MARRIAGE],
    attend: {
      villagers: [
        "bing.ao",
        "bing.steward",
        "bing.gatekeeper",
        "visitor.caller",
      ],
    },
    script: [
      [
        go(
          "receive",
          person("visitor.caller", { overlays: ["goose"] }),
          "edge",
          "gate",
          { count: 2 },
        ),
      ],
      [
        go(
          "receive",
          person("visitor.caller", { overlays: ["goose"] }),
          "gate",
          "hall",
          { count: 2 },
        ),
        go("stroll", person("bing.ao"), "dais", "east-steps"),
      ],
      [
        at("gather", person("bing.ao"), "hall", { count: 1, pose: "sit" }),
        at(
          "gather",
          person("visitor.caller", { overlays: ["goose"] }),
          "hall",
          { count: 1, pose: "bow" },
        ),
        at("gather", person("bing.steward"), "hall", {
          count: 1,
          pose: "write",
        }),
      ],
    ],
  }),
  event({
    id: "omen-and-gifts",
    month: 8,
    day: 15,
    hour: 5,
    title: ["The omen and the gifts", "納吉 · 納徵"],
    line: [
      "The messenger comes again to report the omen and bring the silk and the skins; the matchmaker comes with him.",
      "使者再至，納吉，納徵，束帛儷皮；媒氏從之。",
    ],
    cite: [YILI_WEDDING],
    attend: {
      villagers: [
        "bing.ao",
        "bing.jiang",
        "visitor.caller",
        "visitor.matchmaker",
      ],
    },
    script: [
      [
        go(
          "receive",
          person("visitor.caller", { overlays: ["basket"] }),
          "edge",
          "hall",
          { count: 2 },
        ),
        go("stroll", person("visitor.matchmaker"), "edge", "hall"),
      ],
      [
        at("gather", person("bing.ao"), "hall", { count: 1, pose: "sit" }),
        at(
          "gather",
          person("visitor.caller", { overlays: ["basket"] }),
          "hall",
          { count: 1, pose: "bow" },
        ),
        at("gather", person("visitor.matchmaker"), "hall", {
          count: 1,
          pose: "bow",
        }),
        go("stroll", person("bing.jiang"), "bed", "inner-door"),
      ],
    ],
  }),
  event({
    id: "clothes-cut",
    month: 8,
    day: 20,
    hour: 6,
    title: ["The clothes cut", "授衣"],
    line: [
      "The lady and the maids cut the autumn clothes and dye the silk.",
      "夫人與婢裁秋衣，染采色。",
    ],
    cite: [SIMIN_CLOTHES],
    attend: {
      villagers: ["bing.jiang", "bing.maid-a", "bing.maid-d", "bing.ji"],
    },
    script: [
      [go("stroll", person("bing.jiang"), "bed", "loom")],
      [
        at("gather", person("bing.jiang"), "loom", { count: 1, pose: "weave" }),
        at("gather", crowd("maid"), "loom", { count: 2, pose: "weave" }),
        at("gather", person("bing.ji"), "loom", { count: 1, pose: "spin" }),
      ],
    ],
  }),
  seasonalSacrifice({
    id: "autumn-sacrifice",
    month: 9,
    day: 3,
    title: ["The autumn sacrifice", "嘗"],
    line: [
      "The autumn sacrifice at the shrine, the new grain among the dishes.",
      "秋嘗於廟，薦新穀。",
    ],
    leader: "bing.ao",
    cite: [LIJI_SEASONS, YILI_SHI_SACRIFICE],
  }),
  event({
    id: "day-asked",
    month: 9,
    day: 10,
    hour: 5,
    title: ["The day asked", "請期"],
    line: [
      "The messenger asks the day of the wedding and the master names it.",
      "使者請期，主人告之。",
    ],
    cite: [YILI_WEDDING],
    attend: { villagers: ["bing.ao", "visitor.caller"] },
    script: [
      [go("receive", person("visitor.caller"), "edge", "hall", { count: 2 })],
      [
        at("gather", person("bing.ao"), "hall", { count: 1, pose: "sit" }),
        at("gather", person("visitor.caller"), "hall", {
          count: 1,
          pose: "bow",
        }),
      ],
    ],
  }),
  event({
    id: "fetching",
    month: 9,
    day: 18,
    hour: 10,
    title: ["The fetching at dusk", "親迎"],
    line: [
      "Torches in the forecourt at dusk; the suitor's chariot at the gate; he is received in the hall, the daughter is led down the west steps, her father charges her at the gate, and the chariot goes out to the street.",
      "昏，庭燎於外庭，壻車至門，主人迎於堂；女降自西階，父戒之於門，車出於街。",
    ],
    cite: [YILI_WEDDING],
    attend: "all",
    script: [
      [
        at("labour", person("bing.gatekeeper"), "forecourt", {
          effect: "torch",
          pose: "stand",
        }),
        at("gather", person("bing.porter"), "forecourt", {
          count: 1,
          pose: "carry",
        }),
        at("labour", person("bing.groom"), "gate", { pose: "lead" }),
      ],
      [
        go("receive", person("visitor.suitor"), "edge", "gate", { count: 2 }),
        at("gather", crowd("retainer"), "gate", { count: 4, pose: "stand" }),
      ],
      [
        go("receive", person("visitor.suitor"), "gate", "hall", { count: 2 }),
        go("stroll", person("bing.ao"), "dais", "east-steps"),
        at("gather", person("bing.ao"), "east-steps", {
          count: 1,
          pose: "bow",
        }),
      ],
      [
        go("stroll", person("bing.ji"), "loom", "west-steps", { pose: "bow" }),
        go("stroll", person("bing.jiang"), "bed", "west-steps"),
        at("gather", crowd("maid"), "west-steps", { count: 2, pose: "stand" }),
      ],
      [
        go("stroll", person("bing.ao"), "east-steps", "gate"),
        go("stroll", person("bing.ji"), "west-steps", "gate", { pose: "bow" }),
        at("gather", person("bing.ao"), "gate", { count: 1, pose: "stand" }),
      ],
      [
        go("wed", person("bing.ji"), "gate", "edge", {
          count: 6,
          effect: "banner",
        }),
        go("stroll", person("visitor.suitor"), "gate", "edge"),
      ],
    ],
    changes: [
      { villager: "bing.ji", set: { away: "year" } },
      {
        villager: "bing.ji",
        set: { relation: "daughter, married out", struck: true },
      },
    ],
  }),
  event({
    id: "mission",
    month: 10,
    day: 1,
    hour: 4,
    title: ["The mission", "聘"],
    line: [
      "The master's chariot goes out with two retainers on a mission to another court; he is away the month and the steward runs the house.",
      "主人聘於他國，二家臣從，去一月，宰攝家事。",
    ],
    cite: [YILI_MISSION],
    attend: {
      villagers: [
        "bing.ao",
        "bing.sima",
        "bing.shi",
        "bing.groom",
        "bing.steward",
      ],
    },
    script: [
      [at("labour", person("bing.groom"), "gate", { pose: "lead" })],
      [
        go("stroll", person("bing.ao"), "dais", "edge"),
        go("stroll", person("bing.sima"), "west-table", "edge"),
        go("stroll", person("bing.shi"), "west-table", "edge"),
        at("gather", person("bing.steward"), "gate", { count: 1, pose: "bow" }),
      ],
    ],
    changes: [{ villager: "bing.ao", set: { away: 10 } }],
  }),
  seasonalSacrifice({
    id: "winter-sacrifice",
    month: 10,
    day: 5,
    title: ["The winter sacrifice", "烝"],
    line: [
      "The winter sacrifice at the shrine with the master away: the steward stands in his place.",
      "冬烝於廟，主人聘未歸，宰攝其位。",
    ],
    leader: "bing.steward",
    cite: [LIJI_SEASONS, YILI_SHI_SACRIFICE],
  }),
  event({
    id: "banquet",
    month: 10,
    day: 25,
    hour: 9,
    title: ["The banquet", "燕禮"],
    line: [
      "The master back from his mission feasts the retainers in the hall by rank; the musicians are led in, the se and the bells sound, and the cups are counted.",
      "主人歸，燕家臣於堂，以爵為序；瞽入，鼓瑟擊鐘，算爵。",
    ],
    cite: [YILI_BANQUET],
    attend: "all",
    script: [
      [go("stroll", person("bing.ao"), "edge", "hall")],
      [
        at("feast", person("bing.ao"), "hall", { count: 1, pose: "sit" }),
        at("gather", crowd("retainer"), "hall", { count: 3, pose: "sit" }),
        at("gather", crowd("musician"), "hall", { count: 2, pose: "play" }),
        at("gather", crowd("cook"), "hall", { count: 2, pose: "carry" }),
        at("gather", person("bing.steward"), "hall", {
          count: 1,
          pose: "write",
        }),
      ],
    ],
  }),
  event({
    id: "caller",
    month: 11,
    day: 8,
    hour: 5,
    title: ["The caller", "士相見"],
    line: [
      "A shi calls with a pheasant, is refused three times at the gate, and is received in the hall.",
      "士執雉相見，主人三辭於門，受於堂。",
    ],
    cite: [YILI_CALL],
    attend: {
      villagers: ["bing.ao", "bing.gatekeeper", "bing.xiang", "visitor.caller"],
    },
    script: [
      [
        go(
          "receive",
          person("visitor.caller", { overlays: ["pheasant"] }),
          "edge",
          "gate",
          { count: 2 },
        ),
      ],
      [
        go(
          "receive",
          person("visitor.caller", { overlays: ["pheasant"] }),
          "gate",
          "hall",
          { count: 2 },
        ),
        go("stroll", person("bing.xiang"), "west-table", "inner-gate"),
      ],
      [
        at("gather", person("bing.ao"), "hall", { count: 1, pose: "bow" }),
        at(
          "gather",
          person("visitor.caller", { overlays: ["pheasant"] }),
          "hall",
          { count: 1, pose: "bow" },
        ),
      ],
    ],
  }),
  event({
    id: "return-call",
    month: 11,
    day: 9,
    hour: 5,
    title: ["The call returned", "復見"],
    line: [
      "The next day the master walks out to return the call, the pheasant carried back to its giver.",
      "明日，主人往見，還其雉。",
    ],
    cite: [YILI_CALL],
    attend: { villagers: ["bing.ao", "bing.xiang"] },
    script: [
      [
        go("stroll", person("bing.ao"), "dais", "edge"),
        go(
          "stroll",
          person("bing.xiang", { overlays: ["pheasant"] }),
          "west-table",
          "edge",
        ),
      ],
    ],
  }),
  event({
    id: "district-drinking",
    month: 11,
    day: 15,
    hour: 6,
    title: ["The district drinking", "鄉飲酒"],
    line: [
      "The master walks out to the district's drinking, where the elders sit by age and the songs are sung three times.",
      "主人出赴鄉飲酒，以齒為序，三歌三酬。",
    ],
    cite: [YILI_DRINKING],
    attend: { villagers: ["bing.ao", "bing.sima"] },
    script: [
      [
        go("stroll", person("bing.ao"), "dais", "edge"),
        go("stroll", person("bing.sima"), "west-table", "edge"),
      ],
    ],
  }),
  event({
    id: "death",
    month: 11,
    day: 24,
    hour: 9,
    title: ["The tutor dies", "士喪禮"],
    line: [
      "The physician comes too late; the invocator climbs the west range's roof with the tutor's robe and calls him back three times; the body is washed and the rice put in its mouth, and the household gathers in the range in hemp.",
      "醫至而不及。祝升西廂之屋，執復衣三號；沐浴，飯含，家人服麻聚於廂。",
    ],
    cite: [YILI_DEATH, LIJI_CALLING, CHUCI_ZHAOHUN],
    attend: "all",
    script: [
      [
        go("receive", person("visitor.physician"), "edge", "wing-west", {
          count: 1,
        }),
        at("gather", person("bing.jia", { capped: true }), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
      ],
      [
        go("receive", person("visitor.invocator"), "edge", "wing-west", {
          count: 1,
        }),
      ],
      [
        go("stroll", person("visitor.invocator"), "wing-west", "roof", {
          pose: "call",
        }),
        at("gather", crowd("retainer"), "court", { count: 3, pose: "stand" }),
      ],
      [
        go("stroll", person("visitor.invocator"), "roof", "wing-west"),
        go("stroll", person("bing.maid-b"), "well", "wing-west", {
          pose: "draw",
        }),
        go("stroll", person("bing.cook-a"), "hearth", "wing-west", {
          pose: "carry",
        }),
      ],
      [
        at("mourn", person("bing.ao", { overlays: ["hemp"] }), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
        at(
          "gather",
          person("bing.jia", { capped: true, overlays: ["hemp"] }),
          "wing-west",
          { count: 1, pose: "kneel" },
        ),
        at("gather", crowd("retainer", { overlays: ["hemp"] }), "wing-west", {
          count: 3,
          pose: "kneel",
        }),
        at(
          "gather",
          person("bing.steward", { overlays: ["hemp"] }),
          "wing-west",
          { count: 1, pose: "kneel" },
        ),
        at("gather", person("bing.shu", { overlays: ["hemp"] }), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
      ],
    ],
    changes: [{ villager: "bing.tutor", set: { away: "year" } }, ...HEMP],
  }),
  event({
    id: "dressing",
    month: 11,
    day: 25,
    hour: 5,
    title: ["The lesser dressing and the greater", "小斂 · 大斂"],
    line: [
      "The body is dressed on the second day and coffined on the third in the west range; the banner with his name is set at the west steps, the condolers come to the gate, and the household wails morning and evening in hemp.",
      "小斂，明日大斂，殯於西廂；銘置於西階，弔者至門，家人朝夕哭，服麻。",
    ],
    cite: [YILI_DEATH, YILI_MOURNING_DRESS],
    attend: "all",
    script: [
      [
        at("mourn", crowd("retainer", { overlays: ["hemp"] }), "wing-west", {
          count: 3,
          pose: "kneel",
        }),
        at("gather", person("bing.ao", { overlays: ["hemp"] }), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
        at(
          "gather",
          person("bing.jia", { capped: true, overlays: ["hemp"] }),
          "wing-west",
          { count: 1, pose: "kneel" },
        ),
        at("gather", crowd("maid"), "wing-west", { count: 2, pose: "carry" }),
      ],
      [
        go(
          "stroll",
          person("bing.xiang", { overlays: ["hemp"] }),
          "wing-west",
          "west-steps",
          { pose: "carry" },
        ),
        at(
          "gather",
          person("bing.xiang", { overlays: ["hemp"] }),
          "west-steps",
          { count: 1, pose: "stand" },
        ),
      ],
      [
        go("receive", crowd("guest"), "edge", "gate", { count: 3 }),
        at("gather", crowd("guest"), "gate", { count: 3, pose: "bow" }),
        at("gather", person("bing.gatekeeper"), "gate", {
          count: 1,
          pose: "bow",
        }),
      ],
    ],
  }),
  event({
    id: "burial",
    month: 12,
    day: 8,
    hour: 4,
    title: ["The coffin out", "既夕 · 葬"],
    line: [
      "Before dawn the bier is drawn out of the gate with the banner before it, the household following in hemp to the street and the grave; at the return the sacrifice of repose is laid in the range.",
      "既夕，昧爽柩出門，銘旌先之，家人服麻從之出街，至於墓；反哭，虞於廂。",
    ],
    cite: [YILI_BURIAL, YILI_REPOSE, LIJI_BURIAL],
    attend: "all",
    script: [
      [
        go(
          "stroll",
          person("bing.xiang", { overlays: ["hemp"] }),
          "west-steps",
          "gate",
          { pose: "carry" },
        ),
        go(
          "inter",
          crowd("retainer", { overlays: ["hemp"] }),
          "wing-west",
          "gate",
          { count: 6, effect: "grey" },
        ),
      ],
      [
        go("inter", crowd("retainer", { overlays: ["hemp"] }), "gate", "edge", {
          count: 6,
          effect: "grey",
        }),
        go(
          "stroll",
          person("bing.ao", { overlays: ["hemp"] }),
          "wing-west",
          "edge",
        ),
        go(
          "stroll",
          person("bing.jia", { capped: true, overlays: ["hemp"] }),
          "wing-west",
          "edge",
        ),
        go(
          "stroll",
          person("bing.steward", { overlays: ["hemp"] }),
          "wing-west",
          "edge",
        ),
        go(
          "stroll",
          person("bing.shu", { overlays: ["hemp"] }),
          "wing-west",
          "edge",
        ),
      ],
      [
        go(
          "stroll",
          person("bing.ao", { overlays: ["hemp"] }),
          "edge",
          "wing-west",
        ),
        go(
          "stroll",
          person("bing.jia", { capped: true, overlays: ["hemp"] }),
          "edge",
          "wing-west",
        ),
        go("receive", person("visitor.invocator"), "edge", "wing-west", {
          count: 1,
        }),
      ],
      [
        at("sacrifice", person("visitor.invocator"), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
        at("gather", person("bing.ao", { overlays: ["hemp"] }), "wing-west", {
          count: 1,
          pose: "kneel",
        }),
        at(
          "gather",
          person("bing.jia", { capped: true, overlays: ["hemp"] }),
          "wing-west",
          { count: 1, pose: "kneel" },
        ),
      ],
    ],
    changes: [{ villager: "bing.tutor", set: { struck: true } }],
  }),
  event({
    id: "la",
    month: 12,
    day: 15,
    hour: 6,
    title: ["The five household offerings", "臘五祀"],
    line: [
      "The master offers to the ancestors at the shrine and then to the five household spirits in turn: the door, the gate, the well, the hearth, and the inner room.",
      "主人臘先祖於廟，次及五祀：戶、門、井、灶、中霤。",
    ],
    cite: [LIJI_LA, SIMIN_LA],
    attend: "all",
    script: [
      [
        ...household(["bing.ao", "bing.jiang"], "shrine"),
        at("rite", person("bing.ao"), "shrine", { count: 1, pose: "kneel" }),
        at("gather", person("bing.jiang"), "shrine", {
          count: 1,
          pose: "serve",
        }),
      ],
      [
        go("stroll", person("bing.ao"), "shrine", "inner-door", {
          pose: "bow",
        }),
      ],
      [go("stroll", person("bing.ao"), "inner-door", "gate", { pose: "bow" })],
      [
        go("stroll", person("bing.ao"), "gate", "well", { pose: "bow" }),
        at("gather", person("bing.porter"), "well", { count: 1, pose: "draw" }),
      ],
      [
        go("stroll", person("bing.ao"), "well", "hearth", { pose: "bow" }),
        at("gather", crowd("cook"), "hearth", { count: 2, pose: "cook" }),
      ],
      [go("stroll", person("bing.ao"), "hearth", "chamber", { pose: "bow" })],
    ],
  }),
  event({
    id: "nuo",
    month: 12,
    day: 20,
    hour: 10,
    title: ["Driving out the year", "儺"],
    line: [
      "The ward's exorcists pass the gate with drums and masks; the master stands in court dress at the east steps while they pass.",
      "鄉人儺，鼓而過門；主人朝服而立於阼階。",
    ],
    cite: [LUNYU_NUO, LIJI_NUO],
    attend: "all",
    script: [
      [
        go("stroll", person("bing.ao"), "dais", "east-steps"),
        at("gather", person("bing.ao"), "east-steps", {
          count: 1,
          pose: "stand",
        }),
        at("gather", crowd("retainer"), "court", { count: 3, pose: "stand" }),
      ],
      [
        go("exorcise", crowd("peasant"), "street", "edge", {
          count: 4,
          effect: "drum",
        }),
        at("gather", person("bing.gatekeeper"), "gate", {
          count: 1,
          pose: "strike",
        }),
        at("gather", crowd("musician"), "hall", { count: 2, pose: "strike" }),
      ],
    ],
  }),
  // the physician's monthly call, every month but the one he is called to the death
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] as Month[]).map(physicianVisit),
].sort((a, b) => a.month - b.month || a.day - b.day || a.hour - b.hour);

/** everyone the events name by id, for the spec */
export const HOUSE_EVENT_VILLAGERS: readonly string[] = [
  ...new Set([
    ...ALL_DRAWN,
    ...HOUSE_EVENTS.flatMap((e) =>
      e.script
        .flat()
        .flatMap((d) =>
          d.actor.seat.startsWith("house:") ? [d.actor.seat.slice(6)] : [],
        ),
    ),
  ]),
];
