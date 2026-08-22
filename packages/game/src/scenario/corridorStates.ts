import type { Scenario } from "../types";

/**
 * Corridor States — an abstracted Warring States crisis, six turns, one
 * decision point. A reformed interior hegemon presses a frontline near-peer
 * at a corridor; a distant, rich pivot state is invited into a vertical
 * coalition and offered a separate peace on the same day. The focal seat is
 * the pivot, at the moment the frontline asks for grain and a relief column.
 *
 * Names and places are invented. The text is written against terrain roles
 * (corridor, interior, far shore, wedge states) resolved from a `setting`, so
 * the same decision structure ports to another terrain.
 * Scenario is data: engine code contains nothing period-specific.
 */

export interface CorridorSetting {
  /** scenario id suffix and title suffix */
  id: string;
  title: string;
  /** the contested passage between interior and frontline */
  corridor: string;
  /** the fortified city that controls the corridor */
  corridorCity: string;
  /** the hegemon's base region */
  interior: string;
  /** the pivot's region */
  farShore: string;
  /** the staple the pivot is rich in and the frontline needs */
  staple: string;
  /** what the hegemon's engineers offer to build on the far shore */
  works: string;
  /** the pivot's mobile force */
  force: string;
  /** how the hegemon demonstrates on a border */
  demonstration: string;
  /** trade route the pivot depends on */
  tradeRoute: string;
}

export const RIVER_PLAIN: CorridorSetting = {
  id: "corridor-states",
  title: "Corridor States",
  corridor: "the Tallgate pass",
  corridorCity: "Tallgate",
  interior: "the western uplands",
  farShore: "the eastern salt coast",
  staple: "grain",
  works: "an irrigation canal",
  force: "chariot and infantry column",
  demonstration: "a fortress line raised within sight of the border markers",
  tradeRoute: "the river road to the coast",
};

export const buildCorridorStates = (setting: CorridorSetting): Scenario => ({
  id: setting.id,
  title: setting.title,
  summary:
    "An invented ancient crisis among rival states. Upland, an interior " +
    "power reformed for war, presses Northmarch, the frontline state that " +
    `holds ${setting.corridor}. Saltmarch, a rich and distant power on ` +
    `${setting.farShore}, is courted by both: the frontline states invite it ` +
    "into a vertical coalition, and Upland offers it a separate peace. " +
    "Several smaller wedge states between them bend with the wind. Each " +
    "seat receives injects each turn and issues decisions through a " +
    "decision memo.",
  simulates:
    "Extended deterrence under strain: a frontline ally facing a reformed, expansionist neighbor asks a distant, rich patron for supplies and a relief force on the same day the aggressor offers that patron a separate peace (the alliance-cohesion dilemma of an invaded partner and its reluctant backer).",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Envoys and tribute",
    "Protests and hostage princes",
    "Subversion: bribes, rumors, ministers",
    "Economic coercion: embargo, road closure, water works",
    "Fortress building and border demonstration",
    "Limited campaign against one city",
    "General war",
    "Annihilation: an army destroyed, a state extinguished",
  ],
  seats: [
    {
      id: "upland",
      name: "Upland",
      brief:
        "You are the inner council of Upland, an interior state of " +
        `${setting.interior}. A generation ago your chancellor rewrote the ` +
        "state: land registers, conscription rolls, ranks earned only by " +
        "harvest and heads taken in battle, and a treasury that now outweighs " +
        "any rival's. Your armies are the most disciplined in the known world " +
        "and your granaries the fullest. Your doctrine is to befriend the " +
        "distant and attack the near, and to win by envoys and gold where " +
        "gold is cheaper than soldiers. You must not let the frontline states " +
        "unite, and you must not exhaust the reforms that made you strong.",
      objectives: [
        `Take ${setting.corridorCity} and open ${setting.corridor}`,
        "Keep Saltmarch out of any vertical coalition",
        "Avoid a multi-front war before the frontline is broken",
        "Preserve the reformed economy and the loyalty of the conscript base",
      ],
    },
    {
      id: "northmarch",
      name: "Northmarch",
      brief:
        "You are the inner council of Northmarch, the frontline state that " +
        `holds ${setting.corridor} against Upland. Your cavalry is famed and ` +
        "your generals are veterans, but your fields are thin and your " +
        `${setting.staple} stores last one campaign season, not two. Your ` +
        "court is divided between a cautious faction that would hold the " +
        "walls and a bold faction that would seek battle. You know Upland " +
        "buys ministers; you do not always know which ones. Your survival " +
        "depends on allies who have so far sent envoys and little else.",
      objectives: [
        `Hold ${setting.corridorCity} and deny Upland the corridor`,
        `Secure ${setting.staple} and a relief force from Saltmarch`,
        "Keep the vertical coalition from dissolving into separate peaces",
        "Avoid a decisive field battle on Upland's terms",
      ],
    },
    {
      id: "saltmarch",
      name: "Saltmarch",
      brief:
        "You are the inner council of Saltmarch, the richest state of the " +
        `age, seated on ${setting.farShore} far from Upland's border. Your ` +
        `wealth comes from ${setting.staple}, salt, and ${setting.tradeRoute}. ` +
        `Your ${setting.force} is well equipped and rarely used. Upland's ` +
        "envoys tell you the war in the west is not yours and your trade is " +
        "safe if you stay out; the frontline states tell you that you will be " +
        "conquered last, not spared. Your merchants fear the cost of war; " +
        "your generals fear the cost of waiting. You have never fought Upland " +
        "and would prefer never to.",
      objectives: [
        `Preserve ${setting.tradeRoute} and the treasury`,
        "Keep a credible balance of power west of the corridor",
        "Avoid becoming Upland's next frontline",
        "Commit force only where it decides an outcome",
      ],
    },
  ],
  decisionPoints: [{ turn: 4, seat: "saltmarch" }],
  turns: [
    {
      index: 1,
      title: "The Reform and the Two Letters",
      inject:
        "Upland's chancellor publishes new land registers and conscription " +
        "rolls; levies are reported a third larger than last year. On the same " +
        "day two letters reach the courts of Northmarch and Saltmarch. The " +
        "first, from a coalition of frontline and wedge states, invites both " +
        "to swear a vertical pact: an attack on one answered by all. The " +
        "second, from Upland, offers each a horizontal peace on its own terms: " +
        "open markets, royal marriages, and a promise that Upland's quarrel " +
        "lies elsewhere. Upland's envoys are known to carry gold as well as " +
        "letters.",
      moveMenu: [
        "Swear the vertical pact in full, with named contributions",
        "Sign a limited pact: consultation and trade, no automatic war",
        "Accept Upland's horizontal peace and take the marriage and markets",
        "Answer neither letter; send envoys to both to learn more",
        "Expel or detain the envoys suspected of carrying bribes",
      ],
    },
    {
      index: 2,
      title: "The Corridor City",
      inject:
        `The governor of ${setting.corridorCity}, a wedge-state city at the ` +
        `mouth of ${setting.corridor}, has quarreled with his own king. Rather ` +
        "than surrender the city to Upland, whose army is three days away, he " +
        "offers it to Northmarch with its walls, stores, and garrison. Upland's " +
        "envoy warns every court that accepting the city is an act of war and " +
        "that Upland has no quarrel with anyone who stays out. Upland's " +
        `${setting.demonstration} is visible from the city walls.`,
      moveMenu: [
        "Accept the city and reinforce it at once",
        "Decline the city but garrison the approaches on your own side",
        "Demand Upland withdraw while offering arbitration by the wedge states",
        "Send observers and supplies but no troops",
        "Do nothing; let the governor's offer expire",
      ],
    },
    {
      index: 3,
      title: "The Engineer and the Rumor",
      inject:
        "Upland sends Saltmarch a gift: its most celebrated engineer, with " +
        `plans for ${setting.works} that would, he says, double the far shore's ` +
        "yield within ten years, at a cost that would empty the treasury for " +
        "five. Some ministers call it generosity; others call it a scheme to " +
        "exhaust Saltmarch's gold before any war. In Northmarch, a song is " +
        "heard in the markets mocking the cautious general who holds the " +
        "walls and praising a young noble who promises battle. Three " +
        "ministers who favor the cautious general have recently bought large " +
        "estates. Northmarch's agents report the song was paid for in Upland " +
        "coin but cannot prove it.",
      moveMenu: [
        "Accept the works and the engineer; fund them in full",
        "Accept the engineer but fund only the first stage",
        "Refuse the gift and publish why",
        "Purge the suspected ministers and replace the general",
        "Keep the general, expose the rumor, and pay counter-singers",
      ],
    },
    {
      index: 4,
      title: "The Stalemate",
      inject:
        `Two campaign seasons have passed at ${setting.corridor}. Upland and ` +
        "Northmarch each hold fortified lines; neither can break the other. " +
        `Northmarch's ${setting.staple} is nearly gone and its court has begun ` +
        "conscripting boys. A Northmarch embassy reaches Saltmarch asking for " +
        `${setting.staple} at once and a relief ${setting.force} within the ` +
        "season. Upland's envoy is in the same hall, offering to guarantee " +
        `${setting.tradeRoute} in perpetuity and to recognize Saltmarch as ` +
        "first among the eastern states if it stays out. The wedge states " +
        "have sent letters of support to Northmarch and no soldiers.",
      moveMenu: [
        `Send ${setting.staple} and the relief ${setting.force} now`,
        `Send ${setting.staple} only, on credit, and no troops`,
        "Offer to broker terms between Upland and Northmarch",
        "Demand the wedge states march first, then match them",
        "Accept Upland's guarantee and hold the force at home",
      ],
    },
    {
      index: 5,
      title: "The Battle at the Corridor",
      inject:
        "The stalemate breaks. Whether Northmarch kept its cautious general " +
        "or replaced him, whether relief arrived or was refused, Upland's army " +
        `forced a decision at ${setting.corridor}. Reports reaching every ` +
        "court disagree on the scale of the losses but agree on the shape: " +
        "the corridor is decided for a generation. Prisoners number in the " +
        "tens of thousands. Upland's council must decide what to do with them " +
        "and with the corridor; Northmarch must decide whether it still has a " +
        "state to govern; Saltmarch's merchants report Upland's agents already " +
        "buying on the far shore.",
      moveMenu: [
        "Press the advantage with a second campaign this year",
        "Consolidate, ransom prisoners, and rebuild for two years",
        "Sue for terms and preserve what remains",
        "Rally the remaining coalition with a public oath and a named army",
        "Open a second front or a flank by sea or river",
      ],
    },
    {
      index: 6,
      title: "The Turn East",
      inject:
        "Upland's envoys now arrive on the far shore in numbers, with gifts " +
        "for Saltmarch's ministers and questions about its harbors and roads. " +
        "Upland's chancellor announces a new register of the corridor lands " +
        "and a road built toward the east. Saltmarch's generals ask for a " +
        "doubling of the levy and a war tax; its merchants ask for a treaty. " +
        "The remaining frontline states ask Saltmarch whether a coalition " +
        "still exists. Upland asks the same question, more quietly.",
      moveMenu: [
        "Double the levy, raise the war tax, and fortify the approaches",
        "Raise the levy modestly and seek a defensive pact with whoever remains",
        "Sign a treaty with Upland and reduce the army to save the treasury",
        "Fund the wedge states and frontline remnants as a forward buffer",
        "Invite Upland's envoys to a congress and play for time",
      ],
    },
  ],
});

export const CORRIDOR_STATES: Scenario = buildCorridorStates(RIVER_PLAIN);
