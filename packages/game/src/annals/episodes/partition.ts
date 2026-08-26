/**
 * Act I · The Partition (453 to 375 BCE). The age begins with the discovery
 * that a state can be taken from inside: three ministerial houses divide the
 * largest state in the north, a fourth takes a second throne the same way,
 * and the king who is supposed to prevent it writes both down as lawful.
 */
import { act } from "../build";
import type { EpisodeSpec } from "../types";

export const PARTITION: EpisodeSpec[] = [
  {
    id: "jinyang-flood",
    act: "partition",
    date: "453 BCE",
    year: -453,
    title: { en: "The water at Jinyang", zh: "水灌晋阳" },
    blurb: {
      en: "The Zhi house, the strongest of the four ministerial families that ran Jin, demanded land from the other three. Two paid. Zhao did not, and was besieged in Jinyang for a year until Zhi Bo turned the Fen into the city. Inside the walls the people hung their cooking pots from the rafters. Then Zhao's envoy got out at night, and the two houses standing in the water beside Zhi Bo did the arithmetic on which of them would be flooded next.",
      zh: "智氏最强，求地于三家。韩魏与之，赵不与，围晋阳岁余，决汾水以灌之。城中悬釜而炊。赵使夜出，韩魏方立于水上，自计其次且及己，遂反。",
    },
    sources: ["shiji-zh", "zhanguoce-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      zhi: { state: "zhi", home: "anyi" },
      zhao: { state: "zhao", home: "jinyang" },
      wei: { state: "wei", home: "anyi" },
      han: { state: "han", home: "yiyang" },
    },
    effects: [{ state: "zhi", status: "extinguished" }],
    scenes: [
      {
        card: { en: "The water at Jinyang", zh: "水灌晋阳" },
        date: "453 BCE",
        focus: "jinyang",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "column",
            seat: "zhi",
            from: "anyi",
            to: "jinyang",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "wei",
            from: "anyi",
            to: "jinyang",
            count: 4,
          }),
          act({
            kind: "column",
            seat: "han",
            from: "yiyang",
            to: "jinyang",
            count: 4,
          }),
        ],
        lines: [
          {
            speaker: "zhi-bo",
            text: {
              en: "Land is what a house is. Give me yours, or I will come and measure it myself.",
              zh: "家者，地也。与我地，不然吾自往度之。",
            },
          },
        ],
      },
      {
        focus: "jinyang",
        play: [
          act({ kind: "siege", seat: "zhi", at: "jinyang", against: "zhao" }),
        ],
      },
      {
        focus: "jinyang",
        cite: ["zizhitongjian-zhouqin-zh"],
        play: [
          act({ kind: "canal-cut", seat: "zhi", at: "jinyang" }),
          act({ kind: "flood", seat: "zhi", at: "jinyang" }),
        ],
        lines: [
          {
            speaker: "zhi-bo",
            text: {
              en: "I did not know until today that water could take a state.",
              zh: "吾乃今知水可以亡人国也。",
            },
          },
        ],
      },
      {
        focus: "jinyang",
        play: [
          act({ kind: "envoy", seat: "zhao", from: "jinyang", to: "anyi" }),
        ],
        lines: [
          {
            speaker: "zhao-xiangzi",
            text: {
              en: "Fen water can be turned on Anyi. Ask yourselves which of you he measures next.",
              zh: "汾水可以灌安邑。请自计：其次孰当受度？",
            },
          },
        ],
      },
      {
        focus: "anyi",
        play: [
          act({
            kind: "battle",
            seat: "zhao",
            at: "jinyang",
            against: "zhi",
            count: 8,
          }),
          act({ kind: "extinguish", seat: "zhi" }),
          act({ kind: "partition", seat: "zhao", at: "anyi", count: 3 }),
        ],
      },
    ],
  },
  {
    id: "three-houses",
    act: "partition",
    date: "403 BCE",
    year: -403,
    title: { en: "Three houses made marquesses", zh: "三家为侯" },
    blurb: {
      en: "For fifty years the three houses held the lands of Jin and no one called them states. In 403 the king at Luoyang, who had no army and no revenue, was asked to name them marquesses, and did. It cost him nothing he still had. It is the moment historians afterwards chose for the beginning of the Warring States, because it is the moment the form caught up with the fact.",
      zh: "三家分晋地五十年，未尝称国。周威烈王二十三年，命三家为诸侯。王无兵无赋，所与者名而已，然史家以此为战国之始：名至而实久定矣。",
    },
    sources: ["zizhitongjian-zhouqin-zh", "shiji-zh"],
    seats: {
      zhou: { state: "zhou", home: "zhou" },
      zhao: { state: "zhao", home: "handan" },
      wei: { state: "wei", home: "anyi" },
      han: { state: "han", home: "yiyang" },
    },
    scenes: [
      {
        card: { en: "Three houses made marquesses", zh: "三家为侯" },
        date: "403 BCE",
        focus: "zhou",
        play: [
          act({ kind: "envoy", seat: "zhao", from: "handan", to: "zhou" }),
          act({ kind: "envoy", seat: "wei", from: "anyi", to: "zhou" }),
          act({ kind: "envoy", seat: "han", from: "yiyang", to: "zhou" }),
        ],
      },
      {
        venue: "hall",
        dressing: "zhou",
        focus: "zhou",
        play: [act({ kind: "audience", seat: "zhou" })],
        lines: [
          {
            speaker: "zhou",
            text: {
              en: "We are asked to say what everyone already knows. Very well: say it in bronze.",
              zh: "所请者，天下已知之事耳。可矣，刻之于器。",
            },
          },
        ],
      },
      {
        focus: "zhou",
        cite: ["zizhitongjian-zhouqin-zh"],
        play: [act({ kind: "decree", seat: "zhou" })],
      },
      {
        play: [
          act({ kind: "enthrone", seat: "zhao" }),
          act({ kind: "enthrone", seat: "wei" }),
          act({ kind: "enthrone", seat: "han" }),
        ],
      },
    ],
  },
  {
    id: "tian-usurps",
    act: "partition",
    date: "386 BCE",
    year: -386,
    title: { en: "The Tian take Qi", zh: "田氏代齐" },
    blurb: {
      en: "In Qi the same thing happened more slowly and more politely. The Tian family had spent a century lending grain out of a large measure and taking it back in a small one, until the people of the capital were, in the phrase of the time, theirs. In 386 the head of the house asked the king at Luoyang to be recognised as marquess of Qi. The old ruling line was moved to the coast and forgotten.",
      zh: "齐之事同而缓。田氏以大斗出贷，小斗收之，历百年而民归之。安王十六年，田和请为诸侯，王许之。姜氏之君迁于海上，遂无闻焉。",
    },
    sources: ["shiji-zh", "zuozhuan-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      zhou: { state: "zhou", home: "zhou" },
    },
    scenes: [
      {
        card: { en: "The Tian take Qi", zh: "田氏代齐" },
        date: "386 BCE",
        focus: "linzi",
        play: [act({ kind: "market-open", seat: "qi" })],
        lines: [
          {
            speaker: "tian-he",
            text: {
              en: "Lend by the large measure and collect by the small one, and in a hundred years you will not need an army.",
              zh: "以大斗贷，以小斗收，百年而不须兵。",
            },
          },
        ],
      },
      {
        focus: "linzi",
        play: [act({ kind: "usurp", seat: "qi" })],
      },
      {
        focus: "zhou",
        play: [
          act({ kind: "envoy", seat: "qi", from: "linzi", to: "zhou" }),
          act({ kind: "decree", seat: "zhou" }),
        ],
      },
    ],
  },
  {
    id: "zheng-swallowed",
    act: "partition",
    date: "376 to 375 BCE",
    year: -375,
    title: { en: "Han swallows Zheng", zh: "韩灭郑" },
    blurb: {
      en: "The three houses divided the last of Jin between them in 376 and left the last duke a commoner. A year later Han took Zheng, a small, old, exhausting state that had spent three centuries being the road between everybody, and moved its own capital into Zheng's city. The map of the middle plain is now seven states and no cushions.",
      zh: "周安王二十六年，三家分晋余地，废其君为庶人。明年，韩灭郑，徙都于郑。郑者，三百年为天下之孔道而疲于奔命者也。自是中原七国相接，无复缓冲。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      han: { state: "han", home: "yiyang" },
      zheng: { state: "zheng", home: "xinzheng" },
      zhao: { state: "zhao", home: "handan" },
      wei: { state: "wei", home: "anyi" },
      jin: { state: "jin", home: "anyi" },
    },
    effects: [
      { state: "jin", status: "extinguished" },
      { state: "zheng", status: "extinguished" },
    ],
    scenes: [
      {
        card: { en: "The last of Jin", zh: "晋绝祀" },
        date: "376 BCE",
        focus: "anyi",
        play: [
          act({ kind: "partition", seat: "zhao", at: "anyi", count: 3 }),
          act({ kind: "extinguish", seat: "jin" }),
        ],
      },
      {
        card: { en: "Han swallows Zheng", zh: "韩灭郑" },
        date: "375 BCE",
        focus: "xinzheng",
        play: [
          act({
            kind: "column",
            seat: "han",
            from: "yiyang",
            to: "xinzheng",
            against: "zheng",
            count: 6,
          }),
        ],
      },
      {
        focus: "xinzheng",
        play: [
          act({ kind: "siege", seat: "han", at: "xinzheng", against: "zheng" }),
          act({ kind: "gates-taken", seat: "han", at: "xinzheng" }),
        ],
      },
      {
        focus: "xinzheng",
        play: [
          act({ kind: "extinguish", seat: "zheng" }),
          act({ kind: "decree", seat: "han", at: "xinzheng" }),
        ],
        lines: [
          {
            speaker: "han",
            text: {
              en: "A road cannot be defended. We will live on it instead.",
              zh: "孔道不可守，则居之。",
            },
          },
        ],
      },
    ],
  },
];
