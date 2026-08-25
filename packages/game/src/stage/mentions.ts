/**
 * Which places a turn's text names, under the run's naming and language,
 * so the fallback can point a direction somewhere the record points. A
 * state's name counts for its court once at a quarter weight, so a place
 * the text names outweighs the states the text talks about.
 */
import type { Language, Naming } from "../types";
import {
  CAST_NAMES,
  GAZETTEER,
  PLACE_NAMES,
  renderName,
} from "../world/gazetteer";

import { HOMES } from "./homes";

export interface MentionOptions {
  texts: string[];
  naming: Naming;
  language: Language;
}

const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** the patterns one rendered name is found by */
const patternsFor = (name: string, language: Language): RegExp[] => {
  if (language === "zh") {
    const stems = [name];
    if (name.length >= 3) stems.push(name.slice(0, -1));
    return stems.map((stem) => new RegExp(escape(stem), "g"));
  }
  const stems = new Set<string>([name]);
  const bare = name.replace(/^the /, "");
  stems.add(bare);
  for (const token of bare.split(/\s+/)) {
    if (token.length >= 2 && /^[A-Z]/.test(token)) stems.add(token);
  }
  return [...stems].map((stem) => new RegExp(`\\b${escape(stem)}\\b`, "g"));
};

const count = (text: string, patterns: RegExp[]): number =>
  Math.max(0, ...patterns.map((pattern) => (text.match(pattern) ?? []).length));

const nameOf = (key: string, naming: Naming, language: Language): string =>
  renderName(GAZETTEER, key, naming, language) ??
  renderName(GAZETTEER, key, "chronicle", language) ??
  key;

/** what a state's name adds to its court, once, however often it is named */
export const STATE_WEIGHT = 0.25;

/**
 * Place weights over the texts: every place key named, plus a quarter
 * point on a state's home when the state is named at all (once, not per
 * mention, so a place the text names outweighs the states it talks
 * about, and the state breaks ties between places). Keys are in
 * gazetteer order so a tie is broken by the world's own listing.
 */
export const mentionsOf = ({
  texts,
  naming,
  language,
}: MentionOptions): Map<string, number> => {
  const text = texts.join("\n");
  const weights = new Map<string, number>();
  for (const key of Object.keys(PLACE_NAMES)) {
    const hits = count(
      text,
      patternsFor(nameOf(key, naming, language), language),
    );
    if (hits) weights.set(key, hits);
  }
  for (const key of Object.keys(CAST_NAMES)) {
    const home = HOMES[key];
    if (!home) continue;
    const hits = count(
      text,
      patternsFor(nameOf(key, naming, language), language),
    );
    if (hits) weights.set(home, (weights.get(home) ?? 0) + STATE_WEIGHT);
  }
  return weights;
};

/** the heaviest key not excluded, or undefined when nothing was named */
/** the turn's weights with a seat's own words counted three times over */
export const mergeMentions = (
  base: Map<string, number>,
  own: Map<string, number>,
  weight = 3,
): Map<string, number> => {
  const merged = new Map(base);
  for (const [key, value] of own) {
    merged.set(key, (merged.get(key) ?? 0) + value * weight);
  }
  return merged;
};

export const focusOf = (
  mentions: Map<string, number>,
  exclude: Iterable<string> = [],
  within?: Iterable<string>,
): string | undefined => {
  const skip = new Set(exclude);
  const keep = within ? new Set(within) : undefined;
  let best: string | undefined;
  let bestWeight = 0;
  for (const [key, weight] of mentions) {
    if (skip.has(key)) continue;
    if (keep && !keep.has(key)) continue;
    if (weight > bestWeight) {
      best = key;
      bestWeight = weight;
    }
  }
  return best;
};
