import type { Scenario } from "../types";

/**
 * The Land Register — a modern state-strengthening reform (a household
 * register, a wealth roll, and universal service that break an old elite's
 * hold on land and levies) reproduced turn for turn in an invented Warring
 * States setting. Six turns, one decision point (turn 4, the neighboring
 * court's seat). The neighbor must choose between copying the register
 * and bankrolling the nobles' revolt against it.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const LAND_REGISTER: Scenario = {
  id: "land-register",
  title: "The Land Register",
  summary:
    "An invented ancient reform crisis. Tallfield, a middling upland " +
    "kingdom, has a young king and a foreign-born chancellor who is " +
    "writing every household, field, and ox into a single register, " +
    "replacing hereditary rank with rank by service, and calling the " +
    "levies straight to the crown. The Old Marches, the great houses whose " +
    "levies once made the army, lose their tenants and their rank at a " +
    "stroke. Greywold, the richer neighbor across the ridge, must decide " +
    "whether to copy the register, poach its author, or strike before it " +
    "matures. Each seat receives injects each turn and issues decisions " +
    "through a decision memo.",
  simulates:
    "A state-building reform that breaks the old elite: a sweeping tax, identity, and conscription register, while neighbors decide whether to copy it, poach the reformer, or bankroll the displaced nobles.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward civil war or foreign invasion",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Petitions, memorials, and envoys",
    "Refusal: taxes withheld, registrars turned away, levies not sent",
    "Purges and confiscations; exile of leading houses",
    "Armed standoff: house levies and crown levies under arms",
    "Open revolt in the marches",
    "Foreign gold and arms to one side",
    "Civil war joined by a foreign army",
  ],
  seats: [
    {
      id: "tallfield",
      name: "Tallfield",
      brief:
        "You are the inner council of Tallfield, an upland kingdom long " +
        "counted the weakest of its neighbors. You answer to a young king " +
        "who has staked his reign on the chancellor's register: every " +
        "household written down, every field measured, every able man owing " +
        "service to the crown and not to his lord, and rank earned by heads " +
        "taken and grain delivered. The register is three years from " +
        "complete. The old houses call it theft; the new officers call it " +
        "justice. You hold the capital, the treasury, and the new levies, " +
        "and you must finish the work before anyone can undo it.",
      objectives: [
        "Complete the register and bring every levy under the crown",
        "Break the great houses' hold on land and office without a civil war",
        "Deter Greywold from striking while the reform is half-made",
        "Keep the king's person and the chancellor's work secure",
      ],
    },
    {
      id: "oldmarch",
      name: "The Old Marches",
      brief:
        "You are the council of the Old Marches, the great houses of " +
        "Tallfield whose levies held the passes for ten generations. You " +
        "answer to no one, and that is the difficulty: six houses, six " +
        "grievances, one cause. The register strips your tenants, your " +
        "tolls, and your hereditary rank, and hands your sons' commands to " +
        "clerks and cart drivers. You still command your own levies and the " +
        "loyalty of the border towns, and Greywold's envoys have begun to " +
        "call. You would rather win the court than burn the kingdom, but you " +
        "will not be written out of it.",
      objectives: [
        "Halt or gut the register and restore hereditary rank",
        "Keep your levies, tenants, and border towns under your hand",
        "Remove the chancellor without becoming Greywold's instrument",
        "Avoid a war that leaves the marches burned whoever wins",
      ],
    },
    {
      id: "greywold",
      name: "Greywold",
      brief:
        "You are the inner council of Greywold, the rich lowland kingdom " +
        "across the ridge. You answer to an old king and a divided court. " +
        "Your own great houses watch Tallfield with dread; your own " +
        "treasury watches it with envy. If the register is finished, " +
        "Tallfield's levies will outnumber yours within a decade; if it " +
        "fails, its chancellor and his clerks would sell their craft to " +
        "whoever shelters them. The Old Marches ask for gold and a promise " +
        "of arms. The chancellor, through a merchant, asks what asylum " +
        "might cost. Both doors are open, and neither will stay open long.",
      objectives: [
        "Prevent Tallfield from becoming the stronger power",
        "Gain the register's method without the disorder of its making",
        "Keep Greywold's own great houses from taking the marches' side",
        "Avoid a war across the ridge that Greywold cannot end on its terms",
      ],
    },
  ],
  decisionPoints: [{ turn: 4, seat: "greywold" }],
  turns: [
    {
      index: 1,
      title: "The Measuring Rods",
      inject:
        "The chancellor's registrars cross into the Old Marches with " +
        "measuring rods and tally boards and a warrant under the king's " +
        "seal. The house of Highfold turns them back at its gate. The house " +
        "of Cairnwater lets them in and loses a third of its tenants to the " +
        "crown rolls within a week. A tenant who reports his lord's hidden " +
        "fields is raised one rank and given the fields. The marches' " +
        "petition to the throne, signed by six houses, calls the register " +
        "'a foreign clerk's theft of the kingdom's bones.' Greywold's envoy " +
        "at court asks, very politely, to see a copy of the tally boards.",
      moveMenu: [
        "Press the registrars forward under armed escort",
        "Petition the throne and refuse the registrars at the gates",
        "Send envoys with an offer of friendship and a request for the method",
        "Double the watch: spies in the marches, spies at court",
        "Proclaim amnesty for houses that register within the season",
        "Open or use a private channel between houses and a foreign court",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Rank by Merit",
      inject:
        "The king proclaims the new ranks: eighteen grades, earned by heads " +
        "taken in battle and grain delivered to the granaries, with no grade " +
        "inherited. A cart driver who took four heads in last year's border " +
        "fight now outranks the heir of Highfold. The heir's chariot is " +
        "stopped at the capital's gate for bearing the insignia of a rank he " +
        "no longer holds. In the marches the harvest tithe is withheld 'in " +
        "protest,' and two house levies fail to report for the autumn " +
        "muster. Greywold's court receives a secret letter from three " +
        "houses asking what aid would follow if the marches 'defended their " +
        "ancient rights.'",
      moveMenu: [
        "Confiscate the lands of houses that withhold the tithe",
        "Withhold levies and tithes across all six houses together",
        "Offer Greywold's gold quietly and deny it publicly",
        "Summon the house heads to court under safe conduct",
        "Move crown levies to the march roads",
        "Offer the houses a lesser rank by birth in exchange for the tithe",
        "Call a congress of the neighboring courts to witness the dispute",
      ],
    },
    {
      index: 3,
      title: "The Crown Prince's Tutor",
      inject:
        "The crown prince, fifteen and raised among the old houses, breaks " +
        "the register's law by sheltering a fugitive lord's tenants. The " +
        "chancellor holds that the law must bind the prince as it binds a " +
        "cart driver, but that the prince's person cannot be punished; the " +
        "prince's tutor is branded on the face in his place, in the market " +
        "square, before the assembled ranks. The marches call it sacrilege. " +
        "Highfold's levies muster in arms and seal the northern pass. The " +
        "young king is reported ill. Greywold moves two columns to the ridge " +
        "'for the autumn exercises.' The chancellor's merchant reaches " +
        "Greywold's court with a sealed letter.",
      moveMenu: [
        "Send crown levies to reopen the northern pass",
        "Hold the pass and send a manifesto to every court",
        "Exercise on the ridge and wait",
        "Propose a mediated settlement under a neutral court",
        "Strike the marches before Greywold can arm them",
        "Strike the capital before the crown levies are ready",
        "Purge the chancellor's enemies at court",
      ],
    },
    {
      index: 4,
      title: "The Two Letters",
      inject:
        "The king of Tallfield dies in the night. The crown prince is " +
        "proclaimed king by the old houses in the marches and by the " +
        "chancellor's officers in the capital, each party claiming to hold " +
        "him. The chancellor rides for the ridge with his clerks, his tally " +
        "boards, and forty horse. Behind him the new ranks hold the capital; " +
        "ahead of him the marches hold the passes. Two letters lie before " +
        "Greywold's council. The first, from the six houses, asks for ten " +
        "thousand in gold and a column of foot, and promises the border " +
        "towns in return. The second, from the chancellor, asks for asylum " +
        "and offers the register whole: the method, the clerks, the rolls. " +
        "The decision now falls to the focal seat: which letter is answered, " +
        "and what is Greywold's posture on the ridge?",
      moveMenu: [
        "Grant the chancellor asylum and begin Greywold's own register",
        "Bankroll the houses' revolt with gold and a promise of arms",
        "Bankroll the houses and march a column across the ridge",
        "Refuse both letters and seal the ridge",
        "Hand the chancellor back to the houses for a price",
        "Shelter the chancellor but promise the houses neutrality",
        "Offer the young king's court a treaty in exchange for the method",
      ],
    },
    {
      index: 5,
      title: "The Muster",
      inject:
        "The marches take the northern cities; the new ranks hold the " +
        "capital and the granaries. Each side musters for the spring. The " +
        "chancellor's fate is known across every court: whoever holds him " +
        "holds the method, and whoever does not has reason to want him " +
        "dead. A neutral court offers terms: the register kept but the " +
        "tithe halved, hereditary rank restored for one generation, the " +
        "chancellor exiled and unharmed, the passes opened, and foreign " +
        "columns withdrawn beyond the ridge within thirty days. Greywold's " +
        "own great houses petition their old king to reject any terms that " +
        "keep a register alive anywhere.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and muster for the spring",
        "Accept the terms as cover to improve your position",
        "Demand the chancellor's person as the price of peace",
      ],
    },
    {
      index: 6,
      title: "Settling the Rolls",
      inject:
        "The spring campaign season arrives. Whatever mix of register, " +
        "rank, levies, and foreign columns now exists is hardening into the " +
        "new custom of the kingdom. Each court must decide the posture it " +
        "will carry out of the crisis: what is written into the rolls and " +
        "into treaty, what is quietly dropped, what lines it will proclaim " +
        "for the next round. The chroniclers will call this turn the " +
        "settlement, whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines going forward",
        "Keep the levies under arms without end",
        "Stand the levies down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
