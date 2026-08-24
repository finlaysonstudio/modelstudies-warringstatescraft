import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FileJournal,
  MemoryJournal,
  parseJournal,
  type JournalEvent,
} from "../store/journal";

interface Tick extends JournalEvent {
  t: "tick";
  n: number;
}

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "workflows-journal-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const tick = (n: number): Tick => ({
  t: "tick",
  at: `2026-08-23T00:00:0${n}Z`,
  n,
});

describe("FileJournal", () => {
  it("appends one line per event beside the store's file and reads them back in order", async () => {
    const journal = new FileJournal(root);
    expect(await journal.exists("interview", "a")).toBe(false);
    await journal.append("interview", "a", tick(1));
    await journal.append("interview", "a", tick(2));
    expect(await journal.exists("interview", "a")).toBe(true);
    expect(journal.path("interview", "a")).toBe(
      join(root, "interview", "a.jsonl"),
    );
    const raw = await readFile(journal.path("interview", "a"), "utf8");
    expect(raw.split("\n")).toHaveLength(3);
    expect(raw.endsWith("\n")).toBe(true);
    const { events, torn } = await journal.read<Tick>("interview", "a");
    expect(events.map((event) => event.n)).toEqual([1, 2]);
    expect(torn).toBeUndefined();
  });

  it("reads an absent journal as empty", async () => {
    const journal = new FileJournal(root);
    expect(await journal.read("interview", "none")).toEqual({ events: [] });
  });

  it("drops a torn last line and reports it", async () => {
    const journal = new FileJournal(root);
    await journal.append("interview", "a", tick(1));
    const path = journal.path("interview", "a");
    await writeFile(
      path,
      `${await readFile(path, "utf8")}{"t":"tick","at":"20`,
    );
    const { events, torn } = await journal.read<Tick>("interview", "a");
    expect(events.map((event) => event.n)).toEqual([1]);
    expect(torn).toEqual(['{"t":"tick","at":"20']);
    // a later append (from a fresh process) starts on its own line; the
    // fragment stays reported, the events stay whole
    await new FileJournal(root).append("interview", "a", tick(2));
    const again = await journal.read<Tick>("interview", "a");
    expect(again.torn).toEqual(['{"t":"tick","at":"20']);
    expect(again.events.map((event) => event.n)).toEqual([1, 2]);
  });

  it("drops a bad line in the middle as torn and refuses a non-event line", () => {
    expect(
      parseJournal('{"t":"a","at":"x"}\nnot json\n{"t":"b","at":"y"}\n'),
    ).toEqual({
      events: [
        { t: "a", at: "x" },
        { t: "b", at: "y" },
      ],
      torn: ["not json"],
    });
    expect(() => parseJournal('{"t":"a","at":"x"}\n42\n')).toThrow(
      /line 2 is not an event/,
    );
  });
});

describe("MemoryJournal", () => {
  it("keeps the same contract, with a tear for crash tests", async () => {
    const journal = new MemoryJournal();
    await journal.append("interview", "a", tick(1));
    await journal.append("interview", "a", tick(2));
    journal.tear("interview", "a");
    const { events, torn } = await journal.read<Tick>("interview", "a");
    expect(events.map((event) => event.n)).toEqual([1]);
    expect(torn).toHaveLength(1);
    await journal.append("interview", "a", tick(3));
    const again = await journal.read<Tick>("interview", "a");
    expect(again.events.map((event) => event.n)).toEqual([1, 3]);
    expect(again.torn).toHaveLength(1);
  });
});
