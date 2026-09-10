/**
 * The village's year: the *Seventh Month* and the *Yueling*'s farming
 * ordinances read as a hamlet's calendar, with the Qin field and stable
 * statutes where they bind a ward. Every `who` is one of `VILLAGERS`, every
 * place one of `VILLAGE_NAMES`; `almanac.spec.ts` holds both.
 */
import type { Cite, SiteYear } from "../../almanac";

const QIYUE = (line: number, note: string): Cite => ({
  id: "shijing-zh",
  line,
  note,
});
const LIJI = (line: number, note: string): Cite => ({
  id: "liji-zh",
  line,
  note,
});

export const VILLAGE_YEAR: SiteYear = {
  1: {
    note: {
      en: "The ground is still hard. The ploughshares are mended, the field banks and the paths repaired, and the elder walks the boundaries before the season opens; no tree is felled and no nest overturned. In the fields: the wheat on the south blocks is green under the frost, the millet blocks stand in stubble, the paddy in mud, the hemp ground and the bean blocks bare; the ice is carried up to the ice house.",
      zh: "地尚冻。修耒耜，修封疆，审端径术；里典巡田界。禁伐木，毋覆巢。田中：南田之麦青于霜下，禾田皆茬，稻田泥，麻田、菽田空；纳冰于凌阴。",
    },
    tasks: [
      {
        who: "fieldofficer",
        kind: "labour",
        at: "byre",
        line: {
          en: "The county's field officer reckons the ward's oxen at the byre.",
          zh: "田啬夫于牢课牛。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "byre",
        weight: 2,
        line: {
          en: "The farmer mends the ploughshare in the byre.",
          zh: "农夫于牛牢修耒耜。",
        },
      },
      {
        who: "elder",
        kind: "stroll",
        from: "house-01",
        to: "field-west",
        line: {
          en: "The elder walks the field banks to see the boundaries repaired.",
          zh: "里正巡西田，视封疆。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "woods",
        line: {
          en: "A farmer gathers deadfall in the woods; no standing tree is felled this month.",
          zh: "农夫拾枯枝于林，是月禁伐木。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        weight: 2,
        line: {
          en: "The goodwife brews the new year's wine.",
          zh: "主妇酿岁酒。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-04",
        to: "pond",
        line: {
          en: "A child goes to see the fish rise to the ice.",
          zh: "童子往陂观鱼上冰。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The prayer for grain", zh: "祈谷" },
        who: "elder",
        at: "shrine",
        count: 3,
        line: {
          en: "The elder leads the ward to the altar to pray for the year's grain.",
          zh: "里正率里人于社祈谷。",
        },
        cite: LIJI(1580, "月令 孟春: 祈穀于上帝"),
      },
    ],
  },
  2: {
    note: {
      en: "The east wind has loosened the ground. The oxen go out to the west blocks and the plough begins; the pools are not drained and the woods not burned. On a chosen day the ward sacrifices at the altar of the soil, and in the matchmaker's month a bride is brought along the lane. In the fields: the wheat green, the millet blocks turned behind the plough, the peach at the gates in blossom.",
      zh: "东风解冻。牛出西田，始耕；毋竭川泽，毋焚山林。择元日，命民社；中春令会男女，迎妇于里道。田中：麦青，禾田耕翻，门桃始华。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "byre",
        to: "field-west",
        count: 2,
        weight: 3,
        line: {
          en: "Two farmers take the oxen out to plough the west fields.",
          zh: "农夫二人驱牛耕西田。",
        },
      },
      {
        who: "ox",
        kind: "till",
        from: "byre",
        to: "field-south",
        line: {
          en: "The ox drags the plough across the south fields.",
          zh: "牛曳犁过南田。",
        },
      },
      {
        who: "herdsman",
        kind: "stroll",
        from: "byre",
        to: "meadow",
        line: {
          en: "The herdsman drives the sheep out to the first grass.",
          zh: "牧人驱羊就新草。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "house-02",
        to: "well",
        line: {
          en: "The goodwife draws water for the seed.",
          zh: "主妇汲水浸种。",
        },
      },
      {
        who: "child",
        kind: "labour",
        at: "pond",
        line: {
          en: "A boy mends the nets at the pond; the pond is not to be drained.",
          zh: "童子补网于陂，毋漉陂池。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The spring altar", zh: "春社" },
        who: "elder",
        at: "shrine",
        count: 4,
        line: {
          en: "The ward gathers at the altar of the soil with a pig and wine, and the elder divides the meat.",
          zh: "里人会于社，以豕与酒祭，里正分胙。",
        },
        cite: LIJI(1590, "月令 仲春: 擇元日，命民社"),
      },
    ],
  },
  3: {
    note: {
      en: "The mulberry is in leaf and no one may cut it. The girls pick the leaves and the silkworms are fed in the shed; the millet is sown behind the plough, the paddy flooded and set, the hemp sown by the washing place, and the young go down to the water for the lustration. In the fields: the wheat in ear, the broomcorn on the north block already green, the paddy under water with its seedlings, the west blocks bare and sown.",
      zh: "桑叶生，毋伐桑柘。女采叶，蚕室饲蚕；播禾于犁后，灌稻田而莳秧，种麻于沤池之侧；上巳，少者下水祓除。田中：麦秀，北田之黍已青，稻田水满秧立，西田播而未生。",
    },
    tasks: [
      {
        who: "girl",
        kind: "stroll",
        from: "house-22",
        to: "orchard",
        line: {
          en: "A small girl follows her mother to the mulberry with a basket.",
          zh: "小女随母携筐往桑。",
        },
      },
      {
        who: "maiden",
        kind: "labour",
        at: "orchard",
        weight: 3,
        line: {
          en: "The mulberry girl picks leaves for the silkworms.",
          zh: "采桑女采桑饲蚕。",
        },
      },
      {
        who: "peasant",
        kind: "till",
        from: "granary",
        to: "field-east",
        count: 2,
        weight: 2,
        line: {
          en: "The farmers carry the seed millet to the east fields and sow it.",
          zh: "农夫负种至东田播粟。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "house-03",
        to: "orchard",
        line: {
          en: "A wife goes to the plot for the day's leaves.",
          zh: "妇人往桑取叶。",
        },
      },
      {
        who: "elder",
        kind: "stroll",
        from: "house-01",
        to: "ford",
        line: {
          en: "The elder sees the brook's banks cleared at the ford.",
          zh: "里正视津上溪防。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-05",
        to: "orchard",
        line: {
          en: "A child carries a basket to the mulberry plot.",
          zh: "童子携筐至桑。",
        },
      },
    ],
  },
  4: {
    note: {
      en: "The wheat on the south blocks is cut and carried in, the first harvest of the year, and the beans go in behind the reapers; the cocoons are reeled at the shed and the silk tax set aside; the county's field officer comes to see the oxen and that no season is lost. In the fields: the wheat gold and then stubble, the millets green, the hemp rising, the paddy green over water.",
      zh: "南田刈麦，岁之首获，刈后种菽；蚕室缫茧，留茧税；田啬夫至肤牛，劝农毋失时。田中：麦黄而后茬，禾黍青，麻起，稻青于水上。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "field-south",
        to: "threshing",
        count: 3,
        weight: 3,
        line: {
          en: "Three farmers carry the wheat from the south fields to the threshing floor.",
          zh: "农夫三人自南田负麦至场。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-03",
        weight: 2,
        line: {
          en: "The wives reel the cocoons at the shed.",
          zh: "妇人缫茧于蚕室。",
        },
      },
      {
        who: "clerk",
        kind: "stroll",
        from: "station",
        to: "field-south",
        line: {
          en: "The post clerk walks out to the fields with the county's order to hasten the harvest.",
          zh: "邮人持县令至田，趣民收麦。",
        },
      },
      {
        who: "herdsman",
        kind: "labour",
        at: "meadow",
        line: {
          en: "The herdsman keeps the sheep off the standing grain.",
          zh: "牧人驱羊毋害禾。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "house-02",
        to: "granary",
        line: {
          en: "The goodwife carries the first wheat to the granary.",
          zh: "主妇纳新麦于仓。",
        },
      },
    ],
  },
  5: {
    note: {
      en: "The rains are due and the ward prays for them at the altar. The millet is weeded and the hemp stands high; the broomcorn on the north block is the first grain in, tasted at the altar; at the longest day the houses keep still, and no fire is lit to the south. In the fields: the broomcorn ripe and reaped, the foxtail green, the beans coming up on the south and the east, the hemp tall, the melons on the garden beds.",
      zh: "雩以祈雨。耘禾，麻方长；北田之黍先登，荐于社；日长至，家家掩身，毋用火南方。田中：黍熟而刈，禾青，南田、东田之菽生，麻高，圃有瓜。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "house-01",
        to: "field-west",
        count: 2,
        weight: 3,
        line: {
          en: "The farmers weed the millet in the west fields.",
          zh: "农夫耘西田之粟。",
        },
      },
      {
        who: "child",
        kind: "till",
        from: "house-04",
        to: "field-east",
        line: {
          en: "A child pulls weeds at the edge of the east fields.",
          zh: "童子于东田边拔草。",
        },
      },
      {
        who: "child",
        kind: "labour",
        at: "pond",
        line: {
          en: "A boy sets the summer nets now the statute allows it.",
          zh: "童子置夏网，律所许也。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        line: {
          en: "The goodwife keeps the house still at the solstice.",
          zh: "主妇日至掩身。",
        },
      },
      {
        who: "peasant",
        kind: "stroll",
        from: "woods",
        to: "well",
        line: {
          en: "A farmer comes down to the well in the heat.",
          zh: "农夫暑中下就井。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The prayer for rain", zh: "雩" },
        who: "elder",
        at: "shrine",
        count: 3,
        line: {
          en: "The elder and the ward pray at the altar for the rains.",
          zh: "里正率里人于社祈雨。",
        },
        cite: LIJI(1627, "月令 仲夏: 大雩帝"),
      },
    ],
  },
  6: {
    note: {
      en: "The great rains. The weeds are cut and burned and the water run over them to manure the fields; the wives dye at the washing place with the vats. No earthwork is raised and no one is levied. In the fields: the foxtail heading, the beans in bush, the hemp at its height, the paddy green, the gourds on the fences.",
      zh: "大雨时行。烧薙行水以粪田；妇人于沤池染采。不可以兴土功，不可以起大众。田中：禾将秀，菽成丛，麻极高，稻青，藩有壶。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "house-06",
        to: "field-south",
        count: 2,
        weight: 2,
        line: {
          en: "The farmers burn the cut weeds and run water over the south fields.",
          zh: "农夫于南田烧薙行水。",
        },
      },
      {
        who: "matron",
        kind: "till",
        from: "house-02",
        to: "pond",
        count: 2,
        weight: 2,
        line: {
          en: "The women carry the cut hemp to the pond to ret.",
          zh: "妇人负麻至陂沤之。",
        },
      },
      {
        who: "herdsman",
        kind: "stroll",
        from: "meadow",
        to: "byre",
        line: {
          en: "The herdsman brings the oxen in from the rain.",
          zh: "牧人避雨驱牛归牢。",
        },
      },
      {
        who: "child",
        kind: "labour",
        at: "pond",
        line: {
          en: "A boy takes the pond's fish while the water is high.",
          zh: "童子乘水盛取鱼。",
        },
      },
      {
        who: "elder",
        kind: "stroll",
        from: "house-01",
        to: "ford",
        line: {
          en: "The elder watches the ford in the flood.",
          zh: "里正视津之水。",
        },
      },
    ],
  },
  7: {
    note: {
      en: "The cool wind comes and the first millet is cut. The new grain is tasted and offered at the altar before anyone eats of it, the children eat the melons, the hemp is cut and retted at the water; the brook's banks are made good against the autumn floods and the house walls patched. In the fields: the foxtail in ear on the west and north blocks, the hemp ground cut to stalks, the beans in pod, the paddy green.",
      zh: "凉风至，始刈禾。尝新，先荐于社；童子食瓜；刈麻，沤于池；完堤防以备水潦，坏墙垣。田中：西田、北田之禾秀，麻田刈而余茎，菽荚，稻青。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "field-east",
        to: "threshing",
        count: 3,
        weight: 3,
        line: {
          en: "The farmers reap the east fields and carry the sheaves to the threshing floor.",
          zh: "农夫刈东田，负禾至场。",
        },
      },
      {
        who: "ox",
        kind: "labour",
        at: "threshing",
        line: {
          en: "The ox treads the grain on the threshing floor.",
          zh: "牛踏谷于场。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        line: {
          en: "The goodwife patches the house wall with mud.",
          zh: "主妇以泥坏墙垣。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "ford",
        line: {
          en: "A farmer drives stakes into the bank at the ford.",
          zh: "农夫于津上打桩固堤。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "station",
        to: "threshing",
        line: {
          en: "The pedlar comes up the lane to see the new millet.",
          zh: "贩夫自邮道来视新粟。",
        },
      },
    ],
    rites: [
      {
        title: { en: "Tasting the new grain", zh: "尝新" },
        who: "elder",
        at: "shrine",
        count: 2,
        line: {
          en: "The elder offers the first millet at the altar before the ward eats of it.",
          zh: "里正以新粟荐于社，然后食。",
        },
        cite: LIJI(1651, "月令 孟秋: 農乃登穀，天子嘗新"),
      },
    ],
  },
  8: {
    note: {
      en: "The geese come south. The county's clerk takes the register at the hall and a boy is entered as grown; the jujubes are beaten down and the gourds cut; the wheat is sown on the south blocks for next year before the season passes, and the hemp is spun. The old are given their staves, and the ward meets at the altar for the autumn thanksgiving. In the fields: the foxtail heavy in the ear, the beans yellowing on the east, the south blocks turned and sown to wheat, the paddy turning, the jujube in red fruit at the gates.",
      zh: "鸿雁来。令史于序案比，童子傅为大；剥枣断壶；南田劝种麦，毋失时；载绩。养衰老，授几杖；会于社，秋报。田中：禾穗重，东田之菽黄，南田耕而种麦，稻将黄，门枣红。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "granary",
        to: "field-west",
        count: 2,
        weight: 3,
        line: {
          en: "The farmers sow the wheat in the west fields.",
          zh: "农夫于西田种麦。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        weight: 2,
        line: {
          en: "The goodwife pickles the vegetables for the winter.",
          zh: "主妇畜菜为冬。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-01",
        to: "house-25",
        line: {
          en: "A child carries a staff from the elder to the Han house, where the oldest man of the ward lives.",
          zh: "童子自里典之舍送杖于韩氏，里中最老者所居。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "station",
        to: "well",
        line: {
          en: "The pedlar comes through with salt and needles now the markets are eased.",
          zh: "贩夫携盐针过里，关市方易。",
        },
      },
      {
        who: "herdsman",
        kind: "stroll",
        from: "meadow",
        to: "hills",
        line: {
          en: "The herdsman takes the sheep up the hill for the last of the grass.",
          zh: "牧人驱羊上丘食秋草。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The autumn altar", zh: "秋社" },
        who: "elder",
        at: "shrine",
        count: 4,
        line: {
          en: "The ward gathers at the altar to give thanks for the harvest and share the meat.",
          zh: "里人会于社报秋，分胙。",
        },
        cite: {
          id: "season-she-zh",
          note: "社日: the spring and autumn altar days",
        },
      },
    ],
  },
  9: {
    note: {
      en: "The leaves yellow and fall. The harvest: every villager who is not old is in the blocks, the men reaping the millet, the wives and children carrying; the beans are pulled on the east; the threshing floor is beaten and the fodder and straw levy driven to the station; the winter clothes are issued. In the fields: the west and north blocks reaped to stubble, the beans pulled, the paddy gold, the wheat shoots green on the south, the chestnuts at the gates.",
      zh: "草木黄落。收获：里中非老者皆在田，丁夫刈禾，妇子负之；东田拔菽；筑场圃，输刍稾于邮；九月授衣。田中：西田、北田刈而余茬，菽拔，稻黄，南田麦苗青，门栗。",
    },
    tasks: [
      {
        who: "granny",
        kind: "labour",
        at: "threshing",
        line: {
          en: "A granny sits at the edge of the floor to watch the threshing.",
          zh: "老妪坐场边观打谷。",
        },
      },
      {
        who: "peasant",
        kind: "gather",
        at: "threshing",
        count: 3,
        weight: 3,
        line: {
          en: "The ward threshes the last of the millet on the floor.",
          zh: "里人于场打粟。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "woods",
        weight: 2,
        effect: "smoke",
        line: {
          en: "A farmer burns charcoal in the woods.",
          zh: "农夫于林中烧炭。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        line: {
          en: "The goodwife plasters the door and the window.",
          zh: "主妇墐户塞向。",
        },
      },
      {
        who: "ox",
        kind: "labour",
        at: "threshing",
        line: { en: "The ox treads the floor hard.", zh: "牛筑场。" },
      },
      {
        who: "carrier",
        kind: "gather",
        at: "granary",
        count: 2,
        line: {
          en: "The pedlar weighs the millet at the granary.",
          zh: "贩夫于仓量粟。",
        },
      },
    ],
  },
  10: {
    note: {
      en: "Qin's year opens: the elder carries the ward's tallies to the station. The rice is reaped in the paddy and every household's grain goes into the granary; the floor is threshed and the whole ward feasts at the hall; the lieutenant musters the corvée party and takes the garrison man; the oxen are brought in for the county's inspection. In the fields: the paddy reaped to stubble in the mud, the millet blocks and the bean blocks bare, the wheat green on the south, the haystacks by the floor, the carts loaded.",
      zh: "秦岁首：里典持券上计于邮。稻田刈稻，户纳禾稼于仓；涤场，里人于序朋酒斯飨；士吏发徭，取戍卒；牛归以待县之课。田中：稻田刈而余茬于泥，禾田、菽田空，南田麦青，场侧积稾，车载刍稾。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "threshing",
        to: "granary",
        count: 2,
        weight: 2,
        line: {
          en: "The farmers carry the threshed grain into the granary.",
          zh: "农夫纳粟于仓。",
        },
      },
      {
        who: "herdsman",
        kind: "stroll",
        from: "meadow",
        to: "byre",
        weight: 2,
        line: {
          en: "The herdsman brings the oxen in for the winter inspection.",
          zh: "牧人驱牛归牢以待课。",
        },
      },
      {
        who: "clerk",
        kind: "stroll",
        from: "station",
        to: "byre",
        line: {
          en: "The post clerk comes to count the oxen for the county.",
          zh: "邮人来课牛。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "house-05",
        line: { en: "A farmer mends the fence.", zh: "农夫修篱。" },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-03",
        line: {
          en: "The wives sit at the loom now the fields are done.",
          zh: "妇人织于机，田事既毕。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The winter feast", zh: "飨" },
        who: "elder",
        at: "hall",
        count: 8,
        line: {
          en: "The ward gathers at the hall with two jars of wine and a lamb, and raises the horn.",
          zh: "朋酒斯飨，曰杀羔羊，跻彼公堂，称彼兕觥，万寿无疆。",
        },
        cite: QIYUE(3838, "七月: 朋酒斯饗"),
      },
    ],
  },
  11: {
    note: {
      en: "The shortest day. No earthwork is begun and no one is levied. The lieutenant drills the ward's men on the floor and they shoot at the target; every man goes to the woods for the winter's firewood; the women weave and spin through the nights; a mother of the second 伍 is carried to the graves. In the fields: stubble and bare ground, the wheat alone green on the south, the target stood up by the floor.",
      zh: "日短至。土事毋作，毋起大众。士吏教大阅于场，射侯；丁夫皆入林伐薪；妇人夜绩；二伍之母葬于丘。田中：茬与空地，唯南田麦青，场侧立侯。",
    },
    tasks: [
      {
        who: "lieutenant",
        kind: "labour",
        at: "threshing",
        line: {
          en: "The county's lieutenant drills the ward's men on the floor.",
          zh: "士吏于场教里丁习战。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-03",
        weight: 3,
        line: {
          en: "The wives work the loom through the short day.",
          zh: "妇人终日织。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "house-10",
        weight: 2,
        line: {
          en: "The farmer twists rope by the door.",
          zh: "农夫于户下索绹。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-02",
        line: {
          en: "The goodwife sets the yeast for the wine.",
          zh: "主妇下曲酿酒。",
        },
      },
      {
        who: "herdsman",
        kind: "labour",
        at: "byre",
        line: {
          en: "The herdsman feeds the oxen on the stacked fodder.",
          zh: "牧人以刍饲牛。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-04",
        to: "house-01",
        line: {
          en: "A child runs between the houses in the snow.",
          zh: "童子雪中走于舍间。",
        },
      },
    ],
  },
  12: {
    note: {
      en: "The waters are frozen to the bottom. The ward thanks the eight spirits at the altar and drinks by age in the hall, the men come back from the hunt with game for the La, the young men drive out the pestilence along the lanes with drums and masks, and the ice is cut on the pond for the ice house; the seed grain is issued and the ploughs mended for the spring. In the fields: snow on the stubble, the wheat green under it, the ice stacked on the bank.",
      zh: "水泽腹坚。里人于社蜡，序中饮酒以齿；丁夫自林田猎而归以腊；少者鼓而蒙面，逐疫于里道；凿冰于陂以纳凌阴；出五种，修耒耜以待春。田中：雪覆茬，麦青于雪下，冰积于岸。",
    },
    tasks: [
      {
        who: "grandfather",
        kind: "stroll",
        from: "house-25",
        to: "hall",
        line: {
          en: "The oldest man of the ward is helped to the hall to be seated first.",
          zh: "里中最老者扶至序，先席之。",
        },
      },
      {
        who: "peasant",
        kind: "till",
        from: "pond",
        to: "granary",
        count: 2,
        weight: 2,
        line: {
          en: "Two men cut ice from the pond and carry it to the store.",
          zh: "二人凿陂冰，纳于窖。",
        },
      },
      {
        who: "elder",
        kind: "gather",
        at: "granary",
        count: 3,
        weight: 2,
        line: {
          en: "The elder issues the seed grain at the granary.",
          zh: "里正于仓出五种。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "byre",
        line: {
          en: "The farmer mends the plough for the spring.",
          zh: "农夫修耒耜以待春。",
        },
      },
      {
        who: "child",
        kind: "labour",
        at: "pond",
        line: {
          en: "A boy cuts a hole in the ice for the year's first fish.",
          zh: "童子凿冰始渔。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "house-02",
        to: "graves",
        line: {
          en: "The goodwife carries the year's-end offering to the family graves.",
          zh: "主妇献岁终之祭于族墓。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The year's-end offering", zh: "蜡" },
        who: "elder",
        at: "shrine",
        count: 4,
        line: {
          en: "The ward gathers at the altar to thank the eight spirits of the fields and send the year out.",
          zh: "里人会于社，蜡祭八神，送旧岁。",
        },
        cite: LIJI(1721, "月令 季冬 and 郊特牲: 天子大蜡八"),
      },
    ],
  },
};
