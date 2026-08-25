import { describe, expect, it } from "vitest";

import {
  ELICITATION_MODES,
  elicitationFor,
  LEGACY_OPENAI_MODELS,
  TEXT_ELICITATION_MODELS,
} from "../index";

describe("model capabilities", () => {
  it("routes the gpt-3.5 generation to text and everything else to schema", () => {
    for (const model of TEXT_ELICITATION_MODELS) {
      expect(elicitationFor(model)).toBe("text");
    }
    expect(elicitationFor(" gpt-3.5-turbo-0125 ")).toBe("text");
    for (const model of [
      "gpt-4-0613",
      "gpt-4",
      "gpt-4o-2024-08-06",
      "gemini-3.7-flash",
      "human",
      "scripted",
      undefined,
    ]) {
      expect(elicitationFor(model)).toBe("schema");
    }
  });

  it("names only legacy models, so the table cannot drift onto a strict-mode one", () => {
    for (const model of TEXT_ELICITATION_MODELS) {
      expect(LEGACY_OPENAI_MODELS).toContain(model);
    }
    expect(ELICITATION_MODES).toEqual(["schema", "text"]);
  });
});
