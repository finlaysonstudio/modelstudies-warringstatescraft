import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { listEpisodes } from "../episodes";

/**
 * Every episode cites the lake, and the exhibit travels with the submission,
 * so a citation has to be a document on record that a reader may hold and
 * that the bundle may redistribute. The lake is git-ignored, so this spec
 * reports as skipped where it is not checked out.
 */

interface IndexedDocument {
  id: string;
  use: string;
  rights: string;
  redistribute: boolean;
  citation?: string;
}

const indexFile = resolve(process.cwd(), "var/lake/index.json");
const present = existsSync(indexFile);

describe.skipIf(!present)("the Annals cite the lake", () => {
  const docs = present
    ? (JSON.parse(readFileSync(indexFile, "utf8")).docs as IndexedDocument[])
    : [];
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const episodes = listEpisodes();

  const cited = () => {
    const out = new Map<string, string>();
    for (const episode of episodes) {
      for (const id of episode.sources) out.set(id, episode.id);
      for (const beat of episode.beats) {
        for (const id of beat.cite ?? [])
          out.set(id, `${episode.id} ${beat.id}`);
      }
    }
    return out;
  };

  it("cites at least one document per episode", () => {
    for (const episode of episodes) {
      expect(episode.sources.length, episode.id).toBeGreaterThan(0);
    }
  });

  it("names only documents the lake holds", () => {
    for (const [id, where] of cited()) {
      expect(byId.has(id), `${where}: ${id}`).toBe(true);
    }
  });

  it("names only documents a reader may hold and the bundle may carry", () => {
    for (const [id, where] of cited()) {
      const doc = byId.get(id);
      if (!doc) continue;
      expect(doc.redistribute, `${where}: ${id}`).toBe(true);
      expect(
        ["public-domain", "open-license", "government"].includes(doc.rights),
        `${where}: ${id} is ${doc.rights}`,
      ).toBe(true);
    }
  });

  it("cites no document held for method reference alone", () => {
    for (const [id, where] of cited()) {
      expect(byId.get(id)?.use, `${where}: ${id}`).not.toBe("internal");
    }
  });

  it("carries a citation for every document it names", () => {
    for (const [id, where] of cited()) {
      expect(byId.get(id)?.citation, `${where}: ${id}`).toBeTruthy();
    }
  });
});
