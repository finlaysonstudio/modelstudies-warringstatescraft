import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusChip } from "../components/chips";
import type { StudyIndexEntry } from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; studies: StudyIndexEntry[] };

// Studies index: every planned study with its arm progress and report kind.
export function StudiesIndex() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/studies.json");
        if (!res.ok) throw new Error(`index responded ${res.status}`);
        const studies = (await res.json()) as StudyIndexEntry[];
        if (!cancelled) setState({ phase: "ready", studies });
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
          Studies
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-zinc-400">
          Replicated games across cells and models, each with the report its
          scenarios define. Plan one with{" "}
          <code className="font-plex-mono text-xs text-zinc-300">
            cli study-run
          </code>
          .
        </p>
      </header>

      <section className="mt-12" aria-label="Studies">
        {state.phase === "loading" && (
          <p className="font-plex-mono text-xs text-zinc-600">loading…</p>
        )}
        {state.phase === "error" && (
          <p className="font-plex-mono text-xs text-red-400">
            failed to load studies — {state.message}
          </p>
        )}
        {state.phase === "ready" && state.studies.length === 0 && (
          <p className="text-sm text-zinc-400">
            No studies yet. Study files land at var/studies/*.json.
          </p>
        )}
        {state.phase === "ready" && state.studies.length > 0 && (
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {state.studies.map((study) => (
              <li key={study.id}>
                <Link
                  to={`/studies/${study.id}`}
                  className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-6 py-4 hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-plex-mono text-xs text-zinc-500">
                        {study.id}
                      </span>
                      <StatusChip status={study.status} />
                      <span className="rounded-sm border border-white/10 px-1.5 py-0.5 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase">
                        {study.report}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-200">
                      {study.title}
                    </p>
                    <p className="mt-1 font-plex-mono text-[11px] text-zinc-500">
                      {study.scenarios.length} cells · {study.models.join(", ")}{" "}
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
