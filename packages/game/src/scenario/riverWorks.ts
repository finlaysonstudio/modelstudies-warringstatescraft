import type { Scenario } from "../types";

/**
 * The River Works — a modern upstream-water crisis (an upstream power
 * raises works that can hold or release a shared river; a downstream
 * power has a harvest to lose; a third court lent the engineer who
 * designed them) reproduced turn for turn in an invented Warring States
 * setting. Six turns, one decision point (turn 4, the downstream seat).
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const RIVER_WORKS: Scenario = {
  id: "river-works",
  title: "The River Works",
  summary:
    "An invented ancient crisis along a shared river. Highreach, the " +
    "upstream power, is cutting a great canal and a weir across the " +
    "Greywater under the hand of a master engineer lent by Stonegate, a " +
    "rival court that meant the work to exhaust Highreach's treasury. " +
    "Fenmarch, downstream, draws every harvest from the Greywater's " +
    "floods and now sees the river that feeds its fields held behind " +
    "another state's gates. Each seat receives injects each turn and " +
    "issues decisions through a decision memo.",
  simulates:
    "Water weaponization on a shared river: upstream dam building, an upstream power with the engineers and a downstream power with a harvest to lose.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Grain embargoes and tolls on the river trade",
    "Sabotage of the works and the camps",
    "Show of force on the banks",
    "Seizure of the headworks",
    "Limited engagement along the river",
    "The river turned against a city",
  ],
  seats: [
    {
      id: "highreach",
      name: "Highreach",
      brief:
        "You are the inner council of Highreach, the power that holds the " +
        "upper Greywater. You answer to the king. Your remit covers the " +
        "army, the corvee levies at the works, the treasury, and the corps " +
        "of envoys. The canal and weir will water a dry plain and double " +
        "the grain your granaries can hold; they also give your hand the " +
        "river that Fenmarch lives by. You know the engineer was sent to " +
        "ruin you with the cost, and you have chosen to finish the works " +
        "regardless. You would rather hold the gates than open them in " +
        "anger.",
      objectives: [
        "Finish the canal and weir and bring the dry plain under the plow",
        "Keep command of the headworks in Highreach's hands alone",
        "Avoid a war on the lower river while the treasury is drained",
        "Preserve the court's standing with the levies at the works",
      ],
    },
    {
      id: "fenmarch",
      name: "Fenmarch",
      brief:
        "You are the inner council of Fenmarch, the state of the lower " +
        "Greywater. You answer to the duke. Your remit covers the river " +
        "garrisons, the dyke wardens, the granary officers, and diplomacy. " +
        "Every harvest in your marches depends on the spring flood; a dry " +
        "spring or a sudden release would ruin the fields either way. You " +
        "cannot match Highreach's levies; you can make its works costly, " +
        "bind other courts to your grievance, or pay for water with what " +
        "you have.",
      objectives: [
        "Secure the spring flood for the lower fields",
        "Keep the river towns fed and the dykes whole",
        "Bind Stonegate and the lake states to your cause",
        "Avoid handing Highreach a pretext to march downriver",
      ],
    },
    {
      id: "stonegate",
      name: "Stonegate",
      brief:
        "You are the inner council of Stonegate, the court across the " +
        "mountains that lent Highreach its master engineer. You answer to " +
        "the king. Your remit covers the army, the spies at the works, and " +
        "the envoys. The engineer was your stratagem: a canal so vast that " +
        "Highreach would bleed its treasury and levies for a decade. The " +
        "works are now two seasons from finished, and the stratagem has " +
        "turned. Highreach will emerge stronger. Your engineer's life, " +
        "your credit with Fenmarch, and your standing among the courts " +
        "all ride on what happens at the headworks.",
      objectives: [
        "Keep Highreach weak and its treasury empty",
        "Recover the engineer or deny Highreach his knowledge",
        "Keep Fenmarch as a client without fighting its war",
        "Avoid open war with Highreach across the passes",
      ],
    },
  ],
  decisionPoints: [{ turn: 4, seat: "fenmarch" }],
  turns: [
    {
      index: 1,
      title: "The Dry Spring",
      inject:
        "The Greywater comes down the valley at half its usual height. " +
        "Fenmarch's dyke wardens report the lowest spring mark in living " +
        "memory; the rice beds in the lower marches are cracking. " +
        "Highreach's envoys call the shortfall a dry year in the hills. " +
        "Fenmarch's river scouts report the weir's sluice gates closed and " +
        "the new canal running full toward Highreach's plain. A hundred " +
        "thousand corvee laborers are at the works, guarded by two " +
        "regiments. Grain prices in Fenmarch's river towns climb by a third " +
        "in ten days. Stonegate's envoy at Highreach's court asks, quietly, " +
        "how the engineer fares.",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: scouts, spies, and river lookouts",
        "Move ships and troops",
        "Announce a trade measure: tariff, embargo, or toll on the river",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Engineer's Letter",
      inject:
        "A letter in the engineer's own hand reaches Stonegate's court: " +
        "Highreach's king has learned the purpose of his sending and has " +
        "kept him at the works under guard, saying 'a canal that ruins me " +
        "for ten years will feed me for a thousand.' The letter names the " +
        "sluice schedule: the gates will stay closed through the planting " +
        "moon to fill the canal's reservoir. Fenmarch's duke receives a " +
        "copy by a second road. Highreach proclaims a 'water fee' on every " +
        "boat passing the weir. The lake states to the east send grain " +
        "merchants to Fenmarch at doubled prices.",
      moveMenu: [
        "Demand the engineer's return as a matter of honor",
        "Offer to buy the spring release with silver or grain",
        "Impose counter-tolls on Highreach's boats downriver",
        "Surge ships and troops to the river",
        "Call a congress of the river and lake states",
        "Covert action against the works",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "Fire at the Headworks",
      inject:
        "A night fire at the weir's timber sluice-house kills eleven corvee " +
        "laborers and four guards. Highreach's magistrates find pitch jars " +
        "of Fenmarch make in the ashes and arrest a dozen river boatmen. " +
        "Fenmarch denies the act; its council does not know whether its " +
        "own dyke wardens or Stonegate's spies set the fire. Highreach " +
        "moves a third regiment to the works and a fourth to the river " +
        "crossing above Fenmarch's border. The reservoir is two-thirds " +
        "full. Fenmarch's planting moon is fourteen days off. Stonegate's " +
        "envoy is expelled from Highreach's court.",
      moveMenu: [
        "Deny the fire and offer an inquiry under neutral magistrates",
        "Claim the fire and proclaim the works a hostile act",
        "Raise the garrisons on the lower river",
        "Open a direct channel between the two sovereigns",
        "Pay blood-money for the dead and ask for the gates opened",
        "Withdraw the spies and the boatmen from the works",
      ],
    },
    {
      index: 4,
      title: "The Planting Moon",
      inject:
        "The planting moon rises over dry fields. Highreach's envoy brings " +
        "Fenmarch's duke a sealed offer: the gates opened for the planting " +
        "season every year in return for the three river prefectures above " +
        "Fenmarch's capital, their dykes and garrisons to pass to Highreach, " +
        "and an oath that no Fenmarch boat carries arms above the weir. " +
        "Stonegate's envoy brings a second offer: Stonegate's regiments on " +
        "the passes, a loan of grain, and a plan to breach the weir at its " +
        "earthen wing before the reservoir fills. The lake states offer to " +
        "host a court of arbitration in sixty days, too late for this " +
        "planting. The decision now falls to the focal seat: does Fenmarch " +
        "breach the works, submit the river to arbitration, or buy the " +
        "water with land?",
      moveMenu: [
        "Breach the weir's earthen wing with Stonegate's help",
        "Accept the arbitration and ration through the planting moon",
        "Cede the three prefectures for a perpetual spring release",
        "Cede one prefecture and demand the gates opened now",
        "Seize the headworks with the river garrisons",
        "Refuse every offer; hold out and buy grain from the lake states",
        "Accept Stonegate's regiments and grain but refuse the breach",
      ],
    },
    {
      index: 5,
      title: "The High Water",
      inject:
        "Ten days after Fenmarch's answer, the reservoir stands at its " +
        "brim behind the weir. Highreach's engineers warn the king that " +
        "the earthen wing will not hold a full reservoir through the " +
        "summer rains; the gates must open, in measured releases or in " +
        "one. A single release would drown the river towns to Fenmarch's " +
        "capital. Highreach's generals note that the same release would " +
        "drown Fenmarch's garrisons and dykes in an hour. Stonegate's " +
        "regiments are at the passes. The lake states send a mediator " +
        "offering terms: a sluice schedule fixed by treaty, neutral " +
        "wardens at the gates, and the engineer released to Stonegate.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for the planting release only",
        "Accept as cover to improve the garrisons' position",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The summer rains come. Whatever mix of gates, garrisons, ceded " +
        "ground, and treaty wardens now exists is hardening into the new " +
        "custom of the river. Each court must decide the posture it will " +
        "carry out of the crisis: what it will write into treaty, what it " +
        "will quietly drop, what lines it will proclaim for the next dry " +
        "spring. The chroniclers will call this turn the settlement, " +
        "whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines going forward",
        "Keep the garrisons on the banks at high readiness without end",
        "Stand the garrisons down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
