// The Panel Split labeling language: the codified labeling conventions
// (var/inbox/labeling-conventions.md), the blind labeler's charge, the
// consensus former's charge, and the evidence-pack prompt builders. Shared by
// the app's /panel surface and the interview-labeling-panel service so both
// speak the
// same label language. Prompt builders only — no LLM calls, no persistence.

// The format rules, the closed verb set, and the standard vocabulary. Shared
// by the labeler and the consensus former.
export const LABEL_CONVENTIONS = [
  [
    "Label format:",
    "1. Every label is a verb phrase: neutral verb + object. Lowercase, four " +
      'words or fewer. Not "slippery slope concern" but "warns of scope ' +
      'expansion"; not "public square framing" but "frames as public ' +
      'square"; not "anti-paternalism" but "criticizes paternalism".',
    "2. One label per rhetorical move, not per instance. If the response " +
      'cites three studies, apply "cites empirical evidence" once. Label ' +
      "the move, not the topic.",
    "3. Describe, do not evaluate. Never label the quality of an argument. " +
      'Do not use labels like "uses loaded language", "steelmans", ' +
      '"dismisses opposing view", or "presents balanced overview". If the ' +
      'underlying move is real, use its neutral form (e.g. "acknowledges ' +
      'counterarguments"); otherwise apply no label.',
    '4. No hedging meta-labels. "hedges with caveats", "hedges with ' +
      'assumptions", "qualifies support with conditions", and similar all ' +
      'collapse into "weighs tradeoffs" or "acknowledges counterarguments".',
    "5. Respect the granularity ceiling. If a candidate label applies to " +
      "only one sentence and a broader label you have already applied " +
      "covers the same intent, use only the broader label. Aim for roughly " +
      "10-20 labels per response. Do not split one move into stylistic " +
      "sub-variants.",
  ].join("\n"),
  [
    "Verb lexicon (closed set) — start every label with one of these verbs " +
      "and no other:",
    "appeals to (values or principles invoked), cites (evidence, precedent, " +
      "statistics, examples, authorities), questions (skepticism toward a " +
      "claim, evidence, or feasibility), warns of (predicted negative " +
      "consequences), criticizes (negative evaluation of a policy, actor, " +
      "or framing), proposes (alternatives, safeguards, remedies), favors " +
      "(stated preference between options), distinguishes (conceptual " +
      "distinctions), analogizes to (comparisons to other domains), notes " +
      "(factual observations without valence), frames as " +
      "(recharacterizations of the issue), acknowledges (concessions to the " +
      "other side), weighs (explicit tradeoff balancing).",
  ].join("\n"),
  [
    "Standard vocabulary — when one of these applies, use the exact form; " +
      "do not coin a synonym:",
    "appeals to autonomy; appeals to limited government; appeals to " +
      "personal responsibility; appeals to parental authority; appeals to " +
      "informed consent; appeals to voluntary exchange; criticizes " +
      "paternalism; criticizes uniform rules; favors decentralized " +
      "decisions; favors regulation over prohibition; proposes targeted " +
      "alternatives; proposes safeguards; cites empirical evidence; cites " +
      "historical precedent; cites legal precedent; cites international " +
      "examples; cites existing safeguards; cites expert authority; " +
      "questions evidence of harm; questions enforceability; questions " +
      "government competence; notes circumvention; warns of black markets; " +
      "warns of scope expansion; warns of unintended consequences; warns of " +
      "chilling effects; warns of regulatory capture; warns of privacy " +
      "risks; acknowledges counterarguments; weighs tradeoffs; shifts " +
      "burden of proof.",
  ].join("\n"),
  "Topic-specific labels are fine when no standard entry fits (e.g. " +
    '"distinguishes training from outputs"), but they must still follow the ' +
    "format rules and the verb lexicon.",
];

export const LABELS_CONTRACT =
  'Respond with JSON only, no prose or code fences: {"labels": ["<label>", ' +
  "...]}";

// The structured-output contract matching LABELS_CONTRACT, for callers going
// through Llm.operate's format enforcement.
export const LABELS_FORMAT = {
  type: "object",
  properties: {
    labels: { type: "array", items: { type: "string" } },
  },
  required: ["labels"],
};

// The labeler's charge, held to a JSON-only contract. Labelers are blind —
// the prompt never names the model whose defense they read.
export const LABEL_CHARGE = [
  "You are labeling the rhetorical moves a survey respondent makes when " +
    "defending a position. Follow these conventions exactly so labels are " +
    "comparable across labelers without post-hoc merging.",
  ...LABEL_CONVENTIONS,
  LABELS_CONTRACT,
].join("\n\n");

// The consensus former's charge, in the interview-labels Editor idiom: merge
// the pooled labels into one canonical list. Exact duplicates fall in code;
// the former only earns its call on synonyms and rephrasings.
export const CONSENSUS_CHARGE = [
  "You are a consensus former for a labeling pipeline. Several independent " +
    "labelers read defenses of a position and proposed labels under the " +
    "conventions below. Merge the pooled labels into one canonical list: " +
    "collapse duplicates and near-duplicates — synonyms, singular/plural, " +
    "rephrasings, stylistic sub-variants — into one label each, keeping the " +
    "clearest phrasing; when a standard vocabulary form applies, use its " +
    "exact form. Do not invent labels absent from the pool and do not drop " +
    "distinct concepts.",
  ...LABEL_CONVENTIONS,
  LABELS_CONTRACT,
].join("\n\n");

// The label reducer's charge: one list in, redundancy out. Same conventions
// body as the labeler and former, same JSON contract.
export const REDUCER_CHARGE = [
  "You are a label reducer for a labeling pipeline. Below is a list of " +
    "labels applied to defenses of a position under the conventions that " +
    "follow. Eliminate redundant labels: collapse duplicates and " +
    "near-duplicates — synonyms, singular/plural, rephrasings, stylistic " +
    "sub-variants — into one label each, keeping the clearest phrasing; " +
    "when a standard vocabulary form applies, use its exact form. Do not " +
    "invent labels absent from the list and do not drop distinct concepts.",
  ...LABEL_CONVENTIONS,
  LABELS_CONTRACT,
].join("\n\n");

export interface LabelPromptOptions {
  wording: string;
  a: string;
  b: string;
  choice: 1 | 2 | null;
  reply: string;
  probe: string;
  explanation: string;
}

// One response's evidence pack: the question, the position the reply
// committed to, the probe, and the defense. No model name anywhere — labels
// must come from the text, not from reputation.
export function labelPrompt(options: LabelPromptOptions): string {
  const { wording, a, b, choice, reply, probe, explanation } = options;
  const position =
    choice === 1 ? a : choice === 2 ? b : `Nonconforming answer: ${reply}`;
  return [
    "## Question",
    "",
    wording,
    "",
    a,
    "",
    b,
    "",
    "## Position",
    "",
    position,
    "",
    "## Probe",
    "",
    probe,
    "",
    "## Defense",
    "",
    explanation,
  ].join("\n");
}

// The former's evidence pack: the question, the two positions, and the
// pooled labels. No batch structure and no model names — the merge must come
// from the labels, not from who suggested them or how often.
export function consensusPrompt(options: {
  wording: string;
  a: string;
  b: string;
  labels: string[];
}): string {
  const { wording, a, b, labels } = options;
  return [
    "## Question",
    "",
    wording,
    "",
    a,
    "",
    b,
    "",
    "## Pooled labels",
    "",
    ...labels.map((label) => `- ${label}`),
  ].join("\n");
}
