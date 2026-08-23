/**
 * Pricing: turns a usage item into list-price dollars. The table is
 * `@jaypie/llm`'s `LLM.COST` (standard rate per million tokens, keyed by
 * literal model id; retired ids stay priceable). Dollars are stamped on each
 * usage item at call time, because the price in force when a call was made is
 * what the call cost; a later price change does not re-rate history.
 */
import { LLM } from "@jaypie/llm";

import type { LlmUsage, LlmUsageItem } from "./client";

/** price of one million tokens, in US dollars */
export interface ModelPrice {
  input: number;
  output: number;
  /** cache-read tokens; omitted when reads bill as input */
  cachedInputRead?: number;
  /** cache-write tokens, scalar or by TTL; omitted when writes bill as input */
  cachedInputWrite?: number | { "1h": number; "5m": number };
  /** reasoning tokens; omitted when reasoning bills as output */
  reasoning?: number;
}

export const MODEL_PRICES: Record<string, ModelPrice> = LLM.COST;

const MILLION = 1_000_000;

/** providers whose `input` already excludes cache reads */
const UNCACHED_INPUT_PROVIDERS = new Set<string>([
  LLM.PROVIDER.ANTHROPIC.NAME,
  LLM.PROVIDER.BEDROCK.NAME,
]);

/** providers whose `output` excludes reasoning tokens */
const SEPARATE_REASONING_PROVIDERS = new Set<string>([
  LLM.PROVIDER.GOOGLE.NAME,
]);

/** the tokens a call bills, normalized across provider reporting conventions */
export const billableTokens = (
  item: LlmUsageItem,
): { input: number; output: number; cacheRead: number; cacheWrite: number } => {
  const provider = item.provider ?? "";
  const cacheRead = item.cacheRead ?? 0;
  const cacheWrite = item.cacheWrite ?? 0;
  const input = UNCACHED_INPUT_PROVIDERS.has(provider)
    ? item.input
    : Math.max(0, item.input - cacheRead);
  const output = SEPARATE_REASONING_PROVIDERS.has(provider)
    ? item.output + item.reasoning
    : item.output;
  return { input, output, cacheRead, cacheWrite };
};

/**
 * List-price dollars for one usage item, or undefined when its model has no
 * price. Cache writes at an unknown TTL bill at the 5-minute rate.
 */
export const priceOf = (
  item: LlmUsageItem,
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): number | undefined => {
  const price = item.model ? prices[item.model] : undefined;
  if (!price) return undefined;
  const tokens = billableTokens(item);
  const writeRate =
    typeof price.cachedInputWrite === "object"
      ? price.cachedInputWrite["5m"]
      : (price.cachedInputWrite ?? price.input);
  const readRate = price.cachedInputRead ?? price.input;
  const usd =
    (tokens.input * price.input +
      tokens.output * price.output +
      tokens.cacheRead * readRate +
      tokens.cacheWrite * writeRate) /
    MILLION;
  return Math.round(usd * 1e6) / 1e6;
};

/** the same items with `usd` stamped where the model is priced */
export const priceUsage = (
  usage: LlmUsage,
  prices: Record<string, ModelPrice> = MODEL_PRICES,
): LlmUsage =>
  usage.map((item) => {
    const usd = priceOf(item, prices);
    return usd === undefined ? { ...item } : { ...item, usd };
  });
