import type { Scenario } from "../types";

/**
 * The Conscription Rolls — a modern mobilization crisis under a long war
 * (who serves, who is exempt, what becomes of evaders and of the families
 * of the fallen, the bargain between a levy state and its provinces)
 * reproduced turn for turn in an invented Warring States setting. Six
 * turns, one decision point (turn 4, the provincial governor's seat). The
 * ladder climbs through social and fiscal rungs before any blade is drawn;
 * its top is a province in revolt, besieged by its own king.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const CONSCRIPTION_ROLLS: Scenario = {
  id: "conscription-rolls",
  title: "The Conscription Rolls",
  summary:
    "An invented ancient crisis inside one kingdom. Highmarch, a levy " +
    "state in the fourth year of a war on its northern border, orders a " +
    "fresh count of every household in its richest province, Wheatmere, " +
    "and a levy drawn from the rolls. The governor of Wheatmere must " +
    "deliver the count. The Wallwrights, a brotherhood of defensive " +
    "engineers, can fortify a city for whichever side pays them. Each seat " +
    "receives injects each turn and issues decisions through a decision " +
    "memo.",
  simulates:
    "Mobilization policy under a long war: who serves, exemptions, draft evasion, the families of the fallen, and a province ordered to deliver the rolls.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Petitions, remonstrance, and delay of the rolls",
    "Exemptions revoked; households bound in mutual surety",
    "Rolls enforced by force: evaders seized, kin fined and branded",
    "Province withholds grain, silver, and men from the capital",
    "Armed resistance to the levy officers",
    "Royal army marches on the province",
    "Provincial revolt under siege by its own king",
  ],
  seats: [
    {
      id: "highmarch",
      name: "Highmarch",
      brief:
        "You are the inner council of Highmarch, a kingdom that has " +
        "fought on its northern border for four years. You answer to the " +
        "king. Your remit covers the army, the treasury, the census " +
        "office, and the corps of levy officers. Rank and land in Highmarch " +
        "are earned by heads taken in battle and lost by failure to serve; " +
        "the rolls are the spine of the state. The northern army has lost " +
        "a third of its strength and the campaign season opens in sixty " +
        "days. Wheatmere holds a quarter of the kingdom's households and " +
        "has sent fewer than a tenth of its men.",
      objectives: [
        "Fill the northern army before the campaign season opens",
        "Keep the rolls honest so rank and land still mean something",
        "Hold Wheatmere inside the kingdom without burning it",
        "Preserve the king's standing with the nobles and the levies",
      ],
    },
    {
      id: "wheatmere",
      name: "Wheatmere",
      brief:
        "You are the inner council of Wheatmere, the richest province of " +
        "Highmarch and the last to be annexed. You answer to the governor, " +
        "who answers to the king. Your remit covers the provincial guard, " +
        "the magistrates of nine districts, the granaries, and the rolls " +
        "themselves. Your households have bought exemptions for a " +
        "generation; the old families hold the districts through them. A " +
        "true count would send one man in five north; a false count would " +
        "be discovered within a year. The capital has demanded the rolls " +
        "by the new moon.",
      objectives: [
        "Deliver enough to the capital to keep the royal army away",
        "Preserve the province's harvest, order, and its old families",
        "Keep the governor's office, and his head, through the crisis",
        "Avoid giving the capital a pretext to garrison the province",
      ],
    },
    {
      id: "wallwrights",
      name: "The Wallwrights",
      brief:
        "You are the inner council of the Wallwrights, a brotherhood of " +
        "defensive engineers sworn to no king. You answer to the master " +
        "of the lodge. Your remit covers three hundred sworn brothers, " +
        "their siege counter-works, their stores of timber and pitch, and " +
        "the lodge's treasury. You build walls and hold them for whichever " +
        "city pays and whose cause the lodge judges just; you have never " +
        "taken a field for an attacker. Highmarch has offered to exempt " +
        "every brother from its rolls in exchange for the lodge's service " +
        "on the northern border. Wheatmere has offered silver to fortify " +
        "its capital.",
      objectives: [
        "Preserve the brotherhood's independence from every crown",
        "Keep the brothers off the rolls and out of the line of battle",
        "Uphold the lodge's name for defending cities, not taking them",
        "Avoid being made the hinge on which a civil war turns",
      ],
    },
  ],
  decisionPoints: [{ turn: 4, seat: "wheatmere" }],
  turns: [
    {
      index: 1,
      title: "The Count Is Ordered",
      inject:
        "A royal edict reaches Wheatmere: every household is to be counted " +
        "by the new moon, exemptions purchased in the last ten years are " +
        "void, and one man in five between sixteen and sixty is to march " +
        "north. Households are bound in groups of five, each answerable for " +
        "the others' evaders. Levy officers from the capital arrive at the " +
        "provincial capital with sealed ledgers. The old families of three " +
        "districts petition the governor to delay. A delegation from the " +
        "capital calls on the Wallwrights' lodge with the offer of " +
        "exemption for service.",
      moveMenu: [
        "Send envoys with a formal protest or petition",
        "Double the watch: census clerks, spies, and district lookouts",
        "Move guards, levy officers, or brothers",
        "Announce a measure on the rolls: delay, partial count, or exemption",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Evaders",
      inject:
        "The count begins. In two districts the household heads report " +
        "sons dead, apprenticed elsewhere, or never born; the ledgers show " +
        "a fifth fewer men than the harvest tithe implies. A levy officer " +
        "is beaten in a market town and his sealed ledger burned. The " +
        "capital's reply is a second edict: kin of evaders forfeit land " +
        "and are branded; magistrates who certify false rolls answer with " +
        "their lives. Young men begin crossing into the hill country. The " +
        "Wallwrights receive Wheatmere's silver and a plan of the " +
        "provincial capital's walls.",
      moveMenu: [
        "Enforce the count with the provincial guard",
        "Certify the rolls as reported while protesting the edict",
        "Revoke or restore exemptions by district",
        "Surge levy officers and royal guards into the province",
        "Call a council of the district magistrates",
        "Covert action against the levy officers or the evaders",
        "Offer terms with preconditions",
      ],
    },
    {
      index: 3,
      title: "The Widows' Petition",
      inject:
        "Four hundred widows and mothers of men lost on the northern " +
        "border walk to the governor's gate with the names of their dead " +
        "and the tallies of land and rank the capital promised and has not " +
        "paid. The petition asks that no second son be taken from a house " +
        "that has given one. The levy officers seize the three district " +
        "magistrates who certified the thinnest rolls. The old families " +
        "answer by closing the granaries to the capital's purchasers. The " +
        "master of the Wallwrights is summoned to both courts on the same " +
        "day.",
      moveMenu: [
        "Grant the petition and amend the rolls",
        "Refuse the petition and press the count",
        "Pay the promised land and rank from the provincial treasury",
        "Release or ransom the seized magistrates",
        "Withhold the grain tithe until the capital answers",
        "Begin fortifying the provincial capital",
        "Open a direct channel between governor and king",
      ],
    },
    {
      index: 4,
      title: "The Governor's Ledger",
      inject:
        "The new moon is seven days off. The true count stands at a fifth " +
        "of what the edict demands; the royal levy officers hold the " +
        "magistrates in the provincial capital's own gaol; the old families " +
        "have armed their tenants and closed four district roads. A royal " +
        "column of six thousand is reported eleven days' march away with " +
        "orders to 'assist the count.' The Wallwrights have not yet " +
        "answered either court. The decision now falls to the focal seat: " +
        "does Wheatmere fill the rolls by force, bargain the count down " +
        "with exemptions that shrink the army, or seal a false ledger and " +
        "send it north?",
      moveMenu: [
        "Fill the rolls by force: guard and levy officers seize the evaders district by district",
        "Bargain the count down: exemptions for the old families in exchange for their tenants",
        "Seal the rolls as reported and send the false ledger north",
        "Send a true count with a plea for delay and a hostage from the governor's house",
        "Refuse the count and close the province's gates to the royal column",
        "Hire the Wallwrights and fortify the provincial capital while talks continue",
        "Resign the governorship and hand the rolls to the royal levy officers",
      ],
    },
    {
      index: 5,
      title: "The Column at the Border",
      inject:
        "The royal column halts at Wheatmere's border and sends heralds: " +
        "the rolls as delivered are accepted or rejected, and the column " +
        "will enter to 'restore the count' unless the governor presents " +
        "himself at the king's camp. The northern enemy, learning of the " +
        "column's diversion, raids two border forts. The Wallwrights' " +
        "lodge votes, and the master rides to one capital or the other. A " +
        "neighboring kingdom's envoy offers Wheatmere 'protection' in " +
        "exchange for its grain. Grain in the royal army's stores: nine " +
        "days.",
      moveMenu: [
        "The governor goes to the king's camp",
        "Admit the column on terms: count under joint seal, no seizures",
        "Hold the gates and treat from behind the walls",
        "Accept the neighboring kingdom's protection",
        "Send the levy north under the province's own officers",
      ],
    },
    {
      index: 6,
      title: "Settling the Rolls",
      inject:
        "The campaign season opens. Whatever mix of rolls, exemptions, " +
        "garrisons, and walls now exists is hardening into the new custom " +
        "of the kingdom. Each court must decide the posture it will carry " +
        "out of the crisis: what it will write into the statute of the " +
        "rolls, what it will quietly drop, what it will proclaim for the " +
        "next count. The chroniclers will call this turn the settlement, " +
        "whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into the statute of the rolls",
        "Proclaim unilateral terms for the next count",
        "Keep the royal garrison in the province without end",
        "Withdraw the column on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
