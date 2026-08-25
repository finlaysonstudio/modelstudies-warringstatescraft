import type { GazetteerFile, Language, Naming } from "./types";

/** a place label in the chosen rendering, without a leading English article */
export const labelOf = (
  gazetteer: GazetteerFile | null,
  key: string,
  naming: Naming | undefined,
  language: Language,
): string => {
  const entry = gazetteer?.entries[key];
  if (!entry) return key;
  const localized =
    (naming === "modern" && entry.modern) ||
    (naming === "masked" ? entry.masked : entry.chronicle);
  const text = localized[language] ?? entry.chronicle[language] ?? key;
  return language === "en" ? text.replace(/^the /, "") : text;
};
