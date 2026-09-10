/**
 * The house's circuits: where each role stands at each double-hour of a
 * month's day (plan `20260909_Plan_house_year.md` §5). Authored by role and
 * season with the months that differ written over the season, then
 * flattened to the engine's `Circuit[]` (`register.ts` resolves `home`,
 * `well`, and `edge` and jitters the hours).
 *
 * Two circuits are the shape of the whole: the master's day leaves the map
 * (out of the gate at 卯 to the lord's court, which the *Liji* has entered
 * as the light breaks, and back at 午) and the gatekeeper's runs through the
 * dark (the clapper at 戌 and 丑, the *Zhouli*'s 夕擊柝). The hours are
 * 1 子 … 4 卯 … 7 午 … 10 酉, 11 戌, 12 亥.
 */
import type { Cite, Month, Season } from "../../almanac";
import type { Circuit, Hour, Role, Stop } from "../../site";
import { seasonOf } from "../../almanac";

const LIJI_COURT: Cite = {
  id: "liji-zh",
  line: 1547,
  note: "玉藻: 朝，辨色始入。君日出而視之",
};
const LIJI_NEIZE: Cite = {
  id: "liji-zh",
  line: 770,
  note: "內則: 雞初鳴，咸盥漱",
};
const LIJI_LESSONS: Cite = {
  id: "liji-zh",
  line: 789,
  note: "內則: 十年出就外傅 … 二十而冠",
};
const LIJI_SILK: Cite = {
  id: "liji-zh",
  line: 1606,
  note: "月令 季春: 后妃齊戒，親東鄉躬桑 … 以勸蠶事",
};
const ZHOULI_WATCH: Cite = {
  id: "zhouli-zh",
  line: 1100,
  note: "天官 宮正: 夕擊柝而比之",
};
const ZHOULI_ICE: Cite = {
  id: "zhouli-zh",
  line: 1154,
  note: "天官 凌人: 夏，頒冰掌事",
};
const SIMIN_AIRING: Cite = {
  id: "siminyueling-zh",
  line: 151,
  note: "七月: 曝經書及衣裳",
};
const SIMIN_CLOTHES: Cite = {
  id: "siminyueling-zh",
  line: 160,
  note: "八月: 趣練縑帛，染采色",
};
const SIMIN_SUMMER_CLOTH: Cite = {
  id: "siminyueling-zh",
  line: 136,
  note: "六月: 命女紅織縑縳",
};
const YILI_ARCHERY: Cite = { id: "yili-zh", line: 416, note: "鄉射禮" };
const YILI_MISSION: Cite = { id: "yili-zh", line: 133, note: "聘禮" };

type Line = [string, string];

const stop = (
  hour: Hour,
  at: string,
  pose?: string,
  more?: { line?: Line; cite?: Cite; overlays?: string[] },
): Stop => ({
  hour,
  at,
  ...(pose ? { pose } : {}),
  ...(more?.overlays ? { overlays: more.overlays } : {}),
  ...(more?.line ? { line: { en: more.line[0], zh: more.line[1] } } : {}),
  ...(more?.cite ? { cite: more.cite } : {}),
});

/** a role's year: a day per season, and the months that differ */
interface RoleYear {
  seasons: Partial<Record<Season, Stop[]>>;
  months?: Partial<Record<Month, Stop[]>>;
}

const MONTHS: readonly Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** the twelve months of a role, the season's day unless the month is written */
const yearOf = (year: RoleYear): Partial<Record<Month, Stop[]>> => {
  const out: Partial<Record<Month, Stop[]>> = {};
  for (const month of MONTHS) {
    const stops = year.months?.[month] ?? year.seasons[seasonOf(month)];
    if (stops) out[month] = stops;
  }
  return out;
};

/** a season's day with one or more hours replaced */
const withStops = (day: Stop[], ...replacements: Stop[]): Stop[] => {
  const hours = new Set(replacements.map((s) => s.hour));
  return [...day.filter((s) => !hours.has(s.hour)), ...replacements].sort(
    (a, b) => a.hour - b.hour,
  );
};

// --- the master ---------------------------------------------------------

const MASTER_OUT = stop(4, "edge", undefined, {
  line: [
    "The master goes out of the gate at first light to the lord's court.",
    "主人昧爽出門，朝於君。",
  ],
  cite: LIJI_COURT,
});
const MASTER_SPRING: Stop[] = [
  MASTER_OUT,
  stop(7, "hall", "sit", {
    line: ["Back from the court at noon.", "日中自朝而歸。"],
  }),
  stop(8, "hall", "sit", {
    line: [
      "The steward and the retainers wait on the master in the hall.",
      "宰與家臣侍於堂。",
    ],
  }),
  stop(9, "court", "shoot", {
    line: ["Archery in the court.", "射於庭。"],
    cite: YILI_ARCHERY,
  }),
  stop(10, "chamber", "sit"),
];
const MASTER_SUMMER = withStops(
  MASTER_SPRING,
  stop(7, "pavilion", "sit", {
    line: ["The pavilion over the water, in the heat.", "暑中坐榭。"],
  }),
);
const MASTER_WINTER = withStops(
  MASTER_SPRING,
  stop(9, "hall", "read", {
    line: ["The slips read by the hall lamp.", "對堂燈讀簡。"],
  }),
);

// --- the lady -----------------------------------------------------------

const LADY_SPRING: Stop[] = [
  stop(4, "chamber", undefined, {
    line: ["Up at cockcrow, washed and dressed.", "雞初鳴，盥漱櫛縰。"],
    cite: LIJI_NEIZE,
  }),
  stop(5, "kitchen", "stand", {
    line: ["The day's orders given at the kitchen.", "於庖命一日之饌。"],
  }),
  stop(6, "loom", "weave"),
  stop(8, "garden", "stand"),
  stop(9, "east-rooms", "sit"),
  stop(10, "chamber", "sit"),
];
const LADY_SUMMER = withStops(LADY_SPRING, stop(8, "pavilion", "sit"));
const LADY_WINTER = withStops(LADY_SPRING, stop(8, "chamber", "sit"));

// --- the household ------------------------------------------------------

const DOWAGER_SPRING: Stop[] = [
  stop(5, "chamber", "sit"),
  stop(8, "pavilion", "sit", {
    line: [
      "The dowager takes the afternoon in the pavilion.",
      "太夫人午後坐榭。",
    ],
  }),
  stop(10, "chamber", "sit"),
];
const DOWAGER_SUMMER = withStops(DOWAGER_SPRING, stop(7, "pavilion", "sit"));
const DOWAGER_WINTER: Stop[] = [
  stop(5, "chamber", "sit"),
  stop(8, "hearth", "sit", {
    line: ["The dowager warms herself at the hearth.", "太夫人就灶取暖。"],
  }),
  stop(10, "chamber", "sit"),
];

const CONCUBINE_DAY: Stop[] = [
  stop(5, "east-rooms", "sit"),
  stop(6, "east-rooms", "zither"),
  stop(8, "garden", "stand"),
  stop(10, "east-rooms", "sit"),
];

const HEIR_SPRING: Stop[] = [
  stop(5, "wing-west", "read", {
    line: ["Lessons with the tutor in the west range.", "就傅於西廂。"],
    cite: LIJI_LESSONS,
  }),
  stop(6, "wing-west", "write"),
  stop(7, "wing-west", "read"),
  stop(9, "court", "shoot", {
    line: ["Archery with the retainers.", "與家臣習射。"],
  }),
  stop(10, "wing-west", "sit"),
];
const HEIR_SUMMER = withStops(
  HEIR_SPRING,
  stop(9, "forecourt", "stand", {
    line: ["Riding in the forecourt with the groom.", "與圉人習御於外庭。"],
  }),
);
const HEIR_MOURNING = withStops(HEIR_SPRING, stop(9, "wing-west", "sit"));

const CHILD_SPRING: Stop[] = [
  stop(5, "wing-west", "read", { cite: LIJI_LESSONS }),
  stop(7, "garden", "play"),
  stop(8, "pond", "play"),
  stop(9, "pavilion", "play"),
  stop(10, "pavilion", "sit"),
];
const CHILD_SUMMER = withStops(CHILD_SPRING, stop(7, "pond", "play"));
const CHILD_AUTUMN = withStops(
  CHILD_SPRING,
  stop(9, "garden", "play", {
    line: ["The chestnuts under the trees.", "拾栗於樹下。"],
  }),
);
const CHILD_WINTER = withStops(
  CHILD_SPRING,
  stop(8, "chamber", "sit"),
  stop(9, "chamber", "play"),
);

const GIRL_SPRING: Stop[] = [
  stop(5, "wing-west", "read", { cite: LIJI_LESSONS }),
  stop(7, "garden", "play"),
  stop(8, "pond", "play"),
  stop(9, "east-rooms", "sit"),
  stop(10, "east-rooms", "sit"),
];
const GIRL_WINTER = withStops(GIRL_SPRING, stop(8, "chamber", "sit"));

const YOUNGLADY_DAY: Stop[] = [
  stop(5, "loom", "weave"),
  stop(6, "loom", "spin"),
  stop(8, "east-rooms", "zither", {
    line: ["The se in the women's rooms.", "鼓瑟於東房。"],
  }),
  stop(10, "east-rooms", "sit"),
];

// --- the steward and the retainers --------------------------------------

const STEWARD_SPRING: Stop[] = [
  stop(5, "desk", "write"),
  stop(6, "edge", undefined, {
    line: ["Out to the market by the street.", "由街之市。"],
  }),
  stop(8, "hall", "stand"),
  stop(9, "granary", "stand"),
  stop(10, "desk", "write"),
];
const STEWARD_ICE = withStops(
  STEWARD_SPRING,
  stop(6, "gate", "stand", {
    line: ["The ice received at the gate.", "受冰於門。"],
    cite: ZHOULI_ICE,
  }),
);
const STEWARD_LEVY = withStops(
  STEWARD_SPRING,
  stop(9, "granary", "stand", {
    line: ["The levy paid out of the granary.", "自廪出賦。"],
  }),
);
const STEWARD_ABSENCE = withStops(
  STEWARD_SPRING,
  stop(8, "hall", "sit", {
    line: [
      "The steward runs the house while the master is away.",
      "主人聘，宰攝家事。",
    ],
    cite: YILI_MISSION,
  }),
);
const STEWARD_ACCOUNTS = withStops(
  STEWARD_SPRING,
  stop(9, "desk", "write", {
    line: ["The year's accounts closed.", "結歲計。"],
  }),
);

const RETAINER_SPRING: Stop[] = [
  stop(5, "west-table", "sit"),
  stop(8, "hall", "stand", {
    line: ["Attending the master in the hall.", "侍主人於堂。"],
  }),
  stop(9, "court", "shoot", { cite: YILI_ARCHERY }),
  stop(10, "wing-west", "liubo", {
    line: ["Liubo in the west range.", "博於西廂。"],
  }),
];
const RETAINER_WINTER = withStops(
  RETAINER_SPRING,
  stop(9, "wing-west", "liubo"),
  stop(10, "west-table", "sit"),
);

const TUTOR_DAY: Stop[] = [
  stop(5, "wing-west", "read", { cite: LIJI_LESSONS }),
  stop(6, "wing-west", "write"),
  stop(7, "wing-west", "sit"),
  stop(9, "pavilion", "read"),
  stop(10, "wing-west", "sit"),
];
const TUTOR_WINTER = withStops(TUTOR_DAY, stop(9, "wing-west", "read"));

const MUSICIAN_DAY: Stop[] = [
  stop(5, "hall", "play", {
    line: ["The se tuned in the hall.", "調瑟於堂。"],
  }),
  stop(8, "hall", "play"),
  stop(10, "hall", "play"),
];
const MUSICIAN_WINTER = withStops(MUSICIAN_DAY, stop(10, "chamber", "play"));

// --- the servants -------------------------------------------------------

const MAID_SPRING: Stop[] = [
  stop(4, "well", "draw", {
    line: ["Water drawn at dawn.", "晨汲。"],
  }),
  stop(5, "kitchen", "serve"),
  stop(6, "loom", "weave"),
  stop(7, "kitchen", "serve"),
  stop(8, "chamber", "sweep"),
  stop(9, "east-rooms", "stand"),
  stop(10, "kitchen", "serve"),
  stop(11, "chamber", "stand", {
    overlays: ["lamp"],
    line: ["The lamps carried in after dusk.", "酉後執燈。"],
  }),
];
const MAID_SUMMER = withStops(MAID_SPRING, stop(8, "pavilion", "stand"));
const MAID_SILK = withStops(
  MAID_SPRING,
  stop(6, "east-rooms", "stand", {
    line: ["The silkworm trays fed in the women's rooms.", "飼蠶於東房。"],
    cite: LIJI_SILK,
  }),
);
const MAID_SUMMER_CLOTH = withStops(
  MAID_SUMMER,
  stop(6, "loom", "weave", {
    line: ["The summer's fine cloth woven.", "織縑縳。"],
    cite: SIMIN_SUMMER_CLOTH,
  }),
);
const MAID_CLOTHES = withStops(
  MAID_SPRING,
  stop(6, "loom", "weave", {
    line: ["The autumn clothes cut.", "授衣。"],
    cite: SIMIN_CLOTHES,
  }),
);
const MAID_WINTER = withStops(MAID_SPRING, stop(9, "kitchen", "stand"));

const COOK_DAY: Stop[] = [
  stop(4, "granary", "carry"),
  stop(5, "hearth", "cook"),
  stop(6, "well", "draw"),
  stop(7, "hearth", "cook"),
  stop(9, "hearth", "chop"),
  stop(10, "hearth", "cook"),
];
const COOK_VICTIMS = withStops(
  COOK_DAY,
  stop(9, "forecourt", "chop", {
    line: ["The victims dressed for the sacrifice.", "治牲。"],
  }),
);

const GROOM_SPRING: Stop[] = [
  stop(4, "gate", "lead", {
    line: ["The chariot brought to the gate for the court.", "駕車於門以朝。"],
    cite: LIJI_COURT,
  }),
  stop(5, "manger", "groom"),
  stop(7, "gate", "lead", {
    line: ["The chariot met at the gate at noon.", "日中迎車於門。"],
  }),
  stop(8, "stable", "stand"),
  stop(9, "trough", "lead"),
  stop(10, "manger", "groom"),
];
const GROOM_SUMMER = withStops(
  GROOM_SPRING,
  stop(8, "pond", "lead", {
    line: ["The horses led to the pond.", "牽馬就池。"],
  }),
);
const GROOM_BRIDE = withStops(
  GROOM_SPRING,
  stop(10, "gate", "lead", {
    line: ["The bride's chariot readied at the gate.", "備婦車於門。"],
  }),
);

const GATEKEEPER_DAY: Stop[] = [
  stop(2, "forecourt", "strike", {
    overlays: ["clapper"],
    line: ["The clapper round the forecourt in the small hours.", "丑時擊柝。"],
    cite: ZHOULI_WATCH,
  }),
  stop(4, "gate", "stand"),
  stop(7, "gate", "stand"),
  stop(9, "armrack", "stand"),
  stop(10, "gate", "stand"),
  stop(11, "forecourt", "strike", {
    overlays: ["clapper"],
    line: ["The clapper round the forecourt at nightfall.", "夕擊柝。"],
    cite: ZHOULI_WATCH,
  }),
];

const PORTER_DAY: Stop[] = [
  stop(4, "bins", "carry"),
  stop(6, "gate", "carry"),
  stop(7, "edge", "carry", {
    line: ["Out to the street with the loads.", "負擔出街。"],
  }),
  stop(8, "bins", "carry"),
  stop(9, "court", "carry"),
  stop(10, "mat", "sit"),
];
const PORTER_ICE = withStops(
  PORTER_DAY,
  stop(6, "gate", "carry", {
    line: ["The ice carried from the gate to the chest.", "自門負冰入。"],
    cite: ZHOULI_ICE,
  }),
);
const PORTER_ICECUT = withStops(
  PORTER_DAY,
  stop(8, "pond", "carry", {
    line: ["Ice cut from the pond.", "鑿池冰。"],
  }),
);

// --- the year by role ---------------------------------------------------

export const HOUSE_DAYS: Partial<Record<Role, RoleYear>> = {
  master: {
    seasons: {
      spring: MASTER_SPRING,
      summer: MASTER_SUMMER,
      autumn: MASTER_SPRING,
      winter: MASTER_WINTER,
    },
    months: {
      7: withStops(
        MASTER_SPRING,
        stop(7, "court", "read", {
          line: [
            "The books aired in the court, the master among them.",
            "曝書於庭。",
          ],
          cite: SIMIN_AIRING,
        }),
      ),
    },
  },
  lady: {
    seasons: {
      spring: LADY_SPRING,
      summer: LADY_SUMMER,
      autumn: LADY_SPRING,
      winter: LADY_WINTER,
    },
    months: {
      3: withStops(
        LADY_SPRING,
        stop(6, "east-rooms", "stand", {
          line: ["The lady with her silkworms.", "夫人親蠶。"],
          cite: LIJI_SILK,
        }),
      ),
      8: withStops(
        LADY_SPRING,
        stop(6, "loom", "weave", {
          line: ["The autumn clothes cut with the maids.", "與婢授衣。"],
          cite: SIMIN_CLOTHES,
        }),
      ),
    },
  },
  dowager: {
    seasons: {
      spring: DOWAGER_SPRING,
      summer: DOWAGER_SUMMER,
      autumn: DOWAGER_SPRING,
      winter: DOWAGER_WINTER,
    },
  },
  concubine: {
    seasons: {
      spring: CONCUBINE_DAY,
      summer: CONCUBINE_DAY,
      autumn: CONCUBINE_DAY,
      winter: CONCUBINE_DAY,
    },
  },
  heir: {
    seasons: {
      spring: HEIR_SPRING,
      summer: HEIR_SUMMER,
      autumn: HEIR_SPRING,
      winter: HEIR_SPRING,
    },
    months: { 11: HEIR_MOURNING, 12: HEIR_MOURNING },
  },
  child: {
    seasons: {
      spring: CHILD_SPRING,
      summer: CHILD_SUMMER,
      autumn: CHILD_AUTUMN,
      winter: CHILD_WINTER,
    },
  },
  girl: {
    seasons: {
      spring: GIRL_SPRING,
      summer: GIRL_SPRING,
      autumn: GIRL_SPRING,
      winter: GIRL_WINTER,
    },
  },
  // struck from the house in the ninth month: no circuit after it
  younglady: {
    seasons: {
      spring: YOUNGLADY_DAY,
      summer: YOUNGLADY_DAY,
      autumn: YOUNGLADY_DAY,
    },
  },
  steward: {
    seasons: {
      spring: STEWARD_SPRING,
      summer: STEWARD_SPRING,
      autumn: STEWARD_SPRING,
      winter: STEWARD_SPRING,
    },
    months: {
      5: STEWARD_ICE,
      9: STEWARD_LEVY,
      10: STEWARD_ABSENCE,
      12: STEWARD_ACCOUNTS,
    },
  },
  retainer: {
    seasons: {
      spring: RETAINER_SPRING,
      summer: RETAINER_SPRING,
      autumn: RETAINER_SPRING,
      winter: RETAINER_WINTER,
    },
  },
  // dies in the eleventh month: no circuit after it
  tutor: {
    seasons: { spring: TUTOR_DAY, summer: TUTOR_DAY, autumn: TUTOR_DAY },
    months: { 10: TUTOR_WINTER },
  },
  musician: {
    seasons: {
      spring: MUSICIAN_DAY,
      summer: MUSICIAN_DAY,
      autumn: MUSICIAN_DAY,
      winter: MUSICIAN_WINTER,
    },
  },
  gatekeeper: {
    seasons: {
      spring: GATEKEEPER_DAY,
      summer: GATEKEEPER_DAY,
      autumn: GATEKEEPER_DAY,
      winter: GATEKEEPER_DAY,
    },
  },
  maid: {
    seasons: {
      spring: MAID_SPRING,
      summer: MAID_SUMMER,
      autumn: MAID_SPRING,
      winter: MAID_WINTER,
    },
    months: { 3: MAID_SILK, 6: MAID_SUMMER_CLOTH, 8: MAID_CLOTHES },
  },
  cook: {
    seasons: {
      spring: COOK_DAY,
      summer: COOK_DAY,
      autumn: COOK_DAY,
      winter: COOK_DAY,
    },
    months: { 9: COOK_VICTIMS },
  },
  groom: {
    seasons: {
      spring: GROOM_SPRING,
      summer: GROOM_SUMMER,
      autumn: GROOM_SPRING,
      winter: GROOM_SPRING,
    },
    months: { 9: GROOM_BRIDE },
  },
  porter: {
    seasons: {
      spring: PORTER_DAY,
      summer: PORTER_DAY,
      autumn: PORTER_DAY,
      winter: PORTER_DAY,
    },
    months: { 5: PORTER_ICE, 12: PORTER_ICECUT },
  },
};

/** the authored days flattened to the engine's shape, in role then month order */
export const flattenCircuits = (
  days: Partial<Record<Role, RoleYear>>,
): Circuit[] =>
  (Object.entries(days) as [Role, RoleYear][]).flatMap(([role, year]) =>
    (Object.entries(yearOf(year)) as [string, Stop[]][]).map(
      ([month, stops]) => ({
        role,
        month: Number(month) as Month,
        stops,
      }),
    ),
  );

export const HOUSE_CIRCUITS: Circuit[] = flattenCircuits(HOUSE_DAYS);
