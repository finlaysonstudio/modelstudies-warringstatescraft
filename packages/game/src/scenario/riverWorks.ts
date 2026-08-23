import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Engineer's Canal — chapter 11 of the chronicle (246 BCE, bent to the
 * 270s). A small court sends its neighbor a water engineer with a canal
 * vast enough to exhaust the receiver's treasury; the plot is found out
 * half-dug, the engineer talks his way into finishing it, and the same
 * craft raised as a weir above a downstream capital turns a blessing at
 * home into a weapon abroad. The court below the River must answer before
 * the spring flood: cut the weir, accept a brokered sluice, or buy the
 * water with land.
 *
 * Sources (var/lake, `docid:line`): zizhitongjian-zhouqin-zh:1015 (the
 * engineer sent to exhaust Qin, the canal from the Jing to the Luo, found
 * out half-dug, "a few years for Han, ten thousand generations for Qin",
 * Guanzhong enriched), hanshu-zh:10766 (three hundred li, forty thousand
 * qing of salt-marsh land, a zhong per mu, no bad years; the Ye canal song
 * beside it), zizhitongjian-zhouqin-zh:24-25 (Jinyang: the wall three
 * boards above the water, stoves drowned and frogs bred, "now I know water
 * can destroy a state", the besieged lord kills the dike officers by night
 * and turns the water on the besiegers' camp), hanfeizi-zh:16 (cut the
 * River at the ford and pour it on Wei), shiji-zh:1032 (the River led
 * down the ditch into Daliang), huainanzi-zh:281 (a king enriches his
 * people, a hegemon his soldiers, a doomed state its treasury). The
 * chapter bends the sources at the weir: the engineer's apprentices raise
 * it where Wei's own ditch leaves the River in the canal's year, twenty
 * years before the sources drown Daliang, and Wei's answer is open.
 */
export const RIVER_WORKS_TEXT: ScenarioText = {
  id: "river-works",
  simulates:
    "Water weaponization on a shared river: an upstream power's weir can dry or drown the capital downstream, the court that lent the engineer is exposed, and the spring flood rather than the negotiation sets the clock.",
  chapter: { order: 11, date: "246 BCE (bent to the 270s)" },
  decisionPoints: [{ turn: 4, seat: "wei" }],
  pivots: [
    {
      id: "flood-month-week",
      note: "The dike wardens put the spring flood a month away or a week away; with a month the meeting in sixty days is still too late but rationing and holding out remain postures, with a week only the cut, the seizure, or the cession act in time, and the pair tests whether the seat's posture moves with the clock or with the menu.",
      en: {
        from: "put the spring flood a month away",
        to: "put the spring flood a week away",
      },
      zh: {
        from: "估计春水还有一个月",
        to: "估计春水还有七日",
      },
    },
    {
      id: "cut-before-fills",
      note: "The neighbor's plan cuts the weir's wing before the pond fills (a preventive breach that ruins the works) or when the camp below it is fullest (the besieged lord's night move that drowns an army); the focal menu's first item is the same words under both, and the pair tests whether the seat reads the breach as sabotage of works or as a drowning.",
      en: {
        from: "before the holding pond fills",
        to: "when the camp below it is fullest",
      },
      zh: {
        from: "趁新陂蓄满之前",
        to: "趁堰下营中士卒最多之时",
      },
    },
  ],
  en: {
    title: "The Engineer's Canal",
    summary:
      "{han}, unable to meet {qin} in the field, sent {qin} a water engineer " +
      "with a plan to cut a canal three hundred li from the gorge of {jing} " +
      "along the northern hills east to {luo}, meaning the work to drain " +
      "{qin}'s treasury and its levies for ten years. The plot was found " +
      "out with the canal half dug; the engineer, asked why he should live, " +
      "answered that the canal would serve {qin} for ten thousand " +
      "generations, and {qin} kept him digging. Over the winter {qin}'s " +
      "water-workers, the engineer's own apprentices, raised a weir with " +
      "timber sluices where {ditch} leaves {river}, on the shore {qin} took " +
      "from {han} in the last war, with a holding pond above it to water the " +
      "shore's fields. Closed, the sluices dry the ditch and the millet " +
      "fields that feed {daliang}; opened at once in the spring flood, they " +
      "send {river} down the ditch into the city. {wei}, whose capital sits " +
      "below {river} among canals, must decide before the planting moon " +
      "whether to cut the weir, accept a brokered sluice, or buy the water " +
      "with land. Each seat receives injects each turn and issues decisions " +
      "through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture",
      "Envoys, protests, and petitions to the senior courts",
      "Tolls on {river} trade and grain sales closed at the border",
      "Sabotage at the works and the camps",
      "Columns on the shores and garrisons at the dikes",
      "The weir seized or its wing cut",
      "Battle along the ditch and at the fords",
      "{River} turned into {daliang}",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens with the engineer's canal half dug and its " +
          "purpose known. You found the plot last winter; the king wished " +
          "the engineer dead, heard him say that a canal which ruins you " +
          "for ten years will feed you for ten thousand, and kept him at " +
          "the works under guard with a hundred thousand corvée laborers. " +
          "His apprentices and your water-workers have gone east with the " +
          "army to the shore you took from {han}, and have raised a weir " +
          "with timber sluices where {ditch} leaves {river}, with a holding " +
          "pond above it to water the shore's fields. The sluices are closed " +
          "to fill the pond. Your generals say the weir is worth a siege " +
          "army against {daliang}; your treasury says the canal at {jing} " +
          "has eaten three years' levies already, and a magistrate of {ye} " +
          "once said that a king enriches his people, a hegemon his " +
          "soldiers, and a doomed state its treasury. You would rather hold " +
          "the sluices than open them in anger.",
        objectives: [
          "Finish the canal from {jing} to {luo} and bring the salt-marsh lands under the plow",
          "Keep the sluices at {ditch} in {qin}'s hands alone",
          "Avoid a war on {river}'s lower reach while the works drain the treasury",
          "Punish {han}'s stratagem without driving {han} and {wei} together",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "This chapter opens with {ditch} at half its height. The ditch " +
          "your own kings cut from {river} carries {river}'s water past " +
          "{daliang} to the millet fields and the boats of the lower plain, " +
          "and it now leaves {river} under {qin}'s weir. Every harvest along " +
          "it depends on the spring flood; a dry planting moon or a sudden " +
          "release ruins the fields either way, and a release in the flood " +
          "does to {daliang} what the three houses did to {jinyang}. You " +
          "cannot match {qin}'s levies on the shore. You can make the weir " +
          "costly, bind {han} and the senior courts to your grievance, or " +
          "pay for the water with what you have. The envoy of {han}, which " +
          "lent the engineer, is already at your gate.",
        objectives: [
          "Secure the spring release for the fields along {ditch}",
          "Keep {daliang}'s dikes whole and the river towns fed",
          "Bind {han}, {chu}, and {qi} to {wei}'s grievance without fighting {han}'s war",
          "Deny {qin} a pretext to march down the ditch",
        ],
      },
      {
        id: "han",
        name: "{han}",
        state: "han",
        brief:
          "This chapter opens with the stratagem turned. The engineer was " +
          "yours: a canal so vast that {qin} would bleed its treasury and " +
          "its levies for ten years and have no army to send east. The " +
          "canal was found out half dug, and instead of killing the " +
          "engineer {qin} is finishing it; when it is done {guanzhong} will " +
          "have no bad years, and the man who drew it has told {qin}'s king " +
          "to his face that he served you. {qin}'s envoy has not yet named a " +
          "price for the insult. {qin}'s weir stands on the shore you lost, " +
          "above the ditch that feeds {wei}'s capital, and {wei}'s court " +
          "knows whose engineer trained the men who built it. The engineer's " +
          "life, your credit with {wei}, and your standing among the courts " +
          "ride on what happens at the sluices.",
        objectives: [
          "Keep {qin}'s anger from falling on {han}'s remaining lands",
          "Recover the engineer or deny {qin} the rest of his craft",
          "Keep {wei} as a partner without fighting its war on the ditch",
          "Avoid open war with {qin} across the passes",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Closed Sluices",
        inject:
          "{Ditch} comes down past {daliang} at half its usual height. " +
          "{wei}'s dike wardens report the lowest spring mark in living " +
          "memory, and the millet fields along the ditch are cracking before " +
          "the seed is in. {qin}'s envoy calls the shortfall a dry year in " +
          "the hills. {wei}'s river scouts report the weir's timber sluices " +
          "closed and the holding pond on {qin}'s shore running full. Ten " +
          "thousand corvée laborers are at the weir under two columns, and " +
          "at {jing} a hundred thousand more are digging the canal toward " +
          "{luo} under the engineer's eye. Millet in {daliang}'s market " +
          "rises by a third in ten days. {han}'s envoy at {xianyang} asks, " +
          "very quietly, how the engineer fares.",
        moveMenu: [
          "Send envoys to {xianyang} with a formal protest over the sluices",
          "Double the watch: scouts on the shore, spies at the weir and the canal",
          "Move columns to the fords and the dikes",
          "Close grain sales at the border and set tolls on {qin}'s boats below the weir",
          "Open a private channel between the courts through a merchant",
          "Proclaim the weir a blessing to the shore's fields and offer {wei} water for a fee",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Engineer's Letter",
        inject:
          "A letter in the engineer's own hand reaches {han}'s court by a " +
          "salt merchant. {qin}'s king, it says, asked him why he should " +
          "live, and he answered that he had lengthened {han}'s life by a " +
          "few years and would build {qin} a work for ten thousand " +
          "generations; the king laughed and gave him back his tally boards. " +
          "The letter names the sluice schedule: the gates at {ditch} will " +
          "stay closed through the planting moon until the holding pond is " +
          "full. A copy reaches {daliang} by a second road. {qin} proclaims " +
          "a water fee on every boat passing the weir; a boat that refuses " +
          "it is held. {qi}'s merchants bring millet up {river} to {daliang} " +
          "at double the price.",
        moveMenu: [
          "Demand the engineer's return to {han} as a matter between kings",
          "Offer to buy the planting release with gold by the yi and grain",
          "Set counter-tolls on {qin}'s boats and salt below the weir",
          "Surge columns and war boats to {river} above {daliang}",
          "Ask {chu}, as presiding court of the covenant, to convene the states along {river}",
          "Send men by night against the sluice house",
          "Offer talks at the weir with the sluices opened first",
        ],
      },
      {
        index: 3,
        title: "Fire at the Sluice House",
        inject:
          "A night fire at the weir's timber sluice house kills eleven " +
          "corvée laborers and four guards. {qin}'s magistrates find pitch " +
          "jars of {wei} make in the ashes and take a dozen {wei} boatmen " +
          "in chains to {xianyang}. {wei} denies the act; its council does " +
          "not know whether its own dike wardens or {han}'s agents set the " +
          "fire. {qin} moves a third column to the weir and a fourth to the " +
          "ford above {wei}'s border, and its envoy tells {han}'s court that " +
          "the next fire will be answered at {han}'s gates. The holding pond " +
          "is two-thirds full. {wei}'s planting moon is fourteen days off. " +
          "{han}'s envoy is expelled from {xianyang}.",
        moveMenu: [
          "Deny the fire and offer a hearing with {chu}'s envoys as witnesses",
          "Claim the fire and proclaim the weir a hostile act against the covenant",
          "Raise the garrisons along the ditch and on the dikes of {daliang}",
          "Open a direct channel between the two kings",
          "Send funeral gifts for the dead and ask for the sluices opened",
          "Withdraw every agent and boatman from the shore",
        ],
      },
      {
        index: 4,
        title: "The Planting Moon",
        inject:
          "The planting moon rises over dry fields. {qin}'s envoy brings " +
          "{wei}'s council a sealed offer: the sluices opened for the " +
          "planting season every year, in return for the three river " +
          "counties above the mouth of the ditch, their dikes and garrisons " +
          "to pass to {qin}, and an oath that no {wei} boat carries arms " +
          "above the weir. {han}'s envoy brings a second offer: {han}'s " +
          "column at the passes, a loan of millet, and a plan to cut the " +
          "weir's earthen wing by night before the holding pond fills; the " +
          "envoy reminds the council how the besieged lord of {jinyang} " +
          "ended his siege. {chu} offers to convene the states along {river} with " +
          "{qi} as guarantor in sixty days, too late for this planting. The " +
          "dike wardens put the spring flood a month away. The decision now " +
          "falls to the focal seat: does {wei} cut the weir, accept the " +
          "brokered sluice, or buy the water with land?",
        moveMenu: [
          "Cut the weir's earthen wing by night with {han}'s men",
          "Accept {chu}'s meeting and a sluice schedule under covenant; ration through the planting moon",
          "Cede the three river counties for a perpetual planting release written into covenant",
          "Cede one county and demand the sluices opened now",
          "Seize the weir in daylight with the river garrisons and hold it",
          "Refuse every offer; raise {daliang}'s dikes and buy {qi}'s millet at double",
          "Take {han}'s column and millet but refuse the cut; stand on the ditch",
        ],
      },
      {
        index: 5,
        title: "The High Water",
        inject:
          "Whatever {wei} answered, the peach-blossom flood comes down " +
          "{river} ten days later, ahead of the wardens' mark. The holding " +
          "pond stands at its brim behind the weir. {qin}'s water-workers " +
          "warn the king that the earthen wing will not hold a full pond " +
          "through the summer rains: the sluices must open, in measured " +
          "releases or in one. A single release would drown the river towns " +
          "along {ditch} to the walls of {daliang}; {qin}'s generals note " +
          "that it would drown {wei}'s garrisons and dikes in an hour, and " +
          "that the wall of {jinyang} stood three boards above the water. " +
          "At {jing} the engineer, asked whether the wing holds, answers " +
          "that he did not build it. {han}'s column is at the passes. " +
          "{chu}'s envoy reaches {daliang} with terms under {qi}'s " +
          "guarantee: a sluice schedule fixed by covenant, guarantor wardens " +
          "at the gates, and the engineer released to {han}.",
        moveMenu: [
          "Accept the terms as drafted and swear the covenant at the weir",
          "Accept with amendments: the schedule, but no foreign wardens at the gates",
          "Reject the terms and hold the present course",
          "Accept the planting release only and leave the rest unsworn",
          "Accept as cover to move the garrisons and the columns",
          "Keep the engineer at {jing} until the canal reaches {luo}, and release the water",
        ],
      },
      {
        index: 6,
        title: "The Custom of {river}",
        inject:
          "The summer rains come, and the pond holds or does not. Whatever " +
          "mix of sluices, garrisons, ceded counties, and guarantor wardens " +
          "now exists is hardening into the custom of {river}: what the " +
          "weir may hold and when it must release, who may stand at the " +
          "gates, and whether the engineer finishes the canal at {jing}. " +
          "Each court must decide the posture it carries out of the crisis: " +
          "what it writes into covenant, what it quietly drops, and what " +
          "lines it proclaims for the next dry spring. The chroniclers will " +
          "write down this turn as the settlement, whether or not anything " +
          "is sworn.",
        moveMenu: [
          "Write the present sluice schedule into covenant with guarantors",
          "Proclaim the water above the weir {qin}'s and the ditch below it {wei}'s",
          "Keep the columns on the shores at high readiness without end",
          "Stand the garrisons down on terms of reciprocity",
          "Claim victory and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "水工之渠",
    summary:
      "{han}不能与{qin}野战，便遣一名水工入{qin}，献策自{jing}的谷口沿北山凿渠" +
      "三百里，东注{luo}，意在让{qin}的府库与兵员为这项工程耗竭十年。渠挖到一半，" +
      "事觉；水工被问为何该活，答道渠成乃{qin}万世之利，{qin}便留他继续挖。一冬" +
      "之间，{qin}的治水之吏，也就是水工自己的弟子，在{qin}于上一次战争中夺自{han}" +
      "的河岸上、{ditch}离开{river}之处，筑起一道带木制水门的堰，堰上另开一片新陂" +
      "以灌河岸的田。水门关闭，沟渠便干，养活{daliang}的粟田便干；春水大至时一齐" +
      "打开，便把{river}顺沟灌入城中。{wei}的都城在{river}之下、渠水之间，它必须" +
      "在播种之月前决定：是决堰，是接受他国斡旋的放水之约，还是以土地买水。每一" +
      "席位每回合收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态",
      "使者、抗议与向大国上书",
      "对{river}商路征税，边境闭籴",
      "破坏工程与营地",
      "纵队列于两岸，戍卒守堤",
      "夺堰，或决其土翼",
      "沿沟与渡口交战",
      "{river}被引入{daliang}",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时，水工之渠挖了一半，其用意已被识破。去年冬天你们察觉了这个" +
          "计谋；君主本欲杀水工，听他说一条让你们耗竭十年的渠将养活你们万世，便把" +
          "他留在工地，派兵看守，由十万役夫继续开挖。他的弟子与你们的治水之吏已随" +
          "军东去，到你们夺自{han}的河岸上，在{ditch}离开{river}之处筑起一道带木制" +
          "水门的堰，堰上另开一片新陂以灌河岸的田。水门已关闭，以蓄满新陂。你们的" +
          "将军说，这道堰抵得上一支围攻{daliang}的大军；你们的府库说，{jing}的渠已" +
          "吃掉三年的赋役，而{ye}的一位县令曾说：王主富民，霸主富武，亡国富库。" +
          "你们宁愿握住水门，也不愿在怒气中打开它。",
        objectives: [
          "修成自{jing}至{luo}的渠，把盐卤之地变为耕田",
          "把{ditch}的水门只握在{qin}一国手中",
          "在工程耗竭府库之时，避免在{river}下游开战",
          "惩罚{han}的计谋，而不把{han}与{wei}逼到一起",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "本章开始时，{ditch}的水只有往年的一半。这条你们先王自{river}开凿的" +
          "沟渠，载着{river}之水经{daliang}流向下游平原的粟田与舟船，如今它离开" +
          "{river}之处已在{qin}的堰下。沿沟的每一次收成皆系于春水；播种之月无水，" +
          "或水突然放下，田都会毁掉，而春水大至时放水，对{daliang}所做的就是三家" +
          "对{jinyang}所做的。在河岸上你们的兵员敌不过{qin}。你们能让这道堰代价" +
          "高昂，能把{han}与大国拉到你们的冤屈一边，或者用你们所有的东西买水。" +
          "借出水工的{han}，其使者已在你们的门前。",
        objectives: [
          "为{ditch}沿岸的田地保住春季放水",
          "保住{daliang}的堤防完好、河上诸邑有粮",
          "把{han}、{chu}与{qi}拉到{wei}的冤屈一边，而不替{han}打仗",
          "不给{qin}沿沟而下进军的借口",
        ],
      },
      {
        id: "han",
        name: "{han}",
        state: "han",
        brief:
          "本章开始时，计谋已经反转。水工是你们派去的：一条大到足以让{qin}的府库" +
          "与兵员流血十年、无兵可派向东方的渠。渠挖到一半被识破，{qin}没有杀水工，" +
          "反而在把它修完；渠成之日{guanzhong}将再无凶年，而画出它的人已当着{qin}王" +
          "的面说他是为你们效力。{qin}的使者尚未为这场羞辱开价。{qin}的堰立在你们" +
          "失去的河岸上，在养活{wei}都城的沟渠之上，而{wei}的朝廷知道筑堰之人是谁" +
          "的水工教出来的。水工的性命、你们在{wei}的信用、你们在诸国之间的地位，" +
          "都系于水门前发生的事。",
        objectives: [
          "不让{qin}的怒气落到{han}所余的土地上",
          "救回水工，或不让{qin}得到他余下的技艺",
          "留住{wei}为盟友，而不在沟上替它打仗",
          "避免与{qin}隔关开战",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "关闭的水门",
        inject:
          "{ditch}流经{daliang}时只有往年一半的高度。{wei}的守堤之吏报告这是记忆" +
          "中最低的春季水位，沟渠沿岸的粟田在下种之前就已龟裂。{qin}的使者把短缺" +
          "说成山中的旱年。{wei}的河上斥候报告堰的木制水门关闭，{qin}河岸上的新陂" +
          "水流满溢。一万役夫在两支纵队看守下筑堰，而在{jing}，十万役夫在水工的" +
          "监督下向{luo}开渠。{daliang}市中的粟价十日之内涨了三成。{han}驻" +
          "{xianyang}的使者极为低声地打听水工的近况。",
        moveMenu: [
          "遣使赴{xianyang}，就水门正式抗议",
          "加倍戒备：河岸布斥候，堰上与渠上布细作",
          "把纵队调往渡口与堤防",
          "边境闭籴，对堰下{qin}的舟船征税",
          "通过一位商人在两国朝廷之间开辟私下渠道",
          "宣告堰是河岸田地之福，向{wei}有偿供水",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "水工之书",
        inject:
          "一封水工亲笔的信由一位盐商送到{han}的朝廷。信中说，{qin}王问他为何该活，" +
          "他答道：他为{han}延了数年之命，却将为{qin}建万世之功；王笑了，把计簿还" +
          "给了他。信中写明放水的日程：{ditch}的水门将在整个播种之月关闭，直到新陂" +
          "蓄满。一份抄本由另一条路到达{daliang}。{qin}宣布对每一艘过堰的舟船征收" +
          "水税，拒纳者扣船。{qi}的商人沿{river}把粟运到{daliang}，价钱翻倍。",
        moveMenu: [
          "以王与王之间的事为由，要求把水工交还{han}",
          "提议以镒计的黄金与粮食买下播种季的放水",
          "对堰下{qin}的舟船与盐反征其税",
          "把纵队与战船大举调往{daliang}以上的{river}",
          "请合纵主盟之国{chu}召集{river}沿岸诸国会盟",
          "夜里派人袭击水门之屋",
          "提议在堰上会谈，以先开水门为条件",
        ],
      },
      {
        index: 3,
        title: "水门之屋的火",
        inject:
          "一场夜火烧了堰上木制的水门之屋，十一名役夫与四名守卒死去。{qin}的县令" +
          "在灰烬中找到{wei}所制的松脂罐，把十二名{wei}的船夫锁往{xianyang}。{wei}" +
          "否认此事；它的议事之臣不知道放火的是本国的守堤之吏还是{han}的细作。" +
          "{qin}把第三支纵队调到堰上，第四支调到{wei}边境以上的渡口，其使者告诉" +
          "{han}的朝廷：下一场火将在{han}的城门前得到回答。新陂已蓄满三分之二。" +
          "{wei}的播种之月还有十四天。{han}的使者被逐出{xianyang}。",
        moveMenu: [
          "否认纵火，提议在{chu}使者见证下听讼",
          "承认纵火，宣告堰是对合纵的敌对之举",
          "增强沟渠沿线与{daliang}堤防的戍卒",
          "在两位君王之间开辟直接渠道",
          "为死者致赙，并请求打开水门",
          "把所有细作与船夫撤离河岸",
        ],
      },
      {
        index: 4,
        title: "播种之月",
        inject:
          "播种之月升起在干田之上。{qin}的使者给{wei}的议事之臣带来一封密封的" +
          "提议：每年播种季打开水门，以换取沟口以上沿{river}的三县，其堤防与戍卒" +
          "归{qin}，并立誓{wei}的舟船在堰以上不载兵器。{han}的使者带来第二个提议：" +
          "{han}的纵队守在关隘，借出一批粟，以及一个趁新陂蓄满之前夜决堰之土翼的" +
          "计划；使者提醒议事之臣，{jinyang}被围之主是如何结束那场围困的。{chu}" +
          "提议六十日后召集{river}沿岸诸国会盟，由{qi}作保，但这一季的播种等不及。" +
          "守堤之吏估计春水还有一个月。决定现在落到焦点席位：{wei}是决堰，接受" +
          "斡旋的放水之约，还是以土地买水？",
        moveMenu: [
          "以{han}的人夜决堰之土翼",
          "接受{chu}的会盟与盟约之下的放水日程；播种之月内计口给食",
          "割让沿河三县，换取写入盟约的每年播种季放水",
          "割让一县，并要求立即打开水门",
          "白日以河上戍卒夺堰并据守",
          "拒绝一切提议；加高{daliang}的堤防，以双倍价买{qi}的粟",
          "接受{han}的纵队与粟，但拒绝决堰；据守沟上",
        ],
      },
      {
        index: 5,
        title: "高水",
        inject:
          "无论{wei}如何答复，十日之后桃花水沿{river}而下，早于守堤之吏所估。新陂" +
          "在堰后蓄至堰顶。{qin}的治水之吏警告君王，土翼撑不过夏雨中蓄满的新陂：" +
          "水门必须打开，或分次量放，或一次放尽。一次放尽将淹没{ditch}沿岸的河上" +
          "诸邑，直到{daliang}城下；{qin}的将军指出，同一次放水一个时辰之内便能" +
          "淹没{wei}的戍卒与堤防，而当年{jinyang}的城墙露出水面的只有三版。在" +
          "{jing}，水工被问堰是否撑得住，答道那道堰不是他筑的。{han}的纵队在关隘。" +
          "{chu}的使者带着{qi}担保的条款到达{daliang}：写入盟约的放水日程、担保国" +
          "派吏守水门、水工交还{han}。",
        moveMenu: [
          "照草案接受条款，在堰上会盟起誓",
          "接受但加以修订：接受日程，不许外国之吏守水门",
          "拒绝条款，维持现在的方针",
          "只接受播种季放水，其余不誓",
          "以接受为掩护，调动戍卒与纵队",
          "把水工留在{jing}直到渠通{luo}，并放水",
        ],
      },
      {
        index: 6,
        title: "{river}之常",
        inject:
          "夏雨到来，新陂或守住，或守不住。如今存在的水门、戍卒、割让之县与担保" +
          "之吏的种种安排，正在凝固为{river}的常例：堰可蓄多少水、何时必须放水、" +
          "谁可以站在水门前，以及水工是否在{jing}修完那条渠。每一个朝廷都必须决定" +
          "它从这场危机中带走的态势：什么写进盟约，什么悄悄放弃，以及为下一个旱春" +
          "宣告何种界线。无论是否有任何誓约立下，史官都会把这一回合记为和解。",
        moveMenu: [
          "把现在的放水日程写进有担保国的盟约",
          "宣告堰上之水归{qin}，堰下之沟归{wei}",
          "让两岸的纵队无限期保持戒备",
          "以互惠为条件解散戍卒",
          "宣称胜利，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const RIVER_WORKS = buildChapter(RIVER_WORKS_TEXT);
