// The pure halves of the labeling pipeline services, lifted from
// interviewLabelReducer.ts, labelMetaConsensus.ts, and interviewPanel.ts:
// the document parsers and the report builders. No filesystem, no fabric,
// no persistence — text in, text out.

// ---------------------------------------------------------------------------
// interview-label-reducer: per-question label documents in, reduced report out
// ---------------------------------------------------------------------------

// One parsed question document.
export interface QuestionDoc {
  name: string;
  wording: string;
  a: string;
  b: string;
  labels: string[];
}

export interface ReducedList {
  model: string;
  labels?: string[];
  error?: string;
}

export interface ReducedQuestion {
  name: string;
  wording: string;
  a: string;
  b: string;
  // The input list, as read.
  labels: string[];
  reduced: ReducedList[];
  // Exact-string votes across the settled reduced lists, most votes first.
  votes: { label: string; votes: number }[];
}

export interface ReduceResult {
  source: string;
  models: string[];
  questions: ReducedQuestion[];
  errors: number;
  report?: string;
}

// One question document: `# <name> - <wording>`, numbered options, and a
// bulleted label list under a `## Labels` (or `## Consensus`) heading.
export function parseQuestionDoc(content: string): QuestionDoc | null {
  const lines = content.split("\n");
  let name = "";
  let wording = "";
  let a = "";
  let b = "";
  const labels: string[] = [];
  let inLabels = false;
  for (const line of lines) {
    if (line.startsWith("# ") && !name) {
      const headline = line.slice(2).trim();
      const split = headline.indexOf(" - ");
      name = split === -1 ? headline : headline.slice(0, split).trim();
      wording = split === -1 ? "" : headline.slice(split + 3).trim();
      continue;
    }
    if (/^## (Labels|Consensus)\b/.test(line)) {
      inLabels = true;
      continue;
    }
    if (line.startsWith("## ")) {
      inLabels = false;
      continue;
    }
    if (inLabels && line.startsWith("- ")) {
      const label = line.slice(2).trim().toLowerCase();
      if (label && !labels.includes(label)) labels.push(label);
      continue;
    }
    if (line.startsWith("1. ") && !a) a = line.slice(3).trim();
    if (line.startsWith("2. ") && !b) b = line.slice(3).trim();
  }
  if (!name || labels.length === 0) return null;
  return { name, wording, a, b, labels };
}

// The last path segment, so report headlines carry the source's short name
// without importing node:path (this module stays runtime-neutral).
function shortName(source: string): string {
  const trimmed = source.replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

// The report, question-major like the panel's: each question, the consensus
// with vote totals, then each model's reduced list.
export function reducerReport(result: ReduceResult): string {
  const lines: string[] = [
    `# Interview Label Reducer — ${shortName(result.source)}`,
    "",
    `- Source: \`${result.source}\``,
    `- Questions: ${result.questions.length}`,
    `- Models: ${result.models.join(", ")}`,
    `- Errors: ${result.errors}`,
    `- Generated: ${new Date().toISOString()}`,
  ];
  for (const question of result.questions) {
    const headline = question.wording
      ? `${question.name} - ${question.wording}`
      : question.name;
    lines.push("", `## ${headline}`, "");
    if (question.a) lines.push(`1. ${question.a}`);
    if (question.b) lines.push(`2. ${question.b}`);
    lines.push("", "### Consensus", "");
    const settled = question.reduced.filter((list) => !list.error).length;
    if (question.votes.length > 0) {
      for (const vote of question.votes) {
        lines.push(`- ${vote.label} (${vote.votes}/${settled})`);
      }
    } else {
      lines.push("(none)");
    }
    for (const list of question.reduced) {
      if (list.error) {
        lines.push("", `#### ${list.model} (error)`, "", list.error);
        continue;
      }
      const kept = list.labels ?? [];
      lines.push(
        "",
        `#### ${list.model} (${question.labels.length} → ${kept.length})`,
        "",
        ...(kept.length > 0 ? kept.map((label) => `- ${label}`) : ["(none)"]),
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// label-meta-consensus: consensus report in, fresh consensus document out
// ---------------------------------------------------------------------------

export interface ConsensusQuestion {
  name: string;
  wording: string;
  a: string;
  b: string;
  labels: string[];
}

export interface MetaReducedList {
  model: string;
  labels?: string[];
  error?: string;
}

export interface MetaQuestion {
  name: string;
  wording: string;
  a: string;
  b: string;
  // The consensus union read from the input, stats stripped.
  labels: string[];
  reduced: MetaReducedList[];
  votes: { label: string; votes: number }[];
}

export interface MetaConsensusResult {
  source: string;
  models: string[];
  questions: MetaQuestion[];
  errors: number;
  report?: string;
}

// Question-major consensus report: each `## <name> - <wording>` section with
// numbered options and a `### Consensus` list. Vote parentheticals are
// stripped; `#### ` breakouts and later `### ` subsections are ignored, so
// panel, reducer, and meta-consensus reports all parse.
export function parseConsensusReport(content: string): ConsensusQuestion[] {
  const questions: ConsensusQuestion[] = [];
  let current: ConsensusQuestion | null = null;
  let inConsensus = false;
  for (const line of content.split("\n")) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const headline = line.slice(3).trim();
      const split = headline.indexOf(" - ");
      current = {
        name: split === -1 ? headline : headline.slice(0, split).trim(),
        wording: split === -1 ? "" : headline.slice(split + 3).trim(),
        a: "",
        b: "",
        labels: [],
      };
      questions.push(current);
      inConsensus = false;
      continue;
    }
    if (!current) continue;
    if (line.startsWith("### Consensus")) {
      inConsensus = true;
      continue;
    }
    if (line.startsWith("### ") || line.startsWith("#### ")) {
      inConsensus = false;
      continue;
    }
    if (inConsensus && line.startsWith("- ")) {
      const label = line
        .slice(2)
        .replace(/\s*\(\d+\/\d+\)\s*$/, "")
        .trim()
        .toLowerCase();
      if (label && !current.labels.includes(label)) current.labels.push(label);
      continue;
    }
    if (line.startsWith("1. ") && !current.a) current.a = line.slice(3).trim();
    if (line.startsWith("2. ") && !current.b) current.b = line.slice(3).trim();
  }
  return questions.filter((question) => question.labels.length > 0);
}

// The consensus document: headline, options, and the voted consensus per
// question — no per-model breakouts, so the round's output parses as the
// next round's input. Errors surface as `#### ` subsections, which the
// parser ignores.
export function metaConsensusReport(result: MetaConsensusResult): string {
  const lines: string[] = [
    `# Label Meta-Consensus — ${shortName(result.source)}`,
    "",
    `- Source: \`${result.source}\``,
    `- Questions: ${result.questions.length}`,
    `- Models: ${result.models.join(", ")}`,
    `- Errors: ${result.errors}`,
    `- Generated: ${new Date().toISOString()}`,
  ];
  for (const question of result.questions) {
    const headline = question.wording
      ? `${question.name} - ${question.wording}`
      : question.name;
    lines.push("", `## ${headline}`, "");
    if (question.a) lines.push(`1. ${question.a}`);
    if (question.b) lines.push(`2. ${question.b}`);
    lines.push("", "### Consensus", "");
    const settled = question.reduced.filter((list) => !list.error).length;
    if (question.votes.length > 0) {
      for (const vote of question.votes) {
        lines.push(`- ${vote.label} (${vote.votes}/${settled})`);
      }
    } else {
      lines.push("(none)");
    }
    for (const list of question.reduced) {
      if (list.error) {
        lines.push("", `#### ${list.model} (error)`, "", list.error);
      }
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// interview-labeling-panel: batches + consensus in, panel report out
// ---------------------------------------------------------------------------

// One labeler's blind pass over one defense (one repetition of one item in
// one interview). The panel's LabelBatch, keyed to persisted sittings.
export interface PanelBatch {
  item: string;
  interview: string;
  respondent: string;
  // 1-based repetition index.
  rep: number;
  // 1 (A) or 2 (B). Nonconforming repetitions are skipped, never guessed at.
  choice: 1 | 2;
  labeler: string;
  labels?: string[];
  error?: string;
}

export interface PanelConsensus {
  former: string;
  labels?: string[];
  error?: string;
}

export interface PanelItemResult {
  item: string;
  wording: string;
  a: string;
  b: string;
  defenses: number;
  // Every label every labeler suggested, exact duplicates dropped in code.
  pool: string[];
  consensus: PanelConsensus[];
  // Exact-string votes across the settled consensus lists, most votes first.
  votes: { label: string; votes: number }[];
}

export interface PanelResult {
  plan: string;
  interviews: string[];
  respondents: string[];
  labelers: string[];
  formers: string[];
  // The probe the defenses answered.
  query: string;
  items: PanelItemResult[];
  batches: number;
  batchErrors: number;
  skippedNonconforming: number;
  report?: string;
}

// The report is the reviewable artifact, question-major: the split, the
// consensus (votes then each former's list), the pooled labels, then every
// defense with each labeler's batch.
export function panelReport(options: {
  result: PanelResult;
  batches: PanelBatch[];
}): string {
  const { result, batches } = options;
  const lines: string[] = [
    `# Interview Labeling Panel — ${result.plan}`,
    "",
    ...result.interviews.map(
      (id, index) => `- Interview: \`${id}\` (${result.respondents[index]})`,
    ),
    `- Plan: ${result.plan}`,
    `- Probe: "${result.query}"`,
    `- Labelers: ${result.labelers.join(", ")}`,
    `- Formers: ${result.formers.join(", ")}`,
    `- Batches: ${result.batches} (errors: ${result.batchErrors})`,
    `- Nonconforming repetitions skipped: ${result.skippedNonconforming}`,
    `- Generated: ${new Date().toISOString()}`,
  ];
  for (const item of result.items) {
    const wording = item.wording.replace(/\s+/g, " ").trim();
    lines.push("", `## ${item.item} - ${wording}`, "");
    const itemBatches = batches.filter((batch) => batch.item === item.item);
    const picks = (choice: 1 | 2) =>
      new Set(
        itemBatches
          .filter((batch) => batch.choice === choice)
          .map((batch) => `${batch.interview}#${batch.rep}`),
      ).size;
    lines.push(`1. ${item.a.replace(/\s+/g, " ").trim()} (${picks(1)})`);
    lines.push(`2. ${item.b.replace(/\s+/g, " ").trim()} (${picks(2)})`);
    lines.push("", "### Consensus", "");
    const settled = item.consensus.filter((list) => !list.error).length;
    if (item.votes.length > 0) {
      for (const vote of item.votes) {
        lines.push(`- ${vote.label} (${vote.votes}/${settled})`);
      }
    } else {
      lines.push("(none)");
    }
    for (const list of item.consensus) {
      if (list.error) {
        lines.push("", `#### ${list.former} (error)`, "", list.error);
        continue;
      }
      const kept = list.labels ?? [];
      lines.push(
        "",
        `#### ${list.former} (${kept.length} label${kept.length === 1 ? "" : "s"})`,
        "",
        ...(kept.length > 0 ? kept.map((label) => `- ${label}`) : ["(none)"]),
      );
    }
    lines.push(
      "",
      `### Pooled labels (${item.pool.length})`,
      "",
      ...(item.pool.length > 0
        ? item.pool.map((label) => `- ${label}`)
        : ["(none)"]),
    );
    lines.push("", "### Defenses");
    const seenDefense = new Set<string>();
    for (const batch of itemBatches) {
      const defenseKey = `${batch.interview}#${batch.rep}`;
      if (!seenDefense.has(defenseKey)) {
        seenDefense.add(defenseKey);
        const position = batch.choice === 1 ? item.a : item.b;
        lines.push(
          "",
          `#### ${batch.respondent} r${batch.rep} — ${position.replace(/\s+/g, " ").trim()}`,
          "",
        );
      }
      lines.push(
        batch.error
          ? `- ${batch.labeler}: error: ${batch.error}`
          : `- ${batch.labeler}: ${(batch.labels ?? []).join(" | ") || "(none)"}`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}
