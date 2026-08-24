import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  AdjudicationBlock,
  compactVerdict,
} from "../../components/replay/AdjudicationBlock";
import { BriefCard } from "../../components/replay/BriefCard";
import { DebriefBlock } from "../../components/replay/DebriefBlock";
import { EscalationOverview } from "../../components/replay/EscalationOverview";
import { LadderStrip } from "../../components/replay/LadderStrip";
import type {
  DecisionBrief,
  Run,
  ScenarioMaterials,
  TurnRecord,
} from "../../lib/types";

// Watching one recorded game from a chosen seat's vantage, paced turn by
// turn: the inject, then the followed seat's brief, then the rest of the
// table (collapsed), then the panel's verdict, then what happened next.
// Space or the arrow keys advance; nothing is interactive beyond pacing.

type Step =
  | { kind: "inject"; turn: TurnRecord }
  | { kind: "you"; turn: TurnRecord; briefs: DecisionBrief[] }
  | { kind: "table"; turn: TurnRecord; briefs: DecisionBrief[] }
  | { kind: "verdict"; turn: TurnRecord }
  | { kind: "narrative"; turn: TurnRecord };

const shortModel = (model: string) => model.split("/").pop() ?? model;

/** var/scenarios file id for the run's rendering (mirror of materialsId) */
const materialsIdOf = (run: Run) =>
  [
    run.scenario,
    ...(run.naming && run.naming !== "chronicle" ? [run.naming] : []),
    ...(run.language && run.language !== "en" ? [run.language] : []),
  ].join(".");

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; run: Run; materials: ScenarioMaterials | null };

export function Watch() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    setRevealed(1);
    void (async () => {
      try {
        const res = await fetch(`/data/runs/${encodeURIComponent(id)}.json`);
        if (!res.ok) throw new Error(`run responded ${res.status}`);
        const run = (await res.json()) as Run;
        let materials: ScenarioMaterials | null = null;
        try {
          const materialsRes = await fetch(
            `/data/scenarios/${materialsIdOf(run)}.json`,
          );
          if (materialsRes.ok) {
            materials = (await materialsRes.json()) as ScenarioMaterials;
          }
        } catch {
          // seat names fall back to seat ids
        }
        if (!cancelled) setState({ phase: "ready", run, materials });
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

  const run = state.phase === "ready" ? state.run : null;
  const materials = state.phase === "ready" ? state.materials : null;
  const roster = run?.roster ?? {};
  const seat = params.get("seat") ?? Object.keys(roster)[0] ?? "";

  const steps = useMemo<Step[]>(() => {
    if (!run) return [];
    const list: Step[] = [];
    for (const turn of run.turns ?? []) {
      list.push({ kind: "inject", turn });
      const own = (turn.briefs ?? []).filter((brief) => brief.seat === seat);
      if (own.length > 0) list.push({ kind: "you", turn, briefs: own });
      const others = (turn.briefs ?? []).filter((brief) => brief.seat !== seat);
      if (others.length > 0) list.push({ kind: "table", turn, briefs: others });
      if (turn.adjudication) {
        list.push({ kind: "verdict", turn });
        if (turn.adjudication.narrative) {
          list.push({ kind: "narrative", turn });
        }
      }
    }
    return list;
  }, [run, seat]);

  const done = revealed >= steps.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        setRevealed((value) => Math.min(value + 1, steps.length));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setRevealed((value) => Math.max(value - 1, 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  if (state.phase === "loading") {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-zinc-600 sm:px-16">
        loading…
      </p>
    );
  }
  if (state.phase === "error" || !run) {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-red-400 sm:px-16">
        failed to load game:{" "}
        {state.phase === "error" ? state.message : "no run"}
      </p>
    );
  }

  const seatName =
    materials?.seats.find((candidate) => candidate.id === seat)?.name ?? seat;
  const nature = materials?.cast.find((member) => member.seat === seat)?.nature;
  const turnCount = (run.turns ?? []).length;
  const currentTurn = steps[Math.min(revealed, steps.length) - 1]?.turn.index;
  const next = steps[revealed];
  const nextLabel = next
    ? {
        inject: `turn ${next.turn.index}`,
        you: `${seatName}'s brief`,
        table: "the rest of the table",
        verdict: "the panel's verdict",
        narrative: "what happens next",
      }[next.kind]
    : null;
  const adjudicated = (run.turns ?? []).filter((turn) => turn.adjudication);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}
          <Link
            to={`/craft/play?chapter=${run.scenario}&seat=${seat}`}
            className="hover:text-white"
          >
            Play
          </Link>
          {" › "}
          {run.id}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {run.scenarioTitle || run.scenario}
        </h1>
        <p className="mt-2 text-sm text-zinc-300">
          You follow <span className="text-brand-terminal">{seatName}</span>
          {nature ? <span className="text-zinc-400"> — {nature}</span> : null}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {Object.entries(roster).map(([candidate, model]) => (
            <span
              key={candidate}
              className={clsx(
                "font-plex-mono text-xs",
                candidate === seat ? "text-brand-terminal" : "text-zinc-500",
              )}
            >
              {candidate} → {shortModel(model)}
            </span>
          ))}
        </div>
        {run.escalationLadder && (
          <p className="mt-3 font-plex-mono text-[10px] text-zinc-600">
            ladder:{" "}
            {run.escalationLadder
              .map((label, i) => `${i} ${label}`)
              .join(" · ")}
          </p>
        )}
      </header>

      <div className="mt-10 space-y-6">
        {steps.slice(0, revealed).map((step, index) => (
          <StepBlock
            key={index}
            step={step}
            seatName={seatName}
            ladder={run.escalationLadder}
            latest={index === revealed - 1 && !done}
          />
        ))}
      </div>

      {!done && (
        <div className="mt-8 flex items-center gap-x-4">
          <button
            type="button"
            onClick={() =>
              setRevealed((value) => Math.min(value + 1, steps.length))
            }
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80"
          >
            {nextLabel ? `Next: ${nextLabel}` : "Next"}
          </button>
          <span className="font-plex-mono text-[10px] text-zinc-600">
            {revealed} of {steps.length} · turn {currentTurn} of {turnCount} ·
            space advances
          </span>
        </div>
      )}

      {done && (
        <div className="mt-12 space-y-8">
          {(run.debriefs ?? []).length > 0 && (
            <section aria-label="Debriefs">
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
          {adjudicated.length >= 2 && (
            <EscalationOverview
              turns={adjudicated}
              ladder={run.escalationLadder}
            />
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/craft/replays/${run.id}`}
              className="cursor-pointer rounded-sm border border-white/10 px-3 py-1.5 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5"
            >
              the full replay
            </Link>
            <Link
              to={`/craft/chapters/${run.scenario}`}
              className="cursor-pointer rounded-sm border border-white/10 px-3 py-1.5 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5"
            >
              the chapter
            </Link>
            <Link
              to={`/craft/play?chapter=${run.scenario}&seat=${seat}`}
              className="cursor-pointer rounded-sm border border-brand-terminal/40 px-3 py-1.5 font-plex-mono text-[10px] tracking-wide text-brand-terminal uppercase hover:bg-white/5"
            >
              ▶ watch another
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBlock({
  step,
  seatName,
  ladder,
  latest,
}: {
  step: Step;
  seatName: string;
  ladder?: string[];
  latest: boolean;
}) {
  const frame = clsx(
    "rounded-sm border bg-black/20 px-4 py-4",
    latest ? "border-brand-terminal/40" : "border-white/10",
  );
  if (step.kind === "inject") {
    return (
      <section className={frame} aria-label={`Turn ${step.turn.index}`}>
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Turn {step.turn.index} — {step.turn.title}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
          {step.turn.inject}
        </p>
      </section>
    );
  }
  if (step.kind === "you") {
    return (
      <section className={frame} aria-label={`${seatName} decides`}>
        <p className="font-plex-mono text-xs tracking-wide text-brand-terminal uppercase">
          {seatName} decides
        </p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {step.briefs.map((brief) => (
            <BriefCard
              key={`${brief.seat}:${brief.model}:${brief.consensus ? "c" : "i"}`}
              brief={brief}
            />
          ))}
        </div>
      </section>
    );
  }
  if (step.kind === "table") {
    return (
      <section className={frame} aria-label="The table">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          The rest of the table
        </p>
        <div className="mt-2 space-y-2">
          {step.briefs.map((brief) => (
            <details
              key={`${brief.seat}:${brief.model}:${brief.consensus ? "c" : "i"}`}
            >
              <summary className="cursor-pointer font-plex-mono text-[11px] text-zinc-400 hover:text-zinc-200">
                {brief.seat} · {shortModel(brief.model)}
                {brief.memo?.decision ? (
                  <span className="ml-2 text-zinc-500">
                    {brief.memo.decision.slice(0, 80)}
                    {brief.memo.decision.length > 80 ? "…" : ""}
                  </span>
                ) : null}
              </summary>
              <div className="mt-2">
                <BriefCard brief={brief} />
              </div>
            </details>
          ))}
        </div>
      </section>
    );
  }
  if (step.kind === "verdict") {
    const adjudication = step.turn.adjudication!;
    return (
      <section className={frame} aria-label="Verdict">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          The panel's verdict · escalation {adjudication.escalation}
          {ladder?.[adjudication.escalation]
            ? ` — ${ladder[adjudication.escalation]}`
            : ""}
        </p>
        <div className="mt-3 max-w-md">
          <LadderStrip escalation={adjudication.escalation} ladder={ladder} />
        </div>
        {(adjudication.panel ?? []).length > 0 && (
          <ul className="mt-3 space-y-1">
            {adjudication.panel.map((verdict) => (
              <li
                key={`${verdict.judge}:${verdict.model}`}
                className="font-plex-mono text-[11px] text-zinc-400"
              >
                <span className="text-zinc-600">
                  {shortModel(verdict.model)}
                </span>{" "}
                {verdict.error ? (
                  <span className="text-red-400">{verdict.error}</span>
                ) : (
                  compactVerdict(verdict.verdict ?? {})
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  const adjudication = step.turn.adjudication!;
  return (
    <section className={frame} aria-label="Narrative">
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        What happens next
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
        {adjudication.narrative}
      </p>
    </section>
  );
}
