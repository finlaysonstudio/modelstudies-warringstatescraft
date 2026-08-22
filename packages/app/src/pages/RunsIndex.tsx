import clsx from "clsx";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LaneChip, StatusChip } from "../components/chips";
import type { RunIndexEntry } from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; runs: RunIndexEntry[] };

// Runs index: root timelines first, each followed by its branches indented
// beneath it. Branches whose parent is not in the index fall into a trailing
// detached group.
export function RunsIndex() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [scenario, setScenario] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/runs.json");
        if (!res.ok) {
          throw new Error(`index responded ${res.status}`);
        }
        const runs = (await res.json()) as RunIndexEntry[];
        if (!cancelled) {
          setState({ phase: "ready", runs });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            phase: "error",
            message: error instanceof Error ? error.message : "fetch failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Warring States Bench
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Replays
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-zinc-400">
          Turn-by-turn replays of multi-model war-game runs: decision briefs,
          adjudication, and the branches each fork produced.
        </p>
      </header>

      {state.phase === "ready" && state.runs.length > 0 && (
        <ScenarioFilter
          runs={state.runs}
          value={scenario}
          onChange={setScenario}
        />
      )}

      <section className="mt-12" aria-label="Runs">
        {state.phase === "loading" && (
          <p className="font-plex-mono text-xs text-zinc-600">loading…</p>
        )}
        {state.phase === "error" && (
          <p className="font-plex-mono text-xs text-red-400">
            failed to load runs — {state.message}
          </p>
        )}
        {state.phase === "ready" && state.runs.length === 0 && (
          <p className="text-sm text-zinc-400">
            No runs yet. Run files land at var/runs/*.json.
          </p>
        )}
        {state.phase === "ready" && state.runs.length > 0 && (
          <RunList
            runs={state.runs.filter(
              (run) => !scenario || run.scenario === scenario,
            )}
          />
        )}
      </section>
    </div>
  );
}

// One chip per scenario with at least one run; empty value shows everything.
function ScenarioFilter({
  runs,
  value,
  onChange,
}: {
  runs: RunIndexEntry[];
  value: string;
  onChange: (scenario: string) => void;
}) {
  const scenarios = new Map<string, { title: string; count: number }>();
  for (const run of runs) {
    const entry = scenarios.get(run.scenario) ?? {
      title: run.scenarioTitle || run.scenario,
      count: 0,
    };
    entry.count += 1;
    scenarios.set(run.scenario, entry);
  }
  const chip = (active: boolean) =>
    clsx(
      "cursor-pointer rounded-sm border px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
      active
        ? "border-brand-terminal/40 text-brand-terminal"
        : "border-white/10 text-zinc-500 hover:text-zinc-200",
    );
  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={chip(value === "")}
      >
        all scenarios
      </button>
      {[...scenarios.entries()].map(([id, entry]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={chip(value === id)}
        >
          {entry.title}
          <span className="ml-1.5 text-zinc-600">{entry.count}</span>
        </button>
      ))}
    </div>
  );
}

function RunList({ runs }: { runs: RunIndexEntry[] }) {
  const byCreated = (a: RunIndexEntry, b: RunIndexEntry) =>
    a.createdAt.localeCompare(b.createdAt);
  const roots = runs
    .filter((run) => run.branch.parent === null)
    .sort(byCreated);
  const rootIds = new Set(roots.map((run) => run.id));
  const branches = runs.filter((run) => run.branch.parent !== null);
  const detached = branches
    .filter((run) => !rootIds.has(run.branch.parent ?? ""))
    .sort(byCreated);

  let index = 0;
  const rows: { run: RunIndexEntry; indent: boolean; index: number }[] = [];
  for (const root of roots) {
    rows.push({ run: root, indent: false, index: index++ });
    for (const child of branches
      .filter((run) => run.branch.parent === root.id)
      .sort(byCreated)) {
      rows.push({ run: child, indent: true, index: index++ });
    }
  }

  return (
    <>
      <ul className="border-t border-white/10">
        {rows.map((row) => (
          <RunRow key={row.run.id} {...row} />
        ))}
      </ul>
      {detached.length > 0 && (
        <>
          <p className="mt-10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            Detached branches
          </p>
          <ul className="mt-2 border-t border-white/10">
            {detached.map((run) => (
              <RunRow key={run.id} run={run} indent={false} index={index++} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function initials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");
}

function RunRow({
  run,
  indent,
  index,
}: {
  run: RunIndexEntry;
  indent: boolean;
  index: number;
}) {
  return (
    <li
      className="animate-rise border-b border-white/10 motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
    >
      <Link
        to={`/runs/${run.id}`}
        className={
          "flex cursor-pointer items-center gap-x-4 py-4 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal" +
          (indent ? " pl-8 sm:pl-12" : "")
        }
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-white/5 font-plex-mono text-sm text-zinc-400 uppercase"
        >
          {initials(run.scenarioTitle)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {run.scenarioTitle || run.id}
          </span>
          <span className="block truncate font-plex-mono text-xs text-zinc-500">
            {run.id}
            {run.createdAt ? ` · ${run.createdAt.slice(0, 10)}` : ""}
          </span>
        </span>
        <LaneChip lane={run.branch.lane} />
        {run.branch.decidedBy && (
          <span className="hidden truncate font-plex-mono text-xs text-zinc-500 sm:block">
            {run.branch.decidedBy}
          </span>
        )}
        {run.branch.lane === "matrix" && (
          <span className="hidden max-w-xs truncate font-plex-mono text-[10px] text-zinc-500 lg:block">
            {Object.entries(run.roster ?? {})
              .map(([seat, model]) => `${seat}=${model.split("/").pop()}`)
              .join(" ")}
          </span>
        )}
        <StatusChip status={run.status} />
        <span className="hidden font-plex-mono text-xs text-zinc-500 sm:block">
          {run.turnCount} {run.turnCount === 1 ? "turn" : "turns"}
        </span>
      </Link>
    </li>
  );
}
