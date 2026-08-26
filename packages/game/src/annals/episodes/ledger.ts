/**
 * Act IV · The ledger (270 to 246 BCE). Qin stops fighting for territory and
 * starts fighting for the other side's manpower. The arithmetic is explicit,
 * it is written down, and at Changping it is carried out on four hundred
 * thousand men.
 */
import { act } from "../build";
import type { EpisodeSpec } from "../types";

export const LEDGER: EpisodeSpec[] = [
  {
    id: "yuyu",
    act: "ledger",
    date: "270 BCE",
    year: -270,
    title: { en: "Two rats in a hole", zh: "阏与之战" },
    blurb: {
      en: "Qin besieged Yuyu and the Zhao court asked its generals whether the place could be relieved. Lian Po and Yue Cheng said the road was too far, too narrow and too steep. Zhao She said that on a road like that the fight is two rats in a hole and the braver rat wins. He then spent twenty-eight days building earthworks thirty li outside his own capital so that Qin would report him frightened, and covered the remaining distance in two days.",
      zh: "秦围阏与，赵王问廉颇、乐乘，皆曰道远险狭，难救。赵奢曰：其道远险狭，譬之犹两鼠斗于穴中，将勇者胜。乃去邯郸三十里而垒，留二十八日不行，益增垒，使秦间还报以为怯。既遣间，卷甲而趋之，二日一夜至，大破秦军。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      zhao: { state: "zhao", home: "handan" },
      qin: { state: "qin", home: "xianyang" },
    },
    scenes: [
      {
        card: { en: "Two rats in a hole", zh: "阏与之战" },
        date: "270 BCE",
        focus: "yuyu",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "yuyu",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "siege",
            seat: "qin",
            at: "yuyu",
            against: "zhao",
            count: 8,
          }),
        ],
      },
      {
        venue: "hall",
        dressing: "zhao",
        focus: "handan",
        cite: ["shiji-zh"],
        play: [act({ kind: "debate", seat: "zhao", at: "handan", count: 4 })],
        lines: [
          {
            speaker: "zhao-she",
            text: {
              en: "A road that narrow is two rats in a hole. The braver rat wins it.",
              zh: "其道远险狭，譬之犹两鼠斗于穴中，将勇者胜。",
            },
          },
        ],
      },
      {
        venue: "camp",
        dressing: "zhao",
        focus: "handan",
        play: [
          act({ kind: "wall-build", seat: "zhao", at: "handan", count: 3 }),
        ],
        lines: [
          {
            speaker: "zhao-she",
            text: {
              en: "Twenty-eight days of digging, thirty li from my own gate. Let their spy go home and say it.",
              zh: "增垒二十八日不行，纵秦间归而言之。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "zhao",
        focus: "yuyu",
        play: [
          act({
            kind: "raid",
            seat: "zhao",
            from: "handan",
            to: "yuyu",
            against: "qin",
            count: 4,
          }),
          act({
            kind: "battle",
            seat: "zhao",
            at: "yuyu",
            against: "qin",
            count: 8,
          }),
        ],
      },
    ],
    effects: [{ place: "yuyu", marker: "pass" }],
  },
  {
    id: "distant-and-near",
    act: "ledger",
    date: "266 BCE",
    year: -266,
    title: { en: "Befriend the distant, strike the near", zh: "远交近攻" },
    blurb: {
      en: "Fan Ju arrived in Qin smuggled in a carriage, having been beaten half to death in Wei and left in a latrine. He told King Zhaoxiang that Qin had spent forty years marching past its neighbours to fight distant states, so that every victory enlarged somebody else's map. Be friendly to the far states and take the near ones, an inch at a time, and every inch is kept. He also told the king that he had a mother and a set of uncles running the country, and the king removed them.",
      zh: "范雎自魏亡入秦，说昭王曰：王不如远交而近攻，得寸则王之寸，得尺亦王之尺。今释近而攻远，不亦缪乎？王曰善。又言宣太后擅权、穰侯专政，王乃废太后，逐穰侯、华阳君于关外，以雎为相。",
    },
    sources: ["zhanguoce-zh", "shiji-zh", "hanfeizi-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      wei: { state: "wei", home: "daliang" },
      qi: { state: "qi", home: "linzi" },
    },
    scenes: [
      {
        card: { en: "Befriend the distant, strike the near", zh: "远交近攻" },
        date: "266 BCE",
        venue: "chamber",
        dressing: "qin",
        focus: "xianyang",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "audience",
            seat: "qin",
            at: "xianyang",
            archetype: "chancellor",
          }),
        ],
        lines: [
          {
            speaker: "fan-ju",
            text: {
              en: "An inch taken next door is an inch of yours. An inch taken far away is an inch of someone else's.",
              zh: "得寸则王之寸，得尺亦王之尺。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({
            kind: "expel",
            seat: "qin",
            from: "xianyang",
            to: "hangu",
            count: 3,
          }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
        lines: [
          {
            speaker: "dowager-xuan",
            text: {
              en: "I held this state for forty years. He is right that I held it, and right that it is his.",
              zh: "妾持秦四十年。彼言妾持之，是也；言当归王，亦是也。",
            },
          },
        ],
      },
      {
        focus: "linzi",
        play: [
          act({ kind: "envoy", seat: "qin", from: "xianyang", to: "linzi" }),
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "daliang",
            against: "wei",
            count: 6,
          }),
        ],
      },
    ],
  },
  {
    id: "changping",
    act: "ledger",
    date: "262 to 260 BCE",
    year: -260,
    title: { en: "The corridor and the pit", zh: "长平" },
    blurb: {
      en: "Qin cut the Shangdang highland off from Han, and Han ordered it surrendered. The governor gave it to Zhao instead, on the reasoning that a gift the neighbours cannot refuse is also a war they cannot refuse. Lian Po dug in and would not fight for three years, which was working. Qin spent gold in Handan on the story that the only general it feared was Zhao Kuo, whose mother wrote to the king asking that her family not be punished when he lost. He was replaced, he attacked, he was surrounded for forty-six days, and after the surrender Bai Qi buried the prisoners, keeping two hundred and forty boys to carry the news home.",
      zh: "秦绝上党归韩之道，韩王令上党降秦。守冯亭以与赵，曰：与赵则秦怒必攻赵，赵急必亲韩。廉颇坚壁不战三年。秦行千金于赵为反间，曰秦之所畏独马服子括耳。赵王使括代颇。括母上书言括不可将，愿无随坐。括出击，秦将白起佯北而绝其后，围之四十六日，赵卒降者四十万，起尽坑之，遗其小者二百四十人归赵。",
    },
    chapter: "corridor-states",
    sources: ["shiji-zh", "zhanguoce-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "handan" },
      han: { state: "han", home: "yiyang" },
    },
    scenes: [
      {
        card: { en: "The corridor and the pit", zh: "长平" },
        date: "262 BCE",
        venue: "hall",
        dressing: "han",
        focus: "shangdang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "refuse", seat: "han", at: "shangdang" }),
          act({ kind: "envoy", seat: "han", from: "shangdang", to: "handan" }),
        ],
        lines: [
          {
            speaker: "han",
            text: {
              en: "We are told to hand the highland to Qin. Hand it to Zhao. Then it is Zhao's war.",
              zh: "王令降秦，臣愿以与赵。赵受之，则秦之怒在赵矣。",
            },
          },
        ],
      },
      {
        venue: "camp",
        dressing: "zhao",
        focus: "changping",
        play: [
          act({
            kind: "column",
            seat: "zhao",
            from: "handan",
            to: "changping",
            count: 8,
          }),
          act({ kind: "garrison", seat: "zhao", at: "changping", count: 8 }),
        ],
        lines: [
          {
            speaker: "lian-po",
            text: {
              en: "They are far from home and we are not. Nothing else about this needs deciding.",
              zh: "秦远来，我近守。坚壁勿战，无他计也。",
            },
          },
        ],
      },
      {
        venue: "chamber",
        dressing: "zhao",
        focus: "handan",
        cite: ["zhanguoce-zh"],
        play: [
          act({ kind: "gold", seat: "qin", from: "xianyang", to: "handan" }),
        ],
        lines: [
          {
            speaker: "zhao-kuo",
            text: {
              en: "My father wrote of war as a thing that kills. I have read every book on it and it does not frighten me.",
              zh: "兵，死地也，而括易言之。臣读兵书尽，未尝惧焉。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "changping",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "changping",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "siege",
            seat: "qin",
            at: "changping",
            against: "zhao",
            count: 8,
          }),
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "changping",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "surrender", seat: "zhao", at: "changping" }),
          act({ kind: "bury", seat: "qin", at: "changping", count: 8 }),
        ],
        lines: [
          {
            speaker: "bai-qi",
            text: {
              en: "Forty thousand of them would have to be fed and the rest would have to be watched. Send the boys home.",
              zh: "赵卒反复，非尽杀之，恐为乱。乃挟诈而尽坑之，遗其小者归赵。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "changping", marker: "tomb" }],
  },
  {
    id: "handan-siege",
    act: "ledger",
    date: "259 to 257 BCE",
    year: -257,
    title: { en: "The city that would not fall", zh: "邯郸之围" },
    blurb: {
      en: "After Changping there was nothing between Qin and Handan except the people of Handan, who held it for two years on a diet the histories describe by saying that they exchanged children. Lord Pingyuan went to Chu for help with nineteen retainers and one, Mao Sui, who had put himself forward and whom nobody had heard of; the argument stalled all morning and Mao Sui walked up the steps with his hand on his sword and finished it in a sentence. Chu and Wei came. Qin lost its first great siege.",
      zh: "长平之后，秦围邯郸二年，城中易子而食，析骸而炊。平原君求救于楚，门下食客得十九人，毛遂自荐而往。日中不决，毛遂按剑历阶而上，说楚王以合从之利，楚王曰唯唯。楚魏之兵至，秦师解去。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "handan" },
      chu: { state: "chu", home: "chen" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "The city that would not fall", zh: "邯郸之围" },
        date: "259 BCE",
        focus: "handan",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "changping",
            to: "handan",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "siege",
            seat: "qin",
            at: "handan",
            against: "zhao",
            count: 8,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "zhao",
        focus: "handan",
        play: [
          act({ kind: "granary-close", seat: "zhao", at: "handan" }),
          act({ kind: "petition", seat: "zhao", at: "handan", count: 4 }),
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "chen",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "envoy", seat: "zhao", from: "handan", to: "chen" }),
        ],
        lines: [
          {
            speaker: "mao-sui",
            text: {
              en: "The covenant takes two words. Within ten paces of you the size of Chu is not worth anything.",
              zh: "从之利害，两言而决耳。今十步之内，王不得恃楚国之众也。",
            },
          },
        ],
      },
      {
        focus: "handan",
        play: [
          act({
            kind: "column",
            seat: "chu",
            from: "chen",
            to: "handan",
            against: "qin",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "wei",
            from: "daliang",
            to: "handan",
            against: "qin",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "zhao",
            at: "handan",
            against: "qin",
            count: 8,
          }),
        ],
      },
    ],
  },
  {
    id: "tally-stolen",
    act: "ledger",
    date: "257 BCE",
    year: -257,
    title: { en: "The other half of the tiger", zh: "窃符救赵" },
    blurb: {
      en: "Wei's army was sitting at Ye under orders to watch and not to fight. A Wei command was only lawful if the two halves of a bronze tiger tally matched, and the king kept his half in his bedchamber. Lord Xinling had a favourite of the king steal it, went to the camp, matched the halves, and when the general asked to confirm the order with the court anyway, had him killed on the spot. He sent home the only sons and the aged, took eighty thousand men to Handan, and did not go back to Wei for ten years.",
      zh: "魏王使晋鄙将十万众壁于邺，观望不进。信陵君乃因如姬盗兵符于王卧内，至邺，合符，晋鄙欲复请之，朱亥袖四十斤铁椎椎杀之。公子勒兵，令父子俱在军中者父归，兄弟俱在者兄归，独子无兄弟者归养，得选兵八万人进击秦军，遂救邯郸。公子留赵十年不敢归魏。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      wei: { state: "wei", home: "daliang" },
      zhao: { state: "zhao", home: "handan" },
      qin: { state: "qin", home: "xianyang" },
    },
    scenes: [
      {
        card: { en: "The other half of the tiger", zh: "窃符救赵" },
        date: "257 BCE",
        venue: "chamber",
        dressing: "wei",
        focus: "daliang",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "tally-split",
            seat: "wei",
            from: "daliang",
            to: "ye",
            effect: "night",
          }),
        ],
        lines: [
          {
            speaker: "lord-xinling",
            text: {
              en: "The order is in the bronze, not in the man. Bring me the half that is under his pillow.",
              zh: "兵符在铜不在人。请取王卧内之符。",
            },
          },
        ],
      },
      {
        venue: "camp",
        dressing: "wei",
        focus: "ye",
        play: [
          act({
            kind: "enforce",
            seat: "wei",
            at: "ye",
            count: 3,
            effect: "tally",
          }),
          act({ kind: "execute", seat: "wei", at: "ye" }),
        ],
      },
      {
        venue: "camp",
        dressing: "wei",
        focus: "ye",
        play: [
          act({
            kind: "expel",
            seat: "wei",
            from: "ye",
            to: "daliang",
            count: 3,
          }),
        ],
        lines: [
          {
            speaker: "lord-xinling",
            text: {
              en: "Fathers with sons here, go home. Brothers, the elder goes home. An only son goes home.",
              zh: "父子俱在军中者父归，兄弟俱在者兄归，独子无兄弟者归养。",
            },
          },
        ],
      },
      {
        focus: "handan",
        play: [
          act({
            kind: "column",
            seat: "wei",
            from: "ye",
            to: "handan",
            against: "qin",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "wei",
            at: "handan",
            against: "qin",
            count: 8,
          }),
        ],
      },
    ],
  },
  {
    id: "dujiang",
    act: "ledger",
    date: "c. 256 BCE",
    year: -256,
    title: { en: "The river divided", zh: "都江堰" },
    blurb: {
      en: "Li Bing, governor of the western basin Qin had taken in 316, split the Min river with a stone fish snout so that the inner channel watered the plain and the outer channel carried the flood away, and cut a spillway through a spur of rock by heating it with fire and cracking it with water, there being no iron tools equal to it. He set stone figures in the channel as gauges: if the water fell below their feet there was a drought, if it rose above their shoulders there was a flood. It has never stopped working.",
      zh: "秦昭王时，蜀守李冰凿离堆，作鱼嘴以分岷江：内江溉田，外江泄洪。凿玉垒山，以火烧水激而破之。又作石人立水中，水竭不至足，盛不没肩，以为水则。旱则引水浸润，雨则杜塞水门，故记曰水旱从人，不知饥馑，谓之天府。至今用之。",
    },
    sources: ["shiji-zh", "lvshichunqiu-zh"],
    seats: {
      qin: { state: "qin", home: "chengdu" },
    },
    scenes: [
      {
        card: { en: "The river divided", zh: "都江堰" },
        date: "c. 256 BCE",
        venue: "river",
        dressing: "qin",
        focus: "dujiang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "canal-cut", seat: "qin", at: "dujiang", count: 8 }),
        ],
        lines: [
          {
            speaker: "li-bing",
            text: {
              en: "The inner channel waters the plain. The outer channel takes the flood away. The river does both or neither.",
              zh: "内江溉田，外江泄洪。一江而两用，非分之不可。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "qin",
        focus: "dujiang",
        play: [
          act({
            kind: "works-cut",
            seat: "qin",
            at: "dujiang",
            effect: "fire",
          }),
        ],
        lines: [
          {
            speaker: "li-bing",
            text: {
              en: "No tool we have will cut that rock. Heat it and throw water at it until it comes apart.",
              zh: "山石坚，无器可凿。以火烧之，以水激之，则裂矣。",
            },
          },
        ],
      },
      {
        venue: "river",
        dressing: "qin",
        focus: "dujiang",
        play: [act({ kind: "measure", seat: "qin", at: "dujiang" })],
        lines: [
          {
            speaker: "li-bing",
            text: {
              en: "Below his feet is drought. Above his shoulders is flood. The stone will say so after all of us.",
              zh: "水竭不至足，盛不没肩。石人在，则后世知之。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "dujiang", marker: "weir" }],
  },
  {
    id: "tripods-carried",
    act: "ledger",
    date: "256 to 249 BCE",
    year: -249,
    title: { en: "The nine carried west", zh: "周亡鼎入秦" },
    blurb: {
      en: "The royal house had not governed anything for four centuries and had lately divided its remaining thirty-odd towns between two branches, each of which called itself the true one. In 256 the western branch joined a coalition against Qin, lost, and handed over its towns and its population, which was thirty thousand people. King Nan died and was not replaced. The nine tripods went west. Seven years later Qin extinguished the eastern branch as well, and the sacrifices that had run since the conquest of Shang stopped.",
      zh: "周室不王久矣，又分为东西二周，各自为主。赧王五十九年，西周与诸侯约从攻秦，秦攻西周，西周君奔秦，顿首受罪，尽献其邑三十六、口三万。周民东亡，秦取九鼎宝器，迁西周公于𢠸狐。赧王卒，周民遂东亡。后七年，秦灭东周，周祀绝。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhou: { state: "zhou", home: "zhou" },
    },
    scenes: [
      {
        card: { en: "The nine carried west", zh: "周亡鼎入秦" },
        date: "256 BCE",
        focus: "zhou",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "zhou",
            against: "zhou",
            count: 8,
          }),
          act({ kind: "surrender", seat: "zhou", at: "zhou" }),
        ],
      },
      {
        venue: "altar",
        dressing: "zhou",
        focus: "zhou",
        cite: ["shiji-zh"],
        play: [act({ kind: "funeral", seat: "zhou", at: "zhou", count: 4 })],
        lines: [
          {
            speaker: "king-nan",
            text: {
              en: "Thirty-six towns and thirty thousand people. That is what the mandate weighed at the end.",
              zh: "邑三十六，口三万。天命之末，其重如是。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({
            kind: "tripods",
            seat: "qin",
            from: "zhou",
            to: "xianyang",
            count: 3,
          }),
        ],
      },
      {
        focus: "zhou",
        play: [act({ kind: "extinguish", seat: "zhou" })],
      },
    ],
    effects: [
      { state: "zhou", status: "extinguished" },
      { place: "zhou", marker: "shrine" },
    ],
  },
  {
    id: "zhengguo-canal",
    act: "ledger",
    date: "246 BCE",
    year: -246,
    title: { en: "The spy who dug a canal", zh: "郑国渠" },
    blurb: {
      en: "Han, next in line and unable to fight, sent a water engineer to Qin to propose an enormous irrigation canal, the object being to spend Qin's labour on digging instead of on Han. Halfway through, the scheme was discovered. The engineer told the king that the plan had bought Han a few years but that the canal would serve Qin for ten thousand, and asked to be allowed to finish it. He was allowed to finish it. It watered forty thousand qing of alkaline land and Qin took the east with the grain.",
      zh: "韩闻秦好兴事，欲罢之，无令东伐，乃使水工郑国说秦凿泾水为渠。中作而觉。秦欲杀之，郑国曰：始臣为间，然渠成亦秦之利也。臣为韩延数岁之命，而为秦建万世之功。秦以为然，卒使就渠。渠成，溉泽卤之地四万余顷，关中为沃野，无凶年，秦以富强，卒并诸侯。",
    },
    chapter: "river-works",
    sources: ["shiji-zh", "hanfeizi-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      han: { state: "han", home: "yiyang" },
    },
    scenes: [
      {
        card: { en: "The spy who dug a canal", zh: "郑国渠" },
        date: "246 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "envoy",
            seat: "han",
            from: "yiyang",
            to: "xianyang",
            archetype: "engineer",
          }),
        ],
        lines: [
          {
            speaker: "zheng-guo",
            text: {
              en: "Three hundred li of channel from the Jing. It will take every spare hand in the state.",
              zh: "引泾水东注洛，三百余里，欲以溉田，尽发其众。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "qin",
        focus: "guanzhong",
        play: [
          act({ kind: "canal-cut", seat: "qin", at: "guanzhong", count: 12 }),
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [act({ kind: "enforce", seat: "qin", at: "xianyang", count: 3 })],
        lines: [
          {
            speaker: "zheng-guo",
            text: {
              en: "I came as a spy. I have bought Han a few years. I am building Qin ten thousand. Let me finish.",
              zh: "始臣为间，然渠成亦秦之利也。臣为韩延数岁之命，而为秦建万世之功。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "qin",
        focus: "guanzhong",
        play: [
          act({ kind: "measure", seat: "qin", at: "guanzhong" }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
    ],
    effects: [{ place: "guanzhong", marker: "canal" }],
  },
];
