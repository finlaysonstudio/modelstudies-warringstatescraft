import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusChip } from "../../components/chips";
import { LivePlayNotice } from "../../components/LivePlayNotice";
import { libraryOf, type LibraryGame } from "../../lib/library";
import { CAMPAIGNS } from "../../campaigns";
import { formatUsd } from "../../lib/usage";
import type {
  BasicReport,
  Report,
  RunIndexEntry,
  ScenarioIndexEntry,
  StudyIndexEntry,
} from "../../lib/types";

interface ValuesSummaryRow {
  model: string;
  share: number | null;
}

interface Loaded {
  scenarios: ScenarioIndexEntry[];
  library: LibraryGame[];
  studies: StudyIndexEntry[];
  /** studyId → its report, for cost and chronicle headlines */
  reports: Record<string, Report>;
  values: { title: string; rows: ValuesSummaryRow[] } | null;
}

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | ({ phase: "ready" } & Loaded);

// minimal slice of the values scorecard needed for the survey card
interface ValuesScorecardFile {
  title: string;
  bankItems?: number;
  models: {
    model: string;
    arm?: string;
    items?: number;
    overall: { positiveShare: number | null; answered: number };
  }[];
}

interface ScorecardIndexEntry {
  id: string;
  kind?: string;
  createdAt: string;
}

// The Craft front page: the chronicle first, then the saga's studies, the
// Model Values Survey, and the way into watching a game.
export function CraftHome() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [scenariosRes, runsRes, studiesRes, scorecardsRes] =
          await Promise.all([
            fetch("/data/scenarios.json"),
            fetch("/data/runs.json"),
            fetch("/data/studies.json"),
            fetch("/data/scorecards.json"),
          ]);
        const scenarios = scenariosRes.ok
          ? ((await scenariosRes.json()) as ScenarioIndexEntry[])
          : [];
        const runs = runsRes.ok
          ? ((await runsRes.json()) as RunIndexEntry[])
          : [];
        const allStudies = studiesRes.ok
          ? ((await studiesRes.json()) as StudyIndexEntry[])
          : [];
        const studies = allStudies.filter((study) =>
          study.scenarios.every((id) => CAMPAIGNS.craft.scenarios({ id })),
        );
        const reports: Record<string, Report> = {};
        await Promise.all(
          studies.map(async (study) => {
            try {
              const res = await fetch(`/data/reports/${study.id}.json`);
              if (res.ok) reports[study.id] = (await res.json()) as Report;
            } catch {
              // a study without a report renders without one
            }
          }),
        );
        let values: Loaded["values"] = null;
        try {
          const entries = scorecardsRes.ok
            ? ((await scorecardsRes.json()) as ScorecardIndexEntry[])
            : [];
          const latest = entries
            .filter((entry) => (entry.kind ?? "values") === "values")
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          if (latest) {
            const res = await fetch(`/data/scorecards/${latest.id}.json`);
            if (res.ok) {
              const card = (await res.json()) as ValuesScorecardFile;
              const byModel = new Map<string, ValuesSummaryRow>();
              for (const row of card.models) {
                if (row.arm) continue;
                const battery = card.bankItems
                  ? row.items === card.bankItems
                  : true;
                if (battery || !byModel.has(row.model)) {
                  byModel.set(row.model, {
                    model: row.model,
                    share: row.overall.positiveShare,
                  });
                }
              }
              values = { title: card.title, rows: [...byModel.values()] };
            }
          }
        } catch {
          // survey card renders without shares
        }
        if (!cancelled) {
          setState({
            phase: "ready",
            scenarios: scenarios.filter((entry) =>
              CAMPAIGNS.craft.scenarios(entry),
            ),
            library: libraryOf(runs).filter((game) =>
              CAMPAIGNS.craft.scenarios({ id: game.scenario }),
            ),
            studies,
            reports,
            values,
          });
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

  if (state.phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 sm:px-16">
        <p className="font-plex-mono text-xs text-zinc-600">loading…</p>
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 sm:px-16">
        <p className="font-plex-mono text-xs text-red-400">
          failed to load: {state.message}
        </p>
      </div>
    );
  }

  const chapters = state.scenarios
    .filter((entry) => entry.chapter)
    .sort((a, b) => (a.chapter?.order ?? 0) - (b.chapter?.order ?? 0));
  const headlines = chronicleHeadlines(state.studies, state.reports);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Campaign
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Warring States Craft
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          One Warring States world told in thirteen chapters, each written in
          English and in Chinese and rendered under chronicle or invented names.
          Every chapter opens in a situation the sources record and departs from
          it at one decision point; a judge panel scores every turn on the
          chapter's own escalation ladder. The two language bodies are written
          to the same structure, not translated, and the specs check shape
          rather than meaning, a documented limitation of the whole instrument.
        </p>
      </header>

      <section
        id="chronicle"
        className="mt-14 scroll-mt-8"
        aria-label="Chronicle"
      >
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Chronicle
        </h2>
        <ul className="mt-3 border-t border-white/10">
          {chapters.map((entry) => (
            <ChronicleRow
              key={entry.id}
              entry={entry}
              library={state.library}
              headline={headlines.get(entry.id)}
            />
          ))}
        </ul>
      </section>

      <section id="studies" className="mt-14 scroll-mt-8" aria-label="Studies">
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Studies
        </h2>
        {state.studies.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            No studies on the saga yet. Plan one with{" "}
            <code className="font-plex-mono text-xs text-zinc-300">
              cli study-run
            </code>
            .
          </p>
        )}
        {state.studies.length > 0 && (
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {state.studies.map((study) => (
              <li key={study.id}>
                <Link
                  to={`/craft/studies/${study.id}`}
                  className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-6 py-4 hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-plex-mono text-xs text-zinc-500">
                        {study.id}
                      </span>
                      <StatusChip status={study.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-200">
                      {study.title}
                    </p>
                    <p className="mt-1 font-plex-mono text-[11px] text-zinc-500">
                      {study.scenarios.length} scenarios × {study.models.length}{" "}
                      models × k={study.replicates}
                      {state.reports[study.id]?.usage
                        ? ` · ${formatUsd(state.reports[study.id].usage!.total.usd)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right font-plex-mono text-xs text-zinc-400">
                    <span className="text-zinc-200">{study.completeCount}</span>
                    /{study.armCount} arms
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <section
          id="survey"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Survey"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Model Values Survey
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Each model sits a forced-choice crisis battery with explanation
            probes; a cell is its share of answers on the construct-positive
            pole. The overall share per model, from the latest scorecard:
          </p>
          {state.values && state.values.rows.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {state.values.rows.map((row) => (
                <li
                  key={row.model}
                  className="flex items-baseline justify-between font-plex-mono text-xs"
                >
                  <span className="truncate text-zinc-300">
                    {row.model.split("/").pop()}
                  </span>
                  <span className="text-zinc-400">
                    {row.share === null
                      ? "—"
                      : `${Math.round(row.share * 100)}%`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-plex-mono text-xs text-zinc-600">
              no scorecard on record yet
            </p>
          )}
          <Link
            to="/craft/survey"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            open the survey →
          </Link>
        </section>

        <section
          id="play"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Play"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Play
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a chapter, a seat to follow, and the opposing models, or take
            a game at random, and watch the recorded game turn by turn from that
            seat's vantage.
          </p>
          <p className="mt-3 font-plex-mono text-xs text-zinc-400">
            <span className="text-white">{state.library.length}</span> games in
            the library
          </p>
          <Link
            to="/craft/play"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            choose a game →
          </Link>
          <LivePlayNotice className="mt-4" />
        </section>

        <section
          id="map"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Map"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Map
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The whole overworld of the chronicle on one pannable, zoomable
            stage: every court, pass, ford, and work a chapter names, with a
            control panel that choreographs any move from the stage's closed
            vocabulary — an envoy court to court, a column to the pass, a fleet
            along the coast.
          </p>
          <Link
            to="/craft/map"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            open the map →
          </Link>
        </section>

        <section
          id="tiles"
          className="scroll-mt-8 rounded-sm border border-white/10 bg-black/20 p-5"
          aria-label="Tiles"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Tiles
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The art the overworld is drawn from, generated for this project one
            prompt at a time: every biome autotiled on the patch that shows its
            transitions, every marker and figure on the ground it stands on, and
            beside each one the prompt it came from and what the build did to
            the reply.
          </p>
          <Link
            to="/craft/tiles"
            className="mt-4 inline-block cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            see the tiles →
          </Link>
        </section>
      </div>
    </div>
  );
}

/** chapter id → peak escalation per model, from the newest complete basic report covering it */
function chronicleHeadlines(
  studies: StudyIndexEntry[],
  reports: Record<string, Report>,
): Map<string, { model: string; peak: number }[]> {
  const headlines = new Map<string, { model: string; peak: number }[]>();
  const ordered = [...studies]
    .filter((study) => study.status === "complete" && study.report === "basic")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const study of ordered) {
    const report = reports[study.id];
    if (!report || report.report !== "basic") continue;
    const basic = report as BasicReport;
    for (const scenario of report.scenarios) {
      if (headlines.has(scenario)) continue;
      const rows = basic.cells
        .filter((cell) => cell.scenario === scenario)
        .map((cell) => ({ model: cell.model, peak: cell.peak.value }));
      if (rows.length > 0) headlines.set(scenario, rows);
    }
  }
  return headlines;
}

function ChronicleRow({
  entry,
  library,
  headline,
}: {
  entry: ScenarioIndexEntry;
  library: LibraryGame[];
  headline?: { model: string; peak: number }[];
}) {
  const games = library.filter((game) => game.scenario === entry.id);
  const fork = entry.decisionPoints?.[0];
  const forkSeat = fork
    ? (entry.seats?.find((seat) => seat.id === fork.seat)?.name ?? fork.seat)
    : null;
  return (
    <li className="border-b border-white/10">
      <Link
        to={`/craft/chapters/${entry.id}`}
        className="flex cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
      >
        <span className="w-16 shrink-0 font-plex-mono text-xs text-zinc-500">
          {entry.chapter?.order === 0
            ? "prologue"
            : `ch. ${entry.chapter?.order}`}
        </span>
        <span className="min-w-0 sm:w-56">
          <span className="block truncate text-sm font-medium text-white">
            {entry.title}
          </span>
          <span className="block font-plex-mono text-[10px] text-zinc-600">
            {entry.chapter?.date}
            {forkSeat ? ` · forks at turn ${fork!.turn} (${forkSeat})` : ""}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">
          {entry.simulates.split(":")[0]}
        </span>
        {headline ? (
          <span className="flex flex-wrap gap-x-3 font-plex-mono text-[10px] text-zinc-400">
            {headline.map((row) => (
              <span key={row.model}>
                {row.model.split("/").pop()}{" "}
                <span className="text-brand-terminal">
                  peak {row.peak.toFixed(1)}
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="font-plex-mono text-[10px] text-zinc-600">
            not yet played
          </span>
        )}
        <span className="w-20 text-right font-plex-mono text-[10px] text-zinc-500">
          {games.length} {games.length === 1 ? "game" : "games"}
        </span>
      </Link>
    </li>
  );
}
