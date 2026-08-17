import {
  isCallNode,
  isGateNode,
  isPendingNode,
  type CompositionMeta,
} from "./types";

/** JSON-serializable summary of a composition for list views. */
export interface CompositionSummary {
  alias: string;
  name?: string;
  description?: string;
  kind: CompositionMeta["kind"];
  nodeCount: number;
  edgeCount: number;
}

/** JSON-serializable full graph of a composition for get/introspection. */
export interface CompositionGraph extends CompositionSummary {
  entry: string;
  terminal: string[];
  nodes: string[];
  /** Ids of pending (waiting) nodes — non-empty means the graph waits. */
  pendingNodes: string[];
  /** Ids of gate (human-approval) nodes — non-empty means the graph gates. */
  gateNodes: string[];
  /** Call (child-composition) nodes — non-empty means the graph calls out. */
  callNodes: Array<{ id: string; alias: string }>;
  edges: Array<{ from: string; to: string; guarded: boolean }>;
}

/** Strip functions from composition metadata for list adapters. */
export function summarizeComposition(
  meta: CompositionMeta,
): CompositionSummary {
  return {
    alias: meta.alias,
    name: meta.name,
    description: meta.description,
    kind: meta.kind,
    nodeCount: meta.nodes.length,
    edgeCount: meta.edges.length,
  };
}

/** Strip functions from composition metadata for get adapters. */
export function describeComposition(meta: CompositionMeta): CompositionGraph {
  return {
    ...summarizeComposition(meta),
    entry: meta.entry,
    terminal: meta.terminal,
    nodes: meta.nodes.map((node) => node.id),
    pendingNodes: meta.nodes.filter(isPendingNode).map((node) => node.id),
    gateNodes: meta.nodes.filter(isGateNode).map((node) => node.id),
    callNodes: meta.nodes
      .filter(isCallNode)
      .map((node) => ({ id: node.id, alias: node.alias })),
    edges: meta.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      guarded: Boolean(edge.guard),
    })),
  };
}
