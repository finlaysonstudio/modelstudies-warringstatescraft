import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDocument, listDocuments, MAX_WINDOW_LINES } from "../document";
import type { FileLake } from "../lake";
import { createFixtureLake, removeFixtureLake } from "./fixture";

let root: string;
let lake: FileLake;

beforeEach(async () => {
  ({ root, lake } = await createFixtureLake());
});

afterEach(async () => {
  await removeFixtureLake(root);
});

describe("getDocument", () => {
  it("returns a bounded window with the citation", async () => {
    const document = await getDocument({
      lake,
      id: "zhan-guo-ce",
      use: "prompt",
      from: 2,
      lines: 2,
    });
    expect(document.from).toBe(2);
    expect(document.to).toBe(3);
    expect(document.truncated).toBe(true);
    expect(document.text.split("\n")).toHaveLength(2);
    expect(document.citation).toContain("Zhan Guo Ce");
  });

  it("clamps a window past the end of the document", async () => {
    const document = await getDocument({
      lake,
      id: "zhan-guo-ce",
      use: "prompt",
      lines: MAX_WINDOW_LINES * 2,
    });
    expect(document.from).toBe(1);
    expect(document.to).toBe(document.totalLines);
    expect(document.truncated).toBe(false);
  });

  it("refuses a document on the other side of the wall", async () => {
    await expect(
      getDocument({ lake, id: "crs-taiwan-hostage", use: "prompt" }),
    ).rejects.toThrow(/is use:reader; this caller may read use:prompt/);
  });

  it("reads across the wall when the caller asks for any use", async () => {
    const document = await getDocument({
      lake,
      id: "crs-taiwan-hostage",
      use: "any",
    });
    expect(document.use).toBe("reader");
  });

  it("refuses an unknown id", async () => {
    await expect(
      getDocument({ lake, id: "not-a-document", use: "any" }),
    ).rejects.toThrow(/No lake document/);
  });
});

describe("listDocuments", () => {
  it("lists by collection then id", async () => {
    const documents = await listDocuments({ lake, use: "any" });
    expect(documents.map((doc) => doc.id)).toEqual([
      "house-simulates",
      "rand-escalation",
      "zhan-guo-ce",
      "zuo-zhuan-legge",
      "crs-taiwan-hostage",
    ]);
  });

  it("filters to one side of the wall", async () => {
    const documents = await listDocuments({ lake, use: "prompt" });
    expect(documents.map((doc) => doc.id)).toEqual([
      "zhan-guo-ce",
      "zuo-zhuan-legge",
    ]);
  });

  it("filters to what may travel with the bundle", async () => {
    const documents = await listDocuments({
      lake,
      use: "any",
      redistributable: true,
    });
    expect(documents.map((doc) => doc.id)).toEqual([
      "house-simulates",
      "zhan-guo-ce",
      "crs-taiwan-hostage",
    ]);
  });
});
