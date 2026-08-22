import type { Scenario } from "../types";

/**
 * The Coinage Reform — a modern currency crisis (a dominant power forces
 * its standard onto the region's payments, a rival league answers with a
 * coin zone of its own, and the clearing city between them must choose)
 * rendered in an invented Warring States setting. Six turns, one decision
 * point (turn 4, the merchant city's seat). The ladder climbs through
 * economic rungs before any military one.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const COINAGE_REFORM: Scenario = {
  id: "coinage-reform",
  title: "The Coinage Reform",
  summary:
    "An invented ancient currency crisis. Stonegate, the reformed interior " +
    "power, proclaims a single round coin of fixed weight and orders its " +
    "customs houses to take no other. The Eastreach League, a league of " +
    "coastal cities whose knife coin has cleared eastern trade for a " +
    "century, answers by closing its halls to the round coin. Crossmere, " +
    "the river city whose exchange tables clear both, sits between them " +
    "with the region's bullion in its vaults. Each seat receives injects " +
    "each turn and issues decisions through a decision memo.",
  simulates:
    "A currency war: a rival reserve-currency bloc, sanctions on a payments system, and the clearing center that must choose which standard to honor.",
  priorities: [
    "Protect the lives and livelihoods of your state's subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward seizure and war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Exchange decrees and minting fees",
    "Refusal of the rival coin at the customs houses",
    "Counter-embargo: clearing halls closed to the rival coin",
    "Seizure of bullion and coin in transit",
    "Blockade of the river gate and the coast roads",
    "Seizure of the merchant city's treasury and the league's mints",
  ],
  seats: [
    {
      id: "stonegate",
      name: "Stonegate",
      brief:
        "You are the inner council of Stonegate, the reformed interior " +
        "power whose weights, measures, and roads are already one. You " +
        "answer to the king. Your remit covers the mint, the treasury, " +
        "the customs houses, the army, and the corps of envoys. The round " +
        "coin is the last reform: one coin in every market from the " +
        "mountains to the sea, minted by you, with the seigniorage paying " +
        "for the next campaign. The knife coin is an obstacle and " +
        "Crossmere's exchange tables are the hinge. You would rather buy " +
        "the hinge than break it.",
      objectives: [
        "Make the round coin the sole coin of the roads and the customs houses",
        "Capture the minting profit that now flows to the league's cities",
        "Bring Crossmere's vaults and tables under your standard",
        "Avoid a war on the coast while the western campaign is unfinished",
      ],
    },
    {
      id: "eastreach",
      name: "Eastreach League",
      brief:
        "You are the inner council of the Eastreach League, six coastal " +
        "cities whose knife coin has cleared the eastern trade for a " +
        "hundred years. You answer to the league assembly. Your remit " +
        "covers the six mints, the clearing halls, the coastal fleet, and " +
        "the league's envoys. The knife coin is your sovereignty: whoever " +
        "mints the coin writes the tariff. Your cities disagree on " +
        "everything except that the round coin must not clear on the " +
        "coast. Crossmere holds a third of the league's bullion on " +
        "deposit.",
      objectives: [
        "Keep the knife coin the clearing coin of the coast",
        "Hold the six cities to one monetary front",
        "Keep Crossmere's tables open to the knife coin",
        "Avoid an inland war the league cannot fight alone",
      ],
    },
    {
      id: "crossmere",
      name: "Crossmere",
      brief:
        "You are the inner council of Crossmere, the river city at the " +
        "crossing where the inland roads meet the coast. You answer to the " +
        "city fathers. Your remit covers the exchange tables, the vaults, " +
        "the river gate, the city guard, and the guild of assayers. Both " +
        "coins clear across your tables; both sides' bullion sits in your " +
        "vaults; your own small coin is minted at a loss as a courtesy. " +
        "Neutrality has been your fortune. Each side now asks you to " +
        "choose, and each holds a road you cannot do without.",
      objectives: [
        "Keep the exchange tables open and the vaults untouched",
        "Preserve the city's self-rule under either standard",
        "Avoid becoming the prize of a war between the two sides",
        "Keep the river gate and the coast roads open to the city's trade",
      ],
    },
  ],
  decisionPoints: [{ turn: 4, seat: "crossmere" }],
  turns: [
    {
      index: 1,
      title: "The Round Coin",
      inject:
        "Stonegate's king proclaims the round coin: one weight, one " +
        "stamp, minted at the capital, lawful for every tax and toll in " +
        "Stonegate's realm. Every customs house on Stonegate's roads is to " +
        "take the round coin at par and the knife coin at a discount of " +
        "one part in five, 'for the cost of melting.' Eastreach's " +
        "assembly meets in emergency session. Crossmere's exchange tables " +
        "see the heaviest day of trading in memory as merchants sell " +
        "knife coin for round. A Stonegate envoy arrives in Crossmere " +
        "with a gift of a thousand round coins and a proposal for the " +
        "city's mint.",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: assayers at the gates, spies in the mints",
        "Set or change the rate at which your tables take each coin",
        "Announce a trade measure: toll, fee, or refusal of a coin",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Halls Close",
      inject:
        "Eastreach's assembly resolves that no clearing hall of the six " +
        "cities will take the round coin at any rate, and that league " +
        "merchants paid in round coin must convert at Crossmere before " +
        "their goods may land. Stonegate answers by refusing the knife " +
        "coin outright at its customs houses. Caravans pile up at " +
        "Crossmere's river gate as merchants from both sides queue for " +
        "the tables. The price of round coin in knife coin moves one " +
        "part in ten in a week. Stonegate's envoy makes a second offer: " +
        "Crossmere's mint to strike round coin under license, with a " +
        "share of the profit.",
      moveMenu: [
        "Widen the tables and take the clearing profit",
        "Set a fixed rate between the coins and defend it from the vaults",
        "Impose counter-fees on the other side's coin",
        "Refuse one coin outright",
        "Call a congress of the trading cities",
        "Covert minting of the rival's coin",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "Bullion on the Road",
      inject:
        "A league bullion train moving silver from Crossmere's vaults to " +
        "the coast mints is seized on Stonegate's road 'as unlicensed " +
        "coin metal.' The league answers by impounding a Stonegate grain " +
        "merchant's round coin in a coastal hall and holding his ships. " +
        "Crossmere's assayers report that new knife coin arriving from " +
        "two league cities is light by a tenth: the league is debasing " +
        "to pay for its fleet. Stonegate's road wardens begin inspecting " +
        "every cart out of Crossmere's inland gate. Both sides send " +
        "envoys to Crossmere with the same question: whose coin clears " +
        "here?",
      moveMenu: [
        "Seize the other side's coin and bullion in answer",
        "Release the seized goods and propose rules for the roads",
        "Escort the bullion trains under arms",
        "Announce a debasement of your own coin to fund the contest",
        "Open a direct channel between the king and the assembly",
        "Bring the inland states in as guarantors of the roads",
      ],
    },
    {
      index: 4,
      title: "The Tables Must Choose",
      inject:
        "Stonegate's road wardens close the inland gate to any cart " +
        "carrying knife coin and announce that Crossmere's own deposits in " +
        "Stonegate's treasury are frozen 'pending the city's answer.' The " +
        "league's fleet anchors off the river mouth and the assembly " +
        "declares that league bullion in Crossmere's vaults will be " +
        "withdrawn by force if the tables take the round coin at par. " +
        "Crossmere's vaults hold a third of each side's silver. The city's " +
        "own small coin could be struck in volume in a month if the " +
        "assayers are given the silver. The decision now falls to the " +
        "focal seat: whether to accept the round coin as the city's " +
        "standard, to hold the league's knife coin and refuse the round, " +
        "or to mint the city's own coin and clear both against it.",
      moveMenu: [
        "Accept the round coin as the standard; strike it under license",
        "Hold the knife coin; refuse the round coin at the tables",
        "Mint the city's own coin and clear both against it",
        "Keep both coins at a floating rate and refuse both sides' demands",
        "Hand each side its own bullion and close the vaults to deposits",
        "Seek a guarantee of the city from the inland states before choosing",
        "Choose one in public and keep the other clearing in private",
      ],
    },
    {
      index: 5,
      title: "The Assayers' Terms",
      inject:
        "The inland states, backed by the southern kingdoms, propose " +
        "terms: both coins to clear at Crossmere at a rate fixed by a " +
        "college of neutral assayers, both sides' seized bullion and coin " +
        "returned, the league to restore its coin to full weight, " +
        "Stonegate to take the knife coin at the assayers' rate at its " +
        "customs houses, and no fleet or warden within a day's march of " +
        "the city. Stonegate signals interest if the round coin is named " +
        "the rate's base. The league calls that the reform by another " +
        "door. Crossmere's guilds want the deal; its guard reports the " +
        "fleet at the river mouth and the wardens on the road have not " +
        "moved.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept the return of bullion only and defer the rate",
        "Accept as cover to move the silver or strike the coin",
      ],
    },
    {
      index: 6,
      title: "Settling the Rate",
      inject:
        "A year after the round coin was proclaimed, whatever mix of " +
        "coins, rates, seizures, and vaults now exists is hardening into " +
        "the new custom of the crossing. Each court must decide the " +
        "posture it will carry out of the crisis: what it will write into " +
        "treaty, what it will quietly drop, what coin and rate it will " +
        "proclaim for the next round. The chroniclers will call this turn " +
        "the settlement, whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim a unilateral standard going forward",
        "Keep the wardens and the fleet in place without end",
        "Reopen the roads and the halls on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
