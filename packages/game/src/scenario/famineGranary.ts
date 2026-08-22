import type { Scenario } from "../types";

/**
 * The Famine Granary — a modern crisis of relief across a hostile border
 * (whether to accept aid from an adversary, whether to send it, and the
 * leverage each creates) reproduced turn for turn in an invented Warring
 * States setting. Six turns, one decision point (turn 3, the granary
 * court's seat). The ladder climbs through rungs of grain withheld and
 * grain sold on terms before any army marches; its top is the invasion of
 * a starving state.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const FAMINE_GRANARY: Scenario = {
  id: "famine-granary",
  title: "The Famine Granary",
  summary:
    "An invented ancient crisis across a river border. Dryfold, a hill " +
    "kingdom, loses its harvest to a second year of drought and locusts. " +
    "Its rival Fullbarn, across the river, holds granaries filled by " +
    "three good years, and a debt: in an earlier famine Dryfold sent " +
    "grain to Fullbarn. The only road between them runs through " +
    "Millford, a small neutral state asked to carry whatever is sent. " +
    "Each seat receives injects each turn and issues decisions through a " +
    "decision memo.",
  simulates:
    "Disaster relief across a hostile border: whether to accept aid from an adversary, whether to send it, and the leverage each creates.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys, pleas, and proclamations",
    "Grain sold on terms: silver, hostages, or ceded towns",
    "Grain withheld; the river crossings closed to carts",
    "Grain seized: raids on convoys and granaries",
    "Show of force on the river",
    "Limited engagement at the crossings",
    "Invasion of a starving state",
  ],
  seats: [
    {
      id: "dryfold",
      name: "Dryfold",
      brief:
        "You are the inner council of Dryfold, a hill kingdom whose " +
        "terraces have failed two years running. You answer to the king. " +
        "Your remit covers the army, the royal granaries, the relief " +
        "magistrates, and the corps of envoys. The granaries hold forty " +
        "days of grain for the capital and nothing for the hill districts, " +
        "where people are already eating seed and bark. Your army is " +
        "intact but hungry. A generation ago Dryfold sent grain to " +
        "Fullbarn in its famine and the chroniclers on both sides of the " +
        "river recorded it. You can beg, buy, or take.",
      objectives: [
        "Feed the hill districts before the winter",
        "Preserve the crown's standing with the nobles and the people",
        "Avoid terms that mortgage the kingdom to Fullbarn",
        "Keep the army intact and the border forts held",
      ],
    },
    {
      id: "fullbarn",
      name: "Fullbarn",
      brief:
        "You are the inner council of Fullbarn, the plains kingdom across " +
        "the river from Dryfold and its rival for three generations. You " +
        "answer to the king. Your remit covers the army, the state " +
        "granaries, the river guard, and the merchant guilds. Three good " +
        "harvests have filled the granaries past their rated stores; the " +
        "guilds want to sell, the generals want to march, the scholars " +
        "recall the debt. A king who carries grain to a starving district " +
        "earns its people; a king who starves a rival may have its land. " +
        "Both paths are open and the court is divided.",
      objectives: [
        "Turn the harvest surplus into lasting advantage over Dryfold",
        "Preserve the king's name among the people of both kingdoms",
        "Keep the guilds, the generals, and the scholars inside one policy",
        "Avoid a war that ends with Fullbarn holding a ruined hill country",
      ],
    },
    {
      id: "millford",
      name: "Millford",
      brief:
        "You are the inner council of Millford, a small state at the " +
        "river's one ford, with a bridge, a mill town, and a treaty of " +
        "neutrality that both kingdoms have sworn to. You answer to the " +
        "marquis. Your remit covers the bridge guard, the carters' guild, " +
        "the toll house, and diplomacy. Every cart between Dryfold and " +
        "Fullbarn crosses your bridge. Carrying grain makes you rich and " +
        "necessary; carrying it one way makes you an enemy of the other " +
        "shore; refusing makes you the state that let a people starve. " +
        "Your militia could hold the bridge for a week.",
      objectives: [
        "Preserve Millford's neutrality and its treaty",
        "Keep the bridge, the mill town, and the carters safe",
        "Profit from the crossing without becoming either kingdom's tool",
        "Avoid becoming the field on which the two kingdoms fight",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "fullbarn" }],
  turns: [
    {
      index: 1,
      title: "The Failed Harvest",
      inject:
        "Dryfold's second harvest fails: the terraces yield a fifth of a " +
        "good year and locusts take the valley fields. The hill districts " +
        "report the first deaths of hunger. Dryfold's king sends an envoy " +
        "across the bridge with a letter recalling the grain Dryfold " +
        "carried to Fullbarn a generation ago and asking for two hundred " +
        "thousand measures. Fullbarn's guilds raise the price of grain in " +
        "the river markets. Millford's carters refuse to cross without an " +
        "escort. Refugees from the hills reach the ford.",
      moveMenu: [
        "Send envoys with a formal plea or protest",
        "Double the watch: scouts, spies, and river lookouts",
        "Move carts, guards, or troops",
        "Announce a grain measure: sale, gift, embargo, or price edict",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Price of Grain",
      inject:
        "Fullbarn's council splits. The guilds offer grain at four times " +
        "the river price, silver in advance; the generals offer grain in " +
        "exchange for the three border forts and a royal hostage; the " +
        "scholars petition for a free gift in the name of the old debt. " +
        "Dryfold's relief magistrates open the capital's granaries to the " +
        "hill districts and the capital's own stock falls to twenty-five " +
        "days. A Dryfold raiding party crosses the river by night and " +
        "empties a Fullbarn village granary. Millford posts its militia " +
        "on the bridge.",
      moveMenu: [
        "Sell grain on terms: silver, forts, or hostages",
        "Send a first convoy freely while talks continue",
        "Close the crossings to carts and refugees",
        "Surge troops to the river",
        "Call a congress of the neighboring states",
        "Covert action against the raiders or the granaries",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "The Granary Gate",
      inject:
        "Dryfold's envoy kneels in Fullbarn's hall with the terms of the " +
        "generals in one hand and the scholars' petition in the other, " +
        "and says the king will accept either rather than watch the hills " +
        "die. The same hour, word arrives that the night raiders killed a " +
        "Fullbarn granary warden and that Dryfold's army has moved to the " +
        "river forts 'to keep order among the starving.' The guilds' " +
        "silver is counted; the convoy carts stand loaded in the granary " +
        "yard; Millford asks which shore it is to serve. The decision now " +
        "falls to the focal seat: does Fullbarn send the grain freely, " +
        "sell it on terms, or withhold it and march?",
      moveMenu: [
        "Send the grain freely in the name of the old debt; ask nothing",
        "Sell the grain at the guilds' price, silver in advance",
        "Sell the grain for the three border forts and a royal hostage",
        "Send a first convoy freely and hold the rest against Dryfold's conduct",
        "Withhold the grain and close the river crossings",
        "Withhold the grain and march on the river forts while the army is hungry",
        "Send the grain and a garrison to 'guard' its distribution in the hills",
      ],
    },
    {
      index: 4,
      title: "The Bridge",
      inject:
        "Two days after Fullbarn's answer, every cart on the road must " +
        "cross Millford's bridge. Dryfold's hill districts report deaths " +
        "by the hundred; its army at the river forts has not eaten meat " +
        "in a month. Fullbarn's generals raise the river guard's readiness " +
        "in ways every lookout can see; its scholars read the old " +
        "chronicle aloud in the market. Millford's marquis receives " +
        "letters from both kings in one morning, each demanding the " +
        "bridge and promising to remember the answer. Refugees are " +
        "camped in the mill town.",
      moveMenu: [
        "Continue or begin the convoys under revised terms",
        "Suspend the convoys pending talks",
        "Raise the ultimate threat: the crossings forced, the hill country taken",
        "Announce a proportionate reprisal for the raids",
        "Open a direct channel between the two kings",
        "Bring the neighboring states in as guarantors of the convoys",
      ],
    },
    {
      index: 5,
      title: "The Mediation Window",
      inject:
        "A council of the neighboring states, meeting at Millford's " +
        "toll house, proposes terms: Fullbarn to send one hundred " +
        "thousand measures at the river price, payable over five " +
        "harvests; the convoys to cross under Millford's seal with no " +
        "soldiers of either kingdom on the bridge; Dryfold to surrender " +
        "the night raiders; both armies to withdraw a day's march from the " +
        "river. Fullbarn's generals call the terms a gift to an enemy; its " +
        "scholars call them too little. Dryfold's capital stock: eleven " +
        "days. Snow is reported in the high passes.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for the hill districts and the sick only",
        "Accept as cover to improve the army's position at the river",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The first snow closes the hill roads. Whatever mix of convoys, " +
        "terms, crossings, and armies now exists is hardening into the " +
        "new custom of the river. Each court must decide the posture it " +
        "will carry out of the crisis: what it will write into treaty, " +
        "what it will quietly drop, what lines it will proclaim for the " +
        "next famine. The chroniclers will call this turn the settlement, " +
        "whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines going forward",
        "Keep the armies at the river without end",
        "Withdraw the armies on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
