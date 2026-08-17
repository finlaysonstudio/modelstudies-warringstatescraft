import { LLM } from "@jaypie/llm";
import { describe, expect, it } from "vitest";

import { MODELS } from "../models";

// The pin. `src/models.ts` mirrors LLM.MODEL as literals because the real
// constant drags a Node runtime into browser bundles; this spec runs in
// Node, where the import costs nothing, and fails the moment Jaypie
// repoints a name. Without it the mirror is just a copy waiting to go
// stale — which is the bug it exists to prevent.
const PINS: Record<keyof typeof MODELS, string> = {
  OPUS: LLM.MODEL.OPUS,
  SONNET: LLM.MODEL.SONNET,
  HAIKU: LLM.MODEL.HAIKU,
  SOL: LLM.MODEL.SOL,
  TERRA: LLM.MODEL.TERRA,
  LUNA: LLM.MODEL.LUNA,
  GEMINI_PRO: LLM.MODEL.GEMINI_PRO,
  GEMINI_FLASH: LLM.MODEL.GEMINI_FLASH,
  GEMINI_FLASH_LITE: LLM.MODEL.GEMINI_FLASH_LITE,
  GROK: LLM.MODEL.GROK,
  FIREWORKS_DEEPSEEK: LLM.MODEL.FIREWORKS.DEEPSEEK,
  FIREWORKS_GLM: LLM.MODEL.FIREWORKS.GLM,
  FIREWORKS_GPT_OSS: LLM.MODEL.FIREWORKS.GPT_OSS,
  FIREWORKS_KIMI: LLM.MODEL.FIREWORKS.KIMI,
  FIREWORKS_MINIMAX: LLM.MODEL.FIREWORKS.MINIMAX,
  FIREWORKS_QWEN: LLM.MODEL.FIREWORKS.QWEN,
  MISTRAL_LARGE: LLM.MODEL.MISTRAL.LARGE,
  OPENROUTER_GLM: LLM.MODEL.OPENROUTER.GLM,
};

describe("MODELS", () => {
  it("mirrors LLM.MODEL exactly", () => {
    expect(MODELS).toEqual(PINS);
  });

  it("pins every mirrored name, so none can be added unguarded", () => {
    expect(Object.keys(MODELS).sort()).toEqual(Object.keys(PINS).sort());
  });
});
