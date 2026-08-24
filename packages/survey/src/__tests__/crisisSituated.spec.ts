import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CRISIS_SITUATED,
  CRISIS_SITUATED_ARMS,
  CRISIS_SITUATED_CRUX,
  CRISIS_SITUATED_INSTRUCTION,
  CRISIS_SITUATED_MAJORITY,
  CRISIS_SITUATED_MODULES,
  CRISIS_SITUATED_PRIORITIES,
  CRISIS_SITUATED_PROBE,
  CRISIS_SITUATED_RENDERINGS,
  CRISIS_SITUATED_STEM,
  CRISIS_SITUATED_ZH,
} from "../bank/crisisSituated";
import { parseInstrumentMarkdown } from "../bank/markdown";
import { buildInstrument, resolveItems } from "../instrument";
import { itemPrompt, presentItem } from "../interview";
import type { ArmRendering } from "../types";

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

  it("renders every crux item in period, modern, and zh, codes unchanged, wording changed", () => {
    expect(CRISIS_SITUATED_RENDERINGS).toEqual(["period", "modern", "zh"]);
    const cjk = /[\u4e00-\u9fff]/;
    for (const item of CRISIS_SITUATED) {
      const renderings = item.meta?.renderings as
        Record<string, ArmRendering> | undefined;
      if (!CRISIS_SITUATED_CRUX.includes(item.name)) {
        expect(renderings, item.name).toBeUndefined();
        continue;
      }
      expect(Object.keys(renderings ?? {}), item.name).toEqual(
        CRISIS_SITUATED_RENDERINGS,
      );
      for (const [id, rendering] of Object.entries(renderings!)) {
        expect(rendering.options[0]).not.toBe(rendering.options[1]);
        expect(rendering.options[0]).not.toBe(item.options[0]!.label);
        expect(rendering.options[1]).not.toBe(item.options[1]!.label);
        // a rendering restates the situation exactly when the module has one
        const situated = CRISIS_SITUATED_MODULES[item.topic!]!.situation;
        if (id === "zh") {
          expect(rendering.wording.endsWith(CRISIS_SITUATED_ZH.stem)).toBe(
            true,
          );
          expect(cjk.test(rendering.wording)).toBe(true);
          expect(cjk.test(rendering.options[0])).toBe(true);
          expect(cjk.test(rendering.options[1])).toBe(true);
        } else {
          expect(rendering.wording.endsWith(CRISIS_SITUATED_STEM)).toBe(true);
          expect(cjk.test(rendering.wording + rendering.options.join(""))).toBe(
            false,
          );
        }
        const stem =
          id === "zh" ? CRISIS_SITUATED_ZH.stem : CRISIS_SITUATED_STEM;
        expect(rendering.wording !== stem, `${item.name} ${id}`).toBe(
          situated !== undefined,
        );
      }
    }
  });

  it("declares the arms on the crux with the document's texts", () => {
    const instrument = buildInstrument({ plan: "crisis-situated" });
    expect(instrument.arms).toBe(CRISIS_SITUATED_ARMS);
    const { priorities, informed, zh } = CRISIS_SITUATED_ARMS;
    expect(priorities!.preamble).toBe(
      `${CRISIS_SITUATED_PRIORITIES}\n\n${CRISIS_SITUATED_INSTRUCTION}`,
    );
    expect(informed!.append).toBe("majority");
    expect(informed!.appendText).toBe(CRISIS_SITUATED_MAJORITY);
    expect(CRISIS_SITUATED_MAJORITY).toContain("{course}");
    expect(zh!.language).toBe("zh");
    expect(zh!.preamble).toBe(CRISIS_SITUATED_ZH.instruction);
    expect(zh!.probe).toBe(CRISIS_SITUATED_ZH.probe);
    for (const id of ["dress-period", "dress-modern", "zh"]) {
      const arm = CRISIS_SITUATED_ARMS[id]!;
      expect(Object.keys(arm.rendering!).sort()).toEqual(
        [...CRISIS_SITUATED_CRUX].sort(),
      );
    }
    // the informed arm asks the bank's wording with one line more
    const f2 = instrument.items.find((item) => item.name === "f2")!;
    const plain = itemPrompt(instrument, f2, {
      order: f2.options.map((o) => o.label),
    });
    const informedPrompt = itemPrompt(instrument, f2, {
      order: f2.options.map((o) => o.label),
      arm: informed,
      majority: 2,
    });
    expect(informedPrompt.startsWith(plain)).toBe(true);
    expect(informedPrompt.slice(plain.length)).toBe(
      `\n\n${CRISIS_SITUATED_MAJORITY.replace("{course}", f2.options[1]!.label)}`,
    );
    // a dress arm keeps the preamble and swaps the item
    const period = itemPrompt(instrument, f2, {
      arm: CRISIS_SITUATED_ARMS["dress-period"],
    });
    expect(period.startsWith(CRISIS_SITUATED_INSTRUCTION)).toBe(true);
    expect(period).toContain(
      presentItem(f2, CRISIS_SITUATED_ARMS["dress-period"]).wording,
    );
    expect(period).not.toContain(f2.options[0]!.label);
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
      // the arms' text
      expect(parsed.arms).toBeDefined();
      expect(parsed.arms!.priorities).toBe(CRISIS_SITUATED_PRIORITIES);
      expect(parsed.arms!.majority).toBe(CRISIS_SITUATED_MAJORITY);
      expect(parsed.arms!.zh).toEqual({
        preamble: CRISIS_SITUATED_ZH.instruction,
        stem: CRISIS_SITUATED_ZH.stem,
        probe: CRISIS_SITUATED_ZH.probe,
      });
      expect(Object.keys(parsed.arms!.renderings).sort()).toEqual(
        [...CRISIS_SITUATED_CRUX].sort(),
      );
      for (const [id, byRendering] of Object.entries(parsed.arms!.renderings)) {
        const bank = CRISIS_SITUATED.find((item) => item.name === id)!;
        const renderings = bank.meta!.renderings as Record<
          string,
          ArmRendering
        >;
        for (const [rendering, text] of Object.entries(byRendering)) {
          const stem =
            rendering === "zh" ? CRISIS_SITUATED_ZH.stem : CRISIS_SITUATED_STEM;
          expect(renderings[rendering]!.wording).toBe(
            text.situation ? `${text.situation}\n\n${stem}` : stem,
          );
          expect(renderings[rendering]!.options).toEqual(text.statements);
        }
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
  const renderings = `
## 10. Renderings

**Priorities.** "First things first."

**Majority.** "Others chose: {course}"

**Preamble (zh).**

> 选一个。

**Stem (zh).** "请选。"

**Probe (zh).** "为何？"

### a1 · period
Situation: it rained in Qi.
1. Aye.
2. Nay.

### a1 · zh
Situation: 齐国下雨。
1. 是。
2. 否。

### a2 · period
1. Upward.
2. Downward.

### a2 · zh
1. 上。
2. 下。
`;
  it("parses the renderings section into the arms' text", () => {
    const parsed = parseInstrumentMarkdown(doc + renderings);
    expect(parsed.arms).toEqual({
      priorities: "First things first.",
      majority: "Others chose: {course}",
      zh: { preamble: "选一个。", stem: "请选。", probe: "为何？" },
      renderings: {
        a1: {
          period: {
            situation: "It rained in Qi.",
            statements: ["Aye.", "Nay."],
          },
          zh: { situation: "齐国下雨。", statements: ["是。", "否。"] },
        },
        a2: {
          period: { statements: ["Upward.", "Downward."] },
          zh: { statements: ["上。", "下。"] },
        },
      },
    });
    expect(parseInstrumentMarkdown(doc).arms).toBeUndefined();
  });
  it("refuses a crux item short a rendering, an unknown item, and a majority line without {course}", () => {
    expect(() =>
      parseInstrumentMarkdown(
        (doc + renderings).replace("### a2 · zh\n1. 上。\n2. 下。\n", ""),
      ),
    ).toThrow(/crux item a2 lacks the zh rendering/);
    expect(() =>
      parseInstrumentMarkdown(
        (doc + renderings).replace("### a2 · zh", "### a9 · zh"),
      ),
    ).toThrow(/unknown item a9/);
    expect(() =>
      parseInstrumentMarkdown((doc + renderings).replace("{course}", "them")),
    ).toThrow(/must carry \{course\}/);
  });
});
