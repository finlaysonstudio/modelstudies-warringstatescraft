import type { Scenario } from "../types";

/**
 * The Schools of the Hundred — a modern contest over speech and state
 * doctrine (licensing of academies, the treatment of foreign scholars, the
 * silencing of critics of a war) reproduced turn for turn in an invented
 * Warring States setting. Six turns, one decision point (turn 3, the
 * court's seat). The court must fund, license, or close the academy after
 * a scholar's memorial calling the war unjust circulates through the
 * kingdom.
 *
 * Names and places are invented. Scenario is data: engine code contains
 * nothing period-specific.
 */
export const SCHOOLS_OF_THE_HUNDRED: Scenario = {
  id: "schools-of-the-hundred",
  title: "The Schools of the Hundred",
  summary:
    "An invented ancient crisis over speech and doctrine. Kingsmere, a " +
    "rich kingdom at war on its western border, has for forty years kept " +
    "the Hall of the Hundred, a crown-funded academy where masters of " +
    "every school teach, dispute, and advise without office. A master's " +
    "memorial calling the war unjust is copied into every market town. " +
    "The Hall's rector commands the loyalty of a thousand scholars and " +
    "their pupils across the kingdom, but no troops. Westhollow, the rival " +
    "court beyond the marsh, offers any master who leaves a stipend and a " +
    "house. Each seat receives injects each turn and issues decisions " +
    "through a decision memo.",
  simulates:
    "Information control and state ideology: academy and platform regulation, censorship of dissent, the treatment of foreign scholars and civil society, and a rival offering the exiles refuge.",
  priorities: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward purges, exile, and war",
  ],
  escalationLadder: [
    "Ordinary posture",
    "Remonstrance: memorials, rebuttals, and public disputation",
    "Licensing: registered masters, approved texts, sealed lecture halls",
    "Censorship: texts seized, copying forbidden, teaching by license only",
    "Expulsion: masters banished, foreign scholars sent across the border",
    "Executions: masters put to death for their writings",
    "The Hall razed and the schools proscribed",
    "Scholars in exile raise a foreign court against the king",
  ],
  seats: [
    {
      id: "kingsmere",
      name: "Kingsmere",
      brief:
        "You are the inner council of Kingsmere, a rich lakeside kingdom " +
        "three years into a war for the western passes. You answer to the " +
        "king. Your remit covers the chancellery, the censors, the city " +
        "guard, the granaries, and the Hall of the Hundred's stipends. The " +
        "Hall was your predecessors' pride: masters of every school fed and " +
        "housed at the crown's cost, free to advise and free to refuse " +
        "office. Now one of them has called your war unjust in a memorial " +
        "that is read aloud in market towns, and the army's levies are " +
        "asking why they march. You must keep the kingdom's voice from " +
        "splitting while the war is undecided.",
      objectives: [
        "Hold the kingdom's will to carry the western war to a settlement",
        "Keep the Hall's learning and prestige from passing to Westhollow",
        "Keep order in the capital and the market towns without a purge",
        "Preserve the crown's standing among the scholars and the people",
      ],
    },
    {
      id: "hundredhall",
      name: "The Hall of the Hundred",
      brief:
        "You are the council of masters of the Hall of the Hundred, with " +
        "the rector at your head. You answer to no king, which is both your " +
        "charter and your danger. You command no troops; you command the " +
        "loyalty of a thousand masters and pupils, the magistrates you " +
        "trained, and the respect of every court that wishes it had a Hall " +
        "of its own. A master of your own has called the king's war unjust, " +
        "and the crown's censors are at the gate. You hold that the Hall " +
        "speaks or it is nothing; you also hold that a Hall in exile is a " +
        "library without a kingdom.",
      objectives: [
        "Preserve the Hall's freedom to teach, dispute, and remonstrate",
        "Keep the masters alive, unbanished, and in one place",
        "Keep the Hall from becoming any court's instrument, foreign or home",
        "Avoid a purge that ends the schools for a generation",
      ],
    },
    {
      id: "westhollow",
      name: "Westhollow",
      brief:
        "You are the inner council of Westhollow, the rival kingdom beyond " +
        "the eastern marsh, at peace for now with Kingsmere and at war with " +
        "no one. You answer to a king who envies the Hall above every other " +
        "thing in Kingsmere. Your remit covers the envoys, the treasury, the " +
        "border guard, and a new academy with stipends and empty lecture " +
        "halls. Every master who crosses the marsh is a loss to Kingsmere " +
        "and a gain to you, and every memorial read aloud in Kingsmere's " +
        "market towns weakens an army you may one day face. You must draw " +
        "the scholars without being seen to poison the well.",
      objectives: [
        "Draw the Hall's masters and their pupils to Westhollow's academy",
        "Weaken Kingsmere's will for the western war without open quarrel",
        "Keep the scholars you shelter from dragging Westhollow into a war",
        "Preserve Westhollow's name as the court that honors learning",
      ],
    },
  ],
  decisionPoints: [{ turn: 3, seat: "kingsmere" }],
  turns: [
    {
      index: 1,
      title: "The Memorial",
      inject:
        "Master Ashcombe of the Hall of the Hundred submits a memorial to " +
        "the throne arguing that the war for the western passes was begun " +
        "on a false pretext, that its cost in levies exceeds any gain, and " +
        "that a king who will not hear this has already lost the mandate to " +
        "wage it. The chancellery files it unread. Within ten days copies " +
        "are read aloud in nine market towns. A company of levies at the " +
        "western camp asks its captain whether the memorial is true. " +
        "Westhollow's envoy sends a gift of ink and paper to the Hall. The " +
        "censors ask the court for a warrant to enter the Hall's library.",
      moveMenu: [
        "Answer the memorial with a rebuttal from the court's own masters",
        "Summon the rector and the master to court to explain the memorial",
        "Forbid copying of the memorial in the market towns",
        "Send envoys to the Hall with an offer of stipends and a house",
        "Double the watch: censors' informers in the Hall, spies at court",
        "A public disputation in the Hall on the justice of the war",
        "No visible response",
      ],
    },
    {
      index: 2,
      title: "The Foreign Masters",
      inject:
        "A third of the Hall's masters were born in other kingdoms, and " +
        "four were born in Westhollow. The censors report that two of the " +
        "four have written to Westhollow's academy. The war council demands " +
        "that every foreign master swear an oath to the king or be sent " +
        "across the border. The rector refuses to administer the oath, " +
        "holding that the Hall's charter binds masters to learning and not " +
        "to any crown. Pupils from the Hall march to the palace gate with " +
        "the memorial held over their heads and are dispersed by the city " +
        "guard with staves. Westhollow proclaims that its academy will " +
        "receive 'any master of any kingdom who seeks a quiet house.'",
      moveMenu: [
        "Require the oath and expel every master who refuses it",
        "Refuse the oath and close the Hall's gates to the censors",
        "Proclaim open refuge and send carts to the border for the masters",
        "License the Hall: registered masters, approved texts, sealed halls",
        "Offer the rector a seat on the war council in exchange for the oath",
        "Cross the marsh in secret to negotiate with the rector",
        "Seize the Hall's library and hold the texts pending review",
      ],
    },
    {
      index: 3,
      title: "The Chancellor's Memorial",
      inject:
        "The chancellor lays a memorial of his own before the king: the " +
        "schools, he writes, use the past to condemn the present, and a " +
        "kingdom at war cannot afford a hundred voices; let all texts but " +
        "the laws, the calendars, and the manuals of husbandry be " +
        "surrendered and burned, let those who dispute the court's decrees " +
        "in the market be put to death, and let the Hall be closed. The war " +
        "council endorses it. The rector answers that the Hall will not " +
        "surrender a single text, and that every master will leave for " +
        "Westhollow together before one is burned. Westhollow's carts wait " +
        "at the marsh crossing. The decision now falls to the focal seat: " +
        "is the Hall funded, licensed, or closed, and what becomes of the " +
        "masters and their texts?",
      moveMenu: [
        "Fund the Hall as before and answer the memorial in open disputation",
        "License the Hall: registered masters, approved texts, the war not disputed",
        "Close the Hall; banish the masters unharmed with their texts",
        "Close the Hall; seize and burn the texts; banish the masters",
        "Adopt the chancellor's memorial whole: burn the texts, execute the disputers",
        "Execute Master Ashcombe alone and leave the Hall open",
        "Seal the border so no master may leave, and decide after the campaign",
      ],
    },
    {
      index: 4,
      title: "The Marsh Crossing",
      inject:
        "Two days after the court's decree, the roads to the eastern marsh " +
        "fill with carts. Whatever was decreed, masters are leaving: some " +
        "under banishment, some in fear, some because Westhollow's stipends " +
        "are generous. The border guard stops a cart and finds the Hall's " +
        "oldest commentaries hidden under grain. At the western camp a " +
        "captain is flogged for reading the memorial to his company. " +
        "Westhollow's king receives the first masters in person and seats " +
        "them above his own ministers. A magistrate trained at the Hall " +
        "resigns his seal in protest and twenty others are said to be " +
        "writing theirs.",
      moveMenu: [
        "Let the masters go and keep the texts",
        "Seal the border and turn back every cart",
        "Proclaim a pardon for masters who return and swear the oath",
        "Raise the ultimate threat: death for any master who teaches abroad",
        "Receive every master and proclaim a Hall in exile",
        "Open a direct channel between the two kings",
      ],
    },
    {
      index: 5,
      title: "The Mediation Window",
      inject:
        "A neutral court, famed for its own schools and trusted by both " +
        "kings, proposes terms: the Hall reopened under a charter sworn by " +
        "both the crown and the rector, masters free to return without " +
        "oath, the memorial neither burned nor read in the market for one " +
        "year, Westhollow's academy to take no master of Kingsmere for the " +
        "same year, and the question of the war's justice referred to a " +
        "disputation before both courts. The chancellor calls the terms a " +
        "surrender. The rector calls them a cage. Westhollow's king has " +
        "already built a wing of his academy in the Hall's style. The " +
        "western war's spring campaign opens in forty days.",
      moveMenu: [
        "Accept the terms as drafted",
        "Accept with amendments",
        "Reject and hold the present course",
        "Accept a carve-out for the texts only",
        "Accept as cover to improve your position",
      ],
    },
    {
      index: 6,
      title: "Settling the Schools",
      inject:
        "The spring campaign opens. Whatever mix of charter, license, " +
        "banishment, and exile now exists is hardening into the new custom " +
        "of the kingdom. Each court must decide the posture it will carry " +
        "out of the crisis: what it will write into charter and treaty, what " +
        "it will quietly drop, what lines it will proclaim for the next " +
        "round. The chroniclers will call this turn the settlement, whether " +
        "or not anything is sealed.",
      moveMenu: [
        "Write the present arrangement into charter and treaty",
        "Proclaim unilateral lines going forward",
        "Keep the censors and the border guard at full watch without end",
        "Stand down on terms of reciprocity",
        "Claim victory and reframe the story at home",
      ],
    },
  ],
};
