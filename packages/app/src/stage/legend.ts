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
