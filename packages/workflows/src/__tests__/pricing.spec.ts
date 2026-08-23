import { describe, expect, it } from "vitest";

import type { LlmUsageItem } from "../llm/client";
import {
  billableTokens,
  MODEL_PRICES,
  priceOf,
  priceUsage,
  type ModelPrice,
} from "../llm/pricing";

const PRICES: Record<string, ModelPrice> = {
  "test-anthropic": {
    input: 10,
    output: 50,
    cachedInputRead: 1,
    cachedInputWrite: { "5m": 12.5, "1h": 20 },
  },
  "test-openai": { input: 10, output: 50, cachedInputRead: 1 },
  "test-google": { input: 10, output: 50 },
};

const item = (overrides: Partial<LlmUsageItem>): LlmUsageItem => ({
  input: 1_000_000,
  output: 100_000,
  reasoning: 0,
  total: 1_100_000,
  ...overrides,
});

describe("billableTokens", () => {
  it("keeps Anthropic input as reported (already uncached)", () => {
    expect(
      billableTokens(
        item({ provider: "anthropic", cacheRead: 400_000, reasoning: 20_000 }),
      ),
    ).toEqual({
      input: 1_000_000,
      output: 100_000,
      cacheRead: 400_000,
      cacheWrite: 0,
    });
  });

  it("subtracts cache reads from OpenAI-style input", () => {
    expect(
      billableTokens(item({ provider: "openai", cacheRead: 400_000 })).input,
    ).toBe(600_000);
    expect(
      billableTokens(item({ provider: "fireworks", cacheRead: 400_000 })).input,
    ).toBe(600_000);
  });

  it("adds Google reasoning to output", () => {
    expect(
      billableTokens(item({ provider: "google", reasoning: 50_000 })).output,
    ).toBe(150_000);
    expect(
      billableTokens(item({ provider: "openai", reasoning: 50_000 })).output,
    ).toBe(100_000);
  });
});

describe("priceOf", () => {
  it("prices input, output, cache reads, and cache writes at the 5m rate", () => {
    const usd = priceOf(
      item({
        provider: "anthropic",
        model: "test-anthropic",
        cacheRead: 1_000_000,
        cacheWrite: 1_000_000,
      }),
      PRICES,
    );
    // 10 + 5 + 1 + 12.5
    expect(usd).toBe(28.5);
  });

  it("bills cache reads and writes as input when no rate is listed", () => {
    expect(
      priceOf(
        item({
          provider: "google",
          model: "test-google",
          cacheRead: 0,
          cacheWrite: 1_000_000,
        }),
        PRICES,
      ),
    ).toBe(25);
  });

  it("returns undefined for an unpriced or unnamed model", () => {
    expect(priceOf(item({ model: "nope" }), PRICES)).toBeUndefined();
    expect(priceOf(item({}), PRICES)).toBeUndefined();
  });

  it("rounds to a millionth of a dollar", () => {
    expect(
      priceOf(
        item({ provider: "openai", model: "test-openai", input: 1, output: 1 }),
        PRICES,
      ),
    ).toBe(0.00006);
  });
});

describe("priceUsage", () => {
  it("stamps usd only where the model is priced", () => {
    const priced = priceUsage(
      [
        item({ provider: "openai", model: "test-openai" }),
        item({ provider: "openai", model: "unlisted" }),
      ],
      PRICES,
    );
    expect(priced[0].usd).toBe(15);
    expect("usd" in priced[1]).toBe(false);
  });
});

describe("MODEL_PRICES", () => {
  it("exposes Jaypie's table", () => {
    expect(Object.keys(MODEL_PRICES).length).toBeGreaterThan(10);
    expect(MODEL_PRICES["claude-sonnet-5"]?.input).toBeGreaterThan(0);
  });
});
