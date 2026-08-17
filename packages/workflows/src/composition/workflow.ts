import { ConfigurationError } from "@jaypie/errors";
import { fabricComposition } from "./composition";
import type { Composition, CompositionConfig } from "./types";

/**
 * Define a **workflow**: a composition that *specifies* its selector, entry,
 * and terminal (the vocabulary's explicit composition model). `entry` and
 * `terminal` are required; `selector` defaults to the first eligible edge in
 * declaration order.
 */
export function workflow(config: CompositionConfig): Composition {
  if (!config.entry) {
    throw new ConfigurationError(
      `Workflow "${config.alias}" must specify an entry node`,
    );
  }
  if (
    !config.terminal ||
    (Array.isArray(config.terminal) && config.terminal.length === 0)
  ) {
    throw new ConfigurationError(
      `Workflow "${config.alias}" must specify at least one terminal node`,
    );
  }
  return fabricComposition({ ...config, kind: "workflow" });
}
