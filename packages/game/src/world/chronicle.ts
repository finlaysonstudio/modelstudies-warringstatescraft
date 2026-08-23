import type { Localized } from "./gazetteer";

/**
 * The chronicle: the chapters in order, each with the date its opening
 * situation is anchored to and what the world remembers once it has
 * passed. Memory is the chronicle's, not any run's: chapter N+1 opens from
 * what the sources record after chapter N, never from a played outcome
 * (the chapters bend the sources at their decision points, so a played
 * outcome is not history). The renderer puts the lines a state remembers
 * from every earlier chapter into its brief, after its character block.
 *
 * Lines are written against gazetteer keys and name no person.
 */

export interface ChronicleChapter {
  /** scenario id */
  id: string;
  /** 0 = prologue, then chronicle order */
  order: number;
  /** the anchor of the opening situation */
  date: string;
  title: Localized;
  /** what each cast member (by key) remembers once this chapter has passed */
  remembers: Record<string, Localized>;
}

export const CHRONICLE: ChronicleChapter[] = [
  {
    id: "strait-states",
    order: 0,
    date: "c. 485 BCE",
    title: { en: "The Strait", zh: "海峡" },
    remembers: {
      qi: {
        en: "A century and more ago {wu}'s fleet came up the coast by sea to strike {qi} and was beaten in {gulf}; no fleet has tried since.",
        zh: "一百多年前，{wu}的舟师从海上北来攻{qi}，在{gulf}被击败；此后再无舟师尝试。",
      },
      chu: {
        en: "{wu} and {yue} fought across the water until {yue} swallowed {wu} and then was swallowed in turn by {chu}; the southern shore is yours now.",
        zh: "{wu}与{yue}隔水相攻，直到{yue}吞并{wu}，又被{chu}吞并；南方海滨如今归你们。",
      },
    },
  },
  {
    id: "land-register",
    order: 1,
    date: "356–338 BCE",
    title: { en: "The Register", zh: "籍册" },
    remembers: {
      qin: {
        en: "The register stood. The chancellor who wrote it fled when the old king died, was refused a bed at an inn under his own passport law, was refused asylum by {wei}, and was torn by chariots; his law outlived him.",
        zh: "籍册立住了。写下它的相邦在先王死后出奔，因自己定下的验传之法被客舍拒之门外，求庇于{wei}而被拒，终遭车裂；他的法却活过了他。",
      },
      clan: {
        en: "The reformer died and the register did not; the heir's guardian who had kept his doors shut for eight years saw him torn by chariots and the five-family bond stand.",
        zh: "变法者死了，籍册没有死；闭门八年的太子之傅看着他被车裂，而什伍连坐之法依旧。",
      },
      wei: {
        en: "A dying minister told the king to employ the clerk or kill him; the king did neither, and the clerk built {qin}, took the land west of {river}, and was refused asylum at your border when he fled.",
        zh: "一位临终的大臣劝王重用那名小吏或杀掉他；王两者都没做，那小吏造就了{qin}，夺走了{river}以西之地，出奔时在你们的边境被拒。",
      },
    },
  },
  {
    id: "salt-and-iron",
    order: 2,
    date: "c. 340s BCE",
    title: { en: "The Salt Office", zh: "盐官" },
    remembers: {
      qi: {
        en: "The salt office has been {qi}'s treasury since the first hegemon: the shore boils in winter, private fires are banned in spring, and the states that cannot boil pay ten times.",
        zh: "自首霸以来，盐官就是{qi}的府库：冬日海滨煮盐，春日禁私煮，不能煮盐的国家出十倍的价。",
      },
      wei: {
        en: "A state without salt swells; {qi} has closed its salt before and the first hegemon swore at a covenant never to stop grain at a border.",
        zh: "无盐之国则肿；{qi}曾关闭过盐市，而首霸曾在会盟上起誓不阻遏籴粮。",
      },
      yan: {
        en: "The boiling-grounds of the northeast are {yan}'s one endowment the rich states lack; they have been offered gold for them and threatened for them.",
        zh: "东北的煮盐之地是{yan}唯一为富国所无的资源；有人为它出过黄金，也为它出过威胁。",
      },
    },
  },
  {
    id: "heavy-coin",
    order: 3,
    date: "c. 330s BCE",
    title: { en: "The Heavy Coin", zh: "大钱" },
    remembers: {
      qin: {
        en: "{qin} cast one round coin of stated weight and declared that pearls, jade, and tortoise shell are ornaments and not money; the eastern markets kept their knives and spades.",
        zh: "{qin}铸了一种标明重量的圜钱，并宣告珠玉、龟贝为器饰而非币；山东诸市仍用它们的刀币与布币。",
      },
      qi: {
        en: "The knife coin is {qi}'s and {yan}'s; a royal minister once warned that a heavy coin drains the people as a dam drains a stream, and the kings heard him.",
        zh: "刀币是{qi}与{yan}的；王室的一位大臣曾谏言大钱夺民之资，如塞川原而为潢洿，诸王听进去了。",
      },
      tao: {
        en: "{tao} weighs every court's coin against gold and grain and takes a toll on the difference; a market that clears for everyone is protected by everyone until the day it is not.",
        zh: "{tao}以黄金与粟衡量各国之币，于其差价取利；为众人交易之市受众人保护，直到不再受保护的那一天。",
      },
    },
  },
  {
    id: "famine-granary",
    order: 4,
    date: "330s BCE",
    title: { en: "The Granary Debt", zh: "粟债" },
    remembers: {
      qin: {
        en: "{qin} once floated grain down {river} to feed a starving rival and, a generation later, was refused grain in its own famine; the war that followed is the story every court tells about closed granaries.",
        zh: "{qin}曾顺{river}运粟救济饥饿的敌国，一代人之后自己遭饥却被拒籴；随之而来的战争，是每个朝廷讲起闭籴时都会说的故事。",
      },
      wei: {
        en: "Your granaries on {river} are full when {qin}'s fail; a master at your court has taught that moving grain to the hungry district is what a king does.",
        zh: "当{qin}歉收时，你们{river}边的粮仓是满的；你们朝中的一位先生教导说，移粟于饥区是为王者所为。",
      },
      wey: {
        en: "{wey}'s ferries have carried grain between courts that would not speak, and both courts have blamed the carrier afterward.",
        zh: "{wey}的渡船曾为不肯往来的两国转运粮食，事后两国都归咎于转运者。",
      },
    },
  },
  {
    id: "schools-of-the-hundred",
    order: 5,
    date: "314 BCE",
    title: { en: "The Masters of Jixia", zh: "稷下先生" },
    remembers: {
      qi: {
        en: "{qi} took {yan} in fifty days when its court fell into civil war, was told by a master at {jixia} that the people's welcome was the only warrant, and was driven out within two years when the states moved to rescue {yan}.",
        zh: "{qi}趁{yan}内乱五旬而取之，{jixia}的一位先生告诫唯有{yan}之民的悦服才是凭据，两年之内诸侯谋救{yan}，{qi}被逐出。",
      },
      jixia: {
        en: "A master of the hall told the king to his face that taking {yan} by the people's welcome was warranted and holding it against them was not; he left the court slowly and was not stopped.",
        zh: "堂中一位先生当面对王说，取{yan}以民之悦则可，违民而据之则不可；他缓缓离开朝廷，无人阻拦。",
      },
      yan: {
        en: "{yan}'s throne was given away to a minister, the state fell into civil war, {qi} occupied it for a season, and the new king built a hall and served scholars as teachers until men came from every state.",
        zh: "{yan}的王位被让给了一位大臣，国家陷入内乱，{qi}占据一季，新王筑宫而以学者为师，直到各国之士争相而来。",
      },
    },
  },
  {
    id: "royal-domain",
    order: 6,
    date: "307–300 BCE",
    title: { en: "The Royal Domain", zh: "王畿" },
    remembers: {
      zhou: {
        en: "{qin} took {yiyang} from {han} and stood on {zhou}'s border asking for the road and the tripods; the royal court answered with promises to one side and envoys to the other, and kept both courts and the tripods a while longer.",
        zh: "{qin}从{han}手中夺取{yiyang}，兵临{zhou}境求道与九鼎；王室以许诺应付一方，以使者应付另一方，又保住了两宫与九鼎一时。",
      },
      qin: {
        en: "The royal house has no army and every road; it has lent the road and withheld it, and a king of {qin} once died at its court lifting a tripod.",
        zh: "王室无兵而有每一条道路；它借过道，也拒过道，{qin}的一位先王曾在它的朝廷举鼎而死。",
      },
      han: {
        en: "{yiyang} fell after a siege of five months and {han} learned that a covenant rescues nobody in time; since then it has survived by stratagem.",
        zh: "{yiyang}被围五月而陷，{han}由此知道合纵救不了任何人；此后它以计谋求存。",
      },
    },
  },
  {
    id: "conscription-rolls",
    order: 7,
    date: "301 BCE",
    title: { en: "The Rolls of Shu", zh: "蜀籍" },
    remembers: {
      qin: {
        en: "{shu} rose under its marquis and was put down by the general who first conquered it; the register reached the mountains and the levies from {shu} fed the wars in the east.",
        zh: "{shu}在其侯之下起事，被首次平定它的将军再次平定；籍册到了山中，{shu}的兵员与粮食供给了东方的战争。",
      },
      shu: {
        en: "Two marquises of the old lineage were killed for rising; the governor stayed, the register stayed, and the roads north carried grain and men away.",
        zh: "旧族的两位侯因起事被杀；郡守留下了，籍册留下了，北去的道路运走了粮与人。",
      },
      mohists: {
        en: "The order has held cities for lords who kept its tally and refused lords who attacked; a grandmaster once died with a hundred and eighty disciples rather than yield a city whose lord had fled.",
        zh: "墨者曾为持符之主守城，曾拒绝攻人之主；一位钜子宁与一百八十弟子同死，也不肯交出主君已逃的城。",
      },
    },
  },
  {
    id: "borrowed-road",
    order: 8,
    date: "286 BCE",
    title: { en: "The Borrowed Road", zh: "假道" },
    remembers: {
      qi: {
        en: "{qi} swallowed {song} and {tao} and called itself eastern emperor; within two years five states under a general from {yan} broke it to two cities, and its king died fleeing through {wey}.",
        zh: "{qi}吞并{song}与{tao}，自称东帝；两年之内，五国之师在{yan}将率领下将它打到只剩两城，其王出亡途中死于{wey}。",
      },
      yan: {
        en: "A general of {yan} led the five states against {qi} and took seventy cities; the king who served scholars as teachers had his revenge, and the covenant proved it could punish its own presiding court.",
        zh: "{yan}将率五国之师伐{qi}，下七十余城；以学者为师的那位王报了仇，合纵证明了它能惩罚自己的主盟之国。",
      },
      song: {
        en: "{song} was called the tyrant state, its people scattered before {qi}'s army, and its last king died in exile; {tao} passed to whoever held the roads.",
        zh: "{song}被称为桀宋，其民在{qi}军之前四散，末代之王死于流亡；{tao}归于掌握道路者。",
      },
      wey: {
        en: "A fleeing king of {qi} lodged at {puyang}, insulted his host, and was driven out; the dependency was remembered once and wished it had not been.",
        zh: "出亡的{qi}王寓于{puyang}，对主人无礼，被驱逐；附庸被人记起了一次，并希望没有。",
      },
      council: {
        en: "The covenant turned on its own presiding court when that court ate a member; the oath was kept by being enforced against {qi}, and the west watched.",
        zh: "当主盟之国吞并了一个盟国，合纵转而讨伐它；盟誓因对{qi}的执行而得以维持，西方在旁观看。",
      },
      wei: {
        en: "{wei} marched with the five states against {qi} and took {song}'s old lands on {river}; {tao} went to a chancellor of {qin} as a fief.",
        zh: "{wei}随五国伐{qi}，取得{song}在{river}边的旧地；{tao}成了{qin}一位相邦的封邑。",
      },
    },
  },
  {
    id: "corridor-states",
    order: 9,
    date: "262–260 BCE",
    title: { en: "The Corridor", zh: "上党" },
    remembers: {
      qin: {
        en: "At {changping} the army of {zhao} was cut off for forty-six days, surrendered, and was buried; two hundred and forty boys were sent home to tell it. The corridor is {qin}'s.",
        zh: "在{changping}，{zhao}军被断粮四十六日，降而被坑；放回二百四十名少年去传话。{shangdang}归了{qin}。",
      },
      zhao: {
        en: "{zhao} took {shangdang} as a gift, replaced the general who held the walls on a bought rumor, asked {qi} for grain and was refused, and lost an army of four hundred thousand at {changping}.",
        zh: "{zhao}受{shangdang}之献，因一则买来的流言撤换了守垒之将，向{qi}请粟被拒，在{changping}丧师四十万。",
      },
      qi: {
        en: "{zhao} asked {qi} for grain before {changping} and {qi} refused it; a minister had warned that {zhao} is the lip to {qi}'s teeth, and was not heeded.",
        zh: "{changping}之前{zhao}向{qi}请粟，{qi}不许；一位大臣曾谏言{zhao}之于{qi}犹齿之有唇，未被采纳。",
      },
      han: {
        en: "{han}'s governor at {shangdang} gave the highland to {zhao} rather than to {qin}, so that {qin}'s blow fell on {zhao}; it fell, and {han} was spared for a while.",
        zh: "{han}的{shangdang}郡守把高地献给{zhao}而不献给{qin}，使{qin}之兵加于{zhao}；兵果然加于{zhao}，{han}得以暂免。",
      },
      wei: {
        en: "When {qin} went on to besiege {handan}, {wei}'s relief column halted at {ye} under {qin}'s threat to strike any rescuer first, and a prince of {wei} stole the tally to move it.",
        zh: "{qin}进而围{handan}时，{wei}的救兵在{qin}先击救者的威胁下止于{ye}，{wei}的一位公子窃符才得以发兵。",
      },
    },
  },
  {
    id: "hostage-prince",
    order: 10,
    date: "257 BCE",
    title: { en: "The Hostage Prince", zh: "质子" },
    remembers: {
      qin: {
        en: "A grandson of {qin}'s king was a hostage at {handan} when {qin} besieged it; {zhao} meant to kill him, a merchant bought the guards with six hundred catties of gold, and the hostage came home to be heir.",
        zh: "{qin}围{handan}时，{qin}王的一位孙子正质于{handan}；{zhao}欲杀之，一位商人以六百斤金买通守吏，质子归国而为嗣。",
      },
      zhao: {
        en: "{zhao} held {qin}'s hostage through the siege of {handan}, thinned his allowance when {qin} attacked, resolved to kill him, and lost him to a merchant's gold; the merchant became {qin}'s chancellor.",
        zh: "{zhao}在{handan}之围中扣留{qin}的质子，{qin}来攻则削其供给，决意杀之，却因商人之金失之；那商人后来做了{qin}的相邦。",
      },
      merchant: {
        en: "A merchant of {handan} called a hostage prince rare goods worth holding, spent a thousand pieces of gold on him, and was paid with a chancellorship; every house with gold remembers the return.",
        zh: "{handan}的一位商人称质子为奇货可居，为他花了千金，换来了相邦之位；每一个有金的家族都记得这笔回报。",
      },
      yan: {
        en: "{yan}'s crown prince was a hostage at {handan} in those years beside {qin}'s, and later a hostage at {xianyang}, where he was treated without courtesy and fled home.",
        zh: "那些年{yan}的太子也质于{handan}，与{qin}的质子为伴，后来又质于{xianyang}，在那里受到无礼的对待，逃归本国。",
      },
    },
  },
  {
    id: "river-works",
    order: 11,
    date: "246 BCE (bent to the 270s)",
    title: { en: "The Engineer's Canal", zh: "水工之渠" },
    remembers: {
      qin: {
        en: "{han} sent an engineer to exhaust {qin} with a canal from {jing}; the plot was found half-dug, the engineer said the canal would serve {qin} for ten thousand generations, and {qin} finished it and had no more bad years in {guanzhong}.",
        zh: "{han}遣水工以{jing}之渠疲{qin}；渠挖到一半事觉，水工说渠成亦{qin}万世之利，{qin}修成了它，{guanzhong}从此无凶年。",
      },
      han: {
        en: "The engineer bought {han} a few years and gave {qin} a granary; a stratagem that feeds the enemy is the kind {han} can afford.",
        zh: "水工为{han}延了数年之命，却给了{qin}一座粮仓；资敌之计，正是{han}付得起的那种。",
      },
      wei: {
        en: "{daliang} sits below {river} among canals, and every court knows that a dike cut upstream drowns it; three houses once drowned a city by water and the besieged lord cut their dike by night.",
        zh: "{daliang}在{river}之下、渠水之间，各国都知道上游决堤便可灌之；三家曾以水灌城，被围之主夜决其堤。",
      },
    },
  },
  {
    id: "assassins-map",
    order: 12,
    date: "227 BCE",
    title: { en: "The Map of Dukang", zh: "督亢之图" },
    remembers: {
      qin: {
        en: "An envoy of {yan} unrolled the map of {dukang} before the king of {qin} and a dagger was in it; the king lived, {qin} took {ji} within the year, and {yan}'s king sent his own son's head, which changed nothing.",
        zh: "{yan}使者在{qin}王面前展开{dukang}之图，图穷而匕首见；王得免，{qin}当年取{ji}，{yan}王献上亲子之首，于事无补。",
      },
      yan: {
        en: "The crown prince who had fled {xianyang} sent a dagger in a map; {qin} took {ji}, the king fled east, killed the prince on {dai}'s advice, and was taken four years later anyway.",
        zh: "从{xianyang}逃归的太子把匕首藏进地图；{qin}取{ji}，王东走，依{dai}之劝杀太子，四年后仍被俘。",
      },
      dai: {
        en: "{dai} advised {yan} to send the prince's head and {qin} attacked anyway; the remnant court lasted four more years in the hills.",
        zh: "{dai}劝{yan}献太子之首，{qin}仍来攻；残余的朝廷在山中又撑了四年。",
      },
    },
  },
];

export const chronicleChapter = (id: string): ChronicleChapter | undefined =>
  CHRONICLE.find((chapter) => chapter.id === id);

/**
 * What a cast member remembers at the opening of a chapter: the lines
 * recorded for it by every chapter that precedes `order`, in chronicle
 * order.
 */
export const memoryBefore = (state: string, order: number): Localized[] =>
  CHRONICLE.filter(
    (chapter) => chapter.order < order && chapter.remembers[state],
  ).map((chapter) => chapter.remembers[state]);
