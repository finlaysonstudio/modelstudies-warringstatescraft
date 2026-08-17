import { fabricService } from "@jaypie/fabric";
import { ConfigurationError } from "@jaypie/errors";
import { describe, expect, it } from "vitest";
import { agent } from "../agent";
import { describeComposition, summarizeComposition } from "../describe";
import { fabricComposition, isComposition } from "../composition";
import { workflow } from "../workflow";

const noop = fabricService({
  alias: "noop",
  description: "returns its input",
  input: {},
  service: async (input) => input,
});

const second = fabricService({
  alias: "second",
  description: "second node",
  input: {},
  service: async () => ({ done: true }),
});

function baseNodes() {
  return [
    { id: "noop", service: noop },
    { id: "second", service: second },
  ];
}

describe("workflow", () => {
  it("requires an entry node", () => {
    expect(() =>
      workflow({ alias: "w", nodes: baseNodes(), terminal: ["second"] }),
    ).toThrow(ConfigurationError);
  });

  it("requires a terminal node", () => {
    expect(() =>
      workflow({ alias: "w", nodes: baseNodes(), entry: "noop" }),
    ).toThrow(ConfigurationError);
  });

  it("builds a composition that is also a fabric service", () => {
    const w = workflow({
      alias: "w",
      name: "W",
      nodes: baseNodes(),
      entry: "noop",
      terminal: ["second"],
      edges: [{ from: "noop", to: "second" }],
    });
    expect(isComposition(w)).toBe(true);
    expect(typeof w).toBe("function");
    expect(w.composition.kind).toBe("workflow");
  });
});

describe("fabricComposition validation", () => {
  it("rejects an entry that is not a node", () => {
    expect(() =>
      fabricComposition({
        alias: "w",
        kind: "workflow",
        nodes: baseNodes(),
        entry: "ghost",
        terminal: ["second"],
      }),
    ).toThrow(/entry "ghost"/);
  });

  it("rejects an edge to an unknown node", () => {
    expect(() =>
      fabricComposition({
        alias: "w",
        kind: "workflow",
        nodes: baseNodes(),
        entry: "noop",
        terminal: ["second"],
        edges: [{ from: "noop", to: "ghost" }],
      }),
    ).toThrow(/to "ghost"/);
  });

  it("accepts a bare service node keyed by its alias", () => {
    const w = fabricComposition({
      alias: "w",
      kind: "workflow",
      nodes: [noop, second],
      entry: "noop",
      terminal: ["second"],
      edges: [{ from: "noop", to: "second" }],
    });
    expect(w.composition.nodes.map((n) => n.id)).toEqual(["noop", "second"]);
  });
});

describe("introspection helpers", () => {
  const w = workflow({
    alias: "w",
    name: "W",
    description: "demo",
    nodes: baseNodes(),
    entry: "noop",
    terminal: ["second"],
    edges: [{ from: "noop", to: "second", guard: () => true }],
  });

  it("summarizes without functions", () => {
    expect(summarizeComposition(w.composition)).toEqual({
      alias: "w",
      name: "W",
      description: "demo",
      kind: "workflow",
      nodeCount: 2,
      edgeCount: 1,
    });
  });

  it("describes the graph with guarded edges flagged", () => {
    const graph = describeComposition(w.composition);
    expect(graph.entry).toBe("noop");
    expect(graph.terminal).toEqual(["second"]);
    expect(graph.nodes).toEqual(["noop", "second"]);
    expect(graph.pendingNodes).toEqual([]);
    expect(graph.edges).toEqual([
      { from: "noop", to: "second", guarded: true },
    ]);
    expect(JSON.stringify(graph)).toContain('"kind":"workflow"');
  });
});

describe("agent", () => {
  it("throws at the decision point when selector is not inferred", async () => {
    const a = agent({
      alias: "a",
      nodes: baseNodes(),
      entry: "noop",
      terminal: ["second"],
      edges: [{ from: "noop", to: "second" }],
    });
    expect(a.composition.kind).toBe("agent");
    await expect(a({})).rejects.toThrow(ConfigurationError);
  });

  it("runs when given an explicit selector", async () => {
    const a = agent({
      alias: "a2",
      nodes: baseNodes(),
      entry: "noop",
      terminal: ["second"],
      edges: [{ from: "noop", to: "second" }],
      selector: (eligible) => eligible[0],
    });
    await expect(a({})).resolves.toEqual({ done: true });
  });
});
