/**
 * In-code composition registry: the catalog of every workflow and agent this
 * package's callers can run by alias, and the seam that lets call nodes
 * execute nested in-process. Mirrors the upstream registry, with explicit
 * registration instead of a static list.
 */
import { NotFoundError } from "@jaypie/errors";
import {
  execute,
  type CallResolver,
  type Composition,
  type ExecuteOptions,
} from "./composition";

const registry = new Map<string, Composition>();

/** Register a composition by its alias (last registration wins). */
export function registerComposition(composition: Composition): Composition {
  registry.set(composition.composition.alias, composition);
  return composition;
}

/** Look up one registered composition by alias, or throw `NotFoundError`. */
export function getComposition(alias: string): Composition {
  const found = registry.get(alias);
  if (!found) {
    throw new NotFoundError(`No composition registered for alias "${alias}"`);
  }
  return found;
}

/** All registered compositions. */
export function listCompositions(): Composition[] {
  return [...registry.values()];
}

/** Empty the registry (for tests). */
export function clearCompositions(): void {
  registry.clear();
}

/**
 * In-process call resolution: run the child composition synchronously with the
 * state carried into the call node as its input — the nested-function-call
 * equivalent of the durable child run. Recursive (a child's own call nodes
 * nest the same way), and the simulate resolvers propagate into the child.
 * Lives here, not in the primitives — `execute` cannot import the registry
 * without a cycle.
 */
export function nestedCallResolver(options: ExecuteOptions = {}): CallResolver {
  return (node, input) =>
    execute(
      getComposition(node.alias).composition,
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : input === undefined
          ? {}
          : { value: input },
      options,
    );
}
