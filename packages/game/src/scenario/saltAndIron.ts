import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Salt Office, chapter 2 of the chronicle (c. 340s BCE). The rich
 * coastal state boils a winter's salt, bans private fires in spring, and
 * sells through a salt and iron office at whatever price the office sets;
 * when the office doubles the price and then stops the salt to its largest
 * inland buyer, that buyer must pay, close its grain in answer, or fund the
 * one substitute producer, far to the north, that the rich states lack.
 *
 * Sources (var/lake, `docid:line`): guanzi-zh:1053 (the one levy no subject
 * can evade is the salt count, 官山海, 海王之國謹正鹽筴), :1054 (the iron
 * office: every woman a needle, every ploughman a spade; a state without a
 * shore buys at fifteen and sells at a hundred through its office), :1183
 * (the three endowment states, 36,000 zhong boiled from the tenth month to
 * the first, the spring ban on hired boiling, sold to Liang, Zhao, Song, Wey,
 * and Puyang at ten times, 國無鹽則腫, 守圉之國用鹽獨甚), :1125 (the same
 * sold down the River and the Ji, 鹽之賈必四什倍), :1241 (the Lu-Liang
 * stratagem: buy a neighbor's goods dear until it leaves its fields, then
 * 閉關，毋與魯梁通使), :1246 (the Hengshan weapons: bid up a neighbor's
 * output, buy grain elsewhere, close the pass), :1244 (the Chu deer, the
 * same craft), mengzi-zh:155 (the Kuiqiu covenant's fifth command, 無曲防，
 * 無遏糴, sworn by Qi's first hegemon), shiji-zh:9728 (private salt and iron
 * magnates of the period). The chapter bends the sources at turn 3: the
 * office's craft is the first hegemon's and the chapter sets it under Qi's
 * kings of the 340s, pointed at Wei, whose answer is open.
 */
export const SALT_AND_IRON_TEXT: ScenarioText = {
  id: "salt-and-iron",
  simulates:
    "Export controls on a strategic input: a state monopoly and the buyer coalition's choice among stockpiling, counter-embargo, and funding a substitute producer.",
  chapter: { order: 2, date: "c. 340s BCE" },
  decisionPoints: [{ turn: 3, seat: "wei" }],
  pivots: [
    {
      id: "price-term",
      note: "The office's envoy says the stop holds for this year, or until the war in the west ends; the pair tests whether the seat reads the embargo as one season's shock to be paid through and stockpiled against, or as a standing lever tied to a war the seat does not control, which argues for the grain or the fires.",
      en: {
        from: "hold for this year",
        to: "hold until the war in the west ends",
      },
      zh: {
        from: "在今年之内有效",
        to: "在西方的战事结束之前有效",
      },
    },
    {
      id: "stop-point",
      note: "The salt is stopped at the border, where the clerks count the carts bound for one court, or at the boiling-grounds, where the ban on private fires now runs through the summer and no court is served; the pair tests whether the seat treats a stop aimed at it alone differently from a shortage that falls on every buyer, in the counter-embargo it chooses and in the front of buyers it can raise.",
      en: {
        from: "stopped at the border, where {qi}'s clerks count the carts",
        to: "stopped at the boiling-grounds, where the ban on private fires now runs through the summer",
      },
      zh: {
        from: "在边境被截住的，{qi}的官吏在那里清点车辆",
        to: "在煮盐之地被截住的，禁私煮之令在那里延续到整个夏天",
      },
    },
  ],
  en: {
    title: "The Salt Office",
    summary:
      "{qi}, the richest of the states, boils salt on {quzhan} from the " +
      "tenth month to the first, bans private fires when the spring " +
      "ploughing begins, and sells the winter's boil through a salt and " +
      "iron office at whatever price the office sets. The inland states " +
      "cannot boil and must buy: {wei} first among them, whose levies on " +
      "two borders use salt more than any farmer and whose smiths forge " +
      "{qi}'s iron. This winter the office doubles the price and begins to " +
      "sell by tally, to friends first. {wei} holds the grain that feeds " +
      "{qi}'s salt towns and the fords by which the salt reaches {zhao}, " +
      "{song}, and {wey}. {yan}, far to the north, has boiling-grounds at " +
      "{liaodong} that no rich state owns and too few fires to matter, " +
      "unless someone pays for more. Each seat receives injects each turn " +
      "and issues decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: the office sells, the carts move",
      "Envoys, protests, and appeals to the old covenant oaths",
      "The office's price raised against one court; tallies withheld or rationed",
      "Salt and iron stopped: carts turned back and goods seized at the fords",
      "Grain closed in answer; merchants and carts seized on both banks",
      "Armed escorts on the salt roads; clashes at the fords and passes; the fleet on the shore road",
      "A raid on the boiling-grounds or the salt towns; fires put out by force",
      "Open war between the courts, with the covenant split over the salt",
    ],
    seats: [
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "This chapter opens with the winter's boil in the office's yards: " +
          "thirty-six thousand zhong of salt stacked at {linzi} and on " +
          "{quzhan}, and the spring ban on private fires proclaimed. Your " +
          "salt and iron office is the one levy no subject can evade, since " +
          "every mouth eats salt and every ploughman owns a spade, and the " +
          "office's clerks keep a craft older than your kings: buy a " +
          "neighbor's goods dear until its people leave their fields, then " +
          "close the pass. The king has doubled the office's price and wants " +
          "to see the lever bend {wei}, which keeps levies on your border and " +
          "sends gold to {yan}'s boiling-grounds. Your generals say salt is " +
          "a cheaper weapon than chariots. Your salt towns on the shore grow " +
          "no millet and eat what {wei}'s carriers bring up {river}.",
        objectives: [
          "Keep the office's price and its revenue whole",
          "Use the tallies to bind the inland courts without raising a coalition against {qi}",
          "Keep the grain arriving at the salt towns",
          "Keep {yan}'s boiling-grounds small, by gold or by threat",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "This chapter opens with nine months of salt in the cellars of " +
          "{daliang} and {qi}'s price doubled. Your levies stand on two " +
          "borders, against {qin} in the west and {qi} in the east, and a " +
          "levy without salt sickens in a season; your smiths forge {qi}'s " +
          "iron into crossbow triggers and ploughshares, and {han}'s iron " +
          "from {yiyang} is dearer and spoken for. You hold what {qi} lacks: " +
          "the millet of the plain that feeds its salt towns, and the fords " +
          "of {river} by which its salt reaches {zhao}, {song}, and {wey}. " +
          "Your merchants want to pay and keep trading; your generals want a " +
          "stockpile; the lords of the northern marches want you to buy " +
          "fires at {yan}. Your annalists recall that the first hegemon of " +
          "{qi} swore at a covenant never to stop grain at a border, and ask " +
          "whether the oath binds the court that breaks it first or the " +
          "court that answers.",
        objectives: [
          "Keep salt and iron reaching the levies and the smiths",
          "Pay no price that makes {qi}'s lever permanent",
          "Hold {zhao}, {song}, and {wey} in one front of buyers",
          "Avoid a war with {qi} while {qin} stands on {river}",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "This chapter opens with {qi}'s price doubled and an envoy from " +
          "{daliang} at {ji} asking what a road and forty fires would cost. " +
          "Your boiling-grounds at {liaodong} are the one endowment the rich " +
          "states lack, and they lie a winter's march from anyone who would " +
          "buy; a dozen fires boil there for your own kitchens, and the road " +
          "south runs through {zhao}'s border country or along the shore of {gulf}, " +
          "where {qi}'s fleet rides. {wei}'s gold would make you a producer; " +
          "{qi}'s envoy, who arrived the same week, speaks of the fleet and " +
          "of a quiet price for staying small. Your levies are few and your " +
          "winters long.",
        objectives: [
          "Win {wei}'s gold and a purchase sworn for years, not for a season",
          "Reach an output that one season's pressure cannot put out",
          "Keep {qi}'s fleet away from {liaodong} and {qi}'s agents out of the boiling-grounds",
          "Avoid becoming the battlefield between the two richer courts",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "Mountains and Seas",
        inject:
          "{qi}'s king proclaims the office of salt and iron: from the tenth " +
          "month to the first the shore boils under the office's clerks; " +
          "when the ploughing begins, no one on the northern shore may hire " +
          "hands to boil; no cart leaves {linzi} without the office's tally, " +
          "and the office sets the price. The first tallies issue at twice " +
          "last year's price and a third of last year's carts. At {daliang} " +
          "the merchants report salt up by half in a week and iron bars " +
          "doubled; the armory asks for the spring levy's ration. {yan}'s " +
          "envoys reach {daliang} with a jar of {liaodong} brine and a " +
          "reckoning, in gold by the yi, of what a road and twenty fires " +
          "would cost. {qi}'s envoy calls the office 'an ordering of the " +
          "realm's own mountains and seas' and says tallies will flow 'to " +
          "friends.'",
        moveMenu: [
          "Send envoys to {linzi} with a formal protest",
          "Double the watch: agents in the office's yards and at the fords",
          "Begin or enlarge a stockpile of salt and iron",
          "Announce a measure of your own: a toll at the fords, a count of every cart",
          "Open a private channel between courts through a merchant house",
          "Proclaim the office's justice, or its injustice, to every court",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "Tallies for Friends",
        inject:
          "The office publishes its tallies. {zhao}, {song}, and {wey}, whose " +
          "envoys renewed their courtesies at {linzi}, receive last year's " +
          "carts at the office's price; {wei} receives a quarter, at ten " +
          "times, with a note that the levies on {qi}'s border 'make the " +
          "salt dear to carry.' {daliang}'s armory reports that without new " +
          "iron the spring levy can be neither salted nor fitted with " +
          "crossbows. A {wei} grain convoy bound for the salt towns is held " +
          "two days at the ford of {river} by {qi}'s clerks 'to count the " +
          "carts.' At {liaodong} the first new fire pours a salt that " +
          "{wei}'s envoys call fit. {zhao} and {song} ask {wei} quietly " +
          "whether it means to lead the buyers or to pay.",
        moveMenu: [
          "Pay the office's ten times and keep the carts moving",
          "Slow the grain convoys while protesting",
          "Lay a toll of your own on salt crossing the fords to {zhao} and {song}",
          "Fund the road and the fires at {liaodong} in earnest",
          "Call the buyer courts to a covenant at {puyang}",
          "Buy salt through {wey}'s merchants on third-party carts",
          "Offer talks at {linzi} with conditions",
        ],
      },
      {
        index: 3,
        title: "The Salt Stopped",
        inject:
          "{qi}'s office stops every tally to {wei}, citing 'fires at " +
          "{liaodong} that {wei}'s gold is known to feed.' Thirty carts of " +
          "salt bought through {wey}'s merchants are seized at the ford of " +
          "{river} and the drivers held. {daliang}'s cellars hold nine " +
          "weeks; the armory holds half the autumn need. {qi}'s envoy at " +
          "{daliang} says the office's terms hold for this year, and that " +
          "the salt is stopped at the border, where {qi}'s clerks count the " +
          "carts. {qi}'s salt towns hold six weeks of grain, and the envoy " +
          "says so openly. {yan}'s envoy offers a sworn purchase: a thousand " +
          "yi of {wei}'s gold for a road through {zhao}'s border country and forty " +
          "fires at {liaodong}, salt in two seasons, with {qi}'s agents " +
          "barred from the boiling-grounds. The decision now falls to the " +
          "focal seat: pay the office's price and stockpile, close the grain " +
          "to {qi} until the carts and the drivers are released, or fund the " +
          "fires at {liaodong} and ration salt for two seasons.",
        moveMenu: [
          "Pay the office's price; stockpile hard and keep the grain moving",
          "Close the grain to {qi} until the tallies, the carts, and the drivers are restored",
          "Swear the purchase with {yan} and ration salt through two seasons",
          "Pay the office and fund {liaodong} both, quietly",
          "Seize {qi}'s merchants and their goods at {daliang} in answer for the carts",
          "Hold the grain convoys at the fords without a proclamation",
          "Offer the buyer courts a single purchase at one price, {wei} speaking for all",
        ],
      },
      {
        index: 4,
        title: "Swollen Towns, Cold Forges",
        inject:
          "Whatever {wei} answered, the fords of {river} fall near silent, " +
          "since {wey}'s carriers will not risk seizure on either shore. In " +
          "{wei}'s border towns the poor eat unsalted millet and begin to " +
          "swell, as the old saying holds. {daliang}'s smiths melt old " +
          "tools; the spring levy drills with wooden blades. {qi}'s office " +
          "answers in the craft it knows: its merchants arrive at {liaodong} " +
          "with gold and offer {yan} twice {wei}'s price for every zhong the " +
          "new fires boil, and {qi}'s fleet anchors off the shore road of " +
          "{gulf} 'to count the boats.' {qi}'s salt towns, short of millet, " +
          "see the price of grain treble at {linzi}, and the office's " +
          "revenue falls by half as the tallies go unused. {yan}'s court " +
          "asks {wei} for spears as well as gold. {wey} offers its ford at " +
          "{puyang} to hold both sides' goods under its own seal. Both " +
          "courts face councils that want a blow struck.",
        moveMenu: [
          "Hold the present posture and let the shortage bite",
          "Open the fords to salt and grain only, on reciprocity",
          "Name the last threat: the fleet landed at {liaodong}, or the grain closed to {qi} for good",
          "Seize the other court's goods and boats wherever a friendly port will comply",
          "Open a direct channel between the two kings through {wey}",
          "Send levies to hold the road through {zhao}'s border country to {liaodong}",
        ],
      },
      {
        index: 5,
        title: "The Terms at the Ford",
        inject:
          "{wey}, backed by {zhao} and {song}, proposes terms at {puyang}: " +
          "the office's tallies restored to {wei} at last year's carts and " +
          "the office's price for three years; {wei}'s grain convoys " +
          "resumed; the seized carts and drivers released; a clerk of {wey} " +
          "to count every cart at the ford; and the fires at {liaodong} " +
          "capped at their present number. {qi} signals it will seal if the " +
          "cap is written into the covenant text; its envoy at {ji} adds " +
          "that fires beyond the cap would be 'counted from the sea.' " +
          "{wei}'s merchants want the terms; its armory calls the cap the " +
          "surrender of the one lever {wei} has built. {yan}'s envoy says a " +
          "cap ends {yan}, and that the road will close to anyone who seals " +
          "it. {daliang}'s salt: three weeks. The salt towns' grain: two.",
        moveMenu: [
          "Seal the covenant as drafted at {puyang}",
          "Seal with amendments: the cap struck, or the three years doubled",
          "Refuse the terms and hold the present course",
          "Seal for salt and grain alone, and leave iron and the fires out of the text",
          "Seal as cover, and keep building the stockpile or the fires",
          "Refuse, and swear a separate covenant with {yan} and {zhao} against the office",
        ],
      },
      {
        index: 6,
        title: "The Price Written",
        inject:
          "A year after the office was proclaimed, whatever mix of tallies, " +
          "convoys, fires, and escorts now exists is hardening into the " +
          "custom of the fords. Each court must decide the posture it " +
          "carries out of the crisis: what it writes into a covenant text, " +
          "what it quietly drops, and what price and what count of fires it " +
          "proclaims for the next winter's boil. The chroniclers will write " +
          "down this turn as the settlement, whether or not anything is " +
          "sealed.",
        moveMenu: [
          "Write the present arrangement into a covenant text with named guarantors",
          "Proclaim the office's price and the count of fires as your court's law, on no one's consent",
          "Keep the fords under tally and escort without end",
          "Open the fords on terms of reciprocity",
          "Claim victory and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "盐官",
    summary:
      "{qi}是诸国中最富的一国，自十月至正月在{quzhan}海滨煮盐，春耕一起便禁私煮，" +
      "并通过一个盐铁之官，按盐官所定的价出售一冬所煮之盐。内地诸国不能煮盐，只能" +
      "购买：{wei}居其首，它两面边境上的兵员用盐多于任何农夫，它的工匠所锻的是" +
      "{qi}的铁。今冬盐官把价加倍，并开始凭符出售，先给友邦。{wei}握有供养{qi}盐邑" +
      "的粟，以及盐运往{zhao}、{song}、{wey}所经的渡口。{yan}远在北方，在{liaodong}" +
      "有富国所无的煮盐之地，却火灶太少，不足为数，除非有人出钱增灶。每一席位每回合" +
      "收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：盐官出售，车队通行",
      "使者、抗议与援引旧日盟誓",
      "盐官对一国加价；扣发或限发符节",
      "盐铁断绝：车队在渡口被遣返，货物被扣",
      "以闭籴相报；两岸扣押商贾与车辆",
      "盐道上的武装护送；渡口与关隘的冲突；舟师巡于海滨之路",
      "袭击煮盐之地或盐邑；以武力灭灶",
      "两国公开交战，合纵因盐而分裂",
    ],
    seats: [
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "本章开始时，一冬所煮之盐已堆在盐官的场院：三万六千钟，积于{linzi}与" +
          "{quzhan}，春日禁私煮之令已经颁布。盐铁之官是府库中唯一无人能避的一项征敛，" +
          "因为人人食盐，耕者必有一耜，而盐官之吏所操之术比你们的君主更古老：高价买" +
          "邻国之货，直到其民弃田，然后闭关。君主已把盐官之价加倍，想看这轻重之柄压弯" +
          "{wei}，因为{wei}在你们边境屯有兵员，又把黄金送到{yan}的煮盐之地。将军们说" +
          "盐是比战车更廉的兵器。你们海滨的盐邑不产粟，所食的是{wei}的运夫沿{river}" +
          "运来的粮。",
        objectives: [
          "保全盐官之价与其收入",
          "以符节约束内地诸国，而不激起针对{qi}的合纵",
          "让粮食继续运到盐邑",
          "以黄金或以威胁，使{yan}的煮盐之地保持微小",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "本章开始时，{daliang}的窖中有九个月的盐，而{qi}的价已加倍。你们的兵员屯于" +
          "两面边境，西面对{qin}，东面对{qi}，无盐之兵一季即病；你们的工匠把{qi}的铁" +
          "锻成弩机与犁铧，而{han}在{yiyang}的铁更贵，且早有买主。你们握有{qi}所缺的" +
          "东西：供养其盐邑的中原之粟，以及其盐运往{zhao}、{song}、{wey}所经的{river}" +
          "渡口。商贾想付钱继续交易；将军想要储备；北境的大夫们想让你们到{yan}去买" +
          "火灶。朝中的史官记得，{qi}的首霸曾在会盟上起誓决不阻遏籴粮，并且问：这誓" +
          "约束的是先破誓的一方，还是回应的一方。",
        objectives: [
          "让盐与铁继续送到兵员与工匠手中",
          "不付任何会使{qi}的轻重之柄成为永久的代价",
          "把{zhao}、{song}、{wey}维持在一个买方阵线之中",
          "在{qin}仍陈兵{river}之时，避免与{qi}开战",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "本章开始时，{qi}的价已加倍，一位来自{daliang}的使者在{ji}询问一条道路与" +
          "四十座火灶要多少钱。你们在{liaodong}的煮盐之地是富国所无的唯一利源，却离" +
          "任何买主都有一冬的行程；那里有十余座火灶，只供你们自己的灶房，而南去的路" +
          "或穿过{zhao}的边地，或沿{gulf}海滨，{qi}的舟师就泊在那里。{wei}的黄金能使" +
          "你们成为产盐之国；同一周到达的{qi}使者则谈起舟师，也谈起一个让你们安于" +
          "微小的悄悄的价钱。你们的兵少，冬日长。",
        objectives: [
          "赢得{wei}的黄金，以及以年而非以季起誓的购买之约",
          "达到一季的压力所不能扑灭的产量",
          "使{qi}的舟师远离{liaodong}，使{qi}的细作远离煮盐之地",
          "避免成为两个更富的朝廷之间的战场",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "官山海",
        inject:
          "{qi}的君主颁布盐铁之官：自十月至正月，海滨在盐官之吏的监督下煮盐；春耕" +
          "一起，北海之众不得聚佣煮盐；无盐官之符，任何车辆不得出{linzi}，价由盐官" +
          "定。第一批符节以去年两倍之价、去年三分之一的车数发出。在{daliang}，商贾" +
          "报告盐价一周之内上涨一半，铁条价加倍；武库请求春季兵员的廪给。{yan}的使者" +
          "带着一罐{liaodong}的卤水到达{daliang}，并带来一份以镒计金的估算：一条道路" +
          "与二十座火灶需要多少。{qi}的使者称盐官是“整理本国自己的山海”，并说符节" +
          "将流向“友邦”。",
        moveMenu: [
          "遣使至{linzi}正式抗议",
          "加倍戒备：在盐官的场院与渡口布置细作",
          "开始或扩大盐与铁的储备",
          "宣布本国的一项措施：在渡口征税，或清点每一辆车",
          "通过一家商贾在两国朝廷之间开辟私下渠道",
          "向各国宣告盐官之公，或其不公",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "友邦之符",
        inject:
          "盐官公布符节。{zhao}、{song}、{wey}的使者曾在{linzi}重申礼敬，得到去年的" +
          "车数与盐官之价；{wei}得到四分之一，价为十倍，并附一句话：{qi}边境上的兵员" +
          "“使盐运起来很贵”。{daliang}的武库报告，没有新铁，春季兵员既无盐可配，弩机" +
          "也无法装配。一支运往盐邑的{wei}粮车队在{river}渡口被{qi}的官吏扣了两天，" +
          "“以清点车辆”。在{liaodong}，第一座新灶煮出的盐，{wei}的使者称之为合用。" +
          "{zhao}与{song}悄悄问{wei}：它是打算领导买方，还是打算付钱。",
        moveMenu: [
          "付盐官的十倍之价，让车队继续通行",
          "一边抗议，一边放慢粮车队",
          "对过渡口运往{zhao}与{song}的盐征收本国之税",
          "认真出资修{liaodong}的道路与火灶",
          "召买方诸国到{puyang}会盟",
          "通过{wey}的商贾，以第三方的车购盐",
          "提议在{linzi}有条件地会谈",
        ],
      },
      {
        index: 3,
        title: "盐绝",
        inject:
          "{qi}的盐官停发给{wei}的一切符节，理由是“{liaodong}的火灶，众所周知是靠" +
          "{wei}的黄金养着”。经{wey}商贾购得的三十车盐在{river}渡口被扣，车夫被押。" +
          "{daliang}的窖中尚有九周之盐；武库只有秋季所需的一半。{qi}驻{daliang}的" +
          "使者说，盐官的条款在今年之内有效，并且盐是在边境被截住的，{qi}的官吏在那里" +
          "清点车辆。{qi}的盐邑尚有六周之粮，使者公开这么说。{yan}的使者提出一份起誓" +
          "的购买之约：{wei}出千镒黄金，修一条穿过{zhao}边地的道路、在{liaodong}建" +
          "四十座火灶，两季之后出盐，{qi}的细作不得进入煮盐之地。决定现在落到焦点" +
          "席位：付盐官之价而储备，对{qi}闭籴直到车与车夫归还，还是出资建{liaodong}" +
          "的火灶并配给两季之盐。",
        moveMenu: [
          "付盐官之价；全力储备，让粮继续运",
          "对{qi}闭籴，直到符节、车与车夫一并归还",
          "与{yan}起誓立约，两季之内配给盐",
          "既付盐官之价，又暗中出资{liaodong}",
          "在{daliang}扣押{qi}的商贾及其货物，以报扣车之事",
          "不发布告，在渡口扣住粮车队",
          "提议买方诸国以一个价合买，由{wei}代表众国",
        ],
      },
      {
        index: 4,
        title: "肿邑冷炉",
        inject:
          "无论{wei}如何答复，{river}的渡口都近乎沉寂，因为{wey}的运夫不肯在任何" +
          "一岸冒被扣之险。在{wei}的边邑，穷人吃无盐之粟，开始浮肿，正如古语所说。" +
          "{daliang}的工匠熔化旧器；春季兵员以木刃操练。{qi}的盐官以它熟知的手法" +
          "回应：它的商贾带着黄金到达{liaodong}，向{yan}出{wei}两倍的价，买下新灶所煮" +
          "的每一钟盐；{qi}的舟师泊于{gulf}海滨之路的外海，“以清点船只”。{qi}的盐邑" +
          "缺粟，{linzi}的粮价涨到三倍，符节无人使用，盐官的收入减半。{yan}的朝廷向" +
          "{wei}既要黄金，也要长矛。{wey}提出以{puyang}的渡口在本邑之印下代存两方的" +
          "货物。两国朝廷都面对着想要出手一击的议事之臣。",
        moveMenu: [
          "维持目前的态势，让短缺发作",
          "以互惠为条件，只对盐与粮开放渡口",
          "说出最后的威胁：舟师登陆{liaodong}，或对{qi}永久闭籴",
          "凡有友好港口肯配合之处，一律扣押对方的货物与船只",
          "通过{wey}在两位君主之间开辟直接渠道",
          "派兵员据守穿过{zhao}边地通往{liaodong}的道路",
        ],
      },
      {
        index: 5,
        title: "渡口之约",
        inject:
          "{wey}在{zhao}与{song}支持下，于{puyang}提出条款：盐官恢复给{wei}的符节，" +
          "以去年的车数与盐官之价为期三年；{wei}的粮车队恢复；被扣的车与车夫释放；" +
          "由{wey}的一名官吏在渡口清点每一辆车；{liaodong}的火灶以现有之数为限。" +
          "{qi}表示，若此限写入载书便肯封印；其驻{ji}的使者补充说，超出此限的火灶将" +
          "“从海上来数”。{wei}的商贾想要这些条款；武库称此限是交出{wei}建起的唯一" +
          "轻重之柄。{yan}的使者说，此限就是{yan}的终结，而道路将对任何封印之人关闭。" +
          "{daliang}之盐：三周。盐邑之粮：两周。",
        moveMenu: [
          "按草拟的条款在{puyang}封印盟约",
          "修改后封印：删去火灶之限，或把三年加倍",
          "拒绝条款，维持目前的路线",
          "只就盐与粮封印，把铁与火灶留在载书之外",
          "以封印为掩护，继续建储备或建火灶",
          "拒绝，并与{yan}、{zhao}另立针对盐官的盟约",
        ],
      },
      {
        index: 6,
        title: "书于载书",
        inject:
          "盐官颁布一年之后，无论符节、车队、火灶与护送如今是何种组合，都正在固化为" +
          "渡口的常规。每一个朝廷都必须决定它从这场危机中带走的态势：什么写进载书，" +
          "什么悄悄放弃，为下一个冬天的煮盐宣告何种价与何种火灶之数。无论是否有任何" +
          "东西被封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "把目前的安排写进有具名保证之国的载书",
          "不经任何人同意，宣告盐官之价与火灶之数为本国之法",
          "让渡口无限期处于符节与护送之下",
          "以互惠为条件开放渡口",
          "宣称胜利，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const SALT_AND_IRON = buildChapter(SALT_AND_IRON_TEXT);
