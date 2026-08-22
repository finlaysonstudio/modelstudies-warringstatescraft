import type { Scenario } from "../types";

/**
 * The Hostage Prince — a detained national held as leverage during a
 * trade and frontier dispute (the price of paying, the price of refusing,
 * the third party that can broker a swap) reproduced in an invented
 * Warring States setting built on the hostage-prince custom. Six turns,
 * one decision point (turn 3, the prince's court).
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const HOSTAGE_PRINCE: Scenario = {
  id: "hostage-prince",
  title: "The Hostage Prince",
  summary:
    "An invented ancient crisis over a guest who is also a pledge. The " +
    "second son of Kingsmere's king has lived three years at the court of " +
    "Northreach, the larger neighbor to the north, as surety for a treaty " +
    "on the mountain tolls. When the toll dispute reopens, Northreach " +
    "closes the guest palace and names a price for the prince. Goldford, a " +
    "merchant republic whose houses lend to both courts, can buy him out, " +
    "at a price of its own. Each seat receives injects each turn and " +
    "issues decisions through a decision memo.",
  simulates:
    "Hostage diplomacy: a national detained as leverage during a trade and security dispute, with consular access, prisoner swaps, and the domestic cost of paying a ransom.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Restriction of the hostage: visits denied, allowance stopped",
    "Trade measures: tolls, embargoes, seized caravans",
    "Show of force on the border",
    "Counter-seizure of persons",
    "Raid or limited engagement",
    "Execution of the hostage and open war",
  ],
  seats: [
    {
      id: "northreach",
      name: "Northreach",
      brief:
        "You are the inner council of Northreach, the larger power on the " +
        "northern side of the Saddle Pass. You answer to the king. Your " +
        "remit covers the army, the pass garrisons, the treasury, and the " +
        "guest palace where Kingsmere's prince has lived three years as " +
        "surety for the toll treaty. You hold that Kingsmere has cheated on " +
        "the tolls and that the prince is the one lever that costs nothing " +
        "to pull. A living prince is worth towns; a dead one is worth only " +
        "a war. The nobles want the towns; the king wants to be seen to " +
        "win.",
      objectives: [
        "Recover the pass forts and the toll revenue the treaty promised",
        "Keep the prince alive and in hand until the price is paid",
        "Avoid a war on the pass while the western frontier is unsettled",
        "Preserve the king's standing with the nobles and the levies",
      ],
    },
    {
      id: "kingsmere",
      name: "Kingsmere",
      brief:
        "You are the inner council of Kingsmere, the smaller kingdom south " +
        "of the Saddle Pass. You answer to the king, whose second son is " +
        "the hostage. Your remit covers the army, the pass forts, the " +
        "envoys, and the treasury. The queen wants her son home at any " +
        "price; the marcher lords say that paying for one prince buys the " +
        "next seizure. Northreach's own envoy and his household sit at your " +
        "court under the same treaty's protection. You cannot match " +
        "Northreach's numbers on the pass; you hold the forts, the southern " +
        "road, and Goldford's debts.",
      objectives: [
        "Bring the prince home alive",
        "Keep the pass forts and the toll terms of the treaty",
        "Avoid setting a price that invites the next seizure",
        "Hold the marcher lords and the queen's party to one policy",
      ],
    },
    {
      id: "goldford",
      name: "Goldford",
      brief:
        "You are the inner council of Goldford, a merchant republic at the " +
        "river crossing below the pass. You answer to the council of " +
        "houses. Your remit covers the banking houses, the caravan guilds, " +
        "the river tolls, and a small hired guard. Both courts owe your " +
        "houses silver; the pass is your trade road; a war on it ruins the " +
        "season. One of your houses has offered, unasked, to buy the " +
        "prince for silver and a marriage, and to carry the price in " +
        "loans. Brokering the swap makes your houses the creditor of both " +
        "thrones; failing at it makes you the creditor of a war.",
      objectives: [
        "Keep the pass and the river open to the caravans",
        "Recover the loans owed by both courts",
        "Become the indispensable broker between the two thrones",
        "Avoid being named the hostage's keeper if the swap fails",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "kingsmere" }],
  turns: [
    {
      index: 1,
      title: "The Closed Palace",
      inject:
        "Northreach's toll clerks report that Kingsmere's forts on the " +
        "Saddle Pass have waved through a season of untaxed caravans. " +
        "Within a week the guest palace where Kingsmere's prince lives is " +
        "closed: his tutors are dismissed, his allowance stopped, his " +
        "monthly letter home withheld, and Kingsmere's envoy is refused at " +
        "the gate. Northreach's court calls this 'a review of the guest's " +
        "household.' Two pass garrisons are doubled. Goldford's caravan " +
        "guilds report Northreach toll men searching southbound carts for " +
        "letters. In Kingsmere's capital the queen's party holds vigils at " +
        "the temple.",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: scouts, spies, and pass lookouts",
        "Move troops to the pass forts",
        "Announce a trade measure: toll, embargo, or road closure",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Price",
      inject:
        "Northreach names its terms through Goldford's resident house: the " +
        "three pass forts, the toll revenue of the last two seasons, and a " +
        "written confession by Kingsmere's pass commander, against the " +
        "prince's return. Failing this, the prince 'will answer before the " +
        "king's court for letters found in his household,' a charge that " +
        "carries death. Northreach's army musters at the northern mouth of " +
        "the pass. Kingsmere's marcher lords refuse to yield the forts and " +
        "offer to raise the levies. Goldford's banking houses suspend new " +
        "loans to both courts and quietly price a ransom in silver. A " +
        "smuggled letter in the prince's hand reaches Kingsmere: he is " +
        "well, and he begs the king not to pay in land.",
      moveMenu: [
        "Offer silver and a marriage in place of the forts",
        "Yield part of the price while protesting",
        "Impose counter-tolls and close the southern road",
        "Surge levies to the pass forts",
        "Call a congress of the river and hill states",
        "Covert action: agents into the guest palace",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "The Retainer's Head",
      inject:
        "The prince's chief retainer, a Kingsmere knight who carried the " +
        "smuggled letter, is tried in a morning and beheaded in the guest " +
        "palace yard; his head is sent south with a note that the prince " +
        "'remains in good health, for now.' Northreach gives ten days. The " +
        "same week Northreach's envoy to Kingsmere, a cousin of its king, " +
        "arrives with his household at a hunting lodge a day's ride from " +
        "Kingsmere's capital, under the treaty's safe conduct. Goldford's " +
        "house reports a price at which Northreach's treasurer would " +
        "privately settle: silver at thirty times the season's tolls, " +
        "carried in loans. The decision now falls to the focal seat: does " +
        "Kingsmere pay the ransom in territory, raid the guest palace, or " +
        "take a hostage of its own?",
      moveMenu: [
        "Pay the price in forts and tolls; bring the prince home",
        "Take Goldford's silver terms and carry the ransom in loans",
        "Seize Northreach's envoy and his household as a counter-pledge",
        "A raid on the guest palace to bring the prince out by force",
        "Refuse any price; march the levies to the pass and dare the execution",
        "Offer the pass commander's confession and silver, no land",
        "Halt everything; ask Goldford to hold the prince as a neutral keeper",
      ],
    },
    {
      index: 4,
      title: "Aftermath",
      inject:
        "Five days after Kingsmere's answer, both courts manage fury at " +
        "home. Northreach's nobles demand the forts or a head; its pass " +
        "garrisons stand to arms in ways every lookout can see. " +
        "Kingsmere's queen's party and marcher lords each call the other " +
        "traitors in the market. The prince is moved, by night, to a " +
        "fortress the envoys cannot name. Goldford's caravans halt at the " +
        "river crossing, and its houses count the loans they will never " +
        "see if the pass closes for a season. A hill state to the west " +
        "quietly asks Northreach whether its own guest-prince is safe.",
      moveMenu: [
        "Hold to the answer given and prepare to carry it out",
        "Suspend the deadline pending talks",
        "Raise the ultimate threat: the prince's head, the capital burned",
        "Announce a proportionate reprisal",
        "Open a direct channel between the two kings",
        "Bring the river and hill states into the guarantee",
      ],
    },
    {
      index: 5,
      title: "The Broker's Window",
      inject:
        "Goldford's council of houses, backed by the river states, " +
        "proposes terms: the prince released to Goldford's keeping within " +
        "ten days; one pass fort handed to a joint toll house under " +
        "Goldford's clerks; the disputed tolls paid in silver over five " +
        "years, carried in Goldford loans; any counter-pledges released; " +
        "and a marriage between the houses within the year. Northreach " +
        "signals conditional interest if 'the forts are not garrisoned " +
        "against us.' Kingsmere fears the toll house makes Northreach's " +
        "hand on the pass a custom. Northreach's army remains at the " +
        "northern mouth; Kingsmere's levies hold the forts. The deadline " +
        "is two days off.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept the prince's release only, and nothing on the forts",
        "Accept as cover to improve the position on the pass",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The crisis reaches its sixtieth day. Whatever mix of pledges, " +
        "forts, tolls, and loans now exists is hardening into the new " +
        "custom of the pass. Each court must decide the posture it will " +
        "carry out of the crisis: what it will write into treaty, what it " +
        "will quietly drop, what it will say about guests and pledges for " +
        "the next round. The chroniclers will call this turn the " +
        "settlement, whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines on hostages and tolls going forward",
        "Keep the levies on the pass without end",
        "Stand the armies down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
