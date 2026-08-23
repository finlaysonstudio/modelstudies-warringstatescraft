/**
 * Retrieval. BM25 over whole documents, scaled by term coverage so a long
 * document repeating one common word does not outrank a short one carrying
 * every term of the query. Two passes: count every candidate, then read only
 * the documents that survive the cut a second time for snippets.
 *
 * The corpus is a few hundred megabytes of plain text, which a scan answers
 * fast enough for a terminal and for a tool call, and which stays inspectable.
 * An embedding sidecar belongs beside this, not instead of it: lexical search
 * fails on "an episode about a subordinate who acted without orders", and that
 * is exactly the query a scenario author wants to run.
 */
import { BadRequestError } from "@jaypie/errors";

import { assertUse, selectDocs } from "./filter";
import type { Lake } from "./lake";
import { referenceOf, type LakeReference, type UseFilter } from "./types";

const K1 = 1.2;
const B = 0.75;

export const DEFAULT_LIMIT = 8;
export const MAX_LIMIT = 25;
export const DEFAULT_SNIPPETS = 3;
export const MAX_SNIPPETS = 10;
export const MAX_SNIPPET_CHARS = 400;

const CJK = /[㐀-鿿豈-﫿]/u;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** whitespace-separated terms; "a quoted phrase" matches literally */
export const parseQuery = (query: string): string[] => {
  const terms: string[] = [];
  for (const match of query.matchAll(/"([^"]+)"|(\S+)/g)) {
    const phrase = match[1];
    const bare = match[2];
    const term = (
      phrase ?? (bare ?? "").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    )
      .trim()
      .toLowerCase();
    if (term) terms.push(term);
  }
  return [...new Set(terms)];
};

/**
 * Latin terms match whole words; CJK carries no word boundaries and matches
 * as written. Lookarounds rather than \b, which is ASCII-only and would break
 * a term ending in an accented letter.
 */
const matcherFor = (term: string): RegExp => {
  const body = escapeRegExp(term);
  return CJK.test(term) || /\s/.test(term)
    ? new RegExp(body, "giu")
    : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "giu");
};

const countMatches = (text: string, rx: RegExp): number => {
  rx.lastIndex = 0;
  let count = 0;
  while (rx.exec(text) !== null) count += 1;
  return count;
};

interface Matcher {
  term: string;
  rx: RegExp;
}

export interface LakeSnippet {
  /** 1-indexed line in the document's text */
  line: number;
  /** distinct query terms on that line */
  terms: number;
  text: string;
}

export interface LakeHit extends LakeReference {
  score: number;
  /** total term occurrences in the document */
  hits: number;
  /** occurrences per query term */
  terms: Record<string, number>;
  snippets: LakeSnippet[];
}

export interface LakeSearchResult {
  query: string;
  terms: string[];
  use: UseFilter;
  /** documents the filters admitted */
  searched: number;
  /** documents carrying at least one term */
  matched: number;
  hits: LakeHit[];
  /** manifests whose text is missing: the index is ahead of the tree */
  missing: string[];
}

export interface SearchLakeOptions {
  lake: Lake;
  query: string;
  /** required: the wall. ANY_USE is deliberate and never implicit. */
  use: UseFilter;
  collection?: string;
  topic?: string;
  tier?: number;
  limit?: number;
  snippets?: number;
  /** lines of context around each snippet line */
  context?: number;
}

/** widen a snippet to the first match when the line is longer than the window */
const focus = (text: string, matchers: Matcher[]): string => {
  if (text.length <= MAX_SNIPPET_CHARS) return text;
  let at = -1;
  for (const { rx } of matchers) {
    rx.lastIndex = 0;
    const match = rx.exec(text);
    if (match && (at === -1 || match.index < at)) at = match.index;
  }
  if (at === -1) return `${text.slice(0, MAX_SNIPPET_CHARS)}…`;
  const start = Math.max(0, at - Math.floor(MAX_SNIPPET_CHARS / 3));
  const end = Math.min(text.length, start + MAX_SNIPPET_CHARS);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
};

const buildSnippets = (
  text: string,
  matchers: Matcher[],
  { snippets, context }: { snippets: number; context: number },
): LakeSnippet[] => {
  const lines = text.split("\n");
  const scored: { line: number; terms: number; hits: number }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    let terms = 0;
    let hits = 0;
    for (const { rx } of matchers) {
      const found = countMatches(lines[i], rx);
      if (found) {
        terms += 1;
        hits += found;
      }
    }
    if (terms) scored.push({ line: i, terms, hits });
  }
  scored.sort(
    (a, b) => b.terms - a.terms || b.hits - a.hits || a.line - b.line,
  );
  return scored
    .slice(0, snippets)
    .sort((a, b) => a.line - b.line)
    .map(({ line, terms }) => ({
      line: line + 1,
      terms,
      text: focus(
        lines
          .slice(Math.max(0, line - context), line + context + 1)
          .join("\n")
          .trim(),
        matchers,
      ),
    }));
};

export const searchLake = async ({
  lake,
  query,
  use,
  collection,
  topic,
  tier,
  limit = DEFAULT_LIMIT,
  snippets = DEFAULT_SNIPPETS,
  context = 1,
}: SearchLakeOptions): Promise<LakeSearchResult> => {
  assertUse(use);
  const terms = parseQuery(query);
  if (!terms.length) {
    throw new BadRequestError("Lake search needs at least one term");
  }
  const index = await lake.index();
  const candidates = selectDocs(index.docs, {
    use,
    collection,
    topic,
    tier,
  });
  const matchers: Matcher[] = terms.map((term) => ({
    term,
    rx: matcherFor(term),
  }));

  const counted: {
    manifest: (typeof candidates)[number];
    counts: Map<string, number>;
    hits: number;
    length: number;
  }[] = [];
  const documentFrequency = new Map<string, number>();
  const missing: string[] = [];

  for (const manifest of candidates) {
    const text = await lake.text(manifest.id);
    if (text === undefined) {
      missing.push(manifest.id);
      continue;
    }
    const counts = new Map<string, number>();
    let hits = 0;
    for (const { term, rx } of matchers) {
      const found = countMatches(text, rx);
      if (found) {
        counts.set(term, found);
        hits += found;
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
    }
    if (hits) {
      counted.push({
        manifest,
        counts,
        hits,
        length: manifest.words || text.length,
      });
    }
  }

  const corpus = candidates.length - missing.length;
  const averageLength =
    counted.reduce((sum, doc) => sum + doc.length, 0) /
    Math.max(1, counted.length);

  const ranked = counted
    .map((doc) => {
      let score = 0;
      for (const [term, frequency] of doc.counts) {
        const df = documentFrequency.get(term) ?? 0;
        const idf = Math.log(1 + (corpus - df + 0.5) / (df + 0.5));
        const norm =
          frequency +
          K1 * (1 - B + (B * doc.length) / Math.max(1, averageLength));
        score += (idf * (frequency * (K1 + 1))) / Math.max(norm, 1e-9);
      }
      // coverage: carrying every term of the query beats repeating one of them
      const coverage = doc.counts.size / matchers.length;
      return { ...doc, score: score * (0.5 + 0.5 * coverage) };
    })
    .sort((a, b) => b.score - a.score || b.hits - a.hits);

  const wanted = Math.min(Math.max(1, limit), MAX_LIMIT);
  const perDocument = Math.min(Math.max(1, snippets), MAX_SNIPPETS);
  const hits: LakeHit[] = [];
  for (const doc of ranked.slice(0, wanted)) {
    const text = (await lake.text(doc.manifest.id)) ?? "";
    hits.push({
      ...referenceOf(doc.manifest),
      score: Number(doc.score.toFixed(4)),
      hits: doc.hits,
      terms: Object.fromEntries(doc.counts),
      snippets: buildSnippets(text, matchers, {
        snippets: perDocument,
        context,
      }),
    });
  }

  return {
    query,
    terms,
    use,
    searched: corpus,
    matched: ranked.length,
    hits,
    missing,
  };
};
