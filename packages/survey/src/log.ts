/**
 * Logger seam. Every module that logs accepts an injected `log`; the shared
 * no-op default keeps library code silent unless the caller wires one in.
 */
export interface Logger {
  trace(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

const noop = () => undefined;

/** The shared default: logs nowhere. */
export const noopLog: Logger = {
  trace: noop,
  debug: noop,
  warn: noop,
  error: noop,
};
