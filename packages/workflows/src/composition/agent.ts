import { ConfigurationError } from "@jaypie/errors";
import { fabricComposition } from "./composition";
import type { Composition, CompositionConfig, Selector } from "./types";

/**
 * Config for an **agent**: a composition that *infers* its selector, entry, or
 * terminal. The inference engine (e.g. an LLM choosing the next node) is the
 * deferred piece — milestone 1 ships the factory and the `inferSelector` hook.
 */
export interface AgentConfig extends CompositionConfig {
  /**
   * The inferred selector. When omitted, the agent is a definition-only
   * scaffold: running it throws a clear `ConfigurationError` rather than
   * silently doing nothing. LLM-backed inference lands in a later milestone.
   */
  inferSelector?: Selector;
}

const NOT_INFERRED: Selector = () => {
  throw new ConfigurationError(
    "Agent selector inference is not implemented yet — provide `selector` or `inferSelector`, or run this as a `workflow`",
  );
};

/**
 * Define an **agent**: a composition that infers its selector/entry/terminal.
 * Milestone 1 wires the structure; supply `selector` or `inferSelector` to make
 * it runnable, otherwise execution fails loudly at the first decision point.
 */
export function agent(config: AgentConfig): Composition {
  const { inferSelector, selector, ...rest } = config;
  return fabricComposition({
    ...rest,
    kind: "agent",
    selector: selector ?? inferSelector ?? NOT_INFERRED,
  });
}
