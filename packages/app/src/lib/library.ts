// The replay library: every complete, human-free run with turns, indexed by
// its seat assignment. Not an entity — a filter over /data/runs.json.
import { HUMAN_MODEL, type RunIndexEntry, type RunLane } from "./types";

export interface LibraryGame {
  id: string;
  scenario: string;
  /** seat id -> model id */
  roster: Record<string, string>;
  createdAt: string;
  study?: string;
  lane: RunLane;
}

/**
 * The games of one scenario (or, with no scenario, of every scenario) that
 * belong to the library: complete, no human in the roster, and played turns
 * of their own (a matrix root has none).
 */
export function libraryOf(
  runs: RunIndexEntry[],
  scenario?: string,
): LibraryGame[] {
  return runs
    .filter(
      (run) =>
        (scenario === undefined || run.scenario === scenario) &&
        run.status === "complete" &&
        run.turnCount > 0 &&
        !Object.values(run.roster ?? {}).includes(HUMAN_MODEL),
    )
    .map((run) => ({
      id: run.id,
      scenario: run.scenario,
      roster: run.roster ?? {},
      createdAt: run.createdAt,
      ...(run.study ? { study: run.study } : {}),
      lane: run.branch.lane,
    }));
}

/**
 * Games whose roster names the chosen model for every constrained seat; an
 * unconstrained seat (absent or empty) matches any model. The followed seat
 * is a vantage, not a constraint, and is ignored if present in `opponents`.
 */
export function matchGames(
  games: LibraryGame[],
  seat: string,
  opponents: Partial<Record<string, string>>,
): LibraryGame[] {
  const constraints = Object.entries(opponents).filter(
    ([id, model]) => id !== seat && Boolean(model),
  ) as [string, string][];
  return games.filter((game) =>
    constraints.every(([id, model]) => game.roster[id] === model),
  );
}

/** deterministic 32-bit FNV-1a hash of a string */
const hash = (text: string): number => {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
};

/**
 * One game picked deterministically from the seed, so a reload does not
 * shuffle under the visitor; "another at random" changes the seed.
 */
export function pickRandom(
  games: LibraryGame[],
  seed: string,
): LibraryGame | undefined {
  if (games.length === 0) return undefined;
  return games[hash(seed) % games.length];
}
