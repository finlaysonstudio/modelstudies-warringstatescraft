import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BLOB_COLUMNS, BLOB_FULL, BLOB_ROWS } from "../../../art/vendor/blob";
import { orientationOf, variantOf } from "../../../art/map/map";
import { loadStageManifest } from "../../stage/assets";
import type { StageAsset, StageFacing } from "../../stage/manifest";
import { DEFAULT_STAGE_SET, stageSet } from "../../stage/sets";
import { spriteFor } from "../../stage/assets";
import type { StageManifest } from "../../stage/manifest";
import {
  PATCH,
  islandShape,
  lowerOf,
  plainOf,
  patchIndexes,
  sectionsShown,
  showcaseOf,
  wearerOf,
  type Showcase,
} from "../../stage/showcase";

// Every tile, marker, and figure the project generated for itself, rendered
// with the map's own rules and shown beside the prompt it was asked for. The
// purchased packs are named nowhere and rendered nowhere: their licence keeps
// them out of anything that travels, so what a reader sees here is ours.
//
// The default art set alone: the page offers no choice of resolution, but a
// set is its own resolution, so every card still draws at the tile the
// manifest names rather than at a constant.

const SHAPE = islandShape();
const INDEXES = patchIndexes(SHAPE);
const FACINGS: StageFacing[] = ["down", "left", "right", "up"];
/** the field a marker stands in, in tiles (wide enough to hold a 3-tile marker) */
const STAGE_TILES = { width: 9, height: 5 };
/** the field the four facings walk in, in tiles, and the gap between them */
const STRIP_TILES = { width: 11, height: 3, gap: 0.5 };
/** the gap between a sprite's walk row and each pose row beneath it, in tiles */
const ROW_GAP_TILES = 0.25;

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
      /** the whole manifest, for the sprite an overlay is drawn on */
      manifest: StageManifest;
    };

export function Tiles() {
  const [params, setParams] = useSearchParams();
  const set = stageSet(DEFAULT_STAGE_SET);
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
          manifest,
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
  const manifest = state.phase === "ready" ? state.manifest : null;
  const shown = showcase ? sectionsShown(showcase, params.get("show")) : null;
  const show = (value: string) =>
    setParams(
      (next) => {
        next.set("show", value);
        return next;
      },
      { replace: true },
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/world" className="hover:text-white">
            The World
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
        {showcase && (
          <p className="mt-4 font-plex-mono text-xs text-zinc-500">
            <span className="text-zinc-200">{showcase.count}</span> ids ·{" "}
            <span className="text-zinc-200">{showcase.generations}</span>{" "}
            generations, failed attempts included · pixellab
            {showcase.derived > 0 && (
              <>
                {" "}
                · <span className="text-zinc-200">{showcase.derived}</span>{" "}
                derived from another layer
              </>
            )}
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

      {showcase && shown && showcase.sections.length > 1 && (
        <nav
          className="mt-10 flex flex-wrap gap-2 border-t border-white/10 pt-5"
          aria-label="Categories"
        >
          {showcase.sections.map((section) => (
            <FilterButton
              key={section.group}
              label={section.title}
              count={section.assets.length}
              active={shown.filter === section.group}
              onClick={() => show(section.group)}
            />
          ))}
          <FilterButton
            label="All"
            count={showcase.count}
            active={shown.filter === "all"}
            onClick={() => show("all")}
          />
        </nav>
      )}

      {shown?.sections.map((section) => (
        <section
          key={section.group}
          className="mt-10 scroll-mt-8"
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
              // a seasonal pair stands on its lower ground in that season
              // where the set carries it, and on the plain lower otherwise
              const under = lower
                ? (beds[lower] ?? beds[plainOf(lower)] ?? grass)
                : grass;
              const bed = asset.id.endsWith(".boat") ? river : grass;
              const plain = plainOf(asset.id);
              const patch =
                section.group === "ground" ||
                section.group === "pair" ||
                (section.group === "season" && !plain.startsWith("decor."));
              return (
                <Card key={asset.id} asset={asset}>
                  {patch ? (
                    <GroundPatch asset={asset} bed={under} tile={tile} />
                  ) : section.group === "figure" ? (
                    <FigureStrip asset={asset} bed={bed} tile={tile} />
                  ) : section.group === "overlay" ? (
                    <OverlayStrip
                      asset={asset}
                      wearer={
                        manifest
                          ? spriteFor(manifest, wearerOf(asset.id))
                          : undefined
                      }
                      bed={bed}
                      tile={tile}
                    />
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

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "cursor-pointer rounded-sm border px-3 py-1.5 font-plex-mono text-xs transition-colors",
        active
          ? "border-brand-terminal/40 text-brand-terminal"
          : "border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300",
      )}
    >
      {label}
      <span className="ml-2 text-zinc-600">{count}</span>
    </button>
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
            {record?.derived
              ? ` · from ${record.derived}`
              : record?.generations === undefined
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
  if (Array.isArray(finish.actions)) {
    chips.push(`poses ${(finish.actions as string[]).join(", ")}`);
  }
  if (typeof finish.mirror === "string")
    chips.push(`${finish.mirror} mirrored`);
  if (typeof finish.slot === "string") chips.push(`slot ${finish.slot}`);
  const beat = number(finish.beat);
  if (beat) chips.push(`beat of ${beat}`);
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

/** The rows a sprite card walks: the walk first, then each pose it carries. */
function rowsOf(
  meta: NonNullable<StageAsset["sprite"]>,
): { id: string; frames: Record<StageFacing, number[]> }[] {
  return [
    { id: "walk", frames: meta.walk },
    ...Object.entries(meta.actions ?? {}).map(([id, frames]) => ({
      id,
      frames,
    })),
  ];
}

/** Where a sprite's rows and columns land on a card, in canvas pixels. */
function stripLayout(
  meta: NonNullable<StageAsset["sprite"]> | undefined,
  tile: number,
  scale: number,
) {
  const frameWidth = (meta?.frameWidth ?? tile) * scale;
  const frameHeight = (meta?.frameHeight ?? tile) * scale;
  const rows = meta ? rowsOf(meta).length : 1;
  const width = STRIP_TILES.width * tile;
  const gap = STRIP_TILES.gap * tile;
  const rowGap = ROW_GAP_TILES * tile;
  const stack = frameHeight * rows + rowGap * (rows - 1);
  const height = Math.max(STRIP_TILES.height * tile, Math.ceil(stack + tile));
  const span = frameWidth * FACINGS.length + gap * (FACINGS.length - 1);
  const left = Math.round((width - span) / 2);
  const top = Math.round((height - stack) / 2);
  return {
    frameWidth,
    frameHeight,
    width,
    height,
    /** the top-left corner of one frame */
    at: (column: number, row: number) => ({
      x: Math.round(left + column * (frameWidth + gap)),
      y: Math.round(top + row * (frameHeight + rowGap)),
    }),
  };
}

/** Draws one frame of a sprite sheet at a canvas position. */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: NonNullable<StageAsset["sprite"]>,
  frame: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.drawImage(
    image,
    (frame % meta.columns) * meta.frameWidth,
    Math.floor(frame / meta.columns) * meta.frameHeight,
    meta.frameWidth,
    meta.frameHeight,
    x,
    y,
    Math.round(width),
    Math.round(height),
  );
}

/**
 * The four facings of one archetype, walking, and beneath the walk every
 * pose the sprite carries, each played across its own four facings so a
 * pose is judged the way the walk is.
 */
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
  const layout = stripLayout(meta, tile, scale);
  const rows = meta ? rowsOf(meta) : [];
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (ground) {
      drawField(
        ctx,
        ground,
        STRIP_TILES.width,
        Math.ceil(layout.height / tile),
        tile,
        still,
      );
    }
    if (!image || !meta) return;
    rows.forEach((row, rowIndex) => {
      FACINGS.forEach((facing, column) => {
        const frames = row.frames[facing];
        if (!frames?.length) return;
        const frame = frames[tick % frames.length];
        const { x, y } = layout.at(column, rowIndex);
        drawFrame(
          ctx,
          image,
          meta,
          frame,
          x,
          y,
          layout.frameWidth,
          layout.frameHeight,
        );
      });
    });
  };
  return (
    <>
      <Plot
        width={layout.width}
        height={layout.height}
        draw={draw}
        deps={[image, ground, tick, tile]}
      />
      {rows.length > 1 && (
        <p className="border-t border-white/5 px-4 py-1.5 font-plex-mono text-[10px] text-zinc-600">
          {rows.map((row) => row.id).join(" · ")}
        </p>
      )}
    </>
  );
}

/**
 * An overlay on the sprite of the archetype that first wears it, walking:
 * every frame draws the overlay's facing at the wearer's anchor for the
 * slot, less the overlay's own pivot, so the card shows the same placement
 * the scene will. A `back` piece goes under the figure when it faces the
 * viewer and over it otherwise.
 */
function OverlayStrip({
  asset,
  wearer,
  bed,
  tile,
}: {
  asset: StageAsset;
  wearer?: StageAsset;
  bed?: StageAsset;
  tile: number;
}) {
  const image = useImage(asset.url);
  const figure = useImage(wearer?.url);
  const ground = useImage(bed?.url);
  const still = isWaterBed(bed);
  const tick = useTick(200);
  const meta = wearer?.sprite;
  const overlay = asset.overlay;
  const scale = tile / (wearer?.tile || tile);
  const overlayScale = tile / (asset.tile || tile);
  const layout = stripLayout(meta, tile, scale);
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (ground) {
      drawField(
        ctx,
        ground,
        STRIP_TILES.width,
        Math.ceil(layout.height / tile),
        tile,
        still,
      );
    }
    if (!image || !overlay || !asset.frame) return;
    const frameWidth = asset.frame.width;
    const frameHeight = asset.frame.height;
    FACINGS.forEach((facing, column) => {
      const { x, y } = layout.at(column, 0);
      const frames = meta?.walk[facing];
      const frame = frames?.length ? frames[tick % frames.length] : undefined;
      const anchors = frame === undefined ? undefined : meta?.anchors?.[frame];
      const anchor = anchors?.[overlay.slot] ?? [
        Math.floor((meta?.frameWidth ?? tile) / 2),
        Math.floor((meta?.frameHeight ?? tile) / 2),
      ];
      const pivot = overlay.pivots[facing];
      const drawOverlay = () =>
        ctx.drawImage(
          image,
          overlay.facings[facing] * frameWidth,
          0,
          frameWidth,
          frameHeight,
          Math.round(x + anchor[0] * scale - pivot[0] * overlayScale),
          Math.round(y + anchor[1] * scale - pivot[1] * overlayScale),
          Math.round(frameWidth * overlayScale),
          Math.round(frameHeight * overlayScale),
        );
      const under = overlay.slot === "back" && facing === "down";
      if (under) drawOverlay();
      if (figure && meta && frame !== undefined) {
        drawFrame(
          ctx,
          figure,
          meta,
          frame,
          x,
          y,
          layout.frameWidth,
          layout.frameHeight,
        );
      }
      if (!under) drawOverlay();
    });
  };
  return (
    <>
      <Plot
        width={layout.width}
        height={layout.height}
        draw={draw}
        deps={[image, figure, ground, tick, tile]}
      />
      <p className="border-t border-white/5 px-4 py-1.5 font-plex-mono text-[10px] text-zinc-600">
        {overlay?.slot ?? "?"} · on {wearer?.id ?? "no sprite"}
        {wearer && !wearer.sprite?.anchors && " (no anchors: centred)"}
      </p>
    </>
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
