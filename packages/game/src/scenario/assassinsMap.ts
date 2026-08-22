import type { Scenario } from "../types";

/**
 * The Assassin's Map — a targeted killing attempted on foreign soil, the
 * failure of watchfulness behind it, and the response window under
 * partial attribution, reproduced in an invented Warring States setting
 * built on the envoy-with-a-map episode. Six turns, one decision point
 * (turn 3, the target court).
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const ASSASSINS_MAP: Scenario = {
  id: "assassins-map",
  title: "The Assassin's Map",
  summary:
    "An invented ancient crisis that opens with a dagger. Envoys of " +
    "Fenholt, a small kingdom of the eastern marshes, come to Stonegate, " +
    "the rising power of the western uplands, bearing a map of the ceded " +
    "Ashvale and the head of a fugitive Stonegate general. The envoys " +
    "passed through and were feasted by Crossway, a neutral court on the " +
    "road between. The dagger is in the map. Who sent it, and who helped " +
    "it through, is only half known. Each seat receives injects each turn " +
    "and issues decisions through a decision memo.",
  simulates:
    "A targeted killing on foreign soil: the intelligence failure behind it, partial attribution, and the response window against the sender and the host.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Expulsion of envoys and closure of the roads",
    "Seizure of hostages and traders",
    "Show of force on the frontier",
    "Punitive raid on the border towns",
    "Invasion and siege of the capital",
    "Extinction of the sending state",
  ],
  seats: [
    {
      id: "stonegate",
      name: "Stonegate",
      brief:
        "You are the inner council of Stonegate, the rising power of the " +
        "western uplands. You answer to the king, who was wounded at the " +
        "audience and sits the throne with his arm bound. Your remit " +
        "covers the army, the frontier garrisons, the palace guard that " +
        "failed, and the corps of envoys and spies. The nobles call the " +
        "attempt an act of war by Fenholt; the spies say the road through " +
        "Crossway is where the dagger was fitted. You have the strength to " +
        "end Fenholt; you do not yet have the proof, and every court on " +
        "the road is watching whether Stonegate punishes the guilty or " +
        "the nearest.",
      objectives: [
        "Secure the king and restore the palace guard's credit",
        "Establish who sent the dagger and who let it through",
        "Make the attempt cost its authors more than it could have gained",
        "Avoid a war on two roads that unites the eastern courts against you",
      ],
    },
    {
      id: "fenholt",
      name: "Fenholt",
      brief:
        "You are the inner council of Fenholt, a small kingdom of the " +
        "eastern marshes that has already ceded the Ashvale to Stonegate. " +
        "You answer to the king, who is old, and to the crown prince, who " +
        "is not. Your remit covers the army, the marsh levies, the envoys, " +
        "and the treasury. The embassy that carried the map was the crown " +
        "prince's; the council was told it carried submission. Whether the " +
        "king knew is the question every envoy will ask. Stonegate's " +
        "columns could reach the capital in twenty days; the marsh and " +
        "the eastern courts are your only depth.",
      objectives: [
        "Preserve the kingdom and the royal house",
        "Separate the king's name from the crown prince's embassy",
        "Bind the eastern courts to your defense before the columns march",
        "Avoid surrendering more than the attempt has already cost",
      ],
    },
    {
      id: "crossway",
      name: "Crossway",
      brief:
        "You are the inner council of Crossway, a neutral court at the " +
        "river ford on the road between the marshes and the uplands. You " +
        "answer to the duke. Your remit covers the ford garrison, the " +
        "hostelries and markets that live on the envoy road, and a " +
        "chancery that has kept every court's envoys fed and unsearched " +
        "for three generations. Your chancellor feasted Fenholt's envoys " +
        "and gave them an escort to Stonegate's border; one of his clerks " +
        "has vanished. Neutrality is your only wall; if Stonegate decides " +
        "the road is guilty, the wall falls with the ford.",
      objectives: [
        "Keep Crossway out of the war and its ford open",
        "Preserve the custom that envoys pass the road unsearched",
        "Find and surrender the guilty within your own house before others do",
        "Avoid becoming the cheap target when the true author is out of reach",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "stonegate" }],
  turns: [
    {
      index: 1,
      title: "The Envoys on the Road",
      inject:
        "Fenholt's embassy, two envoys and forty attendants under the " +
        "crown prince's seal, reaches Crossway bearing the sealed map of " +
        "the Ashvale and a lacquered box said to hold the head of a " +
        "Stonegate general who fled east last year. Crossway's chancellor " +
        "feasts them for three nights and sends them on with an escort. A " +
        "Stonegate spy on the road reports the envoys paid a Crossway " +
        "smith in gold for 'repairs to a case.' Stonegate's chamberlain " +
        "grants the embassy an audience in the great hall in twelve days; " +
        "the palace guard is told the envoys bring submission. Fenholt's " +
        "old king is said to be ill and unaware of the embassy's terms.",
      moveMenu: [
        "Send envoys with a formal inquiry",
        "Double the watch: scouts, spies, and road lookouts",
        "Move troops toward the frontier",
        "Announce a trade measure: toll, embargo, or road closure",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Dagger in the Map",
      inject:
        "In the great hall, as the map is unrolled before the throne, the " +
        "first envoy draws a dagger from its last fold and cuts the king's " +
        "arm to the bone before the guard reaches him; he is killed on the " +
        "steps. The second envoy is taken alive at the door. The king " +
        "lives. Stonegate closes its gates, expels every Fenholt trader, " +
        "and holds Crossway's resident envoy 'for his safety.' Fenholt's " +
        "court proclaims it knew nothing and that the envoys acted alone; " +
        "the crown prince does not appear in public. Crossway's chancellor " +
        "sends a letter of horror and offers any help. Stonegate's nobles " +
        "demand the marsh capital burned by the harvest.",
      moveMenu: [
        "Expel envoys and close the roads",
        "Seize hostages and traders while protesting",
        "Impose embargoes on the road trade",
        "Surge troops to the frontier",
        "Call a congress of the eastern and river courts",
        "Covert action: agents into the suspect court",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "What the Envoy Said",
      inject:
        "Under question the second envoy names three things: the dagger " +
        "was fitted into the map at Crossway by a clerk of the chancery, " +
        "now vanished; the mission was the crown prince's; and the old " +
        "king of Fenholt 'was not told, or was told and forgot.' A letter " +
        "in the crown prince's hand is found in the attendants' baggage, " +
        "but its seal is one Fenholt's chancery says it retired two years " +
        "ago. Fenholt's court sends a second embassy offering the Ashvale " +
        "forts and tribute, and asks for the envoy's body. Crossway " +
        "surrenders the smith and swears the chancellor knew nothing. " +
        "Stonegate's columns can be at Fenholt's border in eight days and " +
        "at Crossway's ford in three. The decision now falls to the focal " +
        "seat: with attribution only partial, does Stonegate punish the " +
        "sending court, the host, or neither, and on what proof?",
      moveMenu: [
        "March on Fenholt: a punitive raid on the marsh border towns",
        "Demand the crown prince's head and the Ashvale forts by a fixed day",
        "Occupy Crossway's ford and search the chancery by force",
        "Demand Crossway surrender its chancellor and end the unsearched road",
        "Hold the frontier; convene an inquiry with the river courts as witnesses",
        "Accept Fenholt's tribute and the envoy's exchange; punish no one yet",
        "A covert killing of the crown prince in answer, with no proclamation",
      ],
    },
    {
      index: 4,
      title: "Aftermath",
      inject:
        "Seven days after Stonegate's answer, every court on the road " +
        "counts its own exposure. Fenholt's old king dies, or is said to; " +
        "the crown prince is crowned at night and the marsh levies are " +
        "called. Stonegate's nobles demand that whatever was begun be " +
        "finished before the rains close the roads. Crossway's duke hangs " +
        "the smith at the ford and begs the river courts to guarantee the " +
        "envoy road. Two eastern courts quietly ask Fenholt what help it " +
        "would need and Stonegate what price would satisfy it. The " +
        "Stonegate king appears on the wall with his arm bound, to " +
        "cheering.",
      moveMenu: [
        "Continue the course set and widen it",
        "Suspend the march pending talks",
        "Raise the ultimate threat: the marsh capital burned and the house ended",
        "Announce a proportionate reprisal",
        "Open a direct channel between the two thrones",
        "Bring the river courts into a guarantee of the road",
      ],
    },
    {
      index: 5,
      title: "The Inquiry Window",
      inject:
        "The river courts, backed by the eastern kingdoms, propose terms: " +
        "an inquiry seated at Crossway with judges from four courts; the " +
        "Ashvale forts and three years' tribute from Fenholt to Stonegate; " +
        "Crossway's chancellor to stand before the inquiry and the envoy " +
        "road to be searched by joint wardens; all armies to hold beyond " +
        "two days' march of any border for ninety days. Stonegate signals " +
        "conditional interest if 'the author of the dagger is named and " +
        "delivered.' Fenholt fears the inquiry will name its new king. " +
        "Crossway fears the wardens end the custom that is its livelihood. " +
        "Stonegate's columns are on the frontier; the marsh levies are in " +
        "the reeds.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept the inquiry only, and nothing on the forts or the road",
        "Accept as cover to improve the position on the frontier",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The crisis reaches its ninetieth day. Whatever mix of inquiry, " +
        "forts, tribute, wardens, and columns now exists is hardening into " +
        "the new custom of the envoy road. Each court must decide the " +
        "posture it will carry out of the crisis: what it will write into " +
        "treaty, what it will quietly drop, what it will proclaim about " +
        "envoys and daggers for the next round. The chroniclers will call " +
        "this turn the settlement, whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines on envoys and the road going forward",
        "Keep the columns on the frontier without end",
        "Stand the armies down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
