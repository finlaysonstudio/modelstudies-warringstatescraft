import { fabricService } from "@jaypie/fabric";
import { afterEach, describe, expect, it } from "vitest";
import {
  callNode,
  execute,
  workflow,
  type ExecuteOptions,
} from "../composition";
import {
  clearCompositions,
  getComposition,
  listCompositions,
  nestedCallResolver,
  registerComposition,
} from "../registry";

const echo = fabricService<
  { content?: string },
  { echoed: string; length: number }
>({
  alias: "echo",
  description: "Echo received content back with its length",
  input: {
    content: { type: String, required: false, description: "Content" },
  },
  service: async ({ content }) => {
    const echoed = content ?? "";
    return { echoed, length: echoed.length };
  },
});

const childWorkflow = workflow({
  alias: "registry-child",
  description: "echo: smallest child composition",
  nodes: [{ id: "echo", service: echo }],
  entry: "echo",
  terminal: ["echo"],
});

const parentWorkflow = workflow({
  alias: "registry-parent",
  description: "call(registry-child) → echo the child's result",
  nodes: [callNode({ id: "call", alias: "registry-child" })],
  entry: "call",
  terminal: ["call"],
});

afterEach(() => {
  clearCompositions();
});

describe("registry", () => {
  it("registers, lists, and looks up compositions by alias", () => {
    registerComposition(childWorkflow);
    expect(getComposition("registry-child")).toBe(childWorkflow);
    expect(listCompositions()).toEqual([childWorkflow]);
  });

  it("throws NotFoundError for an unregistered alias", () => {
    expect(() => getComposition("missing")).toThrowError(
      'No composition registered for alias "missing"',
    );
  });

  it("clears the registry", () => {
    registerComposition(childWorkflow);
    clearCompositions();
    expect(listCompositions()).toEqual([]);
  });

  it("executes a callNode composition nested in-process via nestedCallResolver", async () => {
    registerComposition(childWorkflow);
    registerComposition(parentWorkflow);
    const options: ExecuteOptions = {};
    options.resolveCall = nestedCallResolver(options);
    const result = await execute(
      parentWorkflow.composition,
      { content: "hello" },
      options,
    );
    expect(result).toEqual({ echoed: "hello", length: 5 });
  });
});
