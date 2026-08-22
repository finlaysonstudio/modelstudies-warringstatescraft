import clsx from "clsx";
import { GitFork } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, Section } from "../components/PonyBenchPrimitives";
import type { ScenarioMaterials } from "../lib/types";

// The reading room: every card and instruction the engine hands to a model,
// rendered as the model sees it. Source is data/scenarios/<id>.json, written
// by `cli materials`. Left rail jumps between blocks; each block opens to
// the verbatim prompt beneath the human-readable card.

type LoadState =
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "ready"; materials: ScenarioMaterials };

interface ScenarioIndexEntry {
  id: string;
  title: string;
  summary: string;
  simulates: string;
  order: number;
  seatCount: number;
  turnCount: number;
}

export function ScenarioMaterialsPage() {
  const { id: routeId } = useParams();
  const [index, setIndex] = useState<ScenarioIndexEntry[]>([]);
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  // no id in the route: the first exported scenario
  const id = routeId ?? index[0]?.id ?? "";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/scenarios.json");
        if (!res.ok) return;
        const entries = (await res.json()) as ScenarioIndexEntry[];
        if (!cancelled) setIndex(entries.sort((a, b) => a.order - b.order));
      } catch {
        // index unavailable: the route id still loads directly
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ phase: "loading" });
    void (async () => {
      try {
        const res = await fetch(`/data/scenarios/${id}.json`);
        if (!res.ok) throw new Error(String(res.status));
        const materials = (await res.json()) as ScenarioMaterials;
        if (!cancelled) setState({ phase: "ready", materials });
      } catch {
        if (!cancelled) setState({ phase: "empty" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const switcher = index.length > 0 && (
    <nav
      aria-label="Scenarios"
      className="mb-8 flex flex-wrap items-center gap-2"
    >
      {index.map((entry) => (
        <Link
          key={entry.id}
          to={`/scenarios/${entry.id}`}
          className={clsx(
            "cursor-pointer rounded-sm border px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
            entry.id === id
              ? "border-brand-terminal/40 text-brand-terminal"
              : "border-white/10 text-zinc-500 hover:text-zinc-200",
          )}
        >
          {entry.title}
          <span className="ml-1.5 text-zinc-600 normal-case">
            {entry.simulates.split(":")[0]}
          </span>
        </Link>
      ))}
    </nav>
  );

  if (state.phase === "loading") {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-zinc-500 sm:px-16">
        loading…
      </p>
    );
  }
  if (state.phase === "empty") {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 sm:px-16">
        {switcher}
        <p className="font-plex-mono text-xs text-zinc-500">
          No materials for <span className="text-zinc-300">{id}</span>. Export
          them with{" "}
          <code className="text-card-accent">npm run cli -- materials</code>.
        </p>
      </div>
    );
  }

  const { materials } = state;
  const { scenario } = materials;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      {switcher}
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Scenario materials
        </p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-white">
          {scenario.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-pretty text-zinc-400">
          {scenario.summary}
        </p>
        <p className="mt-4 max-w-2xl border-l border-brand-terminal/40 pl-3 text-sm text-pretty text-zinc-300">
          <span className="mr-2 font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
            Simulates
          </span>
          {scenario.simulates}
        </p>
        <p className="mt-3 font-plex-mono text-[10px] text-zinc-600">
          {materials.seats.length} seats · {materials.turns.length} turns ·
          forks at{" "}
          {scenario.decisionPoints
            .map((point) => `turn ${point.turn} (${point.seat})`)
            .join(", ")}{" "}
          · exported {materials.createdAt.slice(0, 10)}
        </p>
      </header>

      <div className="mt-12 grid gap-x-12 lg:grid-cols-[11rem_1fr]">
        <Rail materials={materials} />
        <div className="min-w-0 space-y-12">
          <Block id="rules" title="Rules of the game">
            <Card label="Standing priorities, in order">
              <ol className="space-y-1 text-sm text-zinc-300">
                {(scenario.priorities ?? []).map((priority, index) => (
                  <li key={priority} className="flex gap-x-3">
                    <span className="font-plex-mono text-xs text-zinc-600">
                      {index + 1}
                    </span>
                    {priority}
                  </li>
                ))}
              </ol>
            </Card>
            <Card label="Escalation ladder">
              <Ladder ladder={scenario.escalationLadder} />
            </Card>
          </Block>

          <Block id="seats" title="Seat cards">
            {materials.seats.map((seat) => (
              <Prompted
                key={seat.id}
                label={seat.name}
                detail={seat.id}
                prompt={seat.systemPrompt}
                promptLabel="System prompt, verbatim"
              >
                <p className="text-sm leading-relaxed text-zinc-300">
                  {seat.brief}
                </p>
                <p className="mt-4 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                  Objectives
                </p>
                <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                  {seat.objectives.map((objective) => (
                    <li key={objective} className="flex gap-x-2">
                      <span className="text-zinc-600">·</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </Prompted>
            ))}
          </Block>

          <Block id="turns" title="Turn cards">
            {materials.turns.map((turn) => (
              <Prompted
                key={turn.index}
                label={`Turn ${turn.index} · ${turn.title}`}
                detail={
                  turn.decisionPoint
                    ? `decision point · focal ${turn.focalSeat}`
                    : undefined
                }
                flagged={turn.decisionPoint}
                prompt={turn.prompt}
                promptLabel="Turn prompt as sent on an opening board"
              >
                <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                  Inject
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                  {turn.inject}
                </p>
                {turn.moveMenu?.length ? (
                  <>
                    <p className="mt-4 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                      Move menu
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-zinc-300">
                      {turn.moveMenu.map((move) => (
                        <li key={move} className="flex gap-x-2">
                          <span className="text-zinc-600">·</span>
                          {move}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </Prompted>
            ))}
          </Block>

          <Block id="memo" title="Decision memo">
            <Prompted
              label="Memo schema"
              detail="every seat, every turn"
              prompt={JSON.stringify(materials.memoSchema, null, 2)}
              promptLabel="JSON schema, verbatim"
            >
              <SchemaFields schema={materials.memoSchema} />
            </Prompted>
            <Prompted
              label="Consensus memo schema"
              detail="consensus lane only"
              prompt={JSON.stringify(materials.consensusSchema, null, 2)}
              promptLabel="JSON schema, verbatim"
            >
              <SchemaFields
                schema={materials.consensusSchema}
                only={["deferredOn", "brokeOn"]}
              />
            </Prompted>
            <Prompted
              label="Consensus prompt"
              detail="focal seat, after the independent memos"
              prompt={materials.consensusPrompt}
              promptLabel="Prompt with two placeholder advisors"
            >
              <p className="text-sm leading-relaxed text-zinc-300">
                The deciding model receives its ordinary turn prompt followed by
                every independent memo, shuffled and unattributed (its own
                included), and re-decides. It reports where it deferred to the
                majority and where it broke.
              </p>
            </Prompted>
          </Block>

          <Block id="box" title="Judges' box">
            <Prompted
              label="Escalation judge"
              detail="each judge model · median wins"
              prompt={materials.judgeSystem}
              promptLabel="System prompt, verbatim"
            >
              <p className="text-sm leading-relaxed text-zinc-300">
                Every judge scores the turn's combined actions on the ladder and
                flags notable conduct. The panel median becomes the turn
                escalation.
              </p>
            </Prompted>
            <Prompted
              label="Narrator"
              detail="one model · resolves the turn"
              prompt={materials.narratorSystem}
              promptLabel="System prompt, verbatim"
            >
              <p className="text-sm leading-relaxed text-zinc-300">
                Given each seat's decision, the narrator writes the resolution
                that becomes the next turn's public record.
              </p>
            </Prompted>
          </Block>
        </div>
      </div>
    </div>
  );
}

const RAIL = [
  ["rules", "Rules"],
  ["seats", "Seats"],
  ["turns", "Turns"],
  ["memo", "Memo"],
  ["box", "Judges' box"],
] as const;

function Rail({ materials }: { materials: ScenarioMaterials }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-2 lg:sticky lg:top-0 lg:mb-0 lg:block lg:space-y-2 lg:self-start lg:pt-1">
      {RAIL.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="block font-plex-mono text-xs tracking-wide text-zinc-500 uppercase hover:text-zinc-200"
        >
          {label}
        </a>
      ))}
      <p className="mt-6 hidden font-plex-mono text-[10px] text-zinc-700 lg:block">
        <Link to="/" className="hover:text-zinc-400">
          ← replays
        </Link>
        <br />
        {materials.id}
      </p>
    </nav>
  );
}

function Block({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-4 text-lg font-medium tracking-tight text-white">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-sm border border-white/10 bg-surface-ink/40">
      <Section label={label} />
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

// A card with the verbatim prompt folded beneath it.
function Prompted({
  label,
  detail,
  flagged = false,
  prompt,
  promptLabel,
  children,
}: {
  label: string;
  detail?: string;
  flagged?: boolean;
  prompt: string;
  promptLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={clsx(
        "rounded-sm border bg-surface-ink/40",
        flagged ? "border-brand-terminal/50" : "border-white/10",
      )}
    >
      <div className="flex items-center gap-x-2 border-b border-white/5 px-4 pt-3 pb-2">
        {flagged && (
          <GitFork className="size-3 text-brand-terminal" strokeWidth={2} />
        )}
        <span className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          {label}
        </span>
        {detail && (
          <span className="ml-auto truncate pl-4 font-plex-mono text-[10px] text-zinc-600">
            {detail}
          </span>
        )}
      </div>
      <div className="px-4 py-4">{children}</div>
      <Bar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label={promptLabel}
        detail={`${prompt.length.toLocaleString()} chars`}
      />
      {open && (
        <pre className="overflow-x-auto border-t border-white/5 px-4 py-4 font-plex-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400">
          {prompt}
        </pre>
      )}
    </div>
  );
}

function Ladder({ ladder }: { ladder: string[] }) {
  const top = ladder.length - 1;
  return (
    <ol className="space-y-1.5">
      {ladder.map((label, level) => (
        <li key={label} className="flex items-center gap-x-3 text-sm">
          <span className="w-4 font-plex-mono text-xs text-zinc-600">
            {level}
          </span>
          <span className="flex gap-px" aria-hidden>
            {ladder.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-2 w-2.5",
                  i <= level ? "bg-brand-terminal" : "bg-white/10",
                  i <= level && level === top && "bg-brand-terminal",
                )}
              />
            ))}
          </span>
          <span className="text-zinc-300">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function SchemaFields({
  schema,
  only,
}: {
  schema: ScenarioMaterials["memoSchema"];
  only?: string[];
}) {
  const entries = Object.entries(schema.properties).filter(
    ([name]) => !only || only.includes(name),
  );
  return (
    <dl className="space-y-2">
      {entries.map(([name, field]) => (
        <div key={name} className="grid gap-x-4 sm:grid-cols-[9rem_1fr]">
          <dt className="font-plex-mono text-xs text-zinc-200">
            {name}
            <span className="text-zinc-600">
              {" "}
              {field.type === "array" ? "string[]" : field.type}
            </span>
          </dt>
          <dd className="text-sm text-zinc-400">{field.description}</dd>
        </div>
      ))}
    </dl>
  );
}
