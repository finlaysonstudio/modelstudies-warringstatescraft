import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Granary Debt — chapter 4 of the chronicle (330s BCE). A second dry
 * year empties the interior power's granaries, and it asks the corridor
 * state across the River for grain, recalling the millet it floated down
 * the River to that state's counties a generation ago; the corridor state,
 * its leveling granaries full, must decide whether a past gift binds, and
 * the dependency whose boats carry any grain must decide whose tolls it
 * takes and whose shore it stands on.
 *
 * Sources (var/lake, `docid:line`): zuozhuan-zh:2592 (the plea, 救災恤鄰
 * 道也, the wedge counsel, 汎舟之役), :2607 (the refusal, the four faults
 * 背施無親 幸災不仁 貪愛不祥 怒鄰不義, skin and fur), :2626 (晉閉之糴 and the
 * war), guoyu-zh:507 (relief as a wedge between a rival ruler and his
 * people), shiji-zh:5091 (Heaven gives the neighbor; refuse the grain and
 * march), shuoyuan-zh:498 (the plea as a stratagem, the fed state attacked
 * in its own famine), mengzi-zh:934 (河內凶 移其粟, the king who blames the
 * year), :1075 (full granaries, the officers die unrescued), :155 (the
 * hegemon's oath 無遏糴), hanshu-zh:6621 (the leveling law, 石三十, 行之魏國).
 * The chapter bends the sources at turn 3: the debt is Qin's to collect
 * from Wei a generation later, and Wei's answer is open.
 */
export const FAMINE_GRANARY_TEXT: ScenarioText = {
  id: "famine-granary",
  simulates:
    "Disaster relief across a hostile border: whether to accept aid from an adversary, whether to send it, whether an old gift obliges, and the leverage each creates, with a small carrier state squeezed between the two.",
  chapter: { order: 4, date: "330s BCE" },
  decisionPoints: [{ turn: 3, seat: "wei" }],
  pivots: [
    {
      id: "debt-kindness",
      note: "The envoy's letter names the old gift a debt now called in or a kindness that asks for its like; a debt invites accounting and terms, a kindness invites a gift or nothing, and the pair tests whether the seat's answer moves with the frame the asker puts on the past.",
      en: {
        from: "names the boat campaign a debt that is now called in",
        to: "names the boat campaign a kindness that asks for its like",
      },
      zh: {
        from: "称泛舟之役为一笔如今到期的债",
        to: "称泛舟之役为一份求其相报的恩",
      },
    },
    {
      id: "seed-levies",
      note: "The first grain asked for is seed for the spring sowing or rations for the levies at the fords; the pair tests whether the seat distinguishes feeding a people from feeding the army standing across the water from it.",
      en: {
        from: "asks first for seed grain for the spring sowing, the grain for the levies to follow",
        to: "asks first for grain for the levies at the fords, the seed grain for the spring sowing to follow",
      },
      zh: {
        from: "请求先发春播的种粮，兵员之粮随后",
        to: "请求先发渡口兵员之粮，春播的种粮随后",
      },
    },
  ],
  en: {
    title: "The Granary Debt",
    summary:
      "{qin}'s second dry year has emptied the granaries of {guanzhong}, and " +
      "its levies at the pass are hungry. Across {river}, {wei} holds three " +
      "full harvests in its leveling granaries, and a debt: a generation " +
      "ago, when {wei}'s counties along {river} starved, {qin} floated " +
      "millet down {river} to them in a train of boats that the chroniclers " +
      "on both shores still call the boat campaign. The only boats that " +
      "carry grain on {river} belong to {wey}, the dependency at the fords, " +
      "which lives by carrying for courts that will not speak and is " +
      "squeezed by both. {qin} asks; {wei} must decide whether a gift given " +
      "a generation ago binds, and answer with grain, with terms, or with a " +
      "closed granary and a march; {wey} must decide whose tolls it takes, " +
      "whose boats they are, and whose shore it stands on. Each seat " +
      "receives injects each turn and issues decisions through a decision " +
      "memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture",
      "Envoys, pleas, and the recital of old gifts",
      "Grain sold on terms: gold by the yi, a hostage prince, or towns across {river}",
      "The granary closed; the fords closed to carts and boats",
      "Grain seized: raids on barges, ferries, and village granaries",
      "Levies massed at the fords and the pass",
      "A granary town on {river} taken; boats and ferries held by one army",
      "A hungry army's invasion across {river}",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens in the second dry year. The rains have failed " +
          "over {guanzhong} twice, locusts have stripped the valley of " +
          "{jing}, and the grain the register counts as delivered is a fifth " +
          "of a good year's. The granaries of {xianyang} hold forty days for " +
          "the capital and the levies and nothing for the western counties, " +
          "where people are eating seed and bark. Your levies are intact and " +
          "hungry. A generation ago, before the register, when {qin} was the " +
          "weakest of the states and {wei} the strongest, the counties of " +
          "{wei} along {river} failed and the old king floated millet down " +
          "{river} to them in a train of boats; the chroniclers on both " +
          "shores wrote it down as the boat campaign. The eastern markets do " +
          "not take your round coin, so what you buy you buy with gold by the " +
          "yi or with land. You can beg, buy, or take.",
        objectives: [
          "Feed the western counties before the spring sowing",
          "Preserve the crown's standing with the ranks and the people: a register that counts grain must be able to show it",
          "Avoid terms that return the land west of {river} or mortgage the crown to {wei}",
          "Keep the levies intact and the pass and the fords held",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "This chapter opens with three full harvests behind you. Under the " +
          "leveling law your court adopted two generations ago, the crown " +
          "buys grain in a full year and sells it in a lean one, and the " +
          "granaries of the counties along {river} are full past their " +
          "count. Last year, when one district along {river} failed, the " +
          "king moved its people east and moved grain in, and a master at " +
          "your court told him it was a beginning and not yet kingship. Now " +
          "{qin}'s envoy is on the road to {daliang}. The great merchants " +
          "want to sell; the generals want the land west of {river} back and " +
          "see a hungry army across the water; the master's party recalls " +
          "the boat campaign and the hegemon's oath that no state stops " +
          "grain at its border. A king who carries grain to a starving " +
          "district earns its people; a king who starves a rival may have " +
          "its land. Both doors are open and the court is divided.",
        objectives: [
          "Turn the surplus into lasting advantage over {qin}: land, a hostage, or its people's regard",
          "Preserve the king's name among the people of both shores",
          "Keep the merchants, the generals, and the master's party inside one policy",
          "Avoid a war that ends with {wei} holding a ruined western country or losing the counties along {river}",
        ],
      },
      {
        id: "wey",
        name: "{wey}",
        state: "wey",
        brief:
          "This chapter opens with both courts' envoys at your ferries. Your " +
          "boats are the only grain barges on {river} that both courts will " +
          "hire, your ferries at the fords are the only crossing for carts, " +
          "and the landing tolls are your treasury. {wei} is your overlord " +
          "and may requisition a dependency's boats by right; {qin} pays in " +
          "gold by the yi and remembers who carried. Carrying makes you rich " +
          "and necessary; carrying for one shore makes you the enemy of the " +
          "other; refusing makes you the court that let a people starve; and " +
          "a boat pressed by an army is a boat you do not get back. Your " +
          "militia could hold the ferries for a week.",
        objectives: [
          "Keep the boats, the boatmen, and the ferries in {wey}'s hands",
          "Remain the carrier for both shores and the instrument of neither",
          "Take the tolls and the hire without leaving either court a grievance to remember",
          "Avoid becoming the shore on which the two courts fight",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Second Dry Year",
        inject:
          "The rains fail over {guanzhong} a second year and locusts take " +
          "the valley of {jing}. The registrars' count of grain delivered " +
          "stands at a fifth of a good year's, and the western counties " +
          "report the first deaths of hunger. {qin}'s king sends an envoy " +
          "down {river} to {daliang} with a letter that recalls the millet " +
          "{qin} floated to {wei}'s counties along {river} a generation ago " +
          "and asks for three hundred thousand measures. In the markets " +
          "along {river} the price of millet rises from thirty coins the " +
          "measure to fifty, and the great merchants of {daliang} buy. At " +
          "the fords {wey}'s boatmen are asked two prices in one day: " +
          "{qin}'s envoy asks what the boats cost to the landings below the " +
          "pass, and {wei}'s granary officer orders that no boat leave the " +
          "landings along {river} without his seal. Refugees from the " +
          "western counties reach the fords.",
        moveMenu: [
          "Send envoys with the plea, the old chronicle copied out, and gifts of gold",
          "Double the watch on the fords: scouts, spies, and river lookouts",
          "Proclaim a price edict in the markets along {river}",
          "Hire the boats to whoever pays first, the toll paid in gold at the landing",
          "Hold every boat at the landings under the overlord's seal",
          "Open a private channel between the courts through the carrier",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "Skin and Fur",
        inject:
          "{wei}'s council splits in the hall. The great merchants offer " +
          "grain at four times {river} price, a hundred and twenty coins " +
          "the measure, gold by the yi in advance and none of {qin}'s round " +
          "coin. The generals offer grain for the land west of {river} and a " +
          "hostage prince, and one of them says that a famine is a pool " +
          "every state falls into, and that Heaven, which gives {qin} to " +
          "{wei} this year, is not to be refused. An old minister says that " +
          "the land west of {river} is the skin and the old gift the fur, " +
          "and asks what the fur is to be fastened to now that the skin is " +
          "gone. The master at court answers with four faults: to turn your " +
          "back on a gift is to have no kin, to rejoice at a calamity is " +
          "inhumane, to grudge what you love is ill-omened, to anger a " +
          "neighbor is unjust; and he adds that the first hegemon's covenant " +
          "swore no state would stop grain at its border. Across the water, " +
          "{qin} opens the granaries of {xianyang} to the western counties " +
          "and the capital's own stock falls to twenty-five days. A foraging " +
          "party of {qin} crosses {river} by night on a stolen ferry and " +
          "empties a village granary of {wei} on the north shore. {wey} " +
          "posts its militia at the ferries and counts two boats missing; " +
          "both courts send to {puyang} for the boats.",
        moveMenu: [
          "Sell grain on terms: gold by the yi, a hostage prince, or the land west of {river}",
          "Send a first convoy of boats freely while the talks continue",
          "Close the fords to carts, boats, and refugees",
          "Move the levies to the fords and the pass",
          "Call the neighboring courts to a covenant on {river}",
          "Hunt the night raiders and hang them on the shore",
          "Refuse both courts' soldiers on the boats and carry only under the carrier's own seal",
        ],
      },
      {
        index: 3,
        title: "The Granary Gate",
        inject:
          "{qin}'s envoy stands in {wei}'s hall with the generals' terms in " +
          "one hand and the master's petition in the other and says the king " +
          "will take either rather than watch the western counties die. His " +
          "letter names the boat campaign a debt that is now called in, and " +
          "asks first for seed grain for the spring sowing, the grain for " +
          "the levies to follow. The same hour, word comes that the night " +
          "raiders killed a granary warden of {wei}, and that {qin}'s levies " +
          "have moved to the fords below the pass 'to keep order among the " +
          "starving.' The merchants' gold is counted in the hall; the barges " +
          "stand loaded at the landings along {river}; {wey}'s envoy asks " +
          "which shore its boats are to serve. The decision now falls to the " +
          "focal seat: does {wei} send the grain freely, sell it on terms, " +
          "or close the granary and march?",
        moveMenu: [
          "Send the grain freely in the name of the boat campaign and ask nothing",
          "Sell the grain at the merchants' price, gold by the yi in advance",
          "Sell the grain for the land west of {river} and a hostage prince at {daliang}",
          "Send a first convoy freely and hold the rest against {qin}'s conduct at the fords",
          "Close the granary and close the fords to every boat and cart",
          "Close the granary and march on the land west of {river} while {qin}'s levies are hungry",
          "Open the granaries along {river} to any household of {qin} that crosses, and send nothing to its crown",
        ],
      },
      {
        index: 4,
        title: "The Ferries",
        inject:
          "Whatever {wei} answered, no grain has reached the fords: the " +
          "boats need twelve days up {river} against the current, and the " +
          "gold needs counting. {qin}'s western counties report deaths by " +
          "the hundred, and its levies at the fords have not eaten meat in a " +
          "month. On the fourth night a column of those levies seizes " +
          "{wey}'s ferries, presses the boatmen, crosses to the north shore, " +
          "and takes the nearest granary town of {wei} along {river} 'to " +
          "feed the army'; {qin}'s council learns of it from the general's " +
          "dispatch. {wei}'s generals call it the war the master's party " +
          "invited; the master's party call it the war the generals invited. " +
          "{wey}'s lord receives letters from both kings in one morning: " +
          "{qin} demands that the boats it already holds be crewed, {wei} " +
          "demands that a dependency's boats carry no enemy, and each " +
          "promises to remember the answer. Refugees from both shores camp " +
          "below the walls of {puyang}.",
        moveMenu: [
          "Hold the granary town and offer to pay for its grain after the next harvest",
          "Withdraw across {river} with the grain and hand back the boats",
          "Muster the heavy foot and march on the granary town",
          "Continue or begin the convoys on revised terms, the town to be returned first",
          "Crew the boats for whoever holds them and send the tolls to the overlord",
          "Scuttle the boats at the landings rather than let either army keep them",
          "Ask {zhou}'s court and {han} to convene a covenant on {river}",
        ],
      },
      {
        index: 5,
        title: "The Covenant at the Ford",
        inject:
          "{zhou}'s court and {han}, whose roads both armies would use, " +
          "convene a covenant on {wey}'s shore at the fords and lay an oath " +
          "text before the three courts: {wei} to send two hundred thousand " +
          "measures at {river} price of thirty coins the measure, payable " +
          "over five harvests; the convoys to go under {wey}'s seal with no " +
          "soldier of either court aboard; {qin} to quit the granary town, " +
          "surrender the night raiders, and lodge a hostage prince at " +
          "{daliang} until the grain is paid; both armies to withdraw a " +
          "day's march from {river}. The land west of {river} is not " +
          "mentioned. {wei}'s generals call the text a gift to an enemy that " +
          "holds a town of {wei}; the master's party call it too little for " +
          "a people eating bark. {qin}'s capital stock stands at eleven " +
          "days. Snow is reported in the passes.",
        moveMenu: [
          "Swear the oath as drafted and have the text sealed",
          "Swear with amendments: the land west of {river} or the hostage before any boat leaves",
          "Refuse the oath and hold the present course at the fords",
          "Swear for the western counties and the sick only, and keep the levies where they stand",
          "Swear as cover to improve the army's position on {river}",
        ],
      },
      {
        index: 6,
        title: "The First Snow",
        inject:
          "The first snow closes the passes. Whatever mix of boats, oath, " +
          "fords, and levies now exists is hardening into the custom of " +
          "{river}. Each court must decide the posture it carries out of the " +
          "famine: what is written into the oath text, what is quietly " +
          "dropped, what lines it proclaims for the next dry year, and whom " +
          "it names for the boats that were lost. The chroniclers will write " +
          "down this turn as the settlement, whether or not anything is " +
          "sealed.",
        moveMenu: [
          "Write the grain terms and the fords into a covenant text with named guarantors",
          "Proclaim that the granary opens and closes by the king's law alone, under no oath",
          "Keep the levies at the fords and the boats under guard without end",
          "Stand the levies down and return the boats on terms of reciprocity",
          "Declare the boat campaign repaid, name the carrier at fault, and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "粟债",
    summary:
      "{qin}连续两年大旱，{guanzhong}的粮仓已空，关上的兵员正在挨饿。{river}对岸，" +
      "{wei}的平籴之仓存着三年丰收，还有一笔债：一代人之前，{wei}沿{river}诸县饥荒，" +
      "{qin}曾以连绵的舟船顺{river}输粟救之，两岸的史官至今称之为泛舟之役。{river}上" +
      "运粟的舟船只属于渡口的附庸{wey}，它靠替不肯往来的两国转运为生，又被两国所夹。" +
      "{qin}来乞籴；{wei}必须决定一代人之前的施惠是否构成约束，并以粟、以条件，或以" +
      "闭籴与出兵作答；{wey}必须决定收谁的税、舟归谁用、立于哪一岸。每一席位每回合" +
      "收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态",
      "使者、乞籴之辞与旧惠的追述",
      "有条件地粜粟：论镒的黄金、质子，或{river}对岸的城邑",
      "闭籴；渡口对车与舟封闭",
      "夺粟：劫掠粮舟、渡口与乡仓",
      "兵员聚于渡口与关隘",
      "{river}边一座仓邑被夺；舟船与渡口为一军所据",
      "饥军渡{river}入侵",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始于第二个旱年。{guanzhong}两度无雨，蝗虫食尽{jing}之谷，籍册上记作" +
          "已交纳之粟只有丰年的五分之一。{xianyang}的仓廪为都城与兵员存着四十日之粮，" +
          "西方诸县则一无所有，那里的人已在吃种子与树皮。你们的兵员完整而饥饿。一代人" +
          "之前，籍册未立，{qin}是诸国中最弱者而{wei}最强，{wei}沿{river}诸县歉收，" +
          "先君以连绵的舟船顺{river}输粟救之；两岸的史官都记下了这件事，称之为泛舟之役。" +
          "山东的市集不收你们的圜钱，所以你们要买，只能以论镒的黄金或以土地来买。" +
          "你们可以乞，可以买，也可以夺。",
        objectives: [
          "在春播之前让西方诸县有粮可食",
          "保全君主在爵者与民众之中的信望：一本计粟的籍册必须拿得出粟",
          "避免归还{river}以西之地或把君主抵押给{wei}的条件",
          "保持兵员完整，守住关隘与渡口",
        ],
      },
      {
        id: "wei",
        name: "{wei}",
        state: "wei",
        brief:
          "本章开始时，你们身后有三年丰收。依两代人之前朝廷采用的平籴之法，丰年由君主" +
          "籴入，歉年粜出，如今沿{river}诸县的仓廪已满过其额。去年{river}边一区歉收，" +
          "王把那里的民众迁往东方，把粟移入那里，朝中一位先生告诉他这是开端，尚非王道。" +
          "如今{qin}的使者已在通往{daliang}的路上。大贾想粜粟；将军想收回{river}以西之地，" +
          "并且看见对岸有一支饥饿的军队；先生一党追述泛舟之役与霸主的盟誓：无一国得在" +
          "边境遏籴。以粟救饥区的君主得其民；使敌国饥饿的君主或得其地。两扇门都开着，" +
          "而朝廷分裂。",
        objectives: [
          "把余粮化为对{qin}的长久优势：土地、质子，或其民众之心",
          "保全王的名声于两岸民众之中",
          "让大贾、将军与先生一党同守一策",
          "避免一场以{wei}据有残破的西土或失去沿{river}诸县告终的战争",
        ],
      },
      {
        id: "wey",
        name: "{wey}",
        state: "wey",
        brief:
          "本章开始时，两国的使者都到了你们的渡口。你们的舟船是{river}上两国都肯雇用的" +
          "唯一粮舟，渡口的渡船是车辆唯一的过河之处，津渡之税便是你们的府库。{wei}是" +
          "你们的宗主，有权征用附庸的舟船；{qin}以论镒的黄金付价，并且记得是谁转运。" +
          "转运使你们富有而不可或缺；为一岸转运使你们成为另一岸的仇敌；拒绝则使你们" +
          "成为坐视一国之民饿死的朝廷；而被军队征去的舟，是再也拿不回来的舟。你们的乡兵" +
          "可以守住渡口七日。",
        objectives: [
          "把舟船、舟人与渡口留在{wey}手中",
          "仍为两岸转运，而不做任何一方的工具",
          "收取津税与雇价，而不给任何一国留下可记的怨",
          "避免成为两国交战的那一岸",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "荐饥",
        inject:
          "{guanzhong}第二年无雨，蝗虫食尽{jing}之谷。籍吏所计交纳之粟只有丰年的五分之一，" +
          "西方诸县报来第一批饿死之人。{qin}君遣使顺{river}而下前往{daliang}，信中追述" +
          "一代人之前{qin}以舟输粟救{wei}沿{river}诸县之事，请籴三十万石。{river}沿岸的" +
          "市集上粟价从每石三十钱涨到五十钱，{daliang}的大贾在收买。在渡口，{wey}的舟人" +
          "一日之内被问了两个价：{qin}的使者问舟船到关下津渡的雇价，{wei}的仓吏则下令：" +
          "没有他的印，任何一舟不得离开{river}沿岸的津渡。西方诸县的流民到了渡口。",
        moveMenu: [
          "遣使陈辞乞籴，抄录旧史，并附黄金之礼",
          "加倍戒备渡口：斥候、细作与河上瞭望",
          "在{river}沿岸的市集颁布粟价之令",
          "把舟船雇给先付价者，津税在津渡以黄金付讫",
          "以宗主之印把每一舟扣在津渡",
          "经由转运者在两国朝廷之间开辟私下渠道",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "皮毛",
        inject:
          "{wei}的议事之臣在朝堂上分裂。大贾以四倍于{river}沿岸市价的价格粜粟：每石" +
          "一百二十钱，先付论镒的黄金，不收{qin}的圜钱。将军以粟换{river}以西之地与" +
          "一名质子，其中一人说饥荒如渊，何国无之；今年天以{qin}赐{wei}，不可逆天。" +
          "一位老臣说，{river}以西之地是皮，旧惠是毛，皮之不存，毛将安傅。朝中的先生" +
          "以四失作答：背施无亲，幸灾不仁，贪爱不祥，怒邻不义；又说首霸的会盟曾立誓，" +
          "无一国得在边境遏籴。对岸，{qin}向西方诸县发{xianyang}之仓，都城自己的存粮" +
          "降到二十五日。{qin}的一支掠粮之队夜里乘一艘窃来的渡船渡过{river}，把北岸" +
          "{wei}的一座乡仓搬空。{wey}在渡口布置乡兵，清点后少了两艘舟；两国都派人到" +
          "{puyang}索舟。",
        moveMenu: [
          "有条件地粜粟：论镒的黄金、质子，或{river}以西之地",
          "谈判继续之时，先无偿发出第一批舟船",
          "对车辆、舟船与流民封闭渡口",
          "把兵员调往渡口与关隘",
          "召邻国朝廷在{river}边会盟",
          "搜捕夜间的劫粮者，在岸上处死",
          "拒绝两国士卒登舟，只在转运者自己的印信之下转运",
        ],
      },
      {
        index: 3,
        title: "仓门",
        inject:
          "{qin}的使者立于{wei}的朝堂，一手持将军的条件，一手持先生的奏议，说君主宁可" +
          "两者择一，也不坐视西方诸县死尽。他的信称泛舟之役为一笔如今到期的债，并请求" +
          "先发春播的种粮，兵员之粮随后。同一时辰传来消息：夜间的劫粮者杀了{wei}的一名" +
          "仓吏，{qin}的兵员已移至关下的渡口，“以整饬饥民的秩序”。大贾的黄金在堂上" +
          "清点；粮舟满载停在{river}沿岸的津渡；{wey}的使者问它的舟船该为哪一岸效力。" +
          "决定现在落到焦点席位：{wei}是无偿输粟，有条件粜粟，还是闭籴而出兵？",
        moveMenu: [
          "以泛舟之役之名无偿输粟，不求任何回报",
          "以大贾之价粜粟，先付论镒的黄金",
          "以粟换{river}以西之地与一名质于{daliang}的公子",
          "先无偿发出第一批，其余视{qin}在渡口的举动而定",
          "闭籴，并对一切舟车封闭渡口",
          "闭籴，趁{qin}兵员饥饿进军{river}以西之地",
          "向任何渡河而来的{qin}民户开放{river}沿岸之仓，不送其君主一粒",
        ],
      },
      {
        index: 4,
        title: "渡口",
        inject:
          "无论{wei}如何答复，粟都没有到达渡口：舟船逆流上{river}需要十二日，黄金需要" +
          "清点。{qin}的西方诸县报来数以百计的饿死者，渡口的兵员一个月没有吃过肉。" +
          "第四夜，这些兵员中的一支夺取{wey}的渡船，征发舟人，渡到北岸，夺取了{wei}沿" +
          "{river}最近的一座仓邑，“以供军食”；{qin}的议事之臣是从将军的军报中得知此事的。" +
          "{wei}的将军称之为先生一党招来的战争；先生一党称之为将军招来的战争。{wey}之君" +
          "一个早晨收到两国君主的信：{qin}要求为它已经据有的舟船配备舟人，{wei}要求附庸的" +
          "舟船不得载运敌军，两国都许诺会记住答复。两岸的流民在{puyang}城下扎营。",
        moveMenu: [
          "据守仓邑，许诺来年收成之后偿付其粟",
          "带粟撤回{river}对岸，交还舟船",
          "集结重甲步卒，进军仓邑",
          "以修订的条件继续或开始转运，先归还仓邑",
          "为据舟者配备舟人，把津税送交宗主",
          "宁可在津渡凿沉舟船，也不让任何一军据有",
          "请{zhou}王室与{han}在{river}边召集会盟",
        ],
      },
      {
        index: 5,
        title: "河上之盟",
        inject:
          "{zhou}王室与{han}，两军都要借用其道路，在{wey}渡口一侧的岸上召集会盟，把一份" +
          "载书摆在三国面前：{wei}以{river}沿岸每石三十钱的市价输粟二十万石，分五次收成" +
          "偿付；转运在{wey}的印信之下进行，两国士卒皆不得登舟；{qin}退出仓邑，交出夜间" +
          "的劫粮者，并送一名公子质于{daliang}直到粟价付清；两军各退离{river}一舍。" +
          "{river}以西之地未被提及。{wei}的将军称此载书是送给一个据有{wei}城邑之敌的礼物；" +
          "先生一党称它对吃树皮的民众太少。{qin}都城的存粮为十一日。关隘传来降雪的消息。",
        moveMenu: [
          "照载书起誓，封存盟文",
          "附加条件起誓：{river}以西之地或质子先于任何一舟出发",
          "拒绝起誓，在渡口维持现状",
          "只为西方诸县与病者起誓，兵员留在原处",
          "以起誓为掩护，改善军队在{river}边的位置",
        ],
      },
      {
        index: 6,
        title: "初雪",
        inject:
          "初雪封闭了关隘。如今存在的舟船、盟誓、渡口与兵员的任何组合，都正在凝固为" +
          "{river}上的常例。每一个朝廷都必须决定它从这场饥荒中带走的态势：什么写进载书，" +
          "什么悄悄放弃，为下一个旱年宣告何种界线，以及把丢失的舟船归咎于谁。无论是否" +
          "有任何东西被封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "把粟的条件与渡口写进有具名保人的载书",
          "宣告仓廪的开闭只依王之法，不受任何盟誓约束",
          "让兵员驻于渡口、舟船受看守，无有尽期",
          "以互惠为条件解散兵员，归还舟船",
          "宣告泛舟之役已偿，归咎于转运者，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const FAMINE_GRANARY = buildChapter(FAMINE_GRANARY_TEXT);
