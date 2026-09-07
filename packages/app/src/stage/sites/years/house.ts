/**
 * The house's year: the *Yueling* read as a lord's household keeps it (the
 * silkworms, the summer linen, the winter furs, the year's-end offerings), with
 * the *Neize*'s daily order (`liji-zh` 770), the *Seventh Month*'s hunt and
 * the *Cricket* (`shijing-zh` 3830, 5160), and the *Yili*'s district drinking
 * (`yili-zh` 475). Every `who` is one of the house's folk, every place one of
 * `HOUSE_NAMES`; `almanac.spec.ts` holds both.
 */
import type { Cite, SiteYear } from "../../almanac";

const LIJI = (line: number, note: string): Cite => ({
  id: "liji-zh",
  line,
  note,
});

export const HOUSE_YEAR: SiteYear = {
  1: {
    note: {
      en: "The year opens at the tablets. The master keeps the first audience of the year in the hall, the steward reads the household's stores, and the lady has the winter quilts aired; the cook's fire is the warmest room in the compound.",
      zh: "岁首荐于神主。主人于堂受岁朝，宰读廪籍，夫人曝冬衾；庖火为一第之暖。",
    },
    tasks: [
      {
        who: "steward",
        kind: "stroll",
        from: "desk",
        to: "granary",
        weight: 2,
        line: {
          en: "The steward walks to the granary to count what the winter has left.",
          zh: "宰至廪，计冬余。",
        },
      },
      {
        who: "retainer",
        kind: "gather",
        at: "hall",
        count: 3,
        weight: 2,
        line: {
          en: "The retainers wait on the master's first audience of the year.",
          zh: "客待岁朝于堂。",
        },
      },
      {
        who: "maid",
        kind: "stroll",
        from: "loom",
        to: "court",
        line: {
          en: "The maid carries the quilts out to air in the court.",
          zh: "婢曝衾于庭。",
        },
      },
      {
        who: "cook",
        kind: "labour",
        at: "hearth",
        weight: 2,
        line: {
          en: "The cook keeps the fire high in the cold.",
          zh: "庖人寒中炽火。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "east-rooms",
        to: "pond",
        line: {
          en: "The child goes to see the fish under the ice of the pond.",
          zh: "童子往池观冰下之鱼。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The year's first offering", zh: "岁首之祭" },
        who: "master",
        at: "tablets",
        count: 2,
        line: {
          en: "The master and the lady lay the first offering of the year before the ancestral tablets.",
          zh: "主人与夫人荐岁首之祭于神主。",
        },
        cite: LIJI(1580, "月令 孟春: 天子乃以元日祈穀于上帝"),
      },
    ],
  },
  2: {
    note: {
      en: "The swallows return. The chariot is greased in the shed and the horses put to grass; the scholar begins the boy's lessons in the pavilion, and the lady's rooms are opened to the spring air.",
      zh: "玄鸟至。车库脂车，马就草；先生于榭始教童子，东房启户纳春气。",
    },
    tasks: [
      {
        who: "groom",
        kind: "labour",
        at: "shed",
        weight: 2,
        line: {
          en: "The groom greases the chariot's axles for the spring.",
          zh: "圉人脂车轴以待春。",
        },
      },
      {
        who: "groom",
        kind: "stroll",
        from: "manger",
        to: "garden",
        line: {
          en: "The groom leads the horses to the new grass by the garden.",
          zh: "圉人牵马就圃畔新草。",
        },
      },
      {
        who: "scholar",
        kind: "gather",
        at: "pavilion",
        count: 2,
        weight: 2,
        line: {
          en: "The scholar hears the boy recite in the pavilion.",
          zh: "先生于榭听童子诵。",
        },
      },
      {
        who: "maid",
        kind: "labour",
        at: "east-rooms",
        line: {
          en: "The maid opens the shutters of the women's rooms.",
          zh: "婢启东房之牖。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "bins",
        to: "gate",
        line: {
          en: "The porter carries the winter's ash out to the street.",
          zh: "仆负冬灰出门。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The prayer at the swallows' coming", zh: "祠高禖" },
        who: "lady",
        at: "tablets",
        count: 2,
        line: {
          en: "On the day the swallows come, the lady prays for children before the tablets.",
          zh: "玄鸟至之日，夫人于神主前祈嗣。",
        },
        cite: LIJI(1591, "月令 仲春: 玄鳥至，以大牢祠于高禖"),
      },
    ],
  },
  3: {
    note: {
      en: "The lady's silkworms. She fasts and picks the first mulberry leaves herself, the maid feeds the trays in the women's rooms, and the whole household goes down to the water on the third of the month to wash the winter off.",
      zh: "夫人亲蚕。斋戒，躬采桑首叶，婢于东房饲箔；上巳，阖家临水祓禊。",
    },
    tasks: [
      {
        who: "lady",
        kind: "stroll",
        from: "bed",
        to: "garden",
        weight: 3,
        line: {
          en: "The lady goes to the garden to pick the first mulberry leaves with her own hands.",
          zh: "夫人至圃，躬采桑首叶。",
        },
      },
      {
        who: "maid",
        kind: "labour",
        at: "east-rooms",
        weight: 2,
        line: {
          en: "The maid feeds the silkworm trays in the women's rooms.",
          zh: "婢于东房饲蚕箔。",
        },
      },
      {
        who: "steward",
        kind: "labour",
        at: "desk",
        line: {
          en: "The steward tallies the trays and the baskets.",
          zh: "宰计曲植籧筐。",
        },
      },
      {
        who: "cook",
        kind: "stroll",
        from: "hearth",
        to: "well",
        line: {
          en: "The cook draws water to steam the spring cakes.",
          zh: "庖人汲水蒸春饼。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "east-rooms",
        to: "garden",
        line: {
          en: "The child follows the lady to the mulberry with a basket.",
          zh: "童子携筐随夫人至桑。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The washing at the water", zh: "祓禊" },
        who: "lady",
        at: "pond",
        count: 4,
        line: {
          en: "On the first si day the household goes down to the pond with orchids to wash the winter's ill away.",
          zh: "上巳，阖家执兰临池，祓除不祥。",
        },
        cite: {
          id: "season-shangsi-zh",
          note: "上巳: the third-month lustration at the water",
        },
      },
    ],
  },
  4: {
    note: {
      en: "The cocoons are reeled and the silk weighed; the master puts on fine linen and the winter hangings come down. The physician gathers the summer's herbs in the garden, and the hall is swept for the guests of the first hot days.",
      zh: "缫茧称丝；主人始絺，撤冬帷。医于圃聚百药，扫堂以待初暑之宾。",
    },
    tasks: [
      {
        who: "maid",
        kind: "labour",
        at: "loom",
        weight: 3,
        line: {
          en: "The maid reels the cocoons at the loom.",
          zh: "婢于机缫茧。",
        },
      },
      {
        who: "steward",
        kind: "gather",
        at: "east-rooms",
        count: 2,
        line: {
          en: "The steward weighs the new silk with the lady.",
          zh: "宰与夫人称丝效功。",
        },
      },
      {
        who: "physician",
        kind: "labour",
        at: "garden",
        weight: 2,
        line: {
          en: "The physician gathers the summer's herbs in the garden.",
          zh: "医于圃聚百药。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "chamber",
        to: "chest",
        line: {
          en: "The porter folds the winter hangings into the chest.",
          zh: "仆敛冬帷入箱。",
        },
      },
      {
        who: "master",
        kind: "stroll",
        from: "dais",
        to: "pavilion",
        line: {
          en: "The master, in fine linen now, sits in the pavilion's air.",
          zh: "主人始絺，坐榭纳凉。",
        },
      },
    ],
  },
  5: {
    note: {
      en: "The longest day. The household keeps still and quiet, the hall is opened on every side for the air, and the musician plays in the evening; the lotus opens on the pond, and no dye is boiled nor cloth bleached in the sun.",
      zh: "日长至。阖家静处，四面启堂纳风，乐师夕奏；池荷开，毋艾蓝以染，毋暴布。",
    },
    tasks: [
      {
        who: "musician",
        kind: "labour",
        at: "hall",
        weight: 3,
        line: {
          en: "The musician plays the se in the open hall in the evening cool.",
          zh: "乐师夕于堂鼓瑟纳凉。",
        },
      },
      {
        who: "master",
        kind: "stroll",
        from: "dais",
        to: "pavilion",
        weight: 2,
        line: {
          en: "The master moves to the pavilion over the water for the day.",
          zh: "主人移居临水之榭。",
        },
      },
      {
        who: "lady",
        kind: "stroll",
        from: "bed",
        to: "pond",
        line: {
          en: "The lady walks out to see the lotus opened on the pond.",
          zh: "夫人出观池荷。",
        },
      },
      {
        who: "cook",
        kind: "stroll",
        from: "hearth",
        to: "well",
        line: {
          en: "The cook draws cold water from the well for the noon meal.",
          zh: "庖人汲井寒泉供午。",
        },
      },
      {
        who: "guard",
        kind: "labour",
        at: "gate",
        line: {
          en: "The guard sits in the gatehouse's shade.",
          zh: "卫士坐门荫。",
        },
      },
    ],
  },
  6: {
    note: {
      en: "The great rains. The court drains, the groom keeps the horses in, and the retainers are fed at the west table through the wet days; the lady's women dye the summer's silk now the ordinance allows it, and the bells are covered against the damp.",
      zh: "大雨时行。庭水泄，圉人闭马，客于客案饱食以度雨日；东房染夏丝，钟覆以御湿。",
    },
    tasks: [
      {
        who: "maid",
        kind: "labour",
        at: "east-rooms",
        weight: 3,
        line: {
          en: "The women dye the new silk in the women's rooms.",
          zh: "妇人于东房染丝。",
        },
      },
      {
        who: "groom",
        kind: "labour",
        at: "manger",
        weight: 2,
        line: {
          en: "The groom keeps the horses dry at the manger.",
          zh: "圉人于槽养马避雨。",
        },
      },
      {
        who: "retainer",
        kind: "gather",
        at: "west-table",
        count: 3,
        line: {
          en: "The retainers eat at the west table while the rain falls.",
          zh: "客于客案食，雨方降。",
        },
      },
      {
        who: "carrier",
        kind: "labour",
        at: "court",
        line: { en: "The porter clears the court's drain.", zh: "仆疏庭沟。" },
      },
      {
        who: "steward",
        kind: "stroll",
        from: "desk",
        to: "granary",
        line: {
          en: "The steward checks the granary for damp.",
          zh: "宰视廪之湿。",
        },
      },
    ],
  },
  7: {
    note: {
      en: "The cool wind. The first millet is offered at the tablets before the family eats of it; the guard oils the weapons on the rack, the steward opens the autumn accounts, and the master receives the county's officers in the hall.",
      zh: "凉风至。荐新粟于神主，然后食；卫士膏兵于架，宰启秋计，主人于堂受县吏。",
    },
    tasks: [
      {
        who: "guard",
        kind: "labour",
        at: "armrack",
        weight: 2,
        line: {
          en: "The guard oils the spears on the rack.",
          zh: "卫士膏戈于兵架。",
        },
      },
      {
        who: "steward",
        kind: "labour",
        at: "desk",
        weight: 2,
        line: {
          en: "The steward opens the autumn accounts at the desk.",
          zh: "宰于案启秋计。",
        },
      },
      {
        who: "retainer",
        kind: "gather",
        at: "hall",
        count: 3,
        line: {
          en: "The master receives the county's officers in the hall.",
          zh: "主人于堂受县吏。",
        },
      },
      {
        who: "cook",
        kind: "stroll",
        from: "hearth",
        to: "granary",
        line: {
          en: "The cook fetches the first of the new millet.",
          zh: "庖人取新粟。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "east-rooms",
        to: "court",
        line: {
          en: "The child plays liubo in the court's shade.",
          zh: "童子于庭荫博戏。",
        },
      },
    ],
    rites: [
      {
        title: { en: "Tasting the new grain", zh: "尝新" },
        who: "master",
        at: "tablets",
        count: 2,
        line: {
          en: "The master offers the first millet at the tablets before the family eats of it.",
          zh: "主人以新粟荐于神主，然后食。",
        },
        cite: LIJI(1651, "月令 孟秋: 天子嘗新，先薦寢廟"),
      },
    ],
  },
  8: {
    note: {
      en: "The geese pass. The master hosts the district's drinking in the hall, seated by age, with the musician playing between the courses; the old are given staves and gruel, and the lady has the autumn clothes brought from the chest.",
      zh: "鸿雁来。主人于堂行乡饮酒礼，以齿为序，乐师间歌；养衰老，授几杖，行糜粥；夫人出秋衣于箱。",
    },
    tasks: [
      {
        who: "musician",
        kind: "labour",
        at: "hall",
        weight: 2,
        line: {
          en: "The musician rehearses the songs for the drinking rite.",
          zh: "乐师习乡饮酒之歌。",
        },
      },
      {
        who: "cook",
        kind: "labour",
        at: "hearth",
        weight: 2,
        line: {
          en: "The cook boils gruel for the old of the ward.",
          zh: "庖人为老者煮糜粥。",
        },
      },
      {
        who: "maid",
        kind: "stroll",
        from: "chest",
        to: "chamber",
        line: {
          en: "The maid brings the autumn clothes from the chest.",
          zh: "婢自箱出秋衣。",
        },
      },
      {
        who: "scholar",
        kind: "stroll",
        from: "pavilion",
        to: "hall",
        line: {
          en: "The scholar rehearses the order of the seats for the rite.",
          zh: "先生习乡饮酒之位。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "bins",
        to: "gate",
        line: {
          en: "The porter carries a staff to the oldest house on the street.",
          zh: "仆送杖于街中老者之家。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The district drinking", zh: "乡饮酒" },
        who: "master",
        at: "hall",
        count: 5,
        line: {
          en: "The master hosts the district's elders in the hall, seated by age, with three rounds of song and wine.",
          zh: "主人于堂宾乡之老者，以齿为序，三歌三酬。",
        },
        cite: { id: "yili-zh", line: 475, note: "儀禮 鄉飲酒禮" },
      },
    ],
  },
  9: {
    note: {
      en: "The leaves fall and the crickets are in the hall. The master rides out to the hunt with the chariot, the retainers behind him; the physician lays up the winter's medicines, and the doors of the chamber are papered against the cold.",
      zh: "草木黄落，蟋蟀在堂。主人驾车出猎，客从；医藏冬药，寝户塞向。",
    },
    tasks: [
      {
        who: "groom",
        kind: "stroll",
        from: "manger",
        to: "shed",
        weight: 2,
        line: {
          en: "The groom harnesses the chariot for the hunt.",
          zh: "圉人驾车以猎。",
        },
      },
      {
        who: "master",
        kind: "stroll",
        from: "dais",
        to: "gate",
        weight: 2,
        line: {
          en: "The master rides out to the hunt through the gate.",
          zh: "主人出门田猎。",
        },
      },
      {
        who: "retainer",
        kind: "stroll",
        from: "west-table",
        to: "gate",
        count: 2,
        line: {
          en: "The retainers follow the master out to the hunt.",
          zh: "客从主人出猎。",
        },
      },
      {
        who: "physician",
        kind: "labour",
        at: "wing-east",
        line: {
          en: "The physician lays up the winter's medicines.",
          zh: "医藏冬药。",
        },
      },
      {
        who: "carrier",
        kind: "labour",
        at: "chamber",
        line: {
          en: "The porter papers the chamber's doors against the cold.",
          zh: "仆塞寝户以御寒。",
        },
      },
    ],
  },
  10: {
    note: {
      en: "Winter is shut in and the master puts on furs. The year's-end offerings are laid for the ancestors and the five household spirits: the door, the gate, the well, the hearth, and the inner room; the steward closes the year's accounts, and the household's wine is broached.",
      zh: "闭塞成冬，主人始裘。腊先祖五祀：户、门、井、灶、中霤；宰结岁计，开岁酒。",
    },
    tasks: [
      {
        who: "steward",
        kind: "labour",
        at: "desk",
        weight: 3,
        line: {
          en: "The steward closes the year's accounts.",
          zh: "宰结岁计。",
        },
      },
      {
        who: "maid",
        kind: "stroll",
        from: "chest",
        to: "dais",
        line: {
          en: "The maid brings the master's furs from the chest.",
          zh: "婢自箱出主人之裘。",
        },
      },
      {
        who: "cook",
        kind: "labour",
        at: "hearth",
        weight: 2,
        line: {
          en: "The cook roasts the offering meats at the hearth.",
          zh: "庖人于灶炙祭肉。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "bins",
        to: "well",
        line: {
          en: "The porter draws the well's offering water.",
          zh: "仆汲井以祭。",
        },
      },
      {
        who: "guard",
        kind: "labour",
        at: "gate",
        line: {
          en: "The guard lays the offering at the gate.",
          zh: "卫士祭于门。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The five household offerings", zh: "腊五祀" },
        who: "master",
        at: "tablets",
        count: 3,
        line: {
          en: "The master offers to the ancestors and the five household spirits, at the tablets first and then at the door, the gate, the well, the hearth, and the inner room.",
          zh: "主人腊先祖五祀，先于神主，次户、门、井、灶、中霤。",
        },
        cite: LIJI(1698, "月令 孟冬: 臘先祖五祀"),
      },
    ],
  },
  11: {
    note: {
      en: "The shortest day. The house sits close: the women weave in the east rooms, the scholar reads to the master by the lamp, the musician plays the chamber warm; the year's dead are remembered, and no one is sent out on the roads.",
      zh: "日短至。一家聚处：妇织于东房，先生对灯读于主人前，乐师奏于寝；饬死事，毋出于道。",
    },
    tasks: [
      {
        who: "maid",
        kind: "labour",
        at: "loom",
        weight: 3,
        line: {
          en: "The maid weaves the winter's cloth at the loom.",
          zh: "婢于机织冬布。",
        },
      },
      {
        who: "scholar",
        kind: "gather",
        at: "lamp",
        count: 2,
        weight: 2,
        line: {
          en: "The scholar reads to the master under the hall lamp.",
          zh: "先生对堂灯为主人读书。",
        },
      },
      {
        who: "musician",
        kind: "labour",
        at: "chamber",
        line: {
          en: "The musician plays in the chamber against the cold.",
          zh: "乐师奏于寝以御寒。",
        },
      },
      {
        who: "cook",
        kind: "labour",
        at: "hearth",
        weight: 2,
        line: {
          en: "The cook keeps the hearth going through the long night.",
          zh: "庖人长夜守灶。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "east-rooms",
        to: "hall",
        line: {
          en: "The child runs across the snowy court to the hall.",
          zh: "童子越雪庭趋堂。",
        },
      },
    ],
  },
  12: {
    note: {
      en: "The waters freeze. Ice is cut and stored under the pavilion, the physician doses the house against the winter fevers, and at the year's end the household drives the old year out: drums at the gate, a straw ox in the court, and the tablets fed before dawn.",
      zh: "水泽腹坚。凿冰藏于榭下，医为一家防冬疫；岁终大傩逐旧岁：鼓于门，土牛于庭，昧爽荐于神主。",
    },
    tasks: [
      {
        who: "carrier",
        kind: "till",
        from: "pond",
        to: "pavilion",
        count: 2,
        weight: 2,
        line: {
          en: "The porters cut ice from the pond and carry it to the store under the pavilion.",
          zh: "仆凿池冰，藏于榭下。",
        },
      },
      {
        who: "physician",
        kind: "stroll",
        from: "wing-east",
        to: "chamber",
        weight: 2,
        line: {
          en: "The physician brings the lady her winter draught.",
          zh: "医进夫人冬药。",
        },
      },
      {
        who: "guard",
        kind: "labour",
        at: "gate",
        weight: 2,
        line: {
          en: "The guard beats the drum at the gate to drive the cold out.",
          zh: "卫士击鼓于门以逐寒。",
        },
      },
      {
        who: "steward",
        kind: "gather",
        at: "mat",
        count: 3,
        line: {
          en: "The steward gives the servants their year's-end wine on the mats.",
          zh: "宰于仆席赐仆岁终之酒。",
        },
      },
      {
        who: "cook",
        kind: "labour",
        at: "hearth",
        line: {
          en: "The cook steams the year's-end cakes.",
          zh: "庖人蒸岁终之饼。",
        },
      },
    ],
    rites: [
      {
        title: { en: "Driving out the year", zh: "大傩" },
        who: "master",
        at: "court",
        count: 5,
        effect: "smoke",
        line: {
          en: "The household drives the old year out of the court with drums and torches, and a straw ox stands at the gate to send the cold away.",
          zh: "阖家击鼓执炬于庭逐旧岁，出土牛于门以送寒气。",
        },
        cite: LIJI(1721, "月令 季冬: 命有司大難，旁磔，出土牛，以送寒氣"),
      },
    ],
  },
};
