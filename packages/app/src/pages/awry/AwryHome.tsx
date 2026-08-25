import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusChip } from "../../components/chips";
import { CAMPAIGNS } from "../../campaigns";
import { libraryOf, type LibraryGame } from "../../lib/library";
import type {
  LamparthReport,
  Report,
  RunIndexEntry,
  StudyIndexEntry,
} from "../../lib/types";
import { Summary } from "./Summary";

interface Loaded {
  library: LibraryGame[];
  studies: StudyIndexEntry[];
  /** the newest complete study's report, for the written summary */
  report: LamparthReport | null;
}

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | ({ phase: "ready" } & Loaded);

// AI Gone Awry 2026: the Lamparth et al. 2024 replication. A written summary
// with every number read from the study's report, the eight treatment cells
// as a grid, then the studies.
export function AwryHome() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [runsRes, studiesRes] = await Promise.all([
          fetch("/data/runs.json"),
          fetch("/data/studies.json"),
        ]);
        const runs = runsRes.ok
          ? ((await runsRes.json()) as RunIndexEntry[])
          : [];
        const allStudies = studiesRes.ok
          ? ((await studiesRes.json()) as StudyIndexEntry[])
          : [];
        const studies = allStudies.filter((study) =>
          study.scenarios.some((id) => CAMPAIGNS.awry.scenarios({ id })),
        );
        let report: LamparthReport | null = null;
        // The campaign summary is the largest complete study, not the newest:
        // a side study (an elicitation control, a single-cell probe) must not
        // displace the replication just by being played later.
        const principal = [...studies]
          .filter((study) => study.status === "complete")
          .sort(
            (a, b) =>
              b.completeCount - a.completeCount ||
              b.createdAt.localeCompare(a.createdAt),
          )[0];
        if (principal) {
          try {
            const res = await fetch(`/data/reports/${principal.id}.json`);
            if (res.ok) {
              const loaded = (await res.json()) as Report;
              if (loaded.report === "lamparth") report = loaded;
            }
          } catch {
            // the page stands without the report
          }
        }
        if (!cancelled) {
          setState({
            phase: "ready",
            library: libraryOf(runs).filter((game) =>
              CAMPAIGNS.awry.scenarios({ id: game.scenario }),
            ),
            studies,
            report,
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

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Campaign
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          AI Gone Awry 2026
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          {CAMPAIGNS.awry.blurb}
        </p>
      </header>

      <Summary report={state.report} />

      <CellGrid library={state.library} />

      <section className="mt-14" aria-label="Studies">
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Studies
        </h2>
        {state.studies.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">No studies yet.</p>
        )}
        {state.studies.length > 0 && (
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {state.studies.map((study) => (
              <li key={study.id}>
                <Link
                  to={`/awry/studies/${study.id}`}
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
                      {study.scenarios.length} cells × {study.models.join(", ")}{" "}
                      · k={study.replicates}
                    </p>
                  </div>
                  <div className="text-right font-plex-mono text-xs text-zinc-400">
                    <span className="text-zinc-200">{study.completeCount}</span>
                    /{study.armCount} arms
                    {study.errorCount > 0 && (
                      <span className="ml-2 text-red-400">
                        {study.errorCount} failed
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const ACCURACIES = ["acc70", "acc95"] as const;
const TRAININGS = ["basic", "significant"] as const;
const POSTURES = ["revisionist", "statusquo"] as const;

const CELL_LABEL: Record<string, string> = {
  acc70: "AI accuracy 70–85%",
  acc95: "AI accuracy 95–99%",
  basic: "basic training",
  significant: "significant training",
  revisionist: "revisionist",
  statusquo: "status quo",
};

// The eight cells as accuracy × training × posture, each with its games.
function CellGrid({ library }: { library: LibraryGame[] }) {
  const count = (accuracy: string, training: string, posture: string) =>
    library.filter(
      (game) =>
        game.scenario === `lamparth-2024-${accuracy}-${training}-${posture}`,
    ).length;
  return (
    <section className="mt-14" aria-label="Treatment cells">
      <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        The eight cells
      </h2>
      <p className="mt-2 max-w-2xl text-xs text-zinc-500">
        AI accuracy × crew training × PRC posture. Each count is the complete
        games on that cell across every study and model.
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {ACCURACIES.map((accuracy) => (
          <div
            key={accuracy}
            className="rounded-sm border border-white/10 bg-black/20 p-4"
          >
            <p className="font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase">
              {CELL_LABEL[accuracy]}
            </p>
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                  <th className="py-1.5 pr-3 font-normal">training</th>
                  {POSTURES.map((posture) => (
                    <th key={posture} className="py-1.5 pr-3 font-normal">
                      {CELL_LABEL[posture]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRAININGS.map((training) => (
                  <tr key={training} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-xs text-zinc-400">
                      {CELL_LABEL[training]}
                    </td>
                    {POSTURES.map((posture) => (
                      <td
                        key={posture}
                        className="py-2 pr-3 font-plex-mono text-xs text-zinc-200"
                      >
                        {count(accuracy, training, posture)}
                        <span className="ml-1 text-zinc-600">games</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
