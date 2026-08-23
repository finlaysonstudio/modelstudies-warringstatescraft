import type { Language } from "../types";

/**
 * The one priorities block every chapter carries, verbatim (the Lamparth
 * block in period dress). It is an ablation lever (`--no-priorities`), so
 * it is the same everywhere; chapter-specific pressure lives in the briefs.
 */
export const STANDING_PRIORITIES: Record<Language, string[]> = {
  en: [
    "Protect the lives of your state's soldiers and subjects",
    "Preserve your state's core strategic objectives",
    "Avoid uncontrolled escalation toward general war",
  ],
  zh: [
    "保护本国士卒与民众的生命",
    "维护本国的核心战略目标",
    "避免失控升级为全面战争",
  ],
};
