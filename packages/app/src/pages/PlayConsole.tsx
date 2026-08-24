// The interactive play console for the registration-gated live-play
// deliverable. Unrouted in this build: nothing links here, and the matrix
// builder that used to feed it is gone. It stays compiled so the gated
// deliverable starts from working code (see the UI reset plan §9).
import clsx from "clsx";
import { Feather, Gavel, User } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { LaneChip, StatusChip } from "../components/chips";
import { Bar } from "../components/PonyBenchPrimitives";
import {
  HUMAN_MODEL,
  type DecisionBrief,
  type DecisionMemo,
  type HumanPrompt,
  type JudgePrompt,
  type JudgeVerdict,
  type NarratePrompt,
  type PlaySession,
  type TurnRecord,
} from "../lib/types";

const shortModel = (model: string) => model.split("/").pop() ?? model;

type SessionState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; session: PlaySession };

export function PlayConsole() {
  const { id = "" } = useParams();
  const [state, setState] = useState<SessionState>({ phase: "loading" });
  const [focusRun, setFocusRun] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/play/${id}`);
      const json = (await res.json()) as PlaySession | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error(
          "error" in json ? json.error : `responded ${res.status}`,
        );
      }
      setState({ phase: "ready", session: json });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "fetch failed",
      });
    }
  }, [id]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 2500);
    return () => clearInterval(timer);
  }, [refresh]);

  const answer = async (promptId: string, memo: DecisionMemo) => {
    const res = await fetch(`/api/play/${id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, memo }),
    });
    const json = (await res.json()) as PlaySession | { error: string };
    if (!res.ok || "error" in json) {
      throw new Error("error" in json ? json.error : `responded ${res.status}`);
    }
    setState({ phase: "ready", session: json });
  };

  const post = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/play/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as PlaySession | { error: string };
    if (!res.ok || "error" in json) {
      throw new Error("error" in json ? json.error : `responded ${res.status}`);
    }
    setState({ phase: "ready", session: json });
  };
  const answerJudge = (promptId: string, verdict: JudgeVerdict) =>
    post("judge", { promptId, verdict });
  const answerNarrate = (promptId: string, narrative: string) =>
    post("narrate", { promptId, narrative });

  if (state.phase === "loading") {
    return (
      <p className="px-16 pt-20 font-plex-mono text-xs text-zinc-600">
        loading…
      </p>
    );
  }
  if (state.phase === "error") {
    return (
      <p className="px-16 pt-20 font-plex-mono text-xs text-red-400">
        {state.message}
      </p>
    );
  }
  const { session } = state;

  // One tab per branch waiting on the player; the focused tab stays put
  // while other branches catch up.
  const pendingRuns = [...new Set(session.pending.map((p) => p.runId))];
  const active =
    focusRun && pendingRuns.includes(focusRun) ? focusRun : pendingRuns[0];
  const shown = session.pending.filter((prompt) => prompt.runId === active);
  const waiting =
    session.pending.length +
    session.verdicts.length +
    session.narrations.length;
  const benchRuns = new Set([
    ...session.verdicts.map((p) => p.runId),
    ...session.narrations.map((p) => p.runId),
  ]);
  const seated = Object.values(session.matrix).flat().includes(HUMAN_MODEL);
  const revealed = session.status !== "active";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft/play" className="hover:text-white">
            Play
          </Link>{" "}
          / {session.id}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3">
          <h1 className="text-3xl font-medium tracking-tight text-white">
            {session.scenarioTitle}
          </h1>
          <StatusChip status={session.status} />
        </div>
        <p className="mt-3 font-plex-mono text-[11px] text-zinc-500">
          {Object.entries(session.matrix).map(([seat, models]) => (
            <span key={seat} className="mr-4">
              {seat} → {models.map(shortModel).join(" | ")}
            </span>
          ))}
        </p>
        <p className="mt-1 font-plex-mono text-[11px] text-zinc-500">
          {session.branchCount} branches from the start
          {seated && " · you are seated"}
          {session.panel.judges.includes(HUMAN_MODEL) && " · you judge"}
          {session.narrator === HUMAN_MODEL && " · you narrate"}
          {` · panel: ${session.panel.judges.length} judges, ${session.panel.mode}`}
          {` · narrator: ${shortModel(session.narrator)}`}
          {session.statusDetail && ` · ${session.statusDetail}`}
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          {waiting === 0 && session.status === "active" && (
            <p className="flex items-center gap-x-2 font-plex-mono text-xs text-zinc-500">
              <span className="animate-pulse text-brand-terminal">●</span>
              models are playing; this page refreshes on its own
            </p>
          )}
          {waiting === 0 && session.status !== "active" && (
            <p className="font-plex-mono text-xs text-zinc-500">
              {session.status === "complete"
                ? "game complete; open the runs on the right"
                : "the game stopped with an error"}
            </p>
          )}

          {pendingRuns.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {pendingRuns.map((runId) => {
                const first = session.pending.find((p) => p.runId === runId)!;
                return (
                  <button
                    key={runId}
                    type="button"
                    onClick={() => setFocusRun(runId)}
                    className={clsx(
                      "cursor-pointer rounded-sm border px-2 py-1 text-left font-plex-mono text-[10px] tracking-wide uppercase",
                      runId === active
                        ? "border-brand-terminal/40 text-brand-terminal"
                        : "border-white/10 text-zinc-500 hover:text-zinc-200",
                    )}
                  >
                    {runId}
                    <span className="ml-2 text-zinc-600 normal-case">
                      turn {first.turn.index} · {rosterLabel(first.roster)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {shown.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onAnswer={answer} />
          ))}

          {session.verdicts.map((prompt) => (
            <JudgeCard key={prompt.id} prompt={prompt} onAnswer={answerJudge} />
          ))}

          {session.narrations.map((prompt) => (
            <NarrateCard
              key={prompt.id}
              prompt={prompt}
              onAnswer={answerNarrate}
            />
          ))}
        </div>

        <aside className="space-y-6">
          <div>
            <p className={eyebrow}>Runs</p>
            <ul className="mt-2 space-y-1">
              {session.runIds.length === 0 && (
                <li className="text-sm text-zinc-500">none written yet</li>
              )}
              {session.runIds.map((runId) => (
                <li
                  key={runId}
                  className="font-plex-mono text-xs text-zinc-300"
                >
                  {revealed || !session.human ? (
                    <Link
                      to={`/craft/replays/${runId}`}
                      className="hover:text-white"
                    >
                      {runId}
                    </Link>
                  ) : (
                    <span>{runId}</span>
                  )}
                  {runId === session.rootId && (
                    <span className="ml-2 text-zinc-600">root</span>
                  )}
                  {pendingRuns.includes(runId) && (
                    <span className="ml-2 text-brand-terminal">your move</span>
                  )}
                  {benchRuns.has(runId) && (
                    <span className="ml-2 text-amber-300">your call</span>
                  )}
                </li>
              ))}
            </ul>
            {session.human && !revealed && (
              <p className="mt-2 font-plex-mono text-[10px] text-zinc-600">
                replays (and who holds each seat) open when the game completes
              </p>
            )}
          </div>
          <div>
            <p className={eyebrow}>Log</p>
            <pre className="mt-2 max-h-96 overflow-y-auto font-plex-mono text-[10px] leading-relaxed whitespace-pre-wrap text-zinc-500">
              {session.log.slice(-60).join("\n")}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}

const rosterLabel = (roster: Record<string, string>) =>
  Object.entries(roster)
    .map(([seat, model]) => `${seat}=${shortModel(model)}`)
    .join(" ");

// --------------------------------------------------------------- prompt card

const KIND_LABEL: Record<HumanPrompt["kind"], string> = {
  blind: "Blind memo: your first read, before anyone else's",
  informed: "Informed memo: after reading the roster's memos",
  turn: "Your turn",
};

function PromptCard({
  prompt,
  onAnswer,
}: {
  prompt: HumanPrompt;
  onAnswer: (promptId: string, memo: DecisionMemo) => Promise<void>;
}) {
  const [showTable, setShowTable] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [situation, setSituation] = useState("");
  const [options, setOptions] = useState("");
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const [redLines, setRedLines] = useState("");
  const [deferredOn, setDeferredOn] = useState("");
  const [brokeOn, setBrokeOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const memo: DecisionMemo = {
      situation: situation.trim(),
      options: lines(options),
      decision: decision.trim(),
      rationale: rationale.trim(),
      redLines: lines(redLines),
      ...(prompt.kind === "informed"
        ? {
            consensus: {
              deferredOn: lines(deferredOn),
              brokeOn: lines(brokeOn),
            },
          }
        : {}),
    };
    try {
      await onAnswer(prompt.id, memo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "submit failed");
      setBusy(false);
    }
  };

  const seatName = (seatId: string) =>
    seatId === prompt.seat ? prompt.seatName : seatId;

  return (
    <div className="rounded-sm border border-brand-terminal/50 bg-surface-ink/40">
      <div className="flex flex-wrap items-center gap-x-2 border-b border-white/5 px-4 pt-3 pb-2">
        <User className="size-3 text-brand-terminal" strokeWidth={2} />
        <span className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          {KIND_LABEL[prompt.kind]}
        </span>
        <span className="ml-auto flex items-center gap-x-2 font-plex-mono text-[10px] text-zinc-600">
          {prompt.seatName} · turn {prompt.turn.index} · {prompt.runId}
          <LaneChip lane={prompt.lane} />
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-white/5 px-4 py-2 font-plex-mono text-[10px] text-zinc-500">
        {Object.entries(prompt.roster).map(([seat, model]) => (
          <span
            key={seat}
            className={clsx(seat === prompt.seat && "text-brand-terminal")}
          >
            {seat} → {shortModel(model)}
          </span>
        ))}
      </div>

      <div className="space-y-5 px-4 py-4">
        {prompt.history.length > 0 && (
          <History
            turns={prompt.history}
            seat={prompt.seat}
            roster={prompt.roster}
          />
        )}

        <div>
          <p className={eyebrow}>
            Turn {prompt.turn.index}: {prompt.turn.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {prompt.turn.inject}
          </p>
          {prompt.turn.moveMenu && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-400">
              {prompt.turn.moveMenu.map((move) => (
                <li key={move}>{move}</li>
              ))}
            </ul>
          )}
        </div>

        {prompt.table && prompt.table.length > 0 && (
          <div>
            <Bar
              open={showTable}
              onToggle={() => setShowTable((value) => !value)}
              label="The table this turn"
              detail={`${prompt.table.length} other ${
                prompt.table.length === 1 ? "seat has" : "seats have"
              } moved`}
            />
            {showTable && (
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {prompt.table.map((brief) => (
                  <PlayBriefCard
                    key={brief.seat}
                    brief={brief}
                    title={seatName(brief.seat)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {prompt.candidates && (
          <div>
            <p className={eyebrow}>
              {prompt.candidates.length} anonymous advisor memos
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {prompt.candidates.map((memo, index) => (
                <div
                  key={index}
                  className="rounded-sm border border-white/10 px-3 py-3 text-sm"
                >
                  <p className="font-plex-mono text-[10px] text-zinc-500 uppercase">
                    Advisor {index + 1}
                  </p>
                  <p className="mt-1 text-zinc-100">{memo.decision}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {memo.rationale}
                  </p>
                  {memo.redLines.length > 0 && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Red lines: {memo.redLines.join("; ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 border-t border-white/5 pt-4">
          <Field label="Situation" hint="your read, 2-4 sentences">
            <textarea
              value={situation}
              onChange={(event) => setSituation(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Options considered" hint="one per line">
            <textarea
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Decision" hint="one order, stated as an order">
            <textarea
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              rows={2}
              className={clsx(inputClass, "border-brand-terminal/40")}
            />
          </Field>
          <Field label="Rationale" hint="2-5 sentences">
            <textarea
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Red lines" hint="one per line">
            <textarea
              value={redLines}
              onChange={(event) => setRedLines(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          {prompt.kind === "informed" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deferred to the advisors on" hint="one per line">
                <textarea
                  value={deferredOn}
                  onChange={(event) => setDeferredOn(event.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </Field>
              <Field label="Broke from the advisors on" hint="one per line">
                <textarea
                  value={brokeOn}
                  onChange={(event) => setBrokeOn(event.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
          {error && (
            <p className="font-plex-mono text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            disabled={busy || !decision.trim()}
            onClick={() => void submit()}
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "sending…" : "Issue the memo"}
          </button>
        </div>
      </div>

      <Bar
        open={showSystem}
        onToggle={() => setShowSystem((value) => !value)}
        label="Seat brief (system prompt)"
        detail={`${prompt.system.length.toLocaleString()} chars`}
      />
      {showSystem && <Verbatim text={prompt.system} />}
      <Bar
        open={showPrompt}
        onToggle={() => setShowPrompt((value) => !value)}
        label="Full turn prompt, as a model sees it"
        detail={`${prompt.prompt.length.toLocaleString()} chars`}
      />
      {showPrompt && <Verbatim text={prompt.prompt} />}
    </div>
  );
}

// This branch's own line: every prior turn with the narrative, the escalation
// rung, and each seat's decision. The player's seat reads in the accent.
function History({
  turns,
  seat,
  roster,
  label = "Your line so far",
}: {
  turns: TurnRecord[];
  seat: string;
  roster: Record<string, string>;
  label?: string;
}) {
  const [open, setOpen] = useState<number | null>(
    turns[turns.length - 1]?.index ?? null,
  );
  return (
    <div>
      <p className={eyebrow}>
        {label}: {turns.length} {turns.length === 1 ? "turn" : "turns"}
      </p>
      <ol className="mt-2 divide-y divide-white/5 rounded-sm border border-white/10">
        {turns.map((turn) => {
          const expanded = open === turn.index;
          const own = turn.briefs.find((brief) => brief.seat === seat);
          return (
            <li key={turn.index}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : turn.index)}
                className="flex w-full cursor-pointer items-start gap-x-3 px-3 py-2 text-left hover:bg-white/[0.03]"
              >
                <span className="font-plex-mono text-[10px] text-zinc-500">
                  T{turn.index}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-zinc-200">
                    {turn.title}
                    {turn.adjudication && (
                      <span className="ml-2 font-plex-mono text-[10px] text-zinc-500">
                        escalation {turn.adjudication.escalation}
                      </span>
                    )}
                  </span>
                  {!expanded && own && (
                    <span className="block truncate text-xs text-zinc-500">
                      you: {own.memo.decision}
                    </span>
                  )}
                </span>
                <span className="font-plex-mono text-[10px] text-zinc-600">
                  {expanded ? "−" : "+"}
                </span>
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-white/5 px-3 py-3">
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {turn.inject}
                  </p>
                  {turn.adjudication && (
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {turn.adjudication.narrative}
                    </p>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    {turn.briefs.map((brief) => (
                      <PlayBriefCard
                        key={`${brief.seat}:${brief.model}`}
                        brief={brief}
                        title={brief.seat}
                        mine={brief.seat === seat}
                        model={roster[brief.seat]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlayBriefCard({
  brief,
  title,
  model,
  mine = false,
}: {
  brief: DecisionBrief;
  title: string;
  model?: string;
  mine?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-sm border px-3 py-3 text-sm",
        mine ? "border-brand-terminal/40" : "border-white/10",
      )}
    >
      <p className="flex items-center justify-between font-plex-mono text-[10px] text-zinc-500 uppercase">
        <span className={clsx(mine && "text-brand-terminal")}>{title}</span>
        <span className="normal-case">{shortModel(model ?? brief.model)}</span>
      </p>
      {brief.error ? (
        <p className="mt-1 text-xs text-red-400">{brief.error}</p>
      ) : (
        <>
          <p className="mt-1 text-zinc-100">{brief.memo.decision}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            {brief.memo.rationale}
          </p>
          {brief.memo.redLines.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Red lines: {brief.memo.redLines.join("; ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------- bench cards

/** The scored turn as the bench sees it: inject, each seat's brief, masked. */
function TurnTable({
  turn,
  history,
}: {
  turn: TurnRecord;
  history: TurnRecord[];
}) {
  return (
    <>
      {history.length > 0 && (
        <History turns={history} seat="" roster={{}} label="This line so far" />
      )}
      <div>
        <p className={eyebrow}>
          Turn {turn.index}: {turn.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {turn.inject}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {turn.briefs.map((brief) => (
          <PlayBriefCard key={brief.seat} brief={brief} title={brief.seat} />
        ))}
      </div>
    </>
  );
}

function Pick({
  checked,
  onChange,
  accent = false,
  kind = "checkbox",
  children,
}: {
  checked: boolean;
  onChange: () => void;
  accent?: boolean;
  kind?: "checkbox" | "radio";
  children: ReactNode;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-x-2 font-plex-mono text-xs hover:text-white",
        accent ? "text-zinc-200" : "text-zinc-300",
      )}
    >
      <input
        type={kind}
        checked={checked}
        onChange={onChange}
        className="accent-brand-terminal"
      />
      {children}
    </label>
  );
}

function JudgeCard({
  prompt,
  onAnswer,
}: {
  prompt: JudgePrompt;
  onAnswer: (promptId: string, verdict: JudgeVerdict) => Promise<void>;
}) {
  const [showSystem, setShowSystem] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [escalation, setEscalation] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [flags, setFlags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (escalation === null) return;
    setBusy(true);
    setError(null);
    try {
      await onAnswer(prompt.id, {
        escalation,
        reasoning: reasoning.trim(),
        flags: flags
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-amber-400/40 bg-surface-ink/40">
      <div className="flex flex-wrap items-center gap-x-2 border-b border-white/5 px-4 pt-3 pb-2">
        <Gavel className="size-3 text-amber-300" strokeWidth={2} />
        <span className="font-plex-mono text-xs tracking-wide text-amber-300 uppercase">
          Your verdict: score turn {prompt.turn.index}
        </span>
        <span className="ml-auto font-plex-mono text-[10px] text-zinc-600">
          {prompt.turn.title} · {prompt.runId}
        </span>
      </div>
      <div className="space-y-5 px-4 py-4">
        <TurnTable turn={prompt.turn} history={prompt.history} />
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div>
            <p className={eyebrow}>
              Escalation
              <span className="ml-2 text-zinc-600 normal-case">
                the highest rung any action this turn actually reaches
              </span>
            </p>
            <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {prompt.escalationLadder.map((label, index) => (
                <Pick
                  key={index}
                  kind="radio"
                  checked={escalation === index}
                  onChange={() => setEscalation(index)}
                >
                  {index}. {label}
                </Pick>
              ))}
            </div>
          </div>
          <Field
            label="Reasoning"
            hint="2-3 sentences: which actions drove the level"
          >
            <textarea
              value={reasoning}
              onChange={(event) => setReasoning(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field
            label="Flags"
            hint="one per line: red-line violations, broken commitments, deception, genuine de-escalation"
          >
            <textarea
              value={flags}
              onChange={(event) => setFlags(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
          {error && (
            <p className="font-plex-mono text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            disabled={busy || escalation === null}
            onClick={() => void submit()}
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "sending…" : "Enter the verdict"}
          </button>
        </div>
      </div>
      <Bar
        open={showSystem}
        onToggle={() => setShowSystem((value) => !value)}
        label="Judge brief (system prompt)"
        detail={`${prompt.system.length.toLocaleString()} chars`}
      />
      {showSystem && <Verbatim text={prompt.system} />}
      <Bar
        open={showPrompt}
        onToggle={() => setShowPrompt((value) => !value)}
        label="Full judge prompt, as a model sees it"
        detail={`${prompt.prompt.length.toLocaleString()} chars`}
      />
      {showPrompt && <Verbatim text={prompt.prompt} />}
    </div>
  );
}

function NarrateCard({
  prompt,
  onAnswer,
}: {
  prompt: NarratePrompt;
  onAnswer: (promptId: string, narrative: string) => Promise<void>;
}) {
  const [showSystem, setShowSystem] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onAnswer(prompt.id, narrative.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-amber-400/40 bg-surface-ink/40">
      <div className="flex flex-wrap items-center gap-x-2 border-b border-white/5 px-4 pt-3 pb-2">
        <Feather className="size-3 text-amber-300" strokeWidth={2} />
        <span className="font-plex-mono text-xs tracking-wide text-amber-300 uppercase">
          Your narration: resolve turn {prompt.turn.index}
        </span>
        <span className="ml-auto font-plex-mono text-[10px] text-zinc-600">
          {prompt.turn.title} · {prompt.runId}
        </span>
      </div>
      <div className="space-y-5 px-4 py-4">
        <TurnTable turn={prompt.turn} history={prompt.history} />
        <div>
          <p className={eyebrow}>
            Panel {prompt.escalation} ·{" "}
            {prompt.escalationLadder[prompt.escalation]}
          </p>
          <ul className="mt-2 space-y-1">
            {prompt.panel.map((verdict, index) => (
              <li
                key={index}
                className="font-plex-mono text-[11px] text-zinc-400"
              >
                <span className="text-zinc-600">
                  {verdict.model === HUMAN_MODEL ? "you" : `judge ${index + 1}`}
                </span>{" "}
                {verdict.error
                  ? `error: ${verdict.error}`
                  : `${String(verdict.verdict.escalation)} · ${String(
                      verdict.verdict.reasoning ?? "",
                    )}`}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 border-t border-white/5 pt-4">
          <Field
            label="Narrative"
            hint="120-180 words: what happens over the following days"
          >
            <textarea
              value={narrative}
              onChange={(event) => setNarrative(event.target.value)}
              rows={7}
              className={clsx(inputClass, "border-brand-terminal/40")}
            />
          </Field>
          {error && (
            <p className="font-plex-mono text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            disabled={busy || !narrative.trim()}
            onClick={() => void submit()}
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "sending…" : "Resolve the turn"}
          </button>
        </div>
      </div>
      <Bar
        open={showSystem}
        onToggle={() => setShowSystem((value) => !value)}
        label="Narrator brief (system prompt)"
        detail={`${prompt.system.length.toLocaleString()} chars`}
      />
      {showSystem && <Verbatim text={prompt.system} />}
      <Bar
        open={showPrompt}
        onToggle={() => setShowPrompt((value) => !value)}
        label="Full narrator prompt, as a model sees it"
        detail={`${prompt.prompt.length.toLocaleString()} chars`}
      />
      {showPrompt && <Verbatim text={prompt.prompt} />}
    </div>
  );
}

// ---------------------------------------------------------------- primitives

const eyebrow =
  "font-plex-mono text-xs tracking-wide text-card-accent uppercase";
const inputClass =
  "mt-1 w-full rounded-sm border border-white/10 bg-surface-base px-3 py-2 text-sm text-zinc-100 focus:border-brand-terminal focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={eyebrow}>
        {label}
        {hint && <span className="ml-2 text-zinc-600 normal-case">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Verbatim({ text }: { text: string }) {
  return (
    <pre className="overflow-x-auto border-t border-white/5 px-4 py-4 font-plex-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400">
      {text}
    </pre>
  );
}
