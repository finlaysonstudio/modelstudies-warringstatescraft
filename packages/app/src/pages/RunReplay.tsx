import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CAMPAIGNS, campaignOf } from "../campaigns";
import { LaneChip, StatusChip } from "../components/chips";
import { Bar } from "../components/PonyBenchPrimitives";
import { AdjudicationBlock } from "../components/replay/AdjudicationBlock";
import { BriefCard } from "../components/replay/BriefCard";
import { DebriefBlock } from "../components/replay/DebriefBlock";
import { EscalationOverview } from "../components/replay/EscalationOverview";
import { ScorecardSection } from "../components/ScorecardSection";
import { UsageSection } from "../components/UsageSection";
import { useCampaign } from "../lib/useCampaign";
import { usageOfRuns } from "../lib/usage";
import {
  HUMAN_MODEL,
  type Run,
  type RunIndexEntry,
  type TurnRecord,
} from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; run: Run; index: RunIndexEntry[]; branches: Run[] };

// Replay: one run, turn by turn — inject, decision briefs per seat,
// adjudication, then debriefs. Branch links point up (parent timeline) and
// down (child runs forked at this run's decision point). The route carries
// the campaign; a run reached under the wrong campaign redirects to its own.
export function RunReplay() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    setState({ phase: "loading" });
    (async () => {
      try {
        const [runRes, indexRes] = await Promise.all([
          fetch(`/data/runs/${encodeURIComponent(id)}.json`),
          fetch("/data/runs.json"),
        ]);
        if (!runRes.ok) {
          throw new Error(`run responded ${runRes.status}`);
        }
        const run = (await runRes.json()) as Run;
        const index = indexRes.ok
          ? ((await indexRes.json()) as RunIndexEntry[])
          : [];
        // the branches under this run, for the tree's cost; a missing one
        // is left out rather than failing the page
        const branches = (
          await Promise.all(
            (run.children ?? []).map(async (childId) => {
              try {
                const res = await fetch(
                  `/data/runs/${encodeURIComponent(childId)}.json`,
                );
                return res.ok ? ((await res.json()) as Run) : null;
              } catch {
                return null;
              }
            }),
          )
        ).filter((branch): branch is Run => branch !== null);
        if (!cancelled) {
          setState({ phase: "ready", run, index, branches });
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
  }, [id]);

  if (state.phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
        <p className="font-plex-mono text-xs text-zinc-600">loading…</p>
      </div>
    );
  }
  if (state.phase === "error") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
        <p className="font-plex-mono text-xs text-red-400">
          failed to load run — {state.message}
        </p>
      </div>
    );
  }
  return (
    <ReplayBody run={state.run} index={state.index} branches={state.branches} />
  );
}

function ReplayBody({
  run,
  index,
  branches,
}: {
  run: Run;
  index: RunIndexEntry[];
  branches: Run[];
}) {
  const routeCampaign = useCampaign();
  const campaign = campaignOf(run.scenario);
  if (routeCampaign && routeCampaign.id !== campaign) {
    return <Navigate to={`/${campaign}/replays/${run.id}`} replace />;
  }
  const base = `/${campaign}`;

  const turns = run.turns ?? [];
  const usage = usageOfRuns([run, ...branches]);
  const latest = turns.length > 0 ? turns[turns.length - 1].index : -1;
  const children = (run.children ?? []).map(
    (childId) => index.find((entry) => entry.id === childId) ?? childId,
  );
  const adjudicated = turns.filter((turn) => turn.adjudication);
  const watchable =
    campaign === "craft" &&
    run.status === "complete" &&
    turns.length > 0 &&
    !Object.values(run.roster ?? {}).includes(HUMAN_MODEL);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to={base} className="hover:text-white">
            {CAMPAIGNS[campaign].title}
          </Link>
          {run.study && (
            <>
              {" › "}
              <Link
                to={`${base}/studies/${run.study}`}
                className="hover:text-white"
              >
                {run.study}
              </Link>
            </>
          )}
          {" › "}Replay · {run.id}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {run.scenarioTitle || run.scenario}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {Object.entries(run.roster ?? {}).map(([seat, model]) => (
            <span key={seat} className="font-plex-mono text-xs text-zinc-500">
              {seat} → <span className="text-zinc-400">{model}</span>
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LaneChip lane={run.branch?.lane ?? "root"} />
          <StatusChip status={run.status} />
          {run.statusDetail && (
            <span className="font-plex-mono text-[10px] text-zinc-500">
              {run.statusDetail}
            </span>
          )}
          {[
            run.language && `language ${run.language}`,
            run.naming && `names ${run.naming}`,
            run.pivot && `pivot ${run.pivot}`,
          ]
            .filter((label): label is string => Boolean(label))
            .map((label) => (
              <span
                key={label}
                className="rounded-sm border border-white/10 px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase"
              >
                {label}
              </span>
            ))}
          {run.branch?.parent && (
            <Link
              to={`${base}/replays/${run.branch.parent}`}
              className="cursor-pointer rounded-sm border border-white/10 bg-white/[0.03] px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
            >
              ↩ parent timeline
            </Link>
          )}
          {watchable && (
            <Link
              to={`/craft/play/${run.id}`}
              className="cursor-pointer rounded-sm border border-brand-terminal/40 px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-brand-terminal uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
            >
              ▶ watch this game
            </Link>
          )}
        </div>
        {run.matrix && campaign === "craft" && (
          <Link
            to={`/craft/replays/${run.id}/matrix`}
            className="mt-3 inline-block cursor-pointer rounded-sm border border-amber-400/40 px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-amber-300 uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
          >
            ⊞ matrix view
          </Link>
        )}
        {run.matrix && (
          <p className="mt-2 font-plex-mono text-[10px] text-zinc-600">
            forked at start ·{" "}
            {Object.entries(run.matrix)
              .map(([seat, models]) => `${seat}: ${models.join(" | ")}`)
              .join(" · ")}
          </p>
        )}
        {run.branch?.point && (
          <p className="mt-2 font-plex-mono text-[10px] text-zinc-600">
            forked at turn {run.branch.point.turn} · seat{" "}
            {run.branch.point.seat}
            {run.branch.decidedBy
              ? ` · decided by ${run.branch.decidedBy}`
              : ""}
          </p>
        )}
      </header>

      {children.length > 0 && (
        <section
          className="animate-rise mt-10 motion-reduce:animate-none"
          style={{ animationDelay: "60ms" }}
          aria-label="Branches"
        >
          <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Branches
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {children.map((child) =>
              typeof child === "string" ? (
                <Link
                  key={child}
                  to={`${base}/replays/${child}`}
                  className="cursor-pointer rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  {child}
                </Link>
              ) : (
                <Link
                  key={child.id}
                  to={`${base}/replays/${child.id}`}
                  className={clsx(
                    "flex cursor-pointer items-center gap-x-2 rounded-sm border px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                    child.branch.lane === "consensus"
                      ? "border-brand-terminal/40 text-brand-terminal"
                      : child.branch.lane === "independent"
                        ? "border-sky-400/40 text-sky-400"
                        : child.branch.lane === "matrix"
                          ? "border-amber-400/40 text-amber-300"
                          : "border-white/10 bg-white/[0.03] text-zinc-400",
                  )}
                >
                  <span>{child.branch.lane}</span>
                  {child.branch.decidedBy && (
                    <span className="text-zinc-500 normal-case">
                      {child.branch.decidedBy}
                    </span>
                  )}
                  {child.branch.lane === "matrix" && (
                    <span className="text-zinc-500 normal-case">
                      {Object.entries(child.roster ?? {})
                        .map(
                          ([seat, model]) =>
                            `${seat}=${model.split("/").pop() ?? model}`,
                        )
                        .join(" ")}
                    </span>
                  )}
                </Link>
              ),
            )}
          </div>
        </section>
      )}

      <UsageSection
        total={usage.total}
        rows={usage.rows}
        note={
          branches.length
            ? `this run and its ${branches.length} branch${
                branches.length === 1 ? "" : "es"
              }, each call counted once`
            : run.branch?.point
              ? "this branch's own calls; turns inherited from the parent are counted there"
              : "this run's calls"
        }
        delay={90}
      />

      {children.length > 0 && <ScorecardSection runId={run.id} />}

      {adjudicated.length >= 2 && (
        <EscalationOverview turns={adjudicated} ladder={run.escalationLadder} />
      )}

      <div className="mt-10 space-y-6">
        {turns.map((turn, position) => (
          <TurnBlock
            key={turn.index}
            turn={turn}
            ladder={run.escalationLadder}
            defaultOpen={turn.index === latest}
            delay={Math.min(position + 2, 12) * 60}
          />
        ))}
        {turns.length === 0 && (
          <p className="text-sm text-zinc-400">No turns recorded yet.</p>
        )}
      </div>

      {(run.debriefs ?? []).length > 0 && (
        <section className="mt-12" aria-label="Debriefs">
          <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Debriefs
          </p>
          <div className="mt-3 space-y-3">
            {run.debriefs.map((debrief) => (
              <DebriefBlock key={debrief.seat} debrief={debrief} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Turns

function TurnBlock({
  turn,
  ladder,
  defaultOpen,
  delay,
}: {
  turn: TurnRecord;
  ladder?: string[];
  defaultOpen: boolean;
  delay: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className="animate-rise rounded-sm border border-white/10 bg-black/20 motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Turn ${turn.index}`}
    >
      <Bar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label={`Turn ${turn.index} — ${turn.title}`}
        detail={
          turn.adjudication ? `esc ${turn.adjudication.escalation}` : undefined
        }
      />
      {open && (
        <div className="border-t border-white/5">
          <div className="px-4 py-4">
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
              {turn.inject}
            </p>
          </div>
          {(turn.briefs ?? []).length > 0 && (
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* At a fork turn one seat carries several memos: key by lane too. */}
              {turn.briefs.map((brief) => (
                <BriefCard
                  key={`${brief.seat}:${brief.model}:${brief.consensus ? "consensus" : "independent"}`}
                  brief={brief}
                />
              ))}
            </div>
          )}
          {turn.adjudication && (
            <AdjudicationBlock
              adjudication={turn.adjudication}
              ladder={ladder}
            />
          )}
        </div>
      )}
    </section>
  );
}
