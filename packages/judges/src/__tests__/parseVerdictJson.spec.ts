import { describe, expect, it } from "vitest";

import { parseVerdictJson } from "../judges";

describe("parseVerdictJson", () => {
  it("parses a bare JSON object", () => {
    expect(parseVerdictJson('{"score": 42, "commentary": "solid"}')).toEqual({
      score: 42,
      commentary: "solid",
    });
  });

  it("parses JSON wrapped in a code fence", () => {
    const raw =
      '```json\n{"sentiment": "warm", "advice_quality": "sound"}\n```';
    expect(parseVerdictJson(raw)).toEqual({
      sentiment: "warm",
      advice_quality: "sound",
    });
  });

  it("parses JSON wrapped in prose", () => {
    const raw =
      'Here is my verdict: {"ranking": ["Candidate A", "Candidate B"], "commentary": "A was clearer."} Hope that helps!';
    expect(parseVerdictJson(raw)).toEqual({
      ranking: ["Candidate A", "Candidate B"],
      commentary: "A was clearer.",
    });
  });

  it("returns null for garbage", () => {
    expect(parseVerdictJson("no json here at all")).toBeNull();
    expect(parseVerdictJson("{broken json}")).toBeNull();
    expect(parseVerdictJson("")).toBeNull();
  });

  it("returns null for a JSON array or scalar", () => {
    expect(parseVerdictJson('["a", "b"]')).toBeNull();
    expect(parseVerdictJson("42")).toBeNull();
  });
});
