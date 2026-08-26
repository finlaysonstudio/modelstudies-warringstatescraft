import clsx from "clsx";
import Phaser from "phaser";
import { useEffect, useRef, useState } from "react";

import type { StageBeat, StageScript, StageSequence } from "../lib/types";
import { loadStageManifest } from "./assets";
import type { StagePlan } from "./beats";
import { DIRECTION_CAPTIONS } from "./catalog";
import { featureFor, KIND_LABELS, legendFor } from "./legend";
import {
  OverworldScene,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  ZOOM_STEP,
  type StagePick,
  type StageZoom,
} from "./OverworldScene";
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
  /**
   * Replaces the "Stage · source" part of the eyebrow; `false` hides the strip
   * altogether, for a page that is the map itself rather than a replay playing
   * on one and has already said in its own text what the reader is looking at.
   */
  eyebrow?: string | false;
  /** which art set to play on (default `DEFAULT_STAGE_SET`) */
  set?: StageSetId;
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
  eyebrow,
  set: setId = DEFAULT_STAGE_SET,
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
          mapUrl: set.map,
          onReady: () => {
            if (cancelled) return;
            sceneRef.current = scene;
            setStatus({
              phase: "ready",
              sources: manifest.sources.join(" + "),
            });
          },
          onBeatStart: (beat, plan) => {
            if (cancelled) return;
            setIdle(false);
            setCurrent({ beat, plan });
          },
          onIdle: () => {
            if (!cancelled) setIdle(true);
          },
          onPick: (picked) => {
            if (!cancelled) setPick(picked);
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
    // the scene is built once per script and set; names and colours travel with it
  }, [script.id, set.id]);

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
  const kindNote = pick
    ? legendFor(
        pick.kind,
        pick.kind === "place" ? (pick.marker ?? "region") : pick.id,
      )
    : null;
  // a place standing on a named feature is read as both: the marker says what
  // a ford is, and the feature says what this river is (the Jing's crossing
  // carries the Jing's history)
  const feature = featureFor(
    pick?.feature ?? (pick?.kind === "place" ? pick.id : undefined),
  );
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
      {pick && note && (
        <div
          className={clsx(
            "absolute left-3 max-w-[19rem] rounded-sm border border-white/10 bg-black/85 p-3",
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
