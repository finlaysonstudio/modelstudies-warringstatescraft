import { clsx } from "clsx";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Run, RunIndexEntry } from "../lib/types";

interface Loaded {
  root: Run;
  children: Run[];
}

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; roots: Loaded[]; dropped: Dropped[] };

/** a requested root that did not join the view, and why */
interface Dropped {
  id: string;
  reason: string;
}

// Seven categorical hues stepped for a dark surface (validated adjacent-pair
// CVD order). Assigned to an axis's values in matrix order, fixed, never
// cycled: a filter that hides a value does not repaint the others.
const HOVER_DELAY_MS = 80;
const SERIES = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
];

const short = (model: string) => model.split("/").pop() ?? model;

/**
 * Judging identity of a run: the panel's judges and combining method. Runs
 * recorded before `panel` and `narrator` were stored are read back off their
 * own turns, which name the judges that scored them.
 */
const panelKey = (run: Run) => {
  if (run.panel) {
    return `${run.panel.mode}|${run.panel.judges.join(",")}`;
  }
  const adjudication = (run.turns ?? []).find(
    (turn) => turn.adjudication,
  )?.adjudication;
  if (!adjudication) {
    return "";
  }
  const judges = [
    ...new Set(adjudication.panel.map((verdict) => verdict.model)),
  ];
  return `${adjudication.mode ?? "unrecorded mode"}|${judges.join(",")}`;
};

const panelLabel = (key: string, withMode: boolean) => {
  if (!key) {
    return "unadjudicated";
  }
  const [mode, judges] = key.split("|");
  const names = judges ? judges.split(",").map(short).join("+") : "no judges";
  return withMode ? `${names} · ${mode}` : names;
};

const fetchRun = async (id: string): Promise<Run> => {
  const res = await fetch(`/data/runs/${encodeURIComponent(id)}.json`);
  if (!res.ok) {
    throw new Error(`${id} responded ${res.status}`);
  }
  return (await res.json()) as Run;
};

const loadRoot = async (id: string): Promise<Loaded> => {
  const root = await fetchRun(id);
  const children = await Promise.all((root.children ?? []).map(fetchRun));
  return { root, children };
};

// Matrix view: one root forked at start into every seat × model combination.
// `?with=` combines further matrix roots of the same scenario into the same
// chart, so a judging panel run twice, or two complementary matrices, read as
// one population. Filters select values per axis (seat, judging panel, source
// root); the chart draws each surviving branch's escalation trajectory.
export function MatrixView() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const withParam = params.get("with") ?? "";
  const withIds = useMemo(
    () =>
      [
        ...new Set(
          withParam
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        ),
      ].filter((other) => other !== id),
    [withParam, id],
  );
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  const setWith = (ids: string[]) => {
    const next = new URLSearchParams(params);
    if (ids.length) {
      next.set("with", ids.join(","));
    } else {
      next.delete("with");
    }
    setParams(next);
  };

  const combineKey = `${id ?? ""}::${withIds.join(",")}`;
  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    setState({ phase: "loading" });
    (async () => {
      try {
        const primary = await loadRoot(id);
        const dropped: Dropped[] = [];
        const roots: Loaded[] = [primary];
        // A failed or mismatched companion is dropped with a note rather than
        // failing the page: the primary root still renders.
        for (const other of withIds) {
          try {
            const loaded = await loadRoot(other);
            if (loaded.root.scenario !== primary.root.scenario) {
              dropped.push({
                id: other,
                reason: `scenario ${loaded.root.scenario || "unknown"} does not match ${primary.root.scenario}`,
              });
              continue;
            }
            roots.push(loaded);
          } catch (error) {
            dropped.push({
              id: other,
              reason: error instanceof Error ? error.message : "fetch failed",
            });
          }
        }
        if (!cancelled) {
          setState({ phase: "ready", roots, dropped });
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
  }, [combineKey]);

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
          failed to load matrix — {state.message}
        </p>
      </div>
    );
  }
  return (
    <MatrixBody
      roots={state.roots}
      dropped={state.dropped}
      withIds={withIds}
      setWith={setWith}
    />
  );
}

function MatrixBody({
  roots,
  dropped,
  withIds,
  setWith,
}: {
  roots: Loaded[];
  dropped: Dropped[];
  withIds: string[];
  setWith: (ids: string[]) => void;
}) {
  const primary = roots[0].root;
  const ladder = primary.escalationLadder ?? [];
  const branches = useMemo(
    () =>
      roots.flatMap(({ children }) =>
        children.map((run) => ({
          run,
          path: (run.turns ?? []).map((turn) => turn.adjudication?.escalation),
        })),
      ),
    [roots],
  );

  // Seat axes come from the roots' matrices, unioned in first-seen order;
  // fall back to whatever the children actually used so a run without
  // `matrix` still renders.
  const seatAxes = useMemo<Axis[]>(() => {
    const seats = new Map<string, string[]>();
    const add = (seat: string, models: string[]) => {
      const seen = seats.get(seat) ?? [];
      seats.set(seat, [...seen, ...models.filter((m) => !seen.includes(m))]);
    };
    for (const { root, children } of roots) {
      if (root.matrix) {
        for (const [seat, models] of Object.entries(root.matrix)) {
          add(seat, models);
        }
        continue;
      }
      for (const child of children) {
        for (const [seat, model] of Object.entries(child.roster ?? {})) {
          add(seat, [model]);
        }
      }
    }
    return [...seats.entries()].map(([seat, models]) => ({
      id: seat,
      kind: "seat" as const,
      label: seat,
      values: models,
      valueOf: (run: Run) => run.roster?.[seat] ?? "",
      labelOf: short,
    }));
  }, [roots]);

  // Judging axis: judges × combining method. Present only when the combined
  // roots were adjudicated more than one way; pooling branches judged
  // differently without saying so would misread as one population.
  const panelAxis = useMemo<Axis | null>(() => {
    const keys = [...new Set(branches.map(({ run }) => panelKey(run)))];
    if (keys.length < 2) {
      return null;
    }
    const modes = new Set(keys.map((key) => key.split("|")[0]));
    return {
      id: "panel",
      kind: "panel",
      label: "judging panel",
      values: keys,
      valueOf: (run: Run) => panelKey(run),
      labelOf: (key: string) => panelLabel(key, modes.size > 1),
    };
  }, [branches]);

  // Source axis: which matrix root a branch came from. Present only when more
  // than one root is combined; two roots may share a panel and still differ.
  const rootAxis = useMemo<Axis | null>(() => {
    if (roots.length < 2) {
      return null;
    }
    return {
      id: "root",
      kind: "root",
      label: "source root",
      values: roots.map(({ root }) => root.id),
      valueOf: (run: Run) => run.branch?.parent ?? "",
      labelOf: (value: string) => value,
    };
  }, [roots]);

  const axes = useMemo(
    () => [
      ...seatAxes,
      ...(panelAxis ? [panelAxis] : []),
      ...(rootAxis ? [rootAxis] : []),
    ],
    [seatAxes, panelAxis, rootAxis],
  );
  const signature = axes
    .map((axis) => `${axis.id}:${axis.values.join("|")}`)
    .join(";");

  // Selection survives combining: values already on screen keep their state,
  // values a newly combined root introduces arrive selected.
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const known = useRef<Record<string, string[]>>({});
  useEffect(() => {
    // a pinned branch may have left with the root that carried it
    setPin(null);
    setHover(null);
    setSelected((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const axis of axes) {
        const before = prev[axis.id];
        const seen = known.current[axis.id] ?? [];
        next[axis.id] = new Set(
          axis.values.filter(
            (value) => !before || !seen.includes(value) || before.has(value),
          ),
        );
        known.current[axis.id] = axis.values;
      }
      return next;
    });
  }, [signature]);
  const isOn = (axis: Axis, value: string) =>
    selected[axis.id]?.has(value) ?? true;

  // default to the axis with the most values (the most informative hue)
  const defaultAxis =
    axes.reduce(
      (best, axis) =>
        axis.values.length > (best?.values.length ?? 0) ? axis : best,
      axes[0] as Axis | undefined,
    )?.id ?? "";
  const [colorBy, setColorBy] = useState<ColorBy>({
    kind: "axis",
    axis: defaultAxis,
  });
  const [split, setSplit] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  // a clicked (turn, rung) point; branches passing through it are isolated
  const [pin, setPin] = useState<Pin | null>(null);
  const models = useMemo(
    () => [...new Set(seatAxes.flatMap((axis) => axis.values))],
    [seatAxes],
  );

  const toggle = (axis: Axis, value: string) => {
    setSelected((prev) => {
      const next = new Set(prev[axis.id] ?? axis.values);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [axis.id]: next };
    });
  };
  const only = (axis: Axis, value: string) => {
    setSelected((prev) => ({ ...prev, [axis.id]: new Set([value]) }));
  };

  const visible = branches.filter(({ run }) =>
    axes.every((axis) => isOn(axis, axis.valueOf(run))),
  );

  const byAxis = (axis: Axis): Grouping => ({
    title: `colored by ${axis.label}`,
    groups: axis.values.map((value, index) => ({
      key: value,
      label: axis.labelOf(value),
      color: SERIES[index % SERIES.length],
    })),
    keyOf: axis.valueOf,
  });
  const byModel = (model: string): Grouping => {
    // a model can fill several seats in one branch; key by every seat it
    // holds so those branches form their own group
    const keyOf = (run: Run) =>
      seatAxes
        .filter((axis) => axis.valueOf(run) === model)
        .map((axis) => axis.id)
        .join("+");
    const combos = [...new Set(visible.map(({ run }) => keyOf(run)))].filter(
      (key) => key.includes("+"),
    );
    return {
      title: `colored by ${short(model)} · any seat`,
      groups: [
        { key: "", label: `no ${short(model)}`, color: "#71717a", muted: true },
        ...seatAxes.map((axis, index) => ({
          key: axis.id,
          label: `as ${axis.id}`,
          color: SERIES[index % SERIES.length],
        })),
        ...combos.map((key, index) => ({
          key,
          label: `as ${key}`,
          color: SERIES[(seatAxes.length + index) % SERIES.length],
        })),
      ],
      keyOf,
    };
  };
  const axisById = (id: string) =>
    axes.find((axis) => axis.id === id) ?? axes[0];
  const grouping =
    colorBy.kind === "axis"
      ? byAxis(axisById(colorBy.axis))
      : byModel(colorBy.model);

  // Cell census. Combining complementary matrices unions their candidate
  // lists, so the product implies combinations nobody played: state how many
  // of the implied cells are covered, and how many were played twice.
  const { repeats, covered, cells } = useMemo(() => {
    const seen = new Set<string>();
    let repeated = 0;
    for (const { run } of branches) {
      const cell = `${seatAxes.map((axis) => axis.valueOf(run)).join("|")}::${panelKey(run)}`;
      if (seen.has(cell)) {
        repeated += 1;
      }
      seen.add(cell);
    }
    const panels = new Set(branches.map(({ run }) => panelKey(run))).size;
    return {
      repeats: repeated,
      covered: seen.size,
      cells: seatAxes.reduce(
        (product, axis) => product * axis.values.length,
        Math.max(panels, 1),
      ),
    };
  }, [branches, seatAxes]);
  const narrators = [
    ...new Set(branches.map(({ run }) => run.narrator ?? "").filter(Boolean)),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Matrix · {roots.map(({ root }) => root.id).join(" + ")}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {primary.scenarioTitle || primary.scenario}
        </h1>
        <p className="mt-2 font-plex-mono text-xs text-zinc-500">
          {branches.length} branches
          {roots.length > 1 ? ` from ${roots.length} roots` : ""} ·{" "}
          {visible.length} shown ·{" "}
          <Link
            to={`/craft/replays/${primary.id}`}
            className="cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            ↩ root replay
          </Link>
        </p>
        {(repeats > 0 || covered < cells || narrators.length > 1) && (
          <p className="mt-1 font-plex-mono text-[10px] text-zinc-600">
            {[
              covered < cells &&
                `${covered} of ${cells} cells covered (seats × panel)`,
              repeats > 0 &&
                `${repeats} cell${repeats === 1 ? "" : "s"} played twice`,
              narrators.length > 1 &&
                `narrators differ: ${narrators.map(short).join(", ")}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {dropped.length > 0 && (
          <p className="mt-1 font-plex-mono text-[10px] text-amber-300">
            not combined —{" "}
            {dropped.map((drop) => `${drop.id} (${drop.reason})`).join(", ")}
          </p>
        )}
      </header>

      <CombinePicker
        primary={primary}
        withIds={withIds}
        setWith={setWith}
        combined={roots.slice(1).map(({ root }) => root.id)}
      />

      <section
        className="animate-rise mt-8 motion-reduce:animate-none"
        style={{ animationDelay: "60ms" }}
        aria-label="Filters"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {axes.map((axis) => (
            <div key={axis.id}>
              <button
                type="button"
                onClick={() => setColorBy({ kind: "axis", axis: axis.id })}
                aria-pressed={
                  colorBy.kind === "axis" && colorBy.axis === axis.id
                }
                title={`color by ${axis.label}`}
                className={clsx(
                  "cursor-pointer font-plex-mono text-xs tracking-wide uppercase transition-colors",
                  colorBy.kind === "axis" && colorBy.axis === axis.id
                    ? "text-brand-terminal"
                    : "text-card-accent hover:text-zinc-200",
                )}
              >
                {axis.label}
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {axis.values.map((value, index) => {
                  const on = isOn(axis, value);
                  const swatch =
                    colorBy.kind === "axis" && colorBy.axis === axis.id
                      ? SERIES[index % SERIES.length]
                      : undefined;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggle(axis, value)}
                      onDoubleClick={() => only(axis, value)}
                      aria-pressed={on}
                      title={`${axis.labelOf(value)} · double-click to show only`}
                      className={clsx(
                        "flex max-w-full cursor-pointer items-center gap-x-1.5 rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                        on
                          ? "border-white/20 bg-white/[0.06] text-zinc-200"
                          : "border-white/10 text-zinc-600 line-through hover:text-zinc-400",
                      )}
                    >
                      {swatch && (
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: swatch,
                            opacity: on ? 1 : 0.3,
                          }}
                        />
                      )}
                      <span className="truncate">{axis.labelOf(value)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="animate-rise mt-8 motion-reduce:animate-none"
        style={{ animationDelay: "90ms" }}
        aria-label="Compare across seats"
      >
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Color by model · any seat
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {models.map((model) => {
            const on = colorBy.kind === "model" && colorBy.model === model;
            return (
              <button
                key={model}
                type="button"
                onClick={() =>
                  setColorBy(
                    on
                      ? { kind: "axis", axis: defaultAxis }
                      : { kind: "model", model },
                  )
                }
                aria-pressed={on}
                className={clsx(
                  "cursor-pointer rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                  on
                    ? "border-brand-terminal/40 text-brand-terminal"
                    : "border-white/10 text-zinc-500 hover:text-zinc-200",
                )}
              >
                {short(model)}
              </button>
            );
          })}
        </div>
      </section>

      {/* the split toggle sits on the full chart; split panels zoom on click */}
      <SplitToggle.Provider
        value={{ split, toggle: () => setSplit((v) => !v) }}
      >
        {split ? (
          <div
            className={clsx(
              "grid gap-6 lg:grid-cols-3",
              pin ? "mt-3" : "mt-10",
            )}
          >
            {axes.map((axis, index) => (
              <ChartPanel
                key={axis.id}
                delay={120 + index * 40}
                branches={visible}
                ladder={ladder}
                grouping={byAxis(axis)}
                hover={hover}
                setHover={setHover}
                pin={pin}
                setPin={setPin}
                compact
                onZoom={() => {
                  setColorBy({ kind: "axis", axis: axis.id });
                  setSplit(false);
                }}
              />
            ))}
          </div>
        ) : (
          <ChartPanel
            delay={120}
            branches={visible}
            ladder={ladder}
            grouping={grouping}
            hover={hover}
            setHover={setHover}
            pin={pin}
            setPin={setPin}
          />
        )}
      </SplitToggle.Provider>

      <section
        className="animate-rise mt-10 motion-reduce:animate-none"
        style={{ animationDelay: "180ms" }}
        aria-label="Branches"
      >
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Branches
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse font-plex-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] tracking-wide text-zinc-500 uppercase">
                <th className="py-2 pr-4 text-left font-normal">run</th>
                {axes.map((axis) => (
                  <th key={axis.id} className="py-2 pr-4 text-left font-normal">
                    {axis.label}
                  </th>
                ))}
                <th className="py-2 pr-4 text-left font-normal">trajectory</th>
                <th className="py-2 pr-4 text-right font-normal">peak</th>
                <th className="py-2 text-right font-normal">final</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ run, path }) => {
                const numeric = path.filter(
                  (v): v is number => typeof v === "number",
                );
                const peak = numeric.length ? Math.max(...numeric) : null;
                const final = numeric.length
                  ? numeric[numeric.length - 1]
                  : null;
                return (
                  <tr
                    key={run.id}
                    onMouseEnter={() => setHover(run.id)}
                    onMouseLeave={() => setHover(null)}
                    className={clsx(
                      "border-b border-white/5 transition-opacity",
                      hover === run.id && "bg-white/[0.04]",
                      !through(pin, { run, path }) && "opacity-30",
                      through(pin, { run, path }) &&
                        mutedInGroup(grouping, run) &&
                        "opacity-40",
                      pin &&
                        through(pin, { run, path }) &&
                        "bg-amber-400/[0.06]",
                    )}
                  >
                    <td className="py-1.5 pr-4">
                      <Link
                        to={`/craft/replays/${run.id}`}
                        className="flex cursor-pointer items-center gap-x-2 text-zinc-300 hover:text-white"
                      >
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: colorOfGroup(grouping, run),
                          }}
                        />
                        {run.id}
                      </Link>
                    </td>
                    {axes.map((axis) => (
                      <td
                        key={axis.id}
                        title={axis.labelOf(axis.valueOf(run))}
                        className={clsx(
                          "py-1.5 pr-4",
                          colorBy.kind === "axis" && axis.id === colorBy.axis
                            ? "text-zinc-200"
                            : "text-zinc-500",
                        )}
                      >
                        {axis.labelOf(axis.valueOf(run))}
                      </td>
                    ))}
                    <td className="py-1.5 pr-4 text-zinc-400">
                      {path.map((v) => v ?? "·").join(" › ")}
                    </td>
                    <td className="py-1.5 pr-4 text-right text-zinc-300">
                      {peak ?? "—"}
                    </td>
                    <td className="py-1.5 text-right text-zinc-300">
                      {final ?? "—"}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={axes.length + 4} className="py-4 text-zinc-600">
                    no branches match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {ladder.length > 0 && (
          <p className="mt-3 font-plex-mono text-[10px] text-zinc-600">
            {ladder.map((label, i) => `${i} ${label}`).join(" · ")}
          </p>
        )}
      </section>
    </div>
  );
}

// Other matrix roots of the same scenario, from the runs index. Toggling one
// writes `?with=` and the view reloads with it combined.
function CombinePicker({
  primary,
  withIds,
  setWith,
  combined,
}: {
  primary: Run;
  withIds: string[];
  setWith: (ids: string[]) => void;
  combined: string[];
}) {
  const [candidates, setCandidates] = useState<RunIndexEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/runs.json");
        if (!res.ok) {
          return;
        }
        const runs = (await res.json()) as RunIndexEntry[];
        if (!cancelled) {
          setCandidates(
            runs.filter(
              (run) =>
                run.matrix !== undefined &&
                run.id !== primary.id &&
                run.scenario === primary.scenario,
            ),
          );
        }
      } catch {
        // index unavailable: the picker simply stays empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [primary.id, primary.scenario]);

  if (candidates.length === 0) {
    return null;
  }
  const toggle = (id: string) =>
    setWith(
      withIds.includes(id)
        ? withIds.filter((other) => other !== id)
        : [...withIds, id],
    );
  return (
    <section
      className="animate-rise mt-8 motion-reduce:animate-none"
      style={{ animationDelay: "40ms" }}
      aria-label="Combine roots"
    >
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Combine roots · same scenario
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-sm border border-brand-terminal/40 px-2 py-0.5 font-plex-mono text-[10px] tracking-wide text-brand-terminal">
          {primary.id} · primary
        </span>
        {candidates.map((run) => {
          const on = combined.includes(run.id);
          const requested = withIds.includes(run.id);
          const judges = run.panel?.judges ?? [];
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => toggle(run.id)}
              aria-pressed={on}
              title={
                judges.length
                  ? `${judges.join(", ")} · ${run.panel?.mode ?? ""}`
                  : "no panel recorded"
              }
              className={clsx(
                "cursor-pointer rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                on
                  ? "border-white/20 bg-white/[0.06] text-zinc-200"
                  : requested
                    ? "border-amber-400/40 text-amber-300"
                    : "border-white/10 text-zinc-500 hover:text-zinc-200",
              )}
            >
              {on ? "− " : "+ "}
              {run.id} · {run.childrenCount} branches
              {judges.length
                ? ` · ${judges.map(short).join("+")} · ${run.panel?.mode ?? ""}`
                : ""}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface Branch {
  run: Run;
  path: (number | undefined)[];
}

/** one comparison dimension: a seat, the judging panel, or the source root */
interface Axis {
  id: string;
  kind: "seat" | "panel" | "root";
  label: string;
  /** every value present across the combined roots, in first-seen order */
  values: string[];
  valueOf: (run: Run) => string;
  labelOf: (value: string) => string;
}

type ColorBy =
  { kind: "axis"; axis: string } | { kind: "model"; model: string };

/** isolate either every branch through a (turn, rung) node or one branch */
type Pin = { turn: number; rung: number } | { run: string };

function isNodePin(pin: Pin): pin is { turn: number; rung: number } {
  return "turn" in pin;
}

function through(pin: Pin | null, branch: Branch) {
  if (pin === null) return true;
  if (isNodePin(pin)) return branch.path[pin.turn] === pin.rung;
  return branch.run.id === pin.run;
}

interface Group {
  key: string;
  label: string;
  color: string;
  /** group is background context: hidden from the graph and its rows dimmed */
  muted?: boolean;
}

interface Grouping {
  title: string;
  groups: Group[];
  keyOf: (run: Run) => string;
}

function groupOf(grouping: Grouping, run: Run) {
  const key = grouping.keyOf(run);
  return grouping.groups.find((g) => g.key === key);
}

function colorOfGroup(grouping: Grouping, run: Run) {
  return groupOf(grouping, run)?.color ?? "#a1a1aa";
}

function mutedInGroup(grouping: Grouping, run: Run) {
  return groupOf(grouping, run)?.muted === true;
}

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

const SplitToggle = createContext<{ split: boolean; toggle: () => void }>({
  split: false,
  toggle: () => {},
});

function SplitButton() {
  const { split, toggle } = useContext(SplitToggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={split}
      className={clsx(
        "cursor-pointer font-plex-mono text-xs tracking-wide uppercase transition-colors",
        split ? "text-brand-terminal" : "text-zinc-500 hover:text-zinc-200",
      )}
    >
      split by dimension
    </button>
  );
}

// One chart plus its legend with per-group stats (n, mean final, mean peak).
function ChartPanel({
  delay,
  branches,
  ladder,
  grouping,
  hover,
  setHover,
  pin,
  setPin,
  compact = false,
  onZoom,
}: {
  delay: number;
  branches: Branch[];
  ladder: string[];
  grouping: Grouping;
  hover: string | null;
  setHover: (id: string | null) => void;
  pin: Pin | null;
  setPin: (pin: Pin | null) => void;
  compact?: boolean;
  /** compact panels: click the header to zoom into this grouping */
  onZoom?: () => void;
}) {
  const summary = grouping.groups
    .map((group) => {
      const rows = branches.filter(
        ({ run }) => grouping.keyOf(run) === group.key,
      );
      const numeric = rows
        .map(({ path }) =>
          path.filter((v): v is number => typeof v === "number"),
        )
        .filter((p) => p.length > 0);
      return {
        ...group,
        count: rows.length,
        meanFinal: mean(numeric.map((p) => p[p.length - 1])),
        meanPeak: mean(numeric.map((p) => Math.max(...p))),
      };
    })
    .filter((g) => g.count > 0);
  return (
    <section
      className={clsx(
        "animate-rise motion-reduce:animate-none",
        !compact && "mt-10",
      )}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`Escalation trajectories ${grouping.title}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          {compact ? grouping.title : `Escalation by turn · ${grouping.title}`}
        </p>
        {!onZoom && <SplitButton />}
      </div>
      <div
        onClick={onZoom}
        title={onZoom ? "click to zoom" : undefined}
        className={clsx(
          "relative mt-3 overflow-x-auto rounded-sm border border-white/10 bg-white/[0.02] p-4",
          onZoom &&
            "cursor-zoom-in transition-colors hover:border-white/25 hover:bg-white/[0.04]",
        )}
      >
        {/* always rendered (invisible when unpinned) so the chart never shifts */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setPin(null);
          }}
          tabIndex={pin ? 0 : -1}
          aria-hidden={!pin}
          className={clsx(
            "absolute top-2 right-3 z-10 cursor-pointer font-plex-mono text-[10px] text-amber-300 uppercase hover:text-amber-200",
            !pin && "invisible",
          )}
        >
          ✕{" "}
          {pin && !isNodePin(pin)
            ? `only ${pin.run}`
            : `through turn ${(pin && isNodePin(pin) ? pin.turn : 0) + 1} · rung ${pin && isNodePin(pin) ? pin.rung : 0} (${branches.filter((branch) => through(pin, branch)).length})`}
        </button>
        <Trajectories
          branches={branches}
          ladder={ladder}
          colorOf={(run) => colorOfGroup(grouping, run)}
          mutedOf={(run) => mutedInGroup(grouping, run)}
          hover={hover}
          setHover={setHover}
          pin={pin}
          setPin={setPin}
          compact={compact}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {summary.map(({ key, label, color, count, meanFinal, meanPeak }) => (
          <span
            key={key}
            title={label}
            className="flex items-center gap-x-1.5 font-plex-mono text-[10px] text-zinc-400"
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
            <span className="text-zinc-600">
              n={count}
              {meanFinal !== null && ` · final ${meanFinal.toFixed(1)}`}
              {meanPeak !== null && ` · peak ${meanPeak.toFixed(1)}`}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}

// Line chart: x = turn, y = escalation rung. Lines are jittered a hair by
// branch index so identical trajectories do not fully occlude each other.
function Trajectories({
  branches,
  ladder,
  colorOf,
  mutedOf = () => false,
  hover,
  setHover,
  pin,
  setPin,
  compact = false,
}: {
  branches: Branch[];
  ladder: string[];
  colorOf: (run: Run) => string;
  mutedOf?: (run: Run) => boolean;
  hover: string | null;
  setHover: (id: string | null) => void;
  pin: Pin | null;
  setPin: (pin: Pin | null) => void;
  compact?: boolean;
}) {
  // Debounce hover so brushing across neighbouring tracks does not flicker.
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSoon = (id: string | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHover(id), HOVER_DELAY_MS);
  };
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  // Coincident paths: give each color its own band so overlapping groups sit
  // side by side instead of the last-drawn color covering the rest, and
  // interleave draw order across groups so no color wins by default.
  const ordered = useMemo(() => {
    const groups = new Map<string, Branch[]>();
    for (const branch of branches) {
      if (mutedOf(branch.run)) continue;
      const color = colorOf(branch.run);
      groups.set(color, [...(groups.get(color) ?? []), branch]);
    }
    const keys = [...groups.keys()];
    const band = keys.length > 1 ? 4 : 0;
    const out: (Branch & { jitter: number })[] = [];
    const longest = Math.max(0, ...[...groups.values()].map((g) => g.length));
    for (let i = 0; i < longest; i += 1) {
      keys.forEach((key, g) => {
        const branch = groups.get(key)?.[i];
        if (!branch) return;
        const offset = (g - (keys.length - 1) / 2) * band;
        out.push({ ...branch, jitter: offset + ((i % 5) - 2) * 0.6 });
      });
    }
    return out;
  }, [branches, colorOf, mutedOf]);
  // every (turn, rung) some branch passes through: a clickable node
  const nodes = new Map<
    string,
    { turn: number; rung: number; count: number }
  >();
  for (const { path } of branches) {
    path.forEach((rung, turn) => {
      if (typeof rung !== "number") {
        return;
      }
      const key = `${turn}:${rung}`;
      const node = nodes.get(key) ?? { turn, rung, count: 0 };
      node.count += 1;
      nodes.set(key, node);
    });
  }
  const turns = Math.max(0, ...branches.map(({ path }) => path.length));
  const rungs = Math.max(
    ladder.length,
    1 +
      Math.max(
        0,
        ...branches.flatMap(({ path }) =>
          path.filter((v): v is number => typeof v === "number"),
        ),
      ),
  );
  const W = compact ? 420 : 880;
  const H = compact ? 240 : 320;
  const left = compact ? 28 : 190;
  const right = 24;
  const top = 16;
  const bottom = 32;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const x = (turn: number) =>
    left + (turns > 1 ? (turn / (turns - 1)) * plotW : plotW / 2);
  const y = (rung: number) =>
    top + plotH - (rungs > 1 ? (rung / (rungs - 1)) * plotH : plotH / 2);

  if (turns === 0) {
    return (
      <p className="font-plex-mono text-xs text-zinc-600">
        no adjudicated turns to plot
      </p>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={clsx("h-auto w-full", !compact && "min-w-[640px]")}
      role="img"
      aria-label="Escalation rung per turn for each visible branch"
    >
      {Array.from({ length: rungs }, (_, rung) => (
        <g key={rung}>
          <line
            x1={left}
            x2={W - right}
            y1={y(rung)}
            y2={y(rung)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
          <text
            x={left - 10}
            y={y(rung)}
            dy="0.35em"
            textAnchor="end"
            className="fill-zinc-500 font-plex-mono"
            fontSize={10}
          >
            {rung}
            {!compact && ladder[rung] ? ` ${truncate(ladder[rung], 26)}` : ""}
          </text>
        </g>
      ))}
      {Array.from({ length: turns }, (_, turn) => (
        <text
          key={turn}
          x={x(turn)}
          y={H - 10}
          textAnchor="middle"
          className="fill-zinc-500 font-plex-mono"
          fontSize={10}
        >
          turn {turn + 1}
        </text>
      ))}
      {ordered.map(({ run, path, jitter }) => {
        const points = path
          .map((v, turn) =>
            typeof v === "number" ? `${x(turn)},${y(v) + jitter}` : null,
          )
          .filter((p): p is string => p !== null);
        const dim =
          (hover !== null && hover !== run.id) || !through(pin, { run, path });
        return (
          <g
            key={run.id}
            onMouseEnter={() => hoverSoon(run.id)}
            onMouseLeave={() => hoverSoon(null)}
            onClick={(event) => {
              event.stopPropagation(); // a track isolates its run; the panel zooms
              const isolated =
                pin !== null && !isNodePin(pin) && pin.run === run.id;
              setPin(isolated ? null : { run: run.id });
            }}
            className="cursor-pointer"
          >
            <polyline
              points={points.join(" ")}
              fill="none"
              stroke={colorOf(run)}
              strokeWidth={hover === run.id ? 3 : 2}
              strokeOpacity={dim ? 0.15 : 0.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* fat invisible hit target */}
            <polyline
              points={points.join(" ")}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
            />
            <title>
              {run.id} ·{" "}
              {Object.entries(run.roster)
                .map(([seat, model]) => `${seat}=${short(model)}`)
                .join(" ")}{" "}
              · {path.map((v) => v ?? "·").join(" › ")}
            </title>
          </g>
        );
      })}
      {[...nodes.values()].map(({ turn, rung, count }) => {
        const active =
          pin !== null &&
          isNodePin(pin) &&
          pin.turn === turn &&
          pin.rung === rung;
        return (
          <g
            key={`${turn}:${rung}`}
            onClick={(event) => {
              event.stopPropagation(); // nodes pin; the panel around them zooms
              setPin(active ? null : { turn, rung });
            }}
            className="cursor-pointer"
          >
            {/* hit target; the node itself only shows once pinned */}
            <circle cx={x(turn)} cy={y(rung)} r={14} fill="transparent" />
            {active && (
              <circle
                cx={x(turn)}
                cy={y(rung)}
                r={12}
                fill="#fbbf24"
                stroke="#fbbf24"
                strokeWidth={2}
              />
            )}
            <title>
              turn {turn + 1} · rung {rung} · {count} branch
              {count === 1 ? "" : "es"} · click to isolate
            </title>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
