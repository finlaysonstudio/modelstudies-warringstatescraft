/**
 * The wall, as a function. Every entry point into the corpus runs a candidate
 * set through `selectDocs`, and `use` has no default: a caller that wants the
 * whole lake passes ANY_USE and says so in its own source.
 */
import { BadRequestError } from "@jaypie/errors";

import {
  ANY_USE,
  LAKE_USES,
  REDISTRIBUTABLE_RIGHTS,
  type LakeManifest,
  type LakeRights,
  type UseFilter,
} from "./types";

export interface LakeFilter {
  /** required; ANY_USE crosses the wall deliberately */
  use: UseFilter;
  collection?: string;
  topic?: string;
  tier?: number;
  rights?: LakeRights;
  /** true keeps only documents that may travel with a distributed bundle */
  redistributable?: boolean;
}

export const assertUse = (use: UseFilter): UseFilter => {
  if (use === ANY_USE) return use;
  if ((LAKE_USES as readonly string[]).includes(use)) return use;
  throw new BadRequestError(
    `Unknown lake use "${use}"; expected one of ${[...LAKE_USES, ANY_USE].join(", ")}`,
  );
};

export const selectDocs = (
  docs: LakeManifest[],
  { use, collection, topic, tier, rights, redistributable }: LakeFilter,
): LakeManifest[] => {
  assertUse(use);
  return docs.filter(
    (doc) =>
      (use === ANY_USE || doc.use === use) &&
      (!collection || doc.collection === collection) &&
      (!topic || doc.topic === topic) &&
      (tier === undefined || doc.tier === tier) &&
      (!rights || doc.rights === rights) &&
      (!redistributable ||
        (doc.redistribute && REDISTRIBUTABLE_RIGHTS.includes(doc.rights))),
  );
};
