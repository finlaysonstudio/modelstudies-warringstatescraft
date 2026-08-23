import { describe, expect, it, vi } from "vitest";

import {
  createLegacyOpenAiClient,
  isLegacyOpenAiModel,
  LEGACY_OPENAI_MODELS,
  OPENAI_CHAT_COMPLETIONS_URL,
  repairJson,
} from "../llm/legacyOpenAiClient";

const completion = (
  message: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
) =>
  JSON.stringify({
    model: "gpt-4-0613",
    choices: [{ message }],
    usage: { prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100 },
    ...overrides,
  });

const respond = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });

const lastBody = (mock: ReturnType<typeof vi.fn>) =>
  JSON.parse(mock.mock.calls.at(-1)?.[1]?.body as string) as Record<
    string,
    unknown
  >;

const FORMAT = {
  type: "object",
  properties: {
    answers: { type: "array", items: { type: "string" } },
    choices: { type: "array", items: { type: "string", enum: ["a", "b"] } },
  },
  required: ["answers", "choices"],
  additionalProperties: false,
};

describe("isLegacyOpenAiModel", () => {
  it("names the Lamparth-era OpenAI ids and nothing else", () => {
    expect(LEGACY_OPENAI_MODELS).toContain("gpt-4-0613");
    expect(isLegacyOpenAiModel("gpt-4-0613")).toBe(true);
    expect(isLegacyOpenAiModel(" gpt-3.5-turbo-0125 ")).toBe(true);
    expect(isLegacyOpenAiModel("gpt-4o-2024-08-06")).toBe(false);
    expect(isLegacyOpenAiModel("gpt-4-turbo")).toBe(false);
    expect(isLegacyOpenAiModel(undefined)).toBe(false);
  });
});

describe("createLegacyOpenAiClient", () => {
  it("posts system, history, and prompt to chat completions without a temperature", async () => {
    const doFetch = vi.fn(async () =>
      respond(completion({ role: "assistant", content: "A reply." })),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Now?", {
      model: "gpt-4-0613",
      system: "You are the team.",
      history: [
        { role: "user", content: "Earlier" },
        { role: "assistant", content: "Yes" },
      ],
    });
    expect(doFetch).toHaveBeenCalledTimes(1);
    const [url, init] = doFetch.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toBe(OPENAI_CHAT_COMPLETIONS_URL);
    expect(init.headers.Authorization).toBe("Bearer k");
    const body = lastBody(doFetch);
    expect(body.model).toBe("gpt-4-0613");
    expect(body.messages).toEqual([
      { role: "system", content: "You are the team." },
      { role: "user", content: "Earlier" },
      { role: "assistant", content: "Yes" },
      { role: "user", content: "Now?" },
    ]);
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("tools");
    expect(result.content).toBe("A reply.");
  });

  it("satisfies a format with a forced function call and parses the arguments", async () => {
    const doFetch = vi.fn(async () =>
      respond(
        completion({
          role: "assistant",
          content: null,
          tool_calls: [
            {
              type: "function",
              function: {
                name: "response",
                arguments: JSON.stringify({ answers: ["x"], choices: ["b"] }),
              },
            },
          ],
        }),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Choose.", {
      model: "gpt-4-0613",
      format: FORMAT,
    });
    const body = lastBody(doFetch);
    expect(body.tools).toEqual([
      {
        type: "function",
        function: {
          name: "response",
          description: "Return the structured response.",
          parameters: FORMAT,
        },
      },
    ]);
    expect(body.tool_choice).toEqual({
      type: "function",
      function: { name: "response" },
    });
    expect(result.content).toEqual({ answers: ["x"], choices: ["b"] });
  });

  it("unwraps a { name, schema } format envelope", async () => {
    const doFetch = vi.fn(async () =>
      respond(
        completion({
          role: "assistant",
          tool_calls: [{ function: { name: "choice_memo", arguments: "{}" } }],
        }),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    await client.operate("Choose.", {
      model: "gpt-4-0613",
      format: { name: "choice_memo", schema: FORMAT },
    });
    const body = lastBody(doFetch);
    const [tool] = body.tools as { function: Record<string, unknown> }[];
    expect(tool.function.name).toBe("choice_memo");
    expect(tool.function.parameters).toEqual(FORMAT);
  });

  it("repairs the JSON defects gpt-4-0613 produces in function arguments", () => {
    expect(repairJson('{"a": ["x", "y",\n ], "b": 1,}')).toBe(
      '{"a": ["x", "y"], "b": 1}',
    );
    expect(JSON.parse(repairJson('{"a": "line one\nline two"}'))).toEqual({
      a: "line one\nline two",
    });
    expect(JSON.parse(repairJson('{"a": ["x", "unterminat'))).toEqual({
      a: ["x", "unterminat"],
    });
    expect(JSON.parse(repairJson('{"a": "tab\there"}'))).toEqual({
      a: "tab\there",
    });
  });

  it("parses arguments a repair can save and keeps the truth beyond repair raw", async () => {
    const args = '{"answers": ["ok",\n], "choices": ["b",]}';
    const doFetch = vi.fn(async () =>
      respond(
        completion({
          role: "assistant",
          tool_calls: [{ function: { name: "response", arguments: args } }],
        }),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Choose.", {
      model: "gpt-4-0613",
      format: FORMAT,
    });
    expect(result.content).toEqual({ answers: ["ok"], choices: ["b"] });
  });

  it("returns malformed function arguments as the raw string", async () => {
    const doFetch = vi.fn(async () =>
      respond(
        completion({
          role: "assistant",
          tool_calls: [{ function: { name: "response", arguments: "{not" } }],
        }),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Choose.", {
      model: "gpt-4-0613",
      format: FORMAT,
    });
    expect(result.content).toBe("{not");
  });

  it("stamps priced usage with the snapshot the response names", async () => {
    const doFetch = vi.fn(async () =>
      respond(
        completion(
          { role: "assistant", content: "ok" },
          {
            model: "gpt-3.5-turbo-0125",
            usage: {
              prompt_tokens: 1_000_000,
              completion_tokens: 1_000_000,
              total_tokens: 2_000_000,
              prompt_tokens_details: { cached_tokens: 0 },
            },
          },
        ),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Hi", { model: "gpt-3.5-turbo-16k" });
    expect(result.usage).toEqual([
      {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        total: 2_000_000,
        provider: "openai",
        model: "gpt-3.5-turbo-0125",
        usd: 2,
      },
    ]);
  });

  it("prices gpt-4-0613 at 30/60", async () => {
    const doFetch = vi.fn(async () =>
      respond(
        completion(
          { role: "assistant", content: "ok" },
          {
            usage: {
              prompt_tokens: 100_000,
              completion_tokens: 10_000,
              total_tokens: 110_000,
            },
          },
        ),
      ),
    );
    const client = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    const result = await client.operate("Hi", { model: "gpt-4-0613" });
    expect(result.usage?.[0]?.usd).toBeCloseTo(3.6, 6);
  });

  it("retries rate limits and server faults with backoff, then throws", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const doFetch = vi
      .fn()
      .mockResolvedValueOnce(
        respond(JSON.stringify({ error: { message: "slow down" } }), 429),
      )
      .mockResolvedValueOnce(respond("upstream", 502))
      .mockResolvedValueOnce(
        respond(completion({ role: "assistant", content: "ok" })),
      );
    const client = createLegacyOpenAiClient({
      apiKey: "k",
      fetch: doFetch,
      sleep,
    });
    const result = await client.operate("Hi", { model: "gpt-4-0613" });
    expect(result.content).toBe("ok");
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([2000, 4000]);

    const quota = vi.fn(async () =>
      respond(
        JSON.stringify({
          error: {
            message: "You have no credits remaining.",
            code: "insufficient_quota",
          },
        }),
        429,
      ),
    );
    const exhausted = createLegacyOpenAiClient({
      apiKey: "k",
      fetch: quota,
      sleep,
    });
    await expect(
      exhausted.operate("Hi", { model: "gpt-4-0613" }),
    ).rejects.toThrow(/credits/);
    expect(quota).toHaveBeenCalledTimes(1);

    const failing = vi.fn(async () =>
      respond(JSON.stringify({ error: { message: "bad schema" } }), 400),
    );
    const strict = createLegacyOpenAiClient({
      apiKey: "k",
      fetch: failing,
      sleep,
    });
    await expect(strict.operate("Hi", { model: "gpt-4-0613" })).rejects.toThrow(
      /OpenAI 400: bad schema/,
    );
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("refuses to run without a key or a model", async () => {
    const doFetch = vi.fn();
    const client = createLegacyOpenAiClient({ apiKey: "", fetch: doFetch });
    await expect(client.operate("Hi", { model: "gpt-4-0613" })).rejects.toThrow(
      /OPENAI_API_KEY/,
    );
    const keyed = createLegacyOpenAiClient({ apiKey: "k", fetch: doFetch });
    await expect(keyed.operate("Hi")).rejects.toThrow(/model/);
    expect(doFetch).not.toHaveBeenCalled();
  });
});
