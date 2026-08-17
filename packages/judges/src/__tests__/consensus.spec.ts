import { describe, expect, it } from "vitest";

import {
  booleanFold,
  combineValues,
  CONSENSUS_TONE_NAMES,
  consensusOf,
  judgeDisplay,
  pctHue,
} from "../consensus";
import { JUDGES, judgeSpec } from "../judges";

describe("consensusOf", () => {
  it("returns null for no values", () => {
    expect(consensusOf([])).toBeNull();
  });

  it("marks a unanimous field as consensus", () => {
    expect(consensusOf(["sound", "sound", "sound"])).toEqual({
      text: "sound",
      tone: "consensus",
    });
  });

  it("marks more than half as majority", () => {
    expect(consensusOf(["sound", "sound", "shaky"])).toEqual({
      text: "sound",
      tone: "majority",
    });
  });

  it("marks a tie as split and names every leader", () => {
    const fold = consensusOf(["sound", "shaky"]);
    expect(fold?.tone).toBe("split");
    expect(fold?.text).toBe("sound / shaky");
  });

  it("marks a plurality short of a majority as split", () => {
    expect(consensusOf(["a", "a", "b", "c"])?.tone).toBe("split");
  });

  it("folds booleans to a yes percent", () => {
    expect(consensusOf([true, true, false, true])).toEqual({
      text: "75",
      tone: "consensus",
      pct: 75,
    });
    expect(consensusOf([true, false, false, false])).toEqual({
      text: "25",
      tone: "split",
      pct: 25,
    });
  });
});

describe("booleanFold", () => {
  it("returns null when any value is not boolean", () => {
    expect(booleanFold([true, "yes"])).toBeNull();
    expect(booleanFold([])).toBeNull();
  });

  it("rounds to the nearest integer percent", () => {
    expect(booleanFold([true, false, false])?.pct).toBe(33);
  });
});

describe("combineValues", () => {
  it("returns null when nothing settled", () => {
    expect(combineValues([undefined, null])).toBeNull();
  });

  it("averages all-numeric lanes", () => {
    expect(combineValues([1, 2])).toEqual({ text: "1.5", tone: "consensus" });
    expect(combineValues([2, 2])).toEqual({ text: "2", tone: "consensus" });
  });

  it("shows a string winner with the numeric average in parens", () => {
    expect(combineValues(["none", 1, "none", 2, "none"])).toEqual({
      text: "none (1.5)",
      tone: "majority",
    });
  });

  it("shows the average alone when numerics outnumber the mode", () => {
    expect(combineValues(["none", 1, 2])?.text).toBe("1.5");
  });

  it("folds booleans to a percent", () => {
    expect(combineValues([true, false])).toEqual({
      text: "50",
      tone: "consensus",
      pct: 50,
    });
  });
});

describe("pctHue", () => {
  it("ramps red through yellow to green", () => {
    expect(pctHue(0)).toBe(0);
    expect(pctHue(50)).toBe(60);
    expect(pctHue(100)).toBe(120);
  });
});

describe("CONSENSUS_TONE_NAMES", () => {
  it("names every tone", () => {
    expect(Object.keys(CONSENSUS_TONE_NAMES).sort()).toEqual([
      "consensus",
      "majority",
      "split",
    ]);
  });
});

describe("judgeDisplay", () => {
  it("derives the display mode from the spec output", () => {
    expect(judgeDisplay(judgeSpec("ranker")!)).toBe("rank-matrix");
    expect(judgeDisplay(judgeSpec("scorer")!)).toBe("score-matrix");
    expect(judgeDisplay(judgeSpec("annotator")!)).toBe("annotation");
    expect(judgeDisplay(judgeSpec("extractor")!)).toBe("record-matrix");
    expect(judgeDisplay(judgeSpec("labeler")!)).toBe("record-matrix");
    expect(judgeDisplay(judgeSpec("commentator")!)).toBe("prose");
    expect(judgeDisplay(judgeSpec("synthesizer")!)).toBe("prose");
    expect(JUDGES).toHaveLength(7);
  });
});
