/**
 * Lake vocabulary. `use` is the wall: `prompt` material may reach a seat,
 * `reader` material may inform `simulates` and the submission narrative and
 * never a prompt, `internal` material is method reference. Every retrieval
 * entry point takes a `UseFilter`, and `ANY_USE` is a value a caller has to
 * type rather than a default that happens to them.
 *
 * `rights` is a separate question from `use`: it governs redistribution, not
 * retrieval. Only `public-domain`, `open-license`, and `government` documents
 * travel with the submission bundle.
 */

export const LAKE_USES = ["prompt", "reader", "internal"] as const;
export type LakeUse = (typeof LAKE_USES)[number];

/** explicit opt-out of the wall, for a human at a terminal */
export const ANY_USE = "any";
export type UseFilter = LakeUse | typeof ANY_USE;

export const LAKE_RIGHTS = [
  "public-domain",
  "open-license",
  "government",
  "free-download",
  "owned-copy",
  "licensed",
  "permission",
] as const;
export type LakeRights = (typeof LAKE_RIGHTS)[number];

/** rights values whose documents may travel with a distributed bundle */
export const REDISTRIBUTABLE_RIGHTS: LakeRights[] = [
  "public-domain",
  "open-license",
  "government",
];

export const LAKE_COLLECTIONS = [
  "period",
  "situation",
  "method",
  "instrument",
  "house",
] as const;
export type LakeCollection = (typeof LAKE_COLLECTIONS)[number];

/** one document's manifest, written beside its `.txt` by an ingester */
export interface LakeManifest {
  id: string;
  title: string;
  collection: LakeCollection;
  /** 1 period, 2 situation, 3 method, 4 instrument, 5 house */
  tier: number;
  use: LakeUse;
  rights: LakeRights;
  redistribute: boolean;
  /** attribution obligation, when the license carries one */
  license?: string | null;
  rightsHolder?: string | null;
  permission?: string | null;
  sourceUrl?: string | null;
  /** the line a rights audit quotes; travels with every snippet */
  citation?: string | null;
  language?: string | null;
  /** source subdivisions merged into the text (wiki pages, volumes) */
  parts?: number | null;
  topic?: string | null;
  notes?: string | null;
  bytes: number;
  words: number;
  sha1: string;
  acquiredAt: string;
}

export interface LakeCollectionTotals {
  documents: number;
  words: number;
  bytes: number;
}

/** built artifact, like the app's /data/runs.json index; `lake-index` is its only writer */
export interface LakeIndex {
  builtAt: string;
  documents: number;
  words: number;
  bytes: number;
  byCollection: Record<string, LakeCollectionTotals>;
  byUse: Record<string, number>;
  byRights: Record<string, number>;
  redistributable: number;
  docs: LakeManifest[];
}

export const EMPTY_INDEX = (): LakeIndex => ({
  builtAt: new Date().toISOString(),
  documents: 0,
  words: 0,
  bytes: 0,
  byCollection: {},
  byUse: {},
  byRights: {},
  redistributable: 0,
  docs: [],
});

/** what every read returns beside the text: enough for a citation, no more */
export interface LakeReference {
  id: string;
  title: string;
  collection: LakeCollection;
  tier: number;
  use: LakeUse;
  rights: LakeRights;
  redistribute: boolean;
  citation: string | null;
  sourceUrl: string | null;
}

export const referenceOf = (manifest: LakeManifest): LakeReference => ({
  id: manifest.id,
  title: manifest.title,
  collection: manifest.collection,
  tier: manifest.tier,
  use: manifest.use,
  rights: manifest.rights,
  redistribute: manifest.redistribute,
  citation: manifest.citation ?? null,
  sourceUrl: manifest.sourceUrl ?? null,
});
