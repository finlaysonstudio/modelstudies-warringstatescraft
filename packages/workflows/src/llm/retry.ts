/**
 * Outer retry over any {@link LlmClient}. The Jaypie path already retries
 * inside `Llm.operate` (transient faults with backoff, rate limits with a
 * one-minute floor) and the legacy Chat Completions client keeps the same
 * inner loop; both give up after their budget and throw. This wrapper is the
 * layer above that budget, for the outage that outlasts it: a handful of
 * attempts on a longer clock, and nothing else. What it retries is decided by
 * {@link classifyRetry}, one table for every client, and a caller can watch
 * every absorbed attempt through `onRetry` (the CLI writes them to its log).
 */
import type { LlmClient, LlmOperateOptions, LlmOperateResult } from "./client";

export type RetryReason =
  | "rate-limit"
  | "server"
  | "network"
  | "quota"
  | "aborted"
  | "unrecoverable"
  | "unknown";

export interface RetryVerdict {
  retryable: boolean;
  reason: RetryReason;
  /** the provider's suggested wait, when the error carried one */
  retryAfterMs?: number;
}

const RETRYABLE_STATUSES = new Set([
  408, 409, 425, 429, 500, 502, 503, 504, 529,
]);
const NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "EPIPE",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);
const QUOTA_PATTERN =
  /insufficient_quota|quota|credit|billing|balance|payment/i;
const NETWORK_PATTERN =
  /fetch failed|socket hang up|network|ECONNRESET|ETIMEDOUT|timed? ?out/i;

/**
 * One classification for every client. Jaypie's typed `LlmError`s carry a
 * `category`; the legacy client and raw provider SDKs carry a `status`;
 * undici and Node carry a `code`. A 429 that names an exhausted quota is
 * terminal on every path: no wait cures it.
 */
export function classifyRetry(error: unknown): RetryVerdict {
  const candidate = (error ?? {}) as {
    category?: string;
    name?: string;
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    retryAfterMs?: number;
    cause?: unknown;
  };
  const message = String(candidate.message ?? "");
  const retryAfterMs =
    typeof candidate.retryAfterMs === "number"
      ? candidate.retryAfterMs
      : undefined;
  const withAfter = (verdict: RetryVerdict): RetryVerdict =>
    retryAfterMs === undefined ? verdict : { ...verdict, retryAfterMs };
  switch (candidate.category) {
    case "aborted":
      return { retryable: false, reason: "aborted" };
    case "quota":
      return { retryable: false, reason: "quota" };
    case "unrecoverable":
      return { retryable: false, reason: "unrecoverable" };
    case "rate_limit":
      return withAfter({ retryable: true, reason: "rate-limit" });
    case "retryable":
    case "unknown":
      return withAfter({ retryable: true, reason: "server" });
    default:
      break;
  }
  if (candidate.name === "AbortError") {
    return { retryable: false, reason: "aborted" };
  }
  const status = candidate.status ?? candidate.statusCode;
  if (typeof status === "number" && status > 0) {
    if (status === 429) {
      return QUOTA_PATTERN.test(message)
        ? { retryable: false, reason: "quota" }
        : withAfter({ retryable: true, reason: "rate-limit" });
    }
    if (RETRYABLE_STATUSES.has(status)) {
      return withAfter({ retryable: true, reason: "server" });
    }
    return { retryable: false, reason: "unrecoverable" };
  }
  if (
    (candidate.code && NETWORK_CODES.has(candidate.code)) ||
    NETWORK_PATTERN.test(message)
  ) {
    return { retryable: true, reason: "network" };
  }
  if (candidate.cause && candidate.cause !== error) {
    const inner = classifyRetry(candidate.cause);
    if (inner.reason !== "unknown") return inner;
  }
  return { retryable: false, reason: "unknown" };
}

export interface RetryAttempt {
  /** the attempt that failed, 1-based */
  attempt: number;
  /** attempts the wrapper will make in total */
  attempts: number;
  /** the wait before the next attempt */
  delayMs: number;
  reason: RetryReason;
  error: unknown;
  model?: string;
}

export interface RetryOptions {
  /** total attempts including the first (default 4) */
  attempts?: number;
  /** first backoff in ms (default 5000); doubles per attempt */
  baseMs?: number;
  /** ceiling on one wait (default 60000) */
  maxMs?: number;
  /** multiplicative jitter in [1 − jitter, 1 + jitter] (default 0.2) */
  jitter?: number;
  /** a wait in progress ends when this aborts, and the wrapper throws the last error */
  signal?: AbortSignal;
  /** every absorbed failure, before its wait */
  onRetry?: (attempt: RetryAttempt) => void;
  /** injectable for tests */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** injectable for tests */
  random?: () => number;
}

export const DEFAULT_RETRY: Required<
  Pick<RetryOptions, "attempts" | "baseMs" | "maxMs" | "jitter">
> = {
  attempts: 4,
  baseMs: 5_000,
  maxMs: 60_000,
  jitter: 0.2,
};

const abortableSleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    }
    signal?.addEventListener("abort", done, { once: true });
  });

/** The wait before attempt `attempt + 1`, given the failure's verdict. */
export function retryDelay(
  attempt: number,
  verdict: RetryVerdict,
  options: RetryOptions = {},
): number {
  const { baseMs, maxMs, jitter } = { ...DEFAULT_RETRY, ...options };
  const random = options.random ?? Math.random;
  const backoff = baseMs * 2 ** (attempt - 1);
  const suggested = verdict.retryAfterMs ?? 0;
  const factor = 1 - jitter + 2 * jitter * random();
  return Math.min(maxMs, Math.round(Math.max(backoff, suggested) * factor));
}

/** Wrap a client so a call that fails on a retryable fault is re-issued. */
export function withRetry(
  llm: LlmClient,
  options: RetryOptions = {},
): LlmClient {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_RETRY.attempts);
  const sleep = options.sleep ?? abortableSleep;
  return {
    async operate(
      prompt: string,
      operateOptions: LlmOperateOptions = {},
    ): Promise<LlmOperateResult> {
      for (let attempt = 1; ; attempt += 1) {
        try {
          return await llm.operate(prompt, operateOptions);
        } catch (error) {
          const verdict = classifyRetry(error);
          if (
            !verdict.retryable ||
            attempt >= attempts ||
            options.signal?.aborted
          ) {
            throw error;
          }
          const delayMs = retryDelay(attempt, verdict, options);
          options.onRetry?.({
            attempt,
            attempts,
            delayMs,
            reason: verdict.reason,
            error,
            ...(operateOptions.model ? { model: operateOptions.model } : {}),
          });
          await sleep(delayMs, options.signal);
          if (options.signal?.aborted) throw error;
        }
      }
    },
  };
}
