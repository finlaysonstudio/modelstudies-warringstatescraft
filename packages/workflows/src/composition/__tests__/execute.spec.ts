import { fabricService } from "@jaypie/fabric";
import { describe, expect, it } from "vitest";
import { fabricComposition } from "../composition";
import {
  execute,
  simulateGateApproval,
  simulatePendingPassthrough,
} from "../execute";
import { callNode, gateNode, isGateApproval, pendingNode } from "../types";
import { describeComposition } from "../describe";
import { workflow } from "../workflow";

const classify = fabricService<{ route?: string }, { route: string }>({
  alias: "classify",
  description: "echo the route",
  input: { route: { type: String, required: false, description: "route" } },
  service: async ({ route }) => ({ route: route ?? "none" }),
});

const nodeA = fabricService({
  alias: "a",
  description: "A",
  input: {},
  service: async () => ({ result: "A" }),
});

const nodeB = fabricService({
  alias: "b",
  description: "B",
  input: {},
  service: async () => ({ result: "B" }),
});

function branching() {
  return workflow({
    alias: "branch",
    nodes: [
      { id: "classify", service: classify },
      { id: "a", service: nodeA },
      { id: "b", service: nodeB },
    ],
    entry: "classify",
    terminal: ["a", "b"],
    edges: [
      {
        from: "classify",
        to: "a",
        guard: (state) => (state as { route: string }).route === "a",
      },
      {
        from: "classify",
        to: "b",
        guard: (state) => (state as { route: string }).route === "b",
      },
    ],
  });
}

describe("execute", () => {
  it("carries emitted state across a guarded edge to the chosen terminal", async () => {
    await expect(branching()({ route: "a" })).resolves.toEqual({
      result: "A",
    });
    await expect(branching()({ route: "b" })).resolves.toEqual({
      result: "B",
    });
  });

  it("throws when stuck with no eligible transition and not terminal", async () => {
    await expect(branching()({ route: "z" })).rejects.toThrow(
      /stuck at node "classify"/,
    );
  });

  it("throws at a pending node by default, but simulates the wait when asked", async () => {
    const waiting = workflow({
      alias: "waiting",
      nodes: [
        { id: "classify", service: classify },
        pendingNode({ id: "wait" }),
        { id: "a", service: nodeA },
      ],
      entry: "classify",
      terminal: ["a"],
      edges: [
        { from: "classify", to: "wait" },
        { from: "wait", to: "a" },
      ],
    });

    // describe surfaces the pending node so a UI can flag the wait.
    expect(describeComposition(waiting.composition).pendingNodes).toEqual([
      "wait",
    ]);

    // Strict default: reaching the pending node throws.
    await expect(waiting({ route: "a" })).rejects.toThrow(
      /pending node "wait"/,
    );

    // Simulated: the pass-through resolver carries the wait through to the
    // terminal, so the graph runs to completion in-process.
    await expect(
      execute(
        waiting.composition,
        { route: "a" },
        { resolvePending: simulatePendingPassthrough },
      ),
    ).resolves.toEqual({ result: "A" });
  });

  it("throws at a gate by default, but auto-approves when asked", async () => {
    const gated = workflow({
      alias: "gated",
      nodes: [
        { id: "classify", service: classify },
        gateNode({ id: "gate", label: "Proceed?" }),
        { id: "a", service: nodeA },
      ],
      entry: "classify",
      terminal: ["a"],
      edges: [
        { from: "classify", to: "gate" },
        { from: "gate", to: "a", guard: isGateApproval },
      ],
    });

    // describe surfaces the gate node so a UI can flag the approval.
    expect(describeComposition(gated.composition).gateNodes).toEqual(["gate"]);

    // Strict default: reaching the gate throws.
    await expect(gated({ route: "a" })).rejects.toThrow(/gate node "gate"/);

    // Simulated: the auto-approval resolver satisfies the guard and the graph
    // runs to completion in-process.
    await expect(
      execute(
        gated.composition,
        { route: "a" },
        { resolveGate: simulateGateApproval },
      ),
    ).resolves.toEqual({ result: "A" });
  });

  it("throws at a call node by default, but nests when a resolver is supplied", async () => {
    const calling = workflow({
      alias: "calling",
      nodes: [
        { id: "classify", service: classify },
        callNode({ id: "call", alias: "branch" }),
      ],
      entry: "classify",
      terminal: ["call"],
      edges: [{ from: "classify", to: "call" }],
    });

    // describe surfaces the call node (and its target) so a UI can flag it.
    expect(describeComposition(calling.composition).callNodes).toEqual([
      { id: "call", alias: "branch" },
    ]);

    // Strict default: reaching the call throws.
    await expect(calling({ route: "a" })).rejects.toThrow(/call node "call"/);

    // With a resolver, the child result becomes the node's emitted state — the
    // service layer wires the registry-backed nested executor this way.
    const child = branching();
    await expect(
      execute(
        calling.composition,
        { route: "a" },
        {
          resolveCall: (node, input) =>
            execute(child.composition, input as Record<string, unknown>),
        },
      ),
    ).resolves.toEqual({ result: "A" });
  });

  it("aborts a runaway cycle at the step bound", async () => {
    const loop = fabricComposition({
      alias: "loop",
      kind: "workflow",
      maxSteps: 5,
      nodes: [
        { id: "a", service: nodeA },
        { id: "b", service: nodeB },
        { id: "end", service: nodeA },
      ],
      entry: "a",
      terminal: ["end"],
      edges: [
        { from: "a", to: "b" },
        { from: "b", to: "a" },
      ],
    });
    await expect(loop({})).rejects.toThrow(/exceeded 5 steps/);
  });
});
