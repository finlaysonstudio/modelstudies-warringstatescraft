import { ConfigurationError } from "@jaypie/errors";
import {
  isCallNode,
  isGateNode,
  isGateRejection,
  isPendingNode,
  type CallNode,
  type CompositionContext,
  type CompositionMeta,
  type Edge,
  type GateNode,
  type PendingNode,
} from "./types";

/** Default selector: the first eligible edge in declaration order. */
export function firstEligible(eligible: Edge[]): Edge | undefined {
  return eligible[0];
}

/** Coerce an emitted node state into the next node's event-input. */
export function asInput(state: unknown): Record<string, unknown> | string {
  if (typeof state === "string") return state;
  if (state && typeof state === "object")
    return state as Record<string, unknown>;
  return { value: state };
}

/**
 * The directive returned by {@link runGraph} / {@link advance}: the run either
 * waits at a pending node, completes at a terminal, or errors.
 */
export type Directive =
  | {
      status: "pending";
      nodeId: string;
      input: unknown;
      callTimeout?: number;
      /** Every node visited so far (including prior turns) — thread it back
       * in as `priorVisited` so `maxSteps` bounds the whole run. */
      visited: string[];
    }
  | {
      status: "gated";
      nodeId: string;
      input: unknown;
      /** Cumulative visits, same contract as the pending directive's. */
      visited: string[];
    }
  | { status: "complete"; result: unknown }
  | { status: "error"; reason: string; nodeId?: string };

/** Resolve a pending node in-process (testing / synchronous executors). */
export type PendingResolver = (
  node: PendingNode,
  input: unknown,
  context: CompositionContext,
) => unknown | Promise<unknown>;

/**
 * Resolve a gate in-process: return the DECISION (e.g. `gateApproval()`), not
 * the emitted state — the executor merges it over the gate's input, exactly as
 * the durable path merges a delivered decision.
 */
export type GateResolver = (
  node: GateNode,
  input: unknown,
  context: CompositionContext,
) => unknown | Promise<unknown>;

/**
 * Resolve a call node in-process: run the child composition with the state
 * carried into the node as its input and return the child's terminal result —
 * the in-process equivalent of the durable child run. The service layer wires
 * this (the primitives can't import the registry without a cycle).
 */
export type CallResolver = (
  node: CallNode,
  input: unknown,
  context: CompositionContext,
) => unknown | Promise<unknown>;

/**
 * A gate emits the state it was gating, annotated with the decision — decision
 * fields win on key collision. Non-object inputs are wrapped as `{ value }`.
 */
function withGateDecision(
  input: unknown,
  decision: unknown,
): Record<string, unknown> {
  const base =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : input === undefined
        ? {}
        : { value: input };
  const overlay =
    decision && typeof decision === "object" && !Array.isArray(decision)
      ? (decision as Record<string, unknown>)
      : {};
  return { ...base, ...overlay };
}

export interface RunGraphOptions {
  /** Node id to begin at (default: the composition entry). */
  startNodeId?: string;
  /** Input handed to the start node. */
  startInput?: unknown;
  /** The run's original input, fixed for the life of the run (ctx.input). */
  originalInput?: Record<string, unknown>;
  /** This run's id (ctx.runId). */
  runId?: string;
  /**
   * When resuming from a pending or gate node, its delivered callback. The
   * start node is then treated as that waiting node — its dispatch is skipped
   * and `resumeCallback` is consumed as its output (a gate node merges it over
   * its input first).
   */
  resumeCallback?: unknown;
  /** Resolve pending nodes synchronously; omit for the durable (park) path. */
  resolvePending?: PendingResolver;
  /** Resolve gate nodes synchronously; omit for the durable (park) path. */
  resolveGate?: GateResolver;
  /** Resolve call nodes synchronously; omit for the durable (child-run) path. */
  resolveCall?: CallResolver;
  /**
   * Node ids visited on prior durable turns (a pending directive's `visited`).
   * Seeds `context.visited` and counts toward `maxSteps`, so the bound covers
   * the whole run — not just this turn.
   */
  priorVisited?: string[];
  /** Max node visits before aborting a runaway run. Default: the meta's. */
  maxSteps?: number;
}

/**
 * Walk the composition graph forward, running service nodes in a loop until it
 * reaches a pending node (→ `pending` directive), a gate node (→ `gated`
 * directive) — unless resolved in-process — a terminal (→ `complete`), or a
 * dead end (→ `error`). Shared by the in-process executor ({@link execute})
 * and the durable Processing handler ({@link advance}).
 */
export async function runGraph(
  meta: CompositionMeta,
  options: RunGraphOptions = {},
): Promise<Directive> {
  const nodes = new Map(meta.nodes.map((node) => [node.id, node]));
  const terminal = new Set(meta.terminal);
  const maxSteps = options.maxSteps ?? meta.maxSteps ?? 100;

  const context: CompositionContext = {
    runId: options.runId ?? "local",
    input: options.originalInput ?? {},
    visited: [...(options.priorVisited ?? [])],
  };

  let nodeId = options.startNodeId ?? meta.entry;
  let input: unknown = options.startInput ?? options.originalInput ?? {};
  let resuming = options.resumeCallback !== undefined;

  // Bound on CUMULATIVE visits (context.visited carries prior turns), so a
  // durable run cycling through pending nodes trips maxSteps like any other.
  while (context.visited.length < maxSteps) {
    const node = nodes.get(nodeId);
    if (!node) {
      throw new ConfigurationError(
        `Composition "${meta.alias}" references unknown node "${nodeId}"`,
      );
    }
    context.visited.push(nodeId);

    let state: unknown;
    if (isGateNode(node)) {
      if (resuming) {
        state = withGateDecision(input, options.resumeCallback);
        resuming = false;
      } else if (options.resolveGate) {
        state = withGateDecision(
          input,
          await options.resolveGate(node, input, context),
        );
      } else {
        return { status: "gated", nodeId, input, visited: context.visited };
      }
    } else if (isPendingNode(node)) {
      if (resuming) {
        state = options.resumeCallback;
        resuming = false;
      } else if (options.resolvePending) {
        state = await options.resolvePending(node, input, context);
      } else {
        return {
          status: "pending",
          nodeId,
          input,
          callTimeout: node.callTimeout,
          visited: context.visited,
        };
      }
    } else if (isCallNode(node)) {
      // A call node parks exactly like a pending node — the Pending handler
      // tells them apart by node kind and starts the child run. The callback
      // (the child's terminal result, or an upstream-failure marker) is the
      // node's emitted state.
      if (resuming) {
        state = options.resumeCallback;
        resuming = false;
      } else if (options.resolveCall) {
        state = await options.resolveCall(node, input, context);
      } else {
        return {
          status: "pending",
          nodeId,
          input,
          callTimeout: node.callTimeout,
          visited: context.visited,
        };
      }
    } else {
      state = await node.service(input as Record<string, unknown>);
    }

    if (terminal.has(nodeId)) {
      return { status: "complete", result: state };
    }

    // A rejected gate only follows an edge that explicitly accepts it (a
    // passing guard). Unguarded edges mean "proceed" — never the right default
    // for a rejection, which must not advance as if approved.
    const requireGuard = isGateNode(node) && isGateRejection(state);
    const eligible = meta.edges
      .filter((edge) => edge.from === nodeId)
      .filter((edge) =>
        edge.guard ? edge.guard(state, context) : !requireGuard,
      );
    const chosen = meta.selector(eligible, state, context);
    if (!chosen) {
      return {
        status: "error",
        reason: `stuck at node "${nodeId}": no eligible transition and node is not terminal`,
        nodeId,
      };
    }

    nodeId = chosen.to;
    input = asInput(state);
  }

  return {
    status: "error",
    reason: `exceeded ${maxSteps} steps — check for a cycle without a terminal`,
  };
}

/**
 * Durable-executor entry point. Advances the graph one Processing turn: from a
 * fresh start or resumed from a pending node's callback, run forward until the
 * next pending node, terminal, or error. The Processing Lambda turns the
 * returned {@link Directive} into the next Step Functions payload.
 */
export interface DurableState {
  /** Position threaded across parks: the node to (re)enter and its input. */
  thread?: { nodeId: string; input: unknown };
  /** A pending node's callback, present only when resuming after a wait. */
  callback?: unknown;
  /** The run's original input, fixed for the life of the run. */
  runInput?: Record<string, unknown>;
  /** This run's id (job id). */
  runId?: string;
  /** Nodes visited on prior turns — keeps maxSteps a whole-run bound. */
  visited?: string[];
}

export async function advance(
  meta: CompositionMeta,
  state: DurableState = {},
): Promise<Directive> {
  const resuming = state.thread !== undefined && state.callback !== undefined;
  return runGraph(meta, {
    startNodeId: state.thread?.nodeId ?? meta.entry,
    startInput: state.thread?.input ?? state.runInput ?? {},
    originalInput: state.runInput ?? {},
    runId: state.runId,
    resumeCallback: resuming ? state.callback : undefined,
    priorVisited: state.visited,
  });
}
