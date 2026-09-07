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
      en: "The ground is still hard. The ploughshares are mended, the field banks and the paths repaired, and the elder walks the boundaries before the season opens; no tree is felled and no nest overturned.",
      zh: "地尚冻。修耒耜，修封疆，审端径术；里正巡田界。禁伐木，毋覆巢。",
    },
    tasks: [
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
        from: "elder",
        to: "fields-west",
        line: {
          en: "The elder walks the field banks to see the boundaries repaired.",
          zh: "里正巡西田，视封疆。",
        },
      },
      {
        who: "woodcutter",
        kind: "labour",
        at: "woods",
        line: {
          en: "The woodcutter gathers deadfall; no standing tree is felled this month.",
          zh: "樵夫拾枯枝，是月禁伐木。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-2",
        weight: 2,
        line: {
          en: "The goodwife brews the new year's wine.",
          zh: "主妇酿岁酒。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-4",
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
      en: "The east wind has loosened the ground. The oxen go out to the west fields and the plough begins; the pools are not drained and the woods not burned. On a chosen day the ward sacrifices at the altar of the soil.",
      zh: "东风解冻。牛出西田，始耕；毋竭川泽，毋焚山林。择元日，命民社。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "byre",
        to: "fields-west",
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
        to: "fields-south",
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
        from: "house-2",
        to: "well",
        line: {
          en: "The goodwife draws water for the seed.",
          zh: "主妇汲水浸种。",
        },
      },
      {
        who: "fisher",
        kind: "labour",
        at: "pond",
        line: {
          en: "The fisher mends the nets; the pond is not to be drained.",
          zh: "渔者补网，毋漉陂池。",
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
      en: "The mulberry is in leaf and no one may cut it. The girls pick the leaves and the silkworms are fed in the houses; the millet is sown behind the plough, and the brook's banks are cleared before the rains.",
      zh: "桑叶生，毋伐桑柘。采桑女采叶，室中饲蚕；播粟于犁后；修溪防以待雨。",
    },
    tasks: [
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
        to: "fields-east",
        count: 2,
        weight: 2,
        line: {
          en: "The farmers carry the seed millet to the east fields and sow it.",
          zh: "农夫负种至东田播粟。",
        },
      },
      {
        who: "weaver",
        kind: "stroll",
        from: "house-3",
        to: "orchard",
        line: {
          en: "The weaver goes to the plot for the day's leaves.",
          zh: "织妇往桑取叶。",
        },
      },
      {
        who: "elder",
        kind: "stroll",
        from: "elder",
        to: "ford",
        line: {
          en: "The elder sees the brook's banks cleared at the ford.",
          zh: "里正视津上溪防。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-5",
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
      en: "The wheat on the south fields is cut and carried in, the first harvest of the year. The cocoons are reeled in the weaver's house and the silk tax is set aside; the county's officer comes to see that no season is lost.",
      zh: "南田刈麦，岁之首获。织妇之舍缫茧，留茧税。县吏至，劝农毋失时。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "fields-south",
        to: "threshing",
        count: 3,
        weight: 3,
        line: {
          en: "Three farmers carry the wheat from the south fields to the threshing floor.",
          zh: "农夫三人自南田负麦至场。",
        },
      },
      {
        who: "weaver",
        kind: "labour",
        at: "house-3",
        weight: 2,
        line: { en: "The weaver reels the cocoons.", zh: "织妇缫茧。" },
      },
      {
        who: "clerk",
        kind: "stroll",
        from: "station",
        to: "fields-south",
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
        from: "house-2",
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
      en: "The rains are due and the ward prays for them. The millet is weeded and the hemp stands high; at the longest day the houses keep still, and no fire is lit to the south.",
      zh: "雩以祈雨。耘粟，麻方长。日长至，家家掩身，毋用火南方。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "house-1",
        to: "fields-west",
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
        from: "house-4",
        to: "fields-east",
        line: {
          en: "A child pulls weeds at the edge of the east fields.",
          zh: "童子于东田边拔草。",
        },
      },
      {
        who: "fisher",
        kind: "labour",
        at: "pond",
        line: {
          en: "The fisher sets the summer nets now the statute allows it.",
          zh: "渔者置夏网，律所许也。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-2",
        line: {
          en: "The goodwife keeps the house still at the solstice.",
          zh: "主妇日至掩身。",
        },
      },
      {
        who: "woodcutter",
        kind: "stroll",
        from: "woods",
        to: "well",
        line: {
          en: "The woodcutter comes down to the well in the heat.",
          zh: "樵夫暑中下就井。",
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
      en: "The great rains. The weeds are cut and burned and the water run over them to manure the fields; the hemp is cut and retted in the pond. No earthwork is raised and no one is levied.",
      zh: "大雨时行。烧薙行水以粪田；刈麻，沤于陂。不可以兴土功，不可以起大众。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "house-6",
        to: "fields-south",
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
        from: "house-2",
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
        who: "fisher",
        kind: "labour",
        at: "pond",
        line: {
          en: "The fisher takes the pond's fish while the water is high.",
          zh: "渔者乘水盛取鱼。",
        },
      },
      {
        who: "elder",
        kind: "stroll",
        from: "elder",
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
      en: "The cool wind comes and the first millet is cut. The new grain is tasted and offered at the altar before anyone eats of it; the brook's banks are made good against the autumn floods and the house walls patched.",
      zh: "凉风至，始刈粟。尝新，先荐于社；完堤防以备水潦，坏墙垣。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "fields-east",
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
        at: "house-2",
        line: {
          en: "The goodwife patches the house wall with mud.",
          zh: "主妇以泥坏墙垣。",
        },
      },
      {
        who: "woodcutter",
        kind: "labour",
        at: "ford",
        line: {
          en: "The woodcutter drives stakes into the bank at the ford.",
          zh: "樵夫于津上打桩固堤。",
        },
      },
      {
        who: "merchant",
        kind: "stroll",
        from: "station",
        to: "threshing",
        line: {
          en: "The grain dealer comes up the lane to see the new millet.",
          zh: "粜者自邮道来视新粟。",
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
      en: "The geese come south. The harvest is gathered and the vegetables stored; the wheat is sown for next year before the season passes. The old are given their staves, and the ward meets at the altar for the autumn thanksgiving.",
      zh: "鸿雁来。收敛，畜菜；劝种麦，毋失时。养衰老，授几杖；会于社，秋报。",
    },
    tasks: [
      {
        who: "peasant",
        kind: "till",
        from: "granary",
        to: "fields-west",
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
        at: "house-2",
        weight: 2,
        line: {
          en: "The goodwife pickles the vegetables for the winter.",
          zh: "主妇畜菜为冬。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "house-1",
        to: "elder",
        line: {
          en: "A child carries a staff to the oldest house.",
          zh: "童子送杖于老者之家。",
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
      en: "The leaves yellow and fall. The threshing floor is beaten and the garden plots made, the last millet threshed and the charcoal burned in the woods; the doors are plastered against the cold.",
      zh: "草木黄落。筑场圃，打最后之粟，伐薪为炭；墐户以御寒。",
    },
    tasks: [
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
        who: "woodcutter",
        kind: "labour",
        at: "woods",
        weight: 2,
        effect: "smoke",
        line: {
          en: "The woodcutter burns charcoal in the woods.",
          zh: "樵夫于林中烧炭。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-2",
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
        who: "merchant",
        kind: "gather",
        at: "granary",
        count: 2,
        line: {
          en: "The grain dealer weighs the millet at the granary.",
          zh: "粜者于仓量粟。",
        },
      },
    ],
  },
  10: {
    note: {
      en: "Winter is shut in. The grain is stored, the fences and the byre repaired, and the oxen brought in for the county's inspection. The ward drinks the year's wine at the elder's house, and the offering is laid for the ancestors and the household spirits.",
      zh: "闭塞成冬。纳禾稼，修篱与牢，牛归以待县之课。里人于里正之舍朋酒斯飨；腊先祖五祀。",
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
        who: "woodcutter",
        kind: "labour",
        at: "house-5",
        line: { en: "The woodcutter mends the fence.", zh: "樵夫修篱。" },
      },
      {
        who: "weaver",
        kind: "labour",
        at: "house-3",
        line: {
          en: "The weaver sits at the loom now the fields are done.",
          zh: "织妇织于机，田事既毕。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The winter feast", zh: "饗" },
        who: "elder",
        at: "elder",
        count: 5,
        line: {
          en: "The ward gathers at the elder's house with two jars of wine and a lamb, and wishes him long life.",
          zh: "朋酒斯飨，曰杀羔羊，跻彼公堂，称彼兕觥，万寿无疆。",
        },
        cite: QIYUE(3838, "七月: 朋酒斯饗"),
      },
    ],
  },
  11: {
    note: {
      en: "The shortest day. No earthwork is begun and no one is levied. The women weave and spin, the men twist rope and mend the tools, and the wine is brewed for the year's end; a beast left out is anyone's to take.",
      zh: "日短至。土事毋作，毋起大众。妇织，男索绹修器，酿酒以待岁终；畜兽放佚者，取之不诘。",
    },
    tasks: [
      {
        who: "weaver",
        kind: "labour",
        at: "house-3",
        weight: 3,
        line: {
          en: "The weaver works the loom through the short day.",
          zh: "织妇终日织。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "house-1",
        weight: 2,
        line: {
          en: "The farmer twists rope by the door.",
          zh: "农夫于户下索绹。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "house-2",
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
        from: "house-4",
        to: "house-1",
        line: {
          en: "A child runs between the houses in the snow.",
          zh: "童子雪中走于舍间。",
        },
      },
    ],
  },
  12: {
    note: {
      en: "The waters are frozen to the bottom. The ice is cut and stored, the seed grain issued, and the ploughs mended for the spring; the ward drives out the old year at the altar with the year's-end offering.",
      zh: "水泽腹坚。取冰而藏，出五种，修耒耜以待春；里人于社蜡祭，逐旧岁。",
    },
    tasks: [
      {
        who: "woodcutter",
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
        who: "fisher",
        kind: "labour",
        at: "pond",
        line: {
          en: "The fisher cuts a hole in the ice for the year's first fish.",
          zh: "渔者凿冰始渔。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "house-2",
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
