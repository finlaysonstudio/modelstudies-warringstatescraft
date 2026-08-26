import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BLOB_COLUMNS, BLOB_FULL, BLOB_ROWS } from "../../../art/vendor/blob";
import { orientationOf, variantOf } from "../../../art/map/map";
import { loadStageManifest } from "../../stage/assets";
import type { StageAsset, StageFacing } from "../../stage/manifest";
import { STAGE_SETS, stageSetOf } from "../../stage/sets";
import {
  PATCH,
  islandShape,
  lowerOf,
  patchIndexes,
  showcaseOf,
  type Showcase,
} from "../../stage/showcase";

// Every tile, marker, and figure the project generated for itself, rendered
// with the map's own rules and shown beside the prompt it was asked for. The
// purchased packs are named nowhere and rendered nowhere: their licence keeps
// them out of anything that travels, so what a reader sees here is ours.
//
// One art set at a time, chosen by `?set=`: a set is its own resolution, so
// every card draws at the tile the manifest names rather than at a constant.

const SHAPE = islandShape();
const INDEXES = patchIndexes(SHAPE);
const FACINGS: StageFacing[] = ["down", "left", "right", "up"];
/** the field a marker stands in, in tiles (wide enough to hold a 3-tile marker) */
const STAGE_TILES = { width: 9, height: 5 };
/** the field the four facings walk in, in tiles, and the gap between them */
const STRIP_TILES = { width: 11, height: 3, gap: 0.5 };

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready";
      showcase: Showcase;
      /** the pixels one tile of this set is drawn at */
      tile: number;
      /** the beds a card stands its art on */
      grass?: StageAsset;
      river?: StageAsset;
      /** every ground a transition may be laid over, by its bare name */
      beds: Record<string, StageAsset>;
    };

export function Tiles() {
  const [params, setParams] = useSearchParams();
  const set = stageSetOf(params.get("set"));
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    void (async () => {
      try {
        const manifest = await loadStageManifest({ set });
        if (cancelled) return;
        setState({
          phase: "ready",
          showcase: showcaseOf(manifest),
          tile: manifest.tile,
          grass: manifest.assets["terrain.grass"],
          river: manifest.assets["water.river"],
          beds: Object.fromEntries(
            Object.values(manifest.assets)
              .filter((asset) => !asset.id.includes("@"))
              .flatMap((asset) => {
                const [kind, name] = asset.id.split(".");
                return kind === "terrain" || kind === "water"
                  ? [[name, asset] as const]
                  : [];
              }),
          ),
        });
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
  }, [set.id]);

  const showcase = state.phase === "ready" ? state.showcase : null;
  const tile = state.phase === "ready" ? state.tile : set.tile;
  const grass = state.phase === "ready" ? state.grass : undefined;
  const river = state.phase === "ready" ? state.river : undefined;
  const beds = state.phase === "ready" ? state.beds : {};

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}Tiles
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          The Tiles
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          The overworld is drawn from art generated for this project alone, one
          prompt at a time, and every id below carries the prompt it came from.
          A biome arrives as a sixteen-tile corner sheet and is expanded to the
          forty-seven tile blob layout the map addresses; what the generator
          returns is then keyed, coloured, and stacked before it reaches the
          map, and that finishing is as much of the tile as the generation is.
          Each patch is autotiled here by the same rule the map uses, so what a
          card shows is the transition rather than a swatch.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {STAGE_SETS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                setParams(
                  (next) => {
                    next.set("set", option.id);
                    return next;
                  },
                  { replace: true },
                )
              }
              className={clsx(
                "cursor-pointer rounded-sm border px-3 py-1.5 font-plex-mono text-xs transition-colors",
                option.id === set.id
                  ? "border-brand-terminal/40 text-brand-terminal"
                  : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300",
              )}
              aria-pressed={option.id === set.id}
            >
              {option.title}
              <span className="ml-2 text-zinc-600">{option.tile} px</span>
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-pretty text-sm text-zinc-500">
          {set.blurb}
        </p>
        {showcase && (
          <p className="mt-4 font-plex-mono text-xs text-zinc-500">
            <span className="text-zinc-200">{showcase.count}</span> ids ·{" "}
            <span className="text-zinc-200">{showcase.generations}</span>{" "}
            generations, failed attempts included · pixellab
          </p>
        )}
      </header>

      {state.phase === "loading" && (
        <p className="mt-10 font-plex-mono text-xs text-zinc-600">loading…</p>
      )}
      {state.phase === "error" && (
        <p className="mt-10 font-plex-mono text-xs text-red-400">
          failed to load the art manifest: {state.message}
        </p>
      )}

      {showcase?.count === 0 && (
        <p className="mt-10 text-sm text-zinc-400">
          The {showcase.own} layer is not built. Run{" "}
          <code className="font-plex-mono text-xs text-zinc-300">
            npm run stage:{showcase.own}
          </code>
          .
        </p>
      )}

      {showcase?.sections.map((section) => (
        <section
          key={section.group}
          className="mt-14 scroll-mt-8"
          aria-label={section.title}
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            {section.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            {section.blurb}
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {section.assets.map((asset) => {
              // a boat is shown on the water it sails, a transition on the
              // ground it is laid over, everything else on the field the map
              // lays every other terrain over
              const lower = lowerOf(asset.id);
              const under = lower ? (beds[lower] ?? grass) : grass;
              const bed = asset.id.endsWith(".boat") ? river : grass;
              return (
                <Card key={asset.id} asset={asset}>
                  {section.group === "ground" || section.group === "pair" ? (
                    <GroundPatch asset={asset} bed={under} tile={tile} />
                  ) : section.group === "figure" ? (
                    <FigureStrip asset={asset} bed={bed} tile={tile} />
                  ) : (
                    <MarkerPlot asset={asset} bed={bed} tile={tile} />
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {showcase && showcase.borrowed.length > 0 && (
        <section className="mt-14" aria-label="Not ours yet">
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Not ours yet
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            {showcase.borrowed.length} ids the stage may still ask for are not
            drawn by this set; each is named below with the layer standing in
            for it. A purchased pack is named here and rendered nowhere, because
            its licence forbids that art travelling with a project like this
            one.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-plex-mono text-[11px] text-zinc-600">
            {showcase.borrowed.map((borrowed) => (
              <span key={borrowed.id}>
                {borrowed.id}
                <span className="text-zinc-700">
                  {" "}
                  ← {borrowed.from ?? "nothing"}
                </span>
              </span>
            ))}
          </p>
        </section>
      )}
    </div>
  );
}

function Card({ asset, children }: { asset: StageAsset; children: ReactNode }) {
  const record = asset.record;
  const settings = Object.entries(record?.settings ?? {}).map(
    ([key, value]) => `${key} ${String(value)}`,
  );
  const finish = finishChips(record?.finish);
  return (
    <article className="flex flex-col rounded-sm border border-white/10 bg-black/20">
      <div className="border-b border-white/10 bg-black/40">{children}</div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-plex-mono text-xs text-zinc-200">{asset.id}</h3>
          <span className="font-plex-mono text-[10px] text-zinc-600">
            {asset.width}×{asset.height}
            {record?.generations === undefined
              ? ""
              : ` · ${generationsLabel(record.generations)}`}
          </span>
        </div>
        {record?.prompt && (
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            “{record.prompt}”
          </p>
        )}
        {(settings.length > 0 || finish.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {settings.map((chip) => (
              <Chip key={chip} label={chip} />
            ))}
            {finish.map((chip) => (
              <Chip key={chip} label={chip} accent />
            ))}
          </div>
        )}
        {record?.note && (
          <p className="mt-3 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-zinc-500">
            {record.note}
          </p>
        )}
      </div>
    </article>
  );
}

function Chip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={
        accent
          ? "rounded-sm border border-brand-terminal/30 px-1.5 py-0.5 font-plex-mono text-[10px] text-brand-terminal"
          : "rounded-sm border border-white/10 px-1.5 py-0.5 font-plex-mono text-[10px] text-zinc-500"
      }
    >
      {label}
    </span>
  );
}

/** What the id cost. Zero means it rode along on another id's generation. */
function generationsLabel(generations: number): string {
  if (generations === 0) return "no generation of its own";
  return `${generations} ${generations === 1 ? "generation" : "generations"}`;
}

/** The finishing, read back out of the manifest in the words the build uses. */
function finishChips(finish?: Record<string, unknown>): string[] {
  if (!finish) return [];
  const chips: string[] = [];
  const number = (value: unknown): number | undefined =>
    typeof value === "number" ? value : undefined;
  if (typeof finish.fill === "string") chips.push(`fill ${finish.fill}`);
  if (typeof finish.key === "string") {
    const tolerance = number(finish.keyTolerance);
    chips.push(`key ${finish.key}${tolerance ? ` ±${tolerance}` : ""}`);
  }
  const grey = number(finish.desaturate);
  if (grey) chips.push(`grey ${grey}`);
  const frames = number(finish.frames);
  if (frames) chips.push(`${frames} frames`);
  const variants = number(finish.variants);
  if (variants) chips.push(`${variants} variants`);
  const tone = number(finish.variantTone);
  if (tone) chips.push(`tone ±${tone}`);
  const adjust = finish.adjust as Record<string, unknown> | undefined;
  const hue = number(adjust?.hue);
  const saturation = number(adjust?.saturation);
  const value = number(adjust?.value);
  if (hue) chips.push(`hue ${hue > 0 ? "+" : "−"}${Math.abs(hue)}°`);
  if (saturation !== undefined) chips.push(`sat ×${saturation}`);
  if (value !== undefined) chips.push(`val ×${value}`);
  return chips;
}

/** An island of one ground on the field the whole map is laid on. */
function GroundPatch({
  asset,
  bed,
  tile,
}: {
  asset: StageAsset;
  bed?: StageAsset;
  tile: number;
}) {
  const image = useImage(asset.url);
  const ground = useImage(bed?.url);
  const water = asset.id.startsWith("water.");
  const tick = useTick(water ? 420 : 0);
  const isGround = asset.id === "terrain.grass";
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (ground) drawField(ctx, ground, PATCH.width, PATCH.height, tile);
    if (!image || isGround) return;
    const blocks = blocksIn(image, tile);
    const block = water ? tick % blocks : 0;
    for (let y = 0; y < PATCH.height; y += 1) {
      for (let x = 0; x < PATCH.width; x += 1) {
        const index = INDEXES[y][x];
        if (index < 0) continue;
        drawTile(
          ctx,
          image,
          block * BLOB_COLUMNS * BLOB_ROWS + index,
          x,
          y,
          tile,
        );
      }
    }
  };
  return (
    <Plot
      width={PATCH.width * tile}
      height={PATCH.height * tile}
      draw={draw}
      deps={[image, ground, tick, tile]}
    />
  );
}

/** A marker or a piece of decor standing on the ground, as the map places it. */
function MarkerPlot({
  asset,
  bed,
  tile,
}: {
  asset: StageAsset;
  bed?: StageAsset;
  tile: number;
}) {
  const image = useImage(asset.url);
  const ground = useImage(bed?.url);
  const still = isWaterBed(bed);
  const width = STAGE_TILES.width * tile;
  const height = STAGE_TILES.height * tile;
  // a marker of a lower layer is drawn at its own tile, so the card scales it
  // the way the scene does
  const scale = tile / (asset.tile || tile);
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (ground) {
      drawField(
        ctx,
        ground,
        STAGE_TILES.width,
        STAGE_TILES.height,
        tile,
        still,
      );
    }
    if (!image) return;
    const drawn = { width: image.width * scale, height: image.height * scale };
    ctx.drawImage(
      image,
      Math.round((width - drawn.width) / 2),
      Math.round((height - drawn.height) / 2),
      Math.round(drawn.width),
      Math.round(drawn.height),
    );
  };
  return (
    <Plot
      width={width}
      height={height}
      draw={draw}
      deps={[image, ground, tile]}
    />
  );
}

/** The four facings of one archetype, walking. */
function FigureStrip({
  asset,
  bed,
  tile,
}: {
  asset: StageAsset;
  bed?: StageAsset;
  tile: number;
}) {
  const image = useImage(asset.url);
  const ground = useImage(bed?.url);
  const still = isWaterBed(bed);
  const tick = useTick(200);
  const meta = asset.sprite;
  const scale = tile / (asset.tile || tile);
  const frameWidth = (meta?.frameWidth ?? tile) * scale;
  const frameHeight = (meta?.frameHeight ?? tile) * scale;
  const width = STRIP_TILES.width * tile;
  const height = STRIP_TILES.height * tile;
  const gap = STRIP_TILES.gap * tile;
  const span = frameWidth * FACINGS.length + gap * (FACINGS.length - 1);
  const left = Math.round((width - span) / 2);
  const top = Math.round((height - frameHeight) / 2);
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (ground) {
      drawField(
        ctx,
        ground,
        STRIP_TILES.width,
        STRIP_TILES.height,
        tile,
        still,
      );
    }
    if (!image || !meta) return;
    FACINGS.forEach((facing, column) => {
      const frames = meta.walk[facing];
      if (!frames?.length) return;
      const frame = frames[tick % frames.length];
      ctx.drawImage(
        image,
        (frame % meta.columns) * meta.frameWidth,
        Math.floor(frame / meta.columns) * meta.frameHeight,
        meta.frameWidth,
        meta.frameHeight,
        Math.round(left + column * (frameWidth + gap)),
        top,
        Math.round(frameWidth),
        Math.round(frameHeight),
      );
    });
  };
  return (
    <Plot
      width={width}
      height={height}
      draw={draw}
      deps={[image, ground, tick, tile]}
    />
  );
}

/** A canvas at the art's own resolution, scaled up by the browser, never smoothed. */
function Plot({
  width,
  height,
  draw,
  deps,
}: {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  deps: unknown[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
    // the draw closure is new every render; what it reads is in `deps`
  }, [width, height, ...deps]);
  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      className="block w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/** Whether a bed is water, whose blocks are frames and must not be mixed. */
function isWaterBed(bed?: StageAsset): boolean {
  return bed?.id.startsWith("water.") === true;
}

/**
 * The bed a card's art stands on: the grass fill, one stacked rearrangement
 * and one of four orientations per cell, exactly as the map lays it. A still
 * bed takes the first block flat, because a water sheet stacks frames rather
 * than rearrangements and a cell taking its own frame would shimmer.
 */
function drawField(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  tile: number,
  still = false,
): void {
  const blocks = blocksIn(image, tile);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const block = still ? 0 : variantOf(x, y) % blocks;
      drawTile(
        ctx,
        image,
        block * BLOB_COLUMNS * BLOB_ROWS + BLOB_FULL,
        x,
        y,
        tile,
        still ? 0 : orientationOf(x, y),
      );
    }
  }
}

/** How many blob blocks a loaded sheet stacks (a frame or a rearrangement each). */
function blocksIn(image: HTMLImageElement, tile: number): number {
  return Math.max(1, Math.floor(image.height / (BLOB_ROWS * tile)));
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  index: number,
  x: number,
  y: number,
  tile: number,
  orientation = 0,
): void {
  const sx = (index % BLOB_COLUMNS) * tile;
  const sy = Math.floor(index / BLOB_COLUMNS) * tile;
  const dx = x * tile;
  const dy = y * tile;
  if (!orientation) {
    ctx.drawImage(image, sx, sy, tile, tile, dx, dy, tile, tile);
    return;
  }
  ctx.save();
  ctx.translate(dx + tile / 2, dy + tile / 2);
  ctx.scale(orientation & 1 ? -1 : 1, orientation & 2 ? -1 : 1);
  ctx.drawImage(image, sx, sy, tile, tile, -tile / 2, -tile / 2, tile, tile);
  ctx.restore();
}

function useImage(url?: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    let cancelled = false;
    const element = new Image();
    element.decoding = "async";
    element.onload = () => {
      if (!cancelled) setImage(element);
    };
    element.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);
  return image;
}

/** A counter advancing every `ms`; 0 leaves the card still. */
function useTick(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!ms) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return tick;
}
