import clsx from "clsx";
import Phaser from "phaser";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { StageBeat, StageScript, StageSequence } from "../lib/types";
import type { Month } from "./almanac";
import type { SiteClock } from "./clock";
import { loadStageManifest } from "./assets";
import type { StagePlan } from "./beats";
import { DIRECTION_CAPTIONS } from "./catalog";
import {
  featureFor,
  KIND_LABELS,
  legendFor,
  type FeatureNote,
  type Localized,
} from "./legend";
import {
  OverworldScene,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  ZOOM_STEP,
  type PopulaceConfig,
  type StagePick,
  type StageZoom,
} from "./OverworldScene";
import type { Figure } from "./populace";
import type { SiteEvent } from "./site";
import { DEFAULT_STAGE_SET, stageSet, type StageSetId } from "./sets";

export interface StageProps {
  /** what the stage plays: a run's coded script or an authored episode */
  script: StageSequence;
  /** The beats the page has revealed so far, in reveal order. */
  beats: StageBeat[];
  /** place key → label */
  names: Record<string, string>;
  /** seat → label */
  seatNames: Record<string, string>;
  /** seat → colour */
  colors: Record<string, number>;
  language: "en" | "zh";
  className?: string;
  /** the game canvas in logical pixels (defaults to the watch page's 960 × 400) */
  view?: { width: number; height: number };
  /**
   * The explorer: scrolling pans, the zoom control shows, every feature on
   * the map is clickable, and the camera opens on the whole country.
   */
  interactive?: boolean;
  /** whether the camera flies to each beat (default true) */
  follow?: boolean;
  /** whether the roofs are drawn over the rooms (default true; the house page hides them) */
  roofs?: boolean;
  /** the month of the almanac to show the map in (none: the plain art) */
  month?: Month;
  /**
   * Replaces the "Stage · source" part of the eyebrow; `false` hides the strip
   * altogether, for a page that is the map itself rather than a replay playing
   * on one and has already said in its own text what the reader is looking at.
   */
  eyebrow?: string | false;
  /** which art set to play on (default `DEFAULT_STAGE_SET`) */
  set?: StageSetId;
  /**
   * Another map built for the same set (the settlement): the Tiled file and
   * the feature sidecar it was rasterized with. Absent, the set's overworld.
   */
  map?: { url: string; features?: string };
  /** whether seat colours fly over homes and actors (default true) */
  flags?: boolean;
  /** notes for the named features this map draws, when they are not the overworld's */
  featureNotes?: Record<string, FeatureNote>;
  /** called each time the beat queue runs dry, so a page can keep it fed */
  onIdle?: () => void;
  /** Called once the scene has loaded its map and is ready to play beats. */
  onReady?: () => void;
  /**
   * A registered site's people on the site's clock: the scene builds one
   * figure per drawn villager and walks their circuits through the month.
   * The `month` prop is the register's month; `hour` and `event` open the clock.
   */
  populace?: Omit<PopulaceConfig, "month" | "paused">;
  /** whether the clock stands (default false) */
  paused?: boolean;
  /**
   * A jump the page asks for: to an hour or to an event. `key` must change
   * for a jump to apply, so the same hour can be jumped to twice.
   */
  jump?: { key: number; hour?: number; event?: string };
  /** the clock, a few times a second, and the next event of the month */
  onClock?: (clock: SiteClock, next: SiteEvent | undefined) => void;
  /** a line said on the site, with the hour and, for a stop, the figure */
  onLine?: (line: Localized, clock: SiteClock, figure?: Figure) => void;
  /** an event has begun */
  onEvent?: (event: SiteEvent) => void;
  /** the card for a figure pick, by villager id; without it the pick shows nothing */
  renderFigure?: (id: string, close: () => void) => ReactNode;
  /** a panel laid over the left of the map; the pick's note moves to the right to clear it */
  panel?: ReactNode;
  /** what the panel is called on the button that brings it back */
  panelLabel?: string;
  /** one of the site's people to point out on the map, by villager id, with the name to write over them */
  marked?: { id: string; label: string } | null;
  /** a figure was picked on the map, or the pick was dropped */
  onFigure?: (id: string | null) => void;
}

type Status =
  | { phase: "loading" }
  | { phase: "ready"; sources: string }
  | { phase: "error"; message: string };

const captionOf = (
  beat: StageBeat,
  names: Record<string, string>,
  seatNames: Record<string, string>,
  language: "en" | "zh",
): string[] =>
  beat.directions.map((direction) => {
    const seat = seatNames[direction.actor.seat] ?? direction.actor.seat;
    const verb =
      DIRECTION_CAPTIONS[direction.kind]?.[language] ?? direction.kind;
    const place = (key?: string) => (key ? (names[key] ?? key) : "");
    const where = direction.to
      ? `${place(direction.from)} → ${place(direction.to)}`
      : direction.at
        ? place(direction.at)
        : "";
    const against = direction.against
      ? ` (${seatNames[direction.against] ?? direction.against})`
      : "";
    return `${seat} ${verb}${where ? ` · ${where}` : ""}${against}`;
  });

/**
 * The animated overworld above the watch page's turn cards: a Phaser game
 * that plays every revealed beat in order, with the caption rendered by
 * React so fonts and CJK text stay crisp.
 */
export function Stage({
  script,
  beats,
  names,
  seatNames,
  colors,
  language,
  className,
  view = { width: VIEW_WIDTH, height: VIEW_HEIGHT },
  interactive = false,
  follow = true,
  roofs = true,
  month,
  eyebrow,
  set: setId = DEFAULT_STAGE_SET,
  map,
  flags = true,
  featureNotes,
  onIdle,
  onReady,
  populace,
  paused = false,
  jump,
  onClock,
  onLine,
  onEvent,
  renderFigure,
  panel,
  panelLabel,
  marked,
  onFigure,
}: StageProps) {
  const set = stageSet(setId);
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLElement>(null);
  const sceneRef = useRef<OverworldScene | null>(null);
  const queued = useRef(new Set<string>());
  const [status, setStatus] = useState<Status>({ phase: "loading" });
  const [current, setCurrent] = useState<{
    beat: StageBeat;
    plan: StagePlan;
  } | null>(null);
  const [idle, setIdle] = useState(true);
  const [pick, setPick] = useState<StagePick | null>(null);
  const [zoom, setZoom] = useState<StageZoom | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  // the scene is built once and the page's idle handler may change with its
  // own state, so the scene calls through a ref rather than a stale closure
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onClockRef = useRef(onClock);
  onClockRef.current = onClock;
  const onLineRef = useRef(onLine);
  onLineRef.current = onLine;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onFigureRef = useRef(onFigure);
  onFigureRef.current = onFigure;

  useEffect(() => {
    let cancelled = false;
    let game: Phaser.Game | undefined;
    queued.current = new Set();
    setStatus({ phase: "loading" });
    setCurrent(null);
    setPick(null);
    setZoom(null);
    void loadStageManifest({ set })
      .then((manifest) => {
        if (cancelled || !host.current) return;
        const scene = new OverworldScene({
          manifest,
          script,
          names,
          colors,
          view,
          interactive,
          follow,
          roofs,
          month,
          mapUrl: map?.url ?? set.map,
          featuresUrl: map?.features,
          flags,
          populace:
            populace && month !== undefined
              ? { ...populace, month, paused }
              : undefined,
          onClock: (clock, next) => {
            if (!cancelled) onClockRef.current?.(clock, next);
          },
          onLine: (line, clock, figure) => {
            if (!cancelled) onLineRef.current?.(line, clock, figure);
          },
          onEvent: (event) => {
            if (!cancelled) onEventRef.current?.(event);
          },
          onReady: () => {
            if (cancelled) return;
            sceneRef.current = scene;
            setStatus({
              phase: "ready",
              sources: manifest.sources.join(" + "),
            });
            onReadyRef.current?.();
          },
          onBeatStart: (beat, plan) => {
            if (cancelled) return;
            setIdle(false);
            setCurrent({ beat, plan });
          },
          onIdle: () => {
            if (cancelled) return;
            setIdle(true);
            onIdleRef.current?.();
          },
          onPick: (picked) => {
            if (cancelled) return;
            setPick(picked);
            if (picked?.kind === "figure") onFigureRef.current?.(picked.id);
          },
          onZoom: (state) => {
            if (!cancelled) setZoom(state);
          },
          onError: (message) => {
            if (!cancelled) setStatus({ phase: "error", message });
          },
        });
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: host.current,
          width: view.width,
          height: view.height,
          pixelArt: true,
          backgroundColor: "#0b0d10",
          banner: false,
          audio: { noAudio: true },
          input: { mouse: { preventDefaultWheel: interactive } },
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          scene,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus({
            phase: "error",
            message:
              error instanceof Error ? error.message : "stage failed to load",
          });
        }
      });
    return () => {
      cancelled = true;
      sceneRef.current = null;
      game?.destroy(true);
    };
    // the scene is built once per script, set, map, and site; names and colours travel with it
  }, [script.id, set.id, map?.url, populace?.site.id]);

  useEffect(() => {
    if (status.phase !== "ready" || !sceneRef.current) return;
    for (const beat of beats) {
      if (queued.current.has(beat.id)) continue;
      queued.current.add(beat.id);
      sceneRef.current.enqueue(beat);
    }
  }, [beats, status]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.follow = follow;
  }, [follow, status]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.showRoofs = roofs;
  }, [roofs, status]);
  useEffect(() => {
    sceneRef.current?.setMonth(month);
  }, [month, status]);
  useEffect(() => {
    sceneRef.current?.setPaused(paused);
  }, [paused, status]);
  // the month rebuilds the people, so the mark is drawn again after it
  useEffect(() => {
    sceneRef.current?.markFigure(marked ?? null);
  }, [marked?.id, marked?.label, month, status]);
  useEffect(() => {
    if (!jump || !sceneRef.current) return;
    if (jump.event) sceneRef.current.jumpToEvent(jump.event);
    else if (jump.hour !== undefined) sceneRef.current.setHour(jump.hour);
  }, [jump?.key, status]);

  const close = (): void => {
    sceneRef.current?.clearPick();
    setPick(null);
  };

  // clicking away closes what is open: the scene reports bare ground as
  // nothing picked, and anything outside the stage is handled here
  useEffect(() => {
    if (!pick) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && frame.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pick]);

  const captions = current
    ? captionOf(current.beat, names, seatNames, language)
    : [];
  // what the map draws generally, and what this particular stretch of it is:
  // the note about rivers, and then the note about the Wei
  const kindNote =
    pick && pick.kind !== "figure"
      ? legendFor(
          pick.kind,
          pick.kind === "place" ? (pick.marker ?? "region") : pick.id,
        )
      : null;
  // a place standing on a named feature is read as both: the marker says what
  // a ford is, and the feature says what this river is (the Jing's crossing
  // carries the Jing's history)
  const featureId =
    pick?.feature ?? (pick?.kind === "place" ? pick.id : undefined);
  const feature =
    (featureId ? featureNotes?.[featureId] : undefined) ??
    (featureNotes ? null : featureFor(featureId));
  const note = kindNote ?? feature;
  const what = (pick?.feature ? feature?.what : kindNote?.what) ?? note?.what;
  const history = feature?.history ?? note?.history;
  // the name follows the reader's naming and language, so a masked map stays
  // masked; the modern name is shown only where the real ones already are
  const title = headingOf(
    pick?.feature
      ? (names[pick.feature] ?? feature?.title[language] ?? pick.feature)
      : pick?.kind === "place"
        ? (names[pick.id] ?? pick.id)
        : (note?.title[language] ?? ""),
    language,
  );
  const modern =
    script.naming === "chronicle" ? feature?.modern?.[language] : undefined;

  return (
    <section
      ref={frame}
      aria-label="Stage"
      className={clsx(
        "relative overflow-hidden rounded-sm border border-white/10 bg-[#0b0d10]",
        className,
      )}
    >
      <div
        ref={host}
        className="w-full"
        style={{ aspectRatio: `${view.width} / ${view.height}` }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-3 py-2">
        {eyebrow !== false && (
          <p className="rounded-sm bg-black/70 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
            {eyebrow ?? sourceEyebrow(script)}
            {status.phase === "ready"
              ? ` · ${set.title} · ${status.sources} art`
              : ""}
          </p>
        )}
        {status.phase === "loading" && (
          <p className="ml-auto rounded-sm bg-black/70 px-2 py-1 font-plex-mono text-[10px] text-zinc-500">
            loading…
          </p>
        )}
        {status.phase === "error" && (
          <p className="ml-auto font-plex-mono text-[10px] text-red-400">
            {status.message}
          </p>
        )}
      </div>
      {current && (
        <div
          className={clsx(
            "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2 transition-opacity",
            idle ? "opacity-70" : "opacity-100",
          )}
        >
          <p className="font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase">
            {current.beat.title ?? current.beat.id}
            {current.beat.rung !== undefined
              ? ` · rung ${current.beat.rung}`
              : ""}
            {current.beat.unscored ? " · unscored" : ""}
            {current.beat.fallback ? " · fallback staging" : ""}
          </p>
          {captions.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {captions.map((caption, index) => (
                <li key={index} className="text-xs text-zinc-200">
                  {caption}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">
              {language === "zh" ? "无事" : "nothing moves"}
            </p>
          )}
        </div>
      )}
      {interactive && zoom && (
        <div className="absolute right-3 bottom-3 flex w-10 flex-col overflow-hidden rounded-sm border border-white/10 bg-black/75">
          <ZoomButton
            label="+"
            title="Zoom in"
            disabled={zoom.zoom >= zoom.max - EPSILON}
            onClick={() => sceneRef.current?.zoomBy(ZOOM_STEP)}
          />
          <p className="border-y border-white/10 py-1 text-center font-plex-mono text-[10px] text-zinc-400">
            {(zoom.zoom / zoom.min).toFixed(1)}×
          </p>
          <ZoomButton
            label="−"
            title="Zoom out"
            disabled={zoom.zoom <= zoom.min + EPSILON}
            onClick={() => sceneRef.current?.zoomBy(1 / ZOOM_STEP)}
          />
          <ZoomButton
            label="fit"
            title="The whole map"
            small
            className="border-t border-white/10"
            onClick={() => sceneRef.current?.zoomToFit()}
          />
        </div>
      )}
      {panel && status.phase === "ready" && panelOpen && (
        <div className="absolute top-3 bottom-3 left-3 flex w-44 flex-col overflow-hidden rounded-sm border border-white/10 bg-black/85">
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            title={language === "zh" ? "收起" : "Hide the panel"}
            aria-label={language === "zh" ? "收起" : "Hide the panel"}
            className="absolute top-1 right-1 cursor-pointer px-1 font-plex-mono text-sm leading-none text-zinc-500 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-terminal"
          >
            ‹
          </button>
          {panel}
        </div>
      )}
      {panel && status.phase === "ready" && !panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-expanded={false}
          className="absolute top-3 left-3 cursor-pointer rounded-sm border border-white/10 bg-black/85 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
        >
          {panelLabel ?? "Panel"} ›
        </button>
      )}
      {pick?.kind === "figure" && renderFigure && (
        <div
          className={clsx(
            "absolute max-w-[19rem] rounded-sm border border-white/10 bg-black/85 p-3",
            panel ? "right-3" : "left-3",
            eyebrow === false ? "top-3" : "top-10",
          )}
        >
          {renderFigure(pick.id, close)}
        </div>
      )}
      {pick && pick.kind !== "figure" && note && (
        <div
          className={clsx(
            "absolute max-w-[19rem] rounded-sm border border-white/10 bg-black/85 p-3",
            panel ? "right-3" : "left-3",
            // the note sits under the eyebrow where there is one
            eyebrow === false ? "top-3" : "top-10",
          )}
        >
          <div className="flex items-start justify-between gap-x-3">
            <p className="font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
              {KIND_LABELS[pick.kind][language]}
              {pick.kind === "place" && kindNote
                ? ` · ${kindNote.title[language]}`
                : ""}
              {pick.feature && kindNote ? ` · ${kindNote.title[language]}` : ""}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label={language === "zh" ? "关闭" : "Close"}
              className="-mt-1 cursor-pointer px-1 leading-none text-zinc-500 hover:text-white"
            >
              ×
            </button>
          </div>
          <h3 className="mt-1 text-sm font-medium text-white">{title}</h3>
          {modern && (
            <p className="font-plex-mono text-[10px] text-zinc-500">
              {language === "zh" ? `今称${modern}` : `today ${modern}`}
            </p>
          )}
          {what && (
            <p className="mt-2 text-xs text-pretty text-zinc-300">
              {what[language]}
            </p>
          )}
          {history && (
            <p className="mt-2 text-xs text-pretty text-zinc-500">
              {history[language]}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * The default eyebrow: how a staging was produced. An authored sequence names
 * itself instead, through the `eyebrow` prop, so the fallback only has to
 * answer a coded script.
 */
const sourceEyebrow = (script: StageSequence): string => {
  const coded = script as Partial<StageScript>;
  if (!coded.source) return "Stage";
  return `Stage · ${coded.source}${
    coded.seed !== undefined ? ` · seed ${coded.seed}` : ""
  }`;
};

/**
 * A name as a heading. The gazetteer drops the English article, which leaves
 * "plank roads" where a heading wants "Plank roads"; zh is left alone.
 */
const headingOf = (name: string, language: "en" | "zh"): string =>
  language === "en" ? name.charAt(0).toUpperCase() + name.slice(1) : name;

/** floating-point slack, so a button at the stop reads as at the stop */
const EPSILON = 1e-6;

function ZoomButton({
  label,
  title,
  onClick,
  disabled = false,
  small = false,
  className,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "py-1 text-center font-plex-mono leading-none",
        className,
        small ? "text-[9px] tracking-wide uppercase" : "text-sm",
        disabled
          ? "cursor-not-allowed text-zinc-700"
          : "cursor-pointer text-zinc-300 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}
