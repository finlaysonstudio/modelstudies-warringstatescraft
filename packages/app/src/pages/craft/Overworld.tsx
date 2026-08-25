import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { labelOf } from "../../lib/gazetteer";
import type {
  GazetteerFile,
  Language,
  Naming,
  StageBeat,
  StageDirection,
  StageDirectionKind,
  StageEffect,
  StageScript,
} from "../../lib/types";
import {
  BAND_LABELS,
  DIRECTION_CAPTIONS,
  DIRECTION_RULES,
  EFFECTS,
  seatColor,
} from "../../stage/catalog";
import { MAP_URL } from "../../stage/OverworldScene";
import { Stage } from "../../stage/Stage";

// The whole overworld on one pannable, zoomable stage, with a control panel
// that plays any move from the stage's closed vocabulary: pick a direction,
// an acting court, and the places, and the same engine that animates the
// recorded games choreographs it here.

const VIEW = { width: 960, height: 640 };
const DIRECTION_KINDS = Object.keys(DIRECTION_RULES) as StageDirectionKind[];
/** place-kind groups in select order; anything else lands before regions */
const KIND_ORDER = ["court", "town", "pass", "ford", "harbour"];

interface MapPlace {
  key: string;
  kind: string;
  state?: string;
}

interface TiledObjectJson {
  name: string;
  type?: string;
  class?: string;
  properties?: { name: string; value: unknown }[] | Record<string, unknown>;
}

const propertiesOf = (object: TiledObjectJson): Record<string, unknown> =>
  Array.isArray(object.properties)
    ? Object.fromEntries(object.properties.map((p) => [p.name, p.value]))
    : (object.properties ?? {});

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; places: MapPlace[]; gazetteer: GazetteerFile | null };

type EffectChoice = "default" | "none" | StageEffect;

export function Overworld() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [naming, setNaming] = useState<Naming>("chronicle");
  const [language, setLanguage] = useState<Language>("en");
  const [follow, setFollow] = useState(true);
  const [moves, setMoves] = useState<StageBeat[]>([]);
  const counter = useRef(0);

  const [kind, setKind] = useState<StageDirectionKind>("envoy");
  const [seat, setSeat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [at, setAt] = useState("");
  const [count, setCount] = useState(1);
  const [effect, setEffect] = useState<EffectChoice>("default");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [mapRes, gazetteerRes] = await Promise.all([
          fetch(MAP_URL),
          fetch("/data/world/gazetteer.json"),
        ]);
        if (!mapRes.ok) throw new Error(`map responded ${mapRes.status}`);
        const map = (await mapRes.json()) as {
          layers: { name: string; objects?: TiledObjectJson[] }[];
        };
        const objects =
          map.layers.find((layer) => layer.name === "places")?.objects ?? [];
        const places = objects.map((object) => {
          const stateProperty = propertiesOf(object).state;
          return {
            key: object.name,
            kind: object.type || object.class || "region",
            ...(typeof stateProperty === "string"
              ? { state: stateProperty }
              : {}),
          };
        });
        const gazetteer = gazetteerRes.ok
          ? ((await gazetteerRes.json()) as GazetteerFile)
          : null;
        if (!cancelled) setState({ phase: "ready", places, gazetteer });
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

  const places = state.phase === "ready" ? state.places : [];
  const gazetteer = state.phase === "ready" ? state.gazetteer : null;

  /** acting parties: every state the map declares, in authoring order; the
   * first place carrying a state is its court (the map also marks outlying
   * holdings with a state, so later repeats are dropped) */
  const parties = useMemo(() => {
    const seen = new Set<string>();
    const out: { seat: string; home: string }[] = [];
    for (const place of places) {
      if (place.state === undefined || seen.has(place.state)) continue;
      seen.add(place.state);
      out.push({ seat: place.state, home: place.key });
    }
    return out;
  }, [places]);

  useEffect(() => {
    if (parties.length === 0 || seat) return;
    const first = parties[0];
    setSeat(first.seat);
    setFrom(first.home);
    const second = parties.find((party) => party.seat !== first.seat);
    if (second) setTo(second.home);
    const landing =
      places.find((place) => place.kind === "pass") ??
      places.find((place) => place.kind !== "region");
    if (landing) setAt(landing.key);
  }, [parties, places, seat]);

  const names = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(gazetteer?.entries ?? {})) {
      out[key] = labelOf(gazetteer, key, naming, language);
    }
    for (const place of places) {
      if (!(place.key in out)) out[place.key] = place.key;
    }
    return out;
  }, [gazetteer, naming, language, places]);

  const seatNames = useMemo(
    () =>
      Object.fromEntries(
        parties.map((party) => [
          party.seat,
          labelOf(gazetteer, party.seat, naming, language),
        ]),
      ),
    [parties, gazetteer, naming, language],
  );

  const colors = useMemo(
    () =>
      Object.fromEntries(
        parties.map((party, index) => [party.seat, seatColor(index)]),
      ),
    [parties],
  );

  const script = useMemo<StageScript>(
    () => ({
      id: `overworld.${naming}.${language}`,
      model: "stagings",
      run: "overworld",
      scenario: "overworld",
      language,
      naming,
      createdAt: "",
      source: "fallback",
      seats: Object.fromEntries(
        parties.map((party) => [
          party.seat,
          { state: party.seat, home: party.home, model: "sandbox" },
        ]),
      ),
      places: places.map((place) => place.key),
      beats: [],
    }),
    [naming, language, parties, places],
  );

  /** place options grouped by kind, courts first and regions last */
  const placeGroups = useMemo(() => {
    const kinds = [...new Set(places.map((place) => place.kind))].sort(
      (a, b) => {
        const rank = (kind: string) =>
          kind === "region"
            ? KIND_ORDER.length + 1
            : KIND_ORDER.indexOf(kind) === -1
              ? KIND_ORDER.length
              : KIND_ORDER.indexOf(kind);
        return rank(a) - rank(b) || a.localeCompare(b);
      },
    );
    return kinds.map((groupKind) => ({
      kind: groupKind,
      places: places.filter((place) => place.kind === groupKind),
    }));
  }, [places]);

  const rule = DIRECTION_RULES[kind];
  const home = parties.find((party) => party.seat === seat)?.home;
  const valid =
    rule.places === "route"
      ? Boolean(from && to && from !== to)
      : rule.places === "at"
        ? Boolean(at)
        : Boolean(home);

  const pickKind = (next: StageDirectionKind) => {
    setKind(next);
    setCount(DIRECTION_RULES[next].count ?? 1);
    setEffect("default");
  };

  const pickSeat = (next: string) => {
    setSeat(next);
    const nextHome = parties.find((party) => party.seat === next)?.home;
    if (nextHome) setFrom(nextHome);
  };

  const rerender = (nextNaming: Naming, nextLanguage: Language) => {
    setNaming(nextNaming);
    setLanguage(nextLanguage);
    setMoves([]);
  };

  const play = (direction: StageDirection) => {
    counter.current += 1;
    const n = counter.current;
    setMoves((list) => [
      ...list,
      {
        id: `move.${n}`,
        kind: "brief",
        turn: n,
        seat: direction.actor.seat,
        title: `Move ${n}`,
        directions: [direction],
      },
    ]);
  };

  const playPanel = () => {
    if (!valid) return;
    play({
      kind,
      actor: { seat, archetype: rule.actor },
      ...(rule.places === "route" ? { from, to } : {}),
      ...(rule.places === "at" ? { at } : {}),
      ...(count > 1 ? { count } : {}),
      ...(effect === "default"
        ? rule.effect
          ? { effect: rule.effect }
          : {}
        : effect === "none"
          ? {}
          : { effect }),
    });
  };

  const playRandom = () => {
    if (parties.length === 0) return;
    const pick = <T,>(list: T[]): T =>
      list[Math.floor(Math.random() * list.length)];
    const randomKind = pick(DIRECTION_KINDS);
    const randomRule = DIRECTION_RULES[randomKind];
    const actor = pick(parties);
    const landings = places.filter(
      (place) => place.kind !== "region" && place.key !== actor.home,
    );
    play({
      kind: randomKind,
      actor: { seat: actor.seat, archetype: randomRule.actor },
      ...(randomRule.places === "route"
        ? { from: actor.home, to: pick(landings).key }
        : {}),
      ...(randomRule.places === "at" ? { at: pick(landings).key } : {}),
      ...(randomRule.count !== undefined ? { count: randomRule.count } : {}),
      ...(randomRule.effect !== undefined ? { effect: randomRule.effect } : {}),
    });
  };

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
        failed to load the map: {state.message}
      </p>
    );
  }

  const placeOptions = (
    <>
      {placeGroups.map((group) => (
        <optgroup key={group.kind} label={group.kind}>
          {group.places.map((place) => (
            <option key={place.key} value={place.key}>
              {names[place.key] ?? place.key}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}Map
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          The Overworld
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          The whole known world of the chronicle on one map: every court, pass,
          ford, river, and work a chapter names. Drag to pan and scroll to zoom,
          then choreograph a move below — the panel plays any direction from the
          same closed vocabulary the stage coder writes for recorded games.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ToggleGroup
            options={[
              { value: "chronicle", label: "chronicle" },
              { value: "masked", label: "masked" },
            ]}
            value={naming}
            onPick={(value) => rerender(value as Naming, language)}
          />
          <ToggleGroup
            options={[
              { value: "en", label: "en" },
              { value: "zh", label: "zh" },
            ]}
            value={language}
            onPick={(value) => rerender(naming, value as Language)}
          />
        </div>
      </header>

      <section aria-label="Overworld map" className="mt-8">
        <Stage
          script={script}
          beats={moves}
          names={names}
          seatNames={seatNames}
          colors={colors}
          language={language}
          view={VIEW}
          interactive
          follow={follow}
          eyebrow="Overworld · drag pans · scroll zooms"
        />
      </section>

      <section
        aria-label="Choreograph a move"
        className="mt-6 rounded-sm border border-white/10 bg-black/20 p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Choreograph a move
          </h2>
          <p className="font-plex-mono text-[10px] text-zinc-600">
            band {rule.band} · {BAND_LABELS[rule.band]}
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Move">
            <select
              value={kind}
              onChange={(event) =>
                pickKind(event.target.value as StageDirectionKind)
              }
              className={SELECT}
            >
              {BAND_LABELS.map((band, index) => (
                <optgroup key={band} label={`${index} · ${band}`}>
                  {DIRECTION_KINDS.filter(
                    (candidate) => DIRECTION_RULES[candidate].band === index,
                  ).map((candidate) => (
                    <option key={candidate} value={candidate}>
                      {candidate} — {DIRECTION_CAPTIONS[candidate][language]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Actor">
            <select
              value={seat}
              onChange={(event) => pickSeat(event.target.value)}
              className={SELECT}
            >
              {parties.map((party) => (
                <option key={party.seat} value={party.seat}>
                  {seatNames[party.seat] ?? party.seat}
                </option>
              ))}
            </select>
          </Field>
          {rule.places === "route" && (
            <>
              <Field label="From">
                <select
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className={SELECT}
                >
                  {placeOptions}
                </select>
              </Field>
              <Field label="To">
                <select
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className={SELECT}
                >
                  {placeOptions}
                </select>
              </Field>
            </>
          )}
          {rule.places === "at" && (
            <Field label="At">
              <select
                value={at}
                onChange={(event) => setAt(event.target.value)}
                className={SELECT}
              >
                {placeOptions}
              </select>
            </Field>
          )}
          {rule.places === "home" && (
            <Field label="Where">
              <p className="rounded-sm border border-white/5 px-2 py-1.5 text-sm text-zinc-500">
                at {home ? (names[home] ?? home) : "the actor's court"}
              </p>
            </Field>
          )}
          <Field label="Figures">
            <input
              type="number"
              min={1}
              max={16}
              value={count}
              onChange={(event) =>
                setCount(
                  Math.max(1, Math.min(16, Number(event.target.value) || 1)),
                )
              }
              className={SELECT}
            />
          </Field>
          <Field label="Effect">
            <select
              value={effect}
              onChange={(event) =>
                setEffect(event.target.value as EffectChoice)
              }
              className={SELECT}
            >
              <option value="default">
                {rule.effect ? `default (${rule.effect})` : "default (none)"}
              </option>
              <option value="none">none</option>
              {EFFECTS.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={playPanel}
            disabled={!valid}
            className={clsx(
              "rounded-sm px-4 py-2 text-sm font-medium text-white",
              valid
                ? "cursor-pointer bg-brand-terminal hover:bg-brand-terminal/80"
                : "cursor-not-allowed bg-white/10 text-zinc-500",
            )}
          >
            ▶ Play the move
          </button>
          <button
            type="button"
            onClick={playRandom}
            className="cursor-pointer rounded-sm border border-white/10 px-3 py-2 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5"
          >
            random move
          </button>
          <label className="flex cursor-pointer items-center gap-x-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
              className="cursor-pointer accent-brand-terminal"
            />
            camera follows
          </label>
          {rule.places === "route" && from === to && (
            <span className="font-plex-mono text-[10px] text-red-400">
              a route needs two different places
            </span>
          )}
        </div>
        <p className="mt-4 font-plex-mono text-[10px] text-zinc-600">
          Moves queue and play in order; each fades when done. The vocabulary,
          the arity rules, and the walk pacing are the ones the recorded games
          use.
        </p>
      </section>
    </div>
  );
}

const SELECT =
  "w-full cursor-pointer rounded-sm border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ToggleGroup({
  options,
  value,
  onPick,
}: {
  options: { value: string; label: string }[];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-x-1 rounded-sm border border-white/10 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onPick(option.value)}
          className={clsx(
            "cursor-pointer rounded-sm px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase",
            option.value === value
              ? "bg-white/10 text-white"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
