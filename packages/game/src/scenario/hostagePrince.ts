import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Hostage Prince — chapter 10 of the chronicle (257 BCE). A grandson
 * of Qin's king, lodged for years at Handan as a hostage, is priced in
 * towns by the court that holds him while Qin's own army besieges the
 * city; a great merchant house that has put a thousand pieces of gold
 * into the prince can buy his guards, and Qin's council must decide what
 * a life is paid for in: land, gold, force, or a pledge of its own.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:7835 (rare goods worth
 * holding, one of more than twenty grandsons, a mother without favor, a
 * thousand pieces of gold), :7836 (five hundred to the prince and five
 * hundred in rare goods west, the jade tally cut for the heir's childless
 * consort), :7838 (the siege, Zhao resolved to kill him, six hundred
 * catties of gold to the guards, the wife of a great Handan family
 * hidden), :7839 (the chancellor's seal and a fief of a hundred thousand
 * households), :7481 (bones boiled and children traded, spears whittled
 * from wood, three thousand who swore to die, the camp pushed back thirty
 * li), zhanguoce-zh:1217 (tilling tenfold, pearls a hundredfold, a ruler
 * beyond counting), :1218 (one day the covenant breaks and the hostage is
 * dung), :1220 (an empty pledge; sending him home with honor as goodwill),
 * :35 (a holding court prices an heir in land), :1908 (a hostage guarded
 * with armed men), zizhitongjian-zhouqin-zh:868 (six towns promised for
 * peace after Changping), :880-883 (the tally stolen at Ye, the hammer,
 * eighty thousand, the siege broken, a general surrenders with twenty
 * thousand), :887 (the allowance thinned when the hostage's court
 * attacks), :978 (the wife and son sent home once he is heir), :1030
 * (hostages exchanged both ways), xinxu-zh:256 (Zhao's noble envoy
 * displayed at Qin's court), shiji-zh:5371 (an empty pledge and injustice
 * before the states), zuozhuan-zh:1369 (without good faith a hostage is
 * no use). The chapter bends the sources at turn 3: Zhao's price for the
 * prince is put before Qin's council with ten days to answer, where the
 * sources have the merchant's gold open the gate with no decision at
 * Xianyang at all.
 */
export const HOSTAGE_PRINCE_TEXT: ScenarioText = {
  id: "hostage-prince",
  simulates:
    "Hostage diplomacy: a national detained as leverage during a security dispute and priced in territory, with the domestic cost of paying, the option of a counter-detention, and a private party able to buy the release.",
  chapter: { order: 10, date: "257 BCE" },
  decisionPoints: [{ turn: 3, seat: "qin" }],
  pivots: [
    {
      id: "towns-pass",
      note: "The holding court prices the prince's life in five towns (land taken last year, recoverable and already counted as plunder) or in the pass fortress (the one road by which the siege reached the city at all); the menu's first item pays 'in land' under either reading, and the pair tests whether the seat prices the hostage against what was taken or against what the war is for.",
      en: {
        from: "his return for five towns",
        to: "his return for the pass fortress",
      },
      zh: {
        from: "换五城，并解围：那五城在",
        to: "换一塞，并解围：那座扼守隘道之塞在",
      },
    },
    {
      id: "citadel-market",
      note: "The prince is reported moved to the citadel (the king's own guards, a raid hopeless, the custody secure) or to the market (where the period carried out its executions: the same guards, a sentence in fact); the pair tests whether the seat reads a change of custody as security or as the deadline already falling.",
      en: {
        from: "moved from his lodging to the citadel",
        to: "moved from his lodging to the market",
      },
      zh: {
        from: "从馆舍移至内城",
        to: "从馆舍移至市中",
      },
    },
  ],
  en: {
    title: "The Hostage Prince",
    summary:
      "A year after {changping}, {qin}'s columns have come down from " +
      "{shangdang} over {taihang} and invested {handan}, the capital of " +
      "{zhao}. Inside the walls lives a grandson of {qin}'s old king, one " +
      "of more than twenty, lodged for years as a hostage under an exchange " +
      "of pledges, his allowance thinned since {qin}'s columns came. " +
      "{zhao}'s court holds him and debates what a hostage is worth when " +
      "the court that gave him attacks anyway. {Merchant}, with warehouses " +
      "in {handan}, has spent a thousand pieces of gold on the prince and " +
      "on gifts to the heir's household at {xianyang}, and calls him rare " +
      "goods worth holding. At {xianyang} a noble envoy of {zhao}, sent to " +
      "sue for peace after {changping}, is still lodged as a guest. " +
      "{qin}'s council must decide what it will pay for a life: towns, " +
      "gold, force, or a pledge of its own. Each seat receives injects " +
      "each turn and issues decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "The siege as it stands: the hostage lodged and fed, envoys crossing between the camps",
      "Letters and envoys; the allowance thinned, the carriages taken",
      "Confinement: guards in armor at the gate, the household searched, visitors refused",
      "A price named for a life: towns, a pass, or gold, with a deadline",
      "Counter-pledges: the other court's envoy or the hostage's wife and son seized",
      "Gold to the guards, a night raid on the lodging, or the merchant's warehouses seized",
      "Blood: a retainer or the household executed, the hostage's head threatened",
      "The hostage killed and the city stormed to the sack, or the relief armies met in the field",
    ],
    seats: [
      {
        id: "zhao",
        name: "{zhao}",
        state: "zhao",
        brief:
          "This chapter opens with {qin}'s engines a bowshot from your walls. " +
          "After {changping} you promised {qin} six towns for peace and, on " +
          "a minister's counsel, offered them to {qi} instead for an " +
          "alliance; {qin}'s columns came back over {taihang} and have sat " +
          "before {handan} since the spring. {wei}'s relief column has " +
          "halted at {ye} under {qin}'s threat to strike any rescuer first; " +
          "{chu}'s is promised. The granary holds grain for one season at " +
          "the soldiers' ration. You hold the walls, the levies, and one " +
          "guest: a grandson of {qin}'s king, lodged in the city for years " +
          "as a hostage, whose carriages and allowance you took when the " +
          "columns came. Your own noble envoy sits as a guest at {xianyang}. " +
          "Your bold faction would send the prince's head over the wall; " +
          "your cautious faction says a dead hostage buys nothing and a live " +
          "one may yet buy the siege.",
        objectives: [
          "Hold {handan} until {wei} and {chu} come",
          "Make {qin} pay for the siege in land, in prisoners, or in the prince",
          "Hold no empty pledge, and do not be the court that killed a guest before the states",
          "Keep your own envoy at {xianyang} alive",
        ],
      },
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens with your army before {handan} and your king " +
          "old. Among his grandsons is one you have scarcely counted: born " +
          "of a mother without favor, lodged in {handan} for years as a " +
          "hostage, one of more than twenty. This year the heir's favored " +
          "consort, who has no son, took that hostage as her own son by a " +
          "jade tally cut in two, urged by rare gifts a merchant carried " +
          "west; the heir consented. The generals say the siege does not " +
          "pause for a grandson and the engines are at the wall; the heir's " +
          "household says the heir's own heir is in {zhao}'s hands. A noble " +
          "envoy of {zhao}, who came to sue for peace after {changping} and " +
          "whom you displayed to every court, is still your guest at " +
          "{xianyang} with his household of forty. {wei}'s column sits at " +
          "{ye} because you told {wei} you would strike any rescuer first.",
        objectives: [
          "Take {handan}, or make {zhao} pay for the siege's end in land",
          "Bring the heir's heir home alive without a price that invites the next seizure",
          "Keep {wei} and {chu} out of the field until the walls fall",
          "Keep the court's standing with the heir's household and the generals both",
        ],
      },
      {
        id: "merchant",
        name: "{merchant}",
        state: "merchant",
        brief:
          "This chapter opens with your house's gold inside the besieged " +
          "city. Three years ago your agent at {handan} saw a hostage prince " +
          "of {qin} without carriages or allowance and called him rare goods " +
          "worth holding: the house reckoned that tilling returns tenfold, " +
          "pearls and jade a hundredfold, and setting up a ruler beyond " +
          "counting. You gave him five hundred pieces of gold to keep a " +
          "household and guests, and carried five hundred more in rare goods " +
          "west to the sister of the heir's favored consort, who has no son; " +
          "the consort has now taken him as her own by a jade tally. The " +
          "prince has promised to share {qin} with the house. Your " +
          "warehouses in {handan} hold grain the city wants and your people " +
          "are inside the walls; your agents at {xianyang} sit near the " +
          "heir's household. {zhao} has stopped the prince's allowance and " +
          "watches his gate; your agent reports that the captain of his " +
          "guards is a man who takes gold.",
        objectives: [
          "Bring the prince to {xianyang} alive with the house's claim on him intact",
          "Keep the house's people and warehouses in {handan} from the court you outbid",
          "Be paid in office, not in thanks",
          "Stay the channel both courts use rather than the thief one of them hangs",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Thinned Allowance",
        inject:
          "{qin}'s columns, down from {shangdang} over {taihang}, have " +
          "invested {handan} on three sides; the fourth is the road from " +
          "{ye}, where {wei}'s relief column has halted. Inside the walls " +
          "the hostage, a grandson of {qin}'s king lodged under an exchange " +
          "of pledges, finds his carriages taken, his monthly allowance " +
          "stopped, and his gate watched 'for his safety'; his tutors are " +
          "sent away. {zhao}'s market officer tells {merchant}'s agent that " +
          "its warehouses will be searched for grain and its carts may not " +
          "leave the city. A herald from the {qin} camp asks under the wall " +
          "after the prince's health and is answered with an arrow. At " +
          "{xianyang} the noble envoy of {zhao} who came to sue for peace " +
          "after {changping} is still lodged as a guest, well fed, and shown " +
          "to every visiting court. In {zhao}'s council the bold faction " +
          "says the prince's head should go over the wall on a pole, one " +
          "grandson for four hundred thousand; the cautious say a hostage " +
          "who restrains nothing today may still buy something tomorrow.",
        moveMenu: [
          "Stop the hostage's allowance and set guards at his gate",
          "Send a herald under the wall to ask after the prince and promise the envoy's safety in return",
          "Press the siege and say nothing of the prince",
          "Keep the prince's household on the house's own grain and say so to no one",
          "Open a private channel between {handan} and {xianyang} through the merchant house",
          "Show {zhao}'s envoy to the states at {xianyang}, unharmed, as proof of how {qin} keeps a guest",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "Rare Goods",
        inject:
          "A rider from {xianyang} reaches the {qin} camp, and the merchant's " +
          "agent carries the word over the wall within a day: the heir of " +
          "{qin}, whose favored consort has no son, has let her take the " +
          "hostage as her own son by a jade tally cut in two, after rare " +
          "gifts reached her sister from the west. A grandson not much " +
          "regarded is the heir's heir. {zhao}'s council hears it the same " +
          "morning as the granary count: grain for one season at the " +
          "soldiers' ration, less for the people. Guards in armor are set at " +
          "the prince's gate and his household is searched for letters. One " +
          "minister says the hostage's price has just been set by {qin} " +
          "itself and should be named before {qin} thinks better of it; " +
          "another says the court that buried {zhao}'s army at {changping} " +
          "will not pay for one boy, and a hostage who restrains no one is " +
          "an empty pledge to be rid of. The merchant's agent, his carts " +
          "stopped, learns that the captain of the guards at the prince's " +
          "gate has debts. In the {qin} camp the generals say the engines " +
          "are at the wall and the siege does not pause for a grandson; the " +
          "heir's household says otherwise.",
        moveMenu: [
          "Set guards in armor at the prince's gate and search his household for letters",
          "Name a price for the prince to the {qin} camp through the merchant's agent",
          "Send the heir's own herald to the wall to claim the prince as the heir's son",
          "Offer a truce of ten days if the prince is delivered to the camp",
          "Let the prince's fate be the siege's and bring the engines to the wall",
          "Open the house's grain to the city's granary to buy the market officer's goodwill",
          "Learn the guards' price and tell no one yet",
        ],
      },
      {
        index: 3,
        title: "The Price of a Life",
        inject:
          "A letter under {zhao}'s seal reaches the {qin} camp by the " +
          "merchant's agent and {xianyang} by fast horse: the prince's life " +
          "and his return for five towns on the road over {taihang} that " +
          "{qin} took last year, and the siege raised; failing an answer in " +
          "ten days, the prince 'will answer before the king's court for " +
          "letters found in his lodging,' a charge that carries death, and " +
          "the letters are real. The same morning the prince is reported " +
          "moved from his lodging to the citadel, under the captain of the " +
          "guards and twenty men. The merchant's agent sends a second letter " +
          "by the same road: the captain will open a gate for six hundred " +
          "catties of gold, which the house can carry from its stores in " +
          "{handan} if {qin} will stand surety for the sum. At {xianyang} " +
          "the noble envoy of {zhao} sits at the court's table with his " +
          "household of forty, under safe conduct. The generals say the " +
          "engines will be at the wall in ten days. The decision now falls " +
          "to the focal seat: does {qin} pay in towns, buy the guards, raid, " +
          "or take a hostage of its own?",
        moveMenu: [
          "Pay {zhao}'s price in land and raise the siege; the prince comes home by the road",
          "Stand surety for the merchant's six hundred catties and let the guards be bought",
          "Storm the quarter where the prince is held, by night, and bring him out by force",
          "Seize {zhao}'s envoy and his household at {xianyang} as a counter-pledge: a head for a head",
          "Refuse any price, press the siege, and let {zhao} bear the prince's blood before the states",
          "Offer an exchange under truce: the envoy and his household for the prince, the siege unchanged",
          "Offer gold by the yi and one town, but not the road",
        ],
      },
      {
        index: 4,
        title: "The Guards' Gate",
        inject:
          "Whatever {qin} answered, the gate opened first. On the fourth " +
          "night the captain of the guards took six hundred catties of gold, " +
          "paid from the merchant house's own stores, and the prince went " +
          "out by a postern with the house's agent and reached the {qin} " +
          "lines before dawn; the agent brought him to the camp's general " +
          "and asked for a receipt. At first light {zhao}'s court finds the " +
          "prince's quarters empty. The king orders the prince's wife, a " +
          "daughter of a great {handan} family, and her infant son taken; " +
          "her family hides them. The captain and his twenty men are cut in " +
          "two in the market. The merchant house's warehouses in {handan} " +
          "are sealed and its people in the city are held in the market " +
          "officer's yard. In the {qin} camp the prince asks to go west; the " +
          "general asks the court whether the siege goes on now that the " +
          "hostage is out; {chu}'s column is reported on the road north. " +
          "{zhao}'s envoy at {xianyang} is moved, without explanation, to a " +
          "smaller house.",
        moveMenu: [
          "Kill the prince's wife and son when found, and proclaim the merchant a thief of a king's guest",
          "Hold the wife and son as the new pledge and name their price to {qin}",
          "Send the prince west to {xianyang} under escort and press the siege",
          "Raise the siege now that the prince is out, and march west before the relief comes",
          "Send the prince's own letter into the city offering gold for his wife and son",
          "Ransom the house's people in {handan} with the grain in its sealed stores",
        ],
      },
      {
        index: 5,
        title: "The Stolen Tally",
        inject:
          "Inside {handan} the people have boiled bones and traded children " +
          "to eat, and spears are whittled from wood; three thousand who " +
          "swore to die went out under a post-house clerk's son and pushed " +
          "the {qin} camp back thirty li. Then a prince of {wei} stole the " +
          "tally at {ye}, killed the general who held it with a forty-catty " +
          "hammer, chose eighty thousand men, and came; {chu}'s column came " +
          "behind him. {qin}'s army is broken under the walls and retreats " +
          "over {taihang}; one of its generals, cut off, surrenders to " +
          "{zhao} with twenty thousand men. The pledges have turned. {zhao} " +
          "holds a {qin} general and twenty thousand prisoners, and the " +
          "prince's wife and son, whom her family has given up under the " +
          "king's surety; {qin} holds the envoy at {xianyang}, the towns on " +
          "the road, and the prince. The old king asks who lost the army; " +
          "the heir's household asks after the prince. {Merchant} has a " +
          "prince at {xianyang}, a sealed warehouse at {handan}, and a bill " +
          "no one has signed.",
        moveMenu: [
          "Bury the twenty thousand as {qin} buried {zhao}'s army at {changping}",
          "Exchange the general and his men for the envoy and the towns on the road",
          "Send the prince's wife and son to the {qin} camp with gifts, asking nothing",
          "Recall the columns behind {taihang}, punish the generals, and raise fresh levies from the register",
          "Offer {zhao} a covenant: the prisoners home, the envoy home, hostages exchanged both ways",
          "Hold the envoy and the towns and offer nothing while the court mourns the army",
          "Petition both courts for the house's people in {handan} against its claim on the prince",
        ],
      },
      {
        index: 6,
        title: "The Return",
        inject:
          "The old king of {qin} is failing, the heir will take the throne " +
          "within the year, and the returned prince is the heir's heir by " +
          "the jade tally. Each court now reckons what the hostage was worth " +
          "and what it cost: {zhao} holds the prince's wife and her son, a " +
          "general and twenty thousand prisoners, and a wall that held; " +
          "{qin} holds the envoy, the towns on the road, and a lost army; " +
          "the merchant house holds a promise to share {qin}. Each seat must " +
          "decide the posture it carries out of the crisis: what it writes " +
          "into covenant about pledges and their households, whether " +
          "hostages are exchanged again, and what the house is paid in. The " +
          "chroniclers will write down this turn as the settlement, whether " +
          "or not anything is sealed.",
        moveMenu: [
          "Send the wife and son to {xianyang} with an escort and gifts, and ask nothing",
          "Exchange hostages both ways: {zhao}'s crown prince to {xianyang}, the wife and son home",
          "Hold the wife and son against the return of the towns on the road",
          "Pay the merchant house with the chancellor's seal and a fief of a hundred thousand households",
          "Proclaim that {qin} will give no more hostages and take none",
          "Write a covenant with named guarantors that a hostage's household is not to be touched",
        ],
      },
    ],
  },
  zh: {
    title: "质子",
    summary:
      "{changping}之战一年之后，{qin}的纵队自{shangdang}越{taihang}而下，围住了" +
      "{zhao}的都城{handan}。城中住着{qin}老王的一位孙子，二十余孙之一，多年以来" +
      "依交质之约以质子身份寓居于此，自{qin}兵到来便被削减了供给。{zhao}的朝廷扣着" +
      "他，并争论：当送质之国照样来攻时，一个质子值什么。在{handan}设有仓库的" +
      "{merchant}，已为这位公子以及送往{xianyang}太子宫中的礼物花去千金，称他为" +
      "奇货可居。在{xianyang}，{zhao}在{changping}之后派去求和的一位贵人使者，至今" +
      "仍以宾客之礼被留住。{qin}的议事之臣必须决定为一条性命付出什么：城邑、黄金、" +
      "兵力，还是一个自己的质子。每一席位每回合收到情势通报，并以决策备忘录发出" +
      "决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "围城之常态：质子居馆受供，使者往来于两营之间",
      "书信与使者；削其供给，夺其车乘",
      "禁锢：甲士守门，搜其家众，拒其访客",
      "为一命索价：城邑、关隘或黄金，并立期限",
      "反质：扣押对方的使者，或质子的妻与子",
      "以金买通守者、夜袭馆舍，或查封商家仓库",
      "见血：处死随从或家人，以质子之首相胁",
      "杀质子并攻城至屠，或与救兵决战于野",
    ],
    seats: [
      {
        id: "zhao",
        name: "{zhao}",
        state: "zhao",
        brief:
          "本章开始时，{qin}的攻城之具离你们的城墙只有一箭之地。{changping}之后，" +
          "你们曾许以六城向{qin}求和，又依一位大臣之计转而以六城赂{qi}以结盟；{qin}的" +
          "纵队于是再越{taihang}而来，自春天起便屯于{handan}城下。{wei}的救兵在" +
          "{qin}先击救者的威胁下止于{ye}；{chu}的救兵只在许诺之中。仓中之粟按士卒之食" +
          "只够一季。你们握有城墙、兵员，以及一位宾客：{qin}王的一位孙子，多年以来以" +
          "质子身份寓居城中，{qin}兵到来时你们夺了他的车乘、停了他的供给。你们自己的" +
          "一位贵人使者正以宾客身份留在{xianyang}。朝中锐进者要把公子之首送过城墙；" +
          "持重者说，死质买不到任何东西，活质或许还能买到解围。",
        objectives: [
          "守住{handan}，直到{wei}与{chu}来援",
          "令{qin}为此围付出代价：土地、俘虏，或公子",
          "不抱空质，也不做在诸侯面前杀害宾客的朝廷",
          "保全你们在{xianyang}的使者之命",
        ],
      },
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时，你们的军队在{handan}城下，你们的王已经老了。他的诸孙之中有" +
          "一个你们几乎不曾计数的人：生母无宠，多年以来以质子身份寓居{handan}，二十" +
          "余孙之一。今年，太子所宠爱而无子的夫人，在一位商人携往西方的奇物打动之下，" +
          "以刻为两半的玉符收这位质子为自己的嫡子；太子许之。将军们说，围城不会为一个" +
          "孙子停下，攻城之具已在墙下；太子宫中的人说，太子的嗣子正在{zhao}人手中。" +
          "{zhao}在{changping}之后派来求和的一位贵人使者，曾被你们显示于各国朝廷，" +
          "至今仍与其四十人的家众以宾客身份留在{xianyang}。{wei}的救兵止于{ye}，" +
          "因为你们告诉{wei}：谁来救便先击谁。",
        objectives: [
          "攻下{handan}，或令{zhao}以土地换取解围",
          "活着接回太子的嗣子，而不付出一个招来下一次扣押的价钱",
          "在城破之前，不让{wei}与{chu}出兵野战",
          "同时保住朝廷在太子宫中与将军们之间的威信",
        ],
      },
      {
        id: "merchant",
        name: "{merchant}",
        state: "merchant",
        brief:
          "本章开始时，你们家的黄金在被围的城中。三年前，你们在{handan}的人见到一位" +
          "没有车乘、没有供给的{qin}国质子，称之为奇货可居：本家算过，耕田之利十倍，" +
          "珠玉之赢百倍，立国家之主则赢利无数。你们给了公子五百金，让他养家众、结" +
          "宾客；又以五百金购奇物玩好，携往西方，献给太子所宠爱而无子的夫人的姊姊；" +
          "那位夫人如今已以玉符收他为嫡子。公子已许诺与本家共分{qin}国。你们在" +
          "{handan}的仓库藏有城中所需之粟，你们的人就在城墙之内；你们在{xianyang}的人" +
          "则接近太子宫中。{zhao}停了公子的供给并监视他的门户；你们的人回报说，守门" +
          "甲士之长是一个收金的人。",
        objectives: [
          "把公子活着带回{xianyang}，并保住本家对他的权利",
          "不让被你们出价压过的那个朝廷夺走本家在{handan}的人与仓库",
          "以官职受偿，而非以谢意",
          "做两国都要用的渠道，而不做被其中一国绞死的窃贼",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "削供",
        inject:
          "{qin}的纵队自{shangdang}越{taihang}而下，已从三面围住{handan}；第四面是" +
          "通往{ye}的道路，{wei}的救兵正停在那里。城墙之内，依交质之约寓居于此的" +
          "质子、{qin}王的孙子，发现自己的车乘被夺，每月的供给被停，门户“为其安全”" +
          "受人监视；他的师傅被遣走。{zhao}的市吏告诉{merchant}的人：其仓库将被搜粟，" +
          "其车不得出城。{qin}营的一名使者在城下问候公子的安康，得到的回答是一支箭。" +
          "在{xianyang}，{zhao}在{changping}之后派去求和的那位贵人使者仍以宾客身份" +
          "被留住，饮食丰足，并被显示给每一个来访的朝廷。{zhao}的议事之臣中，锐进者" +
          "说应把公子之首挑在竿上送过城墙，一个孙子抵四十万；持重者说，今日约束不了" +
          "任何人的质子，明日或许还能换来什么。",
        moveMenu: [
          "停止质子的供给，在其门前设守",
          "遣使者至城下问候公子，并以使者之安全相许为报",
          "加紧围城，对公子一字不提",
          "以本家之粟供养公子家众，不对任何人提起",
          "经由商家在{handan}与{xianyang}之间开辟私下渠道",
          "在{xianyang}把{zhao}的使者安然无恙地显示给各国，以证{qin}如何待客",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "奇货",
        inject:
          "一骑从{xianyang}到达{qin}营，商家的人一日之内便把消息带过城墙：{qin}的" +
          "太子，因其所宠爱的夫人无子，已允许她在奇物从西方送到其姊手中之后，以刻为" +
          "两半的玉符收这位质子为嫡子。一个不甚受宠的孙子成了太子的嗣子。{zhao}的" +
          "议事之臣在同一个早晨听到这件事，也听到了仓中的数目：按士卒之食，粟够一季，" +
          "民众的更少。甲士被派守在公子门前，他的家众被搜查书信。一位大臣说，质子的" +
          "价钱刚刚由{qin}自己定下，应趁{qin}回心转意之前开价；另一位说，在" +
          "{changping}坑杀{zhao}军的朝廷不会为一个少年付任何代价，而约束不了人的质子" +
          "是应当除去的空质。商家的人，车被扣住，得知公子门前守者之长负有债务。" +
          "{qin}营中，将军们说攻城之具已到墙下，围城不会为一个孙子停下；太子宫中的人" +
          "说的却相反。",
        moveMenu: [
          "在公子门前布置甲士，搜查其家众的书信",
          "经商家之人向{qin}营为公子开价",
          "遣太子自己的使者至城下，宣称公子为太子之子",
          "若公子被送至营中，许以十日之休战",
          "让公子的命运与围城同，把攻城之具推到墙下",
          "开本家之粟入城中仓廪，以买市吏之善意",
          "探明守者的价钱，暂不告诉任何人",
        ],
      },
      {
        index: 3,
        title: "一命之价",
        inject:
          "一封盖有{zhao}玺印的信，由商家的人送到{qin}营，又由快马送到{xianyang}：" +
          "以公子之命与其归国，换五城，并解围：那五城在{taihang}道上，去年为{qin}" +
          "所取；十日之内若无答复，公子“将因其馆舍中搜出的书信受王廷审问”，此罪当死，" +
          "而书信确有其事。同一个早晨，传来公子已从馆舍移至内城的消息，由守者之长与" +
          "二十名甲士看管。商家的人由同一条路送来第二封信：守者之长愿以六百斤金开" +
          "一道门，本家可从其在{handan}的仓库中出此金，只要{qin}肯为此数作保。在" +
          "{xianyang}，{zhao}的贵人使者与其四十名家众在安全之诺下坐在朝廷的席上。" +
          "将军们说，十日之内攻城之具便到墙下。决定现在落到焦点席位：{qin}是以城邑" +
          "付价、买通守者、劫营，还是扣一个自己的质子？",
        moveMenu: [
          "以土地付{zhao}之价并解围；公子由大路归国",
          "为商家的六百斤金作保，让守者被买通",
          "夜袭关押公子之处，以力把他救出",
          "在{xianyang}扣押{zhao}的使者及其家众为反质：一首抵一首",
          "拒绝任何价钱，加紧围城，让{zhao}在诸侯面前担负公子之血",
          "提议休战交换：以使者及其家众换公子，围城照旧",
          "以镒计的黄金与一城相抵，但不让出道路",
        ],
      },
      {
        index: 4,
        title: "守者之门",
        inject:
          "无论{qin}如何答复，门先开了。第四夜，守者之长收下六百斤金，出自商家自己的" +
          "仓库，公子随商家的人从一道小门出城，天明之前到达{qin}军的阵线；商家的人把他" +
          "交给营中主将，并讨一纸收据。天亮时，{zhao}的朝廷发现公子的住处已经空了。" +
          "王下令拿下公子之妻、{handan}一个豪家之女，及其尚在襁褓的儿子；她的家族把" +
          "母子藏了起来。守者之长与其二十名甲士在市中被腰斩。商家在{handan}的仓库被封，" +
          "其城中之人被扣在市吏的院中。{qin}营中，公子请求西归；主将问朝廷，质子既出，" +
          "围城是否继续；{chu}的救兵传闻已在北上的路上。{zhao}在{xianyang}的使者被" +
          "不加解释地迁往一处较小的宅子。",
        moveMenu: [
          "找到公子之妻与子便杀之，并宣告商家为盗取王之宾客的贼",
          "扣下妻与子为新质，向{qin}为他们开价",
          "遣公子在护送之下西归{xianyang}，并加紧围城",
          "公子既出，立即解围，趁救兵未到西撤",
          "把公子亲笔之信送入城中，以黄金换其妻与子",
          "以本家被封仓库中的粟赎回在{handan}的人",
        ],
      },
      {
        index: 5,
        title: "窃符",
        inject:
          "{handan}城中，民众炊骨易子而食，削木为矛；三千敢死之士在一名传舍吏之子" +
          "率领下出城，把{qin}营逼退三十里。随后，{wei}的一位公子在{ye}窃得兵符，以" +
          "四十斤铁椎击杀持符之将，选兵八万而来；{chu}的救兵随其后到。{qin}军在城下" +
          "溃败，退过{taihang}；其一将被截断，率二万人降于{zhao}。质的分量翻转了。" +
          "{zhao}握有一名{qin}将与二万俘虏，以及在王的担保之下由其家族交出的公子之妻" +
          "与子；{qin}握有在{xianyang}的使者、道路上的城邑，以及公子。老王问是谁丢了" +
          "军队；太子宫中的人则问起公子。{merchant}在{xianyang}有一位公子，在{handan}" +
          "有一座被封的仓库，还有一张无人画押的账单。",
        moveMenu: [
          "像{qin}在{changping}坑杀{zhao}军那样，坑杀这二万人",
          "以降将及其士卒换回使者与道路上的城邑",
          "把公子之妻与子送至{qin}营，附以礼物，不索任何东西",
          "把纵队撤回{taihang}之后，惩处将领，按籍册另征新兵",
          "向{zhao}提议盟约：俘虏归国，使者归国，两国互换质子",
          "扣住使者与城邑，在朝廷哀悼丧师之时什么也不提",
          "向两国朝廷请求释放本家在{handan}的人，以本家对公子的权利相抵",
        ],
      },
      {
        index: 6,
        title: "归国",
        inject:
          "{qin}的老王病重，太子将在一年之内即位，归来的公子凭玉符成为太子的嗣子。" +
          "每一个朝廷现在都在计算质子值了什么、又花了什么：{zhao}握有公子之妻与子、" +
          "一名降将与二万俘虏，以及一道守住了的城墙；{qin}握有使者、道路上的城邑，以及" +
          "一支丧失的军队；商家握有一句共分{qin}国的许诺。每一席位都必须决定它从这场" +
          "危机中带走的态势：关于质子及其家人，什么写进盟约；是否再次交质；商家以什么" +
          "受偿。无论是否有任何东西被封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "护送公子之妻与子至{xianyang}，附以礼物，不索任何东西",
          "两国交质：{zhao}太子入{xianyang}，妻与子归国",
          "扣住妻与子，以换回道路上的城邑",
          "以相邦之印与十万户之封偿付商家",
          "宣告{qin}从此不再送出质子，也不再收受质子",
          "写下一份有具名保人的盟书：质子的家人不得加害",
        ],
      },
    ],
  },
};

export const HOSTAGE_PRINCE = buildChapter(HOSTAGE_PRINCE_TEXT);
