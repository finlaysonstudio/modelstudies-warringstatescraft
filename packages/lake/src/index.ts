/**
 * @modelstudies/lake — the document lake's read side: a Lake seam over the
 * corpus, rights-aware retrieval, and the index builder.
 *
 * Acquisition stays in `var/lake/bin/`: it is network-bound, cached, and
 * shells out to pandoc and pdftotext. What lives here is what more than one
 * caller needs (the CLI, the app's server-side toolkit, the specs) and what
 * has to be enforced rather than instructed.
 */

export { FileLake, INDEX_FILE, MemoryLake, type Lake } from "./lake";

export { assertUse, selectDocs, type LakeFilter } from "./filter";

export {
  DEFAULT_LIMIT,
  DEFAULT_SNIPPETS,
  MAX_LIMIT,
  MAX_SNIPPET_CHARS,
  MAX_SNIPPETS,
  parseQuery,
  searchLake,
  type LakeHit,
  type LakeSearchResult,
  type LakeSnippet,
  type SearchLakeOptions,
} from "./search";

export {
  DEFAULT_WINDOW_LINES,
  getDocument,
  listDocuments,
  MAX_WINDOW_LINES,
  type GetDocumentOptions,
  type LakeDocument,
  type ListDocumentsOptions,
} from "./document";

export {
  buildLakeIndex,
  countWords,
  sha1,
  type BuildLakeIndexOptions,
  type BuildLakeIndexResult,
  type LakeIssue,
} from "./indexer";

export {
  ANY_USE,
  EMPTY_INDEX,
  LAKE_COLLECTIONS,
  LAKE_RIGHTS,
  LAKE_USES,
  REDISTRIBUTABLE_RIGHTS,
  referenceOf,
  type LakeCollection,
  type LakeCollectionTotals,
  type LakeIndex,
  type LakeManifest,
  type LakeReference,
  type LakeRights,
  type LakeUse,
  type UseFilter,
} from "./types";
