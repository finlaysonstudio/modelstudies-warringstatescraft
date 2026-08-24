import clsx from "clsx";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatUsd } from "../../lib/usage";
import type {
  InterviewEntity,
  InterviewItemResponse,
  ProbeDoc,
  SurveyUsageItem,
} from "../../lib/types";

// One model's sitting: the record behind a scorecard cell. Items render in
// bank order with the code of every repetition; each opens to the
// repetitions — the code, the majority line where an arm appended one, and
// the explanation the probe elicited.

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; entity: InterviewEntity; probes: ProbeDoc[] };

const usdOf = (
  usage: (SurveyUsageItem[] | null)[] | undefined,
): { calls: number; usd: number } => {
  let calls = 0;
  let usd = 0;
  for (const rep of usage ?? []) {
    for (const item of rep ?? []) {
      calls += 1;
      usd += item.usd ?? 0;
    }
  }
  return { calls, usd };
};

export function Interview() {
  const { interviewId = "" } = useParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    void (async () => {
      try {
        const res = await fetch(
          `/data/interview/${encodeURIComponent(interviewId)}.json`,
        );
        if (!res.ok) throw new Error(`sitting responded ${res.status}`);
        const entity = (await res.json()) as InterviewEntity;
        let probes: ProbeDoc[] = [];
        try {
          const probesRes = await fetch(
            `/data/probes/${encodeURIComponent(interviewId)}.json`,
          );
          if (probesRes.ok) probes = (await probesRes.json()) as ProbeDoc[];
        } catch {
          // explanations fall back to the entity's own record
        }
        if (!cancelled) setState({ phase: "ready", entity, probes });
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
  }, [interviewId]);

  if (state.phase === "loading") {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-zinc-600 sm:px-16">
        loading…
      </p>
    );
  }
  if (state.phase === "error") {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-red-400 sm:px-16">
        failed to load sitting: {state.message}
      </p>
    );
  }

  const { entity, probes } = state;
  const probeOf = new Map(probes.map((probe) => [probe.name, probe]));
  const responses = Object.values(entity.responses);
  const cost = responses.reduce(
    (into, response) => {
      const { calls, usd } = usdOf(response.usage);
      return { calls: into.calls + calls, usd: into.usd + usd };
    },
    { calls: 0, usd: 0 },
  );
  for (const probe of probes) {
    const { calls, usd } = usdOf(probe.usage);
    cost.calls += calls;
    cost.usd += usd;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}
          <Link to="/craft/survey" className="hover:text-white">
            Survey
          </Link>
          {" › "}
          {entity.id}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {entity.respondentModel ?? entity.respondent}
        </h1>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-plex-mono text-xs text-zinc-400">
          <span>{entity.plan}</span>
          {entity.arm && <span className="text-card-accent">{entity.arm}</span>}
          {entity.items && <span>{entity.items.length} items</span>}
          {entity.repetitions && <span>× {entity.repetitions} reps</span>}
          {entity.language && <span>language {entity.language}</span>}
          <span
            className={clsx(
              entity.status === "complete" && "text-brand-terminal",
              entity.status === "error" && "text-red-400",
              entity.status === "pending" && "text-sky-400",
            )}
          >
            {entity.status}
          </span>
          {entity.statusDetail && (
            <span className="text-amber-400">{entity.statusDetail}</span>
          )}
        </p>
        <p className="mt-1 font-plex-mono text-[11px] text-zinc-500">
          {entity.answered} answered · {entity.declined} declined ·{" "}
          {entity.remaining} remaining · {cost.calls} calls ·{" "}
          {formatUsd(Math.round(cost.usd * 1e6) / 1e6)} ·{" "}
          {entity.startedAt.slice(0, 10)}
          {entity.fielding && ` · fielding ${entity.fielding}`}
        </p>
      </header>

      <div className="mt-10 space-y-2">
        {responses.map((response) => (
          <ItemBlock
            key={response.name}
            response={response}
            probe={probeOf.get(response.name)}
          />
        ))}
        {responses.length === 0 && (
          <p className="text-sm text-zinc-400">No items answered yet.</p>
        )}
      </div>
    </div>
  );
}

function ItemBlock({
  response,
  probe,
}: {
  response: InterviewItemResponse;
  probe: ProbeDoc | undefined;
}) {
  const codes =
    response.values ?? (response.value !== null ? [response.value] : []);
  return (
    <details className="rounded-sm border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 px-3 py-2 hover:bg-white/5">
        <span className="font-plex-mono text-xs text-zinc-200">
          {response.name}
        </span>
        {response.declined ? (
          <span className="font-plex-mono text-[10px] text-amber-400 uppercase">
            declined
          </span>
        ) : (
          <span className="font-plex-mono text-[10px] text-zinc-500">
            mean {response.value ?? "—"}
          </span>
        )}
        <span className="flex flex-wrap gap-1">
          {codes.map((code, index) => (
            <span
              key={index}
              className={clsx(
                "inline-flex size-4 items-center justify-center rounded-[2px] font-plex-mono text-[10px]",
                code === 1 && "bg-brand-terminal/30 text-brand-terminal",
                code === 2 && "bg-sky-400/20 text-sky-300",
                code === null && "bg-white/5 text-zinc-600",
              )}
              title={`rep ${index + 1}: ${code ?? "non-conforming"}`}
            >
              {code ?? "×"}
            </span>
          ))}
        </span>
      </summary>
      <div className="space-y-3 border-t border-white/5 px-3 py-3">
        {(response.orders?.[0] ?? []).map((option, index) => (
          <p key={index} className="text-xs leading-relaxed text-zinc-400">
            <span className="mr-2 font-plex-mono text-[10px] text-zinc-600">
              {index + 1}.
            </span>
            {option}
          </p>
        ))}
        {response.raw && (
          <p className="font-plex-mono text-[11px] text-amber-400">
            raw: {response.raw}
          </p>
        )}
        <ol className="space-y-2">
          {codes.map((code, index) => {
            const explanation =
              response.explanations?.[index] ?? probe?.responses[index] ?? null;
            const majority = response.majority?.[index];
            return (
              <li key={index} className="border-l border-white/10 pl-3">
                <p className="font-plex-mono text-[10px] text-zinc-500">
                  rep {index + 1} · code {code ?? "—"}
                  {majority !== undefined && ` · majority named ${majority}`}
                </p>
                {explanation && (
                  <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-zinc-400">
                    {explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}
