/**
 * Reading a document, and listing what the lake holds. `getDocument` returns a
 * bounded window for the same reason `get_run` truncates memos: a corpus large
 * enough to be useful is large enough to fill a context window in two turns.
 *
 * `use` is required here as well as on search. Retrieval by id is the same
 * path across the wall as retrieval by query, and a caller permitted only
 * `prompt` material must not reach a `reader` document by knowing its name.
 */
import { ForbiddenError, NotFoundError } from "@jaypie/errors";

import { assertUse, selectDocs, type LakeFilter } from "./filter";
import type { Lake } from "./lake";
import {
  ANY_USE,
  referenceOf,
  type LakeManifest,
  type LakeReference,
  type UseFilter,
} from "./types";

export const DEFAULT_WINDOW_LINES = 80;
export const MAX_WINDOW_LINES = 1000;

export interface LakeDocument extends LakeReference {
  words: number;
  totalLines: number;
  /** 1-indexed inclusive window actually returned */
  from: number;
  to: number;
  /** true when the document continues past the window */
  truncated: boolean;
  text: string;
}

export interface GetDocumentOptions {
  lake: Lake;
  id: string;
  /** required: the wall. A `prompt` caller cannot read a `reader` document. */
  use: UseFilter;
  /** 1-indexed first line */
  from?: number;
  lines?: number;
}

export const getDocument = async ({
  lake,
  id,
  use,
  from = 1,
  lines = DEFAULT_WINDOW_LINES,
}: GetDocumentOptions): Promise<LakeDocument> => {
  assertUse(use);
  const manifest = await lake.manifest(id);
  if (!manifest) throw new NotFoundError(`No lake document "${id}"`);
  if (use !== ANY_USE && manifest.use !== use) {
    throw new ForbiddenError(
      `Document "${id}" is use:${manifest.use}; this caller may read use:${use}`,
    );
  }
  const text = await lake.text(id);
  if (text === undefined) {
    throw new NotFoundError(
      `Lake document "${id}" is indexed but its text is missing; rebuild with \`npm run cli lake-index\``,
    );
  }
  const all = text.split("\n");
  const start = Math.min(Math.max(1, Math.floor(from)), all.length);
  const window = Math.min(Math.max(1, Math.floor(lines)), MAX_WINDOW_LINES);
  const end = Math.min(all.length, start + window - 1);
  return {
    ...referenceOf(manifest),
    words: manifest.words,
    totalLines: all.length,
    from: start,
    to: end,
    truncated: end < all.length || start > 1,
    text: all.slice(start - 1, end).join("\n"),
  };
};

export interface ListDocumentsOptions extends LakeFilter {
  lake: Lake;
}

export const listDocuments = async ({
  lake,
  ...filter
}: ListDocumentsOptions): Promise<LakeManifest[]> => {
  const index = await lake.index();
  return selectDocs(index.docs, filter).sort(
    (a, b) =>
      a.collection.localeCompare(b.collection) || a.id.localeCompare(b.id),
  );
};
