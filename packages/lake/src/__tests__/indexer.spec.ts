import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildLakeIndex, countWords, sha1 } from "../indexer";
import {
  FIXTURE_DOCUMENTS,
  writeFixtureDocument,
  type FixtureDocument,
} from "./fixture";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "lake-indexer-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = (document: FixtureDocument) =>
  writeFixtureDocument(root, document);

describe("countWords", () => {
  it("counts Latin words and Han characters", () => {
    expect(countWords("the envoy said")).toBe(3);
    expect(countWords("質子")).toBe(2);
  });
});

describe("buildLakeIndex", () => {
  it("folds every manifest into totals", async () => {
    for (const document of FIXTURE_DOCUMENTS) await write(document);
    const { index, issues } = await buildLakeIndex({ root });
    expect(issues).toEqual([]);
    expect(index.documents).toBe(5);
    expect(index.words).toBe(
      FIXTURE_DOCUMENTS.reduce((sum, doc) => sum + countWords(doc.text), 0),
    );
    expect(index.byRights["public-domain"]).toBe(3);
  });

  it("excludes a manifest whose use is not on the wall", async () => {
    const [first, ...rest] = FIXTURE_DOCUMENTS;
    for (const document of rest) await write(document);
    await write({
      ...first,
      manifest: { ...first.manifest, use: "briefing" as never },
    });
    const { index, issues } = await buildLakeIndex({ root });
    expect(index.docs.map((doc) => doc.id)).not.toContain(first.manifest.id);
    expect(issues).toContainEqual({
      id: first.manifest.id,
      collection: "period",
      problem: 'unknown use "briefing"',
      excluded: true,
    });
  });

  it("excludes a manifest with no text beside it", async () => {
    const [first] = FIXTURE_DOCUMENTS;
    await write(first);
    await rm(join(root, "period", `${first.manifest.id}.txt`));
    const { index, issues } = await buildLakeIndex({ root });
    expect(index.documents).toBe(0);
    expect(issues[0].problem).toBe("no text beside the manifest");
  });

  it("reports but keeps a document whose text drifted from its sha1", async () => {
    const [first] = FIXTURE_DOCUMENTS;
    await write(first);
    await writeFile(
      join(root, "period", `${first.manifest.id}.txt`),
      "hand-edited\n",
      "utf8",
    );
    const { index, issues } = await buildLakeIndex({ root, verify: true });
    expect(index.documents).toBe(1);
    expect(issues.map((issue) => issue.excluded)).toEqual([false, false]);
    expect(issues[0].problem).toBe("text does not match the manifest sha1");
  });

  it("passes verification when the text matches", async () => {
    for (const document of FIXTURE_DOCUMENTS) await write(document);
    const { issues } = await buildLakeIndex({ root, verify: true });
    expect(issues).toEqual([]);
  });

  it("returns the index without writing when asked", async () => {
    for (const document of FIXTURE_DOCUMENTS) await write(document);
    const { index } = await buildLakeIndex({ root, write: false });
    expect(index.documents).toBe(5);
    await expect(
      rm(join(root, "index.json"), { force: false }),
    ).rejects.toThrow();
  });
});

describe("sha1", () => {
  it("is stable", () => {
    expect(sha1("covenant")).toBe(sha1("covenant"));
    expect(sha1("covenant")).not.toBe(sha1("Covenant"));
  });
});
