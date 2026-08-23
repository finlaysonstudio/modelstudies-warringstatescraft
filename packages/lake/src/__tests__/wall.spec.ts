/**
 * The wall. `materials.spec.ts` asserts that `Scenario.simulates` never
 * reaches a model prompt; retrieval opens a second path from modern material
 * into prompt text, and this asserts that path is closed at the tool boundary
 * rather than in a system prompt. A scenario-drafting caller passes
 * `use: "prompt"` and gets period material, whatever it asks for.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDocument, listDocuments } from "../document";
import { selectDocs } from "../filter";
import type { FileLake } from "../lake";
import { searchLake } from "../search";
import { LAKE_USES } from "../types";
import { createFixtureLake, removeFixtureLake } from "./fixture";

let root: string;
let lake: FileLake;

/** the kind of query a scenario author runs, worded modernly */
const MODERN_QUERIES = [
  "hostage detention diplomacy",
  "taiwan",
  "escalation ladder",
  "congressional research service",
];

beforeEach(async () => {
  ({ root, lake } = await createFixtureLake());
});

afterEach(async () => {
  await removeFixtureLake(root);
});

describe("the wall", () => {
  it("returns only prompt material to a prompt caller, whatever the query", async () => {
    for (const query of MODERN_QUERIES) {
      const result = await searchLake({ lake, query, use: "prompt" });
      for (const hit of result.hits) expect(hit.use).toBe("prompt");
    }
  });

  it("holds for every use, not only prompt", async () => {
    for (const use of LAKE_USES) {
      const result = await searchLake({ lake, query: "hostage", use });
      for (const hit of result.hits) expect(hit.use).toBe(use);
      const listed = await listDocuments({ lake, use });
      for (const doc of listed) expect(doc.use).toBe(use);
    }
  });

  it("closes retrieval by id, not only by query", async () => {
    const reader = (await listDocuments({ lake, use: "reader" }))[0];
    await expect(
      getDocument({ lake, id: reader.id, use: "prompt" }),
    ).rejects.toThrow(/is use:reader/);
  });

  it("has no default: a filter is a value the caller supplies", () => {
    const index = { docs: [] };
    // @ts-expect-error use is required on every filter
    expect(() => selectDocs(index.docs, {})).toThrow();
  });

  it("crosses only when a caller names ANY_USE", async () => {
    const result = await searchLake({ lake, query: "hostage", use: "any" });
    expect(new Set(result.hits.map((hit) => hit.use))).toEqual(
      new Set(["prompt", "reader", "internal"]),
    );
  });
});
