import type { Scenario } from "../types";

/**
 * The Wedge State — a modern buffer-state crisis (a small state between
 * two blocs is asked to host one side's garrison while the other side
 * claims a prefecture on its border) reproduced turn for turn in an
 * invented Warring States setting. Six turns, one decision point (turn 3,
 * the wedge state's seat).
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const WEDGE_STATE: Scenario = {
  id: "wedge-state",
  title: "The Wedge State",
  summary:
    "An invented ancient crisis in a state wedged between two powers. " +
    "Narrowdale, a small kingdom of passes and market towns, lies between " +
    "Westmark, a rising military power, and Eastholm, an older league of " +
    "rich courts. Westmark demands a garrison in Narrowdale's passes to " +
    "guard against Eastholm; Eastholm offers to take the contested " +
    "prefecture of Saltvale under its protection. Every road between the " +
    "two powers runs through Narrowdale. Each seat receives injects each " +
    "turn and issues decisions through a decision memo.",
  simulates:
    "A buffer state between two blocs: asked to host one side's garrison while both bid for it.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Envoys and protests",
    "Bought ministers, tolls, and closed markets",
    "Show of force at the passes",
    "Garrison imposed or prefecture occupied",
    "Limited engagement in the passes",
    "General war across the wedge",
    "The wedge partitioned",
  ],
  seats: [
    {
      id: "narrowdale",
      name: "Narrowdale",
      brief:
        "You are the inner council of Narrowdale, the small kingdom in the " +
        "passes between Westmark and Eastholm. You answer to the king. " +
        "Your remit covers the pass garrisons, the town militias, the " +
        "toll-houses, and diplomacy. Your revenues come from the road " +
        "trade; your safety has come from being useful to both neighbors " +
        "and owned by neither. Saltvale, your eastern prefecture, holds " +
        "the salt pans both powers covet and a governor who answers to " +
        "you less each year. You cannot fight either neighbor; you can " +
        "choose which one to disappoint.",
      objectives: [
        "Preserve the crown and self-rule of Narrowdale",
        "Keep the passes and the road trade open under Narrowdale's tolls",
        "Avoid becoming the battlefield between Westmark and Eastholm",
        "Hold Saltvale, or lose it on terms the kingdom survives",
      ],
    },
    {
      id: "westmark",
      name: "Westmark",
      brief:
        "You are the inner council of Westmark, the rising power west of " +
        "the passes. You answer to the king. Your remit covers the army, " +
        "the frontier commands, the treasury, and the corps of envoys. " +
        "Narrowdale's passes are the only road by which Eastholm's league " +
        "could march on your plain and the only road by which your army " +
        "reaches the east. A garrison in the passes makes you secure; " +
        "Saltvale in Eastholm's hands makes you encircled. You prefer to " +
        "be invited in, but you will not be shut out.",
      objectives: [
        "Secure a garrison in Narrowdale's passes",
        "Keep Saltvale's salt pans out of Eastholm's hands",
        "Avoid a general war with Eastholm's league before the army is ready",
        "Preserve the court's standing with the frontier commands",
      ],
    },
    {
      id: "eastholm",
      name: "Eastholm",
      brief:
        "You are the inner council of Eastholm, the league of old and " +
        "wealthy courts east of the passes. You answer to the league's " +
        "presiding king. Your remit covers the league's levies, the " +
        "treasury, the guilds, and diplomacy. A Westmark garrison in the " +
        "passes would put its army a week from your capitals; Saltvale, " +
        "offered to you by its own governor, would put your frontier at " +
        "the passes' eastern mouth. Your league is rich and slow; its " +
        "courts do not march for Narrowdale unless the threat is close.",
      objectives: [
        "Keep Westmark's army out of the passes",
        "Bring Saltvale and its salt pans under the league's protection",
        "Hold the league's courts together under one policy",
        "Avoid a war at the passes that the league cannot sustain",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "narrowdale" }],
  turns: [
    {
      index: 1,
      title: "The Two Envoys",
      inject:
        "Envoys from Westmark and Eastholm arrive at Narrowdale's court in " +
        "the same week. Westmark's envoy asks for a garrison of five " +
        "thousand in the western passes, 'to guard the road for both our " +
        "crowns,' and names a date forty days off. Eastholm's envoy brings " +
        "a letter from Saltvale's governor offering the prefecture to the " +
        "league's protection, and asks whether Narrowdale's king objects. " +
        "Westmark's frontier regiments drill within sight of the passes. " +
        "Eastholm's league council meets in twenty days. Merchants at the " +
        "toll-houses begin paying in Westmark's coin.",
      moveMenu: [
        "Send envoys with a formal protest",
        "Double the watch: scouts, spies, and pass lookouts",
        "Move troops to the passes or to Saltvale",
        "Announce a trade measure: tariff, embargo, or closed toll-houses",
        "Open or use a private channel between courts",
        "A public proclamation campaign",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Governor's Oath",
      inject:
        "Saltvale's governor swears an oath of protection to Eastholm's " +
        "league before his own magistrates and sends the salt revenue east " +
        "instead of to Narrowdale's treasury. Narrowdale's king has not " +
        "consented. Westmark's envoy declares that a Saltvale under " +
        "Eastholm is 'a knife at the passes' and that the garrison date " +
        "stands. Westmark's frontier army moves to the foot of the western " +
        "passes. Eastholm's league council votes a levy of twenty thousand " +
        "but sets no date to march. Narrowdale's pass garrisons number " +
        "four thousand; its treasury holds three months of pay.",
      moveMenu: [
        "Dismiss the governor and send the militia to Saltvale",
        "Recognize the oath and ask Eastholm for a price",
        "Impose tolls or an embargo on the road trade",
        "Surge troops to the passes",
        "Call a congress of the small states along the road",
        "Covert action against the governor or the frontier camps",
        "Offer talks with preconditions",
      ],
    },
    {
      index: 3,
      title: "The Ultimatum",
      inject:
        "Westmark's envoy delivers terms in open court: the garrison enters " +
        "the western passes in ten days with or without consent, and if " +
        "Saltvale passes to Eastholm, Westmark will 'take the passes it " +
        "needs and leave Narrowdale the rest.' Eastholm's envoy answers " +
        "the same day: the league will receive Saltvale and guarantee " +
        "Narrowdale's crown, but will not march west of the salt pans. " +
        "Westmark's frontier army stands at the passes; its advance " +
        "companies hold the lower toll-houses. Eastholm's levy is " +
        "gathering three weeks' march away. Narrowdale's nobles are " +
        "divided between the two envoys; the market towns ask only which " +
        "coin to take. The decision now falls to the focal seat: does " +
        "Narrowdale admit the garrison, refuse both powers, or cede " +
        "Saltvale to Eastholm?",
      moveMenu: [
        "Admit the garrison on terms: a fixed term, Narrowdale's command of the toll-houses",
        "Refuse both powers and hold the passes with the kingdom's own garrisons",
        "Cede Saltvale to Eastholm and ask the league to guarantee the crown",
        "Cede Saltvale to Westmark in place of the garrison",
        "Admit the garrison and cede Saltvale; keep the crown and the road",
        "Delay: offer both powers a congress while the militias dig in",
        "Appeal to the small states along the road for a joint guarantee",
      ],
    },
    {
      index: 4,
      title: "Aftermath",
      inject:
        "Ten days after Narrowdale's answer, the powers move on what they " +
        "hold. Westmark's companies either enter the passes under whatever " +
        "terms exist or stand at the toll-houses with the garrison date " +
        "passed. Eastholm's levy either marches for Saltvale or halts at " +
        "the salt pans with its league divided. Narrowdale's nobles of " +
        "the western valleys petition Westmark's king directly; the nobles " +
        "of the eastern valleys petition the league. A Westmark patrol and " +
        "a Saltvale militia company exchange arrows at a bridge; three " +
        "dead. Both powers call it the other's provocation.",
      moveMenu: [
        "Hold to the answer given and enforce it at the passes",
        "Reopen terms with the aggrieved power",
        "Raise the ultimate threat: partition of the kingdom between the two powers",
        "Announce a proportionate reprisal for the bridge",
        "Open a direct channel between the two sovereigns",
        "Bring the small states along the road into the passes as a neutral guard",
      ],
    },
    {
      index: 5,
      title: "The Mediation Window",
      inject:
        "A neutral river city, backed by the southern kingdoms, proposes " +
        "terms: the passes neutral under Narrowdale's garrisons alone, " +
        "Saltvale's salt revenue divided three ways, no foreign garrison " +
        "within a day's march of the passes, and a congress on 'the " +
        "arrangements of the road' to open in sixty days. Westmark signals " +
        "conditional interest if 'the league's levy disperses first.' " +
        "Eastholm's league is split; two courts would accept, three would " +
        "fight for Saltvale. Narrowdale fears the terms leave its crown " +
        "standing over a kingdom in three parts. Westmark's army remains " +
        "at the passes; the levy has not dispersed.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for the passes only",
        "Accept as cover to improve the army's position",
      ],
    },
    {
      index: 6,
      title: "Settling the Board",
      inject:
        "The crisis reaches its hundredth day. Whatever mix of garrisons, " +
        "ceded ground, tolls, and guarantees now exists is hardening into " +
        "the new custom of the road. Each court must decide the posture it " +
        "will carry out of the crisis: what it will write into treaty, " +
        "what it will quietly drop, what lines it will proclaim for the " +
        "next round. The chroniclers will call this turn the settlement, " +
        "whether or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into treaty",
        "Proclaim unilateral lines going forward",
        "Keep the armies at the passes at high readiness without end",
        "Stand the armies down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
