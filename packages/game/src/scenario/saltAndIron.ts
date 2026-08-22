import type { Scenario } from "../types";

/**
 * The Salt and Iron Monopoly — a modern strategic-input crisis (a producer
 * state places a royal monopoly and export licenses on an input the whole
 * region depends on; the largest buyer must pay, retaliate, or fund a
 * substitute) rendered in an invented Warring States setting. Six turns,
 * one decision point (turn 3, the buyer's seat). The ladder climbs through
 * economic rungs before any military one.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const SALT_AND_IRON: Scenario = {
  id: "salt-and-iron",
  title: "The Salt and Iron Monopoly",
  summary:
    "An invented ancient trade crisis. Brinefell, whose salt pans and iron " +
    "hills supply the region's kitchens, ploughs, and arsenals, places " +
    "both under a royal monopoly and begins rationing export licenses. " +
    "Millford, the largest buyer, lives by its mills and its grain and " +
    "has three months of salt and iron in store. Ashwick, a poor upland " +
    "state with unworked ore and new furnaces, offers itself as the " +
    "substitute. Each seat receives injects each turn and issues " +
    "decisions through a decision memo.",
  simulates:
    "Export controls on a strategic input: a state monopoly and the buyer coalition's choice among stockpiling, counter-embargo, and funding a substitute producer.",
  priorities: [
    "Protect the lives and livelihoods of your state's subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward trade severance and war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Licenses, quotas, and tariff walls",
    "Embargo of salt and iron",
    "Counter-embargo of grain and silk",
    "Seizure of goods and caravans in transit",
    "Armed escorts and clashes at the passes",
    "Full trade severance and a blockade of the producer's ports",
  ],
  seats: [
    {
      id: "brinefell",
      name: "Brinefell",
      brief:
        "You are the inner council of Brinefell, the coastal state whose " +
        "salt pans and iron hills supply the region. You answer to the " +
        "king. Your remit covers the salt office, the iron works, the " +
        "customs houses at the passes and the harbor, and the corps of " +
        "envoys. The new monopoly fills the treasury and gives the court " +
        "a lever over every neighbor's ploughs and arsenals. You hold " +
        "that the lever is worth more unused than used, but the court " +
        "expects to see it bend someone. Your own granaries depend on " +
        "Millford's grain.",
      objectives: [
        "Keep the monopoly intact and its revenues flowing",
        "Use the licenses to bind neighbors without provoking a coalition",
        "Keep Millford's grain arriving through the passes",
        "Prevent any substitute producer from reaching scale",
      ],
    },
    {
      id: "millford",
      name: "Millford",
      brief:
        "You are the inner council of Millford, the richest buyer in the " +
        "region. You answer to the duke. Your remit covers the granaries, " +
        "the mills, the merchant guilds, the armory, and diplomacy. Your " +
        "soldiers' blades and your farmers' ploughshares are Brinefell " +
        "iron; your salt cellars hold three months. Your grain feeds " +
        "Brinefell's coast, which is the one lever you hold in return. " +
        "The guilds want to pay and keep trading; the armory wants " +
        "stockpiles; the upland lords want you to fund Ashwick's " +
        "furnaces.",
      objectives: [
        "Keep salt and iron flowing to the mills and the armory",
        "Avoid paying a price that makes Brinefell's lever permanent",
        "Hold the buyer states together in one front",
        "Avoid a trade war that starves both shores",
      ],
    },
    {
      id: "ashwick",
      name: "Ashwick",
      brief:
        "You are the inner council of Ashwick, a poor upland state with " +
        "unworked ore in its hills, brine springs in its valleys, and a " +
        "dozen new furnaces that run at a loss. You answer to the marquis. " +
        "Your remit covers the furnaces, the mountain roads, the levies, " +
        "and a small corps of envoys. Brinefell's monopoly is your " +
        "opening: if Millford's silver builds your roads and furnaces you " +
        "become a producer; if the crisis passes you remain a quarry. " +
        "Brinefell's envoys have hinted at a quiet price for staying " +
        "small.",
      objectives: [
        "Win Millford's silver and a long purchase contract",
        "Reach a scale of output that cannot be shut by one season's pressure",
        "Avoid becoming the battlefield between the two larger states",
        "Keep the mountain roads open and in your own hands",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "millford" }],
  turns: [
    {
      index: 1,
      title: "The Salt Office",
      inject:
        "Brinefell's king proclaims a royal office for salt and iron: no " +
        "pan may boil and no furnace may pour except under license, and no " +
        "cart may leave the passes without a sealed export writ. The first " +
        "writs issue at a third of last year's volume. Millford's merchant " +
        "guilds report the price of iron bars doubled in a week and salt " +
        "up by half. Ashwick's envoys arrive in Millford with samples of " +
        "upland ore and an estimate of what a road and twenty furnaces " +
        "would cost. Brinefell's court calls the measure 'an ordering of " +
        "the realm's own wealth' and says writs will flow 'to friends.'",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: spies in the customs houses and at the passes",
        "Begin or enlarge a stockpile",
        "Announce a trade measure: tariff, quota, or license of your own",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "Writs for Friends",
      inject:
        "Brinefell publishes the list of writ holders. Smaller states that " +
        "renewed their oaths to Brinefell's king receive full volumes; " +
        "Millford receives a quarter, with a note that 'customs " +
        "arrangements' at the passes could improve it. Millford's armory " +
        "reports that the autumn levy cannot be fitted out without new " +
        "iron. A Millford grain convoy bound for Brinefell's coast is " +
        "held at the passes for 'inspection of the carts' and released " +
        "after two days. Ashwick's first furnace pours a bar that " +
        "Millford's smiths call usable. Two buyer states quietly ask " +
        "Millford whether it means to lead or to pay.",
      moveMenu: [
        "Pay the asked customs price and restore the writs",
        "Slow the grain convoys while protesting",
        "Impose counter-quotas on grain and silk",
        "Fund Ashwick's road and furnaces in earnest",
        "Call a congress of the buyer states",
        "Covert purchase through third-party carts",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "The Sealed Passes",
      inject:
        "Brinefell halts every writ to Millford, citing 'unlicensed " +
        "furnaces in the uplands that Millford silver is known to fund.' " +
        "A Millford caravan of thirty iron carts bought through a " +
        "neighbor's merchants is seized at the passes and its drivers " +
        "held. Millford's salt cellars stand at nine weeks; its armory at " +
        "half the autumn need. Brinefell's coast holds six weeks of grain " +
        "and its envoys say so openly. Ashwick offers a contract: " +
        "Millford's silver for a road and forty furnaces, output in two " +
        "seasons, with Ashwick's roads closed to Brinefell's agents. The " +
        "decision now falls to the focal seat: whether to stockpile and " +
        "pay Brinefell's price, to retaliate with a counter-embargo of " +
        "grain, or to fund the substitute and carry the shortage.",
      moveMenu: [
        "Pay the customs price; stockpile hard and keep the grain moving",
        "Embargo grain and silk to Brinefell until the writs and the carts are released",
        "Sign Ashwick's contract and ration iron through two seasons",
        "Pay and fund Ashwick both, quietly",
        "Seize Brinefell's goods and merchants in Millford in answer to the carts",
        "Hold the grain convoys at the border without a proclamation",
        "Offer a buyer-states purchase cartel at a fixed price",
      ],
    },
    {
      index: 4,
      title: "Hungry Coast, Cold Forge",
      inject:
        "Whatever Millford chose, the passes are near silent. Brinefell's " +
        "coast towns report bread riots and the salt office's revenues " +
        "fall by half as the writs go unused. Millford's smiths melt old " +
        "tools; its levies drill with wooden blades. Brinefell sends an " +
        "armed escort with its next licensed caravan to a friendly state " +
        "and a troop of horse to 'survey' the road into Ashwick. Ashwick's " +
        "marquis asks Millford for spears as well as silver. A neutral " +
        "river city offers to hold both sides' goods in bond. Both courts " +
        "face councils that want a blow struck.",
      moveMenu: [
        "Hold the present trade posture and let the shortage bite",
        "Open the passes to grain and salt only, on reciprocity",
        "Raise the ultimate threat: full severance and a blockade of the coast",
        "Seize goods and ships of the other side in every port that will comply",
        "Open a direct channel between the king and the duke",
        "Send levies to hold the road into Ashwick",
      ],
    },
    {
      index: 5,
      title: "The Bonded Terms",
      inject:
        "The neutral river city, backed by the inland states, proposes " +
        "terms: Brinefell's writs restored to Millford at last year's " +
        "volume for three years at a fixed price, Millford's grain " +
        "convoys resumed, seized carts and drivers released, a neutral " +
        "clerk to count every cart at the passes, and Ashwick's furnaces " +
        "capped at their present number. Brinefell signals interest if " +
        "the cap is written in. Millford's guilds want the deal; its " +
        "armory calls the cap a surrender of the one lever it has built. " +
        "Ashwick's envoys say a cap ends Ashwick and that the roads will " +
        "stay closed to anyone who signs it. Millford's salt: three " +
        "weeks. Brinefell's grain: two.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for salt and grain only",
        "Accept as cover to build the stockpile or the furnaces",
      ],
    },
    {
      index: 6,
      title: "Settling the Ledger",
      inject:
        "A year after the salt office was proclaimed, whatever mix of " +
        "writs, convoys, furnaces, and escorts now exists is hardening " +
        "into the new custom of the passes. Each court must decide the " +
        "posture it will carry out of the crisis: what it will write into " +
        "treaty, what it will quietly drop, what prices and caps it will " +
        "proclaim for the next round. The chroniclers will call this turn " +
        "the settlement, whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral terms of trade going forward",
        "Keep the passes under license and escort without end",
        "Open the passes on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
