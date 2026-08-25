import { describe, expect, it } from "vitest";

import { recoverStructuredOutput } from "../llm/jaypieClient";

describe("recoverStructuredOutput", () => {
  it("reads the structured_output tool call from an Anthropic reply", () => {
    const response = {
      content: undefined,
      responses: [
        {
          stop_reason: "tool_use",
          content: [
            {
              type: "tool_use",
              name: "structured_output",
              input: { focus: "ditch", seats: [] },
            },
          ],
        },
      ],
    };
    expect(recoverStructuredOutput(response)).toEqual({
      focus: "ditch",
      seats: [],
    });
  });

  it("reads OpenAI function calls in either shape, parsing string arguments", () => {
    expect(
      recoverStructuredOutput({
        responses: [
          {
            output: [
              {
                type: "function_call",
                name: "structured_output",
                arguments: '{"a":1}',
              },
            ],
          },
        ],
      }),
    ).toEqual({ a: 1 });
    expect(
      recoverStructuredOutput({
        responses: [
          {
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      function: {
                        name: "structured_output",
                        arguments: '{"b":2}',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toEqual({ b: 2 });
  });

  it("takes the last structured call and ignores other tools and text", () => {
    expect(
      recoverStructuredOutput({
        responses: [
          {
            content: [
              { type: "text", text: "thinking aloud" },
              { type: "tool_use", name: "search", input: { q: "x" } },
              { type: "tool_use", name: "structured_output", input: { n: 1 } },
            ],
          },
          {
            content: [
              { type: "tool_use", name: "structured_output", input: { n: 2 } },
            ],
          },
        ],
      }),
    ).toEqual({ n: 2 });
  });

  it("returns undefined with no raw responses, no structured call, or malformed arguments", () => {
    expect(recoverStructuredOutput(undefined)).toBeUndefined();
    expect(recoverStructuredOutput({ responses: [] })).toBeUndefined();
    expect(
      recoverStructuredOutput({
        responses: [{ content: [{ type: "text", text: "{}" }] }],
      }),
    ).toBeUndefined();
    expect(
      recoverStructuredOutput({
        responses: [
          {
            output: [
              {
                type: "function_call",
                name: "structured_output",
                arguments: "{",
              },
            ],
          },
        ],
      }),
    ).toBeUndefined();
  });
});
