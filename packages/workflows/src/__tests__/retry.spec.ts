import { describe, expect, it, vi } from "vitest";

import type { LlmClient } from "../llm/client";
import {
  classifyRetry,
  retryDelay,
  withRetry,
  type RetryAttempt,
} from "../llm/retry";

const withStatus = (status: number, message = "") =>
  Object.assign(new Error(message), { status });

describe("classifyRetry", () => {
  it("reads Jaypie's typed categories first", () => {
    expect(
      classifyRetry({ category: "rate_limit", retryAfterMs: 1500 }),
    ).toEqual({
      retryable: true,
      reason: "rate-limit",
      retryAfterMs: 1500,
    });
    expect(classifyRetry({ category: "retryable" }).retryable).toBe(true);
    expect(classifyRetry({ category: "quota" })).toEqual({
      retryable: false,
      reason: "quota",
    });
    expect(classifyRetry({ category: "unrecoverable" }).retryable).toBe(false);
    expect(classifyRetry({ category: "aborted" }).reason).toBe("aborted");
  });

  it("classifies by status, refusing a 429 that names an exhausted quota", () => {
    expect(classifyRetry(withStatus(429, "slow down")).reason).toBe(
      "rate-limit",
    );
    expect(
      classifyRetry(withStatus(429, "insufficient_quota: no credits")),
    ).toEqual({ retryable: false, reason: "quota" });
    expect(classifyRetry(withStatus(503)).reason).toBe("server");
    expect(classifyRetry(withStatus(529)).retryable).toBe(true);
    expect(classifyRetry(withStatus(400, "bad schema"))).toEqual({
      retryable: false,
      reason: "unrecoverable",
    });
    expect(classifyRetry(withStatus(401)).retryable).toBe(false);
  });

  it("classifies network faults by code or message, and looks through a cause", () => {
    expect(
      classifyRetry(Object.assign(new Error("x"), { code: "ECONNRESET" }))
        .reason,
    ).toBe("network");
    expect(classifyRetry(new TypeError("fetch failed")).reason).toBe("network");
    expect(
      classifyRetry(new Error("wrapped", { cause: withStatus(502) })).reason,
    ).toBe("server");
    expect(classifyRetry(new Error("something else"))).toEqual({
      retryable: false,
      reason: "unknown",
    });
    expect(classifyRetry(undefined).retryable).toBe(false);
  });
});

describe("retryDelay", () => {
  it("doubles from the base, honors a longer provider suggestion, and caps", () => {
    const fixed = { random: () => 0.5, jitter: 0.2 };
    const verdict = { retryable: true, reason: "server" as const };
    expect(retryDelay(1, verdict, { ...fixed, baseMs: 1000 })).toBe(1000);
    expect(retryDelay(2, verdict, { ...fixed, baseMs: 1000 })).toBe(2000);
    expect(retryDelay(3, verdict, { ...fixed, baseMs: 1000 })).toBe(4000);
    expect(
      retryDelay(
        1,
        { ...verdict, retryAfterMs: 9000 },
        { ...fixed, baseMs: 1000 },
      ),
    ).toBe(9000);
    expect(
      retryDelay(9, verdict, { ...fixed, baseMs: 1000, maxMs: 5000 }),
    ).toBe(5000);
    // jitter spreads within ±20%
    expect(
      retryDelay(1, verdict, { baseMs: 1000, jitter: 0.2, random: () => 0 }),
    ).toBe(800);
    expect(
      retryDelay(1, verdict, { baseMs: 1000, jitter: 0.2, random: () => 1 }),
    ).toBe(1200);
  });
});

describe("withRetry", () => {
  const flaky = (failures: unknown[]): LlmClient & { calls: number } => {
    const client = {
      calls: 0,
      async operate() {
        client.calls += 1;
        const failure = failures.shift();
        if (failure) throw failure;
        return { content: "ok" };
      },
    };
    return client;
  };

  it("re-issues a retryable failure, reports each absorbed attempt, and returns the reply", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const seen: RetryAttempt[] = [];
    const inner = flaky([withStatus(429, "slow"), withStatus(502)]);
    const client = withRetry(inner, {
      attempts: 4,
      baseMs: 100,
      jitter: 0,
      sleep,
      onRetry: (attempt) => seen.push(attempt),
    });
    const result = await client.operate("hi", { model: "m" });
    expect(result.content).toBe("ok");
    expect(inner.calls).toBe(3);
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([100, 200]);
    expect(
      seen.map((attempt) => [attempt.attempt, attempt.reason, attempt.model]),
    ).toEqual([
      [1, "rate-limit", "m"],
      [2, "server", "m"],
    ]);
  });

  it("throws the last error once the attempts are spent", async () => {
    const inner = flaky([withStatus(503), withStatus(503), withStatus(503)]);
    const client = withRetry(inner, { attempts: 3, sleep: async () => {} });
    await expect(client.operate("hi")).rejects.toMatchObject({ status: 503 });
    expect(inner.calls).toBe(3);
  });

  it("does not retry a quota, an unrecoverable, or an unknown error", async () => {
    for (const failure of [
      withStatus(429, "insufficient_quota: none"),
      withStatus(400),
      new Error("odd"),
    ]) {
      const inner = flaky([failure]);
      const client = withRetry(inner, { sleep: async () => {} });
      await expect(client.operate("hi")).rejects.toBe(failure);
      expect(inner.calls).toBe(1);
    }
  });

  it("stops waiting when the signal aborts", async () => {
    const controller = new AbortController();
    const inner = flaky([withStatus(503), withStatus(503)]);
    const client = withRetry(inner, {
      attempts: 5,
      signal: controller.signal,
      sleep: async () => {
        controller.abort();
      },
    });
    await expect(client.operate("hi")).rejects.toMatchObject({ status: 503 });
    expect(inner.calls).toBe(1);
  });
});
