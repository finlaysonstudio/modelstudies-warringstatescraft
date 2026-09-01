// Static-snapshot mode. `npm run build` in packages/chinatalk-submission-2026
// sets these at build time; a development server sets none of them and the app
// runs with every live affordance it has.
//
// Nothing here changes what the pages read: every page already reads `/data`,
// which an object store answers as well as the dev server does. What it
// changes is the truth the chrome tells — a snapshot is a fixed date, and the
// paths that would reach a model are not there to reach.

const flag = (value: unknown): boolean => value === "1" || value === "true";

/** true when this bundle was built as a deployed snapshot */
export const SNAPSHOT = flag(import.meta.env.VITE_SNAPSHOT);

/** ISO date the snapshot was taken, empty when not a snapshot */
export const SNAPSHOT_DATE: string =
  (import.meta.env.VITE_SNAPSHOT_DATE as string | undefined) ?? "";

/** what the snapshot is, one line, for the chrome */
export const SNAPSHOT_LABEL: string =
  (import.meta.env.VITE_SNAPSHOT_LABEL as string | undefined) ?? "Snapshot";

/**
 * Live play — a human taking a seat against the models — needs a server that
 * calls them. A snapshot has none, so every affordance that would start a game
 * is disabled rather than hidden: a reader should see that the bench exists and
 * that this deployment does not run it.
 */
export const LIVE_PLAY = !SNAPSHOT;

/** the one sentence every disabled affordance says */
export const LIVE_PLAY_NOTE =
  "Live play is disabled in this snapshot: playing a game calls the models, and a static deployment has nothing to call. Every recorded game below is complete and plays back in full.";
