import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Corridor — chapter 9 of the chronicle (262–260 BCE). A highland cut
 * off from its own court is given to the frontier state rather than to the
 * interior power, and two armies settle behind walls at the pass while the
 * frontier state's grain runs out; the rich coastal power, asked for grain
 * and a column on the day the aggressor offers it a separate peace, decides
 * what leaves its granaries, and the army at the walls is cut off whatever
 * it decides.
 *
 * Sources (var/lake, `docid:line`): zizhitongjian-zhouqin-zh:860 (the road
 * cut, the governor's reasoning, seventeen walled towns, the court debate
 * over a gain without cause, the reward schedule, the governor weeping),
 * :863 (the cautious general's walls, the peace envoy honored at the
 * interior court so that the world will not rescue a state that sues),
 * :864 (a thousand pieces of gold spent on the rumor, the general replaced
 * by the one who read his father's books), :865 (the king raises every man
 * above fifteen north of the River to block relief and grain; the request
 * for grain refused; the lip and the teeth; forty-six days; the surrender,
 * the burial, the two hundred and forty boys), :868 (the chancellor halts
 * the army for six towns), :869 (the counsel to give the six towns to the
 * coastal power instead), :826 (befriend the distant and attack the near),
 * shiji-zh:7368 (so that the blow falls on the frontier state), :5699-5700
 * (seventeen towns without a battle; the king's regret), :6005 (the
 * aggressor's calculus: if the coastal power stands close to the frontier
 * state, withdraw; if not, attack on; the remonstrance against hoarding
 * grain). The chapter bends the sources at turn 4: the coastal court's
 * answer is open, and at turn 5 the levy on the river roads keeps whatever
 * it sent from reaching the walls.
 */
export const CORRIDOR_STATES_TEXT: ScenarioText = {
  id: "corridor-states",
  simulates:
    "Extended deterrence under strain: a frontline ally facing a reformed, expansionist neighbor asks a distant, rich patron for supplies and a relief force on the same day the aggressor offers that patron a separate peace (the alliance-cohesion dilemma of an invaded partner and its reluctant backer).",
  chapter: { order: 9, date: "262–260 BCE" },
  decisionPoints: [{ turn: 4, seat: "qi" }],
  pivots: [
    {
      id: "grain-for",
      note: "The frontier state's embassy asks for grain for the army at the walls (feeding a belligerent: the grain is a war contribution) or for the king's city and its people (relief: the grain feeds a capital); the menu is the same, and the pair tests whether the seat reads the request as entering the war or as feeding a neighbor.",
      en: {
        from: "grain at once for the army at the walls",
        to: "grain at once for the king's city and its people",
      },
      zh: {
        from: "立即发粟以供壁垒中的军队",
        to: "立即发粟以供王都与其民",
      },
    },
    {
      id: "qin-offer",
      note: "The interior power's envoy offers the coastal court a share of the spoils (the frontier towns east of the hills, which makes staying out a gain from the ally's fall) or a guarantee (peace for ten years and the markets untouched, which makes staying out a purchase of safety); the pair tests whether the seat prices a separate peace by what it gains or by what it avoids.",
      en: {
        from: "the frontier towns east of the hills when the war is won",
        to: "peace for ten years and every market left untouched",
      },
      zh: {
        from: "战罢之后以岭东的边邑相予",
        to: "以十年之和相予，市肆不扰",
      },
    },
  ],
  en: {
    title: "The Corridor",
    summary:
      "{han}'s highland of {shangdang}, cut off from its own court by " +
      "{qin}'s army, is offered by its governor to {zhao} rather than to " +
      "{qin}. {qin}, the reformed interior power behind {hangu}, and {zhao}, " +
      "the frontier state that holds the passes of {taihang}, settle behind " +
      "walls at {changping}, and {zhao}'s grain runs out first. {qi}, the " +
      "rich coastal power far to the east, is asked on the same day for " +
      "grain and a relief column by {zhao} and for a separate peace by " +
      "{qin}; {chu} and {wei} have sent letters. Each seat receives injects " +
      "each turn and issues decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: envoys, open markets, the covenant unrenewed",
      "Protests, covenant letters, and hostage princes",
      "Subversion: gold for ministers, a bought song, an envoy honored to shame his king",
      "Grain and roads: granaries closed to an ally, a relief column held at home",
      "Fortress lines at the highland and levies raised to the border",
      "Limited campaign: the highland's towns taken one by one",
      "General war: the covenant's armies in the field on more than one front",
      "Annihilation: an army buried, a capital besieged, a state extinguished",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens with a road cut. Your court has a new guest " +
          "chancellor from {wei}, who has taught the king that a foot of " +
          "ground taken near is the king's own foot and that {han} and " +
          "{wei}, the hinge of the world, must be broken before the far " +
          "courts are touched. Your army has taken the town below {taihang} " +
          "that carried the only road between {han}'s court and its " +
          "highland of {shangdang}; the highland's seventeen walled towns " +
          "should now fall into your hand. The register of a century fills " +
          "the levy, and your granaries can feed two campaign seasons on " +
          "the highland where any eastern court's can feed one. {qi} has " +
          "kept faith with you since the five states broke it, and {qi}'s " +
          "granaries are the only ones in the east that could feed an " +
          "army of {zhao}.",
        objectives: [
          "Take {shangdang} and open the road over {taihang} to {handan}",
          "Keep {qi}'s granaries shut and {qi} out of any covenant army",
          "Avoid a war on two fronts before {zhao}'s army is broken",
          "Spare the levies and the granaries for the campaign after this one",
        ],
      },
      {
        id: "zhao",
        name: "{zhao}",
        state: "zhao",
        brief:
          "This chapter opens with {han}'s highland of {shangdang}, which " +
          "looks down on the road over {taihang} to {handan}, cut off from " +
          "its own king and looking for a new one. Your cautious general " +
          "commands on the border with good walls and a long record; your " +
          "bold faction has a young general, son of a famous one, who has " +
          "read his father's books and promises battle. Your granaries hold " +
          "one season. Your partners in the eastern covenant, {chu}, {wei}, " +
          "and {qi}, have sent envoys and no grain, and {qi}'s granaries " +
          "are the fullest in the world.",
        objectives: [
          "Hold {shangdang} and deny {qin} the road over {taihang}",
          "Secure grain and a relief column from {qi}",
          "Keep the covenant from dissolving into separate peaces",
          "Avoid a decisive field battle on {qin}'s terms",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "This chapter opens a generation after the five states broke you " +
          "to two cities and a general of yours won every city back. The " +
          "walls are rebuilt and the granaries are full again. A dowager " +
          "holds the court for a young king, and her rule has been to keep " +
          "faith with {qin}, keep the levies at home, and let the western " +
          "courts fight. The war for {shangdang} is two years old and " +
          "twenty marches west of {linzi}. {zhao}'s envoys tell you that " +
          "you will be conquered last, not spared; {qin}'s envoys tell you " +
          "the war in the west is not yours and your markets are safe if " +
          "you stay out. You have never met {qin} alone in the field, and " +
          "you would prefer never to.",
        objectives: [
          "Keep the salt roads, the markets, and the treasury out of the war",
          "Keep a balance west of {taihang} that leaves a state between {qi} and {qin}",
          "Avoid becoming {qin}'s next frontier",
          "Commit grain and soldiers only where they decide an outcome",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Road Cut",
        inject:
          "{qin}'s army takes the town below {taihang} that carries the " +
          "only road between {han}'s court and its highland of {shangdang}; " +
          "the highland's seventeen walled towns are cut off from their " +
          "king. At {xianyang} the guest chancellor's doctrine is proclaimed " +
          "aloud: befriend the distant and attack the near, for a foot of " +
          "ground taken near is the king's foot. On the same day two letters " +
          "reach {handan} and {linzi}. The first, from {chu} and {wei} on " +
          "behalf of the eastern covenant, asks every court to renew the " +
          "oath sworn over the buried victim, an attack on one answered by " +
          "all, with named contributions of grain and foot. The second, " +
          "from {qin}, offers each court a peace on its own terms: markets " +
          "open, a royal marriage, and a promise that {qin}'s quarrel lies " +
          "with {han} alone. {qin}'s envoys are known to carry gold as well " +
          "as letters.",
        moveMenu: [
          "Swear the covenant in full, with named grain and foot",
          "Swear a limited covenant: consultation and markets, no automatic war",
          "Accept {qin}'s separate peace and take the marriage and the markets",
          "Answer neither letter and send envoys to both courts to learn more",
          "Detain the envoys suspected of carrying gold and search their carts",
        ],
      },
      {
        index: 2,
        title: "The Seventeen Towns",
        inject:
          "The governor of {shangdang}, with the road to his own king cut " +
          "and {qin}'s army three marches away, gathers the elders and says " +
          "that if the highland goes to {qin} its people will be {qin}'s; " +
          "better to give it to {zhao}, so that {qin}'s anger falls on " +
          "{zhao} and {han} and {zhao} must stand together. His envoy " +
          "reaches {handan} offering seventeen walled towns with their " +
          "stores and garrisons. One minister of {zhao} says a sage dreads a " +
          "gain without cause: {qin} has done the work, {zhao} would eat " +
          "the fruit, and the weak do not take from the strong. Another " +
          "says a million men could march a year and not take one town, and " +
          "here are seventeen without a battle; he has already drafted the " +
          "reward: three towns of ten thousand households for the governor, " +
          "three of a thousand for each magistrate, three grades of rank " +
          "for every officer and man. The governor, it is reported, wept " +
          "and would not receive {zhao}'s envoy, saying he would not sell " +
          "his lord's land and eat from it. {qin}'s envoy warns every court " +
          "that to accept the highland is to accept the war, and that {qin} " +
          "has no quarrel with anyone who stays out. From the highland's " +
          "walls {qin}'s new fortress line is visible across the valley.",
        moveMenu: [
          "Accept the towns, enfeoff the governor, and reinforce the highland at once",
          "Refuse the gift as a gain without cause and leave the highland to its fate",
          "Demand {qin} withdraw and call a covenant meeting of the eastern courts",
          "Send stores and observers to the highland, no troops",
          "Take the highland's towns before {zhao}'s columns can cross {taihang}",
        ],
      },
      {
        index: 3,
        title: "The Honored Envoy",
        inject:
          "A year has passed at the highland. {qin}'s columns have taken the " +
          "lower towns; {zhao}'s cautious general holds the upper valley " +
          "behind walls at {changping}, will not come out, and every assault " +
          "on the walls fails. {zhao}'s king, angry at the losses, sends a " +
          "high noble to {xianyang} to ask for terms. {qin} receives him " +
          "with honor before the envoys of every state and gives him no " +
          "terms; a minister at {handan} warns that the world has now seen " +
          "{zhao} sue for peace and will not rescue a state that sues. In " +
          "the markets of {handan} a song is heard mocking the cautious " +
          "general who holds the walls and praising the young general who " +
          "has read his father's books and promises battle; three ministers " +
          "who favor the cautious general have lately bought large estates. " +
          "{zhao}'s agents say the song was paid for with a thousand pieces " +
          "of {qin}'s gold and cannot prove it. At {linzi}, {qin}'s envoy " +
          "presents the dowager's court with gifts for every minister and " +
          "asks, very politely, that {qi}'s granaries stay closed this " +
          "year.",
        moveMenu: [
          "Accept the gifts and keep the granaries closed this year",
          "Refuse the gifts, publish why, and open the granaries to the covenant",
          "Replace the cautious general with the young one and seek battle",
          "Keep the general, name the bought ministers, and pay counter-singers",
          "Proclaim that any court which feeds {zhao} is at war with {qin}",
        ],
      },
      {
        index: 4,
        title: "The Two Envoys",
        inject:
          "Two campaign seasons have passed at {changping}. Whether the " +
          "cautious general still holds the walls or the young one has led " +
          "the army out, the grain is the same: {zhao}'s granaries are empty " +
          "and its court is calling up boys. An embassy from {handan} " +
          "reaches {linzi} and asks for grain at once for the army at the " +
          "walls, and a chariot and infantry column within the season. " +
          "{qin}'s envoy is in the same hall. He offers, if {qi}'s granaries " +
          "stay shut, the frontier towns east of the hills when the war is " +
          "won, and the rank of first among the eastern states. {chu} and " +
          "{wei} have sent {zhao} letters of support and no soldiers. A " +
          "minister of {qi} says before the court that {zhao} is the lip to " +
          "{qi}'s teeth, that when the lip is gone the teeth are cold, that " +
          "to rescue {zhao} is the high cause and to turn back {qin} the " +
          "great name, and that a court which hoards grain at such an hour " +
          "counts badly. The decision now falls to the focal seat: what " +
          "leaves {linzi} for the west, and on what terms?",
        moveMenu: [
          "Send grain and a chariot and infantry column to the walls now",
          "Send grain only, on loan against {zhao}'s towns, and no troops",
          "Offer to broker terms between {qin} and {zhao} at a covenant meeting",
          "Demand {chu} and {wei} march first, then match them",
          "Accept {qin}'s offer and hold the column at home",
        ],
      },
      {
        index: 5,
        title: "Forty-six Days",
        inject:
          "Whatever {qi} answered, nothing reached the walls. Whoever held " +
          "the command, the king of {zhao} ordered battle and the army came " +
          "out; {qin}'s general feigned a retreat, twenty-five thousand foot " +
          "closed the road behind {zhao}'s army and five thousand horse " +
          "closed the gap between it and its walls, and its grain road was " +
          "cut. The king of {qin} went in person to the districts north of " +
          "{river}, raised every man above fifteen, and set them on every " +
          "road by which grain or relief could come. For forty-six days the " +
          "army ate nothing that was not its own. Four assaults on {qin}'s " +
          "wall failed; the general died leading the fifth. Four hundred " +
          "thousand surrendered, and {qin}'s general, saying that men who " +
          "had changed sides once would change sides again, buried them and " +
          "sent two hundred and forty boys home to {handan} to tell it. " +
          "{qin}'s council must decide what to do with the highland and " +
          "with the road to {handan}; {zhao} must decide whether it still " +
          "has a state to govern; {qi}'s merchants report {qin}'s agents " +
          "already buying in {linzi}.",
        moveMenu: [
          "Press on to {handan} with a second campaign this year",
          "Halt at the highland, take six towns for peace, and rest the soldiers",
          "Sue for terms and preserve what remains",
          "Offer the six towns to {qi} instead of {qin} and ask for its army",
          "Rally the remaining covenant with a public oath and a named army",
        ],
      },
      {
        index: 6,
        title: "The Turn East",
        inject:
          "{qin}'s envoys now arrive at {linzi} in numbers, with gifts for " +
          "the dowager's ministers and questions about {qi}'s harbors and " +
          "roads. {qin}'s chancellor announces a register of the highland's " +
          "households, a commandery north of it, and a road built over " +
          "{taihang} toward the east. {qi}'s generals ask for the levy " +
          "doubled and a war tax; its merchants ask for a treaty. What " +
          "remains of {zhao}'s court, and {chu} and {wei} with it, ask {qi} " +
          "whether a covenant still exists. {qin} asks the same question, " +
          "more quietly.",
        moveMenu: [
          "Double the levy, raise a war tax, and fortify the western approaches",
          "Raise the levy modestly and seek a defensive covenant with whoever remains",
          "Sign a treaty with {qin} and reduce the army to spare the treasury",
          "Send grain and gold to what remains of {zhao} as a forward buffer",
          "Invite {qin}'s envoys to a covenant meeting and play for time",
        ],
      },
    ],
  },
  zh: {
    title: "孔道",
    summary:
      "{han}的{shangdang}高地被{qin}军切断了通往本国朝廷的道路，其郡守把它献给" +
      "{zhao}而不献给{qin}。{qin}是{hangu}以西变法而强的关内之国，{zhao}是据守" +
      "{taihang}关隘的边地之国，两军在{changping}各筑壁垒相持，{zhao}的粟先尽。" +
      "{qi}是远在东方海滨的富国，同一天里，{zhao}向它请粟、请援兵，{qin}向它许以" +
      "单独的和约；{chu}与{wei}只送来了书信。每一席位每回合收到情势通报，并以决策" +
      "备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：使者往来，市肆开放，盟约未续",
      "抗议、合纵之书与质子",
      "暗中之计：以黄金收买大臣，买来的歌谣，厚礼使者以辱其君",
      "粟与道路：对盟国闭籴，援兵留于国内",
      "高地筑垒，征兵至边境",
      "有限之战：高地城邑逐一被夺",
      "全面之战：合纵诸军在不止一面战场列阵",
      "覆灭：一军被坑，都城被围，一国被灭",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时，一条道路被切断了。你们的朝廷新有一位来自{wei}的客卿相邦，他" +
          "教导君王：近处所得一寸便是王的一寸；{han}与{wei}是天下之枢，必先破之，" +
          "而后及于远国。你们的军队已经夺取{taihang}之下那座城，它扼着{han}的朝廷" +
          "通往其{shangdang}高地的唯一道路；高地的十七座城邑现在应当落入你们手中。" +
          "百年的籍册充实了兵员，你们的粮仓足以在高地上支撑两季征战，而山东任何一国" +
          "只能支撑一季。自五国破{qi}以来，{qi}一直谨守与你们的和好，而{qi}的粮仓是" +
          "山东唯一能养活一支{zhao}军的粮仓。",
        objectives: [
          "夺取{shangdang}，打开越过{taihang}通往{handan}的道路",
          "让{qi}闭籴，让{qi}置身于任何合纵之军之外",
          "在{zhao}军被击破之前，避免两面作战",
          "为下一次征战保存兵员与粮仓",
        ],
      },
      {
        id: "zhao",
        name: "{zhao}",
        state: "zhao",
        brief:
          "本章开始时，{han}的{shangdang}高地俯临越过{taihang}通往{handan}的道路，" +
          "它与本国君王断绝，正在寻找新的君王。你们持重的老将在边境统军，有坚固的" +
          "壁垒和长久的战功；锐进的一派有一位年轻的将军，名将之子，读过父亲的兵书，" +
          "许诺一战。你们的粮仓只够一季。你们在山东合纵中的盟友{chu}、{wei}、{qi}" +
          "送来了使者而没有送来粟，而{qi}的粮仓是天下最实的。",
        objectives: [
          "守住{shangdang}，不让{qin}得到越过{taihang}的道路",
          "从{qi}取得粟与一支援兵",
          "不让合纵瓦解为各自单独的和约",
          "避免按{qin}的条件进行一场决定性的野战",
        ],
      },
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "本章开始时，距五国把你们打到只剩两城、你们的一位将军收复每一座城，已过了" +
          "一代人。城墙已重筑，粮仓又满了。一位太后为年幼的君王执掌朝廷，她的方略" +
          "一向是谨守与{qin}的和好，把兵员留在国内，让西方诸国去打。为{shangdang}" +
          "而起的战争已打了两年，在{linzi}以西二十舍之外。{zhao}的使者告诉你们：" +
          "你们会被最后征服，而不是被放过；{qin}的使者告诉你们：西方的战争与你们" +
          "无关，只要置身事外，你们的市肆安然无恙。你们从未单独与{qin}在野外交锋，" +
          "并且宁愿永远不要。",
        objectives: [
          "让盐路、市肆与府库置身战争之外",
          "在{taihang}以西维持一种均势，使{qi}与{qin}之间仍有一国相隔",
          "避免成为{qin}的下一个边境",
          "只在能决定结局之处投入粟与士卒",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "断道",
        inject:
          "{qin}军夺取{taihang}之下那座城，它扼着{han}的朝廷通往其{shangdang}高地" +
          "的唯一道路；高地的十七座城邑与其君王断绝。在{xianyang}，客卿相邦的方略" +
          "被公开宣告：远交近攻，近处所得一寸便是王的一寸。同一天，两封信分别送到" +
          "{handan}与{linzi}。第一封来自{chu}与{wei}，代山东合纵而发，请各国重申" +
          "埋牲而誓的盟约：攻其一则众共救之，并各自写明出粟与出兵之数。第二封来自" +
          "{qin}，向每一国各自许以和约：开放市肆，王室联姻，并许诺{qin}所争的只是" +
          "{han}一国。众所周知，{qin}的使者带着的不只是书信，还有黄金。",
        moveMenu: [
          "全盟合纵，写明出粟与出兵之数",
          "订一个有限的盟约：相互商议与通市，不自动开战",
          "接受{qin}单独的和约，收下联姻与市肆",
          "两封信都不答复，向两国各遣使者以探虚实",
          "扣留疑似携带黄金的使者，搜查其车",
        ],
      },
      {
        index: 2,
        title: "十七城",
        inject:
          "{shangdang}的郡守，通往本国君王的道路已断，{qin}军距此三舍，他召集父老" +
          "说：高地若入于{qin}，其民便是{qin}的民；不如献给{zhao}，使{qin}之怒" +
          "加于{zhao}，{han}与{zhao}不得不合为一体。他的使者到达{handan}，献上十七" +
          "座城邑，连同储积与戍卒。{zhao}的一位大臣说，圣人甚惧无故之利：{qin}出了" +
          "力，{zhao}却要吃果实，弱者不能取于强者。另一位大臣说，发百万之军攻打" +
          "一年也未必得一城，如今十七城不战而来；他已经拟好了封赏：郡守封以三座万户" +
          "之邑，县令各封三座千户之邑，吏民皆益爵三级。据报，郡守流涕不肯见{zhao}的" +
          "使者，说他不忍卖主之地而食之。{qin}的使者警告各国：受高地便是受战争，而" +
          "{qin}与置身事外者无争。从高地的城墙上，隔着山谷可以望见{qin}新筑的" +
          "壁垒。",
        moveMenu: [
          "受十七城，封郡守，立即增援高地",
          "以无故之利为由拒绝这份献礼，任高地自生自灭",
          "要求{qin}撤军，并召集山东诸国会盟",
          "向高地送去储积与观察的使者，不派士卒",
          "趁{zhao}的纵队尚未越过{taihang}，先取高地诸城",
        ],
      },
      {
        index: 3,
        title: "受礼之使",
        inject:
          "高地上已过了一年。{qin}的纵队夺取了下方诸城；{zhao}持重的老将据守" +
          "{changping}的壁垒，扼住上方的山谷，坚壁不出，每一次攻壁都失败。{zhao}王" +
          "因失亡而怒，派一位贵人前往{xianyang}请和。{qin}在各国使者面前厚礼相待，" +
          "却不给他任何条件；{handan}的一位大臣警告说，天下如今已见{zhao}向{qin}" +
          "请和，必不救一个请和之国。在{handan}的市井中有人唱一支歌，嘲笑守壁的" +
          "老将，称颂读过父亲兵书、许诺一战的年轻将军；三位支持老将的大臣近来买下了" +
          "大片田宅。{zhao}的细作说这支歌是用{qin}的千金买来的，却无法证明。在" +
          "{linzi}，{qin}的使者向太后的朝廷献上给每一位大臣的礼物，并极为客气地请求" +
          "{qi}今年闭籴。",
        moveMenu: [
          "收下礼物，今年闭籴",
          "拒绝礼物，公布理由，向合纵诸国开籴",
          "以年轻的将军取代持重的老将，求战",
          "保留老将，指名被收买的大臣，出钱请人唱反歌",
          "宣告：凡以粟资{zhao}之国，即与{qin}为敌",
        ],
      },
      {
        index: 4,
        title: "两国之使",
        inject:
          "在{changping}已过了两季征战。无论持重的老将仍守着壁垒，还是年轻的将军已率" +
          "军出壁，粟的情形是一样的：{zhao}的粮仓已空，朝廷开始征发少年。{handan}" +
          "的使团到达{linzi}，请求立即发粟以供壁垒中的军队，并请求在一季之内派出一支" +
          "车徒。{qin}的使者就在同一座殿堂里。他许诺，若{qi}闭籴不出，则战罢之后以" +
          "岭东的边邑相予，并尊{qi}为山东诸国之首。{chu}与{wei}送给{zhao}的是" +
          "声援的书信，没有士卒。{qi}的一位大臣在朝廷上说：{zhao}之于{qi}，犹齿之" +
          "有唇，唇亡则齿寒；救{zhao}是高义，却{qin}是显名；在这样的时刻爱惜粟米的" +
          "朝廷，是算错了账。决定现在落到焦点席位：什么东西从{linzi}西出，以何种" +
          "条件？",
        moveMenu: [
          "立即向壁垒发粟，并派出一支车徒",
          "只发粟，以{zhao}的城邑为质而贷之，不派士卒",
          "请求会盟，由{qi}在{qin}与{zhao}之间说和",
          "要求{chu}与{wei}先出兵，然后与之相当",
          "接受{qin}所许，把车徒留在国内",
        ],
      },
      {
        index: 5,
        title: "四十六日",
        inject:
          "无论{qi}如何答复，什么都没有到达壁垒。无论谁掌兵，{zhao}王下令出战，军队" +
          "出了壁垒；{qin}将佯败而走，二万五千步卒断了{zhao}军身后的道路，五千骑断" +
          "了它与壁垒之间的空隙，它的粮道被切断。{qin}王亲自前往{river}以北诸县，" +
          "征发十五岁以上的每一个男子，把他们布在粟与援兵可能经过的每一条道路上。" +
          "四十六日里，那支军队所食的只有它自己。四次攻{qin}壁都失败；主将在第五次" +
          "中阵亡。四十万人投降，{qin}将说，曾经反复的人还会再反复，于是把他们坑杀，" +
          "放回二百四十名少年回{handan}去传话。{qin}的议事之臣必须决定如何处置高地" +
          "与通往{handan}的道路；{zhao}必须决定它是否还有一个国家可治；{qi}的商贾" +
          "报告说，{qin}的人已经在{linzi}收买。",
        moveMenu: [
          "今年再发一次征战，直取{handan}",
          "止于高地，取六城为和，让士卒休息",
          "请和，保全尚存之物",
          "把六城献给{qi}而不献给{qin}，请其出兵",
          "以公开的盟誓与一支指名的军队重振尚存的合纵",
        ],
      },
      {
        index: 6,
        title: "东向",
        inject:
          "{qin}的使者如今成群到达{linzi}，带着给太后诸臣的礼物，以及关于{qi}的港口" +
          "与道路的询问。{qin}的相邦宣布为高地的户口造籍，在其北设郡，并修一条越过" +
          "{taihang}向东的道路。{qi}的将军请求兵员加倍并征战税；商贾请求盟约。" +
          "{zhao}朝廷的残余，连同{chu}与{wei}，问{qi}合纵是否还存在。{qin}问的是" +
          "同一件事，只是更安静。",
        moveMenu: [
          "兵员加倍，征战税，在西境筑垒",
          "略增兵员，与尚存者订一个守御之盟",
          "与{qin}订约，裁减军队以省府库",
          "向{zhao}的残余送去粟与黄金，作为前方的屏障",
          "邀{qin}的使者会盟，以拖延时日",
        ],
      },
    ],
  },
};

export const CORRIDOR_STATES = buildChapter(CORRIDOR_STATES_TEXT);
