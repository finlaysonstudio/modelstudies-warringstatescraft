import { fabricService } from "@jaypie/fabric";
import { ConfigurationError } from "@jaypie/errors";
import { describe, expect, it } from "vitest";
import { workflow } from "../workflow";
import { advance, runGraph } from "../step";
import {
  callNode,
  gateApproval,
  gateNode,
  gateRejection,
  isGateApproval,
  isGateRejection,
  isTimeoutCallback,
  isUpstreamFailure,
  pendingNode,
  timeoutCallback,
  upstreamFailure,
} from "../types";

const ping = fabricService<{ content?: string }, { content: string }>({
  alias: "ping",
  description: "echo content",
  input: { content: { type: String, required: false, description: "c" } },
  service: async ({ content }) => ({ content: content ?? "" }),
});

const echo = fabricService<{ content?: string }, { echoed: string }>({
  alias: "echo",
  description: "echo",
  input: { content: { type: String, required: false, description: "c" } },
  service: async ({ content }) => ({ echoed: content ?? "" }),
});

function waitWorkflow() {
  return workflow({
    alias: "wait-wf",
    nodes: [
      { id: "ping", service: ping },
      pendingNode({ id: "wait", callTimeout: 30 }),
      { id: "echo", service: echo },
    ],
    entry: "ping",
    terminal: ["echo"],
    edges: [
      { from: "ping", to: "wait" },
      { from: "wait", to: "echo" },
    ],
  });
}

describe("advance (durable executor)", () => {
  it("waits at a pending node with its node id and callTimeout", async () => {
    const wf = waitWorkflow();
    const directive = await advance(wf.composition, {
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("pending");
    if (directive.status === "pending") {
      expect(directive.nodeId).toBe("wait");
      expect(directive.callTimeout).toBe(30);
      // The state carried into the wait is ping's emitted content.
      expect(directive.input).toEqual({ content: "hi" });
    }
  });

  it("resumes from a callback past the pending node to the terminal", async () => {
    const wf = waitWorkflow();
    const directive = await advance(wf.composition, {
      thread: { nodeId: "wait", input: { content: "hi" } },
      callback: { content: "resumed" },
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ echoed: "resumed" });
    }
  });

  it("reports the cumulative visited list on a pending directive", async () => {
    const wf = waitWorkflow();
    const directive = await advance(wf.composition, {
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("pending");
    if (directive.status === "pending") {
      expect(directive.visited).toEqual(["ping", "wait"]);
    }
  });

  it("bounds maxSteps across turns — prior visits count against the run", async () => {
    const wf = waitWorkflow();
    // A run that already spent its whole budget on earlier turns cannot take
    // another step, even though this single turn is tiny.
    const spent = Array.from({ length: 100 }, () => "wait");
    const directive = await advance(wf.composition, {
      thread: { nodeId: "wait", input: { content: "hi" } },
      callback: { content: "resumed" },
      runInput: { content: "hi" },
      runId: "job-1",
      visited: spent,
    });
    expect(directive.status).toBe("error");
    if (directive.status === "error") {
      expect(directive.reason).toMatch(/exceeded 100 steps/);
    }
  });
});

describe("timeout callback marker", () => {
  it("timeoutCallback() satisfies its own guard", () => {
    expect(isTimeoutCallback(timeoutCallback())).toBe(true);
  });

  it("rejects delivered callbacks and near-misses", () => {
    expect(isTimeoutCallback({ content: "resumed" })).toBe(false);
    expect(isTimeoutCallback({ timeout: true })).toBe(false);
    expect(isTimeoutCallback({ Error: "States.Timeout" })).toBe(false);
    expect(isTimeoutCallback(undefined)).toBe(false);
    expect(isTimeoutCallback("timeout")).toBe(false);
  });
});

describe("runGraph pending resolver", () => {
  it("resolves pending nodes synchronously when a resolver is supplied", async () => {
    const wf = waitWorkflow();
    const directive = await runGraph(wf.composition, {
      startInput: { content: "hi" },
      originalInput: { content: "hi" },
      resolvePending: () => ({ content: "auto" }),
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ echoed: "auto" });
    }
  });
});

describe("in-process executor rejects pending nodes", () => {
  it("throws when a composition reaches a pending node without the durable executor", async () => {
    const wf = waitWorkflow();
    await expect(wf({ content: "hi" })).rejects.toThrow(ConfigurationError);
    await expect(wf({ content: "hi" })).rejects.toThrow(/pending node "wait"/);
  });
});

const deny = fabricService<{ reason?: string }, { denied: true }>({
  alias: "deny",
  description: "deny",
  input: { reason: { type: String, required: false, description: "r" } },
  service: async () => ({ denied: true }),
});

function gateWorkflow() {
  return workflow({
    alias: "gate-wf",
    nodes: [
      { id: "ping", service: ping },
      gateNode({ id: "gate", label: "Echo this?" }),
      { id: "echo", service: echo },
      { id: "deny", service: deny },
    ],
    entry: "ping",
    terminal: ["echo", "deny"],
    edges: [
      { from: "ping", to: "gate" },
      { from: "gate", to: "echo", guard: isGateApproval },
      { from: "gate", to: "deny", guard: isGateRejection },
    ],
  });
}

describe("advance (gate nodes)", () => {
  it("parks at a gate node with a gated directive", async () => {
    const wf = gateWorkflow();
    const directive = await advance(wf.composition, {
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("gated");
    if (directive.status === "gated") {
      expect(directive.nodeId).toBe("gate");
      expect(directive.input).toEqual({ content: "hi" });
      expect(directive.visited).toEqual(["ping", "gate"]);
    }
  });

  it("resumes an approval through the gate, merging decision over input", async () => {
    const wf = gateWorkflow();
    const directive = await advance(wf.composition, {
      thread: { nodeId: "gate", input: { content: "hi" } },
      callback: gateApproval("ship it"),
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      // The gate passed its input through — echo still saw the content.
      expect(directive.result).toEqual({ echoed: "hi" });
    }
  });

  it("routes a rejection to the guarded rejection edge", async () => {
    const wf = gateWorkflow();
    const directive = await advance(wf.composition, {
      thread: { nodeId: "gate", input: { content: "hi" } },
      callback: gateRejection("nope"),
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ denied: true });
    }
  });

  it("never advances a rejection through an unguarded edge", async () => {
    const wf = workflow({
      alias: "unguarded-gate-wf",
      nodes: [
        { id: "ping", service: ping },
        gateNode({ id: "gate" }),
        { id: "echo", service: echo },
      ],
      entry: "ping",
      terminal: ["echo"],
      edges: [
        { from: "ping", to: "gate" },
        { from: "gate", to: "echo" }, // unguarded: fires for approvals only
      ],
    });
    const approved = await advance(wf.composition, {
      thread: { nodeId: "gate", input: { content: "hi" } },
      callback: gateApproval(),
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(approved.status).toBe("complete");

    const rejected = await advance(wf.composition, {
      thread: { nodeId: "gate", input: { content: "hi" } },
      callback: gateRejection(),
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(rejected.status).toBe("error");
    if (rejected.status === "error") {
      expect(rejected.reason).toMatch(/stuck at node "gate"/);
    }
  });
});

describe("gate decision markers", () => {
  it("constructors satisfy their own guards and carry the reason", () => {
    expect(isGateApproval(gateApproval())).toBe(true);
    expect(isGateRejection(gateRejection())).toBe(true);
    expect(gateApproval("ok").reason).toBe("ok");
    expect(gateRejection("no").reason).toBe("no");
  });

  it("guards reject the opposite decision and non-decisions", () => {
    expect(isGateApproval(gateRejection())).toBe(false);
    expect(isGateRejection(gateApproval())).toBe(false);
    expect(isGateApproval({ approved: true })).toBe(false);
    expect(isGateRejection(undefined)).toBe(false);
    expect(isGateApproval("approve")).toBe(false);
  });

  it("guards still match after the merge over gate input", () => {
    // The gate emits { ...input, ...decision } — the markers ride along.
    expect(isGateApproval({ content: "hi", ...gateApproval() })).toBe(true);
    expect(isGateRejection({ content: "hi", ...gateRejection() })).toBe(true);
  });
});

describe("runGraph gate resolver", () => {
  it("resolves gates synchronously when a resolver is supplied", async () => {
    const wf = gateWorkflow();
    const directive = await runGraph(wf.composition, {
      startInput: { content: "hi" },
      originalInput: { content: "hi" },
      resolveGate: () => gateApproval(),
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ echoed: "hi" });
    }
  });

  it("routes a resolver rejection like a delivered rejection", async () => {
    const wf = gateWorkflow();
    const directive = await runGraph(wf.composition, {
      startInput: { content: "hi" },
      originalInput: { content: "hi" },
      resolveGate: () => gateRejection("not now"),
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ denied: true });
    }
  });
});

describe("in-process executor rejects gate nodes", () => {
  it("throws when a composition reaches a gate without the durable executor", async () => {
    const wf = gateWorkflow();
    await expect(wf({ content: "hi" })).rejects.toThrow(ConfigurationError);
    await expect(wf({ content: "hi" })).rejects.toThrow(/gate node "gate"/);
  });
});

const failed = fabricService<
  { error?: string; reason?: string },
  { failed: true; error?: string; reason?: string }
>({
  alias: "failed",
  description: "report an upstream failure",
  input: {
    error: { type: String, required: false, description: "e" },
    reason: { type: String, required: false, description: "r" },
  },
  service: async ({ error, reason }) => ({
    failed: true,
    ...(error !== undefined && { error }),
    ...(reason !== undefined && { reason }),
  }),
});

function callWorkflow() {
  return workflow({
    alias: "call-wf",
    nodes: [
      { id: "ping", service: ping },
      callNode({ id: "call", alias: "child-wf", callTimeout: 300 }),
      { id: "echo", service: echo },
      { id: "failed", service: failed },
    ],
    entry: "ping",
    terminal: ["echo", "failed"],
    edges: [
      { from: "ping", to: "call" },
      { from: "call", to: "failed", guard: isUpstreamFailure },
      { from: "call", to: "echo", guard: (s) => !isUpstreamFailure(s) },
    ],
  });
}

describe("advance (call nodes)", () => {
  it("parks at a call node as a pending directive with its callTimeout", async () => {
    const wf = callWorkflow();
    const directive = await advance(wf.composition, {
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("pending");
    if (directive.status === "pending") {
      expect(directive.nodeId).toBe("call");
      expect(directive.callTimeout).toBe(300);
      // The state carried into the call is the child's run input.
      expect(directive.input).toEqual({ content: "hi" });
      expect(directive.visited).toEqual(["ping", "call"]);
    }
  });

  it("resumes with the child's result down the success edge", async () => {
    const wf = callWorkflow();
    const directive = await advance(wf.composition, {
      thread: { nodeId: "call", input: { content: "hi" } },
      callback: { content: "from the child" },
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ echoed: "from the child" });
    }
  });

  it("routes an upstream failure to the guarded failure edge", async () => {
    const wf = callWorkflow();
    const directive = await advance(wf.composition, {
      thread: { nodeId: "call", input: { content: "hi" } },
      callback: upstreamFailure("UpstreamCanceled", {
        reason: "run child-1 was canceled",
        childId: "child-1",
      }),
      runInput: { content: "hi" },
      runId: "job-1",
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({
        failed: true,
        error: "UpstreamCanceled",
        reason: "run child-1 was canceled",
      });
    }
  });
});

describe("upstream failure marker", () => {
  it("constructors satisfy their own guard and carry reason + childId", () => {
    const marker = upstreamFailure("UpstreamError", {
      reason: "boom",
      childId: "c1",
    });
    expect(isUpstreamFailure(marker)).toBe(true);
    expect(marker.reason).toBe("boom");
    expect(marker.childId).toBe("c1");
    expect(isUpstreamFailure(upstreamFailure("UpstreamCanceled"))).toBe(true);
    expect(isUpstreamFailure(upstreamFailure("UpstreamExpired"))).toBe(true);
  });

  it("rejects delivered callbacks and near-misses", () => {
    expect(isUpstreamFailure({ content: "resumed" })).toBe(false);
    expect(isUpstreamFailure({ upstream: true })).toBe(false);
    expect(isUpstreamFailure({ upstream: true, error: "SomethingElse" })).toBe(
      false,
    );
    expect(isUpstreamFailure(timeoutCallback())).toBe(false);
    expect(isUpstreamFailure(undefined)).toBe(false);
    expect(isUpstreamFailure("UpstreamError")).toBe(false);
  });
});

describe("runGraph call resolver", () => {
  it("resolves call nodes synchronously when a resolver is supplied", async () => {
    const wf = callWorkflow();
    const directive = await runGraph(wf.composition, {
      startInput: { content: "hi" },
      originalInput: { content: "hi" },
      resolveCall: (node, input) => ({
        content: `${node.alias} saw ${(input as { content: string }).content}`,
      }),
    });
    expect(directive.status).toBe("complete");
    if (directive.status === "complete") {
      expect(directive.result).toEqual({ echoed: "child-wf saw hi" });
    }
  });
});

describe("in-process executor rejects call nodes", () => {
  it("throws with a call-node message without the durable executor", async () => {
    const wf = callWorkflow();
    await expect(wf({ content: "hi" })).rejects.toThrow(ConfigurationError);
    await expect(wf({ content: "hi" })).rejects.toThrow(/call node "call"/);
  });
});
