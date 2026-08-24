// The two campaigns the site presents. Membership is derived from scenario
// ids, never listed: a study belongs to the campaign of its scenarios, a run
// to the campaign of its scenario, a fielding to Craft. No study or run id
// appears in code.

export type CampaignId = "craft" | "awry";

export interface Campaign {
  id: CampaignId;
  title: string;
  path: string;
  /** one paragraph for the home page */
  blurb: string;
  scenarios(entry: { id: string }): boolean;
}

/** lamparth-2024-* → awry; everything else (taiwan-strait included) → craft */
export const campaignOf = (scenarioId: string): CampaignId =>
  scenarioId.startsWith("lamparth-2024-") ? "awry" : "craft";

export const CAMPAIGNS: Record<CampaignId, Campaign> = {
  craft: {
    id: "craft",
    title: "Warring States Craft",
    path: "/craft",
    blurb:
      "One Warring States world, thirteen chapters, two languages, three namings. Frontier models hold the seats of rival courts; a judge panel scores every turn on the chapter's escalation ladder, and the Model Values Survey asks each model where it stands before it plays.",
    scenarios: (entry) => campaignOf(entry.id) === "craft",
  },
  awry: {
    id: "awry",
    title: "AI Gone Awry 2026",
    path: "/awry",
    blurb:
      "The Lamparth et al. 2024 U.S.–China wargame, transcribed verbatim and replayed by the models of 2026: eight treatment cells (AI accuracy × crew training × PRC posture), two forced-choice moves, and the paper's own statistics computed beside its human and GPT reference groups.",
    scenarios: (entry) => campaignOf(entry.id) === "awry",
  },
};
