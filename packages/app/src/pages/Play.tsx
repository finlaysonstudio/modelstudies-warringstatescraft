import clsx from "clsx";
import { Feather, Gavel, GitFork, Play as PlayIcon, User } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  type PanelMode,
  type PlayCatalog,
  type PlayRequest,
  type PlaySession,
  type TurnRecord,
} from "../lib/types";

// ---------------------------------------------------------------- setup page

type CatalogState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; catalog: PlayCatalog; sessions: PlaySession[] };

type Matrix = Record<string, string[]>;

const shortModel = (model: string) => model.split("/").pop() ?? model;

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Deal the starting models across seats as evenly as possible, at random. */
const defaultMatrix = (seats: { id: string }[], models: string[]): Matrix => {
  const matrix: Matrix = {};
  seats.forEach((seat) => (matrix[seat.id] = []));
  if (!seats.length) return matrix;
  shuffle(models).forEach((model, index) => {
    matrix[seats[index % seats.length].id].push(model);
  });
  return matrix;
};

const branchCount = (matrix: Matrix, seats: { id: string }[]) =>
  seats.reduce((total, seat) => total * (matrix[seat.id]?.length ?? 0), 1);

export function PlaySetup() {
  const navigate = useNavigate();
  const [state, setState] = useState<CatalogState>({ phase: "loading" });
  const [scenarioId, setScenarioId] = useState("");
  const [matrix, setMatrix] = useState<Matrix>({});
  const [narrator, setNarrator] = useState("");
  const [judges, setJudges] = useState<string[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>("median");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catalogRes, sessionsRes] = await Promise.all([
          fetch("/api/play/catalog"),
          fetch("/api/play"),
        ]);
        if (!catalogRes.ok) throw new Error(`catalog ${catalogRes.status}`);
        const catalog = (await catalogRes.json()) as PlayCatalog;
        const sessions = sessionsRes.ok
          ? ((await sessionsRes.json()) as PlaySession[])
          : [];
        if (cancelled) return;
        setState({ phase: "ready", catalog, sessions });
        const first = catalog.scenarios[0];
        if (first) {
          setScenarioId(first.id);
          setMatrix(defaultMatrix(first.seats, catalog.starting));
        }
        setJudges(catalog.starting);
        setNarrator(catalog.narrator);
      } catch (err) {
        if (!cancelled)
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : "fetch failed",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scenario =
    state.phase === "ready"
      ? state.catalog.scenarios.find((s) => s.id === scenarioId)
      : undefined;

  const focalSeats = new Set(
    scenario?.decisionPoints.map((point) => point.seat) ?? [],
  );

  const chooseScenario = (id: string) => {
    if (state.phase !== "ready") return;
    const next = state.catalog.scenarios.find((s) => s.id === id);
    if (!next) return;
    setScenarioId(id);
    setMatrix(defaultMatrix(next.seats, state.catalog.starting));
  };

  const toggleJudge = (model: string) =>
    setJudges((current) =>
      current.includes(model)
        ? current.filter((m) => m !== model)
        : [...current, model],
    );

  const toggle = (seatId: string, model: string) =>
    setMatrix((current) => {
      const picks = current[seatId] ?? [];
      return {
        ...current,
        [seatId]: picks.includes(model)
          ? picks.filter((m) => m !== model)
          : [...picks, model],
      };
    });

  const start = async () => {
    if (!scenario) return;
    setSubmitting(true);
    setError(null);
    const body: PlayRequest = {
      scenario: scenario.id,
      matrix,
      narrator: narrator || undefined,
      panel: { judges, mode: panelMode },
    };
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as PlaySession | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error(
          "error" in json ? json.error : `responded ${res.status}`,
        );
      }
      navigate(`/play/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
      setSubmitting(false);
    }
  };

  const seats = scenario?.seats ?? [];
  const branches = branchCount(matrix, seats);
  // branches with you in at least one seat: all minus the all-model ones
  const modelOnlyBranches = seats.reduce(
    (total, seat) =>
      total *
      (matrix[seat.id] ?? []).filter((model) => model !== HUMAN_MODEL).length,
    1,
  );
  const humanBranches = branches - modelOnlyBranches;
  const humanSeated = seats.some((seat) =>
    matrix[seat.id]?.includes(HUMAN_MODEL),
  );
  const humanJudge = judges.includes(HUMAN_MODEL);
  const humanNarrator = narrator === HUMAN_MODEL;
  const models = [
    ...new Set(
      Object.values(matrix)
        .flat()
        .filter((model) => model !== HUMAN_MODEL),
    ),
  ];
  const ready = branches > 0 && models.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Warring States Eval
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Play
        </h1>
        <p className="mt-2 max-w-xl text-pretty text-zinc-400">
          Pick the candidates for every seat. The game forks at the start into
          one branch per seat assignment, and each branch plays the whole
          scenario. Seat yourself anywhere to play every turn of the branches
          you sit in, take a chair on the panel, or narrate.
        </p>
      </header>

      {state.phase === "loading" && (
        <p className="mt-12 font-plex-mono text-xs text-zinc-600">loading…</p>
      )}
      {state.phase === "error" && (
        <p className="mt-12 font-plex-mono text-xs text-red-400">
          failed to load the play catalog — {state.message}
        </p>
      )}

      {state.phase === "ready" && scenario && (
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-6">
            <Card label="Scenario">
              <select
                value={scenarioId}
                onChange={(event) => chooseScenario(event.target.value)}
                className={selectClass}
              >
                {state.catalog.scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-sm text-zinc-400">{scenario.summary}</p>
              <p className="mt-3 border-l border-brand-terminal/40 pl-3 text-sm text-zinc-300">
                <span className="mr-2 font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
                  Simulates
                </span>
                {scenario.simulates}
              </p>
              <p className="mt-3 font-plex-mono text-[11px] text-zinc-500">
                {scenario.turnCount} turns · {scenario.seats.length} seats
                {" · "}
                <Link
                  to={`/scenarios/${scenario.id}`}
                  className="text-card-accent hover:text-white"
                >
                  read the materials
                </Link>
              </p>
            </Card>

            <Card label="Seats: candidates per seat">
              <div className="space-y-5">
                {scenario.seats.map((seat) => (
                  <div
                    key={seat.id}
                    className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]"
                  >
                    <span className="flex items-start gap-x-2 pt-0.5 text-sm text-zinc-200">
                      <GitFork
                        className="mt-1 size-3 text-brand-terminal"
                        strokeWidth={2}
                      />
                      <span>
                        {seat.name}
                        {focalSeats.has(seat.id) && (
                          <span className="ml-2 font-plex-mono text-[10px] uppercase tracking-wide text-brand-terminal">
                            focal
                          </span>
                        )}
                        <span className="block font-plex-mono text-[10px] text-zinc-600">
                          {matrix[seat.id]?.length ?? 0} candidates
                        </span>
                      </span>
                    </span>
                    <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {state.catalog.models.map((model) => (
                        <Pick
                          key={model}
                          checked={matrix[seat.id]?.includes(model) ?? false}
                          onChange={() => toggle(seat.id, model)}
                        >
                          {model}
                        </Pick>
                      ))}
                      <Pick
                        checked={
                          matrix[seat.id]?.includes(HUMAN_MODEL) ?? false
                        }
                        onChange={() => toggle(seat.id, HUMAN_MODEL)}
                        accent
                      >
                        <User
                          className="size-3 text-brand-terminal"
                          strokeWidth={2}
                        />
                        you
                      </Pick>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-white/5 pt-4 font-plex-mono text-[11px] text-zinc-500">
                {seats.map((seat) => matrix[seat.id]?.length ?? 0).join(" × ")}{" "}
                = {branches} branches
                {humanSeated && ` · you play ${humanBranches} of them`}.
                {humanSeated &&
                  " Who holds the other seats stays hidden from you until the game completes."}
              </p>
            </Card>

            <Card label="Panel: who adjudicates each turn">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]">
                <span className="flex items-start gap-x-2 pt-0.5 text-sm text-zinc-200">
                  <Gavel
                    className="mt-1 size-3 text-brand-terminal"
                    strokeWidth={2}
                  />
                  <span>
                    Judges
                    <span className="block font-plex-mono text-[10px] text-zinc-600">
                      {judges.length
                        ? `${judges.length} picked`
                        : `default: the ${models.length} seated models`}
                    </span>
                  </span>
                </span>
                <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {state.catalog.models.map((model) => (
                    <Pick
                      key={model}
                      checked={judges.includes(model)}
                      onChange={() => toggleJudge(model)}
                    >
                      {model}
                    </Pick>
                  ))}
                  <Pick
                    checked={humanJudge}
                    onChange={() => toggleJudge(HUMAN_MODEL)}
                    accent
                  >
                    <User
                      className="size-3 text-brand-terminal"
                      strokeWidth={2}
                    />
                    you
                  </Pick>
                  <label className="block sm:col-span-2">
                    <span className={eyebrow}>Mode</span>
                    <select
                      value={panelMode}
                      onChange={(event) =>
                        setPanelMode(event.target.value as PanelMode)
                      }
                      className={selectClass}
                    >
                      {state.catalog.panelModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block font-plex-mono text-[10px] text-zinc-600">
                      how the judges' escalation scores combine
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-5 grid gap-x-4 gap-y-2 border-t border-white/5 pt-4 sm:grid-cols-[10rem_1fr]">
                <span className="flex items-start gap-x-2 pt-0.5 text-sm text-zinc-200">
                  <Feather
                    className="mt-1 size-3 text-brand-terminal"
                    strokeWidth={2}
                  />
                  <span>
                    Narrator
                    <span className="block font-plex-mono text-[10px] text-zinc-600">
                      resolves each turn after the panel scores it
                    </span>
                  </span>
                </span>
                <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {state.catalog.models.map((model) => (
                    <Pick
                      key={model}
                      kind="radio"
                      checked={narrator === model}
                      onChange={() => setNarrator(model)}
                    >
                      {model}
                    </Pick>
                  ))}
                  <Pick
                    kind="radio"
                    checked={humanNarrator}
                    onChange={() => setNarrator(HUMAN_MODEL)}
                    accent
                  >
                    <User
                      className="size-3 text-brand-terminal"
                      strokeWidth={2}
                    />
                    you
                  </Pick>
                </div>
              </div>
              {(humanJudge || humanNarrator) && (
                <p className="mt-5 border-t border-white/5 pt-4 font-plex-mono text-[11px] text-zinc-500">
                  Every turn of every branch waits for you to{" "}
                  {humanJudge && "score it"}
                  {humanJudge && humanNarrator && " and "}
                  {humanNarrator && "narrate it"}.
                </p>
              )}
            </Card>

            {error && (
              <p className="font-plex-mono text-xs text-red-400">{error}</p>
            )}
            <button
              type="button"
              disabled={submitting || !ready}
              onClick={() => void start()}
              className="flex cursor-pointer items-center gap-x-2 rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlayIcon className="size-4" strokeWidth={2} />
              {submitting
                ? "starting…"
                : `Start ${branches} ${branches === 1 ? "branch" : "branches"}`}
            </button>
          </div>

          <aside className="space-y-3">
            <p className={eyebrow}>Sessions</p>
            {state.sessions.length === 0 && (
              <p className="text-sm text-zinc-500">
                None yet this server session.
              </p>
            )}
            {state.sessions.map((session) => (
              <Link
                key={session.id}
                to={`/play/${session.id}`}
                className="block rounded-sm border border-white/10 bg-surface-ink/40 px-3 py-2 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-plex-mono text-xs text-zinc-200">
                    {session.id}
                  </span>
                  <StatusChip status={session.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {session.scenarioTitle} · {session.branchCount} branches
                  {session.pending.length > 0 &&
                    ` · ${session.pending.length} waiting on you`}
                </p>
              </Link>
            ))}
          </aside>
        </div>
      )}
    </div>
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

// -------------------------------------------------------------- console page

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
          <Link to="/play" className="hover:text-white">
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
                    <Link to={`/runs/${runId}`} className="hover:text-white">
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
                  <BriefCard
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
                      <BriefCard
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

function BriefCard({
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
          <BriefCard key={brief.seat} brief={brief} title={brief.seat} />
        ))}
      </div>
    </>
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
const selectClass =
  "mt-1 w-full rounded-sm border border-white/10 bg-surface-base px-2 py-1.5 font-plex-mono text-xs text-zinc-200 focus:border-brand-terminal focus:outline-none";
const inputClass =
  "mt-1 w-full rounded-sm border border-white/10 bg-surface-base px-3 py-2 text-sm text-zinc-100 focus:border-brand-terminal focus:outline-none";

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-sm border border-white/10 bg-surface-ink/40">
      <div className="border-b border-white/5 px-4 pt-3 pb-2">
        <span className={eyebrow}>{label}</span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

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
