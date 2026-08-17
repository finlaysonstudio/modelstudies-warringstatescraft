import { describe, expect, it } from "vitest";

import { runPool } from "../labelPipeline";
import { runJudgeCalls } from "../runner";
import type { JudgeCall } from "../judges";
import type { LlmClient } from "@modelstudies/workflows";

describe("runPool", () => {
  it("runs every task and keeps order", async () => {
    const results = await runPool(
      [1, 2, 3, 4, 5].map((value) => async () => value * 2),
      2,
    );
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("holds at most `concurrency` tasks in flight", async () => {
    let inFlight = 0;
    let peak = 0;
    const tasks = Array.from({ length: 12 }, (_, index) => async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return index;
    });
    const results = await runPool(tasks, 3);
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
    expect(results).toHaveLength(12);
  });
});

function call(overrides: Partial<JudgeCall> = {}): JudgeCall {
  return {
    key: "scorer:blind:model-a",
    judge: "scorer",
    sight: "blind",
    run: 1,
    subject: "model-a",
    subjectLabel: "Model A",
    structured: true,
    system: "You are the Scorer.",
    user: "## Reply\n\nBet responsibly.",
    ...overrides,
  };
}

describe("runJudgeCalls", () => {
  it("fans every call across every model and settles verdicts", async () => {
    const seen: { prompt: string; model?: string; system?: string }[] = [];
    const llm: LlmClient = {
      operate: async (prompt, options) => {
        seen.push({ prompt, model: options?.model, system: options?.system });
        return { content: '{"score": 88, "commentary": "steady"}' };
      },
    };
    const verdicts = await runJudgeCalls({
      calls: [call()],
      models: ["judge-1", "judge-2"],
      llm,
    });
    expect(verdicts).toHaveLength(2);
    expect(verdicts.map((verdict) => verdict.key)).toEqual([
      "scorer:blind:model-a:judge-1",
      "scorer:blind:model-a:judge-2",
    ]);
    for (const verdict of verdicts) {
      expect(verdict.status).toBe("done");
      expect(verdict.data).toEqual({ score: 88, commentary: "steady" });
    }
    expect(seen.map((entry) => entry.model)).toEqual(["judge-1", "judge-2"]);
    expect(seen[0]?.system).toBe("You are the Scorer.");
    expect(seen[0]?.prompt).toContain("Bet responsibly.");
  });

  it("marks an unparseable structured verdict as an error", async () => {
    const replies = new Map<string, string>([
      ["good-judge", 'Sure! {"score": 70, "commentary": "fair"}'],
      ["bad-judge", "I refuse to answer in JSON."],
    ]);
    const llm: LlmClient = {
      operate: async (_prompt, options) => ({
        content: replies.get(options?.model ?? "") ?? "",
      }),
    };
    const verdicts = await runJudgeCalls({
      calls: [call()],
      models: ["good-judge", "bad-judge"],
      llm,
    });
    const good = verdicts.find((verdict) => verdict.model === "good-judge");
    const bad = verdicts.find((verdict) => verdict.model === "bad-judge");
    expect(good?.status).toBe("done");
    expect(good?.data).toEqual({ score: 70, commentary: "fair" });
    expect(bad?.status).toBe("error");
    expect(bad?.error).toBe("The verdict was not valid JSON.");
    expect(bad?.raw).toBe("I refuse to answer in JSON.");
  });

  it("accepts pre-parsed object content and passes prose through unparsed", async () => {
    const llm: LlmClient = {
      operate: async (_prompt, options) =>
        options?.model === "object-judge"
          ? { content: { score: 61, commentary: "parsed upstream" } }
          : { content: "A fine reply, well hedged." },
    };
    const [structured] = await runJudgeCalls({
      calls: [call()],
      models: ["object-judge"],
      llm,
    });
    expect(structured?.status).toBe("done");
    expect(structured?.data).toEqual({
      score: 61,
      commentary: "parsed upstream",
    });

    const [prose] = await runJudgeCalls({
      calls: [call({ key: "commentator:blind:model-a", structured: false })],
      models: ["prose-judge"],
      llm,
    });
    expect(prose?.status).toBe("done");
    expect(prose?.raw).toBe("A fine reply, well hedged.");
    expect(prose?.data).toBeUndefined();
  });

  it("settles a thrown operate as an error verdict", async () => {
    const llm: LlmClient = {
      operate: async () => {
        throw new Error("model not found");
      },
    };
    const [verdict] = await runJudgeCalls({
      calls: [call()],
      models: ["missing-judge"],
      llm,
    });
    expect(verdict?.status).toBe("error");
    expect(verdict?.error).toBe("model not found");
  });
});
