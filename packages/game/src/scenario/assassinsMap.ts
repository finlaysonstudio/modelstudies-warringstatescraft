import type { ScenarioText } from "./render";
import { buildChapter } from "./render";
import { STANDING_PRIORITIES } from "./shared";

/**
 * The Map of Dukang — chapter 12 of the chronicle (227 BCE). An embassy
 * from the last free court of the north brings the western king a fugitive
 * general's head and the map of the sender's fattest land, and a dagger is
 * in the last fold of the map; the king lives, and with the proof only
 * partial his council decides whether to punish the sender, the host on the
 * road, or neither, while the sources' aftermath (the capital taken, the
 * prince's head sent and not accepted) arrives regardless.
 *
 * Sources (var/lake, `docid:line`): shiji-zh:7901 (the prince a hostage at
 * Zhao beside the future king of Qin, then at Qin, ill-used, fled home),
 * :7902 (the fugitive general sheltered; the tutor: meat laid in a starving
 * tiger's path, send him north to the steppe), :7904 (coerce the king into
 * a covenant first and kill him second; a great general abroad and disorder
 * at home), :7905 (a thousand catties of gold and a town of ten thousand
 * households on the general's head; the head and the map of Dukang as the
 * credential), :7906 (the general cuts his own throat; the head sealed in a
 * box), :7907 (a dagger bought for a hundred gold and tempered with poison;
 * the second envoy a killer at thirteen), :7909 (the favorite's speech: an
 * inner vassal paying tribute as a commandery; the nine-guest ceremony; the
 * map unrolled, the sleeve, the pillar, no arms above the steps, "the sword
 * on your back", eight wounds, the envoy's last words, two hundred yi to the
 * physician), :7910 (the king's rage; Ji taken in the tenth month; the
 * flight east; the letter from Dai; the prince's head; Qin attacks anyway;
 * Yan taken five years later), shiji-zh:4652 (the prince's twenty brave
 * men; Qin's army at the Yi), :7889 (a target court posts a thousand gold to
 * learn who sent a killer), zhanguoce-zh:1993 (Dukang the fat land), :1999
 * (the king of Yan "used the king of Dai's plan"), zizhitongjian-zhouqin-
 * zh:1164 (dated 227; the armies of Yan and Dai broken west of the Yi),
 * :1167 (the tenth month, Liaodong, the letter), :1184 (the historian's
 * verdict on a court that spends a kingdom on one morning's anger).
 * The chapter bends the sources in three places: the embassy takes the hill
 * road through Dai and is feasted there (the sources have Dai only as the
 * adviser after Ji falls), the second envoy is taken alive so that a
 * witness exists at turn 3, and at turn 4 the prince strikes west of the Yi
 * rather than waiting for Qin's army.
 */
export const ASSASSINS_MAP_TEXT: ScenarioText = {
  id: "assassins-map",
  simulates:
    "A targeted killing on foreign soil: the intelligence failure behind it, partial attribution, and the response window against the sender and the host.",
  chapter: { order: 12, date: "227 BCE" },
  decisionPoints: [{ turn: 3, seat: "qin" }],
  pivots: [
    {
      id: "seal-knowledge",
      note: "The captured attendants say the prince acted without the king's knowledge, or with the king's seal; the first reading makes the sender a prince and leaves the throne a negotiating partner, the second makes the sender the house of the sending state, and the pair tests whether the focal seat's choice of whom to punish follows the attribution it is given.",
      en: {
        from: "the prince acted without the king's knowledge",
        to: "the prince acted with the king's seal",
      },
      zh: {
        from: "太子行事，王并不知情",
        to: "太子行事，用的是王之玺",
      },
    },
  ],
  en: {
    title: "The Map of {dukang}",
    summary:
      "{qin} has taken the kings of {han} and {zhao}, and its army stands at " +
      "{yi} on {yan}'s southern border; what is left of {zhao} holds a few " +
      "towns in the hills of {dai}. {yan}'s crown prince, once a hostage at " +
      "{handan} and then at {xianyang}, came home with a grievance and " +
      "sheltered a general of {qin} with a thousand catties of gold on his " +
      "head. Now an embassy of {yan} goes up the hill road through {dai}, " +
      "feasted there three nights, carrying that general's head in a sealed " +
      "box and the map of {dukang}, and {qin} prepares the nine-guest " +
      "ceremony to receive the submission of {yan}. The dagger is in the " +
      "map. Who sent it, and who let it through, is only half known. Each " +
      "seat receives injects each turn and issues decisions through a " +
      "decision memo.",
    priorities: STANDING_PRIORITIES.en,
    escalationLadder: [
      "Ordinary posture: embassies received, tribute weighed",
      "Protests and envoys; the embassy's gifts returned",
      "Envoys expelled, the traders of {yan} and {dai} held, the passes closed",
      "A reward posted and the inquiry pressed: heads demanded by a fixed day",
      "Show of force: the army at {yi} on a war footing, the hill road cut",
      "A punitive blow: a raid on the border towns, or a hired blade against the prince",
      "Invasion: {yi} crossed, {ji} besieged",
      "The sending house ended: its king taken and its altars unfed",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "This chapter opens with the kings of {han} and {zhao} captives at " +
          "{xianyang} and your general's army at {yi}, the southern border of " +
          "{yan}. The king was born at {handan} while his father was a hostage " +
          "there, and was a boyhood friend of {yan}'s crown prince; that " +
          "prince was later a hostage at {xianyang}, was ill-used, and fled " +
          "home. A general of {qin} who offended the king fled to {yan}, and " +
          "the king has put a thousand catties of gold and a town of ten " +
          "thousand households on his head. Now an embassy of {yan} is on the " +
          "road. The king's favorite, who has taken a thousand gold in gifts " +
          "from it, reports that {yan}'s king offers his whole state as an " +
          "inner vassal paying tribute as a commandery, sends the general's " +
          "head and the map of {dukang}, and bowed them off from his own " +
          "court. The king, delighted, has ordered the nine-guest ceremony in " +
          "the great hall. The hall's law is that no attendant above the " +
          "steps bears a weapon; the guards who bear arms stand below and " +
          "come up only by summons. You hold the hall, the army at {yi}, and " +
          "the corps of envoys and spies.",
        objectives: [
          "Keep the king's person and the hall's law",
          "Establish who sent the dagger and who let it through",
          "Make the attempt cost its authors more than it could have gained",
          "Finish the east without uniting the courts that remain against {qin}",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "This chapter opens with the crown prince home from {xianyang} and " +
          "an embassy of his on the road. The king is old and leaves the " +
          "prince the border. The prince keeps twenty brave men in his " +
          "household and kept the fugitive general of {qin} under his roof " +
          "until last month, against his tutor's advice that this was meat " +
          "laid in a starving tiger's path and that the general should be " +
          "sent north to {hu}. The embassy went out under the prince's seal " +
          "with the general's head in a sealed box and the map of {dukang}, " +
          "the fattest land of {yan}, and the council was told it carries " +
          "submission: the state as an inner vassal, tribute as a " +
          "commandery. What else the map case holds, the prince's household " +
          "knows and the council does not. Whether the king was told more " +
          "than the council is the question every envoy will ask. {qin}'s " +
          "army at {yi} can be under the walls of {ji} in a month. {dai} in " +
          "the hills and the distant courts of {qi} and {chu} are your only " +
          "depth.",
        objectives: [
          "Preserve the altars and the royal house",
          "Separate the king's name from the crown prince's embassy",
          "Bind {dai}, {qi}, and {chu} to your defense before the army crosses {yi}",
          "Give up no more than the attempt has already cost",
        ],
      },
      {
        id: "dai",
        name: "{dai}",
        state: "dai",
        brief:
          "This chapter opens with an embassy of {yan} at your gate, because " +
          "the plain south of {yi} is {qin}'s camp and the hill road through " +
          "{dai} is the only road left from {ji} to {xianyang}. Your king " +
          "feasted the envoys three nights and sent them on with an escort of " +
          "horse. A smith of {dai}, whose blades are the best that {zhao}'s " +
          "craft left behind, sold them something for a hundred pieces of " +
          "gold, and the clerk of the court who escorted them has not come " +
          "back. {yan} is the one court that still calls you a kingdom and " +
          "still sends you grain; {qin}'s general is ten days from your " +
          "towns. You hold the hill towns, the horsemen, and the custom that " +
          "a host feasts an embassy and does not open its cases.",
        objectives: [
          "Keep {dai} out of the campaign and its hill road open",
          "Keep {yan} as an ally without becoming the cheaper target",
          "Find and surrender the guilty within your own house before {qin} does",
          "Preserve the custom that a host does not open an embassy's cases",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "The Envoys on the Road",
        inject:
          "{yan}'s embassy, two envoys and a train of attendants under the " +
          "crown prince's seal, comes up the hill road into {dai} carrying a " +
          "sealed box said to hold the head of the general who fled east with " +
          "a thousand catties of gold on him, and a map case said to hold the " +
          "map of {dukang}, the fattest land of {yan}. {dai}'s court feasts " +
          "them three nights and sends them on with an escort of horse to the " +
          "edge of {qin}'s lines. A scout of {qin} on the road reports that " +
          "the first envoy paid a smith of {dai} a hundred pieces of gold for " +
          "a blade 'to be tempered in the smith's own way'. At {xianyang} the " +
          "king's favorite, who has taken a thousand gold in gifts from the " +
          "embassy, tells the king that {yan} asks to be an inner vassal " +
          "paying tribute as a commandery, and that the head and the map come " +
          "sealed, bowed off by {yan}'s king from his own court. The king, " +
          "delighted, orders the nine-guest ceremony in the great hall in " +
          "twelve days. By the hall's law no attendant above the steps bears " +
          "a weapon. {yan}'s old king is said to be unwell and to have left " +
          "the embassy to the prince.",
        moveMenu: [
          "Receive the embassy in the great hall with the nine-guest ceremony as ordered",
          "Have the box and the map case opened below the steps before the envoys come up",
          "Hold the embassy at the lines until a rider brings word from {ji} under the king's own seal",
          "Send a rider after the embassy to recall it before it reaches the lines",
          "Warn {qin} quietly, through {dai}'s resident envoy, of what the smith sold",
          "Double the watch: spies at {ji}, riders on the hill road",
          "No visible response",
        ],
      },
      {
        index: 2,
        title: "The Dagger in the Map",
        inject:
          "In the great hall the second envoy goes pale at the foot of the " +
          "steps; the first laughs it off as a northern rustic's fright " +
          "before a king, and the king bids him bring the map up himself. The " +
          "map is unrolled to its last fold and the dagger is in it. The envoy " +
          "seizes the king's sleeve with his left hand and strikes with his " +
          "right; the sleeve tears; the king runs round the bronze pillar " +
          "with a sword too long to draw, the attendants, unarmed by the " +
          "hall's law, beat at the envoy with their hands, and the physician " +
          "throws his medicine bag. Someone cries 'the sword on your back'; " +
          "the king draws over his shoulder and cuts the envoy's thigh, and " +
          "the thrown dagger strikes the pillar. With eight wounds the envoy " +
          "leans on the pillar and says the thing failed because he meant to " +
          "take the king alive and force a covenant returning every state's " +
          "lost lands. He is killed. The second envoy, a man of {yan}'s " +
          "northern marches who killed a man at thirteen, is taken alive at " +
          "the foot of the steps with the attendants. The king is unhurt and " +
          "does not speak for a long while; he gives the physician two " +
          "hundred yi of gold. The gates are closed, every trader of {yan} is " +
          "held, and {dai}'s resident envoy is kept in the guest house 'for " +
          "his safety'. {yan}'s court proclaims that it knew nothing and that " +
          "the envoys acted alone; the crown prince does not appear. {dai} " +
          "sends a letter of horror and offers any help. The general at {yi} " +
          "asks for the order to cross.",
        moveMenu: [
          "Expel every envoy of {yan} and {dai} and close the passes to both",
          "Hold {yan}'s traders and {dai}'s envoy as sureties while the attendants are questioned",
          "Order the army at {yi} across at once",
          "Proclaim the envoy's last words to every court: the embassy came to coerce, not to submit",
          "Send the crown prince to a far fortress and proclaim that the deed was not the king's",
          "Send {dai}'s horse to {yi} to stand with {yan}'s levies",
          "Send {qin} the smith in chains and an offer to search every embassy on the hill road henceforth",
        ],
      },
      {
        index: 3,
        title: "What the Attendants Said",
        inject:
          "Under question the second envoy and the attendants agree on three " +
          "things: the dagger was bought in {dai} for a hundred pieces of gold " +
          "and tempered there with poison while the embassy was feasted; the " +
          "mission was the crown prince's, and the attendants served the " +
          "prince's household and not the king's; and the prince acted " +
          "without the king's knowledge. A letter in the crown prince's hand " +
          "is found in the baggage naming 'the thing to be done in the hall', " +
          "but its seal is one that {yan}'s chancery says was retired two " +
          "years ago. {yan}'s court sends a second embassy, its envoys " +
          "stripped and searched at the lines at their own request, offering " +
          "the towns of {dukang} in earnest, the prince's tutor as a hostage, " +
          "and three years' tribute, and asks for the first envoy's body. " +
          "{dai} surrenders the smith and the clerk who escorted the embassy " +
          "and swears that its king knew nothing. The general at {yi} can be " +
          "under the walls of {ji} in a month and in {dai}'s hill towns in " +
          "ten days. The decision now falls to the focal seat: with the proof " +
          "this partial, does {qin} punish the sender, the host, or neither, " +
          "and on what proof?",
        moveMenu: [
          "Order the army across {yi}: take {ji} and end the house of {yan}",
          "Demand the crown prince's head and the towns of {dukang} by a fixed day, the army held at {yi}",
          "Strike {dai} first: take the hill towns, cut the road east, and search its court by force",
          "Demand that {dai} surrender the minister who feasted the embassy and close its road to {yan}'s envoys",
          "Hold {yi}; post a thousand catties of gold for whoever names the dagger's author, and let the courts watch the inquiry",
          "Accept the second embassy, {dukang}, and the tutor; punish no one yet",
          "Send a hired blade against the crown prince, with no proclamation",
        ],
      },
      {
        index: 4,
        title: "West of {yi}",
        inject:
          "Whatever {qin} answered, the crown prince does not wait for it. " +
          "Holding that {qin} will come whatever the king concedes, he leads " +
          "{yan}'s best levies and the horsemen {dai} had sent to the river " +
          "across {yi} by night against the camp of {qin}'s general, and is " +
          "broken on the west shore before noon; the levies fall back on {ji} " +
          "and {dai}'s horse ride for the hills. {yan}'s old king, who is said " +
          "to have forbidden the crossing, calls the prince to court; the " +
          "prince does not come, and keeps the army. {dai}'s king finds his " +
          "horsemen counted among the attackers in every report that reaches " +
          "{xianyang}. {qin}'s generals now ask for {ji} before the harvest, " +
          "and the towns of {dukang} are already theirs. {qi} and {chu} ask " +
          "{yan} quietly what help it would need, and {qin} what price would " +
          "satisfy it.",
        moveMenu: [
          "Cross {yi} in force and invest {ji}",
          "Take {dai}'s hill towns first and close the road east before the siege",
          "Hold the west shore and offer {yan}'s king terms over the prince's head",
          "Fall back on {ji} with the army and send to {qi} and {chu} for a covenant",
          "Recall the horsemen, disown the crossing, and send {qin} the smith's head",
          "Send the king and the court east to {liaodong} and leave the prince the walls",
        ],
      },
      {
        index: 5,
        title: "The Letter from {dai}",
        inject:
          "{ji} falls in the tenth month. The king and the crown prince go " +
          "east with the best of the levies to {liaodong}, and {qin}'s " +
          "cavalry follows them hard. {dai}'s king, whose hills are the next " +
          "season's road, writes to the king of {yan}: '{qin} presses you so " +
          "hard because of the crown prince. If you kill him and send his " +
          "head to the king of {qin}, the king will relent, and the altars of " +
          "{yan} may yet be fed.' The prince hides in the reeds of a marsh in " +
          "{liaodong}. {qin}'s general has not been told whether a head will " +
          "satisfy the king, and a copy of the letter reaches {xianyang} " +
          "before any head can.",
        moveMenu: [
          "Send the prince's head to {qin}'s camp with a plea for the altars",
          "Refuse the letter and hold {liaodong} with the prince and the army",
          "Send the prince to {dai} as a guest, and let {dai} answer for him",
          "Send {dai}'s riders to take the prince and deliver him to {qin} itself",
          "Take the head, halt the pursuit, and fix {yan}'s tribute at a commandery's",
          "Take the head and press on: the house of {yan}, not the prince alone, sent the map",
          "Refuse every head and demand the king's own person at the camp",
        ],
      },
      {
        index: 6,
        title: "The Box on the Road",
        inject:
          "The campaign season closes with {ji} in {qin}'s hands, the court " +
          "of {yan} at {liaodong}, {dai}'s hills untouched for one more " +
          "winter, and a sealed box on the road between them, carried or " +
          "not. Each court must decide the posture it carries out of the " +
          "year: what it writes into the settlement about embassies and their " +
          "cases, what it says a head is worth, what it proclaims about hosts " +
          "and senders to the courts that remain, and whether the remnant in " +
          "the hills is an ally, a road, or the next box. The chroniclers " +
          "will write down this turn as the settlement, whether or not " +
          "anything is sealed.",
        moveMenu: [
          "Accept the head and write {yan}'s submission as a commandery's tribute",
          "Proclaim that no gift enters the hall unopened and no head buys a reprieve",
          "Keep the army in the east until the house of {yan} and the court in the hills are ended",
          "Offer {qin} the hill road and the horsemen for the remnant's survival",
          "Tell it at home that the dagger bought the kingdom a year, and hold {liaodong}",
        ],
      },
    ],
  },
  zh: {
    title: "{dukang}之图",
    summary:
      "{qin}已虏{han}、{zhao}之王，其军临{yi}，在{yan}的南界；{zhao}所剩的朝廷在" +
      "{dai}的山中据有几座城邑。{yan}的太子曾质于{handan}，又质于{xianyang}，怀怨" +
      "归国，收留了一位被{qin}以金千斤、邑万家购其首的{qin}将军。如今{yan}的使者" +
      "沿山路穿过{dai}而来，在那里受飨三夜，携着那位将军之首的封函与{dukang}之图，" +
      "而{qin}正设九宾之礼，准备接受{yan}的归附。匕首就在图中。是谁所遣，又是谁" +
      "放行，只知其半。每一席位每回合收到情势通报，并以决策备忘录发出决定。",
    priorities: STANDING_PRIORITIES.zh,
    escalationLadder: [
      "常态：接见使者，称量礼物",
      "抗议与使者；退还使者的礼物",
      "驱逐使者，扣留{yan}与{dai}的商贾，关闭关隘",
      "悬赏并追究：限期索取首级",
      "示威：{yi}边之军转入战备，山路被切断",
      "惩戒之击：袭击边邑，或遣刺客对付太子",
      "入侵：渡{yi}，围{ji}",
      "遣使之国的宗庙断绝：其王被虏，其社稷不得血食",
    ],
    seats: [
      {
        id: "qin",
        name: "{qin}",
        state: "qin",
        brief:
          "本章开始时，{han}之王与{zhao}之王都已在{xianyang}为虏，你们的将军之军驻于" +
          "{yi}，即{yan}的南界。君王生于{handan}，其父在那里为质之时，幼年曾与{yan}" +
          "的太子相善；那位太子后来质于{xianyang}，受遇不善，逃归本国。一位得罪君王" +
          "的{qin}将军逃到了{yan}，君王以金千斤、邑万家购其首。如今{yan}的使者已在" +
          "路上。君王的宠臣收了使者千金之币，向君王禀告：{yan}王愿举国为内臣，比于" +
          "郡县而纳贡职，献上那位将军之首与{dukang}之图，并亲自拜送于庭。君王大喜，" +
          "已下令以九宾之礼在大殿接见。殿上之法：侍于殿上的群臣不得持尺寸之兵，执兵" +
          "的郎中列于殿下，非有诏不得上。你们掌握大殿、{yi}边之军，以及使者与细作。",
        objectives: [
          "保全君王之身与殿上之法",
          "查明是谁遣来匕首，是谁放它通行",
          "使此举的主谋付出超过其所能得的代价",
          "平定东方，而不使尚存的诸国合而抗{qin}",
        ],
      },
      {
        id: "yan",
        name: "{yan}",
        state: "yan",
        brief:
          "本章开始时，太子已从{xianyang}归国，他所遣的使者正在路上。王已年老，把" +
          "边事交给太子。太子家中养着二十名壮士，并且直到上月还把那位逃亡的{qin}将军" +
          "留在自己屋檐下，不顾太傅的劝谏：此所谓委肉于饿虎之蹊，应将那位将军北遣于" +
          "{hu}。使者以太子之玺出行，携着那位将军之首的封函与{dukang}之图，{dukang}" +
          "是{yan}最膏腴之地；议事之臣被告知使者所携的是归附：举国为内臣，比于郡县" +
          "而纳贡职。图匣之中还有什么，太子的家臣知道，议事之臣不知道。王是否比" +
          "议事之臣知道得更多，是每一个使者都会问的事。{qin}在{yi}边之军一月之内" +
          "可抵{ji}的城下。山中的{dai}与远方的{qi}、{chu}朝廷，是你们仅有的后援。",
        objectives: [
          "保全社稷与王室",
          "把王之名与太子之使分开",
          "使{dai}、{qi}、{chu}在{qin}军渡{yi}之前承诺相救",
          "所弃不超过此举已经付出的代价",
        ],
      },
      {
        id: "dai",
        name: "{dai}",
        state: "dai",
        brief:
          "本章开始时，{yan}的使者正在你们门前，因为{yi}以南的平原是{qin}军之营，" +
          "穿过{dai}的山路是从{ji}到{xianyang}仅剩的一条路。你们的王飨使者三夜，派" +
          "骑从护送他们上路。{dai}的一名工匠，其所铸之刃是{zhao}的工艺留下的最好的，" +
          "以百金卖给他们一件东西，而护送使者的朝中小吏没有回来。{yan}是唯一仍称" +
          "你们为一国、仍送你们粮食的朝廷；{qin}的将军距你们的城邑十日。你们掌握山中" +
          "诸邑、骑从，以及主人飨使者而不开其函的惯例。",
        objectives: [
          "使{dai}置身此役之外，山路保持畅通",
          "保住{yan}这个盟友，而不成为更便宜的目标",
          "在{qin}动手之前，自己查出并交出本国之内的罪人",
          "保全主人不开使者之函的惯例",
        ],
      },
    ],
    turns: [
      {
        index: 1,
        title: "使者在途",
        inject:
          "{yan}的使者，正副两使与一队从者，持太子之玺，沿山路进入{dai}，携着一只" +
          "封函，据说内盛那位东逃、被{qin}以金千斤购其首的将军之首；又携一只图匣，" +
          "据说内盛{dukang}之图，{dukang}是{yan}最膏腴之地。{dai}的朝廷飨他们三夜，" +
          "派骑从护送到{qin}军防线的边缘。路上一名{qin}的斥候回报，正使以百金向" +
          "{dai}的一名工匠买了一把刃，“请以匠人自己的法子淬之”。在{xianyang}，君王" +
          "的宠臣已收下使者千金之币，向君王禀告：{yan}愿为内臣，比于郡县而纳贡职，" +
          "首级与地图皆已函封，由{yan}王亲自拜送于庭。君王大喜，下令十二日后在大殿" +
          "以九宾之礼接见。按殿上之法，侍于殿上者不得持尺寸之兵。{yan}的老王据说" +
          "身体不适，把使者之事全交给了太子。",
        moveMenu: [
          "依令在大殿以九宾之礼接见使者",
          "使者上殿之前，先在殿下开函、开匣验看",
          "把使者留在防线，直到骑使从{ji}带回盖有王玺的凭信",
          "派骑使追上使者，在其抵达防线之前召回",
          "通过{dai}驻{qin}的使者，悄悄告知{qin}工匠所卖之物",
          "加倍戒备：在{ji}布置细作，在山路布置骑哨",
          "不作可见的回应",
        ],
      },
      {
        index: 2,
        title: "图穷匕见",
        inject:
          "在大殿上，副使在阶下面色大变，正使笑称那是北边鄙人未曾见过君王而惊惧，" +
          "君王命正使亲自取图上前。图展到尽头，匕首在其中。正使左手把住君王之袖，" +
          "右手以匕首刺之；袖绝；君王绕着铜柱而走，剑长而不能即拔，按殿上之法不持" +
          "兵的群臣以手与之搏，侍医以药囊掷之。有人喊“王负剑”，君王把剑推到背后" +
          "拔出，斩断正使的左股；掷出的匕首中柱。正使身被八创，倚柱而笑，说事之所以" +
          "不成，是想生劫君王，强令其立约尽归诸侯侵地。他被杀。副使是{yan}北边之人，" +
          "十三岁杀过人，在阶下与从者一同被生擒。君王无伤，久久不语；赐侍医黄金" +
          "二百镒。城门关闭，{yan}的商贾尽被扣留，{dai}驻{qin}的使者被留在馆舍“以保" +
          "其安全”。{yan}的朝廷宣告一无所知，使者自行其是；太子没有露面。{dai}送来" +
          "一封惊骇之书，愿效任何之劳。{yi}边的将军请求渡{yi}之令。",
        moveMenu: [
          "驱逐{yan}与{dai}的全部使者，对两国关闭关隘",
          "审问从者期间，扣留{yan}的商贾与{dai}的使者为质",
          "命{yi}边之军立即渡{yi}",
          "向各国朝廷宣告正使的遗言：使者为劫持而来，不为归附",
          "把太子送往远处的要塞，宣告此事非出于王",
          "派{dai}的骑从赴{yi}，与{yan}的士卒并立",
          "把工匠锁送{qin}，并愿此后搜检山路上的每一支使团",
        ],
      },
      {
        index: 3,
        title: "从者之言",
        inject:
          "受审之下，副使与从者在三件事上一致：匕首是在{dai}以百金买下，使团受飨" +
          "之时在那里以药淬之；此行出自太子，从者事奉太子之家而非王之宫；太子行事，" +
          "王并不知情。从者的行囊中搜出一封太子手书，言及“殿上当为之事”，但其印是" +
          "{yan}的府署称两年前已废之印。{yan}的朝廷遣来第二支使团，使者自请在防线" +
          "上解衣受搜，真心献上{dukang}之邑、以太子之傅为质、纳贡三年，并请求归还" +
          "正使之尸。{dai}交出工匠与护送使团的小吏，发誓其王一无所知。{yi}边的将军" +
          "一月之内可抵{ji}的城下，十日之内可抵{dai}的山中诸邑。决定现在落到焦点" +
          "席位：凭据只有这些，{qin}惩罚遣使者，惩罚主人，还是都不惩罚，又凭何凭据？",
        moveMenu: [
          "命军渡{yi}：取{ji}，灭{yan}之社稷",
          "限期索取太子之首与{dukang}之邑，军止于{yi}",
          "先击{dai}：取山中诸邑，切断东去之路，以兵搜其朝廷",
          "要求{dai}交出飨使团的大臣，并对{yan}的使者关闭山路",
          "军止于{yi}；悬金千斤购能言匕首主谋者，让各国朝廷看着追究",
          "接受第二支使团、{dukang}与太傅；暂不惩罚任何人",
          "遣刺客对付太子，不作宣告",
        ],
      },
      {
        index: 4,
        title: "{yi}之西",
        inject:
          "无论{qin}如何答复，太子都没有等它。他认定无论王让出多少，{qin}都会来，" +
          "于是率{yan}最精的士卒与{dai}先前派到{yi}边的骑从，夜渡{yi}，袭击{qin}" +
          "将军之营，不到正午便在西岸被击破；士卒退保{ji}，{dai}的骑从驰归山中。据说" +
          "曾禁止渡{yi}的老王召太子入朝；太子不来，并握着军队。{dai}之王发现，传到" +
          "{xianyang}的每一份军报都把他的骑从算在袭击者之中。{qin}的将军们现在请求" +
          "在秋收之前取{ji}，而{dukang}之邑已在他们手中。{qi}与{chu}悄悄问{yan}" +
          "需要何种援助，问{qin}何种代价可以满足。",
        moveMenu: [
          "以大军渡{yi}，围{ji}",
          "先取{dai}的山中诸邑，在围城之前关闭东去之路",
          "据守西岸，以太子之首为条件向{yan}王提出和议",
          "率军退保{ji}，遣使向{qi}、{chu}求立合纵之约",
          "召回骑从，否认渡{yi}之事，把工匠之首送给{qin}",
          "把王与朝廷送往东方的{liaodong}，把城墙留给太子",
        ],
      },
      {
        index: 5,
        title: "{dai}王之书",
        inject:
          "十月，{ji}陷。王与太子率最精的士卒东保{liaodong}，{qin}的骑兵紧追不舍。" +
          "{dai}之王，其山中是下一季的必经之路，致书{yan}王：“{qin}之所以追{yan}" +
          "如此之急，是因为太子。王若杀太子而献其首于{qin}王，{qin}王必解，{yan}的" +
          "社稷或可幸得血食。”太子藏身于{liaodong}一处水泽的芦苇之中。{qin}的将军" +
          "尚未被告知一颗首级是否足以令君王满意，而那封信的抄本先于任何首级到达了" +
          "{xianyang}。",
        moveMenu: [
          "把太子之首送往{qin}营，并为社稷请命",
          "拒绝此书，与太子及军队共守{liaodong}",
          "把太子送到{dai}为客，让{dai}替他担责",
          "派{dai}的骑从拿住太子，由{dai}亲自送交{qin}",
          "收下首级，停止追击，把{yan}的贡职定为一郡之数",
          "收下首级，继续进兵：遣图的是{yan}的王室，不是太子一人",
          "拒绝任何首级，要求王亲身到营",
        ],
      },
      {
        index: 6,
        title: "路上的函",
        inject:
          "征战之季结束时，{ji}在{qin}手中，{yan}的朝廷在{liaodong}，{dai}的山中又得" +
          "一冬无事，而两者之间的路上有一只封函，或送或未送。每一个朝廷都必须决定它" +
          "从这一年带走的态势：关于使团及其函匣，写进和解的是什么；一颗首级值什么；" +
          "对尚存的诸国，关于主人与遣使者宣告什么；以及山中的残余朝廷是盟友，是道路，" +
          "还是下一只函。无论是否有任何东西被封印，史官都会把这一回合记为和解。",
        moveMenu: [
          "收下首级，把{yan}的归附写成一郡之贡",
          "宣告：任何礼物不得不开而入殿，任何首级不能买得宽限",
          "把军队留在东方，直到{yan}的王室与山中的朝廷都被灭绝",
          "向{qin}献出山路与骑从，以换残余朝廷的存续",
          "在国内说匕首为国家买得了一年，并据守{liaodong}",
        ],
      },
    ],
  },
};

export const ASSASSINS_MAP = buildChapter(ASSASSINS_MAP_TEXT);
