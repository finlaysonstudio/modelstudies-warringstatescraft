import type { InputFieldDefinition, Service } from "@jaypie/fabric";

/**
 * A fabric service of any input/output shape. Mirrors `@jaypie/fabric`'s own
 * `ServiceSuite.register(service: Service<any, any>)` — the `Service` type is
 * invariant on its output (via the serializer), so concrete typed services do
 * not assign to the default `Service`.
 */

export type AnyService = Service<any, any>;

/**
 * The two composition models from the Jaypie fabric vocabulary
 * (`mcp__jaypie__skill("vocabulary")`):
 * - `workflow` — a composition that *specifies* its selector, entry, and terminal
 * - `agent` — a composition that *infers* its selector, entry, or terminal
 */
export type CompositionKind = "workflow" | "agent";

/**
 * A node that runs a fabric service and emits its result as state.
 * `id` defaults to the service's `alias` when omitted.
 */
export interface ServiceNode {
  id: string;
  kind?: "service";
  service: AnyService;
}

/**
 * Context handed to a pending node's `dispatch` (runs in the Pending Lambda).
 */
export interface PendingDispatchContext {
  /** Step Functions task token — deliver this to resume the run. */
  taskToken: string;
  /** The state carried into this pending node. */
  input: unknown;
  /** The run (job) id. */
  runId: string;
}

/**
 * Side effect that hands the task token to an external system so the run can be
 * resumed later (a timer, a human, a webhook). Runs in the Pending Lambda.
 */
export type PendingDispatch = (
  context: PendingDispatchContext,
) => void | Promise<void>;

/**
 * A node where the run **waits** (informally "waiting"; status `pending`) for an
 * external callback. Reaching it mints a task token; the run resumes into
 * Processing when the token is delivered or `callTimeout` elapses. Requires the
 * durable (Step Functions) executor — the in-process executor needs a resolver.
 */
export interface PendingNode {
  id: string;
  kind: "pending";
  /** Seconds to wait for a callback before timing out back into Processing. */
  callTimeout?: number;
  /** Hands the task token to an external system. */
  dispatch?: PendingDispatch;
}

/**
 * State a pending node emits when its wait expires (no callback arrived within
 * `callTimeout`). The durable executor normalizes the raw Step Functions
 * `States.Timeout` catch into this marker before the graph advances, so guards
 * and downstream nodes get one typed contract for "the wait timed out" —
 * check it with {@link isTimeoutCallback}.
 */
export interface TimeoutCallback extends Record<string, unknown> {
  timeout: true;
  error: "States.Timeout";
}

/** Build the timeout marker (the durable executor's normalization target). */
export function timeoutCallback(): TimeoutCallback {
  return { timeout: true, error: "States.Timeout" };
}

/** Type guard: did the pending node time out (vs a delivered callback)? */
export function isTimeoutCallback(state: unknown): state is TimeoutCallback {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as TimeoutCallback).timeout === true &&
    (state as TimeoutCallback).error === "States.Timeout"
  );
}

/**
 * A node where the run waits for a **human decision** (status `gated`). Like a
 * pending node it parks on a task token, but it has no timeout — a gate waits
 * for its approver indefinitely (bounded only by the state machine's own cap).
 * The `job-approve` / `job-reject` services deliver the decision; the
 * gate then emits the state it was gating annotated with the decision fields
 * (see {@link isGateApproval} / {@link isGateRejection}), so guards route
 * approval and rejection to different edges. A rejection only follows an edge
 * whose guard accepts it — unguarded edges never fire for rejections, so an
 * unrouted rejection errors the run ("stuck") instead of proceeding as if
 * approved.
 */
export interface GateNode {
  id: string;
  kind: "gate";
  /** Human-readable question surfaced to the approver ("Ship this?"). */
  label?: string;
  /** Hands the task token to an external approval system. */
  dispatch?: PendingDispatch;
}

/**
 * The decision a gate resumes with. Delivered by `job-approve` /
 * `job-reject` (or an in-process gate resolver) and merged over the gate's
 * input before the graph advances — decision fields win on key collision.
 */
export interface GateApproval extends Record<string, unknown> {
  gate: true;
  approved: true;
  reason?: string;
}

export interface GateRejection extends Record<string, unknown> {
  gate: true;
  approved: false;
  reason?: string;
}

export type GateDecision = GateApproval | GateRejection;

/** Build an approval decision. */
export function gateApproval(reason?: string): GateApproval {
  return {
    gate: true,
    approved: true,
    ...(reason !== undefined && { reason }),
  };
}

/** Build a rejection decision. */
export function gateRejection(reason?: string): GateRejection {
  return {
    gate: true,
    approved: false,
    ...(reason !== undefined && { reason }),
  };
}

/** Type guard (usable as an edge guard): did the gate approve? */
export function isGateApproval(state: unknown): state is GateApproval {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as GateApproval).gate === true &&
    (state as GateApproval).approved === true
  );
}

/** Type guard (usable as an edge guard): did the gate reject? */
export function isGateRejection(state: unknown): state is GateRejection {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as GateRejection).gate === true &&
    (state as GateRejection).approved === false
  );
}

/**
 * A node where the run **calls another composition** as a durable child run and
 * waits (status `pending`) for its result — agent-to-agent, a call that
 * returns. The state carried into the node becomes the child's run input; the
 * child's terminal result becomes this node's emitted state. There is no
 * inbound callback route: the child's terminal handler resolves the parent's
 * parked task directly (`SendTaskSuccess`, or `SendTaskFailure` with an
 * {@link UpstreamErrorName} when the child ends abnormally — route those with
 * {@link isUpstreamFailure} guards; unguarded edges pass them through, same as
 * timeout markers).
 */
export interface CallNode {
  id: string;
  kind: "call";
  /** Registered composition alias to start as a durable child run. */
  alias: string;
  /** Seconds to wait for the child before timing out (default: 1-year cap). */
  callTimeout?: number;
}

/** Define a call (child-composition) node. */
export function callNode(config: Omit<CallNode, "kind">): CallNode {
  return { ...config, kind: "call" };
}

/**
 * The typed upstream-error taxonomy: how a child run's abnormal end reaches its
 * caller's parked task. These values ARE the Step Functions error names sent
 * via `SendTaskFailure` — they must stay in lockstep with the Pending task's
 * catch list in `workflows-stack.ts` and the local ASL (`engineDefinition.ts`),
 * which route them back to Processing at `$.upstreamError`. Without that catch
 * a canceled/errored child leaves its caller hung until the caller's own
 * `callTimeout`.
 */
export const UPSTREAM_ERROR_NAMES = [
  "UpstreamError",
  "UpstreamCanceled",
  "UpstreamExpired",
] as const;
export type UpstreamErrorName = (typeof UPSTREAM_ERROR_NAMES)[number];

/**
 * State a call node emits when its child run ended abnormally (errored,
 * canceled, or expired) instead of completing. The durable executor normalizes
 * the raw `$.upstreamError` catch envelope into this marker before the graph
 * advances — check it with {@link isUpstreamFailure}.
 */
export interface UpstreamFailure extends Record<string, unknown> {
  upstream: true;
  error: UpstreamErrorName;
  /** Human-readable reason carried from the child's terminal. */
  reason?: string;
  /** The child run (job) id, when known. */
  childId?: string;
}

/** Build the upstream-failure marker (the durable executor's normalization target). */
export function upstreamFailure(
  error: UpstreamErrorName,
  options: { reason?: string; childId?: string } = {},
): UpstreamFailure {
  return {
    upstream: true,
    error,
    ...(options.reason !== undefined && { reason: options.reason }),
    ...(options.childId !== undefined && { childId: options.childId }),
  };
}

/** Type guard (usable as an edge guard): did the child run end abnormally? */
export function isUpstreamFailure(state: unknown): state is UpstreamFailure {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as UpstreamFailure).upstream === true &&
    (UPSTREAM_ERROR_NAMES as readonly string[]).includes(
      (state as UpstreamFailure).error as string,
    )
  );
}

/**
 * A node in a composition graph: runs a service, waits for a callback, waits
 * for a human decision, or calls another composition.
 */
export type CompositionNode = ServiceNode | PendingNode | GateNode | CallNode;

/** Type guard: is this a pending (waiting) node? */
export function isPendingNode(node: CompositionNode): node is PendingNode {
  return (node as PendingNode).kind === "pending";
}

/** Type guard: is this a gate (human-approval) node? */
export function isGateNode(node: CompositionNode): node is GateNode {
  return (node as GateNode).kind === "gate";
}

/** Type guard: is this a call (child-composition) node? */
export function isCallNode(node: CompositionNode): node is CallNode {
  return (node as CallNode).kind === "call";
}

/** Type guard: is this a plain service node? */
export function isServiceNode(node: CompositionNode): node is ServiceNode {
  return !isPendingNode(node) && !isGateNode(node) && !isCallNode(node);
}

/** Define a pending (waiting) node. */
export function pendingNode(config: Omit<PendingNode, "kind">): PendingNode {
  return { ...config, kind: "pending" };
}

/** Define a gate (human-approval) node. */
export function gateNode(config: Omit<GateNode, "kind">): GateNode {
  return { ...config, kind: "gate" };
}

/**
 * Per-run context threaded through guards and the selector.
 */
export interface CompositionContext {
  /** This run's id (the job id under the durable executor). */
  runId: string;
  /** The composition's original input, fixed for the life of the run */
  input: Record<string, unknown>;
  /** Ordered list of node ids visited so far (entry first) */
  visited: string[];
}

/**
 * Per-edge predicate. Decides whether an edge is *eligible* to fire given the
 * state emitted by its `from` node. A guard gates; it does not choose. An edge
 * with no guard is always eligible.
 */
export type Guard = (state: unknown, context: CompositionContext) => boolean;

/**
 * A directed link carrying one node's emitted state to the next node's input.
 */
export interface Edge {
  from: string;
  to: string;
  guard?: Guard;
}

/**
 * Chooses which of the eligible edges fires. Returns `undefined` to halt.
 * A `workflow` specifies a selector explicitly; an `agent` infers one.
 */
export type Selector = (
  eligible: Edge[],
  state: unknown,
  context: CompositionContext,
) => Edge | undefined;

/**
 * Graph metadata carried by every composition for introspection. Attached to
 * the returned fabric service as `.composition`.
 */
export interface CompositionMeta {
  alias: string;
  name?: string;
  description?: string;
  kind: CompositionKind;
  nodes: CompositionNode[];
  edges: Edge[];
  entry: string;
  terminal: string[];
  selector: Selector;
  /**
   * Max node visits before the run aborts. Applies to the WHOLE run under
   * both executors — the durable engine threads the cumulative visit count
   * across waits, so a cycle through pending nodes still trips it.
   */
  maxSteps: number;
}

/**
 * A composition is itself a fabric service (it runs the graph), plus the graph
 * metadata that introspection and the future durable executor consume.
 */
export type Composition = Service & { composition: CompositionMeta };

/**
 * Shared config accepted by `fabricComposition` and the `workflow` / `agent`
 * convenience factories.
 */
export interface CompositionConfig {
  alias: string;
  name?: string;
  description?: string;
  /** Graph nodes. A bare `Service` is accepted and keyed by its `alias`. */
  nodes: Array<CompositionNode | AnyService>;
  /** Directed edges between node ids. */
  edges?: Edge[];
  /** Node id where the run begins. */
  entry?: string;
  /** Node id(s) where the run halts. */
  terminal?: string | string[];
  /** Selects the firing edge among eligible edges. */
  selector?: Selector;
  /**
   * Input schema for the composition-as-service. Defaults to the entry node's
   * input schema so adapters (CLI/MCP) surface the same flags as the entry.
   */
  input?: Record<string, InputFieldDefinition>;
  /** Max node visits before the executor aborts a runaway run. Default 100. */
  maxSteps?: number;
}
