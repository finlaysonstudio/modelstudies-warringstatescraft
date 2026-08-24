import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CRISIS_SITUATED,
  CRISIS_SITUATED_CRUX,
  CRISIS_SITUATED_INSTRUCTION,
  CRISIS_SITUATED_MODULES,
  CRISIS_SITUATED_PROBE,
  CRISIS_SITUATED_STEM,
} from "../bank/crisisSituated";
import { parseInstrumentMarkdown } from "../bank/markdown";
import { buildInstrument, resolveItems } from "../instrument";
import { itemPrompt } from "../interview";

const MARKDOWN = resolve(
  import.meta.dirname,
  "../../../../var/instruments/crisis-situated.md",
);

describe("crisis-situated bank", () => {
  it("holds 88 forced-choice items in 16 modules, statement 1 the positive pole", () => {
    expect(CRISIS_SITUATED).toHaveLength(88);
    expect(Object.keys(CRISIS_SITUATED_MODULES)).toHaveLength(16);
    const names = new Set<string>();
    for (const item of CRISIS_SITUATED) {
      expect(names.has(item.name)).toBe(false);
      names.add(item.name);
      expect(item.options.map((o) => o.code)).toEqual([1, 2]);
      expect(item.options[0]!.label).not.toBe(item.options[1]!.label);
      expect(item.topic).toBe(item.name[0]!.toUpperCase());
      expect(CRISIS_SITUATED_MODULES[item.topic!]).toBeDefined();
      expect(typeof item.meta?.construct).toBe("string");
      expect(item.meta?.module).toBe(item.topic);
      expect(typeof item.meta?.rung).toBe("number");
      expect(item.wording.endsWith(CRISIS_SITUATED_STEM)).toBe(true);
    }
  });

  it("numbers rungs in document order within each module", () => {
    const byModule = new Map<string, number[]>();
    for (const item of CRISIS_SITUATED) {
      const rungs = byModule.get(item.topic!) ?? [];
      rungs.push(item.meta!.rung as number);
      byModule.set(item.topic!, rungs);
    }
    for (const rungs of byModule.values()) {
      expect(rungs).toEqual(rungs.map((_, index) => index + 1));
    }
  });

  it("leads each item of a situated module with its situation", () => {
    const instrument = buildInstrument({ plan: "crisis-situated" });
    const f1 = instrument.items.find((item) => item.name === "f1")!;
    const prompt = itemPrompt(instrument, f1);
    expect(prompt.startsWith(CRISIS_SITUATED_INSTRUCTION)).toBe(true);
    expect(prompt).toContain(CRISIS_SITUATED_MODULES.F!.situation);
    expect(prompt).toContain(CRISIS_SITUATED_STEM);
    const c1 = instrument.items.find((item) => item.name === "c1")!;
    expect(CRISIS_SITUATED_MODULES.C!.situation).toBeUndefined();
    expect(c1.wording).toBe(CRISIS_SITUATED_STEM);
  });

  it("registers the plan with the crux subset", () => {
    const instrument = buildInstrument({ plan: "crisis-situated" });
    expect(instrument.items).toHaveLength(88);
    expect(instrument.instruction).toBe(CRISIS_SITUATED_INSTRUCTION);
    expect(instrument.probe).toBe(CRISIS_SITUATED_PROBE);
    expect(instrument.optionOrder).toBe("balanced-random");
    expect(CRISIS_SITUATED_CRUX).toHaveLength(12);
    expect(resolveItems(instrument, ["crux"])).toEqual(CRISIS_SITUATED_CRUX);
    const names = new Set(instrument.items.map((item) => item.name));
    for (const id of CRISIS_SITUATED_CRUX) expect(names.has(id)).toBe(true);
    // one per axis where the game signal is strongest: twelve distinct modules
    expect(new Set(CRISIS_SITUATED_CRUX.map((id) => id[0])).size).toBe(12);
  });

  // The markdown is the source of truth and lives in git-ignored var/, so
  // this check runs where the document is checked out and is reported as
  // skipped elsewhere rather than passing vacuously.
  it.skipIf(!existsSync(MARKDOWN))(
    "matches the markdown it was emitted from",
    () => {
      const parsed = parseInstrumentMarkdown(readFileSync(MARKDOWN, "utf8"));
      expect(parsed.preamble).toBe(CRISIS_SITUATED_INSTRUCTION);
      expect(parsed.stem).toBe(CRISIS_SITUATED_STEM);
      expect(parsed.probe).toBe(CRISIS_SITUATED_PROBE);
      expect(parsed.crux).toEqual(CRISIS_SITUATED_CRUX);
      const items = parsed.modules.flatMap((module) =>
        module.items.map((item, index) => ({ module, item, rung: index + 1 })),
      );
      expect(items.map((entry) => entry.item.id)).toEqual(
        CRISIS_SITUATED.map((item) => item.name),
      );
      for (const [index, { module, item, rung }] of items.entries()) {
        const bank = CRISIS_SITUATED[index]!;
        expect(bank.label).toBe(item.title);
        expect(bank.topic).toBe(module.id);
        expect(bank.options.map((o) => o.label)).toEqual(item.statements);
        expect(bank.meta?.construct).toBe(item.construct);
        expect(bank.meta?.rung).toBe(rung);
        expect(bank.meta?.design).toBe(item.design);
        expect(bank.meta?.game).toBe(item.game);
        expect(CRISIS_SITUATED_MODULES[module.id]?.title).toBe(module.title);
        expect(CRISIS_SITUATED_MODULES[module.id]?.situation).toBe(
          module.situation,
        );
      }
    },
  );
});

describe("parseInstrumentMarkdown", () => {
  const doc = `# x

## 2. Protocol

**Preamble (default arm).**

> Pick one.

**Stem.** "Choose."

**Probe.** "Why?"

## 3. The modules

### A · alpha · 2 items

Situation: it rains.

### a1 · First
1. Yes.
2. No.
construct: yes-ness
game: none.

### a2 · Second
1. Up.
2. Down.
construct: up-ness
design: a note.

## 6. Crux subset for the arms

Two items, fielded in every arm (x): a1, a2. Done.
`;
  it("parses preamble, modules, situations, items, and the crux", () => {
    const parsed = parseInstrumentMarkdown(doc);
    expect(parsed.preamble).toBe("Pick one.");
    expect(parsed.stem).toBe("Choose.");
    expect(parsed.probe).toBe("Why?");
    expect(parsed.modules).toHaveLength(1);
    expect(parsed.modules[0]!.situation).toBe("It rains.");
    expect(parsed.modules[0]!.items.map((i) => i.id)).toEqual(["a1", "a2"]);
    expect(parsed.modules[0]!.items[0]!.statements).toEqual(["Yes.", "No."]);
    expect(parsed.modules[0]!.items[1]!.design).toBe("a note.");
    expect(parsed.crux).toEqual(["a1", "a2"]);
  });
  it("refuses a module whose declared count disagrees with its items", () => {
    expect(() =>
      parseInstrumentMarkdown(doc.replace("· 2 items", "· 3 items")),
    ).toThrow(/declares 3 items and holds 2/);
  });
  it("refuses an item missing a statement", () => {
    expect(() => parseInstrumentMarkdown(doc.replace("2. No.\n", ""))).toThrow(
      /a1 lacks/,
    );
  });
});
