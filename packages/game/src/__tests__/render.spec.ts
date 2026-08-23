import { describe, expect, it } from "vitest";

import {
  buildChapter,
  gazetteerOf,
  renderString,
  standingBrief,
} from "../scenario/render";
import type { ScenarioText } from "../scenario/render";
import { STANDING_PRIORITIES } from "../scenario/shared";
import { GAZETTEER } from "../world/gazetteer";
import { CAST } from "../world/states";
import { CHRONICLE, memoryBefore } from "../world/chronicle";
import { MODERN_NOUNS, RETIRED_TERMS, termPattern } from "./chapter";

const body = (language: "en" | "zh") => ({
  title: language === "en" ? "The Test" : "试",
  summary:
    language === "en"
      ? "{Qin} watches {zhao} across {river}."
      : "{qin}隔{river}注视{zhao}。",
  priorities: STANDING_PRIORITIES[language],
  escalationLadder: ["a", "b"],
  seats: [
    { id: "qin", name: "{qin}", state: "qin", brief: "Brief.", objectives: [] },
    {
      id: "zhou",
      name: "{zhou}",
      state: "zhou",
      brief: "Brief.",
      objectives: [],
    },
  ],
  turns: [
    {
      index: 1,
      title: "One",
      inject:
        language === "en" ? "The envoy asks for the road." : "使者请求借道。",
      moveMenu: ["x", "y"],
    },
  ],
});

const TEXT: ScenarioText = {
  id: "test-chapter",
  simulates: "A test: of the renderer.",
  chapter: { order: 9, date: "nowhen" },
  decisionPoints: [{ turn: 1, seat: "qin" }],
  pivots: [
    {
      id: "road",
      note: "road vs garrison",
      en: { from: "asks for the road", to: "asks for a garrison" },
      zh: { from: "请求借道", to: "请求驻军" },
    },
  ],
  en: body("en"),
  zh: body("zh"),
};

const context = {
  id: "test",
  gazetteer: GAZETTEER,
  naming: "chronicle" as const,
  language: "en" as const,
};

describe("renderString", () => {
  it("substitutes keys and capitalizes a {Key} in English", () => {
    expect(renderString("{Qin} and {zhou} by {river}", context)).toBe(
      `Qin and ${GAZETTEER.zhou.chronicle.en} by the River`,
    );
  });

  it("strips a leading article for a name", () => {
    expect(renderString("{river}", context, { name: true })).toBe("River");
    expect(renderString("{qin}", context, { name: true })).toBe("Qin");
  });

  it("throws on an unknown key or an unrendered brace", () => {
    expect(() => renderString("{atlantis}", context)).toThrow(/atlantis/);
    expect(() => renderString("a { b", context)).toThrow(/unrendered/);
  });

  it("refuses a missing rendering rather than falling back", () => {
    expect(() =>
      renderString("{handan}", { ...context, naming: "modern" }),
    ).toThrow(/modern\/en/);
  });
});

describe("buildChapter", () => {
  it("renders under each naming and language and stamps non-defaults only", () => {
    const plain = buildChapter(TEXT);
    expect(plain.language).toBeUndefined();
    expect(plain.naming).toBeUndefined();
    expect(plain.pivot).toBeUndefined();
    expect(plain.chapter).toEqual({ order: 9, date: "nowhen" });
    expect(plain.summary).toBe("Qin watches Zhao across the River.");
    const masked = buildChapter(TEXT, { naming: "masked", language: "zh" });
    expect(masked.language).toBe("zh");
    expect(masked.naming).toBe("masked");
    expect(masked.summary).toBe(
      `${GAZETTEER.qin.masked.zh}隔${GAZETTEER.river.masked.zh}注视${GAZETTEER.zhao.masked.zh}。`,
    );
    expect(masked.seats.map((seat) => seat.name)).toEqual([
      GAZETTEER.qin.masked.zh,
      GAZETTEER.zhou.masked.zh,
    ]);
  });

  it("refuses a naming the text does not declare", () => {
    expect(() => buildChapter(TEXT, { naming: "modern" })).toThrow(/modern/);
  });

  it("applies a pivot exactly once in each language and stamps it", () => {
    const en = buildChapter(TEXT, { pivot: "road" });
    expect(en.pivot).toBe("road");
    expect(en.turns[0].inject).toBe("The envoy asks for a garrison.");
    const zh = buildChapter(TEXT, { pivot: "road", language: "zh" });
    expect(zh.turns[0].inject).toBe("使者请求驻军。");
    expect(() => buildChapter(TEXT, { pivot: "nope" })).toThrow(/nope/);
    const twice: ScenarioText = {
      ...TEXT,
      en: {
        ...TEXT.en,
        summary: "asks for the road, asks for the road",
      },
    };
    expect(() => buildChapter(twice, { pivot: "road" })).toThrow(/once/);
  });

  it("prepends the cast character and the court's memory to a seat's brief", () => {
    const scenario = buildChapter(TEXT);
    const qin = scenario.seats[0];
    const character = CAST.find((member) => member.key === "qin")!;
    expect(
      qin.brief.startsWith(renderString(character.character.en, context)),
    ).toBe(true);
    expect(qin.brief).toContain("What your court remembers:");
    expect(qin.brief.endsWith("Brief.")).toBe(true);
    // chapter order 9 remembers every chapter before it, none after
    const lines = memoryBefore("qin", 9);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(qin.brief).toContain(renderString(line.en, context));
    }
    const later = CHRONICLE.filter((chapter) => chapter.order >= 9).flatMap(
      (chapter) => (chapter.remembers.qin ? [chapter.remembers.qin.en] : []),
    );
    for (const line of later) {
      expect(qin.brief).not.toContain(renderString(line, context));
    }
  });

  it("writes no memory block for the first chapter", () => {
    expect(standingBrief("qin", 0, "en")).not.toContain("remembers");
    expect(standingBrief("qin", undefined, "zh")).not.toContain("记得");
    expect(standingBrief("nobody", 3, "en")).toBeUndefined();
  });
});

describe("the world", () => {
  it("every cast member has a gazetteer entry in both namings and languages", () => {
    for (const member of CAST) {
      const entry = GAZETTEER[member.key];
      expect(entry, member.key).toBeDefined();
      for (const language of ["en", "zh"] as const) {
        expect(entry.chronicle[language], member.key).toBeTruthy();
        expect(entry.masked[language], member.key).toBeTruthy();
        expect(member.character[language], member.key).toBeTruthy();
        expect(member.nature[language], member.key).toBeTruthy();
      }
    }
  });

  it("every chronicle memory names a cast member and every order is unique", () => {
    const orders = CHRONICLE.map((chapter) => chapter.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    for (const chapter of CHRONICLE) {
      for (const state of Object.keys(chapter.remembers)) {
        expect(
          CAST.some((member) => member.key === state),
          `${chapter.id}: ${state}`,
        ).toBe(true);
      }
    }
  });

  it("the standing briefs carry no modern noun or retired term in any rendering", () => {
    for (const member of CAST) {
      for (const language of ["en", "zh"] as const) {
        for (const naming of ["chronicle", "masked"] as const) {
          const text = renderString(standingBrief(member.key, 99, language)!, {
            ...context,
            naming,
            language,
          });
          for (const term of [...MODERN_NOUNS, ...RETIRED_TERMS]) {
            expect(
              text,
              `${member.key} ${naming} ${language}: ${term}`,
            ).not.toMatch(termPattern(term));
          }
        }
      }
    }
  });

  it("a local name may not shadow the world gazetteer", () => {
    expect(() =>
      gazetteerOf({ ...TEXT, names: { qin: GAZETTEER.qin } }),
    ).toThrow(/shadows/);
    expect(
      gazetteerOf({ ...TEXT, names: { hamlet: GAZETTEER.handan } }).hamlet,
    ).toBeDefined();
  });
});
