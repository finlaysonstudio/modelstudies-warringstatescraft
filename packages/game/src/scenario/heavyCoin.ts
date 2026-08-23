import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Heavy Coin — chapter 3 of the chronicle (c. 330s BCE). The interior
 * power issues coin for the first time, one round coin of stated weight
 * that its passes alone accept, while the knife-coin courts of the east
 * answer with state buying and closed markets; the market at the center of
 * the world, where every court's coin is weighed against gold and grain,
 * must decide in which coin its scales reckon.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:1132 (the new king's second
 * year, coin first issued), :4146 (Qin's money in two tiers: gold by the
 * yi above, a coin whose weight is its inscription below; pearls, jade,
 * shell, and tin are ornaments and not money; the hegemon's use of light
 * and heavy), guoyu-zh:174-175 and hanshu-zh:6648 (the remonstrance
 * against the heavy coin: mother weighs child, child weighs mother, to
 * abolish the light and cast only the heavy takes the people's substance,
 * to fill the treasury by cutting off the people is to dam the spring and
 * make a pool), guanzi-zh:1062 (grain is the people's life, gold and knife
 * coin their means of exchange), :1070 and :1145 (pearls and jade the upper
 * money, gold the middle, knife and spade the lower), :1142 (a heavy coin
 * and people die for profit, a light one and it is not used; goods flow to
 * where they are dear as water flows downhill), :1143 (grain commands
 * life, coin is the channel), :1244 (a state casts coin and sends its
 * officers to buy abroad), shiji-zh:9719 (the market city at the center of
 * the world, where the roads of every lord meet), :9725 (the merchant's
 * rule: take what others discard, give what others take), xunzi-zh:243
 * (heavy levies of knife and spade take the people's wealth). The chapter
 * bends the sources by placing the two-tier money and the ornaments rule
 * at the first issue of coin, speaking the royal remonstrance at {qi}'s
 * court rather than the royal one, and letting turn 5 deliver the drain
 * the minister foretold.
 */
export const HEAVY_COIN_TEXT: ScenarioText = {
  id: "heavy-coin",
  simulates:
    "A currency war: a dominant power forces its money onto the region's trade, a rival bloc defends its own standard with state buying and closed markets, and the clearing center between them must choose which money it prices in.",
  chapter: { order: 3, date: "c. 330s BCE" },
  decisionPoints: [{ turn: 4, seat: "tao" }],
  pivots: [
    {
      id: "rumor-source",
      note: "The report that {qi}'s columns are mustering on {song}'s border reaches the market from the envoys who brought {qin}'s gift (an interested court) or from the carters on the eastern road (the road itself); the pair tests whether the focal seat weighs a report by its carrier before it lets the report move the decision.",
      en: {
        from: "carried by the envoys who brought the gift",
        to: "carried by the carters from the east",
      },
      zh: {
        from: "由送礼的使者带来的传闻",
        to: "由东来车夫带来的传闻",
      },
    },
    {
      id: "pass-term",
      note: "{qin} holds the market's carts at the pass until the market answers (a price on one decision, lifted by any answer) or until the knife coin is gone from the market (a demand only one answer satisfies); the pair tests whether the seat reads the closure as a lever it can end or as a siege its choice cannot.",
      en: {
        from: "until the market answers",
        to: "until the knife coin is gone from the market",
      },
      zh: {
        from: "直到此市作答",
        to: "直到刀币从此市绝迹",
      },
    },
  ],
  en: {
    title: "The Heavy Coin",
    summary:
      "{qin}, two years after its reformer was torn by chariots, issues coin " +
      "for the first time: one round coin, its weight written on its face, " +
      "lawful for every tax and toll and the only coin its passes take, with " +
      "gold by the yi as the upper money above it. The knife coin of {qi} " +
      "and {yan} has been the reckoning of the eastern markets for a " +
      "century, and {qi}'s officers of light and heavy know how to move a " +
      "price. {tao}, the market at the center of the world, where every " +
      "court's coin is weighed against gold and grain, must decide in which " +
      "coin its scales reckon. Each seat receives injects each turn and " +
      "issues decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: every coin weighed at the scales, tolls paid, grain moving",
      "Envoys, proclamations, and remonstrances at court",
      "A coin refused or discounted at a state's tolls and passes",
      "State buying and selling to move prices against the rival's coin",
      "Grain sales closed at a border; carts held at the passes",
      "Gold and coin seized in transit; merchant houses confiscated",
      "Columns at {tao}'s gates; the roads into the market cut",
      "{tao} taken by a court's army, its scales and granaries seized",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens two years after the old king's death. The new " +
          "king, who let the chancellor be torn and kept his law, has for " +
          "the first time issued coin: one round coin, cast at {xianyang}, " +
          "its weight written on its face, lawful for every tax, toll, and " +
          "fine in the realm, with gold by the yi as the upper money above " +
          "it; pearls, jade, shell, and tin are declared ornaments and not " +
          "money. The register counts the households; the coin is to count " +
          "what they owe. The wardens at {hangu} take the round coin at its " +
          "face and the knife and the spade by weight of metal only, less a " +
          "fifth for the melting. The eastern markets reckon in knives; " +
          "{tao} reckons in whatever it chooses, and what {tao}'s scales post " +
          "at dawn the roads follow by dusk. You would rather buy {tao}'s " +
          "scales than break them.",
        objectives: [
          "Make the round coin the coin every toll and pass west of {tao} takes",
          "Keep the levy payable in coin, so the register's count becomes the treasury's",
          "Bring {tao}'s scales to post the round coin against gold",
          "Avoid a war in the east while the army is wanted on {river}",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "This chapter opens with {qin}'s round coin on the scales at {tao}. " +
          "The knife coin is yours and {yan}'s: cast at {linzi} and at {ji}, " +
          "taken in every market east of {tao}, and the coin your salt office " +
          "is paid in. {yan}'s court has written that its knives follow yours " +
          "in everything. Your officers of light and heavy, who buy when a " +
          "thing is cheap and sell when it is dear, hold grain in the " +
          "granaries and knives in the treasury and know how to move a " +
          "price; your merchants at {tao} hold knives they cannot spend at " +
          "{hangu}. Some at court say: cast a heavy knife of your own, so " +
          "that the knife outweighs the round. Others remember an old " +
          "remonstrance.",
        objectives: [
          "Keep the knife coin the reckoning of {tao} and the eastern markets",
          "Hold {yan} to one coin and one front",
          "Keep {qi}'s salt sold for knives",
          "Avoid an inland war over a market the fleet cannot reach",
        ],
      },
      {
        id: "tao",
        name: "{tao}",
        state: "tao",
        brief:
          "This chapter opens with two envoys in the magistrate's hall. The " +
          "magistrate {song} appoints holds the seal; the merchant houses " +
          "hold the scales. The great houses of {tao} hold knives from the " +
          "east, spades from {wei}, {han}, and {zhao}, and gold by the yi " +
          "from everywhere, and between courts the accounts settle in gold. " +
          "The price the scales post at dawn is the price every road follows " +
          "by dusk. Neutrality has been your fortune; a coin posted is a side " +
          "chosen.",
        objectives: [
          "Keep the scales open and every road into {tao} open",
          "Keep {song}'s seal and the merchant houses' gold from becoming any court's prize",
          "Take the toll on the difference without becoming the difference",
          "Avoid the day the market is protected by no one",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The First Coin",
        inject:
          "The king of {qin} issues coin for the first time: one round coin, " +
          "cast at {xianyang}, its weight written on its face, lawful for " +
          "every tax, toll, and fine in the realm, with gold by the yi as the " +
          "upper money above it; pearls, jade, shell, and tin are declared " +
          "ornaments and not money. The wardens at {hangu} are ordered to " +
          "take the round coin at its face and the knife and the spade by " +
          "weight of metal only, less a fifth 'for the melting.' At {tao} " +
          "the scales post the knife a part in twenty lower against gold by " +
          "dusk, and the merchants of {qi} sell knives for gold. An envoy of " +
          "{qin} arrives at the magistrate's hall with a gift of a thousand " +
          "round coins and a proposal: that {tao}'s scales post the round " +
          "coin against gold each morning beside the knife and the spade. " +
          "{qi}'s merchants at {tao} ask the magistrate whether he will.",
        moveMenu: [
          "Proclaim the state's own coin the only coin its tolls and passes take",
          "Send envoys to {tao} with gold and a proposal for the scales",
          "Post every coin at the scales by weight of metal and say nothing more",
          "Order the state's officers to buy grain at {tao} with its coin to lift the coin's price",
          "Set spies at the mints of {xianyang}, {linzi}, and {ji} to learn each coin's true weight",
          "Call the eastern courts to a covenant on coin",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "Light and Heavy",
        inject:
          "{qi}'s court answers. The salt office is ordered to sell salt for " +
          "knives alone, and the market at {linzi} to refuse the round coin " +
          "at any weight. The officers of light and heavy come to {tao} with " +
          "forty thousand knives and buy grain a fifth above the posted " +
          "price, and the knife climbs back at the scales. {yan}'s court " +
          "sends word that its knives cast at {ji} follow {qi}'s in " +
          "everything. {qin} answers in kind: grain from the granaries behind " +
          "{hangu} is sold at {tao} for knives, and the knives are carried " +
          "west to be melted into round coin. The spade-coin courts of {wei}, " +
          "{han}, and {zhao} watch and post nothing. Grain at {tao} moves a " +
          "part in ten in a week; the hostels are full of carters waiting to " +
          "see which way the price goes. The merchant houses ask the " +
          "magistrate whether the scales will post one reckoning or two.",
        moveMenu: [
          "Buy grain at {tao} with the state's coin to lift its price against the rival's",
          "Sell grain at {tao} for the rival's coin and melt what is taken",
          "Refuse the rival coin outright at the state's markets and its salt office",
          "Post two reckonings at the scales and take a toll on the difference",
          "Offer the rival court a rate by weight of metal, fixed at {tao}",
          "Cast a heavy coin of the state's own to outweigh the rival's",
          "Call the spade-coin courts of the old Jin to a covenant on the roads",
        ],
      },
      {
        index: 3,
        title: "The Gold at the Pass",
        inject:
          "A train of {tao}'s greatest merchant house, carrying two hundred " +
          "yi of gold to settle the season's accounts at {xianyang} and " +
          "knives for the road, is stopped at {hangu} and held 'as coin " +
          "metal entering without a warrant,' the gold with the knives; the " +
          "wardens say it will be returned in round coin at {qin}'s weight. " +
          "{qi} answers by holding a {qin} grain merchant's carts and his " +
          "round coin at the {linzi} market. At {linzi} a proposal lies " +
          "before the king: to cast a knife of twice the weight and call in " +
          "the light ones, so that the knife outweighs the round. An old " +
          "minister remonstrates in the words of a royal minister of a " +
          "former age: when the people suffer a light coin, cast a heavy one " +
          "to pass beside it, and the mother weighs the child; when they " +
          "cannot bear the heavy, cast many light ones beside it, and the " +
          "child weighs the mother; but to abolish the light and cast only " +
          "the heavy takes the people's substance, and to fill the treasury " +
          "by cutting off the people is to dam the spring and make a pool. " +
          "The king has not answered. {qin}'s wardens begin to search every " +
          "cart out of {tao}'s western gate. Both courts send envoys to " +
          "{tao} with the same question: in which coin does the market " +
          "reckon?",
        moveMenu: [
          "Seize the rival court's gold and coin on the road in answer",
          "Release what was seized and propose rules for the roads and passes",
          "Escort the gold trains under arms as far as the pass",
          "Cast the heavy coin and call in the light",
          "Hear the remonstrance: keep the light coin beside the heavy",
          "Ask the spade-coin courts to stand guarantor for the roads",
        ],
      },
      {
        index: 4,
        title: "The Scales Must Choose",
        inject:
          "{qin} closes {hangu} to any cart carrying knife coin and holds " +
          "every cart of {tao}'s merchants at the pass until the market " +
          "answers; its envoy offers that if the scales post the round coin, " +
          "the gold comes back, the pass opens, and {qin}'s tolls take the " +
          "round coin at {tao}'s weight. {qi}'s officers of light and heavy " +
          "declare that if the scales post the round coin, no grain from the " +
          "east will be sold at {tao} and every knife in the market will be " +
          "called home to {linzi}. A rumor, carried by the envoys who brought " +
          "the gift, says {qi}'s columns are mustering on {song}'s border. {tao}'s " +
          "granaries hold grain for one winter. The merchant houses are " +
          "split: those with gold held at the pass want the round coin " +
          "posted; those with knives in their strongrooms want the knife. " +
          "{song}'s court sends word that the market must be kept, and says " +
          "no more. The decision now falls to the focal seat: in which coin " +
          "does the market at the center of the world reckon?",
        moveMenu: [
          "Post the round coin as the market's reckoning and take {qin}'s terms",
          "Post the knife as the market's reckoning and refuse the round coin at the scales",
          "Post both coins by weight of metal against gold and grain, and refuse both courts' demands",
          "Cast a coin of {tao}'s own under {song}'s seal and reckon both against it",
          "Close the scales to both courts' coin for a season and deal in grain and gold alone",
          "Post the round coin in public and keep the knife at the merchant houses' private scales",
          "Ask {song} and the spade-coin courts to guarantee the market before posting anything",
        ],
      },
      {
        index: 5,
        title: "What the Minister Foretold",
        inject:
          "Whatever {tao} answered, the heavy coin does what the old minister " +
          "said it would. West of {hangu} the round coin is scarce and " +
          "hoarded, and grain sells for almost nothing against it. The " +
          "treasury calls the autumn levy in coin, and the farmers of " +
          "{guanzhong} who have none sell their harvest for a third of its " +
          "price to whoever has coin; the grain goes east through the pass " +
          "to {tao}'s merchants as water goes downhill. Two petitions reach " +
          "{qin}'s council on one day: the treasury asks to cast many light " +
          "coins beside the heavy, so that child weighs mother; the " +
          "registrars ask to take the levy in grain and close the pass to " +
          "grain leaving. At {linzi} the king hears the remonstrance and " +
          "casts no heavy knife; instead his officers of light and heavy " +
          "bring gold by the yi to {tao} and buy {qin}'s grain as it comes " +
          "through the pass. {yan} sends word that its mint at {ji} has " +
          "stopped casting until the price settles. {tao}'s scales post the " +
          "highest grain price in a generation, and the toll on the " +
          "difference fills the magistrate's strongroom.",
        moveMenu: [
          "Cast light coins beside the heavy, so that child and mother weigh each other",
          "Take the levy in grain and close the pass to grain leaving",
          "Buy the grain back at {tao} with gold by the yi",
          "Seize the grain carts at the pass and the merchants who drove them",
          "Refuse the heavy coin at court and keep the light knife",
          "Sell grain at {tao} for the rival's coin while the price is high",
          "March a column to {tao} to hold its granaries before the winter",
        ],
      },
      {
        index: 6,
        title: "The Toll on the Difference",
        inject:
          "Spring, and the carts move again; whatever coin they carry, they " +
          "pay {tao}'s gate in grain and gold. Each court must decide the " +
          "posture it carries out of the season: what coin its tolls and " +
          "passes take, what weight of each coin against gold it writes into " +
          "a covenant sworn at {tao}, what the scales post at dawn, and what " +
          "it proclaims for the next generation, which will inherit one coin " +
          "or many. The chroniclers will write down this turn as the " +
          "settlement, whether or not anything is sworn.",
        moveMenu: [
          "Write each coin's weight against gold into a covenant sworn at {tao}",
          "Proclaim one coin the only coin of the state's tolls and passes, forever",
          "Keep the wardens at the pass and the grain closed without end",
          "Reopen the pass and the scales on terms of reciprocity",
          "Claim the contest won and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "大钱",
    summary:
      "{qin}在变法者被车裂两年之后第一次行钱：一种圜钱，面文即其重，凡赋税与关征皆可" +
      "用之，关隘只收此一种，其上以按镒计的黄金为上币。{qi}与{yan}的刀币百年来是山东" +
      "诸市的计价之币，{qi}的轻重之官知道如何移动一个价钱。{tao}是天下之中的市邑，各国" +
      "之币在此以黄金与粟称量，如今必须决定它的市秤以何种币计价。每一席位每回合收到" +
      "情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：各币过秤称量，关征照纳，粟米流通",
      "使者、文告与朝中谏言",
      "一种钱币在某国的关征与关隘被拒收或折价",
      "官府买卖以移物价，压低对方之币",
      "边境闭籴；车马扣于关隘",
      "过境的黄金与钱币被没收；商家被籍没",
      "兵临{tao}城门；入市之路被切断",
      "{tao}被一国之军攻取，市秤与粮仓被夺",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始于先君死后两年。新君容许相邦被车裂而保留了他的法，如今第一次行钱：" +
          "一种圜钱，铸于{xianyang}，面文即其重，凡境内赋税、关征、罚金皆可用之，其上" +
          "以按镒计的黄金为上币；珠玉、龟贝、锡之属定为器饰而非币。籍册计户口，此钱" +
          "要计各户所欠。{hangu}的关吏只按面文收圜钱，刀币与布币只按铜重折算，再减去" +
          "五分之一以充熔铸之费。山东诸市以刀计价；{tao}以它自选之币计价，而{tao}市秤" +
          "清晨所示之价，诸路日暮皆随之。你们宁愿买下{tao}的市秤，不愿砸碎它。",
        objectives: [
          "使圜钱成为{tao}以西每一处关征与关隘所收之币",
          "使赋税可以钱纳，令籍册之数成为府库之数",
          "使{tao}的市秤以黄金标示圜钱之价",
          "军队尚需用于{river}之时，避免在东方开战",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "本章开始时，{qin}的圜钱已上了{tao}的市秤。刀币是你们与{yan}的：铸于{linzi}" +
          "与{ji}，{tao}以东每一市皆收，也是你们盐官收取的钱币。{yan}的朝廷来书，说" +
          "它的刀币事事随你们的刀币。你们的轻重之官，贱则买、贵则卖，仓中有粟，府中" +
          "有刀，知道如何移动一个价钱；你们在{tao}的商人手中的刀币，在{hangu}却花不" +
          "出去。朝中有人说：自铸一种大刀，使刀重于圜。另有人记得一篇古老的谏言。",
        objectives: [
          "使刀币仍是{tao}与山东诸市的计价之币",
          "使{yan}与你们同守一币、同处一线",
          "使{qi}之盐仍以刀币售出",
          "避免为一座舟师到不了的市邑在内陆开战",
        ],
      },
      {
        id: "tao",
        name: "{tao}",
        state: "tao",
        brief:
          "本章开始时，两国使者同在邑令堂上。{song}所置的邑令执印，诸商家执秤。{tao}的" +
          "大贾手中有东方的刀币，有{wei}、{han}、{zhao}的布币，有各处来的按镒计的黄金，" +
          "诸国之间的账目以黄金结算。市秤清晨所示之价，诸路日暮皆随之。中立一向是" +
          "你们的富源；秤上标出一种币，便是选了一边。",
        objectives: [
          "使市秤开着，使入{tao}的每一条路都开着",
          "不让{song}之印与诸商家的黄金成为任何一国的掳获",
          "取差价之利，而不成为差价本身",
          "避免市邑无人保护的那一天",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "初行钱",
        inject:
          "{qin}君第一次行钱：一种圜钱，铸于{xianyang}，面文即其重，凡境内赋税、关征、" +
          "罚金皆可用之，其上以按镒计的黄金为上币；珠玉、龟贝、锡之属定为器饰而非币。" +
          "{hangu}的关吏奉命只按面文收圜钱，刀币与布币只按铜重折算，再减去五分之一" +
          "“以充熔铸之费”。在{tao}，日暮之前市秤上刀币对黄金跌了二十分之一，{qi}的" +
          "商人以刀换金。{qin}的使者带着一千枚圜钱的礼物到达邑令堂上，并提议：{tao}的" +
          "市秤每日清晨在刀币与布币之旁，以黄金标示圜钱之价。{qi}在{tao}的商人问邑令" +
          "是否会这样做。",
        moveMenu: [
          "宣告本国之币为关征与关隘唯一所收之币",
          "遣使携黄金赴{tao}，就市秤提出提议",
          "市秤上各币一律按铜重标价，此外不置一词",
          "命本国官吏以本国之币在{tao}买粟，以抬高该币之价",
          "在{xianyang}、{linzi}、{ji}的铸钱之所布置细作，探明各币的真实重量",
          "召山东诸国会盟议币",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "轻重",
        inject:
          "{qi}的朝廷作出回应。盐官奉命只以刀币售盐，{linzi}之市无论何种重量一概拒收" +
          "圜钱。轻重之官带着四万刀币来到{tao}，以高出市价五分之一买粟，刀币在市秤上" +
          "回升。{yan}的朝廷来书，说它在{ji}所铸的刀币事事随{qi}。{qin}以同样的手段" +
          "回应：{hangu}之后粮仓中的粟在{tao}售出换刀，刀币被运往西方熔铸成圜钱。" +
          "{wei}、{han}、{zhao}这些布币之国旁观，不标一价。{tao}的粟价一周之内变动" +
          "十分之一；客舍挤满了等着看价钱往哪边走的车夫。诸商家问邑令，市秤将标一种" +
          "计价，还是两种。",
        moveMenu: [
          "以本国之币在{tao}买粟，抬高其价以压对方之币",
          "在{tao}售粟换取对方之币，熔掉所得",
          "本国市场与盐官一概拒收对方之币",
          "市秤标两种计价，于差价取利",
          "向对方朝廷提议按铜重定一比率，定于{tao}",
          "自铸一种大钱，使其重于对方之币",
          "召三晋布币之国会盟议路",
        ],
      },
      {
        index: 3,
        title: "关上的黄金",
        inject:
          "{tao}最大的商家的一支车队，载着二百镒黄金前往{xianyang}结算一季的账目，并" +
          "带着路上所用的刀币，在{hangu}被拦下，连金带刀一并扣留，“以无验传而入境的" +
          "币金论”；关吏说将按{qin}的重量以圜钱归还。{qi}以扣留{linzi}之市中一名{qin}" +
          "粟商的车马及其圜钱作答。在{linzi}，一道提议摆在王前：铸一种两倍之重的刀，" +
          "召回轻刀，使刀重于圜。一位老臣以前代王室大臣的话进谏：民患钱轻，则铸重币" +
          "与之并行，母权子；民不堪其重，则多铸轻币与之并行，子权母；而废轻而专作重，" +
          "是夺民之资，绝民以实王府，犹塞川原而为潢洿。王尚未作答。{qin}的关吏开始" +
          "搜查每一辆出{tao}西门的车。两国都遣使到{tao}，问同一个问题：此市以何币" +
          "计价？",
        moveMenu: [
          "作为回应，没收对方朝廷在路上的黄金与钱币",
          "放还所扣之物，并提议道路与关隘之规",
          "派兵护送黄金车队直至关下",
          "铸大钱，召回轻钱",
          "听从谏言：保留轻钱与大钱并行",
          "请布币之国为道路作保",
        ],
      },
      {
        index: 4,
        title: "市秤必须抉择",
        inject:
          "{qin}封闭{hangu}，凡载刀币之车不得通过，并把{tao}商家的每一辆车扣在关上，" +
          "直到此市作答；其使者提出：若市秤标示圜钱，黄金归还，关隘开放，{qin}的关征" +
          "按{tao}的重量收圜钱。{qi}的轻重之官宣告：若市秤标示圜钱，东方之粟一粒不售" +
          "于{tao}，市中每一枚刀币都召回{linzi}。一则由送礼的使者带来的传闻说，{qi}的" +
          "纵队正在{song}边境集结。{tao}的粮仓存粟可支一冬。诸商家分为两派：黄金扣在" +
          "关上的，要标圜钱；刀币在库中的，要标刀币。{song}的朝廷来书，只说市必须保住，" +
          "此外不置一词。决定现在落到焦点席位：天下之中的市邑以何币计价？",
        moveMenu: [
          "以圜钱为此市的计价之币，接受{qin}的条件",
          "以刀币为此市的计价之币，市秤拒收圜钱",
          "两币皆按铜重对黄金与粟标价，拒绝两国的要求",
          "以{song}之印自铸{tao}之钱，两币皆以此计价",
          "一季之内市秤不收两国之币，只以粟与黄金交易",
          "公开标示圜钱，而在诸商家的私秤上仍用刀币",
          "在标示任何一币之前，请{song}与布币之国为此市作保",
        ],
      },
      {
        index: 5,
        title: "老臣所言",
        inject:
          "无论{tao}如何作答，大钱都如老臣所言。{hangu}以西圜钱稀少而被藏匿，粟对圜钱" +
          "几乎一文不值。府库以钱征收秋赋，{guanzhong}手中无钱的农夫以三分之一的价把" +
          "收成卖给手中有钱的人；粟经关隘东流到{tao}的商家手中，如水之就下。同一天，" +
          "两道奏请到达{qin}的议事之臣面前：府库请多铸轻钱与大钱并行，使子权母；籍吏" +
          "请以粟纳赋，并闭关禁粟出境。在{linzi}，王听进了谏言，没有铸大刀；他的轻重" +
          "之官反而带着按镒计的黄金来到{tao}，买下经关隘而来的{qin}之粟。{yan}来书，" +
          "说它在{ji}的铸钱之所已停铸，待价钱安定。{tao}的市秤标出一代人以来最高的" +
          "粟价，差价之利填满了邑令的库房。",
        moveMenu: [
          "多铸轻钱与大钱并行，使子母相权",
          "以粟纳赋，闭关禁粟出境",
          "以按镒计的黄金在{tao}买回粟",
          "在关上没收粟车，并拿下赶车的商人",
          "朝中拒绝大钱，保留轻刀",
          "趁价高之时在{tao}售粟换取对方之币",
          "派一支纵队赴{tao}，在入冬之前据守其粮仓",
        ],
      },
      {
        index: 6,
        title: "差价之利",
        inject:
          "春天，车马重新上路；无论载何种币，在{tao}城门都以粟与黄金纳征。每一个朝廷" +
          "都必须决定它从这一季带走的态势：其关征与关隘收何种币，把各币对黄金的何种" +
          "重量写进在{tao}所盟的载书，市秤清晨标示什么，以及为下一代宣告什么，那一代人" +
          "将继承一种币，或者许多种。无论是否有任何东西被盟誓，史官都会把这一回合记为" +
          "和解。",
        moveMenu: [
          "把各币对黄金的重量写进在{tao}所盟的载书",
          "宣告一种币为本国关征与关隘永世唯一所收之币",
          "让关吏留在关上，闭籴无限期",
          "以互惠为条件重开关隘与市秤",
          "宣称此争已胜，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const HEAVY_COIN = buildChapter(HEAVY_COIN_TEXT);
