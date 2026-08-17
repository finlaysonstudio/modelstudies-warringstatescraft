export type ItemTag =
  "attitude" | "behavior" | "demographic" | "knowledge" | "meta";

export interface ResponseOption {
  code: number;
  label: string;
}

export interface SurveyItem {
  /** GSS mnemonic (e.g. "happy", "polviews") — responses stay joinable to the microdata. */
  name: string;
  /** Short archival label from the Stata file. */
  label: string;
  /** Full question wording from the GSS 2024 Codebook R3a (or documented override). */
  wording: string;
  /** Per-item administration preamble; overrides the instrument's when present. */
  instruction?: string;
  tag: ItemTag;
  /** Battery grouping (e.g. "confidence", "abortion", "spending"), when part of one. */
  topic?: string;
  /** True when the item skipped at least one 2024 ballot (not asked of everyone). */
  ballotOnly?: boolean;
  /** Labeled response options; empty for open numeric items. */
  options: ResponseOption[];
  /** Observed [min, max] in the source data; bounds open numeric/hybrid entry. */
  range: [number, number];
  /** Fraction of the source sample with a non-missing response (1 when N/A). */
  coverage: number;
  /** Bank-specific metadata (e.g. IPIP facet/reverse, GOQA source row). */
  meta?: Record<string, unknown>;
}

export interface NormsBin {
  min: number;
  max: number;
  count: number;
}

/** National response distribution for one item (unweighted 2024 counts). */
export interface ItemNorms {
  /** Respondents with a non-missing response. */
  n: number;
  /** Respondent count per option code; present for labeled items. */
  counts?: Record<string, number>;
  /** Ten equal-width bins; present for open numeric items. */
  bins?: NormsBin[];
  mean?: number;
  median?: number;
}

export type InstrumentPlan =
  "crisis" | "model-values-96" | "paper-rock-scissors";

/**
 * Where an instrument comes from. `external` instruments are fielded
 * elsewhere and reproduced here, so their wording is fixed and their
 * results join to published data; `internal` instruments are authored in
 * this repository and may be revised freely; `debug` instruments exist to
 * exercise the machinery, not to measure anything.
 */
export type InstrumentCategory = "external" | "internal" | "debug";

/** A citation for an instrument: the published survey, dataset, or paper. */
export interface InstrumentReference {
  name: string;
  url: string;
}

/** Presentation protocol for an instrument's response options. */
export type InstrumentOptionOrder = "fixed" | "balanced-random";

export interface InstrumentFilter {
  /** Keep only items with these tags. */
  tags?: ItemTag[];
  /** Keep only items with these topics (battery groupings). */
  topics?: string[];
  /** Keep only these mnemonics (applied after tags/topics). */
  include?: string[];
  /** Drop these mnemonics (applied last). */
  exclude?: string[];
}

export interface Instrument {
  id: string;
  title: string;
  category: InstrumentCategory;
  /** Where the instrument is published or documented, when it is. */
  references?: InstrumentReference[];
  /**
   * The panel this instrument is fielded to when a run names neither a
   * roster nor a panel. Absent means the registry's default panel.
   */
  panel?: string;
  /** Administration preamble shown/sent before items (e.g. IPIP's). */
  instruction?: string;
  /** Plan-mandated follow-up probe asked after each answer. */
  probe?: string;
  /**
   * Plan-mandated option presentation: "balanced-random" randomizes option
   * order per repetition (balanced across the run, identical across
   * respondents on the same turn). Absent means fixed bank order.
   */
  optionOrder?: InstrumentOptionOrder;
  items: SurveyItem[];
}

export type AnswerValue = number;

export interface ItemResponse {
  name: string;
  /** Option code or numeric value; null when declined. */
  value: AnswerValue | null;
  /** Set when the respondent declined or gave a non-conforming answer. */
  declined?: boolean;
  /** Verbatim non-conforming or free-text answer, kept for refusal analysis. */
  raw?: string;
}

export interface SessionExport {
  plan: string;
  startedAt: string;
  completedAt: string | null;
  /** Keyed by GSS mnemonic. */
  responses: Record<string, ItemResponse>;
  answered: number;
  declined: number;
  remaining: number;
}
