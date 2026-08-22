import { clsx } from "clsx";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Run } from "../lib/types";

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; root: Run; children: Run[] };

// Seven categorical hues stepped for a dark surface (validated adjacent-pair
// CVD order). Assigned to a seat's candidate models in matrix order, fixed,
// never cycled: a filter that hides a model does not repaint the others.
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

// Matrix view: one root forked at start into every seat × model combination.
// Filters select models per seat; the chart draws each surviving branch's
// escalation trajectory, colored by the model in the "color by" seat.
export function MatrixView() {
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
        const rootRes = await fetch(
          `/data/runs/${encodeURIComponent(id)}.json`,
        );
        if (!rootRes.ok) {
          throw new Error(`run responded ${rootRes.status}`);
        }
        const root = (await rootRes.json()) as Run;
        const children = await Promise.all(
          (root.children ?? []).map(async (childId) => {
            const res = await fetch(
              `/data/runs/${encodeURIComponent(childId)}.json`,
            );
            if (!res.ok) {
              throw new Error(`${childId} responded ${res.status}`);
            }
            return (await res.json()) as Run;
          }),
        );
        if (!cancelled) {
          setState({ phase: "ready", root, children });
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
          failed to load matrix — {state.message}
        </p>
      </div>
    );
  }
  return <MatrixBody root={state.root} children={state.children} />;
}

function MatrixBody({ root, children }: { root: Run; children: Run[] }) {
  // Seats and candidates come from the root's matrix; fall back to whatever
  // the children actually used so a run without `matrix` still renders.
  const matrix = useMemo<Record<string, string[]>>(() => {
    if (root.matrix) {
      return root.matrix;
    }
    const derived: Record<string, Set<string>> = {};
    for (const child of children) {
      for (const [seat, model] of Object.entries(child.roster ?? {})) {
        (derived[seat] ??= new Set()).add(model);
      }
    }
    return Object.fromEntries(
      Object.entries(derived).map(([seat, set]) => [seat, [...set]]),
    );
  }, [root, children]);
  const seats = Object.keys(matrix);
  const ladder = root.escalationLadder ?? [];

  const [selected, setSelected] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(matrix).map(([seat, models]) => [seat, new Set(models)]),
    ),
  );
  // default to the seat with the most candidates (the most informative hue)
  const defaultSeat = seats.reduce(
    (best, seat) =>
      matrix[seat].length > (matrix[best]?.length ?? 0) ? seat : best,
    seats[0] ?? "",
  );
  const [colorBy, setColorBy] = useState<ColorBy>({
    kind: "seat",
    seat: defaultSeat,
  });
  const [split, setSplit] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  // a clicked (turn, rung) point; branches passing through it are isolated
  const [pin, setPin] = useState<Pin | null>(null);
  const through = (path: (number | undefined)[]) =>
    pin === null || path[pin.turn] === pin.rung;
  const models = useMemo(
    () => [...new Set(Object.values(matrix).flat())],
    [matrix],
  );

  const toggle = (seat: string, model: string) => {
    setSelected((prev) => {
      const next = new Set(prev[seat]);
      if (next.has(model)) {
        next.delete(model);
      } else {
        next.add(model);
      }
      return { ...prev, [seat]: next };
    });
  };
  const only = (seat: string, model: string) => {
    setSelected((prev) => ({ ...prev, [seat]: new Set([model]) }));
  };
  const all = (seat: string) => {
    setSelected((prev) => ({ ...prev, [seat]: new Set(matrix[seat]) }));
  };

  const branches = useMemo(
    () =>
      children.map((run) => ({
        run,
        path: (run.turns ?? []).map((turn) => turn.adjudication?.escalation),
      })),
    [children],
  );
  const visible = branches.filter(({ run }) =>
    seats.every((seat) => selected[seat]?.has(run.roster[seat])),
  );
  const bySeat = (seat: string): Grouping => ({
    title: `colored by ${seat}`,
    groups: (matrix[seat] ?? []).map((model, index) => ({
      key: model,
      label: short(model),
      color: SERIES[index % SERIES.length],
    })),
    keyOf: (run) => run.roster[seat] ?? "",
  });
  const byModel = (model: string): Grouping => {
    // a model can fill several seats in one branch; key by every seat it
    // holds so those branches form their own group
    const keyOf = (run: Run) =>
      seats.filter((seat) => run.roster[seat] === model).join("+");
    const combos = [...new Set(visible.map(({ run }) => keyOf(run)))].filter(
      (key) => key.includes("+"),
    );
    return {
      title: `colored by ${short(model)} · any seat`,
      groups: [
        { key: "", label: `no ${short(model)}`, color: "#71717a" },
        ...seats.map((seat, index) => ({
          key: seat,
          label: `as ${seat}`,
          color: SERIES[index % SERIES.length],
        })),
        ...combos.map((key, index) => ({
          key,
          label: `as ${key}`,
          color: SERIES[(seats.length + index) % SERIES.length],
        })),
      ],
      keyOf,
    };
  };
  const grouping =
    colorBy.kind === "seat" ? bySeat(colorBy.seat) : byModel(colorBy.model);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Matrix · {root.id}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {root.scenarioTitle || root.scenario}
        </h1>
        <p className="mt-2 font-plex-mono text-xs text-zinc-500">
          {children.length} branches · {visible.length} shown ·{" "}
          <Link
            to={`/runs/${root.id}`}
            className="cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            ↩ root replay
          </Link>
        </p>
      </header>

      <section
        className="animate-rise mt-10 motion-reduce:animate-none"
        style={{ animationDelay: "60ms" }}
        aria-label="Filters"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {seats.map((seat) => (
            <div key={seat}>
              <div className="flex items-center justify-between">
                <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
                  {seat}
                </p>
                <div className="flex items-center gap-x-3">
                  <button
                    type="button"
                    onClick={() => all(seat)}
                    className="cursor-pointer font-plex-mono text-[10px] text-zinc-500 uppercase hover:text-zinc-200"
                  >
                    all
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorBy({ kind: "seat", seat })}
                    aria-pressed={
                      colorBy.kind === "seat" && colorBy.seat === seat
                    }
                    className={clsx(
                      "cursor-pointer font-plex-mono text-[10px] uppercase",
                      colorBy.kind === "seat" && colorBy.seat === seat
                        ? "text-brand-terminal"
                        : "text-zinc-500 hover:text-zinc-200",
                    )}
                  >
                    color by
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matrix[seat].map((model, index) => {
                  const on = selected[seat]?.has(model) ?? false;
                  const swatch =
                    colorBy.kind === "seat" && colorBy.seat === seat
                      ? SERIES[index % SERIES.length]
                      : undefined;
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => toggle(seat, model)}
                      onDoubleClick={() => only(seat, model)}
                      aria-pressed={on}
                      title={`${model} · double-click to show only`}
                      className={clsx(
                        "flex cursor-pointer items-center gap-x-1.5 rounded-sm border px-2 py-0.5 font-plex-mono text-[10px] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                        on
                          ? "border-white/20 bg-white/[0.06] text-zinc-200"
                          : "border-white/10 text-zinc-600 line-through hover:text-zinc-400",
                      )}
                    >
                      {swatch && (
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor: swatch,
                            opacity: on ? 1 : 0.3,
                          }}
                        />
                      )}
                      {short(model)}
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
                      ? { kind: "seat", seat: defaultSeat }
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
            {seats.map((seat, index) => (
              <Panel
                key={seat}
                delay={120 + index * 40}
                branches={visible}
                ladder={ladder}
                grouping={bySeat(seat)}
                hover={hover}
                setHover={setHover}
                pin={pin}
                setPin={setPin}
                compact
                onZoom={() => {
                  setColorBy({ kind: "seat", seat });
                  setSplit(false);
                }}
              />
            ))}
          </div>
        ) : (
          <Panel
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
                {seats.map((seat) => (
                  <th key={seat} className="py-2 pr-4 text-left font-normal">
                    {seat}
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
                      !through(path) && "opacity-30",
                      pin && through(path) && "bg-amber-400/[0.06]",
                    )}
                  >
                    <td className="py-1.5 pr-4">
                      <Link
                        to={`/runs/${run.id}`}
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
                    {seats.map((seat) => (
                      <td
                        key={seat}
                        className={clsx(
                          "py-1.5 pr-4",
                          colorBy.kind === "seat" && seat === colorBy.seat
                            ? "text-zinc-200"
                            : "text-zinc-500",
                        )}
                      >
                        {short(run.roster[seat] ?? "")}
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
                  <td colSpan={seats.length + 4} className="py-4 text-zinc-600">
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

interface Branch {
  run: Run;
  path: (number | undefined)[];
}

type ColorBy =
  { kind: "seat"; seat: string } | { kind: "model"; model: string };

interface Pin {
  turn: number;
  rung: number;
}

interface Group {
  key: string;
  label: string;
  color: string;
}

interface Grouping {
  title: string;
  groups: Group[];
  keyOf: (run: Run) => string;
}

function colorOfGroup(grouping: Grouping, run: Run) {
  const key = grouping.keyOf(run);
  return grouping.groups.find((g) => g.key === key)?.color ?? "#a1a1aa";
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
      split by seat
    </button>
  );
}

// One chart plus its legend with per-group stats (n, mean final, mean peak).
function Panel({
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
          ✕ through turn {(pin?.turn ?? 0) + 1} · rung {pin?.rung ?? 0} (
          {pin
            ? branches.filter(({ path }) => path[pin.turn] === pin.rung).length
            : 0}
          )
        </button>
        <Trajectories
          branches={branches}
          ladder={ladder}
          colorOf={(run) => colorOfGroup(grouping, run)}
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
  hover,
  setHover,
  pin,
  setPin,
  compact = false,
}: {
  branches: Branch[];
  ladder: string[];
  colorOf: (run: Run) => string;
  hover: string | null;
  setHover: (id: string | null) => void;
  pin: Pin | null;
  setPin: (pin: Pin | null) => void;
  compact?: boolean;
}) {
  const through = (path: (number | undefined)[]) =>
    pin === null || path[pin.turn] === pin.rung;
  // every (turn, rung) some branch passes through: a clickable node
  const nodes = new Map<string, Pin & { count: number }>();
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
      {branches.map(({ run, path }, index) => {
        const jitter = ((index % 7) - 3) * 1.2;
        const points = path
          .map((v, turn) =>
            typeof v === "number" ? `${x(turn)},${y(v) + jitter}` : null,
          )
          .filter((p): p is string => p !== null);
        const dim = (hover !== null && hover !== run.id) || !through(path);
        return (
          <g
            key={run.id}
            onMouseEnter={() => setHover(run.id)}
            onMouseLeave={() => setHover(null)}
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
        const active = pin?.turn === turn && pin?.rung === rung;
        return (
          <g
            key={`${turn}:${rung}`}
            onClick={(event) => {
              event.stopPropagation(); // nodes pin; the panel around them zooms
              setPin(active ? null : { turn, rung });
            }}
            className="cursor-pointer"
          >
            <circle cx={x(turn)} cy={y(rung)} r={12} fill="transparent" />
            <circle
              cx={x(turn)}
              cy={y(rung)}
              r={active ? 5 : 3.5}
              fill={active ? "#fbbf24" : "#161013"}
              stroke={active ? "#fbbf24" : "rgba(255,255,255,0.45)"}
              strokeWidth={active ? 2 : 1.5}
            />
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
