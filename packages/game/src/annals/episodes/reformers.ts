/**
 * Act II · The Reformers (420 to 307 BCE). A generation of administrators
 * finds out what a state can do once the land is measured, the households
 * are written down, and rank is bought with heads rather than with birth.
 * Every reform here outlives the man who made it, and several of them kill
 * him.
 */
import { act } from "../build";
import type { EpisodeSpec } from "../types";

export const REFORMERS: EpisodeSpec[] = [
  {
    id: "ximen-bao",
    act: "reformers",
    date: "c. 420 BCE",
    year: -420,
    title: { en: "The bride for the river", zh: "河伯娶妇" },
    blurb: {
      en: "At Ye the elders and the shamans drowned a girl every year to keep the river god content, and split the levy they raised for it. Ximen Bao attended the wedding, said the bride was not handsome enough, and sent the chief shaman into the water to explain the delay. When nobody came back he offered to send the elders. Then he put the district to work cutting twelve channels off the river, and the same water that had been taking a girl a year began watering the fields.",
      zh: "邺俗为河伯娶妇，三老、祝巫岁敛民财，共分之。西门豹亲临其会，曰妇不佳，使大巫妪入水白之。久之不返，又欲遣三老。众惧而止。乃发民凿十二渠，引河水灌田，昔之溺女者今溉稼矣。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      wei: { state: "wei", home: "ye" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "The bride for the river", zh: "河伯娶妇" },
        date: "c. 420 BCE",
        venue: "river",
        dressing: "wei",
        focus: "ye",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "divine", seat: "clan", at: "ye" }),
          act({ kind: "toll", seat: "clan", at: "ye" }),
        ],
        lines: [
          {
            speaker: "ximen-bao",
            text: {
              en: "The bride is not handsome. Someone must go and ask the river for more time.",
              zh: "是女不佳，烦大巫为入报河伯，得更求好女。",
            },
          },
        ],
      },
      {
        venue: "river",
        dressing: "wei",
        focus: "ye",
        play: [act({ kind: "execute", seat: "wei", at: "ye" })],
        lines: [
          {
            speaker: "ximen-bao",
            text: {
              en: "She is slow. Send the elders after her.",
              zh: "巫妪何久也？三老为入趣之。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "wei",
        focus: "ye",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "canal-cut", seat: "wei", at: "ye", count: 12 }),
          act({ kind: "measure", seat: "wei", at: "ye" }),
        ],
        lines: [
          {
            speaker: "ximen-bao",
            text: {
              en: "The people may resent the digging. Their grandchildren will not.",
              zh: "民可以乐成，不可与虑始。今父老子弟虽患苦我，然百岁后期令父老子孙思我言。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "ye", marker: "canal" }],
  },
  {
    id: "li-kui-code",
    act: "reformers",
    date: "c. 400 BCE",
    year: -400,
    title: { en: "The book of law", zh: "法经" },
    blurb: {
      en: "Li Kui gave Wei two instruments that every later state copied. The first was a written code, six books of it, kept where anyone could be shown the article they had broken. The second was a grain office that bought at the top of a good harvest and sold at the bottom of a bad one, so that a full year did not ruin the farmer and a lean year did not ruin the town. He called it the levelling purchase, and it is the ancestor of every ever-normal granary in Chinese history.",
      zh: "李悝为魏作《法经》六篇，著于官府，罪有其条。又行平籴：岁熟则官籴，岁饥则官粜，使甚贵不伤民、甚贱不伤农。此后世常平仓之所自出也。",
    },
    chapter: "famine-granary",
    sources: ["hanfeizi-zh", "shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      wei: { state: "wei", home: "anyi" },
      merchant: { state: "merchant", home: "merchant" },
    },
    scenes: [
      {
        card: { en: "The book of law", zh: "法经" },
        date: "c. 400 BCE",
        venue: "hall",
        dressing: "wei",
        focus: "anyi",
        play: [act({ kind: "decree", seat: "wei", at: "anyi" })],
        lines: [
          {
            speaker: "li-kui",
            text: {
              en: "A punishment nobody can read is not a law. It is a mood.",
              zh: "刑不可知，则威不可测；民不知所避，非法也。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "wei",
        focus: "anyi",
        play: [
          act({ kind: "market-open", seat: "merchant", at: "anyi" }),
          act({ kind: "price", seat: "wei", at: "anyi" }),
        ],
        lines: [
          {
            speaker: "li-kui",
            text: {
              en: "Buy when the price is cruel to the farmer. Sell when it is cruel to the town.",
              zh: "籴甚贵伤民，甚贱伤农。故上籴下粜，使民无伤而农益劝。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "wei",
        focus: "anyi",
        cite: ["shiji-zh"],
        play: [act({ kind: "granary-close", seat: "wei", at: "anyi" })],
      },
    ],
  },
  {
    id: "wu-qi-xihe",
    act: "reformers",
    date: "409 to 387 BCE",
    year: -387,
    title: { en: "The land west of the River", zh: "西河之守" },
    blurb: {
      en: "Wu Qi took the west bank from Qin and held it for twenty-two years. He ate what the ranks ate, carried his own bedding, and once sucked the pus from a soldier's boil, at which the soldier's mother wept, because she had seen him do it for the father and the father had then died refusing to retreat. Asked what made a state secure, he pointed at the river and the mountains and said virtue, not terrain. He was talking to a marquess who wanted to hear about the terrain.",
      zh: "吴起为魏西河守二十二年，拒秦。与士卒最下者同衣食，卧不设席，亲为士卒吮疽。卒母闻而哭曰：往年吴公吮其父，其父战不旋踵而死。武侯浮西河而下，美其山川之固；起对曰：在德不在险。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      wei: { state: "wei", home: "anyi" },
      qin: { state: "qin", home: "yong" },
    },
    scenes: [
      {
        card: { en: "The land west of the River", zh: "西河之守" },
        date: "409 BCE",
        focus: "xihe",
        play: [
          act({
            kind: "column",
            seat: "wei",
            from: "anyi",
            to: "xihe",
            against: "qin",
            count: 8,
          }),
          act({ kind: "garrison", seat: "wei", at: "xihe", count: 4 }),
        ],
      },
      {
        venue: "camp",
        dressing: "wei",
        focus: "xihe",
        cite: ["shiji-zh"],
        play: [act({ kind: "idle", seat: "wei", at: "xihe" })],
        lines: [
          {
            speaker: "wu-qi",
            text: {
              en: "I sleep on what they sleep on. It is not kindness. It is the cheapest discipline there is.",
              zh: "卧不设席，行不骑乘，与士同劳苦。非爱之也，令之易行耳。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "wei",
        focus: "xihe",
        play: [
          act({
            kind: "battle",
            seat: "wei",
            at: "xihe",
            against: "qin",
            count: 8,
          }),
        ],
      },
      {
        venue: "river",
        dressing: "wei",
        focus: "xihe",
        cite: ["zizhitongjian-zhouqin-zh"],
        play: [act({ kind: "idle", seat: "wei", at: "xihe" })],
        lines: [
          {
            speaker: "wu-qi",
            text: {
              en: "The gorge is not what keeps this bank. Govern badly and everyone in this boat is an enemy.",
              zh: "在德不在险。若君不修德，舟中之人尽为敌国也。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "xihe", marker: "wall" }],
  },
  {
    id: "wu-qi-arrows",
    act: "reformers",
    date: "381 BCE",
    year: -381,
    title: { en: "Arrows in the dead king", zh: "伏尸而中王" },
    blurb: {
      en: "Chu hired Wu Qi and he did to the Chu nobility what he had done to the Wei army: cut the hereditary stipends after three generations, moved the great houses out to the empty south, and spent the savings on soldiers. The king who protected him died. The houses came for Wu Qi with bows, and he ran to the corpse and lay on it, so that the arrows that killed him also went into the body of their king. Under the law he had written for them, seventy families were exterminated for it.",
      zh: "楚悼王用吴起为令尹，废公族三世而收其禄，徙贵人于广虚之地，以养战士。王薨，宗室大臣作乱攻起；起走伏王尸而中之。既葬，太子立，令尹尽诛射起而并中王尸者，坐夷宗死者七十余家。",
    },
    sources: ["shiji-zh", "hanfeizi-zh", "lvshichunqiu-zh"],
    seats: {
      chu: { state: "chu", home: "ying" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "Arrows in the dead king", zh: "伏尸而中王" },
        date: "382 BCE",
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        play: [
          act({ kind: "decree", seat: "chu", at: "ying" }),
          act({
            kind: "expel",
            seat: "chu",
            from: "ying",
            to: "jiang",
            count: 3,
          }),
        ],
        lines: [
          {
            speaker: "wu-qi",
            text: {
              en: "Chu is poor in soldiers and rich in cousins. I intend to change the proportion.",
              zh: "楚国之患，在大臣太重、封君太众。臣请损其有余以奉不足。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        play: [act({ kind: "funeral", seat: "chu", at: "ying", count: 4 })],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        cite: ["shiji-zh"],
        play: [act({ kind: "assassinate", seat: "clan", at: "ying" })],
        lines: [
          {
            speaker: "wu-qi",
            text: {
              en: "Then shoot. You will be shooting your king as well, and he has a law about that.",
              zh: "群臣乱王！射之，则中王尸矣。王有法在。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "chu",
        focus: "ying",
        play: [act({ kind: "execute", seat: "chu", at: "ying" })],
      },
    ],
  },
  {
    id: "pole-at-the-gate",
    act: "reformers",
    date: "359 BCE",
    year: -359,
    title: { en: "Fifty gold for a pole", zh: "徙木立信" },
    blurb: {
      en: "Before he published a single article, Shang Yang stood a three-span pole at the south gate of the market and offered ten gold to anyone who moved it to the north gate. Nobody touched it, because governments did not pay for nothing. He raised the offer to fifty. One man carried the pole and was handed fifty gold in front of the market. Then the new law went up, and everyone in Qin had just been shown that the notice board meant what it said.",
      zh: "商鞅令既具，未布，恐民之不信，乃立三丈之木于国都市南门，募民有能徙置北门者予十金。民怪之，莫敢徙。复曰：能徙者予五十金。有一人徙之，辄予五十金，以明不欺。卒下令。",
    },
    chapter: "land-register",
    sources: ["shiji-zh", "shangjunshu-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      merchant: { state: "merchant", home: "merchant" },
    },
    scenes: [
      {
        card: { en: "Fifty gold for a pole", zh: "徙木立信" },
        date: "359 BCE",
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [act({ kind: "market-open", seat: "merchant", at: "xianyang" })],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "Ten gold to carry that pole to the north gate. No, it is not a trick.",
              zh: "有能徙此木至北门者，予十金。非诈也。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "gold", seat: "qin", from: "xianyang", to: "merchant" }),
        ],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "Fifty, then. Paid in the market, where everyone can see it counted.",
              zh: "予五十金。市中数之，令众目共见。",
            },
          },
        ],
      },
      {
        venue: "gates",
        dressing: "qin",
        focus: "xianyang",
        play: [act({ kind: "decree", seat: "qin", at: "xianyang" })],
        lines: [
          {
            speaker: "king-xiaogong",
            text: {
              en: "The pole was cheap. What we bought with it is that the next notice is believed.",
              zh: "木贱而信贵。自今令出，民信之矣。",
            },
          },
        ],
      },
    ],
  },
  {
    id: "register-stands",
    act: "reformers",
    date: "356 to 350 BCE",
    year: -350,
    title: { en: "The register and the bond", zh: "什伍连坐" },
    blurb: {
      en: "The Qin reform is four things done at once: households written into groups of five and ten that answer for each other's crimes, land measured out in paths and dykes so it can be taxed and sold, rank granted for heads taken in battle and for nothing else, and the old fiefs replaced by counties with a magistrate the court appoints. When the crown prince broke the new law, his tutors were punished in his place, one branded and one with his nose cut off. Nobody argued about the law again for twenty years.",
      zh: "秦孝公用商鞅：令民为什伍而相牧司连坐；开阡陌封疆而赋税平；有军功者各以率受上爵，宗室非有军功论不得为属籍；集小乡邑聚为县，置令丞。太子犯法，鞅曰法之不行自上犯之，刑其傅公子虔，黥其师公孙贾。明日秦人皆趋令。",
    },
    chapter: "conscription-rolls",
    sources: ["shangjunshu-zh", "shiji-zh", "hanfeizi-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "The register and the bond", zh: "什伍连坐" },
        date: "356 BCE",
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shangjunshu-zh"],
        play: [
          act({ kind: "measure", seat: "qin", at: "xianyang" }),
          act({ kind: "enforce", seat: "qin", at: "xianyang", count: 3 }),
        ],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "Five households, one answer. If you do not report your neighbour you are your neighbour.",
              zh: "令民为什伍，不告奸者腰斩，告奸者与斩敌首同赏。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [act({ kind: "decree", seat: "qin", at: "xianyang" })],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "Rank comes off the battlefield. A cousin of the house with no head to show is a commoner.",
              zh: "有军功者各以率受上爵。宗室非有军功论，不得为属籍。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        play: [act({ kind: "execute", seat: "qin", at: "xianyang" })],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "The heir cannot be cut. His tutors can, and the law will have been seen to reach upward.",
              zh: "法之不行，自上犯之。太子，君嗣也，不可施刑；刑其傅，黥其师。",
            },
          },
        ],
      },
      {
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "garrison", seat: "qin", at: "guanzhong", count: 4 }),
        ],
      },
    ],
  },
  {
    id: "chariots-tear",
    act: "reformers",
    date: "338 BCE",
    year: -338,
    title: { en: "Refused a bed under his own law", zh: "作法自毙" },
    blurb: {
      en: "Duke Xiao died and the prince whose tutors had been mutilated became king. Shang Yang ran east. At a wayside inn the keeper turned him away, because taking a guest without papers was a capital offence under a statute the guest had drafted. He got as far as his own fief, raised what he could, lost, and was torn apart between chariots in the capital, with his whole family. Every article he wrote stayed in force for the next hundred and thirty years.",
      zh: "孝公卒，太子立，公子虔之徒告商君欲反，发吏捕之。商君亡至关下，欲舍客舍，舍人不知其是商君，曰：商君之法，舍人无验者坐之。商君喟然叹曰：嗟乎，为法之敝一至此哉！去之魏，魏不受。归秦，起邑兵败死，车裂以徇，灭其家。而秦法不改。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "Refused a bed under his own law", zh: "作法自毙" },
        date: "338 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [act({ kind: "funeral", seat: "qin", at: "xianyang", count: 4 })],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "hangu",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "flee",
            seat: "clan",
            from: "xianyang",
            to: "hangu",
            count: 2,
          }),
        ],
        lines: [
          {
            speaker: "shang-yang",
            text: {
              en: "He will not take a guest without papers. I wrote that. I did not think it would be about me.",
              zh: "商君之法，舍人无验者坐之。嗟乎，为法之敝一至此哉！",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "xianyang",
            against: "clan",
            count: 6,
          }),
          act({ kind: "execute", seat: "qin", at: "xianyang" }),
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [act({ kind: "decree", seat: "qin", at: "xianyang" })],
        lines: [
          {
            speaker: "qin",
            text: {
              en: "The man is finished. The statutes stand. That was always the arrangement.",
              zh: "人亡而法存，固其所也。",
            },
          },
        ],
      },
    ],
  },
  {
    id: "hu-clothing",
    act: "reformers",
    date: "307 BCE",
    year: -307,
    title: { en: "The horsemen's dress", zh: "胡服骑射" },
    blurb: {
      en: "King Wuling of Zhao wanted mounted archers, and mounted archers cannot be had in a court robe. He ordered the northern nomad dress: trousers, short sleeves, boots. His uncle refused to appear, on the grounds that a state that changes its clothes has stopped being itself. The king went to the house and argued him round, and Zhao acquired the only cavalry arm in the middle plain, along with a frontier it could now actually patrol.",
      zh: "赵武灵王欲胡服骑射，曰：便国不必法古。公子成称疾不朝，以为变服者变教、易俗者离心。王亲往其第而请之，成乃服。于是始出胡服令，招骑射，北略中山之地，辟地至云中、九原。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      zhao: { state: "zhao", home: "handan" },
      hu: { state: "hu", home: "hu" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "The horsemen's dress", zh: "胡服骑射" },
        date: "307 BCE",
        venue: "hall",
        dressing: "zhao",
        focus: "handan",
        cite: ["zizhitongjian-zhouqin-zh"],
        play: [act({ kind: "debate", seat: "clan", at: "handan", count: 4 })],
        lines: [
          {
            speaker: "king-wuling",
            text: {
              en: "A robe with sleeves to the ground is not a garment. On a horse it is a hazard.",
              zh: "长袖曳地，非服也；乘马则为累。",
            },
          },
        ],
      },
      {
        venue: "chamber",
        dressing: "zhao",
        focus: "handan",
        play: [act({ kind: "petition", seat: "clan", at: "handan", count: 4 })],
        lines: [
          {
            speaker: "king-wuling",
            text: {
              en: "Convenience to the state is the rule. Antiquity is not a rule, it is a habit.",
              zh: "便国不必法古，利民不必循礼。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "zhao",
        focus: "dai",
        play: [
          act({ kind: "decree", seat: "zhao", at: "handan" }),
          act({
            kind: "raid",
            seat: "zhao",
            from: "handan",
            to: "dai",
            count: 4,
            archetype: "horse-archer",
          }),
        ],
      },
      {
        focus: "dai",
        play: [
          act({
            kind: "raid",
            seat: "zhao",
            from: "dai",
            to: "hu",
            against: "hu",
            count: 4,
            archetype: "horse-archer",
          }),
        ],
      },
    ],
    effects: [{ place: "dai", marker: "beacon-tower" }],
  },
];
