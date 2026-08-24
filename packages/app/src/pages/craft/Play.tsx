import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { campaignOf } from "../../campaigns";
import {
  libraryOf,
  matchGames,
  pickRandom,
  type LibraryGame,
} from "../../lib/library";
import type { RunIndexEntry, ScenarioIndexEntry } from "../../lib/types";

// Play: choose a game from the replay library and watch it. Non-interactive
// in this build — the chooser narrows the library by chapter, the seat to
// follow, and the models on the other seats, then hands one recorded game
// to the watch page. Every choice lives in the query string, so a
// configuration is a link.

const shortModel = (model: string) => model.split("/").pop() ?? model;

const chip = (active: boolean) =>
  clsx(
    "cursor-pointer rounded-sm border px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
    active
      ? "border-brand-terminal/40 text-brand-terminal"
      : "border-white/10 text-zinc-500 hover:text-zinc-200",
  );

export function Play() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioIndexEntry[]>([]);
  const [runs, setRuns] = useState<RunIndexEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [scenariosRes, runsRes] = await Promise.all([
          fetch("/data/scenarios.json"),
          fetch("/data/runs.json"),
        ]);
        if (scenariosRes.ok) {
          const entries = (await scenariosRes.json()) as ScenarioIndexEntry[];
          if (!cancelled) {
            setScenarios(
              entries
                .filter((entry) => campaignOf(entry.id) === "craft")
                .sort((a, b) => a.order - b.order),
            );
          }
        }
        if (runsRes.ok) {
          const entries = (await runsRes.json()) as RunIndexEntry[];
          if (!cancelled) setRuns(entries);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chapter = params.get("chapter") ?? "";
  const entry = scenarios.find((scenario) => scenario.id === chapter);
  const library = useMemo(
    () => libraryOf(runs, chapter || undefined),
    [runs, chapter],
  );
  const craftLibrary = useMemo(
    () =>
      libraryOf(runs).filter((game) => campaignOf(game.scenario) === "craft"),
    [runs],
  );

  // seats come from the index; a chapter played before the index carried
  // seats falls back to the union of the library's roster keys
  const seats = useMemo(() => {
    if (entry?.seats?.length) return entry.seats;
    const ids = [
      ...new Set(library.flatMap((game) => Object.keys(game.roster))),
    ];
    return ids.map((id) => ({ id, name: id }));
  }, [entry, library]);

  const seat = params.get("seat") ?? "";
  const opponents = useMemo(() => {
    const chosen: Partial<Record<string, string>> = {};
    for (const { id } of seats) {
      const model = params.get(id);
      if (model) chosen[id] = model;
    }
    return chosen;
  }, [params, seats]);

  const matches = useMemo(
    () => (seat ? matchGames(library, seat, opponents) : library),
    [library, seat, opponents],
  );

  // the models the library has seen on each seat, for the opponent chips
  const modelsBySeat = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const game of library) {
      for (const [id, model] of Object.entries(game.roster)) {
        const list = map.get(id) ?? [];
        if (!list.includes(model)) list.push(model);
        map.set(id, list);
      }
    }
    return map;
  }, [library]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && next.get(key) !== value) next.set(key, value);
    else next.delete(key);
    if (key === "chapter") {
      // a new chapter clears the seat and every model constraint
      for (const other of [...next.keys()]) {
        if (other !== "chapter") next.delete(other);
      }
    }
    setParams(next, { replace: true });
  };

  const watchLink = (game: LibraryGame) =>
    `/craft/play/${game.id}${seat ? `?seat=${seat}` : ""}`;

  const random = () => {
    const pool = chapter ? matches : craftLibrary;
    const picked = pickRandom(
      pool,
      `${chapter}:${seat}:${JSON.stringify(opponents)}:${nonce}`,
    );
    setNonce((value) => value + 1);
    if (picked) void navigate(watchLink(picked));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}Play
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Watch a game
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Choose a chapter, a seat to follow, and the models on the other seats,
          or take a game at random. The game is a recording: it plays back turn
          by turn from the seat's vantage, the way the model saw it.
        </p>
      </header>

      <section className="mt-10 space-y-6" aria-label="Choose">
        <div>
          <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            Chapter
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => set("chapter", scenario.id)}
                className={chip(scenario.id === chapter)}
              >
                {scenario.title}
              </button>
            ))}
          </div>
        </div>

        {chapter && seats.length > 0 && (
          <div>
            <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
              Follow the seat
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {seats.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => set("seat", candidate.id)}
                  className={chip(candidate.id === seat)}
                >
                  {candidate.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {chapter &&
          seat &&
          seats
            .filter((candidate) => candidate.id !== seat)
            .map((candidate) => (
              <div key={candidate.id}>
                <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                  {candidate.name} played by
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(modelsBySeat.get(candidate.id) ?? []).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => set(candidate.id, model)}
                      className={chip(params.get(candidate.id) === model)}
                    >
                      {shortModel(model)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => set(candidate.id, "")}
                    className={chip(!params.get(candidate.id))}
                  >
                    any
                  </button>
                </div>
              </div>
            ))}
      </section>

      <section className="mt-12" aria-label="Games">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            {chapter
              ? `${matches.length} matching ${matches.length === 1 ? "game" : "games"}`
              : `${craftLibrary.length} games in the library`}
          </h2>
          <button
            type="button"
            onClick={random}
            disabled={(chapter ? matches : craftLibrary).length === 0}
            className="cursor-pointer rounded-sm border border-brand-terminal/40 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-brand-terminal uppercase hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ▶ one at random
          </button>
        </div>
        {!loaded && (
          <p className="mt-3 font-plex-mono text-xs text-zinc-600">loading…</p>
        )}
        {loaded && chapter && matches.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            No recorded game matches this configuration yet. Loosen a
            constraint, or play the combination with the CLI:{" "}
            <code className="font-plex-mono text-xs text-zinc-300">
              game-run --scenario {chapter} --matrix …
            </code>
          </p>
        )}
        {loaded && !chapter && craftLibrary.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            The library is empty. Games land here when a study or a matrix run
            plays a chapter.
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {(chapter ? matches : craftLibrary).slice(0, 40).map((game) => (
            <li key={game.id}>
              <Link
                to={watchLink(game)}
                className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border border-white/10 bg-white/[0.02] px-3 py-2 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
              >
                <span className="font-plex-mono text-[10px] text-zinc-600">
                  {game.id}
                </span>
                {!chapter && (
                  <span className="font-plex-mono text-[10px] text-zinc-500">
                    {game.scenario}
                  </span>
                )}
                {Object.entries(game.roster).map(([id, model]) => (
                  <span
                    key={id}
                    className={clsx(
                      "font-plex-mono text-xs",
                      id === seat ? "text-brand-terminal" : "text-zinc-400",
                    )}
                  >
                    {id}={shortModel(model)}
                  </span>
                ))}
                <span className="ml-auto font-plex-mono text-[10px] text-zinc-600">
                  {game.createdAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
