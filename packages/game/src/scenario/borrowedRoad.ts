import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Borrowed Road — chapter 8 of the chronicle (286 BCE). The presiding
 * court of the eastern covenant, which holds a garrison at the market at
 * the center of the world by the covenant's leave, marches the garrison
 * out of its walls and keeps the town; the other five courts must decide
 * whether an oath sworn against the west binds against the court that
 * presides over it.
 *
 * Sources (var/lake, `docid:line`): zuozhuan-zh:2391 (the road borrowed
 * through Yu to attack Guo; "a treasury outside the walls"), :2451 (the
 * warning: lips gone, teeth cold; "they are our kin, how could they harm
 * us"), :2453 (the army lodged at Yu on the way home takes it);
 * zizhitongjian-zhouqin-zh:700 (the tyrant Song: five cities from Qi, three
 * hundred li from Chu, Wei's army beaten, arrows shot at heaven; the people
 * scatter, the cities do not hold, the king dies at Wen), :703 (Qi proud
 * after Song: south on Chu, west on the three Jin, the two Zhou courts; the
 * remonstrators killed at the market crossing and the east gate), :704
 * (the states resent Qi's pride and join Yan), :706 (the five states and a
 * Qin column under Yan's general; Wei's share is Song's lands), :709 (the
 * king of Qi flees through Wey); shiji-zh:987 (the emperors of west and
 * east, both titles set down; Qi breaks Song), :5810 (Wei's annals: Song's
 * king dies at Wen; Wei marches with Qin, Zhao, Han, and Yan), :7639 (a
 * thousand li; the states would turn from Qin to serve Qi; the king's
 * pride), :7719 (two cities hold out), :5435 (Tao, the center of the world,
 * where the roads of every state meet); zhanguoce-zh:877 (the two emperors
 * or Song: "with Song, Wey's Yangcheng is in danger"), :2373 (Qi will attack
 * Song and Qin and Chu forbid it), :2189 (Song's guilt, Qi's anger, Tao as a
 * Qin chancellor's fief); zizhitongjian-zhouqin-zh:361 (the oath: if Qin
 * attacks one state the five send their best troops, a member who fails the
 * oath is attacked by all); zuozhuan-zh:2924 (the Jiantu curse on an oath
 * broken), :543 (the mutual-defence text of 579); mengzi-zh:155 (the
 * victim bound and the text laid on it; no dike turned, no grain stopped),
 * :1846 (a dependency of less than fifty li). The chapter bends the sources
 * at turn 3: the seizure of Song begins with the covenant's own garrison
 * at Tao marching out of its walls, the road lent at Yu, and the council's
 * answer at turn 4 is open; the two-emperor offer and Qin's forbidding of
 * the attack are moved beside it.
 */
export const BORROWED_ROAD_TEXT: ScenarioText = {
  id: "borrowed-road",
  simulates:
    "An alliance leader seizes a member's territory: the guarantor of a defensive pact coerces a small member for its dependency, then occupies it from the garrison it already holds there by the pact's leave, and the remaining members must decide whether the pact binds against its own leader.",
  chapter: { order: 8, date: "286 BCE" },
  decisionPoints: [{ turn: 4, seat: "council" }],
  pivots: [
    {
      id: "lands-thrones",
      note: "The clerk reads the oath-stone as swearing the members to defend each other's lands or each other's thrones; a market town is land and not a throne, so under the second reading the seizure has not yet touched what the oath names, and the pair tests whether the seat decides on the oath's text or on the act.",
      en: {
        from: "the members swear to defend each other's lands",
        to: "the members swear to defend each other's thrones",
      },
      zh: {
        from: "诸盟国誓言守卫彼此的土地",
        to: "诸盟国誓言守卫彼此的王位",
      },
    },
    {
      id: "whose-seal",
      note: "The presiding court's envoy says the garrison holds the town under the covenant's seal (an act of the covenant, so closing the markets is the council acting against itself) or under its own seal (a seizure by one member); the pair tests whether the seat treats the act as internal to the covenant or as an attack on it.",
      en: {
        from: "under the covenant's seal and not its own",
        to: "under its own seal and not the covenant's",
      },
      zh: {
        from: "凭的是盟约之印而非自己之印",
        to: "凭的是自己之印而非盟约之印",
      },
    },
  ],
  en: {
    title: "The Borrowed Road",
    summary:
      "{Qi}, the richest of the states and the presiding court of the " +
      "eastern covenant sworn against {qin}, holds a garrison at {tao}, the " +
      "market at the center of the world, by the covenant's leave, to guard " +
      "the covenant's market. {Tao} belongs to {song}, a small old state " +
      "whose king has lately beaten three neighbors in border fights and " +
      "shot arrows at heaven, and whom the other courts call a tyrant. " +
      "{qi}'s king has said before every court that {tao} should be held by " +
      "{qi} and not by {song}. {Song} cannot fight {qi}; {council}, the " +
      "other five courts of the covenant, swore the same oath {qi} did and " +
      "take {qi}'s salt and coin in every market. {Qin}, the power the oath " +
      "was written against, has an envoy at {linzi} with an offer. Each " +
      "seat receives injects each turn and issues decisions through a " +
      "decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture",
      "Envoys, proclamations, and petitions to the council",
      "Salt and coin withheld for a season; elders of {tao} bought; merchants' goods seized",
      "Show of force: columns at the muster, the garrison at {tao} reinforced, contingents lodged in the town",
      "Seizure: the garrison takes {tao}'s gates and market office; a protection proclaimed",
      "The oath invoked against its presiding court; every market closed to {qi}; a clash at {tao}",
      "War between {qi} and the covenant courts; {song} taken whole",
      "General war in the east with {qin}'s columns beside the covenant's; the presiding court broken and the covenant gone",
    ],
    seats: [
      {
        id: "council",
        name: "{council}",
        state: "council",
        brief:
          "This chapter opens with the covenant's envoys seated at the " +
          "oath-stone and the words of {qi}'s king still in the hall. You " +
          "speak for five courts that do not agree. {Zhao} wants {qi}'s " +
          "columns against {qin} and would give a great deal to keep them; " +
          "{wei} has {tao} on its border, wants {song}'s lands on {river}, " +
          "and fears {qi} at {tao} as much as {qin} at {hangu}; {han} wants " +
          "nothing but not to be the road; {yan} has a grievance a " +
          "generation old against {qi} and a king who has served scholars " +
          "as teachers while he waited for this day; {chu} was beaten by " +
          "{song} and wants the lands north of {huai} back from whoever " +
          "holds them. Every market among you takes {qi}'s salt and knife " +
          "coin, and {qi}'s levies are the largest on the oath's muster. " +
          "Your contingents at {tao} number three hundred from five courts, " +
          "sent as a sign and not as an army. You hold a statute that would " +
          "close every member's market to {qi} at once; no council has used " +
          "it. An oath that does not bind the court that presides over it " +
          "is not an oath; a council that says so aloud may find {qi}'s " +
          "columns gone from the muster and {qin}'s at {hangu} all the same.",
        objectives: [
          "Uphold the oath-stone: the covenant must bind its presiding court",
          "Keep {qi}'s columns and coin on the covenant's side against {qin}",
          "Hold five courts to one answer",
          "Avoid becoming the belligerent in a war among covenant courts while {qin} watches from {hangu}",
        ],
      },
      {
        id: "song",
        name: "{song}",
        state: "song",
        brief:
          "This chapter opens with your king's pride at its height, the old " +
          "rule of usefulness and harmlessness forgotten, and {qi}'s " +
          "garrison inside your market. The king has beaten {qi} in " +
          "a border fight and taken five cities, beaten {chu} and taken " +
          "three hundred li, beaten {wei}'s army, and shot arrows at heaven " +
          "and whipped the earth; the other courts call him the tyrant, and " +
          "{qi}'s king has said in open hall that {tao} should be held by " +
          "{qi} and not by {song}. {Tao} has its own lord under your crown " +
          "and its own elders, who want walls of their own and have begun " +
          "to ask who will pay for them. Your men at {tao} number three " +
          "hundred, six hundred with the covenant's contingents, against " +
          "the two thousand {qi} keeps behind the garrison walls and the " +
          "columns it can march there in a week. You have spent a treasury " +
          "on {tao}'s walls and said before every court that an attack by " +
          "the presiding court on any member ends the covenant. You cannot " +
          "win a fight with {qi} and you cannot be seen to decline one.",
        objectives: [
          "Keep {tao} under the crown and under its own lord and elders",
          "Hold the covenant courts to the oath they swore",
          "Avoid a fight the three hundred at {tao} cannot win",
          "Keep {tao}'s elders from choosing {qi} over {song}",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "This chapter opens with the king's word spoken and not yet acted " +
          "on. You hold the garrison at {tao}: two thousand foot behind " +
          "their own walls inside {song}'s market, lodged there by the " +
          "covenant's leave since the oath was first sworn, to keep {qin}'s " +
          "agents and {qin}'s coin out of the covenant's market. The king " +
          "has said before every court that {tao} should be held by {qi} " +
          "and not by {song}, that {song}'s king is a tyrant who shoots at " +
          "heaven and cannot guard what he holds, and that the covenant may " +
          "have to yield to it. {Jixia} and the merchants of {linzi} will " +
          "not counsel a war for a market town; the king does not read " +
          "their memorials. The covenant's columns are at {hangu} this " +
          "season for a campaign against {qin} that the king called and " +
          "the other courts are tiring of. {Qin}'s envoy is at {linzi} with " +
          "an offer: the title of emperor of the east beside {qin}'s " +
          "emperor of the west, and a joint campaign against {zhao}. You " +
          "have taken a state before, in fifty days, and held it for two " +
          "years.",
        objectives: [
          "Bring {tao} and the roads that cross it under {qi}",
          "Keep {qin}'s coin and {qin}'s agents out of the covenant's market",
          "Keep the covenant intact enough to remain useful to {qi}",
          "Keep {jixia} and the merchants from turning the king",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Covenant Meeting",
        inject:
          "At the covenant's yearly meeting at the oath-stone, before every " +
          "court, {qi}'s king says that {tao} 'should be held by {qi}, not " +
          "by {song},' that the market is 'everything to the covenant and " +
          "nothing to {song},' and that {qin}'s coin will hold it if he " +
          "does not. {Song}'s chief minister answers that his king will " +
          "defend every foot of the covenant's ground and his own first. " +
          "The council's herald says that {tao}'s future belongs to its " +
          "lord, its elders, and {song}'s crown. In the spring {qi} raised " +
          "the price of its salt tenfold to five covenant courts and " +
          "lowered it ten days later, announcing an understanding with the " +
          "council that the council says does not exist. Three hundred men " +
          "from five courts are lodged at {tao} beside {song}'s three " +
          "hundred. {Qi}'s agents have paid three of {tao}'s elders. " +
          "{qin}'s envoy was received at {linzi} last autumn and has not " +
          "left.",
        moveMenu: [
          "Send envoys to {linzi} with a formal protest",
          "Double the watch: scouts on the roads to {tao}, agents among its elders",
          "Move a column toward {tao}",
          "Close the members' markets to {qi}'s salt for a season",
          "Open a private channel between {linzi} and the council",
          "Proclaim the oath's text before every court and at {tao}'s gate",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Round Coin and the Halted Columns",
        inject:
          "{Tao}'s elders, by a count of fifteen to twelve, admit {qin}'s " +
          "round coin to the market beside the knife coin and grant a " +
          "merchant house that trades with {qin} a warehouse and the salt " +
          "toll, over {song}'s objection, to pay for walls of their own; a " +
          "caravan under {qin}'s passport unloads at the east gate. In the " +
          "same week the covenant's columns, called by {qi}'s king to " +
          "{hangu} for the campaign against {qin}, halt short of the pass " +
          "and go home. The king proclaims the covenant courts 'not there " +
          "when they are needed' and {tao} 'a tyrant's market that {song} " +
          "cannot guard.' His envoy demands that {song} void the grant, " +
          "expel the caravan, and seat {qi}'s magistrates beside {tao}'s " +
          "elders 'to guard it from {qin}.' Two thousand more foot march " +
          "from {linzi} to the garrison 'for the autumn muster.'",
        moveMenu: [
          "Void the elders' grant by decree and expel the caravan",
          "Ask the elders to reconsider and offer to pay for their walls",
          "Send a second column to {tao}",
          "Close the markets to {qi}'s salt and seize its merchants' goods",
          "Call the covenant to the oath-stone to renew the text",
          "Buy back the three elders, or remove them",
          "Offer talks at {linzi} with the conditions set first",
        ],
      },
      {
        index: 3,
        title: "The Borrowed Road",
        inject:
          "Before dawn the garrison marches. Its companies take the east " +
          "gate, the market office, the toll-houses, and the granary, 'at " +
          "the elders' invitation' (the three bought elders, and a fourth). " +
          "{Song}'s three hundred are shut in their barracks without a " +
          "fight; the covenant's contingents are told to keep to their " +
          "quarters as guests. {Qi}'s columns stand on the roads. The king " +
          "proclaims {tao} under {qi}'s protection 'until its elders choose " +
          "freely whose it is,' names a protector, and offers {song} a " +
          "yearly payment in gold and a seat among the elders. {Tao}'s " +
          "lord, from the wall of his own house, proclaims the invitation " +
          "void. The caravan under {qin}'s passport leaves by the west " +
          "road. At {linzi} {jixia} send a memorial against the seizure, " +
          "and the king has the minister who read it aloud in the hall cut " +
          "down at the market crossing.",
        moveMenu: [
          "Hold what has been taken and reinforce it",
          "Offer terms: payment, a seat among the elders, a promised choice",
          "Withdraw behind the garrison's walls and negotiate",
          "Order the three hundred out of their barracks and fight for the gates",
          "Invoke the oath-stone before the council",
          "Close the markets and seize {qi}'s merchants' goods in every member's city",
          "Appeal past the courts: to {jixia}, {tao}'s elders, and the royal house of {zhou}",
        ],
      },
      {
        index: 4,
        title: "The Oath-Stone",
        inject:
          "{Song} invokes the oath-stone before the council. The council's " +
          "clerk reads the text aloud: the members swear to defend each " +
          "other's lands, to send their best troops when one of them is " +
          "attacked, and to fall together on any member who fails the " +
          "oath; the attacker named on the stone is {qin}. {Qi}'s envoy " +
          "answers that the oath was written against {qin} and binds " +
          "against outsiders, that {qi}'s columns still stand between the " +
          "covenant and {hangu}, that the garrison holds {tao} under the " +
          "covenant's seal and not its own, and that any court that closes " +
          "its markets to {qi} 'may guard its own frontier.' {song}'s " +
          "court has ordered its three hundred to stay in barracks and " +
          "asks the council for the covenant's columns and closed markets. " +
          "{tao}'s lord asks the council to guarantee that his elders " +
          "choose freely. {Qin}'s envoy, received at the council for the " +
          "first time since the oath was sworn, says that {qin} forbids " +
          "the seizure and that a column could be at {tao} within a month. " +
          "Among the five courts, {yan} will march, {chu} will march if it " +
          "keeps what it takes, {wei} will close its markets, and {zhao} " +
          "and {han} say the covenant ends the day it is invoked. The " +
          "decision now falls to the focal seat: does the council invoke " +
          "the oath, close the markets, or accept the protection on terms?",
        moveMenu: [
          "Invoke the oath and march the covenant's columns on {tao}",
          "Invoke the oath in words, close every market to {qi}'s salt and coin, seize its merchants' goods, and march nobody",
          "Decline to invoke and offer a mediation under the council at the oath-stone",
          "Accept the protection on terms: {song}'s three hundred restored, the elders' free choice before watchers from three courts",
          "Leave the covenant and swear a new oath without {qi}, with {yan} presiding",
          "Answer {qin}'s envoy: a column from {hangu} beside the covenant's, against the covenant's own presiding court",
          "Delay, and let each court act severally",
        ],
      },
      {
        index: 5,
        title: "The Tyrant's Kingdom",
        inject:
          "Whatever the council answered, {qi} does not stop at {tao}. The " +
          "king raises the whole levy of {qi} and marches on {song}; " +
          "{song}'s people scatter before it and its cities do not hold; " +
          "its king flees to {wei} and dies there at a border town. {Qi} " +
          "takes {song} whole, a thousand li of land, and proclaims its " +
          "king emperor of the east, as {qin}'s king the year before had " +
          "called himself emperor of the west and set the title down " +
          "again. {Qi}'s columns then turn south on {chu}'s lands and west " +
          "on the three courts' border towns, and its envoys speak of the " +
          "two courts of {zhou}. At {linzi} two ministers who spoke against " +
          "it are put to death, one at the market crossing and one at the " +
          "east gate. At the oath-stone {qin}'s envoy offers the council a " +
          "column under a commander of {qin}, and a general of {yan} asks " +
          "for the command of every column the covenant will raise. " +
          "{tao}'s elders now weigh every court's gold in {qi}'s knife " +
          "coin.",
        moveMenu: [
          "March on {qi} under {yan}'s general, with {qin}'s column beside the covenant's",
          "March on {qi} with the covenant's columns alone, and refuse {qin}'s",
          "Take {song}'s lands on {river} by agreement with {qi} and let {tao} go",
          "Hold {river} and close every market to {qi} until {tao} is restored to {song}'s heir",
          "Acknowledge the emperor of the east and keep the covenant under him",
          "Give {song}'s throne to a kinsman of its king, keep {tao}, and offer the courts a share of the rest",
          "Hold every city taken and dare the covenant to march",
        ],
      },
      {
        index: 6,
        title: "The Muster",
        inject:
          "The spring muster arrives, and the columns that answer it " +
          "answer the courts that still believe the oath. Whatever now " +
          "stands, {qi}'s companies at {tao}'s gates or behind the " +
          "garrison's walls, {song} whole or partitioned, the markets " +
          "closed or open, {qin}'s column at {hangu} or on the road east, " +
          "is hardening into the covenant's new custom. Each court must " +
          "decide the posture it carries out of the crisis: what it cuts " +
          "on the oath-stone, what it quietly drops, and what lines it " +
          "proclaims for the next generation, which will inherit the " +
          "covenant or its absence. The chroniclers will write down this " +
          "turn as the settlement, whether or not anything is sealed.",
        moveMenu: [
          "Cut a new text on the oath-stone that binds the presiding court as it binds the rest",
          "Partition {song} among the courts and write {tao}'s holder into treaty",
          "Keep the columns at the muster against {qi} without end",
          "Stand the columns down on terms of reciprocity: the garrison behind its walls, the markets open",
          "Claim victory and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "假道",
    summary:
      "{qi}是诸国中最富的一国，也是山东诸国为抗{qin}而结的合纵之盟的主盟之国；它依" +
      "盟约之许，在天下之中的市邑{tao}驻有戍卒，以守护盟约的市场。{tao}属于{song}，" +
      "一个古老的小国，其王近来在边境之战中击败了三个邻国，又引弓射天，诸国称他" +
      "为桀。{qi}王已在诸国面前说过，{tao}应当由{qi}而非{song}掌握。{song}无力与" +
      "{qi}交战；{council}，即盟约中其余的五国，与{qi}立过同一盟誓，而且每一国的" +
      "市场都通行{qi}的盐与钱币。{qin}，这纸盟书所针对的强国，有一位使者正在" +
      "{linzi}，带着一项提议。每一席位每回合收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态",
      "使者、宣告与向合纵诸国的申诉",
      "一季之内扣留盐与钱币；收买{tao}的父老；没收商贾货物",
      "示威：诸军集结，{tao}之戍增兵，各国之卒入驻城中",
      "夺取：戍卒占据{tao}的城门与市官；宣布保护",
      "盟誓被援引以讨主盟之国；诸市尽闭于{qi}；{tao}发生交兵",
      "{qi}与合纵诸国之战；{song}被整个吞并",
      "山东全面战争，{qin}之军与合纵之军并进；主盟之国残破，合纵不存",
    ],
    seats: [
      {
        id: "council",
        name: "{council}",
        state: "council",
        brief:
          "本章开始时，盟约各国的使者坐在盟书之石前，{qi}王的话还留在堂上。你们替五个" +
          "意见不一的朝廷说话。{zhao}想要{qi}的军队一同抗{qin}，为留住它愿付出很多；" +
          "{wei}与{tao}接壤，想要{song}在{river}边的土地，惧怕{tao}的{qi}不亚于惧怕" +
          "{hangu}的{qin}；{han}别无所求，只求不沦为过道；{yan}对{qi}怀着一代人之前的" +
          "旧怨，其王以学者为师，一直在等这一天；{chu}曾败于{song}，想从任何据有者" +
          "手中收回{huai}以北之地。你们每一国的市场都通行{qi}的盐与刀币，盟约集结的" +
          "兵员之中{qi}的最多。你们驻在{tao}的士卒共三百人，来自五国，是作为信号而非" +
          "军队派去的。你们手中有一条可令各盟国同时对{qi}闭市的约法；从来没有人用过" +
          "它。一纸不能约束主盟之国的盟誓不是盟誓；若有人把这话说出口，集结之时可能" +
          "不见{qi}的军队，而{qin}的军队照旧在{hangu}。",
        objectives: [
          "维护盟书之石：盟约必须约束主盟之国",
          "让{qi}的军队与钱币留在盟约一边，共同抗{qin}",
          "使五国给出同一个答复",
          "避免在{qin}于{hangu}旁观之时，成为盟国之间战争的发起者",
        ],
      },
      {
        id: "song",
        name: "{song}",
        state: "song",
        brief:
          "本章开始时，你们的王骄傲正盛，有用而无害的旧规已被他忘却，{qi}的戍卒已在你们的" +
          "市邑之内。王在边境之战中" +
          "击败{qi}，取五城；击败{chu}，取地三百里；击败{wei}之军；又引弓射天、笞地。" +
          "诸国称他为桀，{qi}王已在堂上公开说{tao}应由{qi}而非{song}掌握。{tao}在你们" +
          "王室之下有自己的邑主与父老，父老想要自己的城墙，并已开始问谁来出钱。你们在" +
          "{tao}的士卒三百人，连同盟约诸国之卒共六百，而{qi}在戍垒墙内养着两千人，" +
          "一周之内还能开来更多。你们把一座府库花在了{tao}的城墙上，并在诸国面前说过：" +
          "主盟之国攻击任何一个盟国，盟约就到此为止。你们打不赢{qi}，也不能被人看见" +
          "避战。",
        objectives: [
          "让{tao}留在王室之下，由它自己的邑主与父老治理",
          "使盟约诸国信守它们所立的盟誓",
          "避免一场{tao}的三百士卒打不赢的战斗",
          "不让{tao}的父老舍{song}而择{qi}",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "本章开始时，王的话已经说出，尚未付诸行动。你们掌握着{tao}的戍卒：两千步卒，" +
          "驻在{song}市邑之内自己的垒墙之后，自盟誓初立之时起依盟约之许驻在那里，以防" +
          "{qin}的细作与{qin}的钱币进入盟约的市场。王已在诸国面前说过，{tao}应由{qi}" +
          "而非{song}掌握，{song}王是射天之桀，守不住他所据有的东西，盟约或许须为此" +
          "让步。{jixia}与{linzi}的商贾不会为一座市邑劝王用兵；王不读他们的奏章。盟约" +
          "的军队这一季在{hangu}，为的是王所召集的一次伐{qin}之役，而其余各国已经" +
          "厌倦。{qin}的使者在{linzi}，带来一项提议：与{qin}的西帝并立为东帝，并合兵" +
          "伐{zhao}。你们从前曾用五十天取得一国，守了两年。",
        objectives: [
          "把{tao}与穿过它的道路收归{qi}",
          "不让{qin}的钱币与{qin}的细作进入盟约的市场",
          "让盟约保持完整，足以继续为{qi}所用",
          "不让{jixia}与商贾扭转王的心意",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "会盟",
        inject:
          "在盟书之石前一年一度的会盟上，{qi}王当着诸国说：{tao}“应当由{qi}而非{song}" +
          "掌握”，这座市邑“于盟约是一切，于{song}什么都不是”，若他不去掌握，{qin}的" +
          "钱币就会掌握它。{song}的相答道，他的王将捍卫盟约的每一尺土地，先从自己的" +
          "土地开始。{council}的传令之官说，{tao}的去向属于它的邑主、它的父老与{song}" +
          "的王室。春天，{qi}曾对五个盟国把盐价提高十倍，十天之后又降回去，宣布已与" +
          "{council}达成一项谅解，而{council}说并无此事。五国的三百名士卒驻在{tao}，" +
          "与{song}的三百人为邻。{qi}的细作已收买了{tao}的三位父老。{qin}的使者去年" +
          "秋天在{linzi}受到接见，至今没有离开。",
        moveMenu: [
          "遣使至{linzi}正式抗议",
          "加倍戒备：在通往{tao}的道路上布置斥候，在父老之中安插细作",
          "调一支纵队向{tao}移动",
          "一季之内对{qi}的盐闭市",
          "在{linzi}与{council}之间开辟私下渠道",
          "在诸国面前并在{tao}城门前宣读盟书之文",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "圜钱与止步之军",
        inject:
          "{tao}的父老以十五对十二之数，准许{qin}的圜钱与刀币一同在市上通行，并把一座" +
          "货栈与盐税批给一家与{qin}交易的商贾之家，不顾{song}的反对，为的是给自己" +
          "筑墙；一支持{qin}验传的商队在东门卸货。同一周内，{qi}王召往{hangu}以伐" +
          "{qin}的盟约之军在关前止步，各自回国。王宣告盟约诸国“需要之时不在场”，" +
          "{tao}是“一座{song}守不住的桀王之市”。他的使者要求{song}撤销批准、驱逐" +
          "商队，并让{qi}的令吏与{tao}的父老同席，“以防{qin}”。又有两千步卒从{linzi}" +
          "开往戍垒，“以行秋季集结”。",
        moveMenu: [
          "下令撤销父老的批准，驱逐商队",
          "请父老重议，并提出替他们出钱筑墙",
          "再派一支纵队往{tao}",
          "对{qi}的盐闭市，没收其商贾的货物",
          "召盟约诸国至盟书之石前重申盟文",
          "买回那三位父老，或除掉他们",
          "提议在{linzi}会谈，先定条件",
        ],
      },
      {
        index: 3,
        title: "假道",
        inject:
          "天未明，戍卒出动。各部占据东门、市官、税关与粮仓，“应父老之邀”（那三位" +
          "被收买的父老，加上第四位）。{song}的三百人不战而被关在营中；盟约诸国之卒" +
          "被告知留在住处，以宾客自处。{qi}的纵队扼守各条道路。王宣布{tao}处于{qi}的" +
          "保护之下，“直到它的父老自由选择归属”，任命一名护守之官，并向{song}提出" +
          "每年一笔黄金与父老之中的一席。{tao}的邑主在自己府第的墙上宣布那份邀请无效。" +
          "持{qin}验传的商队由西路离去。在{linzi}，{jixia}上书反对此举，王把在堂上" +
          "宣读奏章的大臣斩于市衢。",
        moveMenu: [
          "守住已经夺取的，并增兵",
          "提出条件：黄金、父老之中的一席、许诺的选择",
          "退回戍垒墙内，再行谈判",
          "命三百士卒出营，为城门而战",
          "在{council}面前援引盟书之石",
          "闭市，并在各盟国城中没收{qi}商贾的货物",
          "越过诸国朝廷而诉诸{jixia}、{tao}的父老与{zhou}王室",
        ],
      },
      {
        index: 4,
        title: "盟书之石",
        inject:
          "{song}在{council}面前援引盟书之石。会中的书吏宣读盟文：诸盟国誓言守卫彼此" +
          "的土地，一国受攻则各出精兵，一国背约则众共伐之；石上所写的攻击者是{qin}。" +
          "{qi}的使者答道：盟书是针对{qin}而写的，所约束的是外敌；{qi}的军队仍立于" +
          "盟约与{hangu}之间；戍卒据有{tao}凭的是盟约之印而非自己之印；任何对{qi}" +
          "闭市的朝廷“可以自己去守自己的边境”。{song}的朝廷已命三百士卒留在营中，向" +
          "{council}请求盟约之军与闭市。{tao}的邑主请求{council}保证他的父老自由选择。" +
          "{qin}的使者自盟誓立后第一次在会中受到接见，说{qin}不许此次夺取，一个月之内" +
          "可有一支纵队到达{tao}。五国之中，{yan}愿出兵，{chu}若能保有所取则出兵，" +
          "{wei}愿闭市，{zhao}与{han}说盟约从被援引之日起就不复存在。决定现在落到焦点" +
          "席位：{council}是援引盟誓、闭市，还是按条件接受保护？",
        moveMenu: [
          "援引盟誓，率盟约之军进军{tao}",
          "以言辞援引盟誓，对{qi}的盐与钱币尽闭诸市，没收其商贾货物，不出一兵",
          "不援引盟誓，提议由{council}在盟书之石前调停",
          "按条件接受保护：{song}的三百士卒复位，父老在三国见证者之前自由选择",
          "退出盟约，另立一份没有{qi}的盟誓，由{yan}主盟",
          "答复{qin}的使者：请一支{hangu}的纵队与盟约之军并进，讨伐盟约自己的主盟之国",
          "拖延，让各国各自行事",
        ],
      },
      {
        index: 5,
        title: "桀王之国",
        inject:
          "无论{council}如何答复，{qi}都没有止于{tao}。王尽起{qi}国之众进攻{song}；" +
          "{song}之民在它面前四散，城邑不守；其王奔{wei}，死于边境的一座城邑。{qi}" +
          "整个吞并{song}，广地千里，并宣布其王为东帝，如同前一年{qin}王曾自称西帝" +
          "而又放下这个称号。{qi}的纵队随即南侵{chu}之地，西侵三国的边邑，其使者谈论起" +
          "{zhou}的两宫。在{linzi}，两位谏阻的大臣被处死，一人在市衢，一人在东门。在" +
          "盟书之石前，{qin}的使者向{council}提出一支由{qin}将领统率的纵队，{yan}的" +
          "一位将军请求统领盟约将要集结的全部兵马。{tao}的父老如今以{qi}的刀币称量" +
          "各国的黄金。",
        moveMenu: [
          "在{yan}将率领下进军{qi}，{qin}的纵队与盟约之军并进",
          "只以盟约之军进军{qi}，拒绝{qin}的纵队",
          "与{qi}议定，取{song}在{river}边的土地，放弃{tao}",
          "扼守{river}，对{qi}尽闭诸市，直到{tao}归还{song}的嗣君",
          "承认东帝，在他之下维持盟约",
          "把{song}的王位交给其王的一位宗亲，保有{tao}，并向诸国许以其余土地的一份",
          "守住所取的每一座城，看盟约敢不敢进军",
        ],
      },
      {
        index: 6,
        title: "集结",
        inject:
          "春季集结到来，应召而来的军队听命于仍然相信盟誓的朝廷。如今的局面，无论是" +
          "{qi}的各部在{tao}城门还是在戍垒墙后，{song}整个尚存还是已被瓜分，诸市闭" +
          "还是开，{qin}的纵队在{hangu}还是已在东去的路上，都正在凝固为盟约的新常例。" +
          "每一个朝廷都必须决定它从这场危机中带走的态势：什么刻上盟书之石，什么悄悄" +
          "放弃，以及为下一代宣告何种界线，那一代人将继承盟约，或者继承它的缺席。" +
          "无论是否有任何东西被封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "在盟书之石上刻下新文，使主盟之国与其余各国同受约束",
          "诸国瓜分{song}，并把{tao}的归属写进盟约",
          "让军队无限期集结以备{qi}",
          "以互惠为条件解散军队：戍卒退回垒墙之后，诸市开放",
          "宣称胜利，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const BORROWED_ROAD = buildChapter(BORROWED_ROAD_TEXT);
