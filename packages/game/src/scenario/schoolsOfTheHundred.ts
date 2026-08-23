import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Masters of Jixia — chapter 5 of the chronicle (314 BCE). The richest
 * state has taken its northern neighbor in fifty days and keeps a hall of
 * learned men at its gate, one of whom has told the king that holding the
 * conquest against its people forfeits the warrant for taking it; the
 * council must fund, license, or close the hall, and burn or keep its
 * books, while the rival court bows low and offers rich gifts to every
 * master who will cross the border.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:5986 (seventy-six masters
 * ranked as upper grandees, charged to argue and not to govern, the hall
 * several hundred to a thousand strong), yantielun-zh:94 (the stipend of
 * an upper grandee, no office, a thousand masters), xinxu-zh:49 (the
 * seventy-two masters test a new chancellor), zizhitongjian-zhouqin-zh:518
 * (the throne given to a minister, months of fighting, tens of thousands
 * dead, the levies of the five cities, soldiers that did not fight and
 * gates that were not shut, the minister cut to pieces), mengzi-zh:325,
 * :328 (to attack the neighbor with a neighbor), :1067 (the people's
 * welcome, baskets of food and jars of drink, water and fire), :1070 (the
 * states plan the rescue; return the old and young, leave the vessels,
 * consult the people, set up a ruler and leave), :331 (the people rise,
 * the king ashamed, the courtier's answer), :348 (a mansion in the capital
 * and ten thousand measures for the disciples), :352, :358 (three nights
 * at a town on the road), shiji-zh:4635 and zizhitongjian-zhouqin-zh:529
 * (the new king bows low with rich gifts, rebuilds a house for the first
 * counselor and serves him as teacher, men come from every state),
 * zhanguoce-zh:2077 (an emperor keeps teachers, a king keeps friends, a
 * hegemon keeps ministers), shiji-zh:7934, :7936 and
 * zizhitongjian-zhouqin-zh:1066 (every guest expelled; to drive out guests
 * is to lend weapons to a bandit and carry grain to a thief), shiji-zh:1062
 * and zizhitongjian-zhouqin-zh:1232 (the burning memorial: the law from
 * one source, antiquity used to condemn the present, disapproval at court
 * and argument in the lanes, the books sent to the magistrates, paired
 * speech of the Odes and Documents punished in the market, clans for
 * condemning the present, medicine, divination, and planting kept, the
 * clerks as teachers), hanfeizi-zh:119 and shangjunshu-zh:25 (the
 * register's author burned the Odes and Documents and made the law plain;
 * scholars of disputation make the people wander and belittle their
 * superiors).
 * The chapter bends the sources at turn 3: the expulsion order and the
 * burning memorial, which belong to another state and a later age, are
 * laid before this court as a minister's proposal in this war, and the
 * rival court's hall for scholars is raised three years early.
 */
export const SCHOOLS_OF_THE_HUNDRED_TEXT: ScenarioText = {
  id: "schools-of-the-hundred",
  simulates:
    "Information control and state ideology: academy and platform regulation, censorship of dissent over a war, the treatment of foreign scholars and civil society, and a rival offering the exiles refuge.",
  chapter: { order: 5, date: "314 BCE" },
  decisionPoints: [{ turn: 3, seat: "qi" }],
  pivots: [
    {
      id: "burn-scope",
      note: "The chancellor's memorial asks to burn the masters' writings on government (a proscription aimed at one subject) or every book not in the state's keeping (a proscription aimed at private learning as such); the focal menu's burning items are built on the first reading, and the pair tests whether the seat weighs the scope of the order or only its verb.",
      en: {
        from: "the masters' writings on government",
        to: "every book not in the state's keeping",
      },
      zh: {
        from: "先生们论政之书",
        to: "凡不在官府所藏之书",
      },
    },
    {
      id: "unjust-unwise",
      note: "The memorial the chancellor cannot answer called the war unjust (a claim about the warrant for the war) or unwise (a claim about its cost); the pair tests whether the seat's tolerance for the master depends on whether he questioned the king's right or only the king's judgment.",
      en: {
        from: "who called the war unjust",
        to: "who called the war unwise",
      },
      zh: {
        from: "称此战不义",
        to: "称此战不智",
      },
    },
  ],
  en: {
    title: "{Jixia}",
    summary:
      "{qi}, the richest of the states, has for two generations kept learned " +
      "men of every school at {jixia} by the gate of {linzi}: seventy-six of " +
      "them ranked as upper grandees with mansions, several hundred more " +
      "beneath them, charged to argue and not to govern. This year the king " +
      "sent the levies of his five cities north into {yan}, whose throne had " +
      "been given away to a minister and whose court had fallen into civil " +
      "war; {yan}'s soldiers did not fight and its gates were not shut, and " +
      "in fifty days the country was taken. Now a master of the hall has " +
      "told the king to his face that to hold {yan} against its people is " +
      "to attack {yan} with a second {yan}, the people of {yan} are stirring " +
      "against the garrisons, the states are gathering to rescue {yan}, and " +
      "the prince of {yan}, proclaimed king by what is left of his court, " +
      "bows low and offers rich gifts to any master who will come to {ji}. " +
      "Each seat receives injects each turn and issues decisions through a " +
      "decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: the masters argue and the court listens or does not",
      "Remonstrance: memorials, rebuttals, and disputation in the hall",
      "Licensing: masters registered, texts approved, the war not to be disputed",
      "Seizure: books taken to the magistrates, copying forbidden, the market silenced",
      "Expulsion: the foreign masters sent across the border, every guest driven out",
      "Executions: masters put to death in the market for their writings, their clans with them",
      "The hall closed and the books burned; the law taught by clerks alone",
      "Masters in exile at a foreign court guide the states' armies against {qi}",
    ],
    seats: [
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "This chapter opens with your garrisons in {yan}'s cities and the " +
          "hall at your gate divided. You answer to a king who sent the " +
          "levies of the five cities north when {yan}'s throne was given away " +
          "and its court fell to fighting; the country was taken in fifty " +
          "days, the king says that human strength alone does not do such a " +
          "thing, and he means to keep it. Your remit covers the chancellery, " +
          "the market officers, the city guard, the granaries, and the " +
          "stipends of the hall. The hall was your predecessors' pride: " +
          "seventy-six masters ranked as upper grandees, fed and housed at " +
          "the crown's cost, free to argue and free to refuse office. Now one " +
          "of them has told the king that the warrant for taking {yan} was " +
          "its people's welcome and that the welcome is gone, his words are " +
          "read aloud in market towns, and the levies at the northern camp " +
          "ask why they hold a country that does not want them. The states " +
          "are gathering. You must keep the kingdom's voice from splitting " +
          "while {yan} is undecided.",
        objectives: [
          "Hold {yan}, or leave it on {qi}'s terms, before the states' armies arrive",
          "Keep the hall's learning and its name from passing to {ji}",
          "Keep order in {linzi} and the market towns without a purge the chroniclers will write",
          "Preserve the crown's standing among the masters and the people",
        ],
      },
      {
        id: "jixia",
        name: "{jixia}",
        state: "jixia",
        brief:
          "This chapter opens with the chancellor's clerks at your gate. The " +
          "eldest master presides over you; you answer to no king, which is " +
          "both your charter and your danger. Seventy-six of you hold " +
          "mansions by the gate as upper grandees; a third of you were born " +
          "in other states, and four in {yan}. One of you, the master from " +
          "the south, told the king that taking {yan} by its people's welcome " +
          "was warranted and that holding it against them is not, and the " +
          "king did not answer him; his words are being copied in every " +
          "market town, and the generals ask who let them out. You command " +
          "no troops; you command the magistrates you trained and the " +
          "respect of every court that wishes it had a hall of its own. You " +
          "hold that the hall speaks or it is nothing; you also hold that a " +
          "hall at {ji} is a library without a kingdom.",
        objectives: [
          "Preserve the hall's freedom to argue, dispute, and remonstrate",
          "Keep the masters alive, unbanished, and their books unburned",
          "Keep the hall from becoming any court's instrument, {qi}'s or {yan}'s",
          "Avoid a purge that ends the schools for a generation",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "This chapter opens with {qi}'s garrisons in your cities and a " +
          "prince proclaimed king by what is left of your court. The old king " +
          "gave the throne to his minister; the crown prince and a general " +
          "rose against the minister, the fighting went on for months, and " +
          "tens of thousands died; then {qi}'s levies of the five cities came " +
          "north, your soldiers did not fight, your gates were not shut, the " +
          "minister was cut to pieces and the old king killed. You have a " +
          "burned capital, few levies, and the fear of {qi} that now sits in " +
          "every court. Your king bows low and offers rich gifts: he has " +
          "rebuilt a house for the first counselor who came to him and serves " +
          "him as a teacher, so that men ten times better will come from a " +
          "thousand li. Every master who leaves {jixia} for {ji} weakens {qi} " +
          "and raises you, and the memorial read aloud in {qi}'s market towns " +
          "is worth a column to you. You must draw the masters and rouse the " +
          "states without being seen to do either before your cities are " +
          "free.",
        objectives: [
          "Drive {qi}'s garrisons out of {yan} by the people's rising and the states' armies",
          "Draw the masters of the hall and their pupils to {ji}",
          "Keep the masters you shelter from making {yan} the next war's pretext",
          "Make {yan}'s name the court that honors learning, so that men come from every state",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Baskets and the Jars",
        inject:
          "The master from the south, asked by the king whether {yan} should " +
          "be kept, answered that its people met {qi}'s army with baskets of " +
          "food and jars of drink to escape water and fire, and that if the " +
          "water grows deeper and the fire hotter they will turn to someone " +
          "else. Now he lays a memorial before the throne: the garrisons kill " +
          "fathers and elder brothers, bind sons and younger brothers, pull " +
          "down the ancestral temples, and carry off the vessels; the states " +
          "already fear {qi}'s strength, and a {qi} with its land doubled and " +
          "no kind rule will set every army in motion; let the king send out " +
          "an order at once, return the old and the young, leave the vessels, " +
          "consult the people of {yan}, set up a ruler, and leave. The king " +
          "does not answer it. Within ten days copies are read aloud in nine " +
          "market towns. A company at the northern camp asks its captain " +
          "whether the memorial is true. {yan}'s envoy, bowing low, sends a " +
          "gift of silk and ink to the hall. The market officers ask the " +
          "court for a warrant to enter the hall's library.",
        moveMenu: [
          "Answer the memorial with a rebuttal from the court's own masters",
          "Summon the eldest master and the master from the south to explain the memorial",
          "Forbid the copying of the memorial in the market towns",
          "Send envoys to the hall with the offer of a mansion and a teacher's seat at {ji}",
          "Double the watch: informers in the hall, spies at the northern camp",
          "Call a disputation in the hall on the taking of {yan}",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "Every Guest Expelled",
        inject:
          "The king's kinsmen at court lay a proposal before him: men of " +
          "other states who come to serve {qi} serve, for the most part, " +
          "their own lords as spies in {qi}; let every guest be expelled. A " +
          "third of the hall's masters were born in other states, four of " +
          "them in {yan}, and the chancellor's clerks report that two of the " +
          "four have written to {ji}. The generals demand that every foreign " +
          "master swear an oath to the king or be sent across the border. " +
          "The master who wrote on the hundred schools answers in the hall " +
          "that to drive out guests is to lend weapons to a bandit and carry " +
          "grain to a thief, and that no king who turned away the multitude " +
          "ever made his power plain; the eldest master refuses to administer " +
          "the oath, holding that the hall's charter binds masters to " +
          "learning and not to any crown. Pupils march to the palace gate " +
          "with the memorial held over their heads and are dispersed by the " +
          "city guard with staves. {yan}'s king proclaims that he has built a " +
          "house for a counselor and serves him as teacher, and that any " +
          "master of any state who comes to {ji} will be seated above his own " +
          "ministers.",
        moveMenu: [
          "Require the oath and expel every master who refuses it",
          "Refuse the oath and close the hall's gates to the clerks",
          "Proclaim open refuge at {ji} and send carts to the border for the masters",
          "License the hall: registered masters, approved texts, sealed lecture halls",
          "Offer the eldest master a seat among the generals in exchange for the oath",
          "Send a pupil north in secret to learn what {ji} offers",
          "Seize the hall's library and hold the books pending review",
        ],
      },
      {
        index: 3,
        title: "The Chancellor's Memorial",
        inject:
          "The chancellor lays a memorial of his own before the king. In " +
          "other times, he writes, the states contended and richly recruited " +
          "the wandering scholars; now {yan} is taken and the law should " +
          "issue from one court. The masters do not take the present as their " +
          "teacher but study antiquity to condemn the age and confuse the " +
          "common people; when an order comes down each judges it by his own " +
          "school, disapproving in his heart at court and arguing in the " +
          "lanes outside; if this is not forbidden, the king's power sinks " +
          "above and factions form below. {qin}'s chancellor who wrote the " +
          "register burned the Odes and the Documents and made the law plain, " +
          "and {qin} grew rich and strong. Let the masters' writings on " +
          "government be sent to the magistrates and burned; let those who " +
          "speak of the Odes and the Documents together be executed in the " +
          "market, those who use antiquity to condemn the present be put to " +
          "death with their clans, and the books of medicine, divination, and " +
          "planting alone be kept; let those who would learn the law take the " +
          "clerks as teachers; and let the hall be closed, since the master " +
          "from the south who called the war unjust has never been answered " +
          "and cannot be. The generals endorse it. The eldest master answers " +
          "that the hall will not surrender a single book, and that every " +
          "master will leave for {ji} together before one is burned. {yan}'s " +
          "carts wait at the border. The decision now falls to the focal " +
          "seat: is the hall funded, licensed, or closed, and what becomes of " +
          "the masters and their books?",
        moveMenu: [
          "Fund the hall as before and answer the chancellor in open disputation",
          "License the hall: registered masters, approved texts, the war not disputed",
          "Close the hall; banish the masters unharmed with their books",
          "Close the hall; send the books to the magistrates to be burned; banish the masters",
          "Adopt the chancellor's memorial whole: burn the books, execute those who dispute",
          "Execute the master from the south alone and leave the hall open",
          "Seal the northern road so no master may leave, and decide after {yan} is settled",
        ],
      },
      {
        index: 4,
        title: "The Rising in {yan}",
        inject:
          "Whatever {qi} decreed, {yan} rises. The people of {yan} turn on " +
          "the garrisons town by town, and the levies of the five cities, " +
          "which did not have to fight their way in, must now fight their " +
          "way to the walls. {zhao} and {chu} send envoys to every court to " +
          "plan the rescue of {yan}. The north road fills with carts: some " +
          "masters under banishment, some in fear, some because {ji}'s gifts " +
          "are rich. A guard at the border stops a cart and finds the hall's " +
          "oldest commentaries hidden under millet. At the northern camp a " +
          "captain is flogged for reading the memorial to his company. " +
          "{yan}'s king receives the first masters in person and seats them " +
          "above his own ministers. A magistrate trained at the hall returns " +
          "his seal in protest, and twenty others are said to be writing " +
          "theirs.",
        moveMenu: [
          "Let the masters go and keep the books",
          "Seal the border and turn back every cart",
          "Proclaim a pardon for masters who return and swear the oath",
          "Proclaim death for any master who teaches at a foreign court",
          "Receive every master at {ji} and proclaim a hall in exile",
          "Send the king's own envoy to {ji} to open a channel between the two kings",
        ],
      },
      {
        index: 5,
        title: "Three Nights at the Gate",
        inject:
          "The master from the south resigns his rank and sets out; he stops " +
          "three nights at a town a day's march from {linzi} in the hope of " +
          "being recalled, and the hall's pupils count the nights. The king " +
          "says before the court that he is ashamed before the master; a " +
          "courtier answers that the sages of old also erred and that the " +
          "king need not trouble himself. The king sends word offering the " +
          "master a mansion in the capital and ten thousand measures of grain " +
          "to keep his disciples, if he will stay and say nothing more of " +
          "{yan}. The states' envoys meet and name the season their levies " +
          "will march. {yan}'s king, with the first masters seated around " +
          "him, offers {qi} a covenant and the vessels' return if the " +
          "garrisons leave before the thaw; the generals call it a surrender, " +
          "and the chancellor calls the master's three nights a provocation. " +
          "The spring campaign opens in forty days.",
        moveMenu: [
          "Send out the order: return the old and the young, leave the vessels, set up a ruler, and leave",
          "Hold the cities and meet the states' armies in {yan}",
          "Recall the master with the mansion and the grain, and reopen the hall on his terms",
          "Let the master go and keep the hall under license",
          "Accept {yan}'s covenant as cover to bring the levies home whole",
          "Send the masters at {ji} as envoys to the states to hold their armies back",
        ],
      },
      {
        index: 6,
        title: "The Roll of Upper Grandees",
        inject:
          "The spring roll of the hall is drawn up, and the names on it " +
          "answer whoever pays the stipends. Whatever mix of charter, " +
          "license, banishment, and exile now exists is hardening into the " +
          "custom of two courts. Each court must decide the posture it " +
          "carries out of the crisis: what is written into the hall's charter " +
          "and into covenant with {yan}, what is quietly dropped, and what " +
          "lines it proclaims for the next generation of masters, who will " +
          "learn at {linzi} or at {ji}. The chroniclers will write down this " +
          "turn as the settlement, whether or not anything is sealed.",
        moveMenu: [
          "Write the present arrangement into the hall's charter and a covenant with {yan}",
          "Proclaim the law taught by clerks alone and the hall closed for good",
          "Keep the clerks and the border guard at full watch without end",
          "Stand down on terms of reciprocity: no master poached, no master punished",
          "Claim victory and tell the story at home",
        ],
      },
    ],
  },
  zh: {
    title: "{jixia}",
    summary:
      "{qi}是诸国中最富的一国，两代以来在{linzi}城门之下的{jixia}以公帑供养百家" +
      "学者：七十六人赐列第、为上大夫，其下又有数百人，职在议论而不在治事。今年" +
      "{yan}王把王位让给大臣，朝廷陷入内乱，王发五都之兵北伐{yan}；{yan}士卒不战，" +
      "城门不闭，五旬而举其国。如今堂中一位先生当面对王说，违民而据{yan}，是以" +
      "{yan}伐{yan}；{yan}民正在各城蠢动反抗戍卒；诸侯谋救{yan}；{yan}的公子被残余" +
      "的朝廷立为王，卑身厚币，以招任何肯到{ji}去的先生。每一席位每回合收到情势" +
      "通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：先生们议论，朝廷听或不听",
      "谏诤：上书、驳议与堂中论辩",
      "给牒：先生登籍，书目经核准，不得议论此战",
      "收书：书籍送交官府，禁止传抄，市中禁言",
      "逐客：外国先生驱出国境，凡客者逐",
      "诛杀：先生因其所著弃市，族及其家",
      "闭堂焚书；法令只由官吏传授",
      "流亡于外国朝廷的先生们引诸侯之师伐{qi}",
    ],
    seats: [
      {
        id: "qi",
        name: "{qi}",
        state: "qi",
        brief:
          "本章开始时，你们的戍卒驻在{yan}的各城，而城门之下的学堂已经分裂。你们" +
          "听命于一位君王，他趁{yan}王位让于大臣、朝廷陷于争战之际发五都之兵北上；" +
          "五旬而举其国，王说单凭人力做不到这一步，他打算据而有之。你们所掌的是" +
          "相府、市吏、都城之卫、粮仓，以及学堂的廪禄。学堂是先王的骄傲：七十六位" +
          "先生位列上大夫，以公帑供养居住，可以议论，也可以辞官不受。如今其中一位" +
          "对王说，取{yan}的凭据是{yan}民之悦，而那悦已不在；他的话在各市邑被人诵读，" +
          "北营的士卒问为什么要据守一个不要他们的国家。诸侯正在会集。你们必须在{yan}" +
          "的去留未定之时，不让国家的声音分裂。",
        objectives: [
          "在诸侯之师到来之前，据有{yan}，或按{qi}的条件离开",
          "不让学堂的学问与名声流向{ji}",
          "不经一场会被史官记下的清洗，保持{linzi}与各市邑的秩序",
          "保全王室在先生们与民众之中的声望",
        ],
      },
      {
        id: "jixia",
        name: "{jixia}",
        state: "jixia",
        brief:
          "本章开始时，相府的属吏已到你们门前。最年长的先生主持堂中；你们不听命于" +
          "任何君王，这既是你们的章程，也是你们的危险。你们之中七十六人以上大夫之位" +
          "居于城门之下的列第；三分之一生于他国，四人生于{yan}。你们之中有一位，" +
          "那位来自南方的先生，对王说以{yan}民之悦取{yan}则可，违其民而据之则不可，" +
          "王没有答复他；他的话正在每一个市邑被传抄，将军们追问是谁把它传了出去。" +
          "你们不掌一兵一卒；你们掌握的是你们教出的县令，以及每一个想有自己学堂的" +
          "朝廷的敬意。你们认为学堂不言则无以为学堂；你们也认为，一座在{ji}的学堂，" +
          "是一座没有国家的书库。",
        objectives: [
          "保全学堂议论、论辩与谏诤的自由",
          "保全先生们的性命，不被放逐，其书不被焚毁",
          "不让学堂沦为任何朝廷的工具，无论是{qi}的还是{yan}的",
          "避免一场使诸学派绝于一代的清洗",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "本章开始时，{qi}的戍卒驻在你们的各城，一位公子被残余的朝廷立为王。先王把" +
          "王位让给了大臣；太子与一位将军起兵攻大臣，构难数月，死者数万；随后{qi}的" +
          "五都之兵北来，你们的士卒不战，城门不闭，那位大臣被剁成肉酱，先王被杀。" +
          "你们有一座烧过的都城，兵员寥寥，以及如今每一个朝廷都有的对{qi}的惧怕。" +
          "你们的王卑身厚币：他为第一位来投的谋臣改筑了宫室，以师礼事之，好让胜过他" +
          "十倍的人从千里之外赶来。每一位离开{jixia}前往{ji}的先生都削弱{qi}而抬高" +
          "你们，而在{qi}各市邑被诵读的那篇上书，对你们抵得上一支纵队。你们必须在" +
          "各城获释之前招来先生、鼓动诸侯，又不让人看出你们在做这两件事。",
        objectives: [
          "借民众起事与诸侯之师，把{qi}的戍卒逐出{yan}",
          "把学堂的先生们及其弟子招到{ji}",
          "不让你们收留的先生使{yan}成为下一场战争的口实",
          "使{yan}以尊崇学问的朝廷闻名，令各国之士争相而来",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "箪食壶浆",
        inject:
          "那位来自南方的先生，当王问他{yan}是否当据有时，答道：{yan}民箪食壶浆以迎" +
          "{qi}师，是为了避水火；如水益深，如火益热，民亦将转而投奔他人。如今他上书" +
          "于王：戍卒杀其父兄，系累其子弟，毁其宗庙，迁其重器；天下本已惧{qi}之强，" +
          "{qi}倍地而不行仁政，是动天下之兵；请王速出令，反其旄倪，止其重器，谋于" +
          "{yan}众，置君而后去之。王不答。十日之内，九个市邑有人诵读它的抄本。北营的" +
          "一队士卒问他们的队长，上书所言是否属实。{yan}的使者卑身低首，向学堂送来" +
          "丝帛与墨的礼物。市吏向朝廷请求进入学堂书库的文书。",
        moveMenu: [
          "以朝廷自己的先生作驳议，答复这篇上书",
          "召最年长的先生与南方来的先生入朝，解释这篇上书",
          "禁止各市邑传抄这篇上书",
          "遣使入学堂，许以宅第与{ji}的师席",
          "加倍戒备：学堂中布置告发者，北营中布置细作",
          "在堂中召开一场关于取{yan}的论辩",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "一切逐客",
        inject:
          "王的宗亲大臣向王进言：他国之人来事{qi}者，大抵为其主在{qi}游间而已，请一切" +
          "逐客。学堂的先生有三分之一生于他国，其中四人生于{yan}；相府的属吏报告，四人" +
          "之中有两人曾致书{ji}。将军们要求每一位外国先生向王起誓，否则送出国境。那位" +
          "著书论百家的先生在堂中答道：逐客是藉寇兵而赍盗粮，从无却众庶而能明其德的" +
          "王者；最年长的先生拒绝主持誓礼，认为学堂的章程把先生系于学问，而不系于" +
          "任何王室。弟子们把上书举过头顶，列队走到宫门，被都城之卫以杖驱散。{yan}王" +
          "宣告，他已为一位谋臣筑宫而以师礼事之，凡任何国家的先生来到{ji}，都将坐在他" +
          "本国大臣之上。",
        moveMenu: [
          "要求起誓，并驱逐每一位拒绝的先生",
          "拒绝起誓，向属吏关闭学堂之门",
          "宣告{ji}开门收容，并派车至边境迎接先生们",
          "给学堂发牒：先生登籍，书目核准，讲堂封管",
          "以将军之列中的一席，换取最年长的先生起誓",
          "密遣一名弟子北上，探听{ji}开出的条件",
          "查封学堂书库，扣留书籍以待审阅",
        ],
      },
      {
        index: 3,
        title: "相邦的上书",
        inject:
          "相邦向王呈上自己的一篇上书。他写道：异时诸侯并争，厚招游学；今{yan}已取，" +
          "法令当出于一朝。诸先生不师今而学古，以非当世，惑乱黔首；令下，则各以其学" +
          "议之，入则心非，出则巷议；如此弗禁，则主势降乎上，党与成乎下。{qin}那位" +
          "写下籍册的相邦燔诗书而明法令，{qin}由此富强。请将先生们论政之书送交县令" +
          "焚毁；有敢偶语诗书者弃市，以古非今者族，所不去者唯医药、卜筮、种树之书；" +
          "欲学法令者，以吏为师；并请闭堂，因为那位称此战不义的南方先生从未被答复，" +
          "也无法被答复。将军们附议。最年长的先生答道：学堂一书不交，宁可在一书被焚" +
          "之前，全体先生一同前往{ji}。{yan}的车马候在边境。决定现在落到焦点席位：" +
          "学堂是供养、发牒，还是关闭？先生们与他们的书又将如何？",
        moveMenu: [
          "照旧供养学堂，并在公开论辩中答复相邦",
          "给学堂发牒：先生登籍，书目核准，不得议论此战",
          "关闭学堂；放逐先生们，任其携书而去，人与书皆不加损伤",
          "关闭学堂；将书送交县令焚毁；放逐先生们",
          "全盘采纳相邦的上书：焚书，诛杀议论者",
          "只处死那位南方来的先生，学堂照开",
          "封闭北路，不许任何先生离去，待{yan}事定后再决",
        ],
      },
      {
        index: 4,
        title: "{yan}人起事",
        inject:
          "无论{qi}如何决断，{yan}都起事了。{yan}民一城接一城地反抗戍卒；五都之兵当初" +
          "不战而入，如今必须且战且退才能回到城墙之内。{zhao}与{chu}遣使至各国朝廷，" +
          "共谋救{yan}。北路上车马塞道：有的先生被放逐，有的出于恐惧，有的因为{ji}的" +
          "厚币。边境的一名守卒拦下一辆车，在粟米之下搜出学堂最古老的注疏。北营的一名" +
          "队长因向本队诵读上书而受鞭刑。{yan}王亲自接见最先到达的先生们，让他们坐在" +
          "本国大臣之上。学堂教出的一位县令以辞印相抗，据说另有二十位正在写辞呈。",
        moveMenu: [
          "放先生们走，留下书",
          "封闭边境，拦回每一辆车",
          "宣布赦免归来并起誓的先生",
          "宣布凡在外国朝廷讲学的先生处死",
          "在{ji}接纳每一位先生，宣告流亡学堂成立",
          "遣王的专使赴{ji}，在两王之间开辟渠道",
        ],
      },
      {
        index: 5,
        title: "三宿于门",
        inject:
          "那位南方来的先生辞去爵位启程；他在离{linzi}一舍之地的一座邑中留宿三夜，盼望" +
          "被召回，学堂的弟子们数着夜数。王在朝中说，他在先生面前深感惭愧；一位近臣" +
          "答道，古之圣人也有过失，王不必介怀。王遣人传话，愿授先生国中宅第，以万钟" +
          "养其弟子，只要他留下，不再论{yan}事。诸侯的使者会集，定下各国兵员出发的" +
          "季节。{yan}王在最先到达的先生们环坐之中向{qi}提出：若戍卒在解冻之前撤走，" +
          "便归还重器、结为会盟；将军们称之为投降，相邦称先生的三宿是挑衅。春季" +
          "征战四十日后开始。",
        moveMenu: [
          "发出命令：反其旄倪，止其重器，置君而后去之",
          "据守各城，在{yan}迎战诸侯之师",
          "以宅第与粟召回先生，按他的条件重开学堂",
          "放先生走，学堂按牒照开",
          "接受{yan}的会盟，以此为掩护把兵员完整带回",
          "派{ji}的先生们出使各国，劝住诸侯之师",
        ],
      },
      {
        index: 6,
        title: "上大夫之列",
        inject:
          "学堂的春季名册拟定，册上之名听命于发放廪禄的人。无论章程、文牒、放逐与流亡" +
          "如今是何种混合，它正在凝成两个朝廷的惯例。每一个朝廷都必须决定它从这场危机" +
          "中带走的态势：什么写进学堂的章程与同{yan}的盟约，什么悄悄放弃，以及为下一代" +
          "先生宣告何种界线，那一代人将在{linzi}或在{ji}求学。无论是否有任何东西被" +
          "封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "把目前的安排写进学堂的章程与同{yan}的盟约",
          "宣告法令只由官吏传授，学堂永久关闭",
          "让属吏与边境守卒无限期保持戒备",
          "以互惠为条件解除戒备：不挖走先生，也不惩治先生",
          "宣称胜利，在国内讲述这个故事",
        ],
      },
    ],
  },
};

export const SCHOOLS_OF_THE_HUNDRED = buildChapter(SCHOOLS_OF_THE_HUNDRED_TEXT);
