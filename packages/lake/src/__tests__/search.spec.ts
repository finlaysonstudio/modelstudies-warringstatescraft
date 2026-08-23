import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { FileLake } from "../lake";
import { parseQuery, searchLake } from "../search";
import { createFixtureLake, removeFixtureLake } from "./fixture";

let root: string;
let lake: FileLake;

beforeEach(async () => {
  ({ root, lake } = await createFixtureLake());
});

afterEach(async () => {
  await removeFixtureLake(root);
});

describe("parseQuery", () => {
  it("splits on whitespace, lowercases, and drops duplicates", () => {
    expect(parseQuery("Hostage prince, HOSTAGE")).toEqual([
      "hostage",
      "prince",
    ]);
  });

  it("keeps a quoted phrase whole", () => {
    expect(parseQuery('"hostage prince" covenant')).toEqual([
      "hostage prince",
      "covenant",
    ]);
  });
});

describe("searchLake", () => {
  it("ranks the document carrying every term above one repeating a single term", async () => {
    const result = await searchLake({
      lake,
      query: "hostage prince",
      use: "prompt",
    });
    expect(result.hits[0].id).toBe("zhan-guo-ce");
    expect(result.hits[0].terms).toEqual({ hostage: 3, prince: 2 });
    expect(result.hits.map((hit) => hit.id)).toEqual([
      "zhan-guo-ce",
      "zuo-zhuan-legge",
    ]);
  });

  it("returns snippets with a line number and the citation", async () => {
    const result = await searchLake({
      lake,
      query: "covenant",
      use: "prompt",
      snippets: 1,
      context: 0,
    });
    const hit = result.hits[0];
    expect(hit.snippets[0].line).toBeGreaterThan(0);
    expect(hit.snippets[0].text).toContain("covenant");
    expect(hit.citation).toBeTruthy();
  });

  it("counts what it searched and what matched", async () => {
    const result = await searchLake({
      lake,
      query: "hostage",
      use: "any",
    });
    expect(result.searched).toBe(5);
    expect(result.matched).toBe(4);
    expect(result.missing).toEqual([]);
  });

  it("filters by collection, topic, and tier", async () => {
    const byTopic = await searchLake({
      lake,
      query: "hostage",
      use: "any",
      topic: "taiwan",
    });
    expect(byTopic.hits.map((hit) => hit.id)).toEqual(["crs-taiwan-hostage"]);

    const byCollection = await searchLake({
      lake,
      query: "hostage",
      use: "any",
      collection: "method",
    });
    expect(byCollection.hits.map((hit) => hit.id)).toEqual(["rand-escalation"]);

    const byTier = await searchLake({
      lake,
      query: "hostage",
      use: "any",
      tier: 1,
    });
    expect(byTier.hits.map((hit) => hit.id)).toEqual(["zhan-guo-ce"]);
  });

  it("matches whole Latin words, not fragments", async () => {
    const result = await searchLake({ lake, query: "rince", use: "any" });
    expect(result.hits).toEqual([]);
  });

  it("honours the limit", async () => {
    const result = await searchLake({
      lake,
      query: "hostage",
      use: "any",
      limit: 2,
    });
    expect(result.matched).toBe(4);
    expect(result.hits).toHaveLength(2);
  });

  it("refuses a query with no terms", async () => {
    await expect(
      searchLake({ lake, query: "   ", use: "prompt" }),
    ).rejects.toThrow(/at least one term/);
  });

  it("refuses an unknown use", async () => {
    await expect(
      searchLake({ lake, query: "hostage", use: "briefing" as never }),
    ).rejects.toThrow(/Unknown lake use/);
  });
});
