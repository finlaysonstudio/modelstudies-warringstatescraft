import clsx from "clsx";
import Phaser from "phaser";
import { useEffect, useRef, useState } from "react";

import type { StageBeat, StageScript } from "../lib/types";
import { loadStageManifest } from "./assets";
import type { StagePlan } from "./beats";
import { DIRECTION_CAPTIONS } from "./catalog";
import { OverworldScene, VIEW_HEIGHT, VIEW_WIDTH } from "./OverworldScene";

export interface StageProps {
  script: StageScript;
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
  /** drag pans and the wheel zooms; the camera opens on the whole map */
  interactive?: boolean;
  /** whether the camera flies to each beat (default true) */
  follow?: boolean;
  /** replaces the "Stage · source" part of the eyebrow */
  eyebrow?: string;
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
}: StageProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OverworldScene | null>(null);
  const queued = useRef(new Set<string>());
  const [status, setStatus] = useState<Status>({ phase: "loading" });
  const [current, setCurrent] = useState<{
    beat: StageBeat;
    plan: StagePlan;
  } | null>(null);
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let game: Phaser.Game | undefined;
    queued.current = new Set();
    setStatus({ phase: "loading" });
    setCurrent(null);
    void loadStageManifest()
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
    // the scene is built once per script; names and colours travel with it
  }, [script.id]);

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

  const captions = current
    ? captionOf(current.beat, names, seatNames, language)
    : [];

  return (
    <section
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
        <p className="rounded-sm bg-black/70 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
          {eyebrow ??
            `Stage · ${script.source}${
              script.seed !== undefined ? ` · seed ${script.seed}` : ""
            }`}
          {status.phase === "ready" ? ` · ${status.sources} art` : ""}
        </p>
        {status.phase === "loading" && (
          <p className="rounded-sm bg-black/70 px-2 py-1 font-plex-mono text-[10px] text-zinc-500">
            loading…
          </p>
        )}
        {status.phase === "error" && (
          <p className="font-plex-mono text-[10px] text-red-400">
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
    </section>
  );
}
