/**
 * Act III · Kings and persuaders (353 to 278 BCE). The dukes and marquesses
 * take the royal title, which leaves the actual king with the altars and
 * nothing else. Travelling arguers sell alliance in two directions at once,
 * and the courts that buy the argument lose the war.
 */
import { act } from "../build";
import type { EpisodeSpec } from "../types";

export const KINGS: EpisodeSpec[] = [
  {
    id: "guiling",
    act: "kings",
    date: "353 BCE",
    year: -353,
    title: { en: "Besiege Wei to rescue Zhao", zh: "围魏救赵" },
    blurb: {
      en: "Wei besieged Handan and Zhao asked Qi for help. Sun Bin refused to march to Handan. He said that to untangle a knot you do not pull, and to part a fight you do not step between the fists; you strike where the enemy is empty. Qi marched on Daliang instead. The Wei army left Handan and came home at speed, and Qi was sitting across the road at Guiling when it arrived.",
      zh: "魏围邯郸，赵求救于齐。孙膑曰：夫解杂乱纷纠者不控卷，救斗者不搏撠，批亢捣虚，形格势禁则自为解耳。乃引兵疾走大梁。魏去邯郸而还，与齐战于桂陵，魏师大败。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      wei: { state: "wei", home: "daliang" },
      zhao: { state: "zhao", home: "handan" },
    },
    scenes: [
      {
        card: { en: "Besiege Wei to rescue Zhao", zh: "围魏救赵" },
        date: "354 BCE",
        focus: "handan",
        play: [
          act({
            kind: "column",
            seat: "wei",
            from: "daliang",
            to: "handan",
            against: "zhao",
            count: 8,
          }),
          act({
            kind: "siege",
            seat: "wei",
            at: "handan",
            against: "zhao",
            count: 8,
          }),
        ],
      },
      {
        venue: "camp",
        dressing: "qi",
        focus: "linzi",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "envoy", seat: "zhao", from: "handan", to: "linzi" }),
        ],
        lines: [
          {
            speaker: "sun-bin",
            text: {
              en: "You do not part a fight by stepping between the fists. Go where they are empty.",
              zh: "救斗者不搏撠，批亢捣虚。",
            },
          },
        ],
      },
      {
        focus: "daliang",
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "linzi",
            to: "daliang",
            against: "wei",
            count: 8,
          }),
        ],
      },
      {
        venue: "field",
        dressing: "qi",
        focus: "guiling",
        play: [
          act({
            kind: "battle",
            seat: "qi",
            at: "guiling",
            against: "wei",
            count: 8,
          }),
        ],
      },
    ],
    effects: [{ place: "guiling", marker: "field" }],
  },
  {
    id: "maling",
    act: "kings",
    date: "341 BCE",
    year: -341,
    title: { en: "The tree at dusk", zh: "马陵道" },
    blurb: {
      en: "Twelve years later the same two armies, the same two men. Sun Bin had Qi light a hundred thousand cooking fires on the first night, fifty thousand on the second, thirty thousand on the third, so that Pang Juan would read desertion and come on fast with his light troops. At Maling the road narrows under a hill. Sun Bin had a tree stripped and written on, and ten thousand crossbows laid along the slope with orders to shoot at a light. Pang Juan reached the tree at dusk and lit a torch to read it.",
      zh: "十三年后，齐魏复战。孙膑使齐军入魏地为十万灶，明日为五万灶，又明日为三万灶。庞涓喜曰：我固知齐军怯，入吾地三日，士卒亡者过半矣。乃弃其步军，与轻锐倍日并行逐之。膑度其暮当至马陵，道狭而旁多阻隘，乃斫大树白而书之曰：庞涓死于此树之下。伏万弩，期日暮见火举而俱发。涓果夜至斫木下，见白书，钻火烛之。读未毕，万弩俱发，魏军大乱。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "The tree at dusk", zh: "马陵道" },
        date: "341 BCE",
        venue: "camp",
        dressing: "qi",
        focus: "linzi",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "linzi",
            to: "daliang",
            against: "wei",
            count: 8,
          }),
        ],
        lines: [
          {
            speaker: "sun-bin",
            text: {
              en: "A hundred thousand fires tonight. Fifty thousand tomorrow. Thirty thousand after that.",
              zh: "入魏地为十万灶，明日为五万灶，又明日为三万灶。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "wei",
        focus: "maling",
        play: [
          act({
            kind: "raid",
            seat: "wei",
            from: "daliang",
            to: "maling",
            against: "qi",
            count: 4,
          }),
        ],
        lines: [
          {
            speaker: "pang-juan",
            text: {
              en: "Half of them have run already. Leave the foot behind. We march double stages.",
              zh: "齐军怯，入吾地三日，士卒亡者过半矣。弃其步军，倍日并行逐之。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "qi",
        focus: "maling",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "garrison",
            seat: "qi",
            at: "maling",
            count: 8,
            effect: "night",
          }),
        ],
      },
      {
        venue: "field",
        dressing: "qi",
        focus: "maling",
        play: [
          act({
            kind: "battle",
            seat: "qi",
            at: "maling",
            against: "wei",
            count: 8,
            effect: "torch",
          }),
          act({ kind: "duel", seat: "qi", at: "maling", against: "wei" }),
        ],
        lines: [
          {
            speaker: "pang-juan",
            text: {
              en: "So I have made that boy's name for him.",
              zh: "遂成竖子之名！",
            },
          },
        ],
      },
    ],
    effects: [{ place: "maling", marker: "field" }],
  },
  {
    id: "xuzhou-kings",
    act: "kings",
    date: "334 BCE",
    year: -334,
    title: { en: "Two kings acknowledge each other", zh: "徐州相王" },
    blurb: {
      en: "Wei had been beaten twice and could no longer pretend to lead. Qi had won twice and did not want the trouble of leading. At Xuzhou their rulers met and called each other king, which was a title only the house at Luoyang was entitled to and which neither of them asked Luoyang about. It cost nothing and it settled the question of what the old kingship was worth. Within thirty years there were seven kings and no king.",
      zh: "魏再败于齐，不能复长诸侯；齐胜而不欲任其劳。魏惠王与齐威王会于徐州，相尊为王，不请于周。王号者，天子之称也，二君取之而周不能问。其后三十年，七国皆王，而天下无王。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      wei: { state: "wei", home: "daliang" },
      zhou: { state: "zhou", home: "zhou" },
    },
    scenes: [
      {
        card: { en: "Two kings acknowledge each other", zh: "徐州相王" },
        date: "334 BCE",
        focus: "xuzhou",
        play: [
          act({ kind: "envoy", seat: "qi", from: "linzi", to: "xuzhou" }),
          act({ kind: "envoy", seat: "wei", from: "daliang", to: "xuzhou" }),
        ],
      },
      {
        venue: "altar",
        dressing: "qi",
        focus: "xuzhou",
        cite: ["shiji-zh"],
        play: [act({ kind: "covenant", seat: "qi", at: "xuzhou", count: 3 })],
        lines: [
          {
            speaker: "king-hui-wei",
            text: {
              en: "Call me king and I will call you king. Neither of us needs to write to Luoyang about it.",
              zh: "君王之，寡人亦王之，无庸请于周室。",
            },
          },
        ],
      },
      {
        play: [
          act({ kind: "enthrone", seat: "qi" }),
          act({ kind: "enthrone", seat: "wei" }),
        ],
      },
      {
        venue: "hall",
        dressing: "zhou",
        focus: "zhou",
        play: [act({ kind: "idle", seat: "zhou", at: "zhou" })],
        lines: [
          {
            speaker: "zhou",
            text: {
              en: "We were not consulted. We are informed that we were not required to be.",
              zh: "不谋于王室，而王室亦无以问之。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "xuzhou", marker: "altar" }],
  },
  {
    id: "vertical-horizontal",
    act: "kings",
    date: "333 to 318 BCE",
    year: -333,
    title: { en: "The persuaders", zh: "纵横" },
    blurb: {
      en: "Two arguments were on sale. The vertical covenant said the six eastern states should chain north to south and shut the passes on Qin, and Su Qin sold it well enough to wear the seals of six chancellors at once. The horizontal alliance said each state should make its own terms with Qin and be eaten last, and Zhang Yi sold that to the same courts. The two men had studied under the same teacher. Between them they moved more territory than most generals.",
      zh: "苏秦说六国从亲以摈秦，佩六国相印；张仪说连横以事秦，使诸侯各自为解。二人同师鬼谷。一从一横，天下之势屡易，其所徙之地，多于战将之所得。",
    },
    sources: ["zhanguoce-zh", "shiji-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "handan" },
      chu: { state: "chu", home: "ying" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "The persuaders", zh: "纵横" },
        date: "333 BCE",
        venue: "hall",
        dressing: "zhao",
        focus: "handan",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "audience",
            seat: "zhao",
            at: "handan",
            archetype: "persuader",
          }),
        ],
        lines: [
          {
            speaker: "su-qin",
            text: {
              en: "Six states, north to south, one covenant. Qin cannot fight a rope.",
              zh: "从亲以摈秦，秦不能与绳斗。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "zhao",
        focus: "handan",
        play: [
          act({
            kind: "envoy",
            seat: "zhao",
            from: "handan",
            to: "ying",
            archetype: "persuader",
          }),
          act({
            kind: "envoy",
            seat: "zhao",
            from: "handan",
            to: "daliang",
            archetype: "persuader",
          }),
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "audience",
            seat: "qin",
            at: "ying",
            archetype: "persuader",
          }),
        ],
        lines: [
          {
            speaker: "zhang-yi",
            text: {
              en: "A rope of six is six chances to be the one who is spared. Serve Qin and be eaten last.",
              zh: "从者六，人人自以为可后亡。事秦则后亡矣。",
            },
          },
        ],
      },
      {
        venue: "altar",
        dressing: "chu",
        focus: "ying",
        play: [act({ kind: "covenant", seat: "qin", at: "ying", count: 3 })],
      },
    ],
  },
  {
    id: "hangu-first",
    act: "kings",
    date: "318 BCE",
    year: -318,
    title: { en: "Five states at the Boxgate", zh: "五国攻秦" },
    blurb: {
      en: "The covenant was finally tried. Five states put armies in the field against Qin and came to the pass, where the road is one cart wide for thirty li and the wall is at the end of it. Only Han, Zhao and Wei actually fought. Qi held back and Chu never arrived. Qin came out, beat what was in front of it, and the vertical covenant was over as a military instrument, though it went on being sold for another sixty years.",
      zh: "五国伐秦，至函谷关。关道狭，车不方轨者三十里。韩赵魏与秦战，齐楚观望不至。秦出兵击之，五国之师皆引去。自是从约不复能用兵，而说者犹售其言六十年。",
    },
    sources: ["zhanguoce-zh", "shiji-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      wei: { state: "wei", home: "daliang" },
      han: { state: "han", home: "yiyang" },
      zhao: { state: "zhao", home: "handan" },
    },
    scenes: [
      {
        card: { en: "Five states at the Boxgate", zh: "五国攻秦" },
        date: "318 BCE",
        focus: "hangu",
        play: [
          act({
            kind: "column",
            seat: "wei",
            from: "daliang",
            to: "hangu",
            against: "qin",
            count: 6,
          }),
          act({
            kind: "column",
            seat: "han",
            from: "yiyang",
            to: "hangu",
            against: "qin",
            count: 6,
          }),
          act({
            kind: "column",
            seat: "zhao",
            from: "handan",
            to: "hangu",
            against: "qin",
            count: 6,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "qin",
        focus: "hangu",
        play: [act({ kind: "garrison", seat: "qin", at: "hangu", count: 8 })],
        lines: [
          {
            speaker: "qin",
            text: {
              en: "Thirty li of road one cart wide, and a wall at the end of it. Let them come up it.",
              zh: "关道三十里，车不方轨，末有墙焉。听其自来。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "hangu",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "hangu",
            against: "wei",
            count: 8,
          }),
        ],
      },
      {
        focus: "hangu",
        play: [
          act({ kind: "carts-back", seat: "wei", at: "hangu", count: 2 }),
          act({ kind: "carts-back", seat: "zhao", at: "hangu", count: 2 }),
        ],
      },
    ],
  },
  {
    id: "shu-taken",
    act: "kings",
    date: "316 BCE",
    year: -316,
    title: { en: "The stone oxen and the road", zh: "石牛开道" },
    blurb: {
      en: "Shu and Ba, behind the mountains in the west, had no road into Qin worth the name and were quarrelling with each other. The Qin court argued: Zhang Yi wanted to march east on the royal domain and be seen to be first; Sima Cuo wanted the west, because it was fat land, it was defenceless, and nobody in the east would call taking it an outrage. Qin took Shu, took Ba behind it, and doubled its grain. The seizure that looked like a distraction is the one that won the period.",
      zh: "蜀与巴相攻，各告急于秦。张仪欲伐韩以临二周，司马错欲伐蜀，曰：得其地足以广国，取其财足以富民，而天下不以为暴。惠王从错。秦灭蜀，因取巴，蜀既属秦，秦以益强富厚而轻诸侯。",
    },
    chapter: "borrowed-road",
    sources: ["zhanguoce-zh", "shiji-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      shu: { state: "shu", home: "chengdu" },
      ba: { state: "ba", home: "jiang" },
    },
    scenes: [
      {
        card: { en: "The stone oxen and the road", zh: "石牛开道" },
        date: "316 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["zhanguoce-zh"],
        play: [act({ kind: "debate", seat: "qin", at: "xianyang", count: 4 })],
        lines: [
          {
            speaker: "zhang-yi",
            text: {
              en: "March east and hold the tripods. Whoever holds them gives the orders.",
              zh: "临二周，据九鼎，挟天子以令天下。",
            },
          },
          {
            speaker: "qin",
            text: {
              en: "Take the west. It is fat, it is unguarded, and no one will call it an outrage.",
              zh: "取蜀：其地足广，其财足富，而天下不以为暴。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "qin",
        focus: "hanzhong",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "hanzhong",
            count: 6,
          }),
        ],
      },
      {
        focus: "chengdu",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "hanzhong",
            to: "chengdu",
            against: "shu",
            count: 8,
          }),
          act({ kind: "gates-taken", seat: "qin", at: "chengdu" }),
          act({ kind: "extinguish", seat: "shu" }),
        ],
      },
      {
        focus: "jiang",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "chengdu",
            to: "jiang",
            against: "ba",
            count: 6,
          }),
          act({ kind: "extinguish", seat: "ba" }),
          act({ kind: "decree", seat: "qin", at: "chengdu" }),
        ],
      },
    ],
    effects: [
      { state: "shu", status: "extinguished" },
      { state: "ba", status: "extinguished" },
      { place: "hanzhong", marker: "waystation" },
    ],
  },
  {
    id: "zi-zhi",
    act: "kings",
    date: "314 BCE",
    year: -314,
    title: { en: "The abdication at Yan", zh: "燕王哙让国" },
    blurb: {
      en: "King Kuai of Yan was told that the ancient sages had handed their thrones to worthy ministers rather than to their sons, and that a ruler who did so would be praised for a thousand years. He handed the state to his chancellor Zi Zhi. Three years of civil war followed. Qi marched in, took the capital in fifty days, killed both of them, and looted the ancestral vessels. Mencius, who had said the invasion was justified if the people of Yan wanted it, spent the rest of his life explaining that he had added a condition.",
      zh: "燕王哙好贤，慕尧舜之让，以国让相子之。三年，国大乱，百姓恫恐。齐宣王因而伐之，五旬而举燕，杀王哙与子之，毁其宗庙，迁其重器。孟子尝曰：燕可伐也，取之而燕民悦则取之。及齐取之而燕人叛，孟子终身辩其所设之条。",
    },
    sources: ["shiji-zh", "zhanguoce-zh", "mozi-zh"],
    seats: {
      yan: { state: "yan", home: "ji" },
      qi: { state: "qi", home: "linzi" },
    },
    scenes: [
      {
        card: { en: "The abdication at Yan", zh: "燕王哙让国" },
        date: "316 BCE",
        venue: "hall",
        dressing: "yan",
        focus: "ji",
        cite: ["zhanguoce-zh"],
        play: [
          act({ kind: "abdicate", seat: "yan", at: "ji" }),
          act({ kind: "usurp", seat: "yan", at: "ji" }),
        ],
        lines: [
          {
            speaker: "king-kuai",
            text: {
              en: "Yao gave the world to a worthy man and is praised for it still. Take it.",
              zh: "尧以天下让许由而名益尊。子其受之。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "yan",
        focus: "ji",
        play: [
          act({ kind: "petition", seat: "yan", at: "ji", count: 4 }),
          act({ kind: "battle", seat: "yan", at: "ji", count: 6 }),
        ],
      },
      {
        focus: "ji",
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "linzi",
            to: "ji",
            against: "yan",
            count: 8,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "qi",
        focus: "ji",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "gates-taken", seat: "qi", at: "ji" }),
          act({ kind: "sack", seat: "qi", at: "ji" }),
        ],
        lines: [
          {
            speaker: "mencius",
            text: {
              en: "I said Yan could be taken if the people of Yan were glad of it. They are not glad.",
              zh: "取之而燕民悦则取之。今燕民不悦，取之非也。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "ji", marker: "ruin" }],
  },
  {
    id: "six-hundred-li",
    act: "kings",
    date: "313 to 312 BCE",
    year: -312,
    title: { en: "Six hundred li that were six", zh: "商於六百里" },
    blurb: {
      en: "Zhang Yi offered King Huai of Chu six hundred li of Qin land at Shangyu to break with Qi. Chu broke with Qi loudly, insulting the Qi king to make the breach credible, and sent to collect. Zhang Yi said he had promised six li of his own fief and was sorry about the misunderstanding. Chu went to war alone, lost eighty thousand men and its commander at Danyang, invaded again in a rage, and lost again at Lantian, and Qin took Hanzhong, which is the corridor between the west and the middle plain.",
      zh: "张仪说楚怀王：绝齐则秦献商於之地六百里。楚绝齐甚欢，使者往受地。仪曰：仪与王约六里，不闻六百里。楚王怒，发兵攻秦，战于丹阳，秦斩甲士八万，虏屈匄，遂取汉中。楚复悉国兵袭秦，战于蓝田，又大败。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      chu: { state: "chu", home: "ying" },
      qin: { state: "qin", home: "xianyang" },
      qi: { state: "qi", home: "linzi" },
    },
    scenes: [
      {
        card: { en: "Six hundred li that were six", zh: "商於六百里" },
        date: "313 BCE",
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "audience",
            seat: "qin",
            at: "ying",
            archetype: "persuader",
          }),
        ],
        lines: [
          {
            speaker: "zhang-yi",
            text: {
              en: "Break with Qi and Qin gives you six hundred li at Shangyu. Say it where the Qi envoy can hear.",
              zh: "大王能绝齐，秦愿献商於之地六百里。愿闻之于齐使之前。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        play: [act({ kind: "refuse", seat: "chu", at: "ying" })],
        lines: [
          {
            speaker: "zhang-yi",
            text: {
              en: "Six li. Of my own fief. I have never had six hundred li to give anybody.",
              zh: "仪有奉邑六里，愿以献大王。六百里者，未之闻也。",
            },
          },
        ],
      },
      {
        focus: "danyang",
        play: [
          act({
            kind: "column",
            seat: "chu",
            from: "ying",
            to: "danyang",
            against: "qin",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "qin",
            at: "danyang",
            against: "chu",
            count: 8,
          }),
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "wuguan",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "wuguan",
            against: "chu",
            count: 8,
          }),
          act({ kind: "garrison", seat: "qin", at: "hanzhong", count: 4 }),
        ],
        lines: [
          {
            speaker: "king-huai",
            text: {
              en: "I would rather have had Zhang Yi than the land.",
              zh: "不愿得地，愿得张仪而甘心焉。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "danyang", marker: "field" }],
  },
  {
    id: "tripod-lifted",
    act: "kings",
    date: "307 BCE",
    year: -307,
    title: { en: "The king who lifted the tripod", zh: "举鼎绝膑" },
    blurb: {
      en: "The nine tripods at Luoyang were the empire's title deed: cast from the metal of the nine provinces, and to be handed on when heaven changed its mind. King Wu of Qin was a strong man who liked wrestling with his officers. He came to the royal city, went to look at the tripods, and tried to lift one. It came up and it came down, and it broke his shin, and he died that night, twenty-three years old, without an heir. The succession fight that followed put his half-brother on the throne for fifty-six years.",
      zh: "九鼎者，禹收九牧之金所铸，天命所在也。秦武王有力好戏，力士任鄙、乌获、孟说皆至大官。王与孟说举龙文赤鼎，绝膑，八月薨，年二十三，无子。诸弟争立，其异母弟稷立，是为昭襄王，在位五十六年。",
    },
    chapter: "royal-domain",
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      zhou: { state: "zhou", home: "zhou" },
    },
    scenes: [
      {
        card: { en: "The king who lifted the tripod", zh: "举鼎绝膑" },
        date: "307 BCE",
        focus: "zhou",
        play: [
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "zhou",
            count: 6,
          }),
        ],
        lines: [
          {
            speaker: "king-wu-qin",
            text: {
              en: "If I could ride once through the royal city and see the tripods, I could die content.",
              zh: "寡人欲容车通三川，窥周室，死不恨矣。",
            },
          },
        ],
      },
      {
        venue: "altar",
        dressing: "zhou",
        focus: "zhou",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "audience", seat: "qin", at: "zhou" }),
          act({ kind: "divine", seat: "zhou", at: "zhou" }),
        ],
        lines: [
          {
            speaker: "king-nan",
            text: {
              en: "They are heavy. They were meant to be heavy. That is the whole point of them.",
              zh: "鼎重，本以重为义。",
            },
          },
        ],
      },
      {
        venue: "altar",
        dressing: "qin",
        focus: "zhou",
        cite: ["zizhitongjian-zhouqin-zh"],
        play: [act({ kind: "funeral", seat: "qin", at: "zhou", count: 4 })],
        lines: [
          {
            speaker: "king-wu-qin",
            text: {
              en: "It came up. Write that down. It came up.",
              zh: "鼎举矣。书之：鼎举矣。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "enthrone", seat: "qin", at: "xianyang" }),
          act({ kind: "decree", seat: "qin", at: "xianyang" }),
        ],
      },
    ],
  },
  {
    id: "chuisha",
    act: "kings",
    date: "301 BCE",
    year: -301,
    title: { en: "Chu broken at Chuisha", zh: "垂沙之败" },
    blurb: {
      en: "Qi, Han and Wei came at Chu together and sat on the far bank of a river for six months because nobody wanted to cross first. A Qi officer found a ford by asking a woodcutter which stretch the Chu sentries were thickest at, on the reasoning that they would guard the shallow water. The allies crossed at night, broke the Chu army at Chuisha, and killed its commander. Chu never fielded a first-rank field army again.",
      zh: "齐、韩、魏共攻楚，夹沘水而军，六月不敢济。齐使问樵者，樵者曰：水浅处楚人守之厚，深处守之薄。乃夜济于楚兵之所薄者，大败楚师于垂沙，杀其将唐眜。自是楚不能复以大兵争天下。",
    },
    sources: ["zhanguoce-zh", "lvshichunqiu-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      chu: { state: "chu", home: "ying" },
      han: { state: "han", home: "yiyang" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "Chu broken at Chuisha", zh: "垂沙之败" },
        date: "301 BCE",
        focus: "chuisha",
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "linzi",
            to: "chuisha",
            against: "chu",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "han",
            from: "yiyang",
            to: "chuisha",
            count: 4,
          }),
          act({
            kind: "column",
            seat: "wei",
            from: "daliang",
            to: "chuisha",
            count: 4,
          }),
        ],
      },
      {
        venue: "river",
        dressing: "qi",
        focus: "chuisha",
        cite: ["lvshichunqiu-zh"],
        play: [act({ kind: "garrison", seat: "chu", at: "chuisha", count: 8 })],
        lines: [
          {
            speaker: "qi",
            text: {
              en: "Where are their sentries thickest? Then that is the shallow water, and we cross elsewhere.",
              zh: "楚人守厚处，水必浅；吾济其所薄者。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qi",
        focus: "chuisha",
        play: [
          act({
            kind: "battle",
            seat: "qi",
            at: "chuisha",
            against: "chu",
            count: 8,
            effect: "night",
          }),
          act({ kind: "duel", seat: "qi", at: "chuisha", against: "chu" }),
        ],
      },
    ],
    effects: [{ place: "chuisha", marker: "ford" }],
  },
  {
    id: "zhongshan-ends",
    act: "kings",
    date: "296 BCE",
    year: -296,
    title: { en: "Zhao finishes Zhongshan", zh: "赵灭中山" },
    blurb: {
      en: "Zhongshan was a small state of non-Chinese origin sitting inside Zhao like a stone in a shoe, cutting the road from Handan to the northern commanderies. King Wuling spent twelve years on it with the cavalry his clothing reform had bought him, and in 296 he moved its ruler to Fushi and took the ground. Zhao was now one piece from the capital to the steppe, and for about twenty years it was the only state that could meet Qin in the field.",
      zh: "中山，白狄之国，处赵腹中，绝邯郸与北边之道。赵武灵王以胡服骑射之众攻之十有二年，二十三年灭中山，迁其王于肤施。赵地自邯郸至云中、九原为一，其后二十年，唯赵能与秦争锋。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      zhao: { state: "zhao", home: "handan" },
      zhongshan: { state: "zhongshan", home: "zhongshan" },
    },
    scenes: [
      {
        card: { en: "Zhao finishes Zhongshan", zh: "赵灭中山" },
        date: "305 BCE",
        focus: "zhongshan",
        play: [
          act({
            kind: "column",
            seat: "zhao",
            from: "handan",
            to: "zhongshan",
            against: "zhongshan",
            count: 8,
            archetype: "horse-archer",
          }),
          act({
            kind: "siege",
            seat: "zhao",
            at: "zhongshan",
            against: "zhongshan",
            count: 8,
          }),
        ],
      },
      {
        venue: "gates",
        dressing: "zhao",
        focus: "zhongshan",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "surrender", seat: "zhongshan", at: "zhongshan" }),
          act({ kind: "extinguish", seat: "zhongshan" }),
        ],
      },
      {
        focus: "dai",
        play: [act({ kind: "garrison", seat: "zhao", at: "dai", count: 4 })],
        lines: [
          {
            speaker: "king-wuling",
            text: {
              en: "From here to the steppe is now one road and it is ours the whole way.",
              zh: "自邯郸至云中，道属于我矣。",
            },
          },
        ],
      },
    ],
    effects: [{ state: "zhongshan", status: "extinguished" }],
  },
  {
    id: "king-detained",
    act: "kings",
    date: "299 to 296 BCE",
    year: -296,
    title: { en: "The king who went to the pass", zh: "怀王入秦" },
    blurb: {
      en: "Qin invited King Huai of Chu to a friendly meeting at Wu Pass. His youngest son said go, because refusing would offend Qin. Qu Yuan said that Qin was a state of tigers and wolves and that a king who walked into one did not walk out. He went. Qin closed the pass behind him, carried him to its capital, and demanded territory for his return. Chu enthroned his other son instead and refused to pay. He tried to escape by way of Zhao, which would not open its gate to him, and he died in Qin three years later.",
      zh: "秦昭王约楚怀王会武关。屈原曰：秦，虎狼之国，不可信，不如无行。子兰劝王行。王入武关，秦伏兵绝其后，因留之，要以割地。楚立太子横为王以拒秦。怀王亡走赵，赵不内；复之秦，竟死于秦，归葬，楚人皆怜之。",
    },
    chapter: "hostage-prince",
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      chu: { state: "chu", home: "ying" },
      qin: { state: "qin", home: "xianyang" },
      zhao: { state: "zhao", home: "handan" },
    },
    scenes: [
      {
        card: { en: "The king who went to the pass", zh: "怀王入秦" },
        date: "299 BCE",
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "envoy", seat: "qin", from: "xianyang", to: "ying" }),
        ],
        lines: [
          {
            speaker: "king-huai",
            text: {
              en: "If I do not go it is an insult. If I go it is a risk. An insult is certain.",
              zh: "不行则绝秦欢，行则或有患。绝欢者必至，患者未必。",
            },
          },
        ],
      },
      {
        venue: "gates",
        dressing: "qin",
        focus: "wuguan",
        play: [
          act({ kind: "audience", seat: "qin", at: "wuguan" }),
          act({ kind: "hostage", seat: "chu", from: "wuguan", to: "xianyang" }),
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        play: [
          act({ kind: "refuse", seat: "chu", at: "ying" }),
          act({ kind: "enthrone", seat: "chu", at: "ying" }),
        ],
        lines: [
          {
            speaker: "chu",
            text: {
              en: "We have a king already. Keep the other one.",
              zh: "国有王矣，秦其自留之。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "chu",
        focus: "handan",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "flee",
            seat: "chu",
            from: "xianyang",
            to: "handan",
            count: 2,
            effect: "night",
          }),
          act({ kind: "refuse", seat: "zhao", at: "handan" }),
        ],
      },
      {
        venue: "hall",
        dressing: "chu",
        focus: "ying",
        play: [act({ kind: "funeral", seat: "chu", at: "ying", count: 4 })],
      },
    ],
  },
  {
    id: "yique",
    act: "kings",
    date: "293 BCE",
    year: -293,
    title: { en: "Two armies at Yique", zh: "伊阙之战" },
    blurb: {
      en: "Han and Wei brought a joint army to the gorge at Yique and neither commander would take the front, each preferring the other to be worn down first. Bai Qi, a new man with no pedigree, put a screening force in front of the Han camp, took his weight round onto the Wei flank, broke it, and then rolled up the Han army from the side while it was still watching the screen. Two hundred and forty thousand dead is the figure the histories give. It is the first of his numbers.",
      zh: "韩魏共距秦于伊阙，二军相恃，皆莫肯先。白起以疑兵当韩阵，而潜以精锐袭魏军之侧，魏师大败，因转击韩军，遂大破之，斩首二十四万，虏公孙喜，拔五城。起由是显。",
    },
    sources: ["shiji-zh", "zizhitongjian-zhouqin-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      han: { state: "han", home: "yiyang" },
      wei: { state: "wei", home: "daliang" },
    },
    scenes: [
      {
        card: { en: "Two armies at Yique", zh: "伊阙之战" },
        date: "293 BCE",
        focus: "yique",
        play: [
          act({
            kind: "column",
            seat: "han",
            from: "yiyang",
            to: "yique",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "wei",
            from: "daliang",
            to: "yique",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "yique",
            against: "han",
            count: 8,
          }),
        ],
      },
      {
        venue: "camp",
        dressing: "qin",
        focus: "yique",
        cite: ["shiji-zh"],
        play: [act({ kind: "garrison", seat: "qin", at: "yique", count: 4 })],
        lines: [
          {
            speaker: "bai-qi",
            text: {
              en: "Neither of them wants to be the front rank. Show them a front rank and go round the other one.",
              zh: "二军皆不肯先，故设疑兵以当其一，而袭其一之侧。",
            },
          },
        ],
      },
      {
        venue: "field",
        dressing: "qin",
        focus: "yique",
        play: [
          act({
            kind: "battle",
            seat: "qin",
            at: "yique",
            against: "wei",
            count: 8,
          }),
          act({
            kind: "battle",
            seat: "qin",
            at: "yique",
            against: "han",
            count: 8,
          }),
        ],
      },
      {
        focus: "yique",
        play: [act({ kind: "bury", seat: "qin", at: "yique", count: 6 })],
      },
    ],
    effects: [{ place: "yique", marker: "tomb" }],
  },
  {
    id: "two-emperors",
    act: "kings",
    date: "288 BCE",
    year: -288,
    title: { en: "Two emperors for two months", zh: "东西二帝" },
    blurb: {
      en: "Qin proposed that there should now be two emperors, a western one at Xianyang and an eastern one at Linzi, on the reasoning that king had become a common title and something above it was required. Qi took the title. Su Dai told the Qi king that the honour was a trap: wear it and every other state hates you, drop it and every other state is grateful. Qi dropped it after two months. Qin dropped it too, having learned exactly how isolated Qi was willing to be.",
      zh: "秦昭王约齐湣王并称帝：秦为西帝，齐为东帝。苏代说齐王曰：秦称帝而天下安之，王称帝而天下恶之。不如释帝以收天下之望。齐王称帝二月而复归王号，秦亦去帝号。秦由是知齐之孤。",
    },
    sources: ["zhanguoce-zh", "shiji-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      qi: { state: "qi", home: "linzi" },
    },
    scenes: [
      {
        card: { en: "Two emperors for two months", zh: "东西二帝" },
        date: "288 BCE",
        venue: "hall",
        dressing: "qi",
        focus: "linzi",
        play: [
          act({ kind: "envoy", seat: "qin", from: "xianyang", to: "linzi" }),
          act({ kind: "enthrone", seat: "qi", at: "linzi" }),
        ],
        lines: [
          {
            speaker: "king-min",
            text: {
              en: "King is a common word now. Seven men are called it. There should be something above it.",
              zh: "王号贱矣，七国皆王。宜有加于王者。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qi",
        focus: "linzi",
        cite: ["zhanguoce-zh"],
        play: [
          act({
            kind: "audience",
            seat: "qi",
            at: "linzi",
            archetype: "persuader",
          }),
        ],
        lines: [
          {
            speaker: "lu-zhonglian",
            text: {
              en: "Wear it and the world hates you. Take it off and the world thanks you. It is a cheap gift.",
              zh: "王称帝而天下恶之，释帝而天下德之。释之为利。",
            },
          },
        ],
      },
      {
        venue: "altar",
        dressing: "qi",
        focus: "linzi",
        play: [act({ kind: "abdicate", seat: "qi", at: "linzi" })],
      },
    ],
  },
  {
    id: "song-swallowed",
    act: "kings",
    date: "286 BCE",
    year: -286,
    title: { en: "Qi takes Song", zh: "齐灭宋" },
    blurb: {
      en: "Song sat on the richest commercial ground in the middle plain, the salt and the markets and the road junctions, and every large state wanted it and expected a share. Qi took the whole thing alone. It was the single most profitable conquest of the century and it made Qi the enemy of everybody at once, including the states that had encouraged the attack. Two years later the bill arrived.",
      zh: "宋居天下之膏腴，盐、市、孔道皆在焉，大国皆欲有之而各期其分。齐独灭宋而尽有其地，利之厚者莫过于此，而天下皆仇之，虽尝劝其伐者亦然。后二年，五国之兵至。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qi: { state: "qi", home: "linzi" },
      song: { state: "song", home: "song" },
    },
    scenes: [
      {
        card: { en: "Qi takes Song", zh: "齐灭宋" },
        date: "286 BCE",
        focus: "song",
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "linzi",
            to: "song",
            against: "song",
            count: 8,
          }),
          act({ kind: "gates-taken", seat: "qi", at: "song" }),
        ],
      },
      {
        venue: "square",
        dressing: "qi",
        focus: "song",
        cite: ["zhanguoce-zh"],
        play: [
          act({ kind: "market-open", seat: "qi", at: "song" }),
          act({ kind: "toll", seat: "qi", at: "song" }),
          act({ kind: "extinguish", seat: "song" }),
        ],
        lines: [
          {
            speaker: "king-min",
            text: {
              en: "They all wanted a share of it. Nobody has to be given a share of what one state takes alone.",
              zh: "诸侯皆欲分之。独取之者，无所分也。",
            },
          },
        ],
      },
    ],
    effects: [{ state: "song", status: "extinguished" }],
  },
  {
    id: "five-states-on-qi",
    act: "kings",
    date: "284 BCE",
    year: -284,
    title: { en: "Seventy cities in six months", zh: "乐毅破齐" },
    blurb: {
      en: "Yan had waited thirty years for this. Yue Yi took a five-state army into Qi, broke the Qi field army at the Ji river, and then let the allies go home while Yan alone spent six months taking seventy cities and carrying the treasure of Linzi back to Ji. King Min ran to Ju and was murdered by the general who was supposed to be rescuing him. Two cities did not fall: Ju and Jimo.",
      zh: "燕昭王积三十年而后发。乐毅将五国之兵伐齐，破之济西。诸侯罢兵，燕师独追，六月而下齐七十余城，尽取其宝器输之燕。湣王走莒，为楚将淖齿所杀。齐城不下者二：莒与即墨。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      yan: { state: "yan", home: "ji" },
      qi: { state: "qi", home: "linzi" },
      zhao: { state: "zhao", home: "handan" },
      qin: { state: "qin", home: "xianyang" },
    },
    scenes: [
      {
        card: { en: "Seventy cities in six months", zh: "乐毅破齐" },
        date: "284 BCE",
        focus: "linzi",
        play: [
          act({
            kind: "column",
            seat: "yan",
            from: "ji",
            to: "linzi",
            against: "qi",
            count: 8,
          }),
          act({
            kind: "column",
            seat: "zhao",
            from: "handan",
            to: "linzi",
            count: 4,
          }),
          act({
            kind: "column",
            seat: "qin",
            from: "xianyang",
            to: "linzi",
            count: 4,
          }),
        ],
      },
      {
        venue: "field",
        dressing: "yan",
        focus: "linzi",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "battle",
            seat: "yan",
            at: "linzi",
            against: "qi",
            count: 8,
          }),
        ],
        lines: [
          {
            speaker: "yue-yi",
            text: {
              en: "Send the allies home. What is left is a march, and a march does not need to be shared.",
              zh: "遣诸侯之兵还，燕独追之。追者行也，行不待分。",
            },
          },
        ],
      },
      {
        venue: "square",
        dressing: "yan",
        focus: "linzi",
        play: [
          act({ kind: "sack", seat: "yan", at: "linzi" }),
          act({
            kind: "tripods",
            seat: "yan",
            from: "linzi",
            to: "ji",
            count: 3,
          }),
        ],
      },
      {
        venue: "road",
        dressing: "qi",
        focus: "ju",
        play: [
          act({ kind: "flee", seat: "qi", from: "linzi", to: "ju", count: 2 }),
          act({ kind: "assassinate", seat: "qi", at: "ju" }),
        ],
      },
      {
        focus: "jimo",
        play: [
          act({
            kind: "siege",
            seat: "yan",
            at: "ju",
            against: "qi",
            count: 6,
          }),
          act({
            kind: "siege",
            seat: "yan",
            at: "jimo",
            against: "qi",
            count: 6,
          }),
        ],
      },
    ],
    effects: [{ place: "linzi", marker: "ruin" }],
  },
  {
    id: "fire-oxen",
    act: "kings",
    date: "279 BCE",
    year: -279,
    title: { en: "The oxen with blades", zh: "火牛阵" },
    blurb: {
      en: "Tian Dan held Jimo for five years. When the old Yan king died he had it put about that Yue Yi was planning to make himself king of Qi, and the new Yan king recalled him. Then Tian Dan collected a thousand oxen, dressed them in red silk painted with dragons, tied blades to their horns and reeds soaked in fat to their tails, opened holes in the wall at night and lit the reeds. Five thousand men came out behind the oxen. The Yan camp broke, and Qi took back seventy cities in a season.",
      zh: "田单守即墨五年。燕昭王卒，单纵反间曰乐毅欲王齐，惠王果使骑劫代之。单收城中牛千余，被以绛缯，画五采龙文，束兵刃于其角，灌脂束苇于尾，凿城数十穴，夜纵牛，壮士五千随其后。牛尾热，怒而奔燕军，燕军大骇，遂复齐七十余城。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qi: { state: "qi", home: "jimo" },
      yan: { state: "yan", home: "ji" },
    },
    scenes: [
      {
        card: { en: "The oxen with blades", zh: "火牛阵" },
        date: "279 BCE",
        venue: "gates",
        dressing: "qi",
        focus: "jimo",
        cite: ["shiji-zh"],
        play: [act({ kind: "envoy", seat: "qi", from: "jimo", to: "ji" })],
        lines: [
          {
            speaker: "tian-dan",
            text: {
              en: "Their general is too good. Tell their king he means to be king of Qi himself.",
              zh: "乐毅善用兵，燕之患也。乃言其欲南面王齐。",
            },
          },
        ],
      },
      {
        venue: "works",
        dressing: "qi",
        focus: "jimo",
        play: [
          act({ kind: "works-cut", seat: "qi", at: "jimo", effect: "night" }),
        ],
      },
      {
        venue: "field",
        dressing: "qi",
        focus: "jimo",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "oxen",
            seat: "qi",
            from: "jimo",
            to: "linzi",
            count: 6,
          }),
          act({
            kind: "battle",
            seat: "qi",
            at: "jimo",
            against: "yan",
            count: 8,
          }),
        ],
      },
      {
        focus: "linzi",
        play: [
          act({
            kind: "column",
            seat: "qi",
            from: "jimo",
            to: "linzi",
            against: "yan",
            count: 8,
          }),
          act({ kind: "enthrone", seat: "qi", at: "linzi" }),
        ],
      },
    ],
    effects: [{ place: "jimo", marker: "wall" }],
  },
  {
    id: "jade-intact",
    act: "kings",
    date: "279 BCE",
    year: -279,
    title: { en: "The jade returned whole", zh: "完璧归赵" },
    blurb: {
      en: "Qin offered fifteen cities for the He family jade, which everybody understood to mean that Qin would take the jade. Lin Xiangru carried it west, watched the Qin king pass it round the women of the harem without mentioning the cities, said there was a flaw he ought to point out, took it back into his hands, and stood against a pillar offering to break his head and the jade together. The jade went home whole. At Mianchi two years later he did the same job with a wine jar and a zither.",
      zh: "秦昭王愿以十五城易赵和氏璧。蔺相如奉璧西入，秦王传以示美人左右，无意偿城。相如曰璧有瑕，请指示王，得璧，却立倚柱，怒发上冲冠，请以头与璧俱碎于柱。秦王辞谢，相如使从者怀璧间行归赵。其后会于渑池，相如又以命迫秦王击缶，赵终不辱。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      zhao: { state: "zhao", home: "handan" },
      qin: { state: "qin", home: "xianyang" },
    },
    scenes: [
      {
        card: { en: "The jade returned whole", zh: "完璧归赵" },
        date: "283 BCE",
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        cite: ["shiji-zh"],
        play: [
          act({
            kind: "audience",
            seat: "zhao",
            at: "xianyang",
            archetype: "minister",
          }),
        ],
        lines: [
          {
            speaker: "lin-xiangru",
            text: {
              en: "There is a flaw in it. Let me show the king where.",
              zh: "璧有瑕，请指示王。",
            },
          },
        ],
      },
      {
        venue: "hall",
        dressing: "qin",
        focus: "xianyang",
        play: [
          act({ kind: "refuse", seat: "zhao", at: "xianyang", effect: "jade" }),
        ],
        lines: [
          {
            speaker: "lin-xiangru",
            text: {
              en: "The cities were not mentioned. My head and this stone will go into that pillar together.",
              zh: "大王无意偿赵城，臣头今与璧俱碎于柱矣。",
            },
          },
        ],
      },
      {
        venue: "road",
        dressing: "zhao",
        focus: "handan",
        play: [
          act({
            kind: "jade-return",
            seat: "zhao",
            from: "xianyang",
            to: "handan",
          }),
        ],
      },
      {
        venue: "altar",
        dressing: "qin",
        focus: "mianchi",
        cite: ["shiji-zh"],
        play: [act({ kind: "covenant", seat: "qin", at: "mianchi", count: 3 })],
        lines: [
          {
            speaker: "lin-xiangru",
            text: {
              en: "My king has played. Now the king of Qin will strike the jar, or I am close enough to bleed on him.",
              zh: "赵王已鼓瑟。请奉盆缶秦王，以相娱乐。五步之内，相如请得以颈血溅大王矣。",
            },
          },
        ],
      },
    ],
    effects: [{ place: "mianchi", marker: "altar" }],
  },
  {
    id: "ying-burned",
    act: "kings",
    date: "278 BCE",
    year: -278,
    title: { en: "The tombs at Yiling", zh: "白起拔郢" },
    blurb: {
      en: "Bai Qi came down the Han valley with a small force and burned his boats behind him, which is a way of telling an army that there is no rear. He took the Chu capital, and then he opened and fired the royal tombs at Yiling, which is not a military act. Chu moved its court east to Chen and never came back. Qu Yuan, who had told the old king not to go to the pass, walked into the Miluo with a stone.",
      zh: "白起沿汉水而下，焚舟以示无还心，遂拔郢，烧夷陵先王之墓。楚东徙都于陈，终不能复。屈原闻郢破，怀石自沉汨罗。",
    },
    sources: ["shiji-zh", "zhanguoce-zh"],
    seats: {
      qin: { state: "qin", home: "xianyang" },
      chu: { state: "chu", home: "ying" },
    },
    scenes: [
      {
        card: { en: "The tombs at Yiling", zh: "白起拔郢" },
        date: "279 BCE",
        venue: "river",
        dressing: "qin",
        focus: "ying",
        play: [
          act({
            kind: "fleet",
            seat: "qin",
            from: "hanzhong",
            to: "ying",
            count: 3,
          }),
        ],
        lines: [
          {
            speaker: "bai-qi",
            text: {
              en: "Burn the boats. An army that cannot go back does not have to be watched.",
              zh: "焚舟破釜，示士卒必死无还心。",
            },
          },
        ],
      },
      {
        venue: "gates",
        dressing: "qin",
        focus: "ying",
        cite: ["shiji-zh"],
        play: [
          act({ kind: "gates-taken", seat: "qin", at: "ying" }),
          act({ kind: "sack", seat: "qin", at: "ying" }),
        ],
      },
      {
        focus: "yiling",
        play: [act({ kind: "tomb-burn", seat: "qin", at: "yiling" })],
      },
      {
        focus: "chen",
        play: [
          act({
            kind: "flee",
            seat: "chu",
            from: "ying",
            to: "chen",
            count: 2,
          }),
          act({ kind: "enthrone", seat: "chu", at: "chen" }),
        ],
      },
    ],
    effects: [
      { place: "yiling", marker: "ruin" },
      { place: "chen", marker: "court" },
    ],
  },
];
