import { fabricService } from "@jaypie/fabric";
import { ConfigurationError } from "@jaypie/errors";
import { execute, firstEligible } from "./execute";
import {
  isServiceNode,
  type AnyService,
  type Composition,
  type CompositionConfig,
  type CompositionKind,
  type CompositionMeta,
  type CompositionNode,
} from "./types";

function normalizeNodes(nodes: CompositionConfig["nodes"]): CompositionNode[] {
  return nodes.map((entry) => {
    if (typeof entry === "function") {
      const service = entry as AnyService;
      if (!service.alias) {
        throw new ConfigurationError(
          "Composition node service is missing an alias; provide an explicit node id",
        );
      }
      return { id: service.alias, service };
    }
    return entry;
  });
}

/**
 * Build a composition: a fabric service that runs a graph of fabric services.
 * A composition is itself a service (the vocabulary's "composition is itself a
 * service"), so it deploys through every fabric adapter (CLI/MCP/Lambda/LLM).
 *
 * Prefer the {@link workflow} / {@link agent} convenience factories, which set
 * `kind` and the selector/entry/terminal expectations for you.
 */
export function fabricComposition(
  config: CompositionConfig & { kind: CompositionKind },
): Composition {
  const nodes = normalizeNodes(config.nodes);
  if (nodes.length === 0) {
    throw new ConfigurationError(`Composition "${config.alias}" has no nodes`);
  }

  const ids = new Set(nodes.map((node) => node.id));
  const entry = config.entry ?? nodes[0].id;
  if (!ids.has(entry)) {
    throw new ConfigurationError(
      `Composition "${config.alias}" entry "${entry}" is not a node`,
    );
  }

  const terminal = Array.isArray(config.terminal)
    ? config.terminal
    : config.terminal
      ? [config.terminal]
      : [nodes[nodes.length - 1].id];
  for (const id of terminal) {
    if (!ids.has(id)) {
      throw new ConfigurationError(
        `Composition "${config.alias}" terminal "${id}" is not a node`,
      );
    }
  }

  const edges = config.edges ?? [];
  for (const edge of edges) {
    if (!ids.has(edge.from)) {
      throw new ConfigurationError(
        `Composition "${config.alias}" edge from "${edge.from}" is not a node`,
      );
    }
    if (!ids.has(edge.to)) {
      throw new ConfigurationError(
        `Composition "${config.alias}" edge to "${edge.to}" is not a node`,
      );
    }
  }

  const meta: CompositionMeta = {
    alias: config.alias,
    name: config.name,
    description: config.description,
    kind: config.kind,
    nodes,
    edges,
    entry,
    terminal,
    selector: config.selector ?? firstEligible,
    maxSteps: config.maxSteps ?? 100,
  };

  const entryNode = nodes.find((node) => node.id === entry);
  const input =
    config.input ??
    (entryNode && isServiceNode(entryNode)
      ? entryNode.service.input
      : undefined);

  const service = fabricService({
    alias: config.alias,
    description: config.description ?? config.name ?? config.alias,
    input,
    service: async (runInput: Record<string, unknown>) =>
      execute(meta, runInput),
  });

  return Object.assign(service, { composition: meta }) as Composition;
}

/** Type guard: is `value` a composition (a fabric service carrying graph meta)? */
export function isComposition(value: unknown): value is Composition {
  return (
    typeof value === "function" &&
    typeof (value as Composition).composition === "object"
  );
}
