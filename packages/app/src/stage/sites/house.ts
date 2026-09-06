/**
 * The house: an elite compound inside a city, at about a metre a tile,
 * drawn from `art/sites/house/geography.json` by `npm run stage:sites`. It
 * is the plan the ritual texts assume and the Zhongshan king's bronze plan
 * confirms in outline: a gate on the street with its keeper's room and a
 * screen inside it, a forecourt of sheds, stable, kitchen, and granary, a
 * second gate into the court of the audience hall with its two side ranges,
 * and a third wall behind the hall closing the inner chambers, the garden,
 * the pond, and the women's rooms. At this scale a building is not a stamp
 * but a room: its walls and roof are composed from a kit, its floor is a
 * ground, its furniture is a place, and the household walks in by the door.
 * No chapter is set here; the people are the family, its retainers, and its
 * servants.
 */
import type { FeatureNote, Localized } from "../legend";
import type { Site, Townsperson } from "../site";

export const HOUSE_NAMES: Record<string, Localized> = {
  gate: { en: "the gatehouse", zh: "门" },
  shed: { en: "the chariot shed", zh: "车库" },
  stable: { en: "the stable", zh: "厩" },
  kitchen: { en: "the kitchen", zh: "庖" },
  granary: { en: "the granary", zh: "廪" },
  well: { en: "the well", zh: "井" },
  forecourt: { en: "the forecourt", zh: "外庭" },
  "inner-gate": { en: "the second gate", zh: "中门" },
  hall: { en: "the hall", zh: "堂" },
  "wing-west": { en: "the west range", zh: "西厢" },
  "wing-east": { en: "the east range", zh: "东厢" },
  court: { en: "the court", zh: "庭" },
  "inner-door": { en: "the inner door", zh: "闱" },
  chamber: { en: "the inner chambers", zh: "寝" },
  "east-rooms": { en: "the women's rooms", zh: "东房" },
  pavilion: { en: "the pavilion", zh: "榭" },
  pond: { en: "the pond", zh: "池" },
  garden: { en: "the kitchen garden", zh: "圃" },
  street: { en: "the street", zh: "街" },
  "house-west": { en: "the neighbour's house", zh: "西邻" },
  "house-east": { en: "the house beyond", zh: "北邻" },
  neighbour: { en: "the minister's compound", zh: "东邻卿第" },
  // the furniture: what stands inside each room, and where its people sit
  dais: { en: "the master's dais", zh: "主席" },
  tablets: { en: "the ancestral tablets", zh: "神主" },
  lamp: { en: "the hall lamp", zh: "堂灯" },
  bed: { en: "the bed", zh: "床" },
  "chamber-table": { en: "the chamber table", zh: "寝案" },
  chest: { en: "the silk chest", zh: "衣箱" },
  loom: { en: "the loom", zh: "机" },
  desk: { en: "the steward's desk", zh: "宰案" },
  mat: { en: "the servants' mats", zh: "仆席" },
  "west-table": { en: "the retainers' table", zh: "客案" },
  hearth: { en: "the hearth", zh: "灶" },
  bins: { en: "the grain bins", zh: "囷" },
  manger: { en: "the manger", zh: "槽" },
  trough: { en: "the water trough", zh: "水槽" },
  armrack: { en: "the weapon rack", zh: "兵架" },
};

export const HOUSE_FEATURES: Record<string, FeatureNote> = {
  outerwall: {
    title: { en: "The compound wall", zh: "第墙" },
    what: {
      en: "The rammed-earth wall round the whole compound, broken only at the gate.",
      zh: "环第之夯土墙，唯门一缺。",
    },
    history: {
      en: "A great house was a walled ward of its own inside the city's wards, and the Qin case form that describes a burgled house measures the wall's height and the marks on it before anything else. The wall kept the household in as much as strangers out: the statutes held a master liable for what his people did beyond it.",
      zh: "大家为城中里内之里，自有其垣。封诊式先度垣高、验垣迹。垣所以闭家人亦所以拒外人：秦律主人坐其家人垣外之事。",
    },
  },
  screen: {
    title: { en: "The screen wall", zh: "塞门" },
    what: {
      en: "A short free-standing wall inside the gate that blocks the view of the court.",
      zh: "门内独立短墙，蔽庭中之视。",
    },
    history: {
      en: "A screen inside the gate was the mark of a ruler's house, and the Analects fault Guan Zhong for setting one up as a minister. A great house of this age set one anyway: a caller stepping through the gate saw a wall and not the master, and turned to be received.",
      zh: "树塞门为国君之制，论语讥管仲以大夫树之。此世大家仍设之：客入门见墙不见主，折而后见。",
    },
  },
  courtwall: {
    title: { en: "The court wall", zh: "中墙" },
    what: {
      en: "The wall between the forecourt of sheds and stores and the court of the hall.",
      zh: "外庭与堂庭之间之墙。",
    },
    history: {
      en: "The Yili's rites of visiting are staged across this line: a caller waits outside the second gate while the host is told, and is met at it by a man of the house whose rank answers the caller's. Behind it the horses, the carts, and the cooking are out of sight of the hall.",
      zh: "仪礼相见之礼行于此线：客俟于中门外，主人使人告，出迎者之位应客之位。门内则马、车、庖皆不见于堂。",
    },
  },
  innerwall: {
    title: { en: "The inner wall", zh: "内墙" },
    what: {
      en: "The wall behind the hall that closes the chambers, the garden, and the women's rooms.",
      zh: "堂后之墙，闭寝、圃、房。",
    },
    history: {
      en: "The hall is where the house receives and the chambers are where it lives, and the door between them is the one a stranger never passes. The Analects make the distance between the two a figure for how far a student has come; a house of rank built it in earth.",
      zh: "堂所以受人，寝所以居；其间之门，外人所不入。论语以升堂入室为学之远近，大家则以土筑之。",
    },
  },
  street: {
    title: { en: "The street", zh: "街" },
    what: {
      en: "The ward's street outside the gate, and the lane down the compound's east side.",
      zh: "门外之里街，及第东之巷。",
    },
    history: {
      en: "A compound faced its ward's street and turned a blank wall to the lane beside it. The ward gate closed at night and the ward head answered for who came and went, which is why the Guanzi wants the orders kept to their quarters: a house like this one stood in the officials' ward near the court, not among the workshops.",
      zh: "第面里街，侧巷则墙而已。里门夜闭，里正主出入，故管子欲四民各居其处：此第在近朝之士里，不在工肆之间。",
    },
  },
  walk: {
    title: { en: "The paved walk", zh: "甬道" },
    what: {
      en: "Flagstones from the gate to the hall steps and across the court to the ranges.",
      zh: "自门至堂阶、横庭至厢之石道。",
    },
    history: {
      en: "The court was beaten earth and the walk across it stone, so that a guest reached the steps dry-shod and the rite of who walks where could be kept: the host up the east steps, the guest up the west. The palaces at the Zhongshan capital were reached by paved ways between their terraces.",
      zh: "庭为夯土，道则铺石，客至阶不濡，主升阼阶、客升西阶之礼得行。灵寿宫殿台基之间亦以石道相通。",
    },
  },
  pond: {
    title: { en: "The pond", zh: "池" },
    what: {
      en: "Still water in the garden court, with lotus on it.",
      zh: "圃庭止水，荷覆其上。",
    },
    history: {
      en: "A house that could spare ground for water inside its wall was a rich one: the pond was the garden's ornament and the kitchen's, and the Zhongshan king's bronze plan sets the halls of his mausoleum round an enclosure as this house sets its pavilion beside its water.",
      zh: "垣内有地蓄水者富家也：池为圃之饰亦为庖之用。中山王兆域图以殿绕域，如此第以榭临池。",
    },
  },
};

export const HOUSEHOLD: readonly Townsperson[] = [
  {
    archetype: "master",
    order: "family",
    label: { en: "master of the house", zh: "主人" },
    home: "dais",
  },
  {
    archetype: "lady",
    order: "family",
    label: { en: "lady of the house", zh: "主妇" },
    home: "bed",
  },
  {
    archetype: "child",
    order: "family",
    label: { en: "child", zh: "童子" },
  },
  {
    archetype: "steward",
    order: "retainer",
    label: { en: "steward", zh: "家宰" },
    home: "desk",
  },
  {
    archetype: "retainer",
    order: "retainer",
    label: { en: "retainer", zh: "门客" },
    home: "west-table",
  },
  {
    archetype: "scholar",
    order: "retainer",
    label: { en: "tutor", zh: "傅" },
    home: "pavilion",
  },
  {
    archetype: "musician",
    order: "retainer",
    label: { en: "musician", zh: "乐工" },
    home: "hall",
  },
  {
    archetype: "guard",
    order: "retainer",
    label: { en: "gatekeeper", zh: "阍者" },
    home: "armrack",
  },
  {
    archetype: "physician",
    order: "retainer",
    label: { en: "physician", zh: "医" },
  },
  {
    archetype: "maid",
    order: "servant",
    label: { en: "maid", zh: "婢" },
    home: "loom",
  },
  {
    archetype: "cook",
    order: "servant",
    label: { en: "cook", zh: "庖人" },
    home: "hearth",
  },
  {
    archetype: "groom",
    order: "servant",
    label: { en: "groom", zh: "圉人" },
    home: "manger",
  },
  {
    archetype: "carrier",
    order: "servant",
    label: { en: "porter", zh: "仆" },
    home: "bins",
  },
];

/** the places a stroll may start or end: anything inside the wall, and the gate */
export const HOUSE_STROLL_PLACES: readonly string[] = Object.keys(
  HOUSE_NAMES,
).filter(
  (key) =>
    !["street", "house-west", "house-east", "neighbour", "pond"].includes(key),
);

export const HOUSE: Site = {
  id: "house",
  path: "/craft/house",
  crumb: "House",
  title: { en: "A Model House", zh: "模范之第" },
  seat: "house",
  intro:
    "The compound of a great officer inside a capital, at about a metre a tile, close enough that the household walks into its buildings rather than past them: every hall, range, and shed is walled and roofed from a building kit, the roof lifts while someone is inside, and the furniture is where its people sit. It is the plan the ritual texts assume and the Zhongshan king's bronze plan confirms in outline: a gate on the ward's street with a keeper's room beside it and a screen wall inside, a forecourt of chariot shed, stable, well, kitchen, and granary, a second gate into the court of the audience hall on its terrace with a range of rooms down each side, and a third wall behind the hall closing the inner chambers, the women's rooms, the kitchen garden, and the pond with its pavilion. The Qin case form measures such a house wall and room by room; the Yili's rites of visiting are staged across its gates and up its steps. Click any building, wall, or court to read what it is. The figures are the family, its retainers, and its servants.",
  names: HOUSE_NAMES,
  features: HOUSE_FEATURES,
  folk: HOUSEHOLD,
  strollPlaces: HOUSE_STROLL_PLACES,
  smoking: ["hearth"],
  words: {
    awake: "the house is awake · pause",
    wake: "wake the house",
    firstStep: "the house wakes when the map has loaded",
    day: { en: "The house's day", zh: "第中一日" },
    nothing: { en: "Nothing has stirred yet.", zh: "第尚未醒。" },
    folk: { en: "Who lives here", zh: "一家之人" },
    folkNote: {
      en: "A great house was a family, the retainers it fed, and the servants it owned or hired, in that order of rank and the reverse order of number. The Zhanguoce has a chancellor keep clients by the hundred; the Qin statutes count a household's servants with its oxen. The house's people are sorted as the house would have sorted them.",
      zh: "大家者，一家、所养之客、所畜之仆，以位则如此，以数则反之。战国策相国养客数百；秦律计一户之臣妾与其牛。此第之人依家之所序而分。",
    },
  },
  sources: [
    {
      name: "The Chuci",
      text: "(the Zhao hun and the Da zhao): the summons walks a soul home through the house it left, hall by hall and thing by thing, the gauze hangings, the lamp stands, the se and the drums, the chilled wine, the liubo board; the fullest inventory of a lord's rooms the period wrote.",
    },
    {
      name: "The Shuihudi case forms",
      text: "(Fengzhenshi): the sealing of a house room by room, one hall and two inner rooms each with its door, the wall measured and its marks read, the outbuildings and the mulberries at the gate counted.",
    },
    {
      name: "The Yili",
      text: ": the rites of visiting and of the district feast, staged across the gates, the court, and the east and west steps of a house exactly this shape.",
    },
    {
      name: "The Zhongshan king's bronze plan",
      text: "(the zhaoyu tu, from King Cuo's tomb at Lingshou): halls set round walled enclosures with their dimensions in chi, the earliest scaled plan from China.",
    },
    {
      name: "The Kaogongji and the Erya",
      text: ": the hall's terrace height by rank, the rooms at the gate's side, the side ranges that make a hall a temple, the screen inside a ruler's gate.",
    },
    {
      name: "The Analects, Mencius, and the Zhanguoce",
      text: ": the screen wall and the bell frame as a ruler's privileges, the gentleman's distance from the kitchen, and the chancellors who fed retainers by the hundred.",
    },
  ],
};
