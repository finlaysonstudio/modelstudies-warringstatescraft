// The three campaigns the site presents. Membership of the two bench
// campaigns is derived from scenario ids, never listed: a study belongs to the
// campaign of its scenarios, a run to the campaign of its scenario, a fielding
// to Craft. No study or run id appears in code. The Annals carry no scenario
// id at all, so their membership is the route (`useCampaign`), which is what
// keeps the exhibit off the bench's own derivation.

export type CampaignId = "craft" | "awry" | "annals";

/** the campaigns a scenario can belong to; the Annals play no scenario */
export type ScenarioCampaignId = "craft" | "awry";

export interface Campaign {
  id: CampaignId;
  title: string;
  path: string;
  /** one paragraph for the home page */
  blurb: string;
  scenarios(entry: { id: string }): boolean;
}

/** lamparth-2024-* → awry; everything else (taiwan-strait included) → craft */
export const campaignOf = (scenarioId: string): ScenarioCampaignId =>
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
  annals: {
    id: "annals",
    title: "The Annals",
    path: "/annals",
    blurb:
      "Fifty-one staged episodes of the Warring States, from the flooding of Jinyang in 453 BCE to the surrender of Qi in 221, played on the same overworld the games play on. Real people are named and real years are stated: the Annals are an exhibit rather than an instrument, and nothing in them reaches a model.",
    scenarios: () => false,
  },
};
