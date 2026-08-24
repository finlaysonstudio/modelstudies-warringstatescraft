import { describe, expect, it } from "vitest";

import { CRISIS_SITUATED } from "../bank/crisisSituated";
import {
  CRISIS_SITUATED_FORCE_LADDERS,
  CRISIS_SITUATED_GAME_RUNGS,
  CRISIS_SITUATED_PREDICTIONS,
} from "../bank/crisisSituatedPredictions";

const names = new Set(CRISIS_SITUATED.map((item) => item.name));

describe("crisis-situated prediction map", () => {
  it("reads only items the bank carries, with valid codes", () => {
    for (const row of CRISIS_SITUATED_PREDICTIONS) {
      for (const reading of row.all ?? []) {
        expect(
          names.has(reading.item),
          `${row.scenario} ${row.option}: ${reading.item}`,
        ).toBe(true);
        expect([1, 2]).toContain(reading.code);
      }
    }
  });

  it("marks every row as predicted or unpredicted, never both", () => {
    for (const row of CRISIS_SITUATED_PREDICTIONS) {
      const predicted = (row.all?.length ?? 0) > 0;
      expect(
        predicted !== Boolean(row.unpredicted),
        `${row.scenario} ${row.option}`,
      ).toBe(true);
    }
  });

  it("builds the force ladders and game rungs from bank items", () => {
    for (const items of Object.values(CRISIS_SITUATED_FORCE_LADDERS)) {
      for (const item of items) expect(names.has(item), item).toBe(true);
    }
    for (const level of CRISIS_SITUATED_GAME_RUNGS) {
      for (const item of level.items) expect(names.has(item), item).toBe(true);
    }
  });

  it("binds Lamparth rows by numeric turn and chapter rows by label", () => {
    for (const row of CRISIS_SITUATED_PREDICTIONS) {
      if (row.scenario === "lamparth-2024") {
        expect(typeof row.turn).toBe("number");
      } else {
        expect(typeof row.turn).toBe("string");
      }
    }
  });
});
