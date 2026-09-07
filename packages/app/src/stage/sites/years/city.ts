/**
 * The city's year: the *Yueling*'s ordinances as a court and its wards keep
 * them (the ploughing rite, the altar days, the market opened and closed, the
 * workshops audited, the walls built in autumn, the hunt, the year's-end
 * exorcism), with the *Zhouli*'s market officers (`zhouli-zh` 542) and the
 * Qin workshop statute (`shuihudi-zh` 322). Every `who` is one of the city's
 * folk, every place one of `CITY_NAMES`; `almanac.spec.ts` holds both.
 */
import type { Cite, SiteYear } from "../../almanac";

const LIJI = (line: number, note: string): Cite => ({
  id: "liji-zh",
  line,
  note,
});

export const CITY_YEAR: SiteYear = {
  1: {
    note: {
      en: "The year opens. The court prays for grain and the lord turns the first furrow of the royal field with his own hands, the ministers behind him; the prisons are eased, the boundaries surveyed, and no wall is raised nor levy called.",
      zh: "岁首。祈谷于上帝，君亲载耒耜躬耕籍田，卿从之；省囹圄，审端径术，毋起土功，毋发大众。",
    },
    tasks: [
      {
        who: "clerk",
        kind: "stroll",
        from: "office",
        to: "fields-east",
        weight: 2,
        line: {
          en: "The clerk walks out to survey the field boundaries for the year.",
          zh: "吏出审田界。",
        },
      },
      {
        who: "peasant",
        kind: "labour",
        at: "fields-south",
        line: {
          en: "The farmer mends the ploughshare at the field's edge.",
          zh: "农夫于田畔修耒耜。",
        },
      },
      {
        who: "scholar",
        kind: "gather",
        at: "court",
        count: 3,
        weight: 2,
        line: {
          en: "The ministers attend the first court of the year.",
          zh: "卿大夫朝于岁首。",
        },
      },
      {
        who: "guard",
        kind: "stroll",
        from: "gate-south",
        to: "office",
        line: {
          en: "The guard brings the eased prisoners' roll to the office.",
          zh: "卫士以省囹圄之籍至官署。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "market",
        to: "treasury",
        line: {
          en: "The porter carries the new year's grain to the state granary.",
          zh: "担夫负岁粟至太仓。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The lord's ploughing", zh: "亲耕籍田" },
        who: "overseer",
        at: "fields-east",
        count: 5,
        line: {
          en: "On the chosen day the lord pushes the plough three strokes in the royal field, the ministers five and nine behind him, and the court drinks in the great hall after.",
          zh: "择元辰，君三推于籍田，公五推，卿九推；反，执爵于大殿。",
        },
        cite: LIJI(1580, "月令 孟春: 天子親載耒耜，躬耕帝藉"),
      },
    ],
  },
  2: {
    note: {
      en: "The east wind. The wards sacrifice at the altar of the soil on a chosen day, the granaries are opened to the young and the orphaned, the fetters are struck off, and the market is measured with the year's corrected weights.",
      zh: "东风解冻。择元日命民社，安萌芽，养幼少，存诸孤；去桎梏，止狱讼；同度量，正市。",
    },
    tasks: [
      {
        who: "overseer",
        kind: "labour",
        at: "market",
        weight: 2,
        line: {
          en: "The market overseer sets the year's measures against the standard.",
          zh: "市令以法度正岁之量衡。",
        },
      },
      {
        who: "clerk",
        kind: "gather",
        at: "treasury",
        count: 2,
        line: {
          en: "The clerk issues grain from the state granary to the orphaned.",
          zh: "吏于太仓出粟存诸孤。",
        },
      },
      {
        who: "peasant",
        kind: "till",
        from: "gate-south",
        to: "fields-south",
        count: 2,
        weight: 3,
        line: {
          en: "The farmers go out of the south gate to plough.",
          zh: "农夫出南门耕。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "ward-3",
        to: "altar",
        line: {
          en: "A goodwife carries wine to the altar for the ward's sacrifice.",
          zh: "主妇负酒至社。",
        },
      },
      {
        who: "child",
        kind: "stroll",
        from: "ward-3",
        to: "fields-south",
        line: {
          en: "A child follows the ploughs out of the gate.",
          zh: "童子随犁出门。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The spring altar", zh: "春社" },
        who: "overseer",
        at: "altar",
        count: 5,
        line: {
          en: "The wards gather at the altar of the soil with a pig and wine; the meat is divided and the ward drinks.",
          zh: "百姓会于社，以豕与酒祭，分胙而饮。",
        },
        cite: LIJI(1590, "月令 仲春: 擇元日，命民社"),
      },
    ],
  },
  3: {
    note: {
      en: "The mulberry is in leaf and the plots inside the wall may not be cut. The women pick for the silkworms, and the master of works audits the five storehouses: the metal, the hides, the horn and bone, the feathers and shafts, the lacquer and glue.",
      zh: "桑叶生，毋伐桑柘。妇采桑饲蚕；工师审五库之量：金铁，皮革筋，角齿，羽箭干，脂胶丹漆。",
    },
    tasks: [
      {
        who: "weaver",
        kind: "stroll",
        from: "stall-west",
        to: "orchard",
        weight: 3,
        line: {
          en: "The weaver goes to the mulberry orchard for the day's leaves.",
          zh: "织妇至桑园采叶。",
        },
      },
      {
        who: "matron",
        kind: "labour",
        at: "orchard",
        weight: 2,
        line: {
          en: "The women of the ward pick mulberry for the trays.",
          zh: "里中妇人采桑饲箔。",
        },
      },
      {
        who: "overseer",
        kind: "stroll",
        from: "market",
        to: "foundry",
        weight: 2,
        line: {
          en: "The overseer audits the foundry's store of metal.",
          zh: "工师审铸铜坊之金。",
        },
      },
      {
        who: "overseer",
        kind: "stroll",
        from: "market",
        to: "carpenter",
        line: {
          en: "The overseer audits the carpenter's shafts and glue.",
          zh: "工师审木工坊之干与胶。",
        },
      },
      {
        who: "tanner",
        kind: "labour",
        at: "stall-south",
        line: {
          en: "The tanner lays out the hides for the audit.",
          zh: "皮工陈皮革以待审。",
        },
      },
    ],
  },
  4: {
    note: {
      en: "The wheat comes in and the lord tastes it with pork before the temple. The magistrate rides the county to hasten the harvest, the small offences are judged and the light prisoners let go, and the cocoon tax is gathered by the mulberry each house holds.",
      zh: "农乃登麦，以彘尝麦，先荐寝庙。司徒巡行县鄙，劝农勉作；断薄刑，决小罪，出轻系；收茧税，以桑为均。",
    },
    tasks: [
      {
        who: "clerk",
        kind: "stroll",
        from: "office",
        to: "gate-south",
        weight: 2,
        line: {
          en: "The magistrate's clerk rides out of the south gate to the county's fields.",
          zh: "吏出南门巡县鄙。",
        },
      },
      {
        who: "peasant",
        kind: "till",
        from: "fields-south",
        to: "treasury",
        count: 3,
        weight: 3,
        line: {
          en: "The farmers carry the wheat in through the gate to the state granary.",
          zh: "农夫负麦入城纳太仓。",
        },
      },
      {
        who: "guard",
        kind: "stroll",
        from: "gate-south",
        to: "office",
        line: {
          en: "The guard brings the light prisoners to the office to be released.",
          zh: "卫士引轻系至官署出之。",
        },
      },
      {
        who: "weaver",
        kind: "labour",
        at: "stall-west",
        weight: 2,
        line: {
          en: "The weaver reels the cocoons at her stall.",
          zh: "织妇于肆缫茧。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "ward-3",
        to: "office",
        line: {
          en: "A goodwife brings her ward's cocoon tax to the office.",
          zh: "主妇纳茧税于官署。",
        },
      },
    ],
  },
  5: {
    note: {
      en: "The longest day and the prayer for rain. The gates stand open and the market takes no toll; no dye is boiled, no ash burned, no cloth bleached in the sun; the heavy prisoners are fed better, and the musicians tune the drums and the bells.",
      zh: "日长至，大雩。门闾毋闭，关市毋索；毋艾蓝以染，毋烧灰，毋暴布；挺重囚，益其食；乐师调鼓钟。",
    },
    tasks: [
      {
        who: "musician",
        kind: "labour",
        at: "palace",
        weight: 3,
        line: {
          en: "The musician tunes the bells in the great hall for the rain prayer.",
          zh: "乐师于大殿调钟以待雩。",
        },
      },
      {
        who: "merchant",
        kind: "labour",
        at: "stall-east",
        weight: 2,
        line: {
          en: "The merchant trades untaxed while the market's tolls are lifted.",
          zh: "商贾于肆贸易，关市毋索。",
        },
      },
      {
        who: "dyer",
        kind: "stroll",
        from: "dyeworks",
        to: "market",
        line: {
          en: "The dyer, idle by ordinance, walks to the market.",
          zh: "染人以令罢工，步至市。",
        },
      },
      {
        who: "guard",
        kind: "stroll",
        from: "gate-south",
        to: "treasury",
        line: {
          en: "The guard draws the prisoners' better ration from the granary.",
          zh: "卫士自太仓取重囚之益食。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "market",
        to: "ferry",
        line: {
          en: "The porter carries goods down to the ferry through the open gate.",
          zh: "担夫负货出开门至津。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The great prayer for rain", zh: "大雩" },
        who: "musician",
        at: "altar",
        count: 5,
        line: {
          en: "The court prays for rain at the altar with the full music, and the hundred counties pray at their own altars for the grain.",
          zh: "大雩帝于社，用盛乐；百县雩祀以祈谷实。",
        },
        cite: LIJI(1627, "月令 仲夏: 大雩帝，用盛樂"),
      },
    ],
  },
  6: {
    note: {
      en: "The great rains. The counties send in their fodder for the sacrificial beasts, the dyeworks colour the court's robes by the old patterns and no other, and the moat is watched; no earthwork is raised and no levy called.",
      zh: "大雨时行。四监大合百县之秩刍以养牺牲；妇官染采，黼黻文章必以法故；视濠；不可以兴土功，不可以合诸侯，不可以起兵动众。",
    },
    tasks: [
      {
        who: "dyer",
        kind: "labour",
        at: "dyeworks",
        weight: 3,
        line: {
          en: "The dyer colours the court's robes in the ordained black, yellow, azure, and red.",
          zh: "染人染朝服，黑黄仓赤，莫不质良。",
        },
      },
      {
        who: "carrier",
        kind: "stroll",
        from: "gate-east",
        to: "stable",
        count: 2,
        weight: 2,
        line: {
          en: "The porters carry the counties' fodder to the royal stable.",
          zh: "担夫负百县之刍至厩。",
        },
      },
      {
        who: "ox",
        kind: "labour",
        at: "treasury",
        line: {
          en: "The ox is fed for the autumn sacrifice.",
          zh: "牛养以待秋祭。",
        },
      },
      {
        who: "guard",
        kind: "stroll",
        from: "gate-south",
        to: "bridge",
        line: {
          en: "The guard watches the moat rise at the bridge.",
          zh: "卫士于桥视濠水。",
        },
      },
      {
        who: "potter",
        kind: "labour",
        at: "kiln",
        line: {
          en: "The potter keeps the kiln dry through the rains.",
          zh: "陶人雨中守窑。",
        },
      },
    ],
  },
  7: {
    note: {
      en: "The cool wind. The court meets the autumn at the west gate and rewards the officers in the hall; the laws are read again, the prisons repaired, the walls and dykes made good, and the smithy is loud with the season's arms.",
      zh: "凉风至。迎秋于西郊，赏军帅武人于朝；修法制，缮囹圄，完堤防，谨壅塞；铁冶治兵。",
    },
    tasks: [
      {
        who: "smith",
        kind: "labour",
        at: "smithy",
        weight: 3,
        effect: "smoke",
        line: {
          en: "The smith beats out the season's spearheads.",
          zh: "铁工锻秋兵。",
        },
      },
      {
        who: "founder",
        kind: "labour",
        at: "foundry",
        weight: 2,
        effect: "smoke",
        line: {
          en: "The founder casts the bells for the autumn sacrifice.",
          zh: "冶人铸秋祭之钟。",
        },
      },
      {
        who: "guard",
        kind: "gather",
        at: "barracks",
        count: 3,
        weight: 2,
        line: {
          en: "The garrison drills on the barracks ground.",
          zh: "卒练于营。",
        },
      },
      {
        who: "carpenter",
        kind: "stroll",
        from: "carpenter",
        to: "gate-south",
        line: {
          en: "The carpenter goes to repair the prison's beams.",
          zh: "木工往缮囹圄。",
        },
      },
      {
        who: "clerk",
        kind: "labour",
        at: "office",
        line: {
          en: "The clerk copies out the laws afresh.",
          zh: "吏重书法令。",
        },
      },
    ],
    rites: [
      {
        title: { en: "Meeting the autumn", zh: "迎秋" },
        who: "overseer",
        at: "gate-west",
        count: 5,
        line: {
          en: "On the day autumn begins, the lord leads the ministers out of the west gate to meet the season, and rewards the officers in the hall on his return.",
          zh: "立秋之日，君帅卿大夫迎秋于西门；还，赏军帅武人于朝。",
        },
        cite: LIJI(1651, "月令 孟秋: 以迎秋於西郊"),
      },
    ],
  },
  8: {
    note: {
      en: "The geese come. The weights are made equal at the equinox, the barriers are eased and the merchants of the four quarters come in; the walls are built and the granaries dug in this month and no other, and the wards give thanks at the altar.",
      zh: "鸿雁来。日夜分则同度量，平权衡；易关市，来商旅；可以筑城郭，建都邑，穿窦窖，修囷仓；秋报于社。",
    },
    tasks: [
      {
        who: "merchant",
        kind: "stroll",
        from: "gate-east",
        to: "market",
        weight: 3,
        line: {
          en: "Merchants from the four quarters come in at the east gate to the market.",
          zh: "四方商旅自东门入市。",
        },
      },
      {
        who: "carrier",
        kind: "till",
        from: "market",
        to: "gate-north",
        count: 3,
        weight: 2,
        line: {
          en: "Labourers carry earth to the north wall, the one month the ordinance allows it.",
          zh: "役夫负土筑北墙，是月可以筑城郭。",
        },
      },
      {
        who: "overseer",
        kind: "labour",
        at: "market",
        line: {
          en: "The overseer levels the weights at the equinox.",
          zh: "市令于日夜分平权衡。",
        },
      },
      {
        who: "carpenter",
        kind: "stroll",
        from: "carpenter",
        to: "treasury",
        line: {
          en: "The carpenter goes to mend the state granary's roof.",
          zh: "木工往修太仓。",
        },
      },
      {
        who: "butcher",
        kind: "stroll",
        from: "stall-south",
        to: "altar",
        line: {
          en: "The butcher brings the pig to the altar for the thanksgiving.",
          zh: "屠者牵豕至社以报。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The autumn altar", zh: "秋社" },
        who: "overseer",
        at: "altar",
        count: 5,
        line: {
          en: "The wards gather at the altar of the soil to give thanks for the harvest.",
          zh: "百姓会于社报秋。",
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
      en: "The leaves fall. The great sacrifice and the tasting are held at the temple, the lord drills the hunt outside the walls to school the five arms, charcoal is burned, the frontier passes are closed, and the tombs' convicts are set to raising the tumulus.",
      zh: "草木黄落。大飨帝，尝，牺牲告备；天子教于田猎，以习五戎，班马政；伐薪为炭；固封疆，备边竟；城旦筑陵。",
    },
    tasks: [
      {
        who: "guard",
        kind: "stroll",
        from: "barracks",
        to: "gate-west",
        count: 3,
        weight: 3,
        line: {
          en: "The garrison rides out of the west gate to the hunt in file.",
          zh: "卒列队出西门田猎。",
        },
      },
      {
        who: "convict",
        kind: "labour",
        at: "tombs",
        weight: 2,
        line: {
          en: "The convicts raise the royal tumulus.",
          zh: "城旦筑王陵。",
        },
      },
      {
        who: "potter",
        kind: "labour",
        at: "kiln",
        effect: "smoke",
        line: {
          en: "The potter burns charcoal at the kiln.",
          zh: "陶人于窑烧炭。",
        },
      },
      {
        who: "butcher",
        kind: "stroll",
        from: "stall-south",
        to: "temple",
        line: {
          en: "The butcher leads the beasts to the temple for the great sacrifice.",
          zh: "屠者牵牺牲至宗庙。",
        },
      },
      {
        who: "scholar",
        kind: "stroll",
        from: "chancellor",
        to: "archive",
        line: {
          en: "The chancellor's scholar goes to the archive for the sacrificial order.",
          zh: "相府之士至藏室取祭典。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The great sacrifice", zh: "大飨" },
        who: "scholar",
        at: "temple",
        count: 5,
        line: {
          en: "The court holds the great sacrifice at the ancestral temple and tastes the year's grain.",
          zh: "大飨帝于宗庙，尝，牺牲告备。",
        },
        cite: LIJI(1679, "月令 季秋: 大饗帝，嘗，犧牲告備于天子"),
      },
    ],
  },
  10: {
    note: {
      en: "Winter is shut in. The master of works reports on the year's work: every vessel is stamped with its maker's name, and a fault is punished; the granaries and the walls are sealed, the lord puts on furs, and the year's-end offerings are laid at the altar and the gates.",
      zh: "闭塞成冬。工师效功，物勒工名，以考其诚，功有不当，必行其罪；固封玺，备边竟；天子始裘；大割祠于公社及门闾，腊先祖五祀。",
    },
    tasks: [
      {
        who: "overseer",
        kind: "stroll",
        from: "market",
        to: "kiln",
        weight: 3,
        line: {
          en: "The master of works reads the maker's mark on every pot at the kiln.",
          zh: "工师于窑考陶器之勒名。",
        },
      },
      {
        who: "founder",
        kind: "labour",
        at: "foundry",
        weight: 2,
        effect: "smoke",
        line: {
          en: "The founder stamps his name on the year's bronze.",
          zh: "冶人勒名于岁铸。",
        },
      },
      {
        who: "jadeworker",
        kind: "labour",
        at: "jadeworks",
        line: {
          en: "The jade grinder finishes the year's ritual pieces for inspection.",
          zh: "玉人成岁之礼器以待考。",
        },
      },
      {
        who: "clerk",
        kind: "gather",
        at: "office",
        count: 3,
        weight: 2,
        line: {
          en: "The workshop masters report the year's tally at the office.",
          zh: "百工效功于官署。",
        },
      },
      {
        who: "guard",
        kind: "labour",
        at: "gate-south",
        line: {
          en: "The guard seals the south gate for the winter.",
          zh: "卫士封南门以固冬。",
        },
      },
    ],
    rites: [
      {
        title: { en: "The offering at the altar and the gates", zh: "腊祭" },
        who: "overseer",
        at: "altar",
        count: 5,
        line: {
          en: "The wards lay the year's-end offering at the altar of the soil and at the gates, and the farmers are given their rest.",
          zh: "大割祠于公社及门闾，腊先祖五祀，劳农以休息之。",
        },
        cite: LIJI(1698, "月令 孟冬: 大割祠于公社及門閭，臘先祖五祀"),
      },
    ],
  },
  11: {
    note: {
      en: "The shortest day. No earthwork, no roof opened, no levy called; the palace is closed and its doors watched, the year's dead are recorded, and the workshops that keep going are the warm ones: the kiln, the foundry, the smithy.",
      zh: "日短至。土事毋作，毋发室屋及起大众；申宫令，审门闾，谨房室；饬死事；窑、冶、铁作不辍。",
    },
    tasks: [
      {
        who: "smith",
        kind: "labour",
        at: "smithy",
        weight: 3,
        effect: "smoke",
        line: {
          en: "The smithy is the warmest place in the ward.",
          zh: "铁冶为里中至暖之所。",
        },
      },
      {
        who: "potter",
        kind: "labour",
        at: "kiln",
        weight: 2,
        effect: "smoke",
        line: { en: "The potter fires the winter's ware.", zh: "陶人烧冬器。" },
      },
      {
        who: "clerk",
        kind: "labour",
        at: "office",
        weight: 2,
        line: { en: "The clerk records the year's dead.", zh: "吏饬死事。" },
      },
      {
        who: "guard",
        kind: "labour",
        at: "gate-palace",
        line: {
          en: "The guard keeps the palace gate shut through the short day.",
          zh: "卫士守宫门。",
        },
      },
      {
        who: "matron",
        kind: "stroll",
        from: "ward-3",
        to: "market",
        line: {
          en: "A goodwife comes to the market well in the snow.",
          zh: "主妇雪中至市井。",
        },
      },
    ],
  },
  12: {
    note: {
      en: "The waters freeze to the bottom. Ice is cut and stored, the fishers begin and the lord tastes the first fish before the temple, the seed grain is issued and the ploughs counted; at the year's end the exorcists drive the old year out through the gates.",
      zh: "水泽腹坚。命取冰，冰以入；命渔师始渔，天子亲往，乃尝鱼，先荐寝庙；告民出五种，计耦耕事；大傩，旁磔，出土牛，以送寒气。",
    },
    tasks: [
      {
        who: "carrier",
        kind: "till",
        from: "ferry",
        to: "treasury",
        count: 3,
        weight: 3,
        line: {
          en: "Labourers cut ice at the river and carry it in to the store.",
          zh: "役夫凿河冰，纳于凌阴。",
        },
      },
      {
        who: "clerk",
        kind: "gather",
        at: "treasury",
        count: 3,
        weight: 2,
        line: {
          en: "The clerk issues the seed grain and counts the ploughs.",
          zh: "吏出五种，计耦耕事。",
        },
      },
      {
        who: "peasant",
        kind: "stroll",
        from: "fields-south",
        to: "treasury",
        line: {
          en: "The farmer comes for the seed grain.",
          zh: "农夫至太仓受种。",
        },
      },
      {
        who: "butcher",
        kind: "stroll",
        from: "stall-south",
        to: "ferry",
        line: {
          en: "The butcher goes down to the ferry for the first fish of the year.",
          zh: "屠者至津取岁首之鱼。",
        },
      },
      {
        who: "musician",
        kind: "labour",
        at: "palace",
        line: {
          en: "The musician beats the drums for the exorcism.",
          zh: "乐师击傩鼓。",
        },
      },
    ],
    rites: [
      {
        title: { en: "Driving out the year", zh: "大傩" },
        who: "guard",
        at: "gate-south",
        count: 5,
        effect: "smoke",
        line: {
          en: "The exorcists drive the old year out through the gates with drums and torches, the beasts are quartered at the four gates, and a straw ox is set out to send the cold away.",
          zh: "大傩，旁磔于四门，出土牛，以送寒气。",
        },
        cite: LIJI(1721, "月令 季冬: 命有司大難，旁磔，出土牛，以送寒氣"),
      },
    ],
  },
};
