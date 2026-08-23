import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Royal Domain — chapter 6 of the chronicle (307–300 BCE). The royal
 * house, with the tripods and no army, sits on the one road between Qin's
 * pass and the crossing of the River while Qin's army besieges Han's iron
 * town; Qin asks the royal court to lend the road and admit a garrison at
 * the passes, and Han, with the covenant behind it, claims the domain's
 * quarrelling eastern court and the road east of the Luo.
 *
 * Sources (var/lake, `docid:line`): zhanguoce-zh:297 (Qin asks the road
 * through Zhou to attack Han; lend it and offend Han, refuse and offend
 * Qin; the counsel that Han grant Zhou land and Zhou send an envoy to Chu
 * so that Qin doubts it), :276 (Qin's army on the border asking for the
 * nine tripods; Qi's fifty thousand borrowed on a promise of the tripods,
 * ninety thousand men to drag one), :280-281 (Yiyang eight li square, a
 * hundred thousand picked men, grain for years, Han's two hundred thousand
 * on the hills, Chu's general on the mountain who advances once the town
 * falls and is bought with a town and treasure), :285 (the two courts at
 * war, Han saving one of them), :291 (the upstream court withholding water
 * so the downstream court sows wheat), :1843 (Qin's minister entering Zhou
 * with a hundred chariots and an honor guard, Chu's anger), :1864 (Qin
 * summons the lord of Zhou, who pleads Wei's levies south of the River and
 * does not go), :677 (march out of Hangu without attacking, stand over
 * Zhou, and the sacrificial vessels come out), shiji-zh:982 (the king's
 * wish to drive his chariots through the three rivers' country and look
 * upon the royal house; Yiyang taken, sixty thousand heads; the king lifts
 * a tripod, breaks his shin, and dies in the eighth month; the heir a
 * hostage in Yan), :795 (Chu besieging a town of Han; Han levying arms and
 * grain from the eastern court and giving it a town), :801 (the end state:
 * thirty-six towns, thirty thousand souls, the tripods taken),
 * zizhitongjian-zhouqin-zh:558 (the siege of five months, the whole levy
 * sent, the fall), hanshu-zh:2448 (the royal debt to the market). The
 * chapter bends the sources at turn 3: the road, the garrison, and the
 * eastern court's claim arrive in one season before the king's visit, and
 * the royal court's answer is open.
 */
export const ROYAL_DOMAIN_TEXT: ScenarioText = {
  id: "royal-domain",
  simulates:
    "A buffer state between two blocs: a small state with ritual standing and no army is asked by one power to lend the road and host a garrison while the rival bloc claims its other half, and must choose which side to disappoint.",
  chapter: { order: 6, date: "307–300 BCE" },
  decisionPoints: [{ turn: 3, seat: "zhou" }],
  pivots: [
    {
      id: "garrison-term",
      note: "The garrison is asked for the winter (a season with an end) or until the war in the east ends (a term the guest sets); the focal menu's first item writes the term on the royal court's side, and the pair tests whether the seat admits a guest or a fact.",
      en: {
        from: "at the passes for the winter",
        to: "at the passes until the war in the east ends",
      },
      zh: {
        from: "于关隘驻戍一冬",
        to: "于关隘驻戍至东方战事结束",
      },
    },
    {
      id: "road-pass-hold",
      note: "The road is asked for the columns to pass (transit) or to hold (occupation under the name of a loan); the pair tests whether the seat reads the asking or the asker.",
      en: {
        from: "for the columns to pass",
        to: "for the columns to hold",
      },
      zh: {
        from: "供其纵队通过",
        to: "供其纵队据守",
      },
    },
  ],
  en: {
    title: "The Royal Domain",
    summary:
      "{Qin}'s army has sat five months before {yiyang}, the iron town of " +
      "{han} that bars its road east, and the king of {qin} has said aloud " +
      "that he means to drive his chariots through the three rivers' " +
      "country and look upon the royal house before he dies. {zhou}, the " +
      "royal house along {luo}, holds the nine tripods, the calendar, and " +
      "the road between {hangu} and the crossing of {river}; it has no " +
      "army, and its domain has split into a royal court upstream and an " +
      "eastern court downstream that quarrel over water. {Qin} asks the " +
      "royal court to lend the road and admit a garrison at the passes. " +
      "{han}, with {chu}'s host on the hills behind it and the covenant's " +
      "oath in its hand, claims the eastern court's lands and the road " +
      "east of {luo}. Each seat receives injects each turn and issues " +
      "decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: ritual envoys, the calendar sent, the road open under the royal seal",
      "Envoys, petitions, and precedence invoked: protests at the royal gate",
      "Refusal: the road closed, the water held back, grain and levies withheld between the courts",
      "A foreign column on the domain's road under the royal seal, moving through",
      "A foreign garrison at the passes, or the eastern court's towns under a patron's hand",
      "Blood on the road: carts seized, a garrison attacked, the two courts' levies in arms",
      "The domain partitioned between its patrons; the tripods demanded",
      "The royal court stormed, the tripods carried off, the sacrifices ended",
    ],
    seats: [
      {
        id: "zhou",
        name: "{zhou}",
        state: "zhou",
        brief:
          "This chapter opens with {qin}'s army five months before {yiyang}, " +
          "three days' march from the royal gate, and {han}'s levies and " +
          "{chu}'s host on the hills beyond it. Your king is old and owes " +
          "the merchants of his own market; your guard is a few hundred " +
          "men; your domain is thirty-six towns and thirty thousand souls. " +
          "The eastern court, downstream on {luo}, has not sent its envoy " +
          "to the new year's sacrifice and asks instead for the water you " +
          "hold back from its fields. {Qin}'s envoy is on the road with a " +
          "hundred chariots and {han}'s envoy is already in your hall. " +
          "Whichever side you lend the road to, the other will remember " +
          "it; whichever side you refuse, the other will not thank you.",
        objectives: [
          "Keep the tripods, the sacrifices, and the royal precedence in the royal court's hands",
          "Lend or refuse the road on terms that leave the domain standing when the armies go home",
          "Keep the eastern court inside the domain and out of a patron's hand",
          "Avoid becoming the ground on which {qin} and the covenant fight",
        ],
      },
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens with your army five months before {yiyang}: a " +
          "town eight li square, a hundred thousand picked men inside, " +
          "grain for years, and {han}'s chancellor with two hundred " +
          "thousand on the hills behind it. Your king has said he wishes " +
          "to drive his chariots through the three rivers' country and " +
          "look upon the royal house, and would die without regret; your " +
          "chancellor, a guest from the south, staked his place at court " +
          "on the town's fall, and two princes of the blood argue for " +
          "withdrawal. Beyond {yiyang} the road runs through {zhou}'s " +
          "domain to the crossing of {river}, and no army has held it " +
          "without the royal seal. The royal house has no soldiers. It has " +
          "the tripods, and every state that ever reached for them has " +
          "been called a robber by the rest.",
        objectives: [
          "Take {yiyang} and open the road through the domain to the crossing of {river}",
          "Hold the passes of the domain with a garrison of your own, by invitation if possible",
          "Bring the king to the royal temple, to sacrifice and to see the tripods, without uniting the east",
          "Keep {chu}'s host and {han}'s levies from closing on the army's line of retreat",
        ],
      },
      {
        id: "han",
        name: "{han}",
        state: "han",
        brief:
          "This chapter opens with {qin}'s army five months before {yiyang} " +
          "and the covenant's oath in your hand. Your chancellor's army " +
          "stands on the hills; {chu}'s general stands on the mountain to " +
          "the south with {chu}'s host, sworn by covenant to save the town, " +
          "and has not moved. {wei}'s levies are promised and not seen. " +
          "The eastern court of {zhou}, downstream on {luo}, has asked for " +
          "your protection against its own royal court, and its towns and " +
          "its stretch of the road are the one ground from which {qin} " +
          "could be kept out of the three rivers' country if {yiyang} " +
          "falls. Your envoy sits in the royal hall beside {qin}'s. You " +
          "cannot win a battle before {yiyang}; you may win the road " +
          "behind it.",
        objectives: [
          "Hold {yiyang}, or recover it, and keep {qin} west of the three rivers",
          "Deny {qin} the road through the domain and any garrison at its passes",
          "Take the eastern court's towns and the road east of {luo} under {han}'s hand, at its own request",
          "Keep {chu} and {wei} in the covenant and moving before the town falls",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Hundred Chariots",
        inject:
          "{Qin}'s envoy, a prince of its blood, enters the domain with a " +
          "hundred chariots, and the royal court, which cannot refuse him " +
          "the road, receives him at the gate with an honor guard of a " +
          "hundred and every form of precedence. In the royal hall he asks " +
          "three things in his king's name: the road through the domain " +
          "for the columns and the grain carts going to {yiyang}, a store " +
          "of grain from the royal granary at a price to be named later, " +
          "and the opening of the ancestral temple so that the king of " +
          "{qin}, when he comes, may sacrifice and view the tripods. " +
          "{han}'s envoy, who watched the honor guard from the steps, asks " +
          "the same evening why the royal court guards a robber's envoy " +
          "with the king's own men. {chu}'s general on the mountain sends " +
          "word that a domain which lends its road to {qin} has left the " +
          "covenant. The eastern court sends no envoy at all.",
        moveMenu: [
          "Lend the road for the carts and refuse the granary and the temple",
          "Receive the envoy with every form and answer nothing in writing",
          "Send a ritual envoy to {han}'s camp and to {chu}'s general on the same day",
          "Move the columns to the domain's western gate and let the envoy's chariots be counted",
          "Send gold and a letter to the eastern court's lord, offering protection",
          "Levy grain and carts from the eastern court for the relief of {yiyang}",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Water and the Wheat",
        inject:
          "The eastern court, downstream on {luo}, has sown wheat because " +
          "the royal court will not let the water down for rice, and its " +
          "lord now writes to {han} rather than to the king: he offers his " +
          "towns and his stretch of the road to {han}'s protection and " +
          "asks for a town in return. {han}'s envoy in the royal hall says " +
          "that {han} will keep the peace between the two courts by taking " +
          "the eastern court's towns under its hand, as the covenant's " +
          "warden, until {qin}'s army is gone. Before {yiyang}, the king " +
          "of {qin} overrules the princes who asked for withdrawal, reminds " +
          "his chancellor of the oath the two of them swore before the " +
          "campaign, and sends the whole levy east; the grain carts back " +
          "up at {hangu} three days deep, waiting on the royal court's " +
          "word. {chu}'s general has not moved. The royal ministers say " +
          "that the water, once let down, can be taken again.",
        moveMenu: [
          "Let the water down and summon the eastern court's lord to the new year's sacrifice",
          "Hold the water back and strike the eastern court's lord from the royal roll",
          "Accept the eastern court's offer and send {han}'s levies into its towns",
          "Refuse the eastern court's offer and hold the covenant to saving {yiyang}",
          "Open {hangu} and send the carts through the domain without waiting for the royal word",
          "Offer the royal court gold for the grain and a town for the road",
          "Send a great envoy to {chu}'s general with treasure, to move him or to keep him still",
        ],
      },
      {
        index: 3,
        title: "The Road and the Garrison",
        inject:
          "{yiyang} falls in the fifth month of the siege: the whole levy " +
          "of {qin} takes it by storm, and sixty thousand heads are " +
          "counted. {han}'s chancellor sends an envoy to {qin}'s camp to " +
          "ask for peace; {chu}'s general, who never came down from the " +
          "mountain, now moves his host toward the fallen town to sell " +
          "his neutrality to whichever side pays. {Qin}'s army stands on " +
          "the domain's western border, and its envoy delivers his king's " +
          "terms in open court: the road through the domain is asked for " +
          "the columns to pass, from {hangu} to the crossing of {river}, " +
          "and a garrison of {qin} is to be admitted at the passes for the " +
          "winter, fed from the royal granary and paid in {qin}'s coin; " +
          "the king of {qin} will come in person to the ancestral temple. " +
          "{han}'s envoy answers the same day: {han} will take the eastern " +
          "court's towns and the road east of {luo} into its own hand as " +
          "the covenant's ground, will guarantee the royal court's " +
          "precedence and the tripods, and will count a garrison of {qin} " +
          "in the domain as war upon the covenant. The royal guard is a " +
          "few hundred. The decision now falls to the focal seat: does the " +
          "royal court lend the road and admit the garrison, refuse both, " +
          "or hand the eastern court to {han}?",
        moveMenu: [
          "Lend the road and admit the garrison on terms: the royal seal on its gates, its grain paid in gold, its term written",
          "Refuse both: close the gates, hold the passes with the royal guard, and send the calendar to every court",
          "Hand the eastern court's towns and the road east of {luo} to {han}, and ask the covenant's guarantee for the tripods",
          "Lend the road and refuse the garrison; offer the king of {qin} his sacrifice at the temple",
          "Ask {han} for a grant of towns and send a great envoy to {chu}, so that {qin} doubts the domain and does not use it",
          "Promise the tripods to {qi} for an army of fifty thousand, and find the road for the tripods impassable afterward",
          "Send the royal envoy to both camps with the forms of precedence and promise each what it has asked",
        ],
      },
      {
        index: 4,
        title: "The Tripod",
        inject:
          "Whatever {zhou} answered, the king of {qin} comes. He enters the " +
          "domain in the eighth month with his guard and his strongmen, by " +
          "the lent road or past the closed gates, and is received at the " +
          "ancestral temple because no one can stop him from being " +
          "received. He views the nine tripods. He and his strongest man " +
          "lift one between them for the assembled ranks to see; his shin " +
          "breaks under it, and he dies in the temple precinct before the " +
          "month is out. The strongman's house is put to death. The king " +
          "has no son; his half-brother, the nearest heir, is a hostage at " +
          "{yan}, and the court at {xianyang} divides between the dead " +
          "king's ministers and the mother of the hostage. The army of " +
          "{qin} in the three rivers' country has a body to carry home and " +
          "a long road. {chu}'s general comes down from the hills at last; " +
          "{han}'s chancellor sends him treasure to keep coming. The " +
          "eastern court's lord breaks the royal sluice and lets the water " +
          "down himself.",
        moveMenu: [
          "Escort the king's body west and hold the road with the columns already on it",
          "Withdraw every column to {yiyang} and leave the domain to the covenant",
          "Strike the grain carts on the road while the army has no king",
          "Send {chu}'s general treasure and a town to come on, and march beside him",
          "Close the royal gates, mourn the king of {qin} with full rites, and ask every court for a mourning envoy",
          "Proclaim the death an omen against any hand laid on the tripods",
          "Offer the new court at {xianyang} the sacrifice its dead king came for, in exchange for the columns leaving",
        ],
      },
      {
        index: 5,
        title: "The Summons",
        inject:
          "Six years have passed. At {xianyang} a dowager regent rules for " +
          "the hostage brought home from {yan} and crowned; she has taken " +
          "back the town across {river} that {qin} gave {han} for peace " +
          "after the king's death, and her envoy summons the royal lord to " +
          "{xianyang} in person, 'to renew the friendship of the two " +
          "houses,' naming a month. The covenant is broken: {chu}, whose " +
          "general stood on the mountain, now besieges a town of {han} in " +
          "the south, and {han}'s chancellor levies arms and grain from " +
          "the eastern court for the siege and offers it a town in return, " +
          "so that the eastern court leans on {han} and {qin} closes its " +
          "envoys to it. The royal lord does not wish to go and cannot say " +
          "so. A persuader at the royal court says that if {wei} moved " +
          "levies to the south of {river}, the lord could plead them and " +
          "stay home, and that {qin} would not cross the river to strike " +
          "{wei} while the lord stayed out of its hands.",
        moveMenu: [
          "Go to {xianyang} in person with the calendar and a gift of the temple's vessels",
          "Ask {wei} to move levies south of {river} and plead them as the reason not to go",
          "Send the royal heir to {xianyang} in the lord's place as a hostage",
          "Let the water down, grant the eastern court's lord a town, and bind the two courts under one seal again",
          "Levy arms and grain from the eastern court for the siege and give it a town",
          "Send the army into the domain to bring the royal lord west, now that no covenant stands",
          "Offer {han} peace for the southern town in exchange for the eastern court's road",
        ],
      },
      {
        index: 6,
        title: "The Calendar",
        inject:
          "The new year's calendar goes out from the royal temple as it has " +
          "for thirty generations, and every court decides whether to " +
          "receive it, whether to send the ritual envoy, and what it " +
          "writes about the domain in its own records. Each seat must " +
          "decide the posture it carries out of the crisis: whether the " +
          "road is a custom or a covenant, whether the garrison is a guest " +
          "or a fact, whether the two courts are one domain or two " +
          "patrons' ground, and where the tripods stand. The chroniclers " +
          "will write down this turn as the settlement, whether or not " +
          "anything is sealed.",
        moveMenu: [
          "Receive the calendar and send the ritual envoy as before",
          "Write the road and the garrison into a covenant between {qin} and the royal house",
          "Bind the two courts under one seal and one sluice",
          "Take the keeping of the tripods into a patron's city",
          "Keep the garrison and the levies where they stand and call it custom",
        ],
      },
    ],
  },
  zh: {
    title: "王畿",
    summary:
      "{qin}的军队围{yiyang}已五月。{yiyang}是{han}的铁邑，扼住{qin}东出之路；" +
      "{qin}王曾公开说，愿容车通三川、窥王室，死而无憾。{zhou}是{luo}沿岸的" +
      "王室，握有九鼎、历法，以及{hangu}与{river}渡口之间的道路；它没有军队，其封域" +
      "已分裂为上游的王室之宫与下游的东宫，两宫为水相争。{qin}请王室借道，并于关隘" +
      "驻戍。{han}身后有{chu}之众列于山上，手握合纵的盟书，声称东宫之地与{luo}以东" +
      "之路归它。每一席位每回合收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：礼使往来，颁历如常，道路在王玺之下通行",
      "使者、上书与援引礼之先后：在王门之前抗议",
      "抗拒：闭道、截水，两宫之间不出粟与兵",
      "外国纵队持王玺过境，穿行而过",
      "外国戍卒据关隘，或东宫诸邑落入一方庇主之手",
      "道上见血：粮车被夺、戍卒被袭、两宫之兵各自持械",
      "封域被两方庇主瓜分；九鼎被索",
      "王庭被攻破，九鼎被运走，祭祀断绝",
    ],
    seats: [
      {
        id: "zhou",
        name: "{zhou}",
        state: "zhou",
        brief:
          "本章开始时，{qin}的军队围{yiyang}已五月，离王门只有三舍之程；{han}的" +
          "兵员与{chu}之众列于更远的山上。你们的王年老，并欠着本国市中商贾的债；" +
          "你们的卫士只有数百人；你们的封域是三十六邑、三万口。{luo}下游的东宫没有" +
          "遣使来参加新年之祭，却请求你们放下所截之水以灌其田。{qin}的使者正带着" +
          "百乘车马在路上，{han}的使者已在你们的殿中。借道于一方，另一方必记恨；" +
          "拒绝一方，另一方也不会感激。",
        objectives: [
          "把九鼎、祭祀与王室的先后之礼保在王室手中",
          "借道或拒道，其条件须使诸军归国之后封域依然存在",
          "使东宫留在封域之内，不落入庇主之手",
          "避免成为{qin}与合纵诸国交战之地",
        ],
      },
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时，你们的军队围{yiyang}已五月：城方八里，城中材士十万，粟支" +
          "数年，{han}的相邦率二十万之众列于其后的山上。你们的王曾说，愿容车通" +
          "三川、窥王室，虽死无憾；你们的相邦是来自南方的客卿，把自己在朝中的地位" +
          "押在此城的陷落上，而两位宗室公子主张罢兵。{yiyang}之外，道路穿过{zhou}的" +
          "封域通向{river}渡口，从没有一支军队不持王玺而能据有它。王室没有士卒。" +
          "它有九鼎，而每一个伸手取鼎的国家都被其余诸国称为盗。",
        objectives: [
          "攻下{yiyang}，打通穿过封域直达{river}渡口的道路",
          "以本国戍卒据守封域的关隘，能得邀请则最好",
          "使王亲至王室宗庙，行祭礼并观九鼎，而不使山东合一",
          "不让{chu}之众与{han}的兵员合围军队的退路",
        ],
      },
      {
        id: "han",
        name: "{han}",
        state: "han",
        brief:
          "本章开始时，{qin}的军队围{yiyang}已五月，合纵的盟书在你们手中。你们" +
          "相邦的军队列于山上；{chu}的将军率{chu}之众列于南面的山上，依盟约当救" +
          "此城，却未曾移动。{wei}的兵员许诺了而未见到。{luo}下游{zhou}的东宫，已" +
          "请求你们保护它免受本国王室之害；它的城邑与它那一段道路，是{yiyang}若陷" +
          "之后唯一能把{qin}挡在三川之外的地方。你们的使者坐在王殿之中，与{qin}的" +
          "使者并列。你们不能在{yiyang}城下赢得一战；你们或许能赢得它身后的道路。",
        objectives: [
          "守住{yiyang}，或收复它，使{qin}不得东出三川",
          "不让{qin}借道穿过封域，不让它在关隘驻戍",
          "应东宫自己之请，把东宫诸邑与{luo}以东之路收归{han}之手",
          "在城陷之前使{chu}与{wei}留在合纵之内并出兵",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "百乘",
        inject:
          "{qin}的使者，一位宗室公子，率百乘车马进入封域；王室不能拒绝他借道，便以" +
          "百人之卒在门前迎接，礼之先后无一不备。在王殿之中，他以其王之名请求三事：" +
          "为开往{yiyang}的纵队与粮车借道穿过封域；从王室粮仓取粟，价钱日后再定；" +
          "开启宗庙，以便{qin}王到来时行祭礼并观九鼎。{han}的使者在阶下看着那支" +
          "仪卫，当晚便问：王室为何以王之卫士护卫一个盗贼的使者？山上的{chu}将军" +
          "传话说，把道路借给{qin}的封域，已经离开了合纵。东宫根本没有遣使。",
        moveMenu: [
          "为粮车借道，拒绝粮仓与宗庙之请",
          "以全礼接待使者，不以文字答复任何一事",
          "同一天向{han}的军营与{chu}的将军各遣礼使",
          "把纵队调到封域的西门，让使者的车乘被人点数",
          "向东宫之君送去黄金与一封信，许以保护",
          "为救{yiyang}，向东宫征粟与车",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "水与麦",
        inject:
          "{luo}下游的东宫因王室不肯放水种稻而改种了麦，其君如今写信给{han}而不写" +
          "给王：他把自己的城邑与那一段道路献于{han}的保护之下，并求一邑为报。{han}" +
          "在王殿中的使者说，{han}将以合纵守者的身份把东宫诸邑收于己手，以此保持" +
          "两宫之间的和平，直到{qin}军离去。在{yiyang}城下，{qin}王驳回了请求罢兵" +
          "的公子们，提醒相邦出征之前二人所立之誓，尽发全国之兵东进；粮车在{hangu}" +
          "排了三日之程，等候王室的一句话。{chu}的将军没有移动。王室的大臣说，水放" +
          "下去之后，还可以再夺回来。",
        moveMenu: [
          "放水，并召东宫之君来参加新年之祭",
          "截水不放，把东宫之君从王室谱籍上削去",
          "接受东宫所献，派{han}的兵员进入其城邑",
          "拒绝东宫所献，要求合纵诸国履约救{yiyang}",
          "不等王室答复，开{hangu}，令粮车穿过封域",
          "以黄金向王室买粟，以一邑换道路",
          "遣重使带着宝物去见{chu}的将军，或使他动，或使他不动",
        ],
      },
      {
        index: 3,
        title: "借道与驻戍",
        inject:
          "围城第五个月，{yiyang}陷落：{qin}尽发之兵强攻而入，斩首六万。{han}的相邦" +
          "遣使入{qin}军请和；始终没有下山的{chu}将军，此时率其众向陷落之城移动，" +
          "要把他的中立卖给出价的一方。{qin}的军队立于封域的西境，其使者在朝堂上" +
          "当众宣布其王的条件：请借穿过封域之道，供其纵队通过，自{hangu}直至{river}" +
          "渡口；请准{qin}的戍卒于关隘驻戍一冬，由王室粮仓供粮，以{qin}之币付值；" +
          "{qin}王将亲至宗庙。{han}的使者当天答复：{han}将把东宫诸邑与{luo}以东之路" +
          "收入己手，作为合纵之地，保证王室的先后之礼与九鼎，并把{qin}在封域驻戍" +
          "视为对合纵开战。王室的卫士只有数百人。决定现在落到焦点席位：王室是借道" +
          "并接纳戍卒，两者皆拒，还是把东宫交给{han}？",
        moveMenu: [
          "有条件地借道并接纳戍卒：戍门用王玺，其粮以黄金付值，其期限写明",
          "两者皆拒：闭门，以王室卫士据守关隘，向各国颁历",
          "把东宫诸邑与{luo}以东之路交给{han}，请合纵诸国保证九鼎",
          "借道而拒戍；许{qin}王在宗庙行祭礼",
          "向{han}求一片城邑，并遣重使往{chu}，使{qin}疑封域而不用之",
          "以九鼎许{qi}换五万之师，事后再说运鼎之路不可通",
          "以礼之先后为名向两军各遣王使，对双方各许其所求",
        ],
      },
      {
        index: 4,
        title: "举鼎",
        inject:
          "无论{zhou}如何答复，{qin}王都来了。八月，他带着卫士与力士进入封域，或经" +
          "借得之道，或越过闭起之门，在宗庙被接待，因为没有人能阻止他被接待。他观" +
          "九鼎。他与最强的力士二人当着列爵举起一鼎；他的胫骨在鼎下折断，月未尽便" +
          "死于庙庭。那力士被灭族。王无子；最近的嗣君是他的异母弟，正质于{yan}，" +
          "{xianyang}的朝廷分成两派：先王的大臣，与质子之母。{qin}在三川之军有一具" +
          "尸身要运回去，路却很长。{chu}的将军终于下山；{han}的相邦送去宝物让他" +
          "继续前进。东宫之君自己决开王室的水闸，把水放了下去。",
        moveMenu: [
          "护送王之尸身西归，以已在路上的纵队据守道路",
          "把每一支纵队撤回{yiyang}，把封域留给合纵诸国",
          "趁其军无王，袭击道上的粮车",
          "送{chu}的将军宝物与一邑令其前进，并与他并肩进军",
          "闭王门，以全礼为{qin}王服丧，请各国遣使吊唁",
          "宣告此死是对任何染指九鼎者的凶兆",
          "向{xianyang}的新朝廷献上其先王所求之祭礼，以换取纵队离去",
        ],
      },
      {
        index: 5,
        title: "召命",
        inject:
          "六年过去了。{xianyang}由一位太后摄政，为从{yan}迎回即位的质子执政；她收回" +
          "了{qin}在先王死后为求和而给{han}的{river}对岸之邑，她的使者召王室之君亲赴" +
          "{xianyang}，“以重修两家之好”，并指定了月份。合纵已破：将军曾列于山上的" +
          "{chu}，如今在南方围攻{han}的一座城邑，{han}的相邦为此围城向东宫征兵征粟，" +
          "并许以一邑为报，使东宫倚靠{han}，而{qin}对它闭绝使者。王室之君不愿去，" +
          "又不能说不愿去。王室的一位说客说，若{wei}把兵员调到{river}以南，君便可以" +
          "此为辞留在家中，而{qin}不会在君未入其手之时渡河击{wei}。",
        moveMenu: [
          "携历法与宗庙之器为礼，亲赴{xianyang}",
          "请{wei}把兵员调到{river}以南，以此为不去之辞",
          "遣王室太子代君赴{xianyang}为质",
          "放水并赐东宫之君一邑，把两宫重新合于一玺之下",
          "为围城向东宫征兵征粟，并给它一邑",
          "既然已无盟约，派军入封域，把王室之君带往西方",
          "以南方之邑的和议换取{han}手中东宫的道路",
        ],
      },
      {
        index: 6,
        title: "颁历",
        inject:
          "新年之历从王室宗庙颁出，三十代以来一直如此，每一个朝廷都要决定是否接受它，" +
          "是否派遣礼使，以及在本国的记载中如何书写封域。每一席位都必须决定它从这场" +
          "危机中带走的态势：道路是惯例还是盟约，戍卒是宾客还是既成之事，两宫是一个" +
          "封域还是两个庇主之地，九鼎立于何处。无论是否有任何东西被封印，史官都会把" +
          "这一回合记为和解。",
        moveMenu: [
          "接受历法，如往年一样派遣礼使",
          "把道路与戍卒写进{qin}与王室之间的盟约",
          "把两宫合于一玺一闸之下",
          "把九鼎的保管移入庇主之城",
          "让戍卒与征发维持原状，称之为惯例",
        ],
      },
    ],
  },
};

export const ROYAL_DOMAIN = buildChapter(ROYAL_DOMAIN_TEXT);
