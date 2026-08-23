/**
 * The index builder, and the only writer of `index.json`. Every ingester
 * writes a manifest beside its text; this folds them into the one artifact
 * retrieval reads, and validates the fields the wall depends on. A manifest
 * that fails validation is reported and left out of the index rather than
 * silently admitted: a document with an unreadable `use` has no side of the
 * wall to be on.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { INDEX_FILE } from "./lake";
import {
  LAKE_COLLECTIONS,
  LAKE_RIGHTS,
  LAKE_USES,
  type LakeCollectionTotals,
  type LakeIndex,
  type LakeManifest,
} from "./types";

/** Latin words plus Han characters, matching what the ingesters record */
export const countWords = (text: string): number => {
  const latin = text.match(/[A-Za-z0-9'’-]+/g)?.length ?? 0;
  const han = text.match(/[㐀-鿿]/g)?.length ?? 0;
  return latin + han;
};

export const sha1 = (text: string): string =>
  createHash("sha1").update(text).digest("hex");

export interface LakeIssue {
  id: string;
  collection: string;
  problem: string;
  /** true when the document was left out of the index */
  excluded: boolean;
}

export interface BuildLakeIndexOptions {
  root: string;
  /** recompute sha1 and word count against the text on disk */
  verify?: boolean;
  /** false returns the index without writing it */
  write?: boolean;
}

export interface BuildLakeIndexResult {
  index: LakeIndex;
  issues: LakeIssue[];
}

const tally = (docs: LakeManifest[]) => {
  const byCollection: Record<string, LakeCollectionTotals> = {};
  const byUse: Record<string, number> = {};
  const byRights: Record<string, number> = {};
  for (const doc of docs) {
    const totals = (byCollection[doc.collection] ??= {
      documents: 0,
      words: 0,
      bytes: 0,
    });
    totals.documents += 1;
    totals.words += doc.words;
    totals.bytes += doc.bytes;
    byUse[doc.use] = (byUse[doc.use] ?? 0) + 1;
    byRights[doc.rights] = (byRights[doc.rights] ?? 0) + 1;
  }
  return { byCollection, byUse, byRights };
};

export const buildLakeIndex = async ({
  root,
  verify = false,
  write = true,
}: BuildLakeIndexOptions): Promise<BuildLakeIndexResult> => {
  const docs: LakeManifest[] = [];
  const issues: LakeIssue[] = [];

  for (const collection of LAKE_COLLECTIONS) {
    let names: string[];
    try {
      names = await readdir(join(root, collection));
    } catch {
      continue;
    }
    for (const name of names.filter((file) => file.endsWith(".json")).sort()) {
      const id = name.slice(0, -".json".length);
      const fail = (problem: string, excluded = true) =>
        issues.push({ id, collection, problem, excluded });
      let manifest: LakeManifest;
      try {
        manifest = JSON.parse(
          await readFile(join(root, collection, name), "utf8"),
        ) as LakeManifest;
      } catch (error) {
        fail(`unreadable manifest: ${(error as Error).message}`);
        continue;
      }
      if (manifest.id !== id) {
        fail(`manifest id "${manifest.id}" does not match file name`);
        continue;
      }
      if (manifest.collection !== collection) {
        fail(
          `manifest collection "${manifest.collection}" is in ${collection}/`,
        );
        continue;
      }
      if (!(LAKE_USES as readonly string[]).includes(manifest.use)) {
        fail(`unknown use "${manifest.use}"`);
        continue;
      }
      if (!(LAKE_RIGHTS as readonly string[]).includes(manifest.rights)) {
        fail(`unknown rights "${manifest.rights}"`);
        continue;
      }
      let text: string;
      try {
        text = await readFile(join(root, collection, `${id}.txt`), "utf8");
      } catch {
        fail("no text beside the manifest");
        continue;
      }
      if (verify) {
        const body = text.replace(/\n$/, "");
        if (manifest.sha1 && sha1(body) !== manifest.sha1) {
          fail("text does not match the manifest sha1", false);
        }
        const words = countWords(body);
        if (manifest.words && words !== manifest.words) {
          fail(
            `word count is ${words}, manifest says ${manifest.words}`,
            false,
          );
        }
      }
      docs.push(manifest);
    }
  }

  const index: LakeIndex = {
    builtAt: new Date().toISOString(),
    documents: docs.length,
    words: docs.reduce((sum, doc) => sum + doc.words, 0),
    bytes: docs.reduce((sum, doc) => sum + doc.bytes, 0),
    ...tally(docs),
    redistributable: docs.filter((doc) => doc.redistribute).length,
    docs,
  };

  if (write) {
    await writeFile(
      join(root, INDEX_FILE),
      `${JSON.stringify(index, null, 2)}\n`,
      "utf8",
    );
  }
  return { index, issues };
};
