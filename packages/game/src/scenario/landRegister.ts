import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Register — chapter 1 of the chronicle (356–338 BCE). A state-
 * strengthening reform (a household register, ranks by merit, universal
 * service under the crown) breaks an old elite's hold on land and levies;
 * the neighbor across the River decides whether to copy the register,
 * shelter its author, or bankroll the displaced houses.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:7112 (five-family bond, clan
 * struck from the register without merit, double tax on undivided
 * households), :7114 (the heir's guardian punished, the tutor tattooed),
 * :7116 (counties under magistrates, thirty-one of them), :7118 (the
 * clan's resentment, the guardian's eight years behind closed doors, the
 * flight, the inn, Wei's refusal, the chariots), :7109 (the dying minister:
 * employ him or kill him), xinxu-zh:251-252 (the court debate against
 * reform), shangjunshu-zh:116 (the twenty grades, one head = one grade).
 * Chapter 3 of the saga plan bends the sources at turn 4: the reformer
 * reaches the River alive with the rolls, and Wei's answer is open.
 */
export const LAND_REGISTER_TEXT: ScenarioText = {
  id: "land-register",
  simulates:
    "A state-building reform that breaks the old elite: a sweeping tax, identity, and conscription register, while neighbors decide whether to copy it, poach the reformer, or bankroll the displaced nobles.",
  chapter: { order: 1, date: "356–338 BCE" },
  decisionPoints: [{ turn: 4, seat: "wei" }],
  pivots: [
    {
      id: "asylum-passage",
      note: "The reformer's letter asks for asylum (shelter, and the register with it) or only safe passage (transit to a third court); the focal menu's first item is built on the first reading, and the pair tests whether the seat decides on the letter or on the menu.",
      en: {
        from: "asks for asylum and offers the register whole",
        to: "asks for safe passage east and offers the register whole",
      },
      zh: {
        from: "请求庇护，并愿将籍册整个奉上",
        to: "请求借道东去，并愿将籍册整个奉上",
      },
    },
  ],
  en: {
    title: "The Register",
    summary:
      "{qin}, long counted the weakest of the states, has a young king and " +
      "a guest chancellor from {wei} who is writing every household, field, " +
      "and ox into a single register, binding families five by five for " +
      "each other's conduct, replacing rank by birth with twenty grades " +
      "earned by heads taken and grain delivered, and calling the levies " +
      "straight to the crown. {Clan} of {qin}, whose levies once made the " +
      "army, lose their tenants and their rank at a stroke. {wei}, the " +
      "stronger neighbor across {river}, which once had this chancellor at " +
      "its own court and let him go, must decide whether to copy the " +
      "register, shelter its author, or strike before it matures. Each seat " +
      "receives injects each turn and issues decisions through a decision " +
      "memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture",
      "Petitions, memorials, and envoys",
      "Refusal: taxes withheld, registrars turned away, levies not sent",
      "Punishments and confiscations; the leading houses struck from the rolls",
      "Armed standoff: house levies and crown levies under arms",
      "Open revolt in the marches",
      "Foreign gold and arms to one side",
      "Civil war joined by a foreign army",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens before the reforms are old. You answer to a " +
          "young king who has staked his reign on the guest chancellor's " +
          "register: every household written down, every field measured, " +
          "every able man owing service to the crown and not to his lord, " +
          "five families bound for each other's conduct, and rank earned by " +
          "heads taken and grain delivered. The register is three years from " +
          "complete. The old houses call it theft; the new officers call it " +
          "justice. You hold {xianyang}, the treasury, and the new levies, " +
          "and you must finish the work before anyone can undo it.",
        objectives: [
          "Complete the register and bring every levy under the crown",
          "Break the great houses' hold on land and office without a civil war",
          "Deter {wei} from striking while the reform is half-made",
          "Keep the king's person and the chancellor's work secure",
        ],
      },
      {
        id: "clan",
        name: "{clan}",
        state: "clan",
        brief:
          "This chapter opens with the registrars at your gates. The heir's " +
          "guardian, a prince of the blood, leads you; the heir himself, " +
          "fifteen and raised among you, is your hope. {wei}'s envoys have " +
          "begun to call at your houses with questions about the passes. You " +
          "hold your levies, your border towns, and the loyalty of tenants " +
          "who have not yet learned that a tenant who reports his lord's " +
          "hidden fields is raised a grade and given the fields.",
        objectives: [
          "Halt or gut the register and restore rank by birth",
          "Keep your levies, tenants, and border towns under your hand",
          "Remove the chancellor without becoming {wei}'s instrument",
          "Avoid a war that leaves the marches burned whoever wins",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "This chapter opens with the register half-written across {river}. " +
          "Your own great houses watch {qin} with dread; your own treasury " +
          "watches it with envy. If the register is finished, {qin}'s levies " +
          "will outnumber yours within a decade; if it fails, its chancellor " +
          "and his clerks would sell their craft to whoever shelters them. " +
          "{Clan} of {qin} ask for gold and a promise of arms. The " +
          "chancellor, through a merchant, asks what asylum might cost. Both " +
          "doors are open, and neither will stay open long.",
        objectives: [
          "Prevent {qin} from becoming the stronger power",
          "Gain the register's method without the disorder of its making",
          "Keep {wei}'s own great houses from taking the clan's side",
          "Avoid a war across {river} that {wei} cannot end on its terms",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Measuring Rods",
        inject:
          "The chancellor's registrars cross into the clan lands with " +
          "measuring rods, tally boards, and a warrant under the king's seal. " +
          "The house of the heir's guardian turns them back at its gate. A " +
          "lesser house lets them in and loses a third of its tenants to the " +
          "crown rolls within a week. A tenant who reports his lord's hidden " +
          "fields is raised one grade and given the fields. The clan's " +
          "petition to the throne, sealed by six houses, calls the register " +
          "'a guest clerk's theft of the kingdom's bones' and quotes the old " +
          "saying that a law not a hundredfold better is not worth changing. " +
          "{wei}'s envoy at {xianyang} asks, very politely, to see a copy of " +
          "the tally boards.",
        moveMenu: [
          "Press the registrars forward under armed escort",
          "Petition the throne and refuse the registrars at the gates",
          "Send envoys with an offer of friendship and a request for the method",
          "Double the watch: spies in the clan lands, spies at court",
          "Proclaim amnesty for houses that register within the season",
          "Open a private channel between the clan and a foreign court",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Twenty Grades",
        inject:
          "The king proclaims the new ranks: twenty grades, earned by heads " +
          "taken in battle and grain delivered to the granaries, with no " +
          "grade inherited and no kinsman kept on the clan register without " +
          "battle merit. A cart driver who took four heads in last year's " +
          "border fight now outranks the heir's guardian's eldest son. The " +
          "son's chariot is stopped at the gate of {xianyang} for bearing the " +
          "insignia of a rank he no longer holds. In the clan lands the " +
          "harvest tithe is withheld 'in protest,' and two house levies fail " +
          "to report for the autumn muster. {wei}'s court receives a sealed " +
          "letter from three houses asking what aid would follow if the clan " +
          "'defended their ancient rights.'",
        moveMenu: [
          "Confiscate the lands of houses that withhold the tithe",
          "Withhold levies and tithes across all six houses together",
          "Offer {wei}'s gold quietly and deny it publicly",
          "Summon the house heads to court under safe conduct",
          "Move crown levies to the roads into the clan lands",
          "Offer the houses a lesser rank by birth in exchange for the tithe",
          "Call a meeting of the neighboring courts to witness the dispute",
        ],
      },
      {
        index: 3,
        title: "The Heir's Tutor",
        inject:
          "The heir, fifteen and raised among the old houses, breaks the " +
          "register's law by sheltering a fugitive lord's tenants. The " +
          "chancellor holds that the law must bind the heir as it binds a " +
          "cart driver, but that the heir's person cannot be punished; the " +
          "heir's guardian is sentenced in his place and the heir's tutor is " +
          "tattooed on the face, in the market of {xianyang}, before the " +
          "assembled ranks. The clan call it sacrilege. The guardian shuts " +
          "his gates and his house levies muster in arms and seal the " +
          "northern road. The young king is reported ill. {wei} moves two " +
          "columns to {river} 'for the autumn exercises.' The chancellor's " +
          "merchant reaches {daliang} with a sealed letter.",
        moveMenu: [
          "Send crown levies to reopen the northern road",
          "Hold the road and send a manifesto to every court",
          "Exercise on {river} and wait",
          "Propose a settlement witnessed by {zhou}'s court",
          "Strike the clan lands before {wei} can arm them",
          "Strike {xianyang} before the crown levies are ready",
          "Purge the chancellor's enemies at court",
        ],
      },
      {
        index: 4,
        title: "The Two Letters",
        inject:
          "The king of {qin} dies in the night. The heir is proclaimed king " +
          "by the old houses in the clan lands and by the chancellor's " +
          "officers in {xianyang}, each party claiming to hold him. The " +
          "chancellor rides for {river} with his clerks, his tally boards, " +
          "and forty horse. Behind him the new ranks hold the capital; ahead " +
          "of him the clan hold the roads. Two letters lie before {wei}'s " +
          "council. The first, from the six houses, asks for a thousand yi " +
          "of gold and a column of foot, and promises the border towns in " +
          "return. The second, from the chancellor, asks for asylum and " +
          "offers the register whole: the method, the clerks, the rolls. The " +
          "decision now falls to the focal seat: which letter is answered, " +
          "and what is {wei}'s posture on {river}?",
        moveMenu: [
          "Grant the chancellor asylum and begin {wei}'s own register",
          "Bankroll the houses' revolt with gold and a promise of arms",
          "Bankroll the houses and march a column across {river}",
          "Refuse both letters and close the fords",
          "Hand the chancellor back to the houses for a price",
          "Shelter the chancellor but promise the houses neutrality",
          "Offer the young king's court a treaty in exchange for the method",
        ],
      },
      {
        index: 5,
        title: "The Inn at the Border",
        inject:
          "Whatever {wei} answered, the chancellor does not reach it. At an " +
          "inn on the road to {river} the keeper refuses him a bed because " +
          "the chancellor's own law forbids lodging a traveler without a " +
          "passport, and the clan's riders take him there. The new king, in " +
          "the clan's hands, orders him torn by chariots in the market of " +
          "{xianyang} and his house put to death; the new ranks in the " +
          "capital do not prevent it. The register is not repealed. The " +
          "clan now ask the young king to strike the five-family bond and " +
          "restore rank by birth; the chancellor's officers, who hold the " +
          "rolls, the granaries, and the levies, ask him to keep every law " +
          "and hang the guardian. {wei}'s columns are still on {river}.",
        moveMenu: [
          "Keep the register whole and execute the guardian for the chariots",
          "Keep the register but restore rank by birth for one generation",
          "Repeal the five-family bond and keep the county magistrates",
          "Offer {wei} a treaty now, while the court is divided",
          "March the house levies on {xianyang} and take the rolls",
          "Cross {river} and take the border towns while the court is divided",
          "Withdraw the columns and offer the young king a royal marriage",
        ],
      },
      {
        index: 6,
        title: "The Rolls",
        inject:
          "The spring muster arrives, and the levies that answer it answer " +
          "whoever holds the rolls. Each court must decide the posture it " +
          "carries out of the crisis: what is written into the register and " +
          "into treaty, what is quietly dropped, and what lines it proclaims " +
          "for the next generation, which will inherit the register or its " +
          "absence. The chroniclers will write down this turn as the " +
          "settlement, whether or not anything is sealed.",
        moveMenu: [
          "Write the present arrangement into treaty with {wei}",
          "Proclaim the register and the grades the law of the state forever",
          "Keep the house levies under arms without end",
          "Stand the levies down on terms of reciprocity",
          "Claim victory and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "籍册",
    summary:
      "{qin}长期被视为诸国中最弱的一国，如今有一位年轻的君主和一位来自{wei}的客卿" +
      "相邦，他正把每一户、每一块田、每一头牛写进一本籍册，令五家相保连坐，以阵上" +
      "首级与交纳之粟所得的二十等爵取代世袭之爵，并把兵员直接征调到君主名下。" +
      "{qin}的{clan}，其私卒曾是军队的主力，一夜之间失去佃户与爵位。{wei}是" +
      "{river}对岸较强的邻国，这位相邦曾在它的朝廷而被放走，如今它必须决定：" +
      "仿效籍册，庇护其作者，还是在它成熟之前先发制人。每一席位每回合收到情势通报，" +
      "并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态",
      "上书、奏议与使者",
      "抗拒：拒纳赋税、拒绝籍吏、不出兵员",
      "刑罚与籍没；首要大族被削去族籍",
      "武装对峙：族兵与公室之兵各自持械",
      "边地公开叛乱",
      "外国的黄金与兵器流向一方",
      "外国军队加入的内战",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时变法尚新。你们听命于一位年轻的君主，他把自己的统治押在客卿相邦" +
          "的籍册之上：每一户登记在册，每一块田丈量清楚，每一个丁壮的役属于君主而" +
          "不属于其主，五家相保连坐，爵位以阵上首级与交纳之粟而得。籍册还要三年才能" +
          "完成。旧族称之为盗，新吏称之为公。你们据有{xianyang}、府库与新征之兵，" +
          "必须在任何人能够推翻它之前完成这件事。",
        objectives: [
          "完成籍册，把每一支兵员收归君主",
          "不经内战而打破大族对土地与官职的把持",
          "在变法半成之时威慑{wei}不敢来攻",
          "保全君主之身与相邦之业",
        ],
      },
      {
        id: "clan",
        name: "{clan}",
        state: "clan",
        brief:
          "本章开始时籍吏已到你们门前。太子之傅，一位宗室公子，是你们的首领；太子" +
          "本人十五岁，在你们之中长大，是你们的希望。{wei}的使者已开始登门，询问" +
          "关隘之事。你们掌握着私卒、边邑，以及佃户的忠心，而佃户们尚未得知：告发" +
          "其主隐田者升爵一级，并得其田。",
        objectives: [
          "阻止或掏空籍册，恢复世袭之爵",
          "把私卒、佃户与边邑保在自己手中",
          "除掉相邦而不沦为{wei}的工具",
          "避免一场无论谁胜都会烧毁边地的战争",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "本章开始时，{river}对岸的籍册已写了一半。你们本国的大族带着恐惧注视" +
          "{qin}；你们的府库带着羡慕注视它。若籍册完成，十年之内{qin}的兵员将超过" +
          "你们；若它失败，它的相邦与属吏会把这门手艺卖给任何肯收留他们的人。{qin}的" +
          "{clan}请求黄金与兵器的许诺。相邦则通过一位商人打听庇护的代价。两扇门都" +
          "开着，而且都不会开太久。",
        objectives: [
          "阻止{qin}成为更强的一方",
          "获得籍册之法而不经历其制定时的混乱",
          "不让{wei}本国的大族站到宗室一边",
          "避免一场{wei}无法按己意结束的隔{river}之战",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "量田之尺",
        inject:
          "相邦的籍吏带着量尺、计簿与盖有君主之玺的文书进入宗室的封地。太子之傅的" +
          "家族在门前把他们赶了回去。一个较小的家族放他们进门，一周之内三分之一的" +
          "佃户转入了公室的名册。一名告发其主隐田的佃户升爵一级，并得到那些田。" +
          "六家联署的宗室上书称籍册是“客卿小吏盗取国家骨骼”，并引用古语：利不百，" +
          "不变法。{wei}驻{xianyang}的使者极为客气地请求看一眼计簿的副本。",
        moveMenu: [
          "派兵护送籍吏继续前行",
          "上书君主，并在门前拒绝籍吏",
          "遣使致以友好之意，并请求籍册之法",
          "加倍戒备：在宗室封地与朝廷都布置细作",
          "宣布一季之内登记的家族一概赦免",
          "在宗室与一个外国朝廷之间开辟私下渠道",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "二十等爵",
        inject:
          "君主颁布新爵：二十等，以阵上首级与交纳入仓之粟而得，无一等可以世袭，宗室" +
          "无军功者不得在族籍。去年边境之战中斩首四级的一名车夫，如今位在太子之傅的" +
          "长子之上。那位长子的车驾在{xianyang}城门被拦下，因为它佩着他已不再拥有" +
          "的爵级的标识。在宗室封地，秋赋被“以示抗议”扣下，两家的私卒没有参加秋季" +
          "的集结。{wei}的朝廷收到三家的密函，询问若宗室“捍卫其古老的权利”，将得到" +
          "何种援助。",
        moveMenu: [
          "籍没扣留秋赋的家族的土地",
          "六家一同扣留兵员与赋税",
          "暗中送上{wei}的黄金，公开否认",
          "以安全之诺召各族族长入朝",
          "把公室之兵调往通向宗室封地的道路",
          "以一个较低的世袭爵位换取各族交纳赋税",
          "召集邻国朝廷会盟，见证这场争端",
        ],
      },
      {
        index: 3,
        title: "太子之师",
        inject:
          "十五岁、在旧族之中长大的太子，收容了一位逃亡之主的佃户，触犯了籍册之法。" +
          "相邦主张法必须像约束车夫一样约束太子，但太子之身不可施刑；于是太子之傅" +
          "代他受刑，太子之师在{xianyang}的市中、在列爵之前被黥面。宗室称之为亵渎。" +
          "太子之傅闭门不出，其私卒持械集结，封闭了北路。年轻的君主传闻患病。{wei}" +
          "把两支纵队调往{river}，“以行秋季操演”。相邦的商人带着一封密函到达" +
          "{daliang}。",
        moveMenu: [
          "派公室之兵重开北路",
          "据守北路，向各国朝廷发布檄文",
          "在{river}边操演，静观",
          "提议由{zhou}王室见证的和解",
          "趁{wei}尚未武装宗室，先攻宗室封地",
          "趁公室之兵尚未集结，先攻{xianyang}",
          "清洗朝中相邦的仇敌",
        ],
      },
      {
        index: 4,
        title: "两封信",
        inject:
          "{qin}的君主在夜里死去。太子在宗室封地被旧族立为君，在{xianyang}被相邦的" +
          "属吏立为君，双方都声称太子在自己手中。相邦带着属吏、计簿与四十骑奔向" +
          "{river}。他身后，新爵据守都城；他身前，宗室扼守道路。{wei}的议事之臣面前" +
          "摆着两封信。第一封来自六家，请求千镒黄金与一支步卒，并许诺以边邑为报。" +
          "第二封来自相邦，请求庇护，并愿将籍册整个奉上：其法、其吏、其册。决定现在" +
          "落到焦点席位：答复哪一封信，{wei}在{river}边采取何种态势？",
        moveMenu: [
          "给予相邦庇护，并开始{wei}自己的籍册",
          "以黄金与兵器之诺资助各族起事",
          "资助各族并派一支纵队渡过{river}",
          "两封信都拒绝，封闭渡口",
          "以某种代价把相邦交还给各族",
          "庇护相邦，但向各族许诺中立",
          "向新君的朝廷提议以盟约换取籍册之法",
        ],
      },
      {
        index: 5,
        title: "边境客舍",
        inject:
          "无论{wei}如何答复，相邦都没有到达。在通往{river}的路上，一家客舍的主人" +
          "拒绝留宿他，因为相邦自己定下的法禁止留宿没有验传的旅人，宗室的骑从就在" +
          "那里抓住了他。落在宗室手中的新君下令在{xianyang}的市中将他车裂，灭其家；" +
          "都城里的新爵没有阻止。籍册没有被废除。宗室现在请求新君废除什伍连坐、恢复" +
          "世袭之爵；相邦的属吏掌握着名册、粮仓与兵员，请求新君保留每一条法，并处死" +
          "太子之傅。{wei}的纵队仍在{river}边。",
        moveMenu: [
          "保全籍册，并以车裂之罪处死太子之傅",
          "保留籍册，但恢复一代人的世袭之爵",
          "废除什伍连坐，保留县令",
          "趁朝廷分裂，立即向{wei}提议盟约",
          "率族兵进军{xianyang}，夺取名册",
          "趁朝廷分裂，渡过{river}夺取边邑",
          "撤回纵队，向新君提议王室联姻",
        ],
      },
      {
        index: 6,
        title: "名册",
        inject:
          "春季集结到来，应召而来的兵员听命于握有名册的人。每一个朝廷都必须决定它从" +
          "这场危机中带走的态势：什么写进籍册与盟约，什么悄悄放弃，以及为下一代宣告" +
          "何种界线，那一代人将继承籍册，或者继承它的缺席。无论是否有任何东西被封印，" +
          "史官都会把这一回合记为和解。",
        moveMenu: [
          "把目前的安排写进与{wei}的盟约",
          "宣告籍册与爵级为国家永世之法",
          "让族兵无限期持械",
          "以互惠为条件解散兵员",
          "宣称胜利，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const LAND_REGISTER = buildChapter(LAND_REGISTER_TEXT);
