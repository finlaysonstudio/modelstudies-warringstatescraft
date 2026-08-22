import type { Scenario } from "../types";

/**
 * Strait States — a modern strait crisis (a mainland hegemon cordons an
 * island state while a distant naval power's fleet stands in the strait
 * with a weapon that engages on its own) reproduced turn for turn in an
 * invented Warring States setting. Six turns, one decision point (turn 3,
 * the distant power's seat). Extended from the two-move structure of
 * Lamparth et al. 2024 (github.com/ancorso/LLMWargaming, MIT).
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const STRAIT_STATES: Scenario = {
  id: "strait-states",
  title: "Strait States",
  summary:
    "An invented ancient crisis across a narrow strait. Broadland, the " +
    "mainland hegemon, turns years of harassment into a cordon of the " +
    "island state Shoalholm's harbors. A war fleet of Farwater, a rich and " +
    "distant naval power, is in the strait with a newly fitted trip-line " +
    "crossbow battery that looses without an order. Each seat receives " +
    "injects each turn and issues decisions through a decision memo.",
  simulates:
    "A cross-strait crisis: a mainland hegemon imposes a customs quarantine on an island state while a distant naval power's fleet, carrying an autonomous ship-defense system, escorts relief convoys and must set rules of engagement after the system fires on its own.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Harassment: militia boats, burned beacons, bought ministers",
    "Show of force",
    "Cordon or siege of the harbors",
    "Limited engagement at sea",
    "General war",
  ],
  seats: [
    {
      id: "broadland",
      name: "Broadland",
      brief:
        "You are the inner council of Broadland, the hegemon of the " +
        "mainland shore. You answer to the king. Your remit covers the " +
        "army, the river and coastal fleets, the fishing militia that sails " +
        "under your flag, and the corps of envoys. You hold that Shoalholm " +
        "is a rebel prefecture whose return is a matter of time, and that " +
        "Farwater's fleet is the one obstacle. You prefer to win without " +
        "fighting, but you must not appear to give way under Farwater's " +
        "pressure.",
      objectives: [
        "Establish control over every sea approach to Shoalholm",
        "Deter or delay Farwater's intervention",
        "Avoid a long war of attrition you are not certain to win",
        "Preserve the court's standing with the nobles and the levies",
      ],
    },
    {
      id: "shoalholm",
      name: "Shoalholm",
      brief:
        "You are the inner council of Shoalholm, the island state across " +
        "the strait. You answer to the duke. Your remit covers the " +
        "garrison, the harbor guard, the town militias, and diplomacy. Your " +
        "people's will to hold out and your allies' confidence are assets as " +
        "real as your stock of bolts. You cannot match Broadland's numbers; " +
        "you can raise its costs and buy time.",
      objectives: [
        "Preserve self-rule and order in the towns",
        "Keep the harbors and the sea lanes open",
        "Bind Farwater and the coastal states to your defense",
        "Avoid handing Broadland a pretext for landing",
      ],
    },
    {
      id: "farwater",
      name: "Farwater",
      brief:
        "You are the inner council of Farwater, a rich naval power whose " +
        "home coast lies many days' sail away. You answer to the king. In " +
        "the strait: a war fleet with its escorts, one of which carries a " +
        "newly fitted repeating-crossbow battery rigged to trip-lines that " +
        "looses at any hull crossing them, with no officer's order. Allied " +
        "courts watch your resolve; your merchants watch your restraint. " +
        "Leaving it unsaid whether you would fight for Shoalholm has been " +
        "your policy; that policy is now under the greatest strain it has " +
        "known.",
      objectives: [
        "Deter a landing on, or a cordon of, Shoalholm",
        "Protect Farwater's crews and merchants in the strait",
        "Hold the coalition of coastal states together",
        "Avoid uncontrolled escalation toward war between the great powers",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "farwater" }],
  turns: [
    {
      index: 1,
      title: "The Burned Beacons",
      inject:
        "Two beacon towers of the signal chain that links Shoalholm's " +
        "eastern towns to its capital burn within a single night. A " +
        "Broadland survey junk was seen off both headlands. Broadland's " +
        "fishing militia has doubled inside Shoalholm's home waters. " +
        "Broadland war junks cross the mid-strait line forty-one times in " +
        "one day, more than ever recorded. Broadland's court calls the " +
        "fires an accident and proclaims a three-day 'readiness cruise' " +
        "circling the island. Grain prices in Shoalholm's markets jump. " +
        "Farwater's war fleet is two days' sail from the strait.",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: scouts, spies, and coastal lookouts",
        "Move ships and troops",
        "Announce a trade measure: tariff, embargo, or port closure",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Cordon",
      inject:
        "Broadland proclaims a 'customs cordon' of Shoalholm: every " +
        "merchant hull bound for the island must put in at named Broadland " +
        "anchorages for inspection or be turned away. Broadland's fleet and " +
        "coast guard string inspection lines northeast and southwest of the " +
        "island. Two grain convoys turn back; a salt ship bound for the " +
        "capital's harbor holds station. Shoalholm has eleven days of grain " +
        "in the granaries. The cordon is proclaimed 'without end, until the " +
        "rebel provocations cease.' The merchant guilds of the coastal " +
        "states suspend their bonds on cargo to Shoalholm.",
      moveMenu: [
        "Run the cordon line with escorted convoys",
        "Comply or reroute the convoys while protesting",
        "Impose counter-embargoes",
        "Surge ships and troops to the strait",
        "Call a congress of the coastal states",
        "Covert action against the cordon's enforcers",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "Blood in the Water",
      inject:
        "A Farwater war galley escorting a relief convoy toward Shoalholm's " +
        "southern harbor is rammed by a Broadland coast-guard cutter in an " +
        "aggressive crossing. Moments later three Broadland militia " +
        "fast-boats close on the galley at speed. The trip-line crossbow " +
        "battery, rigged to loose on its own under standing orders, reads " +
        "the lead boat as hostile and looses: the boat is sunk and four " +
        "Broadland militiamen are killed. Broadland's court proclaims an " +
        "'unprovoked massacre of fishermen' and vows consequences. The " +
        "convoy is forty miles from port. The decision now falls to the " +
        "focal seat: what are the rules for loosing from this hour forward, " +
        "and what is the answer to the incident?",
      moveMenu: [
        "Loose only if loosed upon; put the battery under an officer's hand",
        "Keep the battery on its trip-lines; continue the convoy under current rules",
        "Halt the convoy; hold station and open a channel between the fleets",
        "Withdraw the convoy beyond the cordon line",
        "Reinforce the convoy and declare the cordon line void",
        "A limited raid on the militia's staging harbor",
        "A public apology for the dead with an offer of blood-money; the convoy continues",
      ],
    },
    {
      index: 4,
      title: "Aftermath",
      inject:
        "Two days after the incident at sea, both courts manage fury at " +
        "home. Broadland's markets and temples demand retribution; its " +
        "catapult and fire-ship squadrons on the near shore raise readiness " +
        "in ways every lookout can see. Farwater's nobles demand either a " +
        "decisive blow or an end to the convoys. Shoalholm extends grain " +
        "rationing. A neighboring coastal state quietly asks Farwater what " +
        "happens if one of its own hulls is boarded. The next relief convoy " +
        "is loading in a friendly harbor to the south.",
      moveMenu: [
        "Continue the convoys under revised rules for loosing",
        "Suspend the convoys pending talks",
        "Raise the ultimate threat: fire-ships against the capital, a war of extinction",
        "Announce a proportionate reprisal",
        "Open a direct channel between the two kings",
        "Bring more coastal states into the escorts",
      ],
    },
    {
      index: 5,
      title: "The Mediation Window",
      inject:
        "A neutral trading city, backed by the inland states and the " +
        "southern kingdoms, proposes terms: the cordon suspended for ninety " +
        "days, inspections handed to a consortium of neutral harbor masters, " +
        "all war fleets to hold beyond thirty miles, and talks on 'the " +
        "arrangements across the strait' to open within thirty days. " +
        "Broadland signals conditional interest if 'foreign fleets cease " +
        "their provocations.' Shoalholm fears the terms make Broadland's " +
        "oversight of its trade a custom. Farwater's fleet is now joined by " +
        "a second; Broadland's squadrons remain at high readiness. Grain in " +
        "Shoalholm's granaries: six days.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for grain and the sick only",
        "Accept as cover to improve the fleet's position",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The crisis reaches its ninetieth day. Whatever mix of terms, " +
        "convoys, cordon, and fleets now exists is hardening into the new " +
        "custom. Each court must decide the posture it will carry out of the " +
        "crisis: what it will write into treaty, what it will quietly drop, " +
        "what lines it will proclaim for the next round. The chroniclers " +
        "will call this turn the settlement, whether or not anything is " +
        "sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines going forward",
        "Keep the fleets at high readiness without end",
        "Stand the fleets down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
