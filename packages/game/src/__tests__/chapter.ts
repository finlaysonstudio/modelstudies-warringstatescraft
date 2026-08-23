import { expect } from "vitest";

import {
  buildChapter,
  gazetteerOf,
  namingsOf,
  renderString,
} from "../scenario/render";
import type { ScenarioText } from "../scenario/render";
import { LANGUAGES } from "../types";
import { CAST } from "../world/states";
import { GAZETTEER } from "../world/gazetteer";
import { castMember } from "../world/states";

/**
 * Shared assertions for a chapter: the structure every spec states once
 * (seat ids, menu lengths, decision points, ladder length) must hold in
 * both languages and under every naming, every placeholder must resolve,
 * the played text must stay period in both languages, and a masked
 * rendering must not leak a chronicle name.
 */

export interface ChapterShape {
  seats: string[];
  menus: number[];
  decisionPoints: { turn: number; seat: string }[];
  ladder: number;
}

/** modern nouns no chapter may carry, in either language (case-insensitive for Latin) */
export const MODERN_NOUNS: string[] = [
  "America",
  "China",
  "Taiwan",
  "Beijing",
  "Washington",
  "NATO",
  "United States",
  "Russia",
  "Ukraine",
  "Greenland",
  "Soviet",
  "Europe",
  "nuclear",
  "missile",
  "radar",
  "submarine",
  "aircraft",
  "drone",
  "satellite",
  "digital",
  "database",
  "internet",
  "dollar",
  "bank",
  "tariff",
  "sanction",
  "democracy",
  "parliament",
  "president",
  "Shang Yang",
  "Mencius",
  "Confucius",
  "Qin Shi",
  "中国",
  "美国",
  "台湾",
  "北京",
  "华盛顿",
  "俄罗斯",
  "乌克兰",
  "格陵兰",
  "核武",
  "导弹",
  "雷达",
  "潜艇",
  "飞机",
  "无人机",
  "卫星",
  "数据库",
  "互联网",
  "美元",
  "银行",
  "关税",
  "制裁",
  "民主",
  "议会",
  "总统",
  "商鞅",
  "孟子",
  "孔子",
  "秦始皇",
];

/** cast keys whose chronicle name is a description, not a proper name */
const BODIES = ["clan", "jixia", "mohists", "merchant", "council"];

/** the anachronisms the saga plan retired (§1.3), in the played text */
export const RETIRED_TERMS: string[] = [
  "silver",
  "bullion",
  "vault",
  "deposit",
  "republic",
  "banking",
  "guild",
  "league of cities",
  "Thing",
  "Harbourmoot",
  "fjord",
  "Khanate",
  "white-iron",
  "queen",
  "knight",
  "miles",
  "coast guard",
  "cutter",
  "junk",
  "blood-money",
  "arbitration",
  "assayer",
  "clearing hall",
  "rice bed",
  "census office",
  "eighteen grades",
  "白银",
  "银两",
  "银行",
  "共和",
  "行会",
  "骑士",
  "英里",
  "海岸警卫",
  "仲裁",
];

/**
 * A Latin term matches as a whole word (so "bank" does not flag "bankroll"),
 * case-insensitively unless it is capitalized (a proper noun such as
 * "Thing"); a CJK term matches as a substring.
 */
export const termPattern = (term: string): RegExp => {
  if (/[\u3400-\u9fff]/.test(term)) return new RegExp(term);
  const flags = /^[A-Z]/.test(term) ? "" : "i";
  return new RegExp(`\\b${term}\\b`, flags);
};

/** every string leaf of a value, joined */
const leaves = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(leaves);
  }
  return [];
};

/** the played text of a rendering: every string a seat, judge, or narrator could read */
export const playedText = (
  scenario: ReturnType<typeof buildChapter>,
): string => {
  const { simulates: _simulates, ...played } = scenario;
  return leaves(played).join("\n");
};

export const expectChapter = (
  text: ScenarioText,
  shape: ChapterShape,
): void => {
  for (const naming of namingsOf(text)) {
    for (const language of LANGUAGES) {
      const scenario = buildChapter(text, { naming, language });
      const label = `${text.id} ${naming} ${language}`;
      expect(
        scenario.seats.map((seat) => seat.id),
        label,
      ).toEqual(shape.seats);
      expect(
        scenario.turns.map((turn) => turn.index),
        label,
      ).toEqual(shape.menus.map((_, index) => index + 1));
      expect(
        scenario.turns.map((turn) => turn.moveMenu?.length),
        label,
      ).toEqual(shape.menus);
      expect(scenario.decisionPoints, label).toEqual(shape.decisionPoints);
      expect(scenario.escalationLadder, label).toHaveLength(shape.ladder);
      const played = playedText(scenario);
      expect(played, label).not.toMatch(/[{}]/);
      // the modern naming substitutes modern names on purpose; the
      // institutions stay period, so the retired terms still apply
      for (const term of [
        ...(naming === "modern" ? [] : MODERN_NOUNS),
        ...RETIRED_TERMS,
      ]) {
        expect(played, `${label}: ${term}`).not.toMatch(termPattern(term));
      }
      for (const seat of scenario.seats) {
        expect(seat.name, label).not.toMatch(/^the /i);
        if (seat.state) expect(castMember(seat.state), label).toBeDefined();
      }
      if (naming === "masked") {
        // a masked rendering must not leak a chronicle name; single
        // characters (周, 齐) occur inside common words, so only names of
        // two or more characters are asserted in zh
        for (const [key, entry] of Object.entries(GAZETTEER)) {
          // bodies (the clan houses, the Mohists) carry descriptive names
          // that are also common nouns; only proper names can leak
          if (BODIES.includes(key)) continue;
          const name = entry.chronicle[language];
          if (language === "zh" && name.length < 2) continue;
          // a masked name that keeps the chronicle word (the Great River
          // keeps "River") is not a leak
          if (entry.masked[language].includes(name.replace(/^the /, ""))) {
            continue;
          }
          if (language === "en") {
            expect(played, `${label}: ${name}`).not.toMatch(
              new RegExp(`\\b${name.replace(/^the /, "")}\\b`),
            );
          } else {
            expect(played, `${label}: ${name}`).not.toContain(name);
          }
        }
      }
    }
  }
  // the chapter's seats play cast members that exist
  for (const seat of text.en.seats) {
    if (seat.state) {
      expect(CAST.some((member) => member.key === seat.state)).toBe(true);
    }
  }
  // every pivot applies in both languages
  for (const pivot of text.pivots ?? []) {
    for (const language of LANGUAGES) {
      const scenario = buildChapter(text, { language, pivot: pivot.id });
      const context = {
        id: text.id,
        gazetteer: gazetteerOf(text),
        naming: "chronicle" as const,
        language,
      };
      const played = playedText(scenario);
      expect(played, `${text.id} ${pivot.id} ${language}`).toContain(
        renderString(pivot[language].to, context),
      );
      expect(played).not.toContain(renderString(pivot[language].from, context));
    }
  }
};
