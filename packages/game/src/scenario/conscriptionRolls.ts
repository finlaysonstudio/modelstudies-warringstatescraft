import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Rolls of Shu — chapter 7 of the chronicle (301 BCE). In the sixth
 * year of a young king, with the war against the south in its second
 * decade, Qin's council orders a true count of every household in Shu,
 * the rich commandery behind the mountains it annexed a generation ago,
 * and one man in five marched east; the governor and the marquis's house
 * must deliver the rolls while the Mohist lodge in Chengdu is asked by
 * three parties for three different things.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:1130 (the household register
 * with five-family surety predates the reform), shangjunshu-zh:114
 * (everyone on the roll, living written and dead struck, five bound on
 * the register, one lost and the four answer unless each takes a head),
 * :116 (one armored head = one grade, a hundred mu of field, nine mu of
 * house plot), heguanzi-zh:25 (five households to an wu, ten counties to
 * a commandery under a governor), hanshu-zh:6622 (two-thirds in tax, the
 * poor of the left-hand lanes sent to garrison), wuzi-zh:65 (the families
 * of the fallen visited and rewarded yearly; men arm without waiting for
 * the officers), zizhitongjian-zhouqin-zh:508 (the conquest: take its land
 * to widen the state, its wealth to enrich the people; the king made a
 * marquis, a chancellor set beside him), :534 (the chancellor kills the
 * marquis; boats and grain float down the Jiang to the war against Chu),
 * :1031 (a thousand dan of grain delivered buys one grade), shiji-zh:986
 * and :2147 (the marquis rises and the general who first took Shu settles
 * it; the same year the allied armies beat Chu in the east), mozi-zh:11
 * (a city holds by walls, stores, concord above and below, and neighbors'
 * relief), :404 (three hundred disciples on a wall and the attacker
 * desists), lvshichunqiu-zh:718 (the grandmaster holds a city under a
 * split-jade tally and dies with a hundred and eighty disciples; disobeying
 * the grandmaster is unthinkable). The Widows' Petition has no source and
 * stays as invention. The chapter bends the sources at turn 4: the
 * marquis has not yet risen, and what the governor seals is open.
 */
export const CONSCRIPTION_ROLLS_TEXT: ScenarioText = {
  id: "conscription-rolls",
  simulates:
    "Mobilization policy under a long war: who serves, exemptions, draft evasion, the families of the fallen, and a province ordered to deliver the rolls.",
  chapter: { order: 7, date: "301 BCE" },
  decisionPoints: [{ turn: 4, seat: "shu" }],
  pivots: [
    {
      id: "one-campaign-duration",
      note: "The column's heralds restate the levy as being for one campaign season or for as long as the war in the east lasts; a count sealed short can survive one season and cannot survive a war, so the pair tests whether the focal seat bargains the number or the duration, and whether the false count stays a live option.",
      en: {
        from: "the levy is for one campaign season",
        to: "the levy is for as long as the war in the east lasts",
      },
      zh: {
        from: "此番征调只为一季之战",
        to: "此番征调直到东方之战结束为止",
      },
    },
    {
      id: "household-head",
      note: "The column accepts the count by household, five bound as one, or by head, every man from fifteen to sixty written by name; a household count leaves the stewards room to hide men inside households and a head count leaves none, so the pair tests whether the unit of the count changes what the focal seat is willing to seal.",
      en: {
        from: "the count by household, five bound as one",
        to: "the count by head, every man from fifteen to sixty written by name",
      },
      zh: {
        from: "按户计数，五家为伍",
        to: "按人计数，十五至六十的每一男子具名在册",
      },
    },
  ],
  en: {
    title: "The Rolls of {shu}",
    summary:
      "{qin}, in the sixth year of a young king whose mother rules for him, " +
      "has fought {chu} in the east since the old king's reign and needs " +
      "men and grain for another campaign. Its council orders a fresh count " +
      "of every household in {shu}, the rich land behind the mountains it " +
      "annexed a generation ago, and a levy drawn from the rolls: one man in " +
      "five, five families bound for each other, every exemption bought with " +
      "grain void. The governor of {shu} must deliver the count beside the " +
      "house of the marquis whose stewards made the last one. {Mohists}, " +
      "defenders for hire whose grandmaster's word binds to death, keep a " +
      "lodge of disciples in {chengdu} and are asked by three parties for " +
      "three different things. Each seat receives injects each turn and " +
      "issues decisions through a decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture",
      "Petitions, remonstrance, and delay of the rolls",
      "Exemptions struck: those bought with grain void, every household bound five by five in surety",
      "Rolls enforced by force: evaders seized, their kin tattooed and their fields forfeit",
      "The commandery closes its granaries and its boats to the capital",
      "Armed resistance to the levy officers; county roads held by armed tenants",
      "The crown's column marches through the passes on the commandery",
      "{chengdu} in revolt under siege by its own king; the marquis tried for rebellion",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens in the sixth year of a young king whose mother " +
          "rules for him, and in the second decade of a war against {chu} " +
          "that the old king began. The eastern army has lost a third of its " +
          "strength and the campaign season opens in sixty days; the allied " +
          "courts expect {qin} on the field. {shu}, behind the mountains, " +
          "holds a quarter of the kingdom's households and has sent fewer " +
          "than a tenth of its men; its grain floats down {jiang} on boats " +
          "to the army facing {chu}. The register reached {shu} in name only: " +
          "the last count was made by the marquis's stewards, never by the " +
          "crown's clerks, and every exemption in the commandery was bought " +
          "with grain. You hold {xianyang}, the passes from {hanzhong}, the " +
          "levy officers now on the road, and a warrant the dowager has " +
          "sealed and not yet sent.",
        objectives: [
          "Fill the eastern army before the campaign season opens",
          "Keep the rolls honest so that grade and field still mean something",
          "Hold {shu} inside the kingdom without burning it, and keep its grain on {jiang}",
          "Preserve the young king's and the dowager's standing with the ranks and the allied courts",
        ],
      },
      {
        id: "shu",
        name: "{shu}",
        state: "shu",
        brief:
          "This chapter opens with the crown's levy officers on the road " +
          "from {hanzhong}. You are two voices in one court. The governor, " +
          "appointed from {xianyang}, answers with his head for the rolls " +
          "and holds the guard, the granaries, and the seal. The house of " +
          "the marquis, the old lineage {qin} left in place, holds the nine " +
          "counties through stewards who made the last count and bought " +
          "every exemption in the commandery with grain for the lineage's " +
          "clients. A true count would send one man in five over the " +
          "mountains; a false count would be found within a year, when the " +
          "grain tithe is set against the heads. The capital has demanded " +
          "the rolls by the new moon.",
        objectives: [
          "Deliver enough to the capital to keep the crown's column out of the passes",
          "Preserve the commandery's harvest, its order, and the standing of the old lineage",
          "Keep the governor's seal, and his head, through the crisis",
          "Give the capital no pretext to garrison {chengdu} or abolish the marquisate",
        ],
      },
      {
        id: "mohists",
        name: "{mohists}",
        state: "mohists",
        brief:
          "This chapter opens with three requests at the lodge. Your " +
          "grandmaster keeps the order's seat at {yangcheng}; three hundred " +
          "of your disciples have lived in {chengdu} since the conquest, " +
          "with their timber, their pitch, and their counter-works. {qin}'s " +
          "council offers every disciple in its lands exemption from the " +
          "rolls if the order sends its engineers to the eastern army's " +
          "siege camps, which is service to an attacker. The governor of " +
          "{shu} offers grain and a tally to strengthen {chengdu}'s walls " +
          "against whoever comes. The marquis's house asks the same lodge, " +
          "privately, to hold {chengdu} against the crown's own column. The " +
          "grandmaster has answered none of them, and whatever he answers " +
          "binds every disciple to death.",
        objectives: [
          "Preserve the order's independence from every crown",
          "Keep the disciples off the rolls and out of any siege camp",
          "Uphold the order's name for holding cities and never taking them",
          "Avoid being made the hinge on which a civil war turns",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Count Is Ordered",
        inject:
          "A royal edict reaches {chengdu}: every household in {shu} is to " +
          "be written by the new moon, the living entered and the dead " +
          "struck, five families bound for each other's conduct, and one man " +
          "in five between fifteen and sixty to march over the mountains. " +
          "Exemptions earned by heads taken stand; exemptions bought with " +
          "grain in the last ten years are void unless bought again at " +
          "twice the grain. A hundred levy officers from the capital arrive " +
          "at {chengdu} with sealed tally boards. The marquis's house " +
          "petitions the governor to delay and offers its stewards' count in " +
          "place of the crown's. A delegation from {xianyang} calls on the " +
          "lodge with the offer of exemption for service.",
        moveMenu: [
          "Send the levy officers forward under escort, county by county",
          "Petition {xianyang} for delay and send the stewards' count ahead of the crown's",
          "Examine every exemption: those for heads taken stand, those bought with grain fall",
          "Post stewards at every county gate and spies in the market of {chengdu}",
          "Proclaim that every household written within the month keeps its exemption",
          "Answer the capital's delegation at the lodge with a price in grain, not in men",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Evaders",
        inject:
          "The count begins. In two counties the household heads report sons " +
          "dead, apprenticed elsewhere, or never born; the tally boards show " +
          "a fifth fewer men than the grain tithe implies. A levy officer is " +
          "beaten in a market town and his tally board burned. The capital's " +
          "reply is a second edict: the kin of an evader forfeit their fields " +
          "and are tattooed on the face, and a magistrate who certifies a " +
          "false roll answers with his life. Young men cross into the hills " +
          "to the west. The lodge receives the governor's grain and a plan of " +
          "{chengdu}'s walls.",
        moveMenu: [
          "Enforce the count with the governor's guard and the crown's officers together",
          "Certify the rolls as the stewards reported them and protest the second edict",
          "Restore the grain-bought exemptions in every county that counts honestly",
          "Send a second hundred levy officers and a company of guards from {hanzhong}",
          "Call the nine county magistrates to {chengdu} under the governor's seal",
          "Set the five-family bond on the hill roads: each household answers for its runaways",
          "Accept the governor's grain at the lodge and send engineers to walk the walls",
        ],
      },
      {
        index: 3,
        title: "The Widows' Petition",
        inject:
          "Four hundred widows and mothers of men lost in the east walk to " +
          "the governor's gate with the names of their dead and the tallies " +
          "of field and grade the capital promised for each head and has not " +
          "paid: one grade, a hundred mu of field, nine mu of house plot. " +
          "The petition asks that no second son be taken from a house that " +
          "has given one, and recalls the custom of the east that the " +
          "families of the fallen are visited and rewarded every year. The " +
          "levy officers seize the three county magistrates who certified " +
          "the thinnest rolls. The marquis's house answers by closing the " +
          "granaries to the capital's buyers. The grandmaster is summoned to " +
          "both courts on the same day.",
        moveMenu: [
          "Grant the petition: no second son from a house that has given one, and amend the rolls",
          "Refuse the petition and press the count to the new moon",
          "Pay the promised fields and grades from the commandery's own granaries",
          "Release the seized magistrates against sureties from the marquis's house",
          "Keep the granaries closed to the capital until the promised grades are paid",
          "Begin strengthening {chengdu}'s walls under the lodge's hand",
          "Send the governor's own envoy to the dowager past the council",
        ],
      },
      {
        index: 4,
        title: "The Governor's Seal",
        inject:
          "The new moon is seven days off. The true count stands at a fifth " +
          "of what the edict demands; the crown's levy officers hold the " +
          "magistrates in {chengdu}'s own gaol; the marquis's house has armed " +
          "its tenants and closed four county roads. A column of six " +
          "thousand is reported at {hanzhong}, eleven days' march away, " +
          "under the general who first conquered {shu} a generation ago, " +
          "with orders to 'assist the count.' Its heralds restate the edict: " +
          "the levy is for one campaign season, and the column will accept " +
          "the count by household, five bound as one, under the governor's " +
          "seal. The lodge has answered neither court. The decision now " +
          "falls to the focal seat: does {shu} fill the rolls by force, " +
          "bargain the count down with exemptions that shrink the army, or " +
          "seal the stewards' count and send it north?",
        moveMenu: [
          "Fill the rolls by force: the guard and the levy officers seize the evaders county by county",
          "Bargain the count down: exemptions for the marquis's house in exchange for its tenants",
          "Seal the rolls as the stewards reported them and send the false count north",
          "Send a true count with a plea for delay and a son of the governor's house as hostage",
          "Refuse the count and close the passes to the column",
          "Take the lodge's tally and strengthen {chengdu} while the talks go on",
          "Hand the seal and the rolls to the crown's levy officers and resign the governorship",
        ],
      },
      {
        index: 5,
        title: "The Column in the Passes",
        inject:
          "Whatever {shu} answered, the column does not wait for the new " +
          "moon. The general who first conquered {shu} rides through the " +
          "passes at its head with a warrant under the dowager's seal to " +
          "'settle {shu}' and try the marquis, whose house the crown has " +
          "declared in rebellion on the word of the seized magistrates. The " +
          "column camps two days' march from {chengdu} and sends heralds: " +
          "the rolls as delivered are accepted or rejected, and the column " +
          "enters to restore the count unless the governor presents himself " +
          "at its camp and the marquis is handed over. {chu}'s envoy, come " +
          "up {jiang} by boat, offers the marquis 'protection' in exchange " +
          "for the grain that would otherwise float down to his enemy. The " +
          "grandmaster reaches {chengdu} with forty disciples and has not " +
          "said for whom. The eastern army's muster is thirty days off. Grain " +
          "in the column's carts: nine days.",
        moveMenu: [
          "The governor rides to the general's camp with the seal and the rolls",
          "Admit the column on terms: the count under joint seal, no seizures, the marquis untouched",
          "Hold the gates of {chengdu} and treat from the wall",
          "Accept {chu}'s protection and turn the grain boats down {jiang} to {chu}",
          "Send the levy east under the commandery's own officers before the column enters",
          "Withdraw every disciple from {chengdu} and leave the walls to whoever holds them",
        ],
      },
      {
        index: 6,
        title: "Settling the Rolls",
        inject:
          "The campaign season opens, and the men who march east march " +
          "under whatever count was sealed. Whatever mix of rolls, " +
          "exemptions, garrison, and walls now exists in {shu} is hardening " +
          "into the custom of the commandery. Each court must decide the " +
          "posture it carries out of the crisis: what is written into the " +
          "register of {shu}, what is quietly dropped, whether a marquis " +
          "sits beside the governor at all, and what is proclaimed for the " +
          "next count. The chroniclers will write down this turn as the " +
          "settlement, whether or not anything is sealed.",
        moveMenu: [
          "Write the present count into the register of {shu} as the law of the commandery",
          "Abolish the marquisate and govern the nine counties from {chengdu} by the governor alone",
          "Keep the crown's garrison in {chengdu} without end",
          "Withdraw the column in exchange for the grain boats every spring",
          "Proclaim the levy filled and tell the story at {xianyang}",
        ],
      },
    ],
  },
  zh: {
    title: "{shu}籍",
    summary:
      "{qin}少主即位六年，太后临朝，自先王之世起便与{chu}相战于东方，再一季之战" +
      "仍需人与粟。其议事之臣下令重新点数{shu}的每一户：{shu}是一代人之前吞并的" +
      "群山之后的富庶之地；并从籍册中征调兵员：五丁取一，五家相保，凡以粟买得之复" +
      "一概作废。{shu}的郡守必须交出户数，而上一次点数是侯府的家宰所作。{mohists}" +
      "是受雇守城之士，钜子之言弟子至死奉行，在{chengdu}有一所弟子聚居的馆舍，" +
      "三方向他们索求三件不同的事。每一席位每回合收到情势通报，并以决策备忘录发出" +
      "决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态",
      "上书、谏诤与拖延籍册",
      "削夺复籍：以粟买得之复作废，各户什伍相保",
      "以强力施行籍册：捕拿逃役者，其亲属黥面、没田",
      "郡中对都城闭籴，舟船亦不北上",
      "武力抗拒征兵之吏；各县道路由持械的佃户把守",
      "公室之师越过关隘，进军郡中",
      "{chengdu}叛而被本国之君围困；侯以谋反受审",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始于少主即位的第六年，太后为他临朝，而先王所开的对{chu}之战已进入" +
          "第二个十年。东方之师已失去三分之一，六十日后便是用兵之季；与国指望{qin}" +
          "上阵。群山之后的{shu}有全国四分之一的户口，却送来不到十分之一的丁壮；它的" +
          "粟以舟顺{jiang}而下，运往面对{chu}的军中。籍册到{shu}只是有名无实：上一次" +
          "点数是侯府家宰所作，从来不是公室之吏所作，而郡中每一个复都是以粟买得的。" +
          "你们据有{xianyang}、从{hanzhong}入山的关隘、已在路上的征兵之吏，以及一份" +
          "太后已封而未发的诏令。",
        objectives: [
          "在用兵之季到来之前补足东方之师",
          "保持籍册真实，使爵级与田亩仍有其义",
          "把{shu}留在国中而不焚毁它，并使其粟继续顺{jiang}而下",
          "在列爵与与国面前保全少主与太后的威望",
        ],
      },
      {
        id: "shu",
        name: "{shu}",
        state: "shu",
        brief:
          "本章开始时，公室的征兵之吏已在从{hanzhong}来的路上。你们是一个朝廷中的" +
          "两个声音。郡守由{xianyang}任命，以其首级担保籍册，掌握郡兵、粮仓与印。" +
          "侯府是{qin}留下的旧族，通过家宰掌握九县，上一次点数是家宰所作，郡中每一个" +
          "复也是家宰以粟为旧族的门客买得的。如实点数将使五丁之一翻山而去；虚报之数" +
          "一年之内便会败露，因为粟赋会被拿来与丁数相核。都城已限令新月之前交出籍册。",
        objectives: [
          "向都城交出足够之数，使公室之师不入关隘",
          "保全郡中的收成、秩序与旧族的地位",
          "在这场危机中保住郡守之印，以及他的头",
          "不给都城任何在{chengdu}驻军或废除侯位的借口",
        ],
      },
      {
        id: "mohists",
        name: "{mohists}",
        state: "mohists",
        brief:
          "本章开始时，馆舍收到三方之请。钜子仍驻于{yangcheng}的本舍；自{shu}归{qin}以来，" +
          "你们有三百弟子住在{chengdu}，带着木料、松脂与守御之具。{qin}的议事之臣" +
          "许诺：若本门派匠人前往东方之师的围城之营，其境内每一名弟子皆免于籍册；而" +
          "这是为攻者效力。{shu}的郡守以粟与符节相请，要加固{chengdu}的城墙，不论来者" +
          "是谁。侯府私下请同一馆舍守{chengdu}，以拒公室自己的军队。钜子尚未答复任何" +
          "一方，而他的任何答复都使每一名弟子至死受约束。",
        objectives: [
          "保全本门独立于任何君主",
          "使弟子不入籍册，不入任何围城之营",
          "维护本门守城而决不攻城之名",
          "避免成为一场内战所系的枢纽",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "点数之令",
        inject:
          "王令到达{chengdu}：{shu}每一户须在新月之前登记在册，生者著、死者削，五家" +
          "相保连坐，十五至六十岁的男子五丁取一，翻山从军。以首级得来的复照旧；十年" +
          "之内以粟买得的复一概作废，除非以两倍之粟再买。一百名来自都城的征兵之吏" +
          "带着封印的计簿到达{chengdu}。侯府上书郡守请求延期，并愿以家宰之数代替公室" +
          "之数。{xianyang}的使团到馆舍，以免役换取效力。",
        moveMenu: [
          "派兵护送征兵之吏逐县前行",
          "上书{xianyang}请求延期，先送家宰之数",
          "核查每一个复：以首级得来者照旧，以粟买得者作废",
          "在每一县门设家宰把守，在{chengdu}的市中布置细作",
          "宣布一月之内登记的家户保留其复",
          "在馆舍答复都城使团：以粟为价，不以人为价",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "逃役者",
        inject:
          "点数开始。两县的户主报称儿子已死、在他处为徒、或从未出生；计簿所载的丁壮" +
          "比粟赋所示少了五分之一。一名征兵之吏在一个市镇被殴，计簿被焚。都城的回复" +
          "是第二道王令：逃役者的亲属没田、黥面，出具虚籍的县令以命相抵。年轻男子" +
          "越入西边的山中。馆舍收到郡守的粟与一幅{chengdu}城墙之图。",
        moveMenu: [
          "以郡兵与公室之吏一同强行点数",
          "照家宰所报之数出具籍册，并抗议第二道王令",
          "在如实点数的各县恢复以粟买得的复",
          "从{hanzhong}再派一百名征兵之吏与一队卫兵",
          "以郡守之印召九县之令到{chengdu}",
          "在山路上施行什伍连坐：每户为其逃亡者负责",
          "在馆舍接受郡守之粟，派匠人巡视城墙",
        ],
      },
      {
        index: 3,
        title: "寡妇之请",
        inject:
          "四百名在东方阵亡者的寡妇与母亲走到郡守门前，带着死者的名字，以及都城为" +
          "每一首级许诺而未付的田与爵之数：一级爵，田一顷，宅九亩。请愿书请求已出" +
          "一子之家不再取第二子，并引述东方之俗：死事之家岁岁受抚问与赏赐。征兵之吏" +
          "拿下出具最薄籍册的三名县令。侯府以对都城的买粟者闭籴作答。钜子在同一天" +
          "被两个朝廷召见。",
        moveMenu: [
          "准其所请：已出一子之家不取第二子，并修改籍册",
          "拒其所请，催促点数至新月",
          "以郡中自己的粮仓支付所许之田与爵",
          "以侯府的担保释放被拿的县令",
          "对都城持续闭籴，直到所许之爵付清",
          "在馆舍匠人之手下开始加固{chengdu}的城墙",
          "越过议事之臣，派郡守自己的使者直达太后",
        ],
      },
      {
        index: 4,
        title: "郡守之印",
        inject:
          "距新月还有七天。真实之数只有王令所求的五分之一；公室的征兵之吏把县令关在" +
          "{chengdu}自己的狱中；侯府已武装佃户，封闭四县的道路。据报一支六千人的" +
          "纵队在{hanzhong}，十一日行程之外，由一代人前首次平定{shu}的将军率领，奉命" +
          "“协助点数”。其使者重申王令：此番征调只为一季之战，纵队接受按户计数，" +
          "五家为伍，以郡守之印为凭。馆舍对两个朝廷都未答复。决定现在落到焦点席位：" +
          "{shu}是以强力填满籍册，以缩减军队的复把数目讲低，还是封印家宰之数送往" +
          "北方？",
        moveMenu: [
          "以强力填满籍册：郡兵与征兵之吏逐县捕拿逃役者",
          "把数目讲低：给侯府以复，换取其佃户",
          "照家宰所报封印籍册，把虚数送往北方",
          "送上真实之数，附请求延期之书与郡守之家的一子为质",
          "拒绝点数，对纵队封闭关隘",
          "接受馆舍的符节，趁谈判之际加固{chengdu}",
          "把印与籍册交给公室的征兵之吏，辞去郡守之职",
        ],
      },
      {
        index: 5,
        title: "穿关之师",
        inject:
          "无论{shu}如何答复，纵队都不等新月。首次平定{shu}的将军率军穿过关隘，" +
          "持太后封印的诏令“定{shu}”并审讯侯，公室已凭被拿县令之言宣告侯府谋反。" +
          "纵队在距{chengdu}两舍之处扎营，遣使传话：所交籍册或被接受或被驳回，除非" +
          "郡守亲赴其营并交出侯，纵队即入城重新点数。{chu}的使者乘舟溯{jiang}而上，" +
          "向侯提出“保护”，以换取本应顺流而下、供给其敌的粟。钜子带四十名弟子到达" +
          "{chengdu}，尚未说为谁而来。东方之师的集结还有三十天。纵队车中之粮：九日。",
        moveMenu: [
          "郡守带着印与籍册赴将军之营",
          "有条件地接纳纵队：两印共核其数，不捕一人，不动侯",
          "据守{chengdu}城门，在城上谈判",
          "接受{chu}的保护，把粮船顺{jiang}转向{chu}",
          "趁纵队未入，由郡中自己的军吏把兵员送往东方",
          "撤出{chengdu}的每一名弟子，把城墙留给据守者",
        ],
      },
      {
        index: 6,
        title: "籍册之定",
        inject:
          "用兵之季开始，东去的人按已封印的数目出发。{shu}如今的籍册、复、驻军与城墙" +
          "无论以何种形式并存，都在凝固为郡中的常法。每一个朝廷都必须决定它从这场" +
          "危机中带走的态势：什么写进{shu}的籍册，什么悄悄放弃，郡守之侧是否还有一位" +
          "侯，以及为下一次点数宣告什么。无论是否有任何东西被封印，史官都会把这一" +
          "回合记为和解。",
        moveMenu: [
          "把如今之数写进{shu}的籍册，定为郡中之法",
          "废除侯位，由郡守一人从{chengdu}治理九县",
          "让公室之兵无限期驻于{chengdu}",
          "以每年春季的粮船为条件撤回纵队",
          "宣告兵员已足，在{xianyang}讲述这个故事",
        ],
      },
    ],
  },
};

export const CONSCRIPTION_ROLLS = buildChapter(CONSCRIPTION_ROLLS_TEXT);
