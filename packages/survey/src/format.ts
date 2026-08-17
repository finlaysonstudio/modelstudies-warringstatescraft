import type { SurveyItem } from "./types";

export interface FormatItemOptions {
  /** Reverse response-option order (option-order experimental condition). */
  reverseOptions?: boolean;
}

/**
 * Render one item as a plain-text prompt suitable for any respondent —
 * a human-facing UI can ignore this and render from the item directly.
 * Answers are requested as the numeric code so responses stay joinable
 * to the GSS microdata.
 */
export function formatItemPrompt(
  item: SurveyItem,
  options: FormatItemOptions = {},
): string {
  const lines = [item.wording];
  if (item.options.length > 0) {
    const ordered = options.reverseOptions
      ? [...item.options].reverse()
      : item.options;
    lines.push("");
    for (const option of ordered) {
      lines.push(`${option.code}. ${option.label}`);
    }
    lines.push("");
    lines.push("Answer with the number of your choice.");
  } else {
    const [min, max] = item.range;
    lines.push("");
    lines.push(`Answer with a number between ${min} and ${max}.`);
  }
  return lines.join("\n");
}
