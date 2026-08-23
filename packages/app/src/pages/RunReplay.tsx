import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LaneChip, StatusChip } from "../components/chips";
import { Bar, Section } from "../components/PonyBenchPrimitives";
import { ScorecardSection } from "../components/ScorecardSection";
import type {
  DecisionBrief,
  Run,
  RunIndexEntry,
  TurnAdjudication,
  TurnRecord,
} from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; run: Run; index: RunIndexEntry[] };

// Replay: one run, turn by turn — inject, decision briefs per seat,
// adjudication, then debriefs. Branch links point up (parent timeline) and
// down (child runs forked at this run's decision point).
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
        if (!cancelled) {
          setState({ phase: "ready", run, index });
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
  return <ReplayBody run={state.run} index={state.index} />;
}

function ReplayBody({ run, index }: { run: Run; index: RunIndexEntry[] }) {
  const turns = run.turns ?? [];
  const latest = turns.length > 0 ? turns[turns.length - 1].index : -1;
  const children = (run.children ?? []).map(
    (childId) => index.find((entry) => entry.id === childId) ?? childId,
  );
  const adjudicated = turns.filter((turn) => turn.adjudication);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Replay · {run.id}
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
          {run.branch?.parent && (
            <Link
              to={`/runs/${run.branch.parent}`}
              className="cursor-pointer rounded-sm border border-white/10 bg-white/[0.03] px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
            >
              ↩ parent timeline
            </Link>
          )}
        </div>
        {run.matrix && (
          <Link
            to={`/runs/${run.id}/matrix`}
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
                  to={`/runs/${child}`}
                  className="cursor-pointer rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  {child}
                </Link>
              ) : (
                <Link
                  key={child.id}
                  to={`/runs/${child.id}`}
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
// Escalation

function EscalationOverview({
  turns,
  ladder,
}: {
  turns: TurnRecord[];
  ladder?: string[];
}) {
  const levels = turns.map((turn) => turn.adjudication?.escalation ?? 0);
  const maxLevel = Math.max(ladder ? ladder.length - 1 : 0, ...levels, 1);
  return (
    <section
      className="animate-rise mt-10 motion-reduce:animate-none"
      style={{ animationDelay: "120ms" }}
      aria-label="Escalation overview"
    >
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Escalation
      </p>
      <div className="mt-3 flex items-end gap-x-3">
        {turns.map((turn) => {
          const level = turn.adjudication?.escalation ?? 0;
          return (
            <div
              key={turn.index}
              className="flex flex-col items-center gap-y-1"
            >
              <span
                className="size-4 rounded-[2px] bg-brand-terminal"
                style={{ opacity: Math.max(level / maxLevel, 0.12) }}
                title={
                  ladder?.[level]
                    ? `T${turn.index} · ${ladder[level]}`
                    : `T${turn.index} · escalation ${level}`
                }
              />
              <span className="font-plex-mono text-[10px] text-zinc-600">
                T{turn.index}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LadderStrip({
  escalation,
  ladder,
}: {
  escalation: number;
  ladder?: string[];
}) {
  if (!ladder || ladder.length === 0) {
    return (
      <span className="font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase">
        ESC {escalation}
      </span>
    );
  }
  return (
    <div
      className="flex gap-x-0.5"
      role="img"
      aria-label={`escalation ${escalation} of ${ladder.length - 1}: ${ladder[escalation] ?? ""}`}
    >
      {ladder.map((label, level) => (
        <span
          key={level}
          title={label}
          className={clsx(
            "h-3 flex-1 rounded-[2px]",
            level <= escalation ? "bg-brand-terminal" : "bg-white/5",
          )}
        />
      ))}
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

function BriefCard({ brief }: { brief: DecisionBrief }) {
  const [expanded, setExpanded] = useState(false);
  const memo = brief.memo;
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.015] p-4">
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        {brief.seat}{" "}
        <span className="text-zinc-500 normal-case">{brief.model}</span>
      </p>
      {brief.error ? (
        <p className="mt-2 font-plex-mono text-xs text-red-400">
          {brief.error}
        </p>
      ) : (
        <>
          {(memo?.answers ?? []).map((answer, index) => (
            <p
              key={index}
              className="mt-2 text-xs leading-relaxed text-zinc-300"
            >
              {answer}
            </p>
          ))}
          {(memo?.choices ?? []).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {memo.choices!.map((id) => (
                <span
                  key={id}
                  className="rounded-sm border border-brand-terminal/40 bg-brand-terminal/10 px-1.5 py-0.5 font-plex-mono text-[10px] text-brand-terminal"
                >
                  {id}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm font-medium text-white">
            {memo?.decision ?? "—"}
          </p>
          {memo?.rationale && (
            <>
              <p
                className={clsx(
                  "mt-2 text-xs leading-relaxed text-zinc-400",
                  !expanded && "line-clamp-6",
                )}
              >
                {memo.rationale}
              </p>
              {memo.rationale.length > 360 && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-1 cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
                >
                  {expanded ? "less" : "more"}
                </button>
              )}
            </>
          )}
          {(memo?.redLines ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {memo.redLines.map((redLine) => (
                <span
                  key={redLine}
                  className="rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-plex-mono text-[10px] text-zinc-400"
                >
                  {redLine}
                </span>
              ))}
            </div>
          )}
          {(brief.dialog ?? []).length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-zinc-300">
                dialog · {brief.dialog!.length} rounds
              </summary>
              <div className="mt-2 space-y-2">
                {brief.dialog!.map((round, index) => (
                  <p
                    key={index}
                    className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-400"
                  >
                    {round}
                  </p>
                ))}
              </div>
            </details>
          )}
          {brief.consensus && (
            <div className="mt-3 space-y-0.5">
              {brief.consensus.deferredOn.length > 0 && (
                <p className="font-plex-mono text-[10px] text-zinc-500">
                  deferred: {brief.consensus.deferredOn.join(", ")}
                </p>
              )}
              {brief.consensus.brokeOn.length > 0 && (
                <p className="font-plex-mono text-[10px] text-accent-yellow">
                  broke: {brief.consensus.brokeOn.join(", ")}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adjudication

function compactVerdict(verdict: Record<string, unknown>): string {
  try {
    return Object.entries(verdict)
      .map(([key, value]) => {
        const rendered =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);
        return `${key}: ${rendered}`;
      })
      .join(" · ");
  } catch {
    return String(verdict);
  }
}

function AdjudicationBlock({
  adjudication,
  ladder,
}: {
  adjudication: TurnAdjudication;
  ladder?: string[];
}) {
  return (
    <div className="border-t border-white/5">
      <Section label="Adjudication" />
      <div className="space-y-4 px-4 py-4">
        <LadderStrip escalation={adjudication.escalation} ladder={ladder} />
        {adjudication.narrative && (
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
            {adjudication.narrative}
          </p>
        )}
        {(adjudication.panel ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Judge
                  </th>
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Model
                  </th>
                  <th className="px-2 py-1.5 font-plex-mono text-[10px] font-normal tracking-wide text-zinc-500 uppercase">
                    Verdict
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* One judge spec fans out across models: key by both. */}
                {adjudication.panel.map((verdict) => (
                  <tr
                    key={`${verdict.judge}:${verdict.model}`}
                    className="border-b border-white/5"
                  >
                    <td className="px-2 py-1.5 text-xs whitespace-nowrap text-zinc-300">
                      {verdict.judge}
                    </td>
                    <td className="px-2 py-1.5 font-plex-mono text-xs whitespace-nowrap text-zinc-500">
                      {verdict.model}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-zinc-400">
                      {verdict.error ? (
                        <span className="font-plex-mono text-red-400">
                          {verdict.error}
                        </span>
                      ) : (
                        compactVerdict(verdict.verdict ?? {})
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Debriefs

function DebriefBlock({
  debrief,
}: {
  debrief: { seat: string; model: string; text: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-white/10 bg-black/20">
      <Bar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label={debrief.seat}
        detail={debrief.model}
      />
      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-line text-zinc-300">
            {debrief.text}
          </p>
        </div>
      )}
    </div>
  );
}
