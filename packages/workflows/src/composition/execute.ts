import { ConfigurationError } from "@jaypie/errors";
import {
  runGraph,
  type CallResolver,
  type GateResolver,
  type PendingResolver,
} from "./step";
import { gateApproval, isCallNode, type CompositionMeta } from "./types";

export { firstEligible } from "./step";

/**
 * Pass-through resolver for simulating a wait in-process: the pending node emits
 * the very input it received, as if an external caller immediately delivered the
 * same payload back. Lets a wait-bearing composition run to completion locally
 * (no parking, no durability) — the "simulate the callback" shortcut.
 */
export const simulatePendingPassthrough: PendingResolver = (_node, input) =>
  input;

/**
 * Resolver for simulating a gate in-process: approves immediately, as if the
 * operator clicked approve the instant the gate was reached. The gate emits its
 * input annotated with the approval — simulation only, no parking, no token.
 */
export const simulateGateApproval: GateResolver = () => gateApproval();

export interface ExecuteOptions {
  /** Max node visits before aborting a runaway run. Default: the meta's. */
  maxSteps?: number;
  /**
   * Resolve pending (waiting) nodes synchronously instead of throwing. Pass
   * {@link simulatePendingPassthrough} to fake the callback locally; omit to
   * keep the strict default (pending requires the durable executor).
   */
  resolvePending?: PendingResolver;
  /**
   * Resolve gate (human-approval) nodes synchronously instead of throwing.
   * Pass {@link simulateGateApproval} to auto-approve locally; omit to keep
   * the strict default (gates require the durable executor).
   */
  resolveGate?: GateResolver;
  /**
   * Resolve call (child-composition) nodes synchronously instead of throwing.
   * The `plan-run` service wires the registry-backed nested executor
   * here; omit to keep the strict default (calls require the durable executor).
   */
  resolveCall?: CallResolver;
}

/**
 * In-process composition executor (milestone 1). Runs the graph to completion
 * synchronously and returns the terminal node's result. By default, reaching a
 * pending (waiting) node throws — those require the durable Step Functions
 * executor. Pass `resolvePending` to simulate the wait in-process instead.
 *
 * The durable executor shares the same {@link runGraph} core via `advance()`.
 */
export async function execute(
  meta: CompositionMeta,
  input: Record<string, unknown> = {},
  options: ExecuteOptions = {},
): Promise<unknown> {
  const directive = await runGraph(meta, {
    startInput: input,
    originalInput: input,
    maxSteps: options.maxSteps,
    resolvePending: options.resolvePending,
    resolveGate: options.resolveGate,
    resolveCall: options.resolveCall,
  });

  if (directive.status === "complete") {
    return directive.result;
  }
  if (directive.status === "pending") {
    // Call nodes park under the same directive — name the right kind.
    const node = meta.nodes.find((n) => n.id === directive.nodeId);
    if (node && isCallNode(node)) {
      throw new ConfigurationError(
        `Composition "${meta.alias}" reached call node "${directive.nodeId}" — call nodes require the durable executor`,
      );
    }
    throw new ConfigurationError(
      `Composition "${meta.alias}" reached pending node "${directive.nodeId}" — pending nodes require the durable executor`,
    );
  }
  if (directive.status === "gated") {
    throw new ConfigurationError(
      `Composition "${meta.alias}" reached gate node "${directive.nodeId}" — gates require the durable executor`,
    );
  }
  throw new ConfigurationError(
    `Composition "${meta.alias}" ${directive.reason}`,
  );
}
