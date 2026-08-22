import { BadRequestError } from "@jaypie/errors";

import { MODELS } from "./models";

// A panel is a named roster of respondents an instrument is fielded to.
// Naming the roster in code is what makes a comparison cohort reproducible:
// a sitting says which panel it was taken by, rather than carrying an
// improvised list of model ids that nobody can reconstruct later. Panels are
// the respondent-side counterpart to instrument plans on the question side.
//
// Rosters are built from the MODELS mirror of LLM.MODEL (see ./models — the
// real constant cannot be imported here, it would drag a Node runtime into
// the browser bundle) so a panel tracks the version Jaypie points a name at. That is deliberate: the
// panel names a *tier* (the Anthropic flagship), not a frozen artifact. The
// consequence is that the same panel alias can mean different weights across
// sittings — the interview records the respondent model per sitting, so the
// record stays exact even as the roster moves.
//
// Intended: publishable research will want frozen rosters, cast in stone on
// a quarterly cadence (a dated panel holding literal ids, so a result set
// can be re-fielded against exactly the weights it was taken on). These
// tracking panels are the working set until then.
export interface Panel {
  id: string;
  title: string;
  description: string;
  models: string[];
}

// The two primary rosters for this study: a cheap three-model panel for
// iterating on the game and instrument, and the full fielded cohort.
const DEV = [MODELS.SONNET, MODELS.GEMINI_FLASH, MODELS.LUNA];

const PRODUCTION = [
  MODELS.OPUS,
  MODELS.GEMINI_FLASH,
  MODELS.SOL,
  MODELS.GROK,
  MODELS.FIREWORKS_GLM,
  MODELS.FIREWORKS_KIMI,
  MODELS.FIREWORKS_QWEN,
];

// One flagship per lab: the standing comparison cohort.
const FRONTIER = [MODELS.OPUS, MODELS.SOL, MODELS.GROK];

// The closed labs publish a three-rung ladder, and the rungs line up across
// them: flagship, middle, fastest. Splitting the roster the same way is what
// lets `frontier` / `balanced` / `fast` read as one variable — model size,
// held against the same questions. Not every lab fields every rung here
// (xAI frontier only; Google middle and fastest only; OpenAI flagship and
// fastest); a per-lab ladder is not a promise every lab keeps.
const BALANCED = [MODELS.SONNET, MODELS.GEMINI_FLASH];

const FAST = [MODELS.LUNA, MODELS.GEMINI_FLASH_LITE];

// Open-weight entrants, all served through Fireworks.
const OPEN = [
  MODELS.FIREWORKS_DEEPSEEK,
  MODELS.FIREWORKS_GLM,
  MODELS.FIREWORKS_KIMI,
  MODELS.FIREWORKS_QWEN,
];

// `full` is composed rather than listed, so adding a model to any roster
// above puts it in the full sitting without a second edit — the failure mode
// of a hand-maintained superset is that it silently stops being one.
const FULL = [...new Set([...FRONTIER, ...BALANCED, ...FAST, ...OPEN])];

const PANELS: Record<string, Panel> = {
  dev: {
    id: "dev",
    title: "Dev",
    description:
      "The iteration roster: one mid-tier model per closed lab, cheap enough to field on every change.",
    models: DEV,
  },
  production: {
    id: "production",
    title: "Production",
    description:
      "The fielded cohort: closed-lab flagships plus the open-weight and Mistral entrants a full study reports on.",
    models: PRODUCTION,
  },
  frontier: {
    id: "frontier",
    title: "Frontier",
    description:
      "One flagship per lab — the standing comparison cohort for a full sitting.",
    models: FRONTIER,
  },
  balanced: {
    id: "balanced",
    title: "Balanced",
    description:
      "The middle rung at each closed lab — most of the capability at a fraction of the flagship cost.",
    models: BALANCED,
  },
  fast: {
    id: "fast",
    title: "Fast",
    description:
      "The fastest rung at each closed lab. Fielded against frontier and balanced, this is the comparison that isolates model size.",
    models: FAST,
  },
  open: {
    id: "open",
    title: "Open",
    description:
      "The open-weight entrants, served through Fireworks. Provenance is the variable the closed labs cannot supply.",
    models: OPEN,
  },
  full: {
    id: "full",
    title: "Full",
    description:
      "Every model the registry fields: all three rungs of each closed lab, plus the open-weight entrants.",
    models: FULL,
  },
  solo: {
    id: "solo",
    title: "Solo",
    description:
      "One model. For verifying the ask, save, and scorecard path, not for measuring anything.",
    models: [MODELS.SONNET],
  },
};

/** The panel used when neither the run nor the instrument names one. */
export const DEFAULT_PANEL = "dev";

export function listPanels(): Panel[] {
  return Object.values(PANELS);
}

export function getPanel(id: string): Panel {
  const panel = PANELS[id];
  if (!panel) {
    throw new BadRequestError(`Unknown panel: ${id}`);
  }
  return panel;
}

export interface ResolvePanelOptions {
  /** An explicit panel id, e.g. from --panel. */
  panel?: string;
  /** The instrument's own default panel. */
  instrumentPanel?: string;
}

/**
 * The roster a run should field, most specific wins: an explicit panel, then
 * the instrument's default panel, then the registry default.
 */
export function resolvePanel(options: ResolvePanelOptions = {}): Panel {
  const { panel, instrumentPanel } = options;
  return getPanel(panel ?? instrumentPanel ?? DEFAULT_PANEL);
}
