/**
 * Act V · The unification (238 to 221 BCE). Seventeen years, six states, and
 * an order of conquest chosen for the ledger rather than for glory. It ends
 * with a court that has no rival left to send an envoy to, and a decree that
 * there will be one axle width, one script, and one law.
 */
import { act } from "../build";
import type { EpisodeSpec } from "../types";

export const UNIFICATION: EpisodeSpec[] = [
  {
    id: "lao-ai",
    act: "unification",
    date: "238 BCE",
    year: -238,
    title: { en: "The revolt at Yong", zh: "嫪毐之乱" },
    blurb: {
      en: "The king of Qin came of age at the old capital, where the caps of manhood were given. His mother's favourite, whom the chancellor had introduced into the palace as a eunuch and who was not one, forged the queen dowager's seal, raised the palace guards and the county troops, and attacked the ceremony. It was over in a day. Lao Ai was torn apart by chariots, his clan exterminated, the two children he had by the dowager killed in a sack, and the chancellor who had introduced him was finished eighteen months later.",
      zh: "秦王政九年，冠于雍。长信侯嫪毐者，吕不韦所进，诈以为宦者入侍太后。及事觉，毐矫太后玺，发县卒及卫卒攻蕲年宫。王令相国昌平君发卒攻毐，战咸阳，斩首数百。毐败走，车裂以徇，夷三族；杀太后所生二子，迁太后于雍。其后免吕不韦相。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "The revolt at Yong", zh: "嫪毐之乱" },
        date: "238 BCE",
        venue: "altar",
        dressing: "qin",
        focus: "yong",
        cite: ["shiji-zh"],
        play: [act({ kind: "enthrone", seat: "qin", at: "yong" })],
      },
      {
        venue: "chamber",
        dressing: "qin",
        focus: "yong",
        play: [act({ kind: "usurp", seat: "clan", at: "yong" })],
        lines: [
          {
            speaker: "lao-ai",
            text: {
              en: "The seal is the dowager's. Nobody at the gate is going to read past the seal.",
              zh: "矫太后玺以发卒，门者视玺而已，不复问也。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "yong",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "yong",
            against: "clan",
            count: 8,
          }),
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "execute", seat: "qin", at: "xianyang" }),
          act({
            kind: "expel",
            seat: "qin",
            from: "xianyang",
            to: "yong",
            count: 3,
          }),
        ],
        lines: [
          {
            speaker: "ying-zheng",
            text: {
              en: "My mother goes to the old capital. Anyone who comes to plead for her joins the display.",
              zh: "迁太后于雍。敢以太后事谏者，戮而杀之。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "yong", marker: "altar" }],
  },
  {
    id: "guest-ministers",
    act: "unification",
    date: "237 BCE",
    year: -237,
    title: { en: "The memorial against the expulsion", zh: "谏逐客书" },
    blurb: {
      en: "After the canal spy and the chancellor, the Qin nobility persuaded the king that every foreign adviser in the state was an agent, and an order went out expelling all of them. Li Si, who was from Chu and was on the list, wrote on his way out that four of Qin's greatest kings had been made by foreigners, that the king's jade, his horses, his drums and his women were all foreign, and that a state which takes only its own people is a state that has decided to be small. The order was cancelled and the messenger caught him at the frontier.",
      zh: "秦宗室大臣皆言诸侯人来事秦者多为其主游间，请一切逐客。李斯亦在逐中，乃上书曰：昔穆公求士，得由余于戎、百里奚于宛、蹇叔于宋、丕豹公孙支于晋，并国二十，遂霸西戎。今陛下致昆山之玉，有随和之宝，垂明月之珠，此数宝者秦不生一焉，而陛下说之，何也？必秦国之所生然后可，则是夜光之璧不饰朝廷。泰山不让土壤，故能成其大；河海不择细流，故能就其深。秦王乃除逐客之令，复李斯官。",
    },
    chapter: "schools-of-the-hundred",
    sources: ["shiji-zh", "hanfeizi-zh", "zhanguoce-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      jixia: { state: "jixia", home: "jixia" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: { en: "The memorial against the expulsion", zh: "谏逐客书" },
        date: "237 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "debate", seat: "clan", at: "xianyang", count: 4 }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "hangu",
        play: [
          act({
            kind: "expel",
            seat: "qin",
            from: "xianyang",
            to: "hangu",
            count: 3,
          }),
        ],
      },
      {
        venue: "academy",
        dressing: "qin",
        focus: "jixia",
        cite: ["shiji-zh"],
        play: [act({ kind: "petition", seat: "jixia", at: "jixia", count: 4 })],
        lines: [
          {
            speaker: "li-si",
            text: {
              en: "The jade is foreign. The horses are foreign. The drums are foreign. Only the men are to be native?",
              zh: "此数宝者，秦不生一焉，而陛下说之。必秦国之所生然后可，则是夜光之璧不饰朝廷。",
            },
          },
          {
            speaker: "li-si",
            text: {
              en: "Mount Tai refuses no clod of earth. That is the whole of how it got to be that size.",
              zh: "泰山不让土壤，故能成其大；河海不择细流，故能就其深。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "hangu",
        play: [
          act({ kind: "envoy", seat: "qin", from: "xianyang", to: "hangu" }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
    ],
  },
  {
    id: "han-fei",
    act: "unification",
    date: "233 BCE",
    year: -233,
    title: { en: "A cup in a Qin cell", zh: "韩非死秦" },
    blurb: {
      en: "Han Fei was a prince of Han who stammered and could not argue in a room, and who wrote the most ruthless political prose of the age. The king of Qin read two of his essays and said that to meet the man who wrote them he would not mind dying. Han was invaded until it sent him. He arrived, was not employed, and Li Si, who had studied beside him under Xunzi and knew exactly how good he was, explained that a prince of Han would always be a prince of Han. Poison was sent to the cell. The king changed his mind and sent a pardon, which arrived late.",
      zh: "韩非，韩之诸公子，为人口吃，不能道说，而善著书。秦王见其《孤愤》《五蠹》之书，曰：嗟乎，寡人得见此人与之游，死不恨矣。因急攻韩，韩王遣非使秦。李斯、姚贾害之，毁曰：韩非，韩之诸公子也。今王欲并诸侯，非终为韩不为秦，此人情也。秦王以为然，下吏治非。李斯使人遗非药，使自杀。秦王后悔，使人赦之，非已死矣。",
    },
    sources: ["shiji-zh", "hanfeizi-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      han: { state: "han", home: "yiyang" },
    },
    scenes: [
      {
        card: { en: "A cup in a Qin cell", zh: "韩非死秦" },
        date: "234 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "yiyang",
            against: "han",
            count: 6,
          }),
        ],
        lines: [
          {
            speaker: "ying-zheng",
            text: {
              en: "If I could meet the man who wrote this I would not mind dying afterwards.",
              zh: "嗟乎，寡人得见此人与之游，死不恨矣。",
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
            kind: "audience",
            seat: "han",
            at: "xianyang",
            archetype: "scholar",
          }),
        ],
        lines: [
          {
            speaker: "han-fei",
            text: {
              en: "A ruler who trusts a minister's love rather than a minister's fear is counting on the weather.",
              zh: "恃人之为吾善也，境内不什数；用人不得为非，一国可使齐。",
            },
          },
        ],
      },
      {
        venue: "chamber",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({
            kind: "execute",
            seat: "qin",
            at: "xianyang",
            effect: "night",
          }),
        ],
        lines: [
          {
            speaker: "li-si",
            text: {
              en: "He is a prince of Han. He will be a prince of Han on the day the last Han city falls.",
              zh: "韩非，韩之诸公子也。终为韩不为秦，此人情也。",
            },
          },
        ],
      },
    ],
  },
  {
    id: "han-ends",
    act: "unification",
    date: "230 BCE",
    year: -230,
    title: { en: "Han is a commandery", zh: "秦灭韩" },
    blurb: {
      en: "The smallest of the seven went first, because it was nearest, because it sat on the road east, and because it could not be defended by anybody who was not already inside it. There was no great battle. An internal officer of Qin took the capital, the king of Han was captured, and the state that had held the pass road for a hundred and seventy-five years became a commandery with a name and a magistrate. Six left.",
      zh: "秦王政十七年，内史腾攻韩，得韩王安，尽纳其地，以其地为郡，命曰颍川。韩最小、最近、最当孔道，故先亡。自韩侯立国百七十五年而绝。天下六国矣。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      han: { state: "han", home: "yiyang" },
    },
    scenes: [
      {
        card: { en: "Han is a commandery", zh: "秦灭韩" },
        date: "230 BCE",
        focus: "yiyang",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "yiyang",
            against: "han",
            count: 8,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "han",
        focus: "yiyang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "surrender", seat: "han", at: "yiyang" }),
          act({ kind: "extinguish", seat: "han" }),
        ],
        lines: [
          {
            speaker: "han",
            text: {
              en: "We were the road. Everything that ever came through here came through us first.",
              zh: "韩者，天下之孔道也。凡东西之往来，未有不先经于韩者。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xinzheng",
        play: [
          act({ kind: "decree", seat: "qin", at: "xinzheng" }),
          act({ kind: "measure", seat: "qin", at: "xinzheng" }),
        ],
      },
    ],
    effects: [{ state: "han", status: "extinguished" }],
  },
  {
    id: "handan-taken",
    act: "unification",
    date: "228 BCE",
    year: -228,
    title: { en: "The north falls", zh: "秦破邯郸" },
    blurb: {
      en: "Zhao was the only state that could still beat Qin in the field, and Li Mu had done it twice. Qin bribed the king's favourite minister, and the story that Li Mu was negotiating his own terms went in. He was ordered to hand over the army, refused, and was killed. Three months later Wang Jian took Handan. The king of Qin went in person to the city where he had been born a hostage's son and had the families who had insulted his mother buried alive.",
      zh: "赵将李牧数破秦军。秦多与赵王宠臣郭开金，为反间，言李牧欲反。赵王使赵葱代之，牧不受命，赵人微捕杀之。后三月，王翦大破赵军，虏赵王迁，遂定邯郸。秦王之邯郸，诸尝与王生赵时母家有仇怨者，皆坑之。公子嘉率其宗数百人之代，自立为代王。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "handan" },
    },
    scenes: [
      {
        card: { en: "The north falls", zh: "秦破邯郸" },
        date: "229 BCE",
        venue: "camp",
        dressing: "zhao",
        focus: "handan",
        play: [
          act({ kind: "gold", seat: "qin", from: "xianyang", to: "handan" }),
        ],
        lines: [
          {
            speaker: "li-mu",
            text: {
              en: "A general in the field does not accept every order from the court. That is not treason, it is the job.",
              zh: "将在外，君命有所不受。此非叛也，将之职也。",
            },
          },
        ],
      },
      {
        venue: "camp",
        dressing: "zhao",
        focus: "handan",
        cite: ["shiji-zh"],
        play: [act({ kind: "execute", seat: "zhao", at: "handan" })],
      },
      {
        focus: "handan",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "handan",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "qin",
            at: "handan",
            against: "zhao",
            count: 8,
          }),
          act({ kind: "gates-taken", seat: "qin", at: "handan" }),
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "handan",
        play: [act({ kind: "bury", seat: "qin", at: "handan", count: 6 })],
        lines: [
          {
            speaker: "ying-zheng",
            text: {
              en: "I was born in this city and I remember which houses laughed.",
              zh: "寡人生于此城，尝有仇怨于母家者，寡人识之。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "zhao",
        focus: "dai",
        play: [
          act({
            kind: "flee",
            seat: "zhao",
            from: "handan",
            to: "dai",
            count: 2,
          }),
        ],
      },
    ],
  },
  {
    id: "dagger-in-the-map",
    act: "unification",
    date: "227 BCE",
    year: -227,
    title: { en: "The map unrolled", zh: "图穷匕见" },
    blurb: {
      en: "Yan was next and knew it. Crown Prince Dan's plan was to get close enough to the king of Qin to force a treaty at knife point, and failing that to kill him. The price of admission was the head of a defected Qin general, who cut his own throat to provide it, and the map of the richest district of Yan, in whose roller a poisoned dagger was rolled. At the audience the second envoy shook so badly that the court noticed. Jing Ke unrolled the map to the end. Nobody in the hall was armed, the guards could not enter unsummoned, and the king could not get his long sword out of its scabbard until a physician threw a medicine bag at the assassin.",
      zh: "燕太子丹使荆轲刺秦王，欲生劫之，使悉反诸侯侵地；不可，则刺杀之。取樊於期首，函封之，又以督亢地图，藏匕首于图中。秦舞阳色变振恐，群臣怪之。轲取图奉之，图穷而匕首见。轲把王袖而揕之，王惊起，袖绝，拔剑，剑长，操其室，剑坚不可立拔。侍医夏无且以其所奉药囊提轲。左右曰：王负剑！遂拔以击轲，断其左股。",
    },
    chapter: "assassins-map",
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      yan: { state: "yan", home: "ji" },
      qin: { state: "qin", home: "xianyang" },
    },
    scenes: [
      {
        card: { en: "The map unrolled", zh: "图穷匕见" },
        date: "227 BCE",
        venue: "river",
        dressing: "yan",
        focus: "ji",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "envoy",
            seat: "yan",
            from: "ji",
            to: "xianyang",
            archetype: "assassin",
          }),
        ],
        lines: [
          {
            speaker: "jing-ke",
            text: {
              en: "The wind is bitter and the water is cold. A man who goes from here does not come back.",
              zh: "风萧萧兮易水寒，壮士一去兮不复还。",
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
            kind: "audience",
            seat: "yan",
            at: "xianyang",
            archetype: "assassin",
          }),
        ],
        lines: [
          {
            speaker: "qin-wuyang",
            text: {
              en: "He is a man of the northern barbarian country and has never seen the Son of Heaven. Forgive him.",
              zh: "北蕃蛮夷之鄙人，未尝见天子，故振慑。愿大王少假借之。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [act({ kind: "assassinate", seat: "yan", at: "xianyang" })],
        lines: [
          {
            speaker: "jing-ke",
            text: {
              en: "It failed because I wanted him alive. I wanted the treaty more than I wanted the man.",
              zh: "事所以不成者，以欲生劫之，必得约契以报太子也。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "execute", seat: "qin", at: "xianyang" }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
    ],
  },
  {
    id: "ji-taken",
    act: "unification",
    date: "226 BCE",
    year: -226,
    title: { en: "The Yan court runs north", zh: "燕王走辽东" },
    blurb: {
      en: "The answer to the dagger was an army. Wang Jian broke the Yan and Dai forces on the Yi river and took the Yan capital within the year. The king of Yan fled to the far northeast, and, on advice, had his own son, the prince who had sent the assassin, killed and the head sent to Qin as an apology. Qin accepted the head and came back for the rest of him four years later.",
      zh: "秦王闻荆轲之事，大怒，益发兵诣赵，使王翦攻燕。燕代发兵御秦，秦破燕师于易水之西。明年，秦拔蓟城，燕王喜徙居辽东。代王嘉遗燕王书，令杀太子丹以献秦。燕王使使斩丹，欲献之秦。秦复进兵攻之，五年而虏燕王喜，卒灭燕。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      yan: { state: "yan", home: "ji" },
    },
    scenes: [
      {
        card: { en: "The Yan court runs north", zh: "燕王走辽东" },
        date: "226 BCE",
        focus: "ji",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "handan",
            to: "ji",
            against: "yan",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "qin",
            at: "ji",
            against: "yan",
            count: 8,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "qin",
        focus: "ji",
        play: [act({ kind: "gates-taken", seat: "qin", at: "ji" })],
      },
      {
        venue: "road",
        dressing: "yan",
        focus: "liaodong",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "flee",
            seat: "yan",
            from: "ji",
            to: "liaodong",
            count: 2,
          }),
          act({ kind: "execute", seat: "yan", at: "liaodong" }),
        ],
        lines: [
          {
            speaker: "prince-dan",
            text: {
              en: "My father is sending my head to Xianyang. He believes it will be enough.",
              zh: "王将斩丹以献秦，以为可以解也。",
            },
          },
        ],
      },
    ],
  },
  {
    id: "daliang-flooded",
    act: "unification",
    date: "225 BCE",
    year: -225,
    title: { en: "Three months of water", zh: "水灌大梁" },
    blurb: {
      en: "Daliang was a modern fortress on flat ground between two rivers, and it could not be stormed. Wang Ben cut channels from the He and the Hong into the plain around it and waited. After three months the walls came down of their own weight. The king of Wei surrendered and the state was made a commandery. It is the same instrument that opened the age at Jinyang, used by the state that learned it, on the state that invented the reforms everyone had copied.",
      zh: "王贲攻魏，引河沟灌大梁。三月，城坏，魏王假请降，尽取其地，以为郡县。始智伯以水攻晋阳而三家反之，终秦以水灌大梁而魏亡。始终一术也。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "Three months of water", zh: "水灌大梁" },
        date: "225 BCE",
        focus: "daliang",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "daliang",
            against: "wei",
            count: 8,
          }),
          act({
            kind: "siege",
            seat: "qin",
            at: "daliang",
            against: "wei",
            count: 8,
          }),
        ],
      },
      {
        venue: "works",
        dressing: "qin",
        focus: "daliang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "canal-cut", seat: "qin", at: "daliang", count: 8 }),
        ],
        lines: [
          {
            speaker: "wang-ben",
            text: {
              en: "The ground is flat and there are two rivers above it. We do not have to take this city.",
              zh: "地平而水在其上，不必攻也。",
            },
          },
        ],
      },
      {
        venue: "river",
        dressing: "qin",
        focus: "daliang",
        play: [act({ kind: "flood", seat: "qin", at: "daliang" })],
      },
      {
        venue: "gates",
        dressing: "wei",
        focus: "daliang",
        play: [
          act({ kind: "surrender", seat: "wei", at: "daliang" }),
          act({ kind: "extinguish", seat: "wei" }),
        ],
      },
    ],
    effects: [
      { state: "wei", status: "extinguished" },
      { place: "daliang", marker: "dike" },
    ],
  },
  {
    id: "six-hundred-thousand",
    act: "unification",
    date: "224 to 223 BCE",
    year: -223,
    title: { en: "The number a general asked for", zh: "非六十万人不可" },
    blurb: {
      en: "Asked how many men Chu would take, Li Xin said two hundred thousand and Wang Jian said six hundred thousand, which was every soldier in Qin. The king sent Li Xin, who was beaten badly. He then rode out to Wang Jian's farm and apologised. Wang Jian took the six hundred thousand, sat in a fortified camp for a year refusing battle while his men played ball games, and kept writing to the capital asking for more fields and houses so that a king with the whole army in one man's hands would have something reassuring to look at. When Chu finally moved, he followed and destroyed it.",
      zh: "秦王问李信：吾欲取荆，于将军度用几何人而足？信曰：不过用二十万人。问王翦，翦曰：非六十万人不可。王曰：王将军老矣，何怯也！遂使李信将二十万南伐荆，大败。王乃自驰如频阳谢翦。翦将六十万人伐荆，坚壁不战，日休士洗沐，而善饮食抚循之，投石超距为戏。数请美田宅园池甚众，曰：为大王将，有功终不得封侯，故及时请园池为子孙业耳。荆兵数挑战而不出，乃引而东，翦追之，大破荆军，杀项燕，虏楚王负刍，遂定楚地。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      chu: { state: "chu", home: "shouchun" },
    },
    scenes: [
      {
        card: { en: "The number a general asked for", zh: "非六十万人不可" },
        date: "225 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [act({ kind: "debate", seat: "qin", at: "xianyang", count: 4 })],
        lines: [
          {
            speaker: "wang-jian",
            text: {
              en: "Six hundred thousand. Not one man fewer, and there is no other number I can give.",
              zh: "非六十万人不可。",
            },
          },
        ],
      },
      {
        venue: "camp",
        dressing: "qin",
        focus: "chen",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "chen",
            against: "chu",
            count: 12,
          }),
          act({ kind: "garrison", seat: "qin", at: "chen", count: 8 }),
        ],
        lines: [
          {
            speaker: "wang-jian",
            text: {
              en: "Ask the king for more fields and more ponds. A general with the whole army wants to look greedy, not ambitious.",
              zh: "为大王将，有功终不得封侯，故及时请园池为子孙业耳。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "shouchun",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "shouchun",
            against: "chu",
            count: 12,
          }),
          act({ kind: "duel", seat: "qin", at: "shouchun", against: "chu" }),
        ],
        lines: [
          {
            speaker: "xiang-yan",
            text: {
              en: "Chu may be down to three households and it will still be Chu that finishes Qin.",
              zh: "楚虽三户，亡秦必楚。",
            },
          },
        ],
      },
      {
        venue: "gates",
        dressing: "chu",
        focus: "shouchun",
        play: [
          act({ kind: "gates-taken", seat: "qin", at: "shouchun" }),
          act({ kind: "extinguish", seat: "chu" }),
        ],
      },
    ],
    effects: [{ state: "chu", status: "extinguished" }],
  },
  {
    id: "dai-ends",
    act: "unification",
    date: "222 BCE",
    year: -222,
    title: { en: "The last of Zhao", zh: "代亡" },
    blurb: {
      en: "Two remnants were left in the north: a Zhao prince who had taken a few hundred of his clan to Dai and called himself king there, and the Yan court at the far end of the road, five years into an exile it had bought with its own crown prince's head. Wang Ben came up and took both in one campaign. The states that had been the north for two hundred and fifty years ended without a battle either of them could write down.",
      zh: "秦王政二十五年，大兴兵，使王贲攻辽东，虏燕王喜；还攻代，虏代王嘉。赵之公子嘉率其宗数百人自立于代者六年，至是而绝；燕徙辽东五年，斩太子丹以事秦者，亦并于是岁亡。北方二百五十年之国，遂无一战可纪。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "dai" },
      yan: { state: "yan", home: "liaodong" },
    },
    scenes: [
      {
        card: { en: "The last of Zhao", zh: "代亡" },
        date: "222 BCE",
        focus: "liaodong",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "ji",
            to: "liaodong",
            against: "yan",
            count: 8,
          }),
          act({ kind: "gates-taken", seat: "qin", at: "liaodong" }),
          act({ kind: "extinguish", seat: "yan" }),
        ],
      },
      {
        focus: "dai",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "liaodong",
            to: "dai",
            against: "zhao",
            count: 8,
          }),
          act({ kind: "surrender", seat: "zhao", at: "dai" }),
          act({ kind: "extinguish", seat: "zhao" }),
        ],
      },
    ],
    effects: [
      { state: "yan", status: "extinguished" },
      { state: "zhao", status: "extinguished" },
    ],
  },
  {
    id: "qi-surrenders",
    act: "unification",
    date: "221 BCE",
    year: -221,
    title: { en: "Forty years of peace, and a pine wood", zh: "齐降" },
    blurb: {
      en: "Qi had not fought anybody in forty years. Its chancellor was on a Qin retainer, its policy was that the wars in the west were not its business, and it did not reinforce a single state that fell. When the last army in the field was a Qin army it moved troops to its western border, which was the first defensive act of the reign and forty years late. Qin came down from the north instead. The king surrendered without a battle and was settled in a pine wood at Gong, where he starved. Qi's own people made a song about a king who listened to the wrong guests.",
      zh: "齐王建立四十余年不受兵。君王后死，后胜相齐，多受秦间金，劝王朝秦，不修攻战之备，不助五国攻秦，故秦得灭五国。五国已亡，秦兵卒入临淄，民莫敢格者。王建遂降，迁之共，处于松柏之间，饿而死。齐人怨王建不早与诸侯合从，歌之曰：松耶柏耶？住建共者客耶！",
    },
    chapter: "salt-and-iron",
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      qi: { state: "qi", home: "linzi" },
    },
    scenes: [
      {
        card: { en: "Forty years of peace, and a pine wood", zh: "齐降" },
        date: "221 BCE",
        venue: "hall",
        dressing: "qi",
        focus: "linzi",
        cite: ["zhanguoce-zh"],
        play: [
          act({ kind: "gold", seat: "qin", from: "xianyang", to: "linzi" }),
          act({ kind: "refuse", seat: "qi", at: "linzi" }),
        ],
        lines: [
          {
            speaker: "king-jian",
            text: {
              en: "The fighting is in the west. It has been in the west for forty years. It is not our business.",
              zh: "战在西方，四十年矣，非齐事也。",
            },
          },
        ],
      },
      {
        focus: "linzi",
        play: [
          act({ kind: "garrison", seat: "qi", at: "xihe", count: 4 }),
          act({
            kind: "column",
            seat: "qin",
            from: "dai",
            to: "linzi",
            against: "qi",
            count: 12,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "qi",
        focus: "linzi",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "surrender", seat: "qi", at: "linzi" }),
          act({ kind: "extinguish", seat: "qi" }),
        ],
        lines: [
          {
            speaker: "qi",
            text: {
              en: "Pine, is it? Or cypress? Who was it that put our king in that place? It was the guests.",
              zh: "松耶？柏耶？住建共者客耶！",
            },
          },
        ],
      },
    ],
    effects: [{ state: "qi", status: "extinguished" }],
  },
  {
    id: "one-rule",
    act: "unification",
    date: "221 BCE",
    year: -221,
    title: { en: "One axle, one script, twelve figures", zh: "书同文，车同轨" },
    blurb: {
      en: "With nobody left to send an envoy to, the court took a new title on the grounds that king was now a word for the defeated, divided the world into thirty-six commanderies with appointed officers instead of fiefs with heirs, standardised the axle width so that one cart could use every road, standardised the script so that one order could be read in every commandery, standardised the weights, the measures and the coin, collected the weapons of the empire and cast them into twelve enormous bronze figures, and moved a hundred and twenty thousand of the great families to the capital where they could be watched. The states were gone. The apparatus outlived them by two thousand years.",
      zh: "秦初并天下，令曰：今名号不更，无以称成功，传后世。其议帝号。遂称皇帝。分天下为三十六郡，郡置守、尉、监。一法度衡石丈尺。车同轨，书同文字。收天下兵，聚之咸阳，销以为钟鐻、金人十二，重各千石，置廷宫中。徙天下豪富于咸阳十二万户。国灭而其制存，历二千年。",
    },
    chapter: "heavy-coin",
    sources: ["shiji-zh", "shangjunshu-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      merchant: { state: "merchant", home: "merchant" },
      clan: { state: "clan", home: "clan" },
    },
    scenes: [
      {
        card: {
          en: "One axle, one script, twelve figures",
          zh: "书同文，车同轨",
        },
        date: "221 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "debate", seat: "qin", at: "xianyang", count: 4 }),
          act({ kind: "enthrone", seat: "qin", at: "xianyang" }),
        ],
        lines: [
          {
            speaker: "ying-zheng",
            text: {
              en: "King is what the defeated were called. Find me a title that has not been worn out.",
              zh: "今名号不更，无以称成功，传后世。其议帝号。",
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
            kind: "measure",
            seat: "qin",
            at: "xianyang",
            effect: "bronze",
          }),
          act({ kind: "mint", seat: "qin", at: "xianyang" }),
        ],
        lines: [
          {
            speaker: "li-si",
            text: {
              en: "One axle width, one script, one weight, one coin. An order written here is readable everywhere.",
              zh: "车同轨，书同文字，一法度衡石丈尺。令出于此，天下可读。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "seize-books", seat: "qin", at: "xianyang", count: 3 }),
          act({
            kind: "tripods",
            seat: "qin",
            from: "linzi",
            to: "xianyang",
            count: 3,
            effect: "bronze",
          }),
        ],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({
            kind: "expel",
            seat: "clan",
            from: "handan",
            to: "xianyang",
            count: 3,
          }),
          act({ kind: "market-open", seat: "merchant", at: "xianyang" }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
    ],
    effects: [{ place: "xianyang", marker: "mint" }],
  },
];
