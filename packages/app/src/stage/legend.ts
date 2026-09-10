import type { Language } from "../lib/types";
import type { Decor, Marker, Terrain, Water } from "./catalog";

/**
 * What the map means. Every ground the geography paints, every piece of set
 * dressing it scatters, and every kind of place it marks carries a note: what
 * the thing is on the map, and how it fits the country the chronicle is set
 * in (c. 250 BCE, the Warring States). The explorer reads it when a reader
 * clicks the map.
 *
 * Grass is deliberately absent. It is the ground everything else is laid over
 * rather than a feature, so clicking it closes whatever was open.
 *
 * The notes are written, not translated: the two languages say the same thing
 * about the same object, but neither is a rendering of the other.
 */

export type Localized = Record<Language, string>;

export interface LegendNote {
  /** what to call it, in the reader's language */
  title: Localized;
  /** what it is on this map */
  what: Localized;
  /** how it fits the period */
  history: Localized;
}

/** The four things a reader can pick out of the map. */
export type LegendKind = "terrain" | "water" | "decor" | "place";

/** What to call each of them above the note. */
export const KIND_LABELS: Record<LegendKind, Localized> = {
  terrain: { en: "terrain", zh: "地形" },
  water: { en: "water", zh: "水" },
  decor: { en: "landmark", zh: "景物" },
  place: { en: "place", zh: "地名" },
};

/** The ground the whole map is laid on; picking it closes the panel. */
export const BARE_GROUND = "grass";

export const TERRAIN_NOTES: Partial<Record<Terrain, LegendNote>> = {
  tallgrass: {
    title: { en: "Tall grass", zh: "茂草" },
    what: {
      en: "Waist-high grass and reed on the wet bottomland of the river plains.",
      zh: "河原低湿之地，草苇没膝。",
    },
    history: {
      en: "The flood plains carried coarse grass no plough had taken. It gave thatch and grazing, slowed a column to a crawl, and hid an ambush well enough that campaign accounts name it.",
      zh: "泛滥之原，未经耕垦。可刈以为苫、以牧马，行军其中甚缓，亦足伏兵。",
    },
  },
  scrub: {
    title: { en: "Scrub", zh: "灌丛" },
    what: {
      en: "Thorn and low brush on the dry margins where the rainfall falls away.",
      zh: "雨少之地，荆棘丛生。",
    },
    history: {
      en: "The band between farmed and herded country. Poor for grain, fair for goats and horses, and the ground a frontier wall was built along rather than through.",
      zh: "农牧之交。不宜五谷，可牧羊马，长城多循此界而筑。",
    },
  },
  loess: {
    title: { en: "Loess", zh: "黄土" },
    what: {
      en: "Wind-laid yellow silt, cut into terraces and gullies.",
      zh: "风积黄壤，沟壑台地相间。",
    },
    history: {
      en: "The soil of the north-west. Deep, soft, and workable with the simplest tools, it let the western states feed large armies. It is also the silt that turned the River yellow and piled its bed above the plain.",
      zh: "西北之壤。土松易耕，故西方之国足以养兵。其土入水，即大河所以浊而善溢者。",
    },
  },
  steppe: {
    title: { en: "Steppe", zh: "草原" },
    what: {
      en: "Open short grass beyond the northern walls.",
      zh: "北垣之外，旷野短草。",
    },
    history: {
      en: "Horse country. The mounted peoples of the north raided it and lived off it, and it is the reason a northern court took up riding dress and mounted archery against the advice of its own ministers.",
      zh: "牧马之地。北狄游骑出没其间，赵武灵王胡服骑射之由此起。",
    },
  },
  road: {
    title: { en: "Post road", zh: "驰道" },
    what: {
      en: "Rammed-earth highway between courts, with stations along it.",
      zh: "夯土大道，沿途置驿。",
    },
    history: {
      en: "A state's reach was measured in days of march. Couriers, grain carts, and columns all moved on these, and a court that could not keep its roads could not tax the country at the far end of them.",
      zh: "国力所及，以行程日数计。传车、粮车、行伍皆由之；道不治则远地之赋不入。",
    },
  },
  cobble: {
    title: { en: "Paved way", zh: "石道" },
    what: {
      en: "Stone and gravel surfacing inside a city and at the approaches to a gate or ford.",
      zh: "城中及关津之口，铺石砾以为路。",
    },
    history: {
      en: "Cart traffic cut ruts a hand deep in earth within a season. Where the traffic could not be moved, the surface was.",
      zh: "车辙经时即深数寸。不能徙其车，则易其地。",
    },
  },
  wall: {
    title: { en: "Earthen wall", zh: "土垣" },
    what: {
      en: "A wall of earth tamped in courses between board forms, with a track along the top.",
      zh: "版筑夯土之垣，其上可行。",
    },
    history: {
      en: "Poured between boards a course at a time and tamped solid, in whatever earth the line ran through. The method wanted no brick, no stone, and no craftsman, which is why a court could reckon a wall in man-days and levy it the way it levied grain, and why the courses are still legible in what stands.",
      zh: "版筑之法：夹板实土，逐层夯之，就地取材而已。不用砖石，不待工匠，故其役可以人日计，如赋粟然。今所存者，层理犹可辨。",
    },
  },
  forest: {
    title: { en: "Woodland", zh: "林" },
    what: {
      en: "Mixed broadleaf standing timber.",
      zh: "杂木成林。",
    },
    history: {
      en: "Timber was a fiscal resource: chariots, siege towers, palace beams, and coffins all came out of it, and writers of the period already complain of hills cut bare and grazed after.",
      zh: "材木亦国用：车乘、攻具、宫室、棺椁皆取于此。时人已叹山林濯濯、牛羊继之。",
    },
  },
  bamboo: {
    title: { en: "Bamboo", zh: "竹" },
    what: {
      en: "Southern stands of standing cane.",
      zh: "南方竹林。",
    },
    history: {
      en: "The most useful plant in the country: crossbow stocks and arrow shafts, scaffolding and water pipe, and the strips on which every register, law, and treaty was written and tied.",
      zh: "用之至广：弩臂矢笴、架木水管，而简牍所以书律令图籍者，皆出于竹。",
    },
  },
  hills: {
    title: { en: "Hills", zh: "丘陵" },
    what: {
      en: "Low rolling swell above the plain.",
      zh: "平野之上，冈阜起伏。",
    },
    history: {
      en: "The ground a defensive line takes and a tomb is raised on. Terraces climbed the slopes where the plain below was already under the register.",
      zh: "守则据之，葬则封之。平田既尽，则辟坡为梯田。",
    },
  },
  mountain: {
    title: { en: "Range", zh: "山" },
    what: {
      en: "A lesser chain: the wall between one basin and the next.",
      zh: "小山连绵，隔盆地而为界。",
    },
    history: {
      en: "Armies did not fight for peaks. They fought for the few defiles through them, which is why a pass in a range was worth more than the range.",
      zh: "兵不争峰，而争其隘。故一关之得失，重于万山。",
    },
  },
  qinling: {
    title: { en: "The Qinling", zh: "秦岭" },
    what: {
      en: "The folded southern wall dividing the loess north from the warm, wet south.",
      zh: "南障重岭，分黄土之北与温湿之南。",
    },
    history: {
      en: "Crossed by plank roads pegged into the cliff faces, a few carts wide and cut at need. Those galleries are the whole connection between the western basin and the vale beyond, and every campaign south of the range turns on them.",
      zh: "栈道凿石架木，缘崖而行，宽仅容车，急则焚之。关中与汉中相通者，唯此而已，南征之成败系焉。",
    },
  },
  taihang: {
    title: { en: "The Taihang", zh: "太行山" },
    what: {
      en: "The eastern scarp dividing the uplands from the great plain.",
      zh: "东向陡崖，隔高原与大平原。",
    },
    history: {
      en: "A wall four hundred li long broken by a handful of gorge routes. The uplands on top of it command everything below, which is why the surrender of one upland commandery drew two great states into the worst battle of the age.",
      zh: "绵亘数百里，唯数陉可通。据其上则俯瞰平原，故上党之降，遂致两强大战。",
    },
  },
  luliang: {
    title: { en: "The Lüliang", zh: "吕梁山" },
    what: {
      en: "The range that rises straight out of the gorge and walls the river off from the Fen valley behind it.",
      zh: "拔起于峡岸之山，隔大河与汾川。",
    },
    history: {
      en: "The one range that wears the plateau it stands in: silt lies on its flanks and the gullies cut it the way they cut the open country across the water. Its crest is the far side of the gorge, so a state holding the Fen valley behind it faces the river down a wall it need not build.",
      zh: "此山亦戴黄土：坡有积壤，沟壑纵横，与河西高原无异。其脊即峡之东岸，故据汾川者，临河而有不筑之城。",
    },
  },
  shu: {
    title: { en: "The Shu crags", zh: "蜀山" },
    what: {
      en: "The broken western country walling in the far basin.",
      zh: "西方崇山，环抱远盆。",
    },
    history: {
      en: "Proverbially hard to enter. The state that finally took the basin behind them gained an irrigated plain that fed its armies for a century and a river road to float the grain down.",
      zh: "蜀道之难，自古而然。既取其地，则得沃野灌溉之利，百年之粮，且可浮江而下。",
    },
  },
  marsh: {
    title: { en: "Marsh", zh: "沼泽" },
    what: {
      en: "Standing water and reed bed.",
      zh: "积水生苇之地。",
    },
    history: {
      en: "Fish, fowl, reed, and in places salt, all of it outside the register. Chariots could not enter, so the marsh sheltered whoever wished not to be counted, and a court that drained one gained fields and taxpayers together.",
      zh: "有鱼鳖蒲苇，或产盐，皆不入籍。车不能入，故逃役者匿焉；一旦泄水成田，则地与民并得。",
    },
  },
  field: {
    title: { en: "Cropland", zh: "田" },
    what: {
      en: "Ploughed and ditched fields under millet, wheat, or rice.",
      zh: "已耕之田，沟洫具备，种黍麦稻。",
    },
    history: {
      en: "The unit the whole state apparatus is built on. Fields were measured, entered on the register, taxed by area, and granted outright for heads taken in battle: land was the currency in which military merit was paid.",
      zh: "国之根本。田有顷亩，著于版籍，按亩而税，以军功赐田：功名之酬，尽在于此。",
    },
  },
  earth: {
    title: { en: "Beaten earth", zh: "夯地" },
    what: {
      en: "The tamped yard a ward, a market, or a workshop floor stands on.",
      zh: "里巷、市肆、作坊所据之场院，夯土为地。",
    },
    history: {
      en: "Inside the wall nearly everything stood on packed earth: the market ground, the lanes between the wards, the floors of the workshops the excavators found at Lingshou and Boren. A Qin case form describes one house and its yard in this material, room by room, down to the height of the back wall and the lane behind it.",
      zh: "城中几无不以夯土为地：市场、里巷、灵寿与柏人所发掘之作坊地面皆然。秦简封诊式记一民居，堂、内、小堂、垣、巷，逐一以此为之。",
    },
  },
  platform: {
    title: { en: "Terrace", zh: "台基" },
    what: {
      en: "A raised platform of rammed earth, the base every hall of rank stands on.",
      zh: "夯土高台，宫室宗庙所基。",
    },
    history: {
      en: "Timber rots on wet ground and height is rank, so a palace, a temple, or an office was raised on a terrace of earth rammed in thin layers between boards. The palace quarter of the Zhongshan capital held seven of them; the one opened in the last few years carries a hall floor over a hundred metres long with brick paving, corridors, and drains. The Kaogongji states hall heights by dynasty, one measure of a ruler's standing.",
      zh: "木材畏湿，而高即是尊，故宫、庙、官署皆起于版筑夯土之台。中山灵寿城宫殿区有台基七处，近年所掘一处，殿基长逾百米，铺砖、有廊、有水道。考工记以堂崇几尺记三代之制，即是尊卑之度。",
    },
  },
  mulberry: {
    title: { en: "Mulberry", zh: "桑" },
    what: {
      en: "Orchard rows of pollarded mulberry, leaf for the silkworm.",
      zh: "桑园成行，剪其枝以饲蚕。",
    },
    history: {
      en: "Silk was the household's second crop and the state's second money: cloth passed as currency beside coin, and the tax fell on it. The classic homestead of five mu was to be planted with mulberry at its walls so that the old could wear silk; a town's orchards sat just inside or just outside the wall, where the women of the wards could reach them.",
      zh: "丝为一家之第二作，亦为一国之第二币：布帛与钱并行，赋亦取之。五亩之宅，树之以桑，则老者可以衣帛。桑园多在城郭内外之侧，便于里中妇人采之。",
    },
  },
  garden: {
    title: { en: "Garden", zh: "圃" },
    what: {
      en: "Beds of vegetables in rows, inside a wall or beside a house.",
      zh: "菜畦成行，在墙内或屋侧。",
    },
    history: {
      en: "The Odes have the household build its threshing floor and its garden in the ninth month, and the classic five-mu homestead kept its greens at the door beside its mulberry. Inside an elite compound the garden was a walled plot behind the inner chambers, tended by the household's own hands; the Zhouli lists a garden-keeper among the officers of the domain.",
      zh: "诗七月：九月筑场圃。五亩之宅，桑在其墙，蔬在其门。卿第之圃在寝之后，垣以围之，家人自治；周礼有场人、圃人之职。",
    },
  },
  plank: {
    title: { en: "Plank floor", zh: "地板" },
    what: {
      en: "The wooden floor inside a hall or a chamber, raised a step above the yard.",
      zh: "堂室之内木板铺地，高于庭一级。",
    },
    history: {
      en: "A hall of this age stood on its terrace with a boarded floor over the rammed earth, and the household sat, ate, and slept on mats laid over it: shoes came off at the step, and rank was where on the floor one sat. An outbuilding kept the beaten earth it was built on.",
      zh: "此世之堂立于台上，夯土之上铺板，家人席地而坐、而食、而卧：升阶脱屦，位在席次。庖厩之属则仍以夯土为地。",
    },
  },
  // the crops of the registered village (審時 names six grounds a field
  // bears; the foxtail millet is `field` above)
  millet: {
    title: { en: "Broomcorn millet", zh: "黍" },
    what: {
      en: "A block of broomcorn millet: the glutinous, early millet, a hand ahead of the foxtail in every month.",
      zh: "黍田：黏而早熟之谷，节节先禾一候。",
    },
    history: {
      en: "The Yueling's summer names the millet's ripening as the marker of the fifth month (登黍), and the Seventh Month sows early and late kinds together (黍稷重穋). The broomcorn was the grain of the feast and the ancestral offering, the wine grain, grown on one block where the foxtail took the rest.",
      zh: "月令仲夏登黍；七月黍稷重穋。黍为祭飨、酿酒之谷，一区种之，余皆禾稷。",
    },
  },
  wheat: {
    title: { en: "Wheat", zh: "麥" },
    what: {
      en: "A block of winter wheat: sown in the eighth month, green through the cold, gold and reaped in the fourth.",
      zh: "麦田：八月种，越冬而青，四月黄而刈。",
    },
    history: {
      en: "The Yueling has the officers urge the wheat sown in the eighth month with no delay allowed (勸種麥，毋或失時) and reports it in in the fourth (登麥); the Lüshi's agricultural chapters fix its furrows. Wheat was the one crop that stood in a field through winter, and the one that ripened when the millets' stores ran lowest, which is why the state pressed it.",
      zh: "月令仲秋乃劝种麦，毋或失时；孟夏农乃登麦。吕氏春秋任地、审时定其畎亩。麦独越冬立田，熟于青黄不接之时，故官劝之。",
    },
  },
  bean: {
    title: { en: "Beans", zh: "菽" },
    what: {
      en: "A block of soy beans, sown after the wheat and pulled in the tenth month.",
      zh: "菽田：麦后种，十月拔。",
    },
    history: {
      en: "The Seventh Month has the household boil beans in the sixth month (烹葵及菽) and bring the crops in in the tenth (十月納禾稼，黍稷重穋，禾麻菽麥); the Simin Yueling sows them after the wheat comes off. Beans were the poor household's flesh: the phrase for a hard year was 'bean gruel and water'.",
      zh: "七月六月烹葵及菽，十月纳禾稼，黍稷重穋，禾麻菽麦；四民月令麦后种大豆。菽为贫家之肉，岁凶则啜菽饮水。",
    },
  },
  hemp: {
    title: { en: "Hemp ground", zh: "麻田" },
    what: {
      en: "The hemp ground by the washing place: tall green stalks in summer, cut in the seventh month and retted in the brook.",
      zh: "麻田在浣处之侧：夏则青而高，七月刈之，沤于溪。",
    },
    history: {
      en: "The Seventh Month spins the hemp in the eighth month (八月載績) and gathers its seed in the ninth (九月叔苴), and the Chenfeng has the hemp retted in the moat (東門之池，可以漚麻). Hemp was every household's cloth and every mourner's garment; the male plants were cut for fibre and the female left for seed.",
      zh: "七月八月载绩，九月叔苴；陈风东门之池，可以沤麻。麻为编户之衣、居丧之服；牡麻刈以为纑，牝麻留以取实。",
    },
  },
  paddy: {
    title: { en: "Paddy", zh: "稻田" },
    what: {
      en: "The one wet block below the pond: flooded and set in spring, green over water in summer, gold in the ninth month.",
      zh: "陂下湿地一区：春灌而莳，夏青于水上，九月黄。",
    },
    history: {
      en: "The Seventh Month reaps rice in the tenth month for the spring wine (十月穫稻，為此春酒), and the Zhouli's officer of the paddies (稻人) keeps the dikes and channels that hold water on it. In the north rice was a wet corner of a dry country, grown where a pond let it be, and the wine it made was the ward's for the drinking rite.",
      zh: "七月十月获稻，为此春酒；周礼稻人掌稼下地，以潴畜水，以沟荡水。北土稻在陂泽之隅，酿为乡饮之酒。",
    },
  },
};

export const WATER_NOTES: Record<Water, LegendNote> = {
  river: {
    title: { en: "River", zh: "川" },
    what: {
      en: "A running channel: boundary, highway, and works all at once.",
      zh: "流水之道，既为疆界，亦为舟路、灌溉之源。",
    },
    history: {
      en: "Rivers set where a campaign could go, because the crossings were few and known. The same channels were cut for irrigation on a scale that made whole basins arable, and at the extreme a dyke was opened deliberately against a city.",
      zh: "津渡有数，故行军之路由水而定。开渠溉田，可使一方尽为沃壤；至于决堤灌城，则兵之酷者。",
    },
  },
  sea: {
    title: { en: "Sea", zh: "海" },
    what: {
      en: "The eastern water and its shallow gulf.",
      zh: "东海及其浅湾。",
    },
    history: {
      en: "Salt and fish. The eastern court's oldest revenue came off this shore, boiled out of sea water in iron pans, and the argument over whether a state should hold that trade itself begins here.",
      zh: "鱼盐之利。东国之富，始于煮海为盐；盐铁当官当民之议，肇端于此。",
    },
  },
};

export const DECOR_NOTES: Record<Decor, LegendNote> = {
  pine: {
    title: { en: "Pines", zh: "松" },
    what: {
      en: "Standing pine, usually planted rather than wild.",
      zh: "松树，多为人植。",
    },
    history: {
      en: "Pine and cypress were set at graves and altars, and cut for coffins and siege engines. A tree that keeps its colour through winter was already the stock emblem of someone who does not change with the season.",
      zh: "松柏植于墓社，材以为棺椁、攻具。岁寒不凋，古以喻士之不移。",
    },
  },
  bamboo: {
    title: { en: "Bamboo stand", zh: "竹丛" },
    what: {
      en: "A clump of cane beside a house or watercourse.",
      zh: "宅旁水边之竹。",
    },
    history: {
      en: "A household asset rather than scenery: arrow shafts, baskets, pipe, and the writing strips a clerk needed by the bundle.",
      zh: "非徒景物，乃家之财：矢笴、筐器、水管，及吏所需之简牍，皆取焉。",
    },
  },
  beacon: {
    title: { en: "Beacon tower", zh: "烽燧" },
    what: {
      en: "A rammed-earth mound carrying a brazier and a woodpile.",
      zh: "夯土为台，上置薪火。",
    },
    history: {
      en: "Set in a line along a frontier within sight of one another. Smoke by day and fire by night carried word of a raid to the court faster than any rider could.",
      zh: "沿边列置，相望而设。昼举烟，夜举火，警报之速，过于驿骑。",
    },
  },
  tumulus: {
    title: { en: "Burial mound", zh: "冢" },
    what: {
      en: "A raised earth mound over a tomb.",
      zh: "封土为丘，下有墓室。",
    },
    history: {
      en: "Rulers and ministers of this age built high mounds with approach ramps and pits for chariots and horses. The mound is a lineage's standing claim on the ground around it.",
      zh: "时之君卿，封土甚高，设墓道，瘗车马。丘存则族之有其地明矣。",
    },
  },
  stele: {
    title: { en: "Boundary stone", zh: "界石" },
    what: {
      en: "An upright cut stone at a field corner, a road, or a covenant site.",
      zh: "立石于田角、道旁、盟所。",
    },
    history: {
      en: "A register is only as good as the stone that fixes the corner it describes. Moving one was theft of a kind the law named specifically.",
      zh: "版籍所载，恃界石以定。移石侵地，律有专条。",
    },
  },
  boat: {
    title: { en: "River boat", zh: "舟" },
    what: {
      en: "A flat-bottomed craft working a river or the shore.",
      zh: "平底之舟，行于江河海滨。",
    },
    history: {
      en: "Water carried what a road could not. Grain that would have taken a month by cart came down in days, and the southern states kept standing boat corps as other states kept chariots.",
      zh: "陆运一月之粮，浮水数日可至。南国有舟师，犹北国之有车乘。",
    },
  },
  horses: {
    title: { en: "Horse herd", zh: "马群" },
    what: {
      en: "Grazing stock on open ground.",
      zh: "旷地牧马。",
    },
    history: {
      en: "The north-western and steppe margins were the stud country every court depended on. A state's strength was still quoted in thousands of four-horse chariots, and after the northern reform in mounted archers as well.",
      zh: "西北及塞下为牧地，诸侯资之。国之强弱，犹以千乘计；胡服之后，复以骑射计。",
    },
  },
  grove: {
    title: { en: "Orchard", zh: "果林" },
    what: {
      en: "Planted trees: mulberry above all, with jujube, chestnut, and peach.",
      zh: "所植之木，桑为先，兼有枣、栗、桃。",
    },
    history: {
      en: "Mulberry fed the silkworms, and silk was tax, tribute, gift, and in practice currency. An orchard was a taxable asset, which is exactly why burning one was a recognized act of war.",
      zh: "桑以饲蚕，帛为赋、为贡、为币。果林入税，故伐桑焚林，兵事之常。",
    },
  },
  rocks: {
    title: { en: "Outcrop", zh: "岩" },
    what: {
      en: "Bare stone standing out of the ground.",
      zh: "裸露之石。",
    },
    history: {
      en: "Quarried for wall footings, mill stones, and the standard weights a market officer kept. Where no stone was set, an outcrop served as the boundary it marked.",
      zh: "采以为墙基、碾磑、市官之权衡。无立石处，则以自然之岩为界。",
    },
  },
  cart: {
    title: { en: "Cart", zh: "牛车" },
    what: {
      en: "A two-wheeled ox cart standing unhitched.",
      zh: "两轮牛车，未驾。",
    },
    history: {
      en: "The cart carried grain to the granary and goods to the market, and the state counted them: a Qin law priced the hire of a cart and its driver, and a convoy turned back at a pass is a stage in the ladder of these games.",
      zh: "牛车输粟于仓，载货于市，而官计其数：秦律有雇车之直，车队返于关，亦是本局阶梯之一级。",
    },
  },
  chickens: {
    title: { en: "Chickens", zh: "鸡" },
    what: { en: "Fowl scratching in a yard.", zh: "鸡啄于场院。" },
    history: {
      en: "Every household kept them, and cockfighting is one of the pastimes the Zhanguoce lists for the people of Linzi beside dog-racing and the ball game.",
      zh: "家家畜之。斗鸡与走犬、蹴鞠并列，战国策所记临淄之民之所好也。",
    },
  },
  pigs: {
    title: { en: "Pigs", zh: "豕" },
    what: { en: "Pigs in a wallow by a hurdle.", zh: "豕卧泥中，旁有栅。" },
    history: {
      en: "The meat animal of the ward, penned in the yard and slaughtered for a feast or the ancestral offering. A pig under a roof is the character for home.",
      zh: "里中之肉畜，圈于院中，祭祀宴飨则杀之。豕在宀下，即家字。",
    },
  },
  rack: {
    title: { en: "Drying rack", zh: "晾架" },
    what: { en: "Cloth drying on bamboo poles.", zh: "竹竿晾布。" },
    history: {
      en: "Cloth left the loom in bolts of a fixed length and width, because it was money: a Qin statute sets the size of a bolt that may pass as currency and refuses one that falls short.",
      zh: "布出于机，长广有定，以其为币也：秦律定布之幅长，不中度者不得行。",
    },
  },
  pots: {
    title: { en: "Pottery", zh: "陶器" },
    what: {
      en: "A stack of earthenware waiting by a kiln or a stall.",
      zh: "陶器堆于窑侧或肆前。",
    },
    history: {
      en: "Grey ware for the kitchen, the well, and the grave, fired by the thousand in the workshop quarters excavated at the Zhongshan capital. The potter is one of the two trades of the Kaogongji's last division.",
      zh: "灰陶用于庖厨、汲水、随葬，灵寿作坊区所出以千计。陶人为考工记末一门二工之一。",
    },
  },
  woodpile: {
    title: { en: "Woodpile", zh: "柴堆" },
    what: {
      en: "Split firewood stacked between stakes.",
      zh: "劈柴叠于桩间。",
    },
    history: {
      en: "Fuel for the kitchen, the kiln, and the furnace. A town's wood came in by cart and by river, and the Fangmatan maps mark the timber stands of a whole district with their distances.",
      zh: "庖厨、陶窑、冶炉之薪。城中之柴以车以舟而至，放马滩地图标一县之林木及其里数。",
    },
  },
  banner: {
    title: { en: "Pennant", zh: "旌" },
    what: { en: "A narrow pennant on a bamboo pole.", zh: "竹竿挂长旌。" },
    history: {
      en: "Flown at an office, a gate, or a market to say the place is open and whose it is. The market flag went up for each of the three daily sessions and came down to close it.",
      zh: "立于官署、城门、市中，示其所属与启闭。市有三时之会，建旗则市，落旗则罢。",
    },
  },
  brazier: {
    title: { en: "Brazier", zh: "炉" },
    what: { en: "A bronze tripod of embers.", zh: "青铜三足炉，炭火犹燃。" },
    history: {
      en: "Heat and light for a hall in winter and a night watch on the wall. The Mohist siege chapters keep fires and torches at set intervals along the wall so the watch can see.",
      zh: "冬日堂上取暖，夜间城上照明。墨子备城门诸篇令沿城置火炬，以便守望。",
    },
  },
  haystack: {
    title: { en: "Haystack", zh: "草垛" },
    what: { en: "Fodder stacked round a pole.", zh: "刍草绕杆而积。" },
    history: {
      en: "Fodder and straw are two of the thirteen counts the Book of Lord Shang demands of a state that means to be strong, beside its horses and oxen.",
      zh: "刍、稿为商君书十三数之二，与马、牛并计，强国所必知也。",
    },
  },
  millstone: {
    title: { en: "Quern", zh: "石磨" },
    what: { en: "A rotary stone mill for grain.", zh: "旋转石磨，碾谷为粉。" },
    history: {
      en: "The rotary quern spread through the north in this age and turned millet and wheat into flour at the household's own door rather than in the mortar.",
      zh: "旋磨于此时行于北方，粟麦得于门前磨为粉，不必杵臼。",
    },
  },
  fence: {
    title: { en: "Wattle fence", zh: "篱" },
    what: {
      en: "Woven bamboo panels between posts.",
      zh: "竹编篱笆，立于桩间。",
    },
    history: {
      en: "The boundary of a yard, a pen, or a plot, and the line a case form measures a footprint against. A ward's outer wall was earth; inside it, the households divided themselves with wattle.",
      zh: "院、圈、畦之界，亦封诊式度足迹所依之线。里有垣，垣内诸家以篱相隔。",
    },
  },
  awning: {
    title: { en: "Awning", zh: "帷" },
    what: { en: "A cloth shade on four poles.", zh: "四竿张布为荫。" },
    history: {
      en: "The market's furniture: shade for a stall, a scribe, or the inspector who sat at the head of a row to settle disputes and collect the rent on the ground.",
      zh: "市中之具：肆、书吏、坐于列首以断争讼、收廛税之胥皆荫于此。",
    },
  },
  jars: {
    title: { en: "Storage jars", zh: "瓮" },
    what: {
      en: "Tall glazed jars for grain, water, or wine.",
      zh: "高瓮，贮谷、水、酒。",
    },
    history: {
      en: "A household's store stood in jars at the door, and so did a shop's. A Qin case form lists a burglary by what was in the room and what was taken from it.",
      zh: "一家之藏在门内之瓮，一肆亦然。封诊式记盗案，以室中所有、所失为目。",
    },
  },
  willow: {
    title: { en: "Willow", zh: "柳" },
    what: { en: "A single tree by water or a gate.", zh: "水边或门前一株。" },
    history: {
      en: "The tree of a moat's edge and of a parting: a branch broken from it was given to a traveller at the gate.",
      zh: "城濠之畔、送别之处所植：折柳赠行人于门。",
    },
  },
  dog: {
    title: { en: "Dog", zh: "犬" },
    what: { en: "A dog asleep in a yard.", zh: "犬卧院中。" },
    history: {
      en: "The watch of a house and, in the Zhanguoce's picture of Linzi, a sport: dog-racing was one of the pastimes the persuader listed to flatter a rich city.",
      zh: "守门之犬，亦战国策临淄之乐：走犬为说客所举以夸富城之一。",
    },
  },
  sheep: {
    title: { en: "Sheep", zh: "羊" },
    what: {
      en: "A few sheep grazing the fallow.",
      zh: "数羊食于休田。",
    },
    history: {
      en: "The sheep is one of the six domestic animals the Zhouli counts, and the northern states drove flocks on the steppe margin. A hamlet kept a handful for wool, felt, and the altar: a sheep is what a village sacrifice could afford where a court gave an ox.",
      zh: "羊为周礼六畜之一，北方诸国牧于塞上。一村畜数头，取毛取毡，亦以祭：村社用羊，朝廷用牛。",
    },
  },
  ducks: {
    title: { en: "Ducks", zh: "鹜" },
    what: {
      en: "Ducks on the muddy bank of the stream.",
      zh: "鹜在溪畔泥岸。",
    },
    history: {
      en: "A tame duck is a cheap bird for a house on water, and the Chu slips and the Qin kitchen accounts list fowl by the head among what a household or a post station kept. Where a hamlet had a pond or a ford, it had ducks.",
      zh: "临水之家养鹜甚易，楚简、秦厨簿以只计禽。村有陂有津，则有鹜。",
    },
  },
  plough: {
    title: { en: "Plough", zh: "耒耜" },
    what: {
      en: "A wooden plough with an iron share, left at the field's edge.",
      zh: "木耒铁刃，置于田畔。",
    },
    history: {
      en: "Iron shares cast in state foundries turned the ox-drawn plough from a lord's tool into a household's within this age, and the statutes of Qin issued iron tools from the county store and fined a farmer who wore one out. The plough at rest is the village's own wealth, counted with its oxen.",
      zh: "官冶铸铁刃，牛耕由公室之器渐为编户之具。秦律铁器出县库，敝之有罚。闲置之耒，一村之资，与牛并计。",
    },
  },
  hemp: {
    title: { en: "Hemp", zh: "麻" },
    what: {
      en: "Cut hemp stalks stood in a cone to dry.",
      zh: "麻秆束立成锥以晒。",
    },
    history: {
      en: "Hemp was the cloth of everyone who did not wear silk: the Odes have it sown in the spring and retted in the autumn, and the tax on cloth fell on the coarse weave as much as on the fine. The stalks in the yard are the household's clothing for the year.",
      zh: "麻为不衣帛者之衣：诗有种麻沤麻之事，布赋取粗布如取细绢。院中之麻，一家一岁之衣。",
    },
  },
  graves: {
    title: { en: "Family graves", zh: "族墓" },
    what: {
      en: "Low earth mounds in a row, the household's dead.",
      zh: "土冢成列，一家之先。",
    },
    history: {
      en: "The dead were buried by lineage on ground set apart at the village's edge, the Zhouli's grave officer keeping the rows in order of kin. A hamlet's graves are the register that outlasts the register: who was here and for how long, on a hill above the fields they cleared.",
      zh: "族葬于村外之地，周礼墓大夫掌其昭穆。村之族墓，籍之外之籍：何人在此，几世在此，冢在所垦之田上。",
    },
  },
  lantern: {
    title: { en: "Bronze lamp", zh: "铜灯" },
    what: {
      en: "A tall bronze lamp stand with its oil dish.",
      zh: "高铜灯台，上承油盏。",
    },
    history: {
      en: "The tomb of the Zhongshan king yielded a bronze lamp of fifteen branches, and every lit hall of the period was lit by stands like it, oil in a shallow dish and a wick of rush. A lamp at the door of a compound says the master receives at night.",
      zh: "中山王墓出十五连盏铜灯，是时堂上之明皆此类：浅盘盛油，灯芯用蔺。门前设灯，主人夜有所接。",
    },
  },
  tripod: {
    title: { en: "Ding cauldron", zh: "鼎" },
    what: {
      en: "A bronze tripod cauldron standing in the court.",
      zh: "铜鼎立于庭。",
    },
    history: {
      en: "The ding is a cooking vessel and a rank: a king set nine, a lord seven, a great officer five, and the Zhongshan king's nine were inscribed with his warning to his heir about the ministers who eat the state. One in the court of a house says what its master is entitled to.",
      zh: "鼎为食器亦为等：天子九，诸侯七，大夫五。中山王九鼎有铭，戒嗣子以食国之臣。庭中一鼎，见主人之位。",
    },
  },
  chariot: {
    title: { en: "Chariot", zh: "车" },
    what: {
      en: "A two-wheeled chariot standing idle, its pole on the ground.",
      zh: "两轮之车闲置，辕搁于地。",
    },
    history: {
      en: "A state was measured in chariots, a great house in the chariots it could field, and the royal tombs of Zhongshan and Zeng buried them by the pit. The Book of Lord Shang counts horses among the thirteen numbers; the chariot in the yard is the reason the count is kept.",
      zh: "国以乘计，大家以所出之乘计，中山、曾侯之墓以坑葬车。商君书十三数计马；院中之车，其所以计也。",
    },
  },
  plum: {
    title: { en: "Plum tree", zh: "梅" },
    what: {
      en: "A single plum tree, in blossom or in fruit.",
      zh: "梅树一株，或花或实。",
    },
    history: {
      en: "The plum flowers before the leaf and before the frost is gone, and the Odes sing of its falling fruit as the season for a match. One tree in a compound's garden is the calendar its household reads.",
      zh: "梅先叶而花，霜未尽而发；诗摽有梅，以落实为求偶之时。圃中一树，一家之历。",
    },
  },
  lotus: {
    title: { en: "Lotus pond", zh: "荷" },
    what: {
      en: "Lotus leaves and flowers on the still water of the compound's pond.",
      zh: "荷叶荷花覆于池上。",
    },
    history: {
      en: "The Odes put the lotus on the marsh beside the bank tree, and a house that could spare ground for water planted it: the root and seed were food, the flower the one ornament a garden had that a field did not.",
      zh: "诗云隰有荷华。宅有余地以蓄水者植之：藕与莲子可食，其花为圃中田所无之饰。",
    },
  },
  bells: {
    title: { en: "Bell chime", zh: "编钟" },
    what: {
      en: "A set of bronze bells hung by size on a wooden frame.",
      zh: "铜钟按大小悬于木簴。",
    },
    history: {
      en: "A chime of bells was the music of a court and the privilege of rank: Zeng's marquis was buried with sixty-five, the Zhongshan king with his own set, and the Zhouli fixes how many faces of bells a king, a lord, and an officer may hang. A frame in a hall means feasts with music and the musicians to play it.",
      zh: "编钟为朝廷之乐、爵位之饰：曾侯乙葬钟六十五，中山王亦有其钟，周礼定王、诸侯、大夫悬钟之面。堂有簴，则有燕乐，有乐工。",
    },
  },
  panel: {
    title: { en: "Lacquer screen", zh: "座屏" },
    what: {
      en: "A low painted screen set on the floor behind a seat.",
      zh: "置于座后之矮屏，髹漆彩绘。",
    },
    history: {
      en: "A small standing screen of lacquered wood, carved and painted, stood behind the master's seat to close the room round him. The Wangshan tomb at Jiangling kept one carved through with dozens of beasts and birds, and the Zhao hun's palace has kingfisher plumes on polished walls and hangings on jade hooks behind the lord.",
      zh: "漆木小座屏雕绘，立于主座之后以蔽室。江陵望山楚墓出一座屏，透雕禽兽数十；招魂所陈君室，砥室翠翘，挂曲琼。",
    },
  },
  armrest: {
    title: { en: "Armrest", zh: "几" },
    what: {
      en: "A low lacquered board on legs to lean on while sitting on the mat.",
      zh: "席上凭依之矮几，髹漆。",
    },
    history: {
      en: "One sat on a mat and leaned on a ji, and the ji told rank: the Liji has a man going to consult an elder carry the elder's armrest and staff behind him, and the Zhouli keeps an officer for the mats and armrests of the court. Chu tombs keep them in black lacquer painted red.",
      zh: "席地而坐，凭几而安，几以别尊卑：曲礼谋于长者必操几杖以从之，周礼设司几筵。楚墓所出，黑漆朱绘。",
    },
  },
  zither: {
    title: { en: "Se zither", zh: "瑟" },
    what: {
      en: "A long lacquered zither of twenty-five silk strings, laid flat to play.",
      zh: "二十五弦长瑟，髹漆，平置而鼓。",
    },
    history: {
      en: "The se was the house instrument of the age: the Zhanguoce says the people of Linzi all blow the yu and strike the se, the Zhao hun ends its feast with the bells rocking on their frame and the catalpa-wood se struck, and the Zeng marquis was buried with twelve. It plays in the hall and the women's rooms alike.",
      zh: "瑟为此世家常之乐：战国策言临淄之民无不吹竽鼓瑟，招魂宴罢铿钟摇簴、揳梓瑟，曾侯乙葬瑟十二。堂上房中皆鼓之。",
    },
  },
  drum: {
    title: { en: "Jian drum", zh: "建鼓" },
    what: {
      en: "A great barrel drum pierced by an upright post on a bronze base.",
      zh: "大鼓贯以长柱，立于铜座。",
    },
    history: {
      en: "The standing drum kept time for the bells and the dancers: the Zhao hun sets out the bells and beats the drums for a new song, and its dancers move to the yu, the se, and the pounded drum. The Zeng marquis's hall had one on a bronze base of coiling dragons.",
      zh: "建鼓与钟为节，与舞为节：招魂陈钟按鼓造新歌，竽瑟狂会搷鸣鼓。曾侯乙墓建鼓座为蟠龙铜铸。",
    },
  },
  canopy: {
    title: { en: "Curtain frame", zh: "帷帐" },
    what: {
      en: "A frame hung with gauze curtains to close off a bed or a corner of a room.",
      zh: "张罗帱之架，以隔床寝或室隅。",
    },
    history: {
      en: "Rooms were divided by cloth as much as by wall: the Zhao hun spreads gauze bed curtains against the fine mats and hangs kingfisher curtains and canopies in the high hall, and the Liji's rules of deportment say one does not hurry past a curtain or a screen. A curtain frame in the chamber is where the lady sleeps and dresses.",
      zh: "室以帷隔如以墙隔：招魂蒻阿拂壁、罗帱张，翡帷翠帐饰高堂；曲礼帷薄之外不趋。寝中帷帐，主妇所卧所妆。",
    },
  },
  liubo: {
    title: { en: "Liubo board", zh: "六博" },
    what: {
      en: "A lacquered game board with twelve pieces and six throwing sticks.",
      zh: "漆棋局一，棋十二，箸六。",
    },
    history: {
      en: "Liubo was the board game of the age, played for stakes: the Zhanguoce lists it among what the people of Linzi do with their days, and the Zhao hun's feast has ivory pieces on a bamboo board, the players pressing each other and shouting the throws. Boards of lacquered wood survive from Chu tombs at Jiangling.",
      zh: "六博为此世之博戏，博以为赌：战国策数临淄之民斗鸡走犬六博，招魂菎蔽象棋有六簙，分曹并进、呼五白。江陵楚墓有漆木博局。",
    },
  },
  wineset: {
    title: { en: "Wine service", zh: "羽觞" },
    what: {
      en: "A tray of lacquer ear cups with a bronze jar and ladle.",
      zh: "漆盘置耳杯，铜壶与勺。",
    },
    history: {
      en: "Wine was ladled from a jar into shallow lacquer cups with two ears, held in both hands: the Zhao hun fills the feather cups with honeyed jade wine and the guests drink on through the night. Chu tombs keep ear cups by the dozen, red inside and black without.",
      zh: "酒自壶勺入耳杯，双手执之：招魂瑶浆蜜勺实羽觞，娱酒不废沉日夜。楚墓耳杯数十，内朱外黑。",
    },
  },
  slips: {
    title: { en: "Bamboo slips", zh: "简册" },
    what: {
      en: "Bundles of bamboo writing strips bound with cord.",
      zh: "竹简编以绳，卷为册。",
    },
    history: {
      en: "A house kept its records on bamboo: the Mozi speaks of what is written on bamboo and silk, the Baoshan tomb of 316 BCE held the legal files of a Chu official bundled beside him, and the Changtaiguan tomb at Xinyang kept the inventory of its own furnishings. The steward's desk keeps the household's accounts the same way.",
      zh: "家藏文书于竹：墨子言书于竹帛，包山楚墓（前316年）随葬司法简册，信阳长台关楚墓有遣策记其陈设。宰案所记亦如是。",
    },
  },
  lamptree: {
    title: { en: "Lamp tree", zh: "连盏灯" },
    what: {
      en: "A bronze lamp stand branching into many small oil dishes.",
      zh: "铜灯树，枝分多盏。",
    },
    history: {
      en: "The tomb of King Cuo of Zhongshan at Lingshou yielded a bronze lamp of fifteen dishes on a tree of branches with monkeys and birds among them, the richest lamp of the age, and the Zhao hun lights its feast with orchid-oil candles in ornamented lamp stands. A lamp of many dishes lit the inner chamber after dark.",
      zh: "灵寿中山王墓出十五连盏铜灯，枝间有猴有鸟，为此世灯具之冠；招魂兰膏明烛，华镫错。寝中夜以此照。",
    },
  },
  mirror: {
    title: { en: "Bronze mirror", zh: "铜镜" },
    what: {
      en: "A polished bronze mirror on a stand beside a cosmetic box.",
      zh: "铜镜置架，旁有妆奁。",
    },
    history: {
      en: "A mirror was a cast bronze disc polished on its face and patterned on its back. The Zhanguoce has Zou Ji of Qi dress in court robes and look in his mirror before asking his wife whether he was handsomer than Lord Xu of the north wall, and the Chuci's Seven Remonstrances has a man adorn himself and look in the glass. Chu mirrors bear the mountain pattern.",
      zh: "铜镜面磨背纹。战国策邹忌朝服衣冠窥镜，问妻孰与城北徐公美；楚辞七谏修饰而窥镜。楚镜多山字纹。",
    },
  },
  garments: {
    title: { en: "Clothes rack", zh: "楎椸" },
    what: {
      en: "A rack of posts and a crossbar with robes hung from it.",
      zh: "衣架，二柱一横，悬衣其上。",
    },
    history: {
      en: "The Liji's rules for the inner quarters say husband and wife do not share a clothes rack, and a wife does not hang her clothes on her husband's rack or keep them in his chest; the rack is named there, and the rule shows the women's rooms kept their own. The Zhao hun's attendants wear figured silks.",
      zh: "内则曰男女不同椸枷，不敢悬于夫之楎椸，不敢藏于夫之箧笥；架见于礼，而东房自有其架。招魂侍女被文服纤。",
    },
  },
  basin: {
    title: { en: "Basin and ewer", zh: "盘匜" },
    what: {
      en: "A wide bronze basin with a spouted ewer for washing the hands.",
      zh: "铜盘与匜，以沃盥。",
    },
    history: {
      en: "Every rite of visiting begins with water poured from the ewer over the hands into the basin: the Yili names the washing before the guest is seated and the Zhouli assigns it to an office. Bronze basins and ewers stand in every noble tomb of the age.",
      zh: "宾至先沃盥，执匜沃水，盘承之：仪礼有沃盥之节，周礼有其职。贵族之墓皆有盘匜。",
    },
  },
  icechest: {
    title: { en: "Ice chest", zh: "冰鉴" },
    what: {
      en: "A bronze chest that holds a wine jar in packed ice.",
      zh: "铜鉴纳缶，周以冰。",
    },
    history: {
      en: "The Zhouli keeps an ice office to cut ice in winter and store it for the summer, the Zhao hun's feast pours wine strained of its lees and chilled until it is cool and clear, and the Zeng marquis's tomb yielded a pair of bronze ice chests, each holding a wine jar with room for the ice round it.",
      zh: "周礼凌人掌冰，冬藏夏用；招魂挫糟冻饮，酎清凉；曾侯乙墓出铜鉴缶一对，鉴纳缶，缶外置冰。",
    },
  },
  // the registered village
  target: {
    title: { en: "Archery target", zh: "侯" },
    what: {
      en: "The target (侯) on its frame at the threshing floor, stood up for the winter drill.",
      zh: "场上之侯，冬月习射时立之。",
    },
    history: {
      en: "The Yili's district archery (鄉射禮) stands the target at the end of the ground and shoots by pairs, the drum keeping time; the Yueling has the officers drill the men in the eleventh month. A ward's archery was its levy's training and its rite at once, and the cloth target with its painted centre is the one the rite names.",
      zh: "仪礼乡射礼张侯于场末，耦射而鼓节之；月令仲冬命将帅讲武习射。里之射，既教其卒，亦行其礼，侯布画鹄即礼所名。",
    },
  },
  altartree: {
    title: { en: "The altar's tree", zh: "社树" },
    what: {
      en: "An old broad tree on the altar mound beside the altar of the soil.",
      zh: "社坛之上老树一株。",
    },
    history: {
      en: "The Analects have the three dynasties plant their altars of soil with pine, cypress, and chestnut (夏后氏以松，殷人以柏，周人以栗), and the Zhouli's altar was a mound with a tree rather than a building. A 社 with no tree was not a 社; the tree was what the ward gathered under and what the pig was killed beside.",
      zh: "论语哀公问社，夏后氏以松，殷人以柏，周人以栗；周礼社坛树之以其野之所宜木。社无树不成社，里人会于其下，社豕杀于其侧。",
    },
  },
  vats: {
    title: { en: "Dye vats", zh: "染缸" },
    what: {
      en: "Clay vats at the washing place below the ford, for the sixth month's dyeing.",
      zh: "津下浣处陶缸数口，六月染缯于此。",
    },
    history: {
      en: "The Zhouli's dyer (染人) dyes silk in spring and the thread in summer, and the Seventh Month dyes the cloth black and yellow in the eighth for the lord's robe (載玄載黃，我朱孔陽). A village dyed at its water, since a vat is filled and emptied a dozen times, and the indigo and the madder were its own.",
      zh: "周礼染人春暴练，夏纁玄；七月载玄载黄，我朱孔阳，为公子裳。里之染在其水，缸注而泻者屡；蓝、茜自种。",
    },
  },
  ice: {
    title: { en: "Cut ice", zh: "凿冰" },
    what: {
      en: "Blocks of ice cut from the pond and stacked on the bank before they go into the ice house.",
      zh: "陂上凿出之冰块，堆于岸，将纳于凌阴。",
    },
    history: {
      en: "The Seventh Month cuts ice in the twelfth month and stores it in the first (二之日鑿冰沖沖，三之日納于凌陰), and the Zhouli's ice officer (凌人) takes three times what the summer will use. The ice was cut where the water stood still, carried up the bank, and packed in straw under the hill.",
      zh: "七月二之日凿冰冲冲，三之日纳于凌阴；周礼凌人掌冰，三其凌。冰凿于止水，舁于岸，藁裹而藏于山下。",
    },
  },
  cartload: {
    title: { en: "The levy's cart", zh: "赋车" },
    what: {
      en: "A cart loaded with fodder and straw, the ward's levy waiting at the lane.",
      zh: "刍藁满车，里之赋待发于道。",
    },
    history: {
      en: "The Qin field statute takes fodder and straw from every qing of land by weight (入芻三石，藁二石, 田律), whatever the harvest, and the ward carts it to the county. The grain tax came in the ninth month and the cloth with it; the loaded cart at the gate is the state's take made visible.",
      zh: "秦田律入顷刍三石、藁二石，不问丰歉，里输于县。九月纳粟，布帛随之；门前满载之车，即国之所取。",
    },
  },
  pestle: {
    title: { en: "Foot pestle", zh: "碓" },
    what: {
      en: "A treadle pestle in a yard: a beam on a pivot, its head dropping into a stone mortar.",
      zh: "院中踏碓：横木为杠，足踏其尾，杵落石臼。",
    },
    history: {
      en: "Millet is hulled before it is eaten, and the treadle pestle did with the foot what the hand pestle and mortar of the Odes did with the arm (或舂或揄). The Han pictorial stones show it in every farmyard, and Huan Tan credits it with ten times the mortar's work; it is the one machine a farmhouse owned.",
      zh: "粟必舂而后食，踏碓以足代或舂或揄之臂。汉画像石农院多有之，桓谭新论言其力十倍于杵臼；农家所有之机，唯此而已。",
    },
  },
  melons: {
    title: { en: "Melon patch", zh: "瓜" },
    what: {
      en: "Melon vines spreading over a bed by the house.",
      zh: "舍旁瓜蔓一畦。",
    },
    history: {
      en: "The Seventh Month eats melons in the seventh month (七月食瓜), and the Xinnantian ode grows them on the field bank for the ancestors (中田有廬，疆埸有瓜，是剝是菹，獻之皇祖). A melon patch at the gate was every household's, and the pickled melon its offering.",
      zh: "七月七月食瓜；信南山中田有庐，疆埸有瓜，是剥是菹，献之皇祖。门前瓜畦家家有之，菹以荐祖。",
    },
  },
  gourds: {
    title: { en: "Gourds", zh: "壶" },
    what: {
      en: "Bottle gourds ripening on a fence, cut down in the eighth month.",
      zh: "篱上壶卢垂垂，八月断之。",
    },
    history: {
      en: "The Seventh Month cuts the gourds in the eighth month (八月斷壺); dried, a gourd was a dipper, a bottle, a float for crossing water (the Odes' 匏), and its flesh a vegetable. The vine took the fence and cost nothing.",
      zh: "七月八月断壶；壶干则为瓢、为壶、为渡水之匏，其肉为蔬。蔓依篱而生，不费一畦。",
    },
  },
  jujube: {
    title: { en: "Jujube", zh: "枣" },
    what: {
      en: "A jujube tree by a gate, in red fruit in the eighth month.",
      zh: "门前枣树，八月实红。",
    },
    history: {
      en: "The Seventh Month knocks down the jujubes in the eighth month (八月剝棗) and cuts the rice in the tenth for the spring wine that keeps the old alive (以介眉壽). The jujube was the north's sweet fruit, dried for winter and stoned for the offering; the Zhouli lists it among the things the woman of the house brings to the rite.",
      zh: "七月八月剥枣，十月获稻，为此春酒，以介眉寿。枣为北土之甘果，干以过冬，去核以荐；周礼笾人实枣于笾。",
    },
  },
  chestnut: {
    title: { en: "Chestnut", zh: "栗" },
    what: {
      en: "A chestnut tree on the orchard's edge.",
      zh: "园边栗树。",
    },
    history: {
      en: "The Zhou planted their altars of soil with chestnut, and the Zhouli's basket-keeper offers chestnuts at the rites beside the jujubes and the dried peaches. The Dongmen ode has the chestnuts at the eastern gate where the houses of the ward stand (東門之栗，有踐家室).",
      zh: "周人以栗为社树；周礼笾人馈食之笾，其实枣、栗、桃、干䕩。东门之栗，有践家室。",
    },
  },
  peach: {
    title: { en: "Peach", zh: "桃" },
    what: {
      en: "A peach tree by a gate, in blossom in the second and third months.",
      zh: "门前桃树，二三月花。",
    },
    history: {
      en: "The Yueling opens the second month with the peach in flower (桃始華), and the wedding ode is set under it (桃之夭夭，灼灼其華，之子于歸). The peach was planted at the gate against ill fortune as much as for its fruit; a peach-wood bow shot the exorcism's arrows.",
      zh: "月令仲春桃始华；桃夭之诗，之子于归。桃植于门，禳凶亦取其实；桃弧棘矢，以除其灾。",
    },
  },
  // the registered house: the year's rites after the Yili
  bier: {
    title: { en: "Bier", zh: "柩车" },
    what: {
      en: "The coffin on its carriage, drawn to the graves by the household's men.",
      zh: "柩载于车，家人挽之以往墓。",
    },
    history: {
      en: "The Yili's rite of the burial (既夕禮) loads the coffin on its carriage at the gate before dawn, sets the banner on it, and has the mourners follow it out with the funeral goods carried before. The carriage was hung with curtains and drawn by men rather than horses at a 士's funeral.",
      zh: "仪礼既夕礼，质明载柩于车，铭旌置焉，明器陈于前，主人从之。士之柩车，惟裳帷，人挽而不驾。",
    },
  },
  coffin: {
    title: { en: "Coffin", zh: "殡" },
    what: {
      en: "The coffin laid in the west wing between the death and the burial, the mourners' places about it.",
      zh: "殡于西序，葬前所在，哭位环之。",
    },
    history: {
      en: "The Yili's rite of the death (士喪禮) washes and dresses the body, lays it in the coffin on the third day, and keeps it in the hall's west side under a canopy until the burial, the household wailing morning and evening in their places. A 士 was buried in the third month; a great officer waited five.",
      zh: "仪礼士丧礼，沐浴袭敛，三日而殡于西阶上，帷之，朝夕哭于位。士三月而葬，大夫五月。",
    },
  },
  mingjing: {
    title: { en: "Mourning banner", zh: "铭旌" },
    what: {
      en: "The red banner with the dead one's name, set at the west steps and carried before the bier.",
      zh: "书名之赤旌，竖于西阶，柩行则前导。",
    },
    history: {
      en: "The Yili writes the banner as 'the coffin of so-and-so of such a house' (某氏某之柩), on red cloth on a bamboo pole three feet long for a 士, set on the west step and carried at the head of the procession to the grave, where it is laid on the coffin. It is the one place the dead's name is written.",
      zh: "仪礼士丧礼为铭，各以其物，曰某氏某之柩，缁长半幅，赪末，竹杠长三尺，置于西阶上；既夕，铭旌前导，至圹置于柩上。",
    },
  },
  stalks: {
    title: { en: "Yarrow stalks", zh: "筮" },
    what: {
      en: "The diviner's yarrow stalks on their board, cast at the shrine gate to fix a day or a guest.",
      zh: "筮人之蓍，布于版，于庙门筮日、筮宾。",
    },
    history: {
      en: "The Yili's capping opens by divining the day at the shrine gate: the diviner faces west, the master's man states the matter, the stalks are cast and read, and the guest is divined the same way three days before. Yarrow decided what the ward's shell would have; a house of rank kept a diviner for it.",
      zh: "仪礼士冠礼，筮于庙门，筮人执策抽上韇，主人告事，卒筮书卦，宰告吉；前期三日筮宾。士以蓍不以龟。",
    },
  },
  victims: {
    title: { en: "The victims", zh: "牲" },
    what: {
      en: "The sheep and the pig tethered at the shrine gate on the day of a sacrifice.",
      zh: "祭日羊、豕系于庙门。",
    },
    history: {
      en: "The Yili's sacrifice at a 士's shrine (特牲饋食禮) presents one pig; a great officer's (少牢饋食禮) the small set, a sheep and a pig, inspected at the gate the evening before and killed at dawn. The invocator reports them whole and fat, which is what the rite calls 'announcing the victims'.",
      zh: "仪礼特牲馈食礼，士祭以豕一；少牢馈食礼，大夫祭以羊、豕，前夕视牲于庙门，质明杀之。祝告牲曰腯，是谓告牲。",
    },
  },
  caps: {
    title: { en: "The three caps", zh: "三冠" },
    what: {
      en: "The cloth cap, the leather cap, and the ceremonial cap on their tray, for the capping.",
      zh: "缁布冠、皮弁、爵弁陈于篚，以待冠者。",
    },
    history: {
      en: "The Yili caps a son three times at twenty: the black cloth cap first, the deerskin cap second, the dark ceremonial cap third, each with its own charge, and then names him with a courtesy name. The three lie ready on the west steps; a capped man is grown on the register and may be married, serve, and mourn as an adult.",
      zh: "仪礼士冠礼，三加：始加缁布冠，再加皮弁，三加爵弁，各有祝辞，既冠而字之。三冠陈于西阶下；既冠则成人，可以娶、可以仕、可以服。",
    },
  },
  torches: {
    title: { en: "Torches", zh: "庭燎" },
    what: {
      en: "Torches set in the forecourt at dusk, for a rite that runs into the night.",
      zh: "庭中燎火，昏后行礼所需。",
    },
    history: {
      en: "The Yili's wedding is at dusk and lights the courtyard with torches, and the rite of the death keeps a torch burning through the vigil. The Odes' 庭燎 is the palace court lit before dawn for the audience; a house lit its own court the same way with pitch-pine bound in bundles.",
      zh: "仪礼士昏礼昏时行礼，执烛前马；士丧礼宵为燎于中庭。诗庭燎，夜未央，庭燎之光。家燎以束松为之。",
    },
  },
  icecart: {
    title: { en: "Ice cart", zh: "冰车" },
    what: {
      en: "A cart bringing packed ice into the compound from the ice house.",
      zh: "自凌阴运冰入第之车。",
    },
    history: {
      en: "The Zhouli's ice officer stores ice in winter and issues it from spring: for the rites' victims, for the wine, and for the dead. The Yili's rite of the death sets a tray of ice under the body in the summer months (夏月用冰), which is what the cart is for in the eleventh month's stead when the month is hot.",
      zh: "周礼凌人冬藏冰，春始治鉴，祭祀共冰鉴，宾客共冰，大丧共夷盘冰。仪礼士丧礼夏月用冰，冰车所以供之。",
    },
  },
};

/**
 * Place kinds, keyed by the marker the map draws (a place with no marker is a
 * `region`: a named country rather than a settlement).
 */
export const MARKER_NOTES: Record<Marker | "region", LegendNote> = {
  court: {
    title: { en: "Court", zh: "都" },
    what: {
      en: "The walled seat of a ruling house.",
      zh: "诸侯之城，宗庙所在。",
    },
    history: {
      en: "A capital of this age is two enclosures: an inner city holding the palace and the ancestral temple, and an outer city of markets, workshops, and the households the register counts. The archives, the granaries, and the mint are all inside the wall.",
      zh: "时之国都，内城有宫室宗庙，外郭有市肆工坊、编户之民。图籍、仓廪、铸钱之官，皆在城中。",
    },
  },
  town: {
    title: { en: "Town", zh: "邑" },
    what: {
      en: "A walled settlement held under a court.",
      zh: "属于国都之城邑。",
    },
    history: {
      en: "Where the county replaced the granted fief: a governor appointed from the capital and dismissed from it, with the town's households entered on the register rather than owed to a lord.",
      zh: "废封建而置县：令长由中央除授，亦由中央免之；民著于籍，不属私门。",
    },
  },
  pass: {
    title: { en: "Pass", zh: "关" },
    what: {
      en: "A gated defile through a range.",
      zh: "山间隘口，设关而守。",
    },
    history: {
      en: "Holding a pass substituted for holding a border. It is where a state searched travellers, checked their permits, taxed the goods, and closed the country outright when it chose to.",
      zh: "有关则不必守境。稽察行人，验其传符，征其货税，闭关则国自绝于外。",
    },
  },
  ford: {
    title: { en: "Ford", zh: "津" },
    what: {
      en: "A crossing place on a river.",
      zh: "可渡之处。",
    },
    history: {
      en: "Crossings were few and every general knew them, so the route of a campaign was chosen by them. A garrison sitting on a ford was worth an army in the open field.",
      zh: "津渡有限，将帅尽知，故进兵之路由此而定。守津之卒，胜于野战之师。",
    },
  },
  field: {
    title: { en: "Field station", zh: "田官" },
    what: {
      en: "Marked cropland held and worked under the register.",
      zh: "著籍之田，官为经理。",
    },
    history: {
      en: "Land measured by area, taxed by area, and granted for military merit. The clerk who walked the boundary mattered as much to the state's revenue as the peasant who ploughed it.",
      zh: "计亩而税，以功赐田。行界之吏，于国用之重，不减耕者。",
    },
  },
  works: {
    title: { en: "Works", zh: "工" },
    what: {
      en: "A state work site: waterworks, walls, or a foundry.",
      zh: "官营工地：水利、城垣、冶铸。",
    },
    history: {
      en: "Raised by corvée. The same conscript gangs that cut a canal one season built a frontier wall the next, and the labour owed was recorded against a household exactly as the grain was.",
      zh: "皆以徭役成之。今岁凿渠，明岁筑塞，力役之数，与租谷同著于籍。",
    },
  },
  harbour: {
    title: { en: "Harbour", zh: "港" },
    what: {
      en: "A shore anchorage for coastal craft.",
      zh: "海滨泊舟之所。",
    },
    history: {
      en: "Traffic hugged the coast rather than crossing open water. Salt, fish, and timber moved along the shore, and a harbour was as much a customs post as a haven.",
      zh: "舟行循岸，不越大洋。盐鱼材木由此转输，港亦榷税之地。",
    },
  },
  camp: {
    title: { en: "Camp", zh: "营" },
    what: {
      en: "A field encampment, ditched and palisaded.",
      zh: "野营，掘沟立栅。",
    },
    history: {
      en: "The army of this age is a conscript host counted in hundreds of thousands, and it fortifies the ground it stands on every night. A campaign is mostly two such camps facing each other while the grain behind them runs down.",
      zh: "时之兵，动辄数十万，宿则营垒必固。两军相持，实相待其粮尽而已。",
    },
  },
  hall: {
    title: { en: "Hall", zh: "堂" },
    what: {
      en: "A meeting hall: the seat of a council or a school, not of a state.",
      zh: "议事之所，属会盟或学派，非一国之都。",
    },
    history: {
      en: "Bodies without land still had somewhere to sit. A league's hall or a school's gate could summon envoys from courts that would not receive one another.",
      zh: "无土之众，亦有其所。盟府学门，能致诸国之使，虽其国不相往来。",
    },
  },
  saltern: {
    title: { en: "Saltern", zh: "盐场" },
    what: {
      en: "Evaporation pans and boiling sheds on the shore.",
      zh: "海滨盐池煮盐之场。",
    },
    history: {
      en: "Sea water boiled down in iron pans. Salt is the one commodity every household must buy, which is what makes it the first thing a state proposes to sell itself.",
      zh: "以铁釜煮海。盐者家家必市之物，故国之榷利，未有不自盐始者。",
    },
  },
  market: {
    title: { en: "Market", zh: "市" },
    what: {
      en: "The enclosed market quarter of a city.",
      zh: "城中之市，有垣有门。",
    },
    history: {
      en: "Markets were walled, opened and closed by drum, watched by an officer with standard weights, and taxed at the gate. The great merchant houses of the age grew up inside them, wealthy enough to lend to courts.",
      zh: "市有墙垣，鼓声启闭，市官掌其权衡，入门而税。巨贾生于其中，其富足以贷于诸侯。",
    },
  },
  academy: {
    title: { en: "Academy", zh: "学宫" },
    what: {
      en: "A school of scholars kept at a court's expense.",
      zh: "国养学士之所。",
    },
    history: {
      en: "Stipends and rank without office, on the condition that the holders argue policy where the ruler could hear it. Rival schools sat in the same compound and their disputes are much of what survives of the period's thought.",
      zh: "受禄赐爵而不任职，惟议国事以闻于君。诸家并处，其争辩即百家之言所由传。",
    },
  },
  altar: {
    title: { en: "Altar", zh: "社" },
    what: {
      en: "The altar of soil and grain: a state's own existence, in one place.",
      zh: "社稷之坛，国之所以为国。",
    },
    history: {
      en: "To extinguish a state was to level its altar and carry off what stood on it. The tripods of the old royal house held the same relation to the realm, which is why asking their weight was treason rather than curiosity.",
      zh: "灭国者夷其社，迁其重器。九鼎之于天下亦然，故问鼎轻重，非问也，僭也。",
    },
  },
  weir: {
    title: { en: "Weir", zh: "堰" },
    what: {
      en: "A dam or sluice thrown across a channel.",
      zh: "横截水道之坝闸。",
    },
    history: {
      en: "The great works of the age are weirs and the canals they feed, and they raised harvests enough to decide which states could field armies. A weir is also the fastest way to drown a province, and both uses are on the record.",
      zh: "时之大工，堰渠而已，成则岁入倍增，足以决国之强弱。然启闭之间，亦可沉一方之地：二者皆见于史。",
    },
  },
  region: {
    title: { en: "Region", zh: "域" },
    what: {
      en: "A named country: a stretch of land rather than a settlement.",
      zh: "地域之名，非城邑。",
    },
    history: {
      en: "Some of these names are older than any state now holding them and outlast the ones that follow. A court can be moved and a wall rebuilt; the name of the country between two ranges tends to stay where it is.",
      zh: "其名或先于今之诸侯，亦后于将来之国。都可迁，城可改，而两山之间地名不易。",
    },
  },
  canal: {
    title: { en: "Canal", zh: "渠" },
    what: {
      en: "A cut channel carrying water, and boats, where no river ran.",
      zh: "凿地引水之道，兼可通舟。",
    },
    history: {
      en: "The most productive thing a state of this age could spend a hundred thousand labourers on. A canal waters terrace ground that grain would not grow on, and it carries the tax of one province to the army of another at a fraction of what carts cost.",
      zh: "此世发十万之众所为，无过于此者。渠可溉舄卤之田，又可漕一方之粟以给他方之军，其费不及车运什一。",
    },
  },
  dike: {
    title: { en: "Dike", zh: "堤" },
    what: {
      en: "A raised earth bank holding a river off the plain it would otherwise take.",
      zh: "筑土以束水，使不没平原。",
    },
    history: {
      en: "The River runs above its own plain, so the plain lives behind banks that have to be maintained every year by whoever holds them. A dike is therefore both the most expensive public work on the map and a weapon: cutting one drowns a neighbour's harvest without crossing his border.",
      zh: "河高于野，故平原恃堤而居，岁岁修之。堤者，天下之大役，亦兵器也：决之则邻国之稼尽没，而未尝出境。",
    },
  },
  tomb: {
    title: { en: "Royal tombs", zh: "陵" },
    what: {
      en: "The burial mounds of a ruling house, walled and served by a guard.",
      zh: "王室之葬，有垣有守。",
    },
    history: {
      en: "A house's tombs are where its claim is kept. Sacrifice at them is what makes a ruler the heir rather than the occupant, which is why an invader who wanted to end a house rather than beat it burned the tombs first and the palace second.",
      zh: "宗庙陵墓，所以存其统也。祭于陵者乃为嗣君，非徒据其位。故欲绝人之国者，先焚其陵，后毁其宫。",
    },
  },
  wall: {
    title: { en: "Long wall", zh: "长城" },
    what: {
      en: "A rammed-earth wall run along a ridge line, with towers at intervals.",
      zh: "循山脊而筑之土垣，间置亭燧。",
    },
    history: {
      en: "Not a border and not a barrier a large army could not cross. It is a line that a raiding party cannot cross with stolen cattle: it slows them at the wall, and the beacons on it buy the garrison behind the time to ride out.",
      zh: "非疆界，亦非大军所不能越。其所御者，掠而归之骑耳：牛马难逾，烽火既举，后军得以出。",
    },
  },
  foundry: {
    title: { en: "Foundry", zh: "冶" },
    what: {
      en: "Furnaces, bellows, and casting floors where ore becomes iron.",
      zh: "鼓橐、炉冶、范铸之所。",
    },
    history: {
      en: "Cast iron came early here and changed two things at once: a plough that turns heavy soil, and a crossbow lock that a peasant can be handed and taught in a week. States that held ore and charcoal together taxed the trade heavily and often took it into their own hands.",
      zh: "铸铁之术早成，其效有二：耒耜可耕重壤，弩机可授农夫而旬日能用。有矿有炭者，重税其利，往往收为官营。",
    },
  },
  mint: {
    title: { en: "Mint", zh: "钱府" },
    what: {
      en: "The office that casts coin and stamps the weight it is worth.",
      zh: "铸钱之官，权其轻重而刊之。",
    },
    history: {
      en: "Coin here is cast, not struck, in shapes that say whose it is: spades in the old northern lands, knives in the east, round coin with a square hole in the west. Because the metal is the value, a state that casts light coin at the old face is taxing everyone who holds the old coin.",
      zh: "钱皆范铸，其形示国：北地为布，东方为刀，西方为圜金方孔。以铜为直，故轻其铸而仍其名者，是取民之藏钱而税之。",
    },
  },
  bridge: {
    title: { en: "Bridge", zh: "梁" },
    what: {
      en: "A timber crossing on piles, wide enough for carts.",
      zh: "架木为梁，可通车。",
    },
    history: {
      en: "Rarer than fords and worth more: it carries a supply train in weather that would stop a crossing. It is also the thing a retreating army destroys behind it, which is why the accounts of a campaign so often turn on who reached one first.",
      zh: "梁少于津而用重：虽水涨亦可运粮。退军必焚之，故战纪所载，常在先至者。",
    },
  },
  ferry: {
    title: { en: "Ferry", zh: "渡" },
    what: {
      en: "A landing with boats, where the water is too deep to wade.",
      zh: "水深不可涉，置舟以济。",
    },
    history: {
      en: "The ferry is the ford's expensive cousin: it needs boats, boatmen, and a landing on both banks, so it belongs to whoever holds the near bank. Refusing passage at one is an act short of war that stops an army as thoroughly as a battle would.",
      zh: "渡者，津之费者也：须舟、须人、须两岸之埠，故属近岸之主。绝人之渡，未及于战，而止敌之师与战同。",
    },
  },
  waystation: {
    title: { en: "Way station", zh: "亭传" },
    what: {
      en: "A posting house on a trunk road: fresh horses, a bed, a register of who passed.",
      zh: "官道之传舍：易马、宿客、录过所之人。",
    },
    history: {
      en: "The nervous system of an administered state. Relays of horses carry an order faster than any army moves, and the register at each station is how a man travelling without a permit is caught — including, once, the minister who wrote the permit law.",
      zh: "治国之脉络也。传马递书，速于行军；过所之籍，所以得无传而行者——其法之所自出者，亦尝为之所困。",
    },
  },
  "beacon-tower": {
    title: { en: "Beacon tower", zh: "烽燧" },
    what: {
      en: "A tower on high ground with wood and dung ready to fire.",
      zh: "据高而筑，积薪与粪以待举。",
    },
    history: {
      en: "Smoke by day, fire by night, and a signal that outruns a horse: a raid on the frontier is known at the court behind it within hours. The system is old enough by this period that its most famous story is already a cautionary one about lighting the beacons for no reason.",
      zh: "昼则燔烟，夜则举火，其速过于走马：边有寇警，数刻而闻于内。其制已古，故有戏举烽火而失信于诸侯之戒。",
    },
  },
  ruin: {
    title: { en: "Ruin", zh: "墟" },
    what: {
      en: "A walled place that was taken and not rebuilt.",
      zh: "城破而不复者。",
    },
    history: {
      en: "Sacking a city was rarely the point; moving its households onto another register usually was. What is left when the register moves is a wall with nothing behind it, and the map of this period is dotted with them long after the campaign that made them is forgotten.",
      zh: "屠城非其本意，徙其民而著于新籍者，乃所欲也。民徙则城空，垣存而无人。当时之图，处处有之，而致之之役久已忘矣。",
    },
  },
  shrine: {
    title: { en: "Shrine", zh: "祠" },
    what: {
      en: "A small enclosure where a local spirit or a dead man is served.",
      zh: "小垣之内，祀土神或先人。",
    },
    history: {
      en: "Below the ancestral altars of the houses lies a much older layer of local worship: the god of a river reach, the spirit of a hill, an official the district decided to keep feeding after his death. States that reformed hard tended to leave these alone, because putting them down cost more than they were worth.",
      zh: "宗庙之下，尚有里社之祀：一川之神、一丘之灵、殁而民不忍绝食之吏。变法之国多不禁焉，禁之所费，逾其所得。",
    },
  },
  falls: {
    title: { en: "Falls", zh: "瀑" },
    what: {
      en: "A river forced into a slot in the rock and dropped down it.",
      zh: "水束于石罅而坠。",
    },
    history: {
      en: "A hard stop on a river road. Grain and timber moving down the water had to come out above it and go back in below, which put a portage, a market, and a place worth taxing wherever one falls.",
      zh: "水道之绝处也。粟材顺流而下者，必上岸而复入，故瀑下多有陆运、有市、有征。",
    },
  },
  peak: {
    title: { en: "Sacred peak", zh: "岳" },
    what: {
      en: "A mountain a court sacrifices to, not one it marches over.",
      zh: "国之所祀，非所越也。",
    },
    history: {
      en: "By this century a handful of peaks were held to stand for the well-being of a state, though which ones was not yet fixed and would not be for another two hundred years. A ruler who sacrificed at one was making a claim about his standing, which is why the question of whether he was entitled to was worth a minister's argument.",
      zh: "是时已有以数山系国之休咎者，然其名未定，后二百年乃著。人君祭岳，所以自表其位，故可否之辩，臣下争之。",
    },
  },
  gorge: {
    title: { en: "River gate", zh: "水门" },
    what: {
      en: "A place where the whole river is forced between two rock walls.",
      zh: "全河束于两崖之间。",
    },
    history: {
      en: "Attributed to Yu, who was said to have cut them to let the flood out. What they are in practice is a gate: a narrows no boat passes at will and no army crosses off a ford, so whoever holds both banks of one holds the river.",
      zh: "相传禹所凿，以泄洪水。其实为门：舟不得任过，兵不得越渡，故据两岸者制河。",
    },
  },
  gate: {
    title: { en: "City gate", zh: "城门" },
    what: {
      en: "A gate through the town wall, with a tower over it.",
      zh: "城墙之门，上有门楼。",
    },
    history: {
      en: "The ideal capital has three gates a side and the town of Xue still shows twelve. A gate is where the state met the traveller: the permit checked, the goods taxed, the leaves shut at dusk and in a siege. The Mohist chapters on defence begin with the gate, because a wall is only as strong as its openings.",
      zh: "匠人营国，旁三门；薛城至今存门十二。门者，国之待客处：验符传，税其货，暮则闭，围则塞。墨子守御之篇始于备城门，以城之强弱系于其门也。",
    },
  },
  tower: {
    title: { en: "Watchtower", zh: "望楼" },
    what: {
      en: "A timber platform on the wall or at its corner.",
      zh: "城上或城隅之木台。",
    },
    history: {
      en: "The Kaogongji sets a city corner at nine zhi, a palace corner at seven, and a gate at five: height by rank. From the platform the watch read the beacons on the hills and counted what came up the road.",
      zh: "考工记：城隅九雉，宫隅七雉，门阿五雉，以高为等。守者据之望山上烽燧，计道上来者。",
    },
  },
  temple: {
    title: { en: "Ancestral temple", zh: "宗庙" },
    what: {
      en: "The hall of the ruling line's ancestors, on the left of the palace.",
      zh: "宗室先祖之庙，在宫之左。",
    },
    history: {
      en: "Temple on the left, altar of soil on the right, court in front, market behind: that is the ideal plan. A ruler was installed here, a covenant sworn here, a campaign announced and its spoils reported here. To lose the temple is what the texts mean by a state being extinguished.",
      zh: "左祖右社，面朝后市，此营国之制。即位于此，盟誓于此，出师告庙、献捷告庙。宗庙不守，即所谓国灭。",
    },
  },
  granary: {
    title: { en: "Granary", zh: "仓" },
    what: {
      en: "Raised bins and a storehouse for the state's grain.",
      zh: "架空之囷与仓房，贮官粟。",
    },
    history: {
      en: "The Qin granary statute is the most detailed law of the age: grain sealed in by the official who received it, opened by the one who issues it, counted at each, and any shortfall charged to the men whose seals were on the door. Granaries are the first of the thirteen counts the Book of Lord Shang requires.",
      zh: "秦仓律为一代最详之法：入粟者封之，出粟者启之，出入皆计，亏则责封印之人。商君书十三数，仓为首。",
    },
  },
  well: {
    title: { en: "Market well", zh: "市井" },
    what: {
      en: "A stone-lined well with its frame and bucket.",
      zh: "砌石之井，有栏有桶。",
    },
    history: {
      en: "The word for market is the market well, because the traders gathered where the water was. The Guanzi puts the merchants at the well and the artisans by the offices, each order in a quarter of its own so that a son learns his father's trade without being told.",
      zh: "市井之名，以商贾聚于汲水之所也。管子处商就市井，处工就官府，四民各有其居，使子弟不教而能。",
    },
  },
  kiln: {
    title: { en: "Pottery kiln", zh: "陶窑" },
    what: {
      en: "A domed earth kiln with pots stacked to fire.",
      zh: "穹顶土窑，陶坯待烧。",
    },
    history: {
      en: "The pottery quarter of the Zhongshan capital lay in the western city among the commoners' houses, and the Zhao town of Boren gave up an intact kiln in its last season. Grey ware, roof tile, and the moulds a mint or a foundry cast from all came out of ovens like this one.",
      zh: "中山灵寿城陶作坊在西城民居之间，赵柏人城近岁掘出完整陶窑一座。灰陶、瓦当、铸钱铸器之范，皆出于此。",
    },
  },
  smithy: {
    title: { en: "Iron smithy", zh: "铁冶" },
    what: {
      en: "An open shed with a furnace, an anvil stone, and bellows.",
      zh: "敞棚之下，炉、砧、橐俱备。",
    },
    history: {
      en: "The town of Xue held three iron workshops inside its wall. Cast iron for the plough and the hoe was what let a state feed the armies it raised; the six metal trades of the Kaogongji divide bronze by its alloy, and iron is the newcomer beside them.",
      zh: "薛城内有冶铁作坊三处。铸铁犁锄，所以养所募之兵。考工记攻金六工以齐分铜，铁则其后起者。",
    },
  },
  workshop: {
    title: { en: "Workshop", zh: "工坊" },
    what: {
      en: "An artisan's shed: bench, timber, tools.",
      zh: "匠人之棚，有案有材有器。",
    },
    history: {
      en: "The Kaogongji counts some thirty trades in six divisions: seven in wood, six in metal, five in leather, five in colour, five in grinding jade, stone, and bone, two in clay. The Qin workshop statutes set each craft's output per worker, allow a year for an apprentice to reach it, and hold the overseer to the count.",
      zh: "考工记六门三十工：攻木七，攻金六，攻皮五，设色五，刮摩五，抟埴二。秦工律、工人程定每工之程，学徒一岁而成，工师课其数。",
    },
  },
  dyeworks: {
    title: { en: "Dyeworks", zh: "染坊" },
    what: {
      en: "Vats of indigo and madder under an awning, cloth drying beside them.",
      zh: "帷下蓝茜之缸，旁晾染布。",
    },
    history: {
      en: "Colour was a trade of its own: the Kaogongji gives five trades to it and describes dyeing in rounds, each dip a deeper grade. Dyed silk was a gift between courts and a mark of rank the sumptuary rules policed.",
      zh: "设色自为一门：考工记列五工，记染之以次，一入为縓，再入为赪。染帛为国际之贽，亦为等级之章，礼有所禁。",
    },
  },
  stall: {
    title: { en: "Market stall", zh: "市肆" },
    what: {
      en: "A trestle under an awning, goods in baskets.",
      zh: "帷下之案，货陈筐中。",
    },
    history: {
      en: "The Zhouli staffs the market with a superintendent, contract clerks, rent collectors, and a head for each row, and holds three sessions a day. The Qin market statute is what survives of the practice: any good over one cash carries a price tag, the seller drops the coin into a sealed box in the buyer's sight, and a shortfall is the official's to pay.",
      zh: "周礼市有司市、质人、廛人、肆长，一日三市。秦金布律存其实：物值一钱以上者各署其价，售者当买者面投钱于缿，亏则吏偿。",
    },
  },
  house: {
    title: { en: "Household", zh: "民居" },
    what: {
      en: "A small courtyard house of earth walls and thatch.",
      zh: "土墙草顶，一院一堂。",
    },
    history: {
      en: "A Qin case form describes one: a hall, an inner room, a side room, a back wall seven feet high with a lane behind it, and the yard the burglar crossed. Each such house was a line in the ward register, its adults, its old, and its children counted, which is the register every chapter of this game is fought over.",
      zh: "封诊式记其一：有堂，有内，有房，后垣高七尺，垣北即巷，盗所逾之院。每户即里籍一行，丁壮老弱皆书，此籍即诸章所争者。",
    },
  },
  mansion: {
    title: { en: "Great house", zh: "第宅" },
    what: {
      en: "A walled compound of several halls around courtyards.",
      zh: "垣内数堂，绕院而建。",
    },
    history: {
      en: "The house of a minister or a great family kept its own gate, its own granary, and its retainers: the men fed at a lord's table who wrote, fought, and persuaded for him. The lord of Xue is said to have kept three thousand.",
      zh: "卿相大家之宅，自有门、有仓、有门客：食于其家而为之书、为之战、为之说者。薛公食客号三千。",
    },
  },
  barracks: {
    title: { en: "Barracks", zh: "营舍" },
    what: {
      en: "Long halls in a fenced yard, a spear rack at the gate.",
      zh: "栅内长舍，门前戈架。",
    },
    history: {
      en: "The garrison was the conscription roll made flesh: men called by ward in rotation, drilled, and posted to a stretch of wall. The Mohist chapters assign so many men, so many crossbows, and so much stone to each length of rampart, which is the most concrete picture of a town mobilised that the age left.",
      zh: "戍卒即兵籍所化：按里轮发，教习，分守城段。墨子诸篇于每若干步之城定其人数、弩数、石数，一代所遗城守之图，莫具于此。",
    },
  },
  stable: {
    title: { en: "Stable", zh: "厩" },
    what: {
      en: "An open shed of stalls, hay at the end.",
      zh: "敞棚分栏，尽处积刍。",
    },
    history: {
      en: "Horses and oxen were state property first: the Qin stable statute inspects them yearly, grades the keeper on how they fed, and fines a beast worked to death. Horses and oxen are two of the thirteen counts.",
      zh: "马牛先为官物：秦厩苑律岁课之，以肥瘦赏罚其吏，役死者有罚。马、牛在十三数之中。",
    },
  },
  office: {
    title: { en: "Magistrate's office", zh: "官署" },
    what: {
      en: "The hall where the registers are kept and the seals applied.",
      zh: "藏籍用印之堂。",
    },
    history: {
      en: "South of the palace terraces at the Zhongshan capital lay the offices, and a Zhao town gave up the clay sealing of its own assistant magistrate. Here the ward registers, the granary accounts, and the artisan and convict rosters were written and copied, the archive a county seat on the Qin frontier left tens of thousands of slips of.",
      zh: "中山灵寿城宫殿台基之南为官署区，赵柏人城出丞印封泥。里籍、仓簿、工徒之名皆书于此、录于此，秦边一县之署所遗简牍以万计。",
    },
  },
  farmhouse: {
    title: { en: "Farmhouse", zh: "农舍" },
    what: {
      en: "A thatched house of rammed earth with its yard fenced in wattle.",
      zh: "夯土草顶之屋，篱围其院。",
    },
    history: {
      en: "The Qin case form that describes a burgled house counts one hall and two inner rooms, each with its door, the roofs tiled, and ten mulberries at the gate; a hamlet's houses were that or less, thatched rather than tiled. Mencius' homestead of five mu is the ideal: mulberry at the wall, chickens and pigs in the yard, and a hundred mu of field beyond.",
      zh: "封诊式封守：一宇二内，各有户，内室皆瓦盖，门桑十木。村舍如此或不及，草顶而非瓦。孟子五亩之宅为其式：墙下树桑，院有鸡豚，外有百亩之田。",
    },
  },
  threshing: {
    title: { en: "Threshing floor", zh: "场" },
    what: {
      en: "A round of beaten earth where the harvest is flailed and winnowed.",
      zh: "圆形夯地，打谷扬糠之处。",
    },
    history: {
      en: "The Odes have the household build its floor in the ninth month and bring the grain in by the tenth; the floor was the garden in spring and the floor in autumn, the same ground beaten hard twice a year. What was measured here was what the granary took a share of.",
      zh: "诗七月：九月筑场圃，十月纳禾稼。春为圃，秋为场，一地岁再筑。于此所量者，仓所取其分者也。",
    },
  },
  byre: {
    title: { en: "Byre", zh: "牛牢" },
    what: {
      en: "An open shed with a manger, for the village oxen.",
      zh: "有槽之敞棚，村牛所居。",
    },
    history: {
      en: "An ox was worth more than a man on the register, and the Qin stable statutes inspected the oxen four times a year and fined the keeper whose beast had lost girth. A hamlet's oxen were pooled and lent: the byre is where the plough team stands.",
      zh: "籍上一牛贵于一夫，秦厩苑律岁四校牛，牛瘦则罚其主。村牛共畜互假：牛牢即耕队所在。",
    },
  },
  "audience-hall": {
    title: { en: "Hall", zh: "堂" },
    what: {
      en: "The main hall on its terrace, open at the front, where the master receives.",
      zh: "台上正堂，前面敞开，主人受客之所。",
    },
    history: {
      en: "The hall stands on a rammed terrace with the host's steps on the east and the guest's on the west, and the Yili's rites of visiting are choreography for climbing them. The Kaogongji fixes the terrace height by rank. What happened here was reception, judgment, feast, and the reading of a lord's letter aloud.",
      zh: "堂立于夯台，阼阶在东，宾阶在西，仪礼相见诸礼皆升降之仪。考工记以等定堂崇。堂上之事：受客、听讼、燕飨、读君命。",
    },
  },
  chamber: {
    title: { en: "Inner chambers", zh: "寝" },
    what: {
      en: "The private hall behind the audience hall, where the family lives.",
      zh: "正堂之后之私室，家人所居。",
    },
    history: {
      en: "The hall in front and the chambers behind is the rule of every house of rank, and to be admitted from the one to the other was the mark of intimacy the Analects make of it. The lady of the house kept these rooms and the household's stores.",
      zh: "前堂后寝，凡有位之家皆然；由堂入室，论语以为亲近之征。主妇居此，掌家之藏。",
    },
  },
  wing: {
    title: { en: "Side range", zh: "厢" },
    what: {
      en: "A long low range of rooms along one side of the court.",
      zh: "庭侧长屋，一列小室。",
    },
    history: {
      en: "The eastern and western ranges flanked the court of a great house and held its retainers, its clerks, and its guests; the Erya says a hall with side ranges is a temple and one without is a dwelling. The retainers a chancellor fed by the hundred slept in rooms like these.",
      zh: "东西厢夹庭，居门客、书吏、宾客。尔雅：室有东西厢曰庙，无东西厢有室曰寝。相国养客数百，皆宿于此类。",
    },
  },
  gatehouse: {
    title: { en: "Gatehouse", zh: "门塾" },
    what: {
      en: "The compound's gate with a keeper's room beside it.",
      zh: "第门，旁有门房。",
    },
    history: {
      en: "The room beside the gate is the shu of the ritual texts, where a caller waited and a gatekeeper sat; the Erya calls the hall at the gate's side by that name. A gate was the house's face and its account: who came, who was turned away, and who was announced.",
      zh: "门侧之室即礼书之塾，客待于此，阍者坐于此；尔雅：门侧之堂谓之塾。门为一家之面亦为其簿：谁至，谁却，谁通。",
    },
  },
  kitchen: {
    title: { en: "Kitchen", zh: "庖" },
    what: {
      en: "A low building with a stove and cauldron, set apart from the halls.",
      zh: "低屋有灶有釜，与堂寝相隔。",
    },
    history: {
      en: "Mencius has the gentleman keep his distance from the kitchen, and a great house did so in plan: the cooking was done in an outbuilding by its own staff, the Zhouli's cooks and butchers scaled down to a household. The stove was also the house's fire, kept lit and watched.",
      zh: "孟子：君子远庖厨。大家之制亦然：庖在别屋，自有其人，周礼膳夫、庖人之职缩于一家。灶亦一家之火，长燃而守之。",
    },
  },
  shed: {
    title: { en: "Chariot shed", zh: "车库" },
    what: {
      en: "An open shed where the house's chariot stands.",
      zh: "敞棚，藏一家之车。",
    },
    history: {
      en: "A chariot needed a roof, a groom, and horses fed on the fodder the state counted; the Zhouli has an officer for the carriages of the court and a great house kept its own. The shed by the gate is the house's readiness to go to court, to war, or to a hunt.",
      zh: "车须有棚、有圉、有刍以饲马，刍则国所计。周礼有巾车掌王之车，大家自有其库。门侧之库，一家赴朝、赴战、赴猎之备。",
    },
  },
  pavilion: {
    title: { en: "Pavilion", zh: "榭" },
    what: {
      en: "An open pavilion in the garden, on a low base.",
      zh: "圃中敞榭，立于低台。",
    },
    history: {
      en: "Terraces and pavilions were the pleasure a ruler was warned against building and a great house built anyway: a roof over pillars where the master drank, read, and heard music with the garden round him. The Zuozhuan lists a ruler's terraces among his faults, which is how we know how common they were.",
      zh: "台榭为君主所戒而大家仍营之：柱上一顶，主人饮酒读书听乐，圃在其周。左传数君之过多及台榭，其常可知。",
    },
  },
  screen: {
    title: { en: "Screen wall", zh: "塞门" },
    what: {
      en: "A short free-standing wall inside the gate that blocks the view of the court.",
      zh: "门内独立短墙，蔽庭中之视。",
    },
    history: {
      en: "A screen inside the gate was the mark of a ruler's house, and the Analects fault Guan Zhong for setting one up as a minister. A great house of this age set one anyway: a caller stepping through the gate saw a wall and not the master, and turned to be received.",
      zh: "树塞门为国君之制，论语讥管仲以大夫树之。此世大家仍设之：客入门见墙不见主，折而后见。",
    },
  },
  dais: {
    title: { en: "Dais", zh: "主席" },
    what: {
      en: "The host's raised seat at the head of the hall: a low lacquered platform with a mat, an armrest, and a small table.",
      zh: "堂上主位：漆台低设，席、几、案具。",
    },
    history: {
      en: "A hall was ordered by where one sat. The host took the raised place at the head, facing south, with an armrest to lean on and a low table for the cup; a guest was seated by rank on the mats below, and the Yili's rites of audience and drinking are largely a choreography of who rises, who bows, and who sits where.",
      zh: "堂以席次为序。主人居上位南面，凭几设案；宾以爵次坐于下席。仪礼之聘礼、乡饮酒礼，大抵是谁起、谁拜、谁坐何处之仪。",
    },
  },
  tablets: {
    title: { en: "Ancestral tablets", zh: "神主" },
    what: {
      en: "The ancestors' tablets on their stand, with an incense burner and offering cups before them.",
      zh: "神主立于案上，前设香炉与爵。",
    },
    history: {
      en: "A house kept its dead in the hall. The tablets stood at the west, and the master reported to them before a journey, a marriage, or a decision, and fed them at the seasons. A great house had a temple for them; a lesser one a stand in its hall, which the Liji allows.",
      zh: "家祀先人于堂。主位于西，出行、嫁娶、大事皆告，四时祭之。大家有庙，其次设主于堂，礼记许之。",
    },
  },
  lamp: {
    title: { en: "Lamp stand", zh: "灯" },
    what: {
      en: "A tall bronze lamp on a round base, its dish burning oil or tallow.",
      zh: "铜灯高立，圆座盘上燃膏。",
    },
    history: {
      en: "Bronze lamps of this age survive in numbers from the tombs of Zhongshan and Chu: a column, a dish, and often a figure or a beast holding it up. Light after dark was a cost a household could afford or not, and a lit hall was itself a show of rank.",
      zh: "此世铜灯出于中山、楚墓者甚多：一柱一盘，或以人兽承之。夜有灯火，家之所能与不能；堂上灯明，即是威仪。",
    },
  },
  bed: {
    title: { en: "Bed", zh: "床" },
    what: {
      en: "A low lacquered bed platform with a folded quilt, a mat, and a curtain gathered at its head.",
      zh: "漆床低设，被褥叠置，席铺其上，帐幔收于床头。",
    },
    history: {
      en: "The bed of the inner chamber was a low platform, lacquered black and red, with a mat and a quilt of silk or hemp by the household's means; the Baoshan tomb kept a folding one. The lady of the house kept the chamber, and the Liji sets the rule that the master's sons and daughters did not sit on one bed past the age of seven.",
      zh: "内室之床为低台，黑红髹漆，上铺席被，丝麻视其家。包山楚墓有折叠床。主妇主内室；礼记谓男女七岁不同席。",
    },
  },
  table: {
    title: { en: "Low table", zh: "案" },
    what: {
      en: "A small lacquered table set for a meal, with a tripod bowl, eared cups, and cushions on the floor beside it.",
      zh: "漆案低设，上置鼎、耳杯，旁铺坐席。",
    },
    history: {
      en: "One ate seated on a mat at a table a hand high, and the table came to the eater rather than the eater to the table: a servant carried it in set. The eared lacquer cup is the vessel of the age, and the tripod on the table is the bronze of the ancestral hall brought down to a meal.",
      zh: "席地而食，案高不盈尺，案就人而非人就案：仆人举案而进。漆耳杯为此世之器，案上之鼎则宗庙之铜降于常食。",
    },
  },
  chest: {
    title: { en: "Chest", zh: "箱" },
    what: {
      en: "A lacquered wooden chest with bronze fittings, holding the household's silk and valuables.",
      zh: "漆木箱，铜饰角，藏丝帛与财货。",
    },
    history: {
      en: "A household's wealth was cloth, and the chest that held it was itself lacquered and patterned like the finest thing in the room. The Baoshan and Zeng tombs kept chests of clothes and of documents, and a burglary case among the Fengzhenshi forms begins with what was in one.",
      zh: "家之财在布帛，藏之之箱髹漆施纹，与室中至美之物相类。包山、曾侯乙墓皆有衣箱、书箱；封诊式之盗案，自箱中之物起。",
    },
  },
  loom: {
    title: { en: "Loom", zh: "机" },
    what: {
      en: "A treadle loom with a length of undyed cloth half woven on it.",
      zh: "踏机一具，素布半织。",
    },
    history: {
      en: "The women of a house wove, and the women of a great house wove silk. The Mencius counts a wife's weaving as half a family's living, and the loom in the east rooms is the household's own cloth being made rather than bought: the tax, the clothing, and the gifts a house gave all came off it.",
      zh: "妇织，大家之妇织丝。孟子以妇织为一家之半业；东房之机，家自为衣而不市：赋、衣、赠皆出于此。",
    },
  },
  desk: {
    title: { en: "Writing desk", zh: "书案" },
    what: {
      en: "The steward's desk, with bamboo slips, a brush, and an ink stone.",
      zh: "家宰之案，简牍、笔、砚具。",
    },
    history: {
      en: "A great house was administered in writing: its stores, its rents, its servants' rations, and its dealings with the state all went onto bamboo slips tied with cord. The Baoshan and Liye finds are the same forms kept by offices; a steward kept them for a house, and the Zhouli's officers of the royal household are what a private steward copied.",
      zh: "大家以文书治家：仓廪、租入、仆隶之廪、与官之往来，皆书于简而编以绳。包山、里耶之简即官府之式；家宰为家守之，周礼之宰夫诸官，私家之宰所仿也。",
    },
  },
  mat: {
    title: { en: "Sleeping mat", zh: "卧席" },
    what: {
      en: "A servant's sleeping place: a reed mat, a hemp blanket, a wooden headrest, and a bundle.",
      zh: "仆人卧处：苇席、麻被、木枕、行囊。",
    },
    history: {
      en: "A servant slept where the work was, on a mat in the range or the outbuilding, and owned what fitted in a bundle. The Shuihudi statutes ration a bond servant's grain by the month and their clothing by the season; a house that kept servants fed and clothed them by the same reckoning.",
      zh: "仆人卧于其役之所，席于厢庑，所有尽在一囊。睡虎地律以月廪隶臣之粟、以季给其衣；养仆之家，计亦同此。",
    },
  },
  hearth: {
    title: { en: "Hearth", zh: "灶" },
    what: {
      en: "The kitchen stove: a clay hearth with a cauldron and a pot set in its openings and a fire in its mouth.",
      zh: "庖厨之灶：土灶设釜甑，灶口有火。",
    },
    history: {
      en: "The stove was the god of the kitchen and the centre of the household's day; the Liji's household rules begin at dawn with the fire. A clay stove with two openings, a cauldron for the grain and a steamer over it, is the form the pottery models in tombs of this age keep, and the cook's smoke over the roof is the sign a house is fed.",
      zh: "灶为庖之神，一家一日之中；礼记内则自晨兴举火始。土灶双眼，釜炊粟而甑蒸之，此世墓中陶灶之形。厨烟出屋，家有食也。",
    },
  },
  bins: {
    title: { en: "Grain bins", zh: "囷" },
    what: {
      en: "Round bins of coiled straw plastered with clay inside the granary, holding the household's millet.",
      zh: "仓内草编泥涂之囷，藏家之粟。",
    },
    history: {
      en: "Grain was kept off the ground and away from damp in round bins, sealed and opened by the steward's count. The Shuihudi granary statutes seal a store with the officials' names and tally what comes out; a house measured its own the same way, and the Mencius reckons a family's security by how many years its bins would hold.",
      zh: "粟离地避湿，藏于圆囷，启闭皆由家宰计数。睡虎地仓律以吏名封仓、出入有计；家仓计法亦然。孟子以囷可支几年，度一家之安危。",
    },
  },
  manger: {
    title: { en: "Manger", zh: "槽" },
    what: {
      en: "The stable's feed trough, full of hay, with straw heaped beside it and a halter on the post.",
      zh: "厩中饲槽，盛刍，旁堆藁，柱挂络头。",
    },
    history: {
      en: "A horse ate what the state counted: fodder and straw were among the thirteen things the Shangjunshu has a state number, and a chariot house kept four horses to a team and a groom to feed them. The Zhouli's stable officers ration hay by the season; the manger is where that reckoning was eaten.",
      zh: "马食国所计之物：刍藁在商君书十三数之中，车家一乘四马，圉人饲之。周礼圉师以时颁刍；槽者，此计之所食也。",
    },
  },
  trough: {
    title: { en: "Water trough", zh: "水槽" },
    what: {
      en: "A stone trough in the stable yard, filled from the well, with a bucket beside it.",
      zh: "厩庭石槽，汲井以注，旁置桶。",
    },
    history: {
      en: "Horses drank from a trough filled by hand from the compound's well, and watering them was the groom's first task of the day. A stone trough outlasts everything else in a yard, and troughs of this age survive where the timber round them has not.",
      zh: "马饮于槽，圉人汲井注之，晨起首务。石槽历久，此世之槽至今存者，其周之木已尽。",
    },
  },
  armrack: {
    title: { en: "Weapon rack", zh: "兵架" },
    what: {
      en: "A rack in the gatehouse holding dagger-axes on their shafts and a lacquered shield.",
      zh: "门舍兵架，插戈数柄，倚漆盾一。",
    },
    history: {
      en: "A gatehouse was a guardroom, and a great house kept arms for its own retainers: the bronze dagger-axe on a long shaft was the weapon of the age, and a lacquered leather shield went with it. The Zhouli sets guards at the gates of the palace with their weapons racked beside them; a house copied the palace at its own scale.",
      zh: "门舍即卫舍，大家为家臣备兵：长柄铜戈为此世之器，漆革盾配之。周礼设宫门之卫，兵架于侧；家仿宫制而小之。",
    },
  },
  // the registered village and the house
  wardhall: {
    title: { en: "Ward hall", zh: "序" },
    what: {
      en: "A thatched hall on a low terrace at the crossroads, open at the front: the ward's meeting place.",
      zh: "十字路口低台上茅堂一座，前敞：里人所会。",
    },
    history: {
      en: "Mencius names the schools of the three dynasties (校, 序, 庠) and the Zhouli has the ward's officer read the statutes to the households at the start of the year and hold the drinking rite in the local hall (黨正...屬民而讀法). The hall is where the register was taken, the rite held, the drill's feast seated by age, and the elder judged a quarrel.",
      zh: "孟子夏曰校，殷曰序，周曰庠；周礼党正正岁属民读法，以礼属民而饮酒于序。案户于此，饮酒于此，射后之飨序齿于此，里正听讼亦于此。",
    },
  },
  silkshed: {
    title: { en: "Silkworm shed", zh: "蚕室" },
    what: {
      en: "A low thatched shed with racks of trays, behind the mulberry plot.",
      zh: "桑园之后低舍，架上列箔。",
    },
    history: {
      en: "The Yueling's third month has the women go to the mulberries and forbids other work while the worms feed (蠶事既登); the Seventh Month picks the leaves in the same month (蠶月條桑). The worms were kept warm and dark in a shed of their own, fed by the daughters, and a ward's silk was its tax cloth as much as its finery.",
      zh: "月令季春后妃齐戒亲东乡躬桑，禁妇女毋观，省妇使以劝蚕事；七月蚕月条桑。蚕育于暗室，女子饲之；里之丝，赋亦在焉。",
    },
  },
  icehouse: {
    title: { en: "Ice house", zh: "凌阴" },
    what: {
      en: "A mound with a timber door dug into the hill below the woods.",
      zh: "林下山中土室，木门一扇。",
    },
    history: {
      en: "The Seventh Month cuts ice in the twelfth month and stores it in the first, in the ice house (納于凌陰), and opens it in the fourth with a lamb offered (獻羔祭韭). The Qin capital's ice house has been excavated: a pit lined with rammed earth and a drain, roofed and shaded. A ward's was the same in small.",
      zh: "七月二之日凿冰冲冲，三之日纳于凌阴，四之日其蚤，献羔祭韭。秦雍城凌阴已发掘：夯土为壁，有排水之道，覆而荫之。里之凌阴其小者。",
    },
  },
  wardgate: {
    title: { en: "Ward gate", zh: "闾" },
    what: {
      en: "Two posts and a lintel across the lane where it leaves the houses.",
      zh: "里道出舍处两柱一楣。",
    },
    history: {
      en: "A 里 was a gated place: the Zhouli's ward has its gate and its gate-keeper, the Analects have the villagers drive out the pestilence while the master stands in court dress at the eastern step, and the Qin statutes shut the gate at night and fine the ward whose gate let a runaway through. A lane's gate is where the ward began.",
      zh: "里有闾：周礼里宰掌其闾；论语乡人傩，朝服而立于阼阶；秦律夜闭闾门，亡人出者罚其里。闾者里之所始。",
    },
  },
  steps: {
    title: { en: "The steps", zh: "阶" },
    what: {
      en: "One of the two flights of steps up the hall's terrace: the host's on the east, the guest's on the west.",
      zh: "堂之两阶：东为阼阶，主人所升；西为西阶，宾所升。",
    },
    history: {
      en: "Every Yili rite is staged by the steps. The host ascends by the eastern (阼階), the guest by the western, and who stands where on which step is the whole choreography of the capping, the wedding, the audience, and the mourning: the coffin lies at the west steps, the dead are called back from the roof above them, and the son who has become the head of the house takes the eastern.",
      zh: "仪礼诸礼皆以阶为位。主人升自阼阶，宾升自西阶，冠、昏、相见、丧，其进退揖让皆系于阶。殡于西阶上，复于屋上，主人既成则升阼。",
    },
  },
};

/** The note for one picked thing, or null when nothing is said about it. */
export const legendFor = (kind: LegendKind, id: string): LegendNote | null => {
  if (kind === "terrain") return TERRAIN_NOTES[id as Terrain] ?? null;
  if (kind === "water") return WATER_NOTES[id as Water] ?? null;
  if (kind === "decor") return DECOR_NOTES[id as Decor] ?? null;
  return MARKER_NOTES[id as Marker | "region"] ?? null;
};

/**
 * A note about one named thing rather than one kind of thing. The title is a
 * fallback: the explorer prefers the gazetteer's own rendering, so the name a
 * reader sees follows the naming and language they set, and a masked run
 * keeps its mask. `modern` is the name the feature goes by now, shown only
 * under the chronicle naming, where the real names are on the map already.
 */
export interface FeatureNote extends LegendNote {
  modern?: Localized;
}

/**
 * The named country: what the map draws that history itself named. Keys are
 * gazetteer keys (`FEATURE_NAMES` and `PLACE_NAMES` in the world module), and
 * `geography.json` binds them to the fills that draw them.
 */
export const FEATURE_NOTES: Record<string, FeatureNote> = {
  river: {
    title: { en: "The River", zh: "大河" },
    modern: { en: "the Yellow River", zh: "黄河" },
    what: {
      en: "The great northern river: west out of the highlands, north around the Ordos loop, south along the border of Qin and the Jin lands, then east across the plain to the Gulf.",
      zh: "北方大川。出陇上，绕河套而北，南下秦晋之界，复东注渤海。",
    },
    history: {
      en: "It is simply the River in this period; the name that calls it yellow comes later, from the silt it carries. That silt raises its own bed above the plain, so the plain lives behind dykes and a cut dyke is a weapon: states on it flooded each other on purpose, and the crossings and the bend below the Fen decided campaigns.",
      zh: "时人但称河，黄河之名后起，以其挟沙也。沙高其床，故平原恃堤而居；决堤即兵器，列国以水相攻，见于史。汾口之曲与诸津渡，常决战守之势。",
    },
  },
  weishui: {
    title: { en: "The Wei", zh: "渭水" },
    what: {
      en: "The river of Guanzhong, running east down the valley past Xianyang to meet the River at the bend.",
      zh: "关中之水，东流经咸阳，会河于曲。",
    },
    history: {
      en: "The valley it waters is the whole basis of Qin: loess soil, a canal system drawing off the Jing, and one road out to the east through a pass that can be shut. A state that can feed an army in the Wei valley and close the gate behind it can lose a campaign without losing the war.",
      zh: "渭川沃野，秦之本也。黄壤宜稼，引泾以溉，东出唯一函谷之道，可闭而守。故秦能养兵于内，败于外而国不摇。",
    },
  },
  jing: {
    title: { en: "The Jing", zh: "泾水" },
    what: {
      en: "The northern tributary that comes down out of the loess country into the Wei.",
      zh: "自黄土高原南下，注于渭。",
    },
    history: {
      en: "Its water was taken into a canal across the dry terrace above the Wei, and the silt it carried turned alkali ground into grain land. The canal was begun as an engineering project meant to exhaust Qin and ended as the thing that fed its armies.",
      zh: "引泾为渠，溉渭北舄卤之地，淤而成田。渠本敌国疲秦之计，终为秦之仓廪。",
    },
  },
  fen: {
    title: { en: "The Fen", zh: "汾水" },
    what: {
      en: "The valley river of the old Jin country, running south between the ranges to the River.",
      zh: "晋地之川，南流两山之间而入河。",
    },
    history: {
      en: "The corridor down the middle of the Jin lands, and after their partition the road between the three states that came out of it. Jinyang stands on it; salt from the lake at its lower end was one of the oldest sources of state revenue in the north.",
      zh: "晋国之脊，三家分晋后，为三国往来之道。晋阳临之。汾下盐池之利，北方最古之国赋也。",
    },
  },
  luo: {
    title: { en: "The Luo", zh: "洛水" },
    what: {
      en: "The short river of the royal domain, joining the River below the Zhou altars.",
      zh: "王畿之水，东注于河，在周室之下。",
    },
    history: {
      en: "The Zhou kings were left with the land along it and little else: the altars, the bronzes, the calendar, and no army worth the name. Every state that wanted the form of legitimacy came here for it, and none of them defended the place.",
      zh: "周室所余，唯此水之地：宗庙、彝器、正朔而已，无兵可恃。诸侯欲假天子之名者皆至，而莫肯为之守。",
    },
  },
  ditch: {
    title: { en: "The Great Ditch", zh: "鸿沟" },
    what: {
      en: "The cut canal between the River and the Huai, carrying boats across the plain.",
      zh: "凿渠通河淮，舟行平原。",
    },
    history: {
      en: "A canal is a grain road: it moves the tax of one province to the army of another at a fraction of what carts cost. This one tied the middle plain together and, being a straight line drawn across open country, later served as the obvious thing to make a border out of.",
      zh: "渠者，漕道也，转一方之粟以给他方之军，费省于车运数倍。此渠联中原为一，其为平地直线，后遂用以划疆。",
    },
  },
  yi: {
    title: { en: "The Yi", zh: "易水" },
    what: {
      en: "Yan's southern water, the line between its own country and the states below it.",
      zh: "燕之南水，燕与南国之界。",
    },
    history: {
      en: "A frontier river far enough from anywhere to feel like an edge: walls and beacon lines run near it, and the crossing of it southward is the setting of the period's most quoted farewell.",
      zh: "边水也，去中原既远，长城烽燧多循其地。南渡易水之别，为一代传诵之辞。",
    },
  },
  jiang: {
    title: { en: "The Jiang", zh: "大江" },
    modern: { en: "the Yangtze", zh: "长江" },
    what: {
      en: "The great southern river, running east through the Chu country to the sea.",
      zh: "南方大川，东贯楚地入海。",
    },
    history: {
      en: "No one bridges it. It is a road rather than a barrier for whoever has the boats, which for most of this period is Chu, and it is why a southern state can move grain and men at a speed the northern plains manage only on canals.",
      zh: "无桥可渡。有舟者以为道，无舟者以为险；楚擅舟楫，故转粟运兵之速，北国非渠不能及。",
    },
  },
  luliang: {
    title: { en: "The Lüliang", zh: "吕梁山" },
    what: {
      en: "The range along the east bank of the gorge, between the River and the Fen.",
      zh: "峡东之山，介于河、汾之间。",
    },
    history: {
      en: "It went to Zhao when the Jin lands were divided, and it is why the division held: the western march of that inheritance is a range with a river in a trench at its foot, and an army coming from the west has to get up out of the trench before it can fight.",
      zh: "三家分晋，此山属赵，而分得以久者以此：其西界一山，山下之河在壑中，自西来者，必先出壑而后可战。",
    },
  },
  hanshui: {
    title: { en: "The Han", zh: "汉水" },
    what: {
      en: "The river of the middle vale, running southeast out of Hanzhong to the Jiang country.",
      zh: "汉中之水，东南流入江域。",
    },
    history: {
      en: "The seam between the Wei valley, the Sichuan basin, and Chu. Whoever holds its upper vale holds the door to two of the three, which is why a stretch of mountain road above it was worth more to Qin than the province it crossed.",
      zh: "关中、巴蜀、荆楚三地之交。得其上游，即握两地之门；故其上栈道一线，于秦重于所过之郡。",
    },
  },
  huai: {
    title: { en: "The Huai", zh: "淮水" },
    what: {
      en: "The river between the northern plain and the southern country, running east to the sea.",
      zh: "南北之间，东流入海。",
    },
    history: {
      en: "The old dividing line: wheat and millet above it, rice and boats below. Armies from the north lose their advantage crossing it, and the states along it changed hands often enough that its towns learned to keep two sets of loyalties.",
      zh: "南北之分：其北黍麦，其南稻舟。北军渡之则失其长。淮上诸邑数易其主，遂习于两属。",
    },
  },
  min: {
    title: { en: "The Min", zh: "岷江" },
    what: {
      en: "The river coming down out of the western mountains onto the Chengdu plain.",
      zh: "自西山下成都之原。",
    },
    history: {
      en: "It was split at the head of the plain by a weir that sends part of the flow into an irrigation net and lets the flood take the rest. The work has no gates and needs no wall, and it turned Shu into the granary that made Qin's later campaigns affordable.",
      zh: "于原首分其流，堰以入渠，余水泄洪。工无闸而不恃墙，遂使蜀为天府，秦之军资出焉。",
    },
  },
  sea: {
    title: { en: "The Eastern Sea", zh: "东海" },
    what: {
      en: "The open water off the eastern shore, with its bays and the salt flats along them.",
      zh: "东境外海，多湾泽，沿海皆盐场。",
    },
    history: {
      en: "Salt and fish, which is to say revenue. Boiling seawater made the eastern states rich before anyone taxed iron, and the argument over whether salt should be a state monopoly or left to merchants starts here and never quite ends.",
      zh: "鱼盐之利，即国赋也。煮海而富，先于铁官；盐当官营抑或听民，其议肇于此而未尝止。",
    },
  },
  gulf: {
    title: { en: "The Gulf", zh: "渤海" },
    what: {
      en: "The shallow northern sea, closed on three sides by the coast.",
      zh: "北方浅海，三面环陆。",
    },
    history: {
      en: "Shallow, cold, and easy to work: salterns line it, and coastal shipping runs from the Qi shore up toward the Yan country. It is also where the search for the isles of the immortals was fitted out, which was a court expense before it was a story.",
      zh: "水浅而寒，宜煮盐，沿岸盐灶相望；齐燕之间，舟运相通。求仙山之舶亦出于此：先为国费，后成传说。",
    },
  },
  yunmeng: {
    title: { en: "The Yunmeng marshes", zh: "云梦泽" },
    what: {
      en: "The great wetland behind the Chu court: lakes, reed, and channels rather than solid ground.",
      zh: "楚都之后，湖泽苇渚，非坚地也。",
    },
    history: {
      en: "A hunting preserve, a fishery, and a defence that costs nothing to garrison. An army that walks into it disappears into water it cannot see the far side of, and the boats belong to the people who live there.",
      zh: "田猎之囿，鱼稻之乡，不戍而险自守。军入其中，四顾皆水，舟楫又非其所有。",
    },
  },
  passroad: {
    title: { en: "The road through the passes", zh: "关道" },
    what: {
      en: "The trunk road east out of Guanzhong, through the pass and on across the plain to the eastern courts.",
      zh: "自关中东出，过关而临中原诸都。",
    },
    history: {
      en: "One road, and a gate on it. An army from the west has to come this way, and a coalition that wants to march on Qin has to force the same gate. Both facts shaped a century of leagues: the states east of it kept swearing to attack together, because none of them could do it alone.",
      zh: "东西一道，扼以一关。秦兵东出必由此，合从伐秦亦必攻此。百年纵横之局，端在于是：关东诸侯屡盟而共图之，以其独力不能也。",
    },
  },
  plankroad: {
    title: { en: "The plank roads", zh: "栈道" },
    what: {
      en: "Galleries pinned to the cliff faces on the way south from the Wei valley into Hanzhong and Shu.",
      zh: "自渭南入汉中、巴蜀，凿崖架木为道。",
    },
    history: {
      en: "Beams set into holes cut in the rock, with planks laid over them, hung above gorges that have no floor to build on. They are how a grain convoy reaches Shu at all, they can be burned behind an army to show it is not coming back, and the state that built them turned a mountain province into a supply base.",
      zh: "凿石置梁，铺木其上，悬于绝谷之侧。粟运入蜀，唯此可通；亦可焚之以示不返。筑之者遂化山郡为军储之地。",
    },
  },
  changcheng: {
    title: { en: "The long walls", zh: "长城" },
    what: {
      en: "Rammed-earth walls run along the ridges: the northern lines of Zhao and Yan against the steppe, and the southern line of Qi along the hills between the plain and the sea.",
      zh: "循山脊而筑之土垣：赵、燕北界以拒胡，齐则循泰山之脊，自河东至于海。",
    },
    history: {
      en: "Every one of these is older than the single wall that later joined them up, and none of them was built to stop an army. They were built to stop a raid getting home: horsemen can cross a wall, but not with cattle, and the beacons on it reach the garrison before the raiders reach the grass.",
      zh: "皆先于后世连而为一者，其筑亦非以御大军。所御者，掠而归之骑也：骑可越垣，牛马不可；烽火之至，先于寇之出塞。",
    },
  },
  si: {
    title: { en: "The Si", zh: "泗水" },
    what: {
      en: "The river of the eastern plain, running south past the small states between Qi and Chu to join the Huai.",
      zh: "东方平原之川，南流经齐楚间小国而注于淮。",
    },
    history: {
      en: "The country along it held Lu, Song, Xue, and a dozen smaller houses, which is why the phrase for that whole world was the states of the Si. They were swallowed one by one, and by the last generation of this period there was nothing between Qi and Chu but the river itself. One of the royal tripods is supposed to have gone into it and never been recovered.",
      zh: "其上有鲁、宋、薛及小国十数，故并称泗上诸侯。皆以次见并，至末世齐楚之间唯余此水而已。九鼎之一，相传沉于泗而不可得。",
    },
  },
};

/** The note for a named feature, or null when the map draws it anonymously. */
export const featureFor = (id: string | undefined): FeatureNote | null =>
  id ? (FEATURE_NOTES[id] ?? null) : null;
