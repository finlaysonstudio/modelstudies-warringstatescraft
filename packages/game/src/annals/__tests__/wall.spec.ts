import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { GAZETTEER } from "../../world/gazetteer";
import { coderSystem } from "../../stage/coder";
import type { TurnContext } from "../../stage/assemble";
import type { StageDirectionKind } from "../../stage/types";
import {
  ARCHETYPES,
  DIRECTION_KINDS,
  EFFECTS,
  GAME_ARCHETYPES,
  GAME_EFFECTS,
  GAME_KINDS,
  scopeOf,
} from "../../stage/vocabulary";
import { listEpisodes } from "../episodes";
import { PEOPLE } from "../people";

/**
 * The wall between the Annals and the bench. The Annals name real people and
 * state real years, which the chapters may not, so the separation has to be
 * structural rather than editorial: nothing under `scenario/` may reach the
 * Annals, no person may enter the gazetteer the chapters render against, and
 * no historical direction may reach the coder's prompt.
 */

const sourceDir = resolve(process.cwd(), "packages/game/src");

const filesUnder = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__") continue;
      out.push(...filesUnder(path));
    } else if (entry.endsWith(".ts")) {
      out.push(path);
    }
  }
  return out;
};

describe("the wall between the Annals and the bench", () => {
  it("keeps scenario/ from importing the Annals", () => {
    const offenders: string[] = [];
    for (const file of filesUnder(resolve(sourceDir, "scenario"))) {
      const body = readFileSync(file, "utf8");
      if (/from\s+["'][^"']*annals/.test(body)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the Annals out of every prompt builder", () => {
    // the prompt surfaces: the scenario texts, the brief and judge builders,
    // and the engine's own strings. None of them may name the module.
    const prompts = [
      resolve(sourceDir, "scenario"),
      resolve(sourceDir, "briefs.ts"),
      resolve(sourceDir, "adjudicate.ts"),
      resolve(sourceDir, "materials.ts"),
    ];
    const offenders: string[] = [];
    for (const path of prompts) {
      const files = statSync(path).isDirectory() ? filesUnder(path) : [path];
      for (const file of files) {
        if (/from\s+["'][^"']*annals/.test(readFileSync(file, "utf8"))) {
          offenders.push(file);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps every named person out of the gazetteer", () => {
    for (const person of PEOPLE) {
      expect(GAZETTEER[person.key], person.key).toBeUndefined();
    }
  });

  it("offers the coder the played vocabulary only", () => {
    const annals = DIRECTION_KINDS.filter(
      (kind: StageDirectionKind) => scopeOf(kind) === "annals",
    );
    expect(annals.length).toBeGreaterThan(0);
    const context = {
      run: { naming: "chronicle", language: "en", escalationLadder: ["quiet"] },
      scenario: { seats: [] },
      seats: { qin: { state: "qin", home: "xianyang" } },
      turn: 1,
    } as unknown as TurnContext;
    const prompt = coderSystem(context, ["xianyang"]);
    for (const kind of annals) {
      expect(prompt.includes(`- ${kind} (`), kind).toBe(false);
    }
    for (const kind of GAME_KINDS) {
      expect(prompt.includes(`- ${kind} (`), kind).toBe(true);
    }
    const listed = (label: string) =>
      (prompt.split("\n").find((line) => line.startsWith(`${label}: `)) ?? "")
        .slice(label.length + 2)
        .replace(/\.$/, "")
        .split(", ");
    expect(listed("Archetypes")).toEqual(GAME_ARCHETYPES);
    expect(listed("Effects")).toEqual(GAME_EFFECTS);
    const held = [
      ...ARCHETYPES.filter((entry) => !GAME_ARCHETYPES.includes(entry)),
      ...EFFECTS.filter((entry) => !GAME_EFFECTS.includes(entry)),
    ];
    expect(held.length).toBeGreaterThan(0);
  });

  it("keeps the Annals off the package index", () => {
    const index = readFileSync(resolve(sourceDir, "index.ts"), "utf8");
    expect(/annals/.test(index)).toBe(false);
  });

  it("records no run, scenario, or model on any episode", () => {
    for (const episode of listEpisodes()) {
      const entry = episode as unknown as Record<string, unknown>;
      expect(entry.run, episode.id).toBeUndefined();
      expect(entry.scenario, episode.id).toBeUndefined();
      expect(entry.usage, episode.id).toBeUndefined();
      for (const seat of Object.values(episode.seats)) {
        expect(seat.model, episode.id).toBe("authored");
      }
    }
  });
});
