import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BadRequestError, NotFoundError } from "@jaypie/errors";

import { OVERLAYS } from "../../src/stage/catalog";
import {
  KIT_CELL,
  KIT_COLUMNS,
  KIT_FRAME,
  KIT_PIECES,
  KIT_SOURCE,
} from "../../src/stage/kit";
import type { StageSource } from "../../src/stage/manifest";
import { blocksOf, GROUNDS, tilesetIdOf, type Ground } from "../map/map";
import type {
  AssetEntry,
  AssetRecord,
  OverlayMeta,
  VendorManifest,
} from "../vendor/manifest";
import { BLOB_COLUMNS, BLOB_MASKS, BLOB_ROWS } from "../vendor/blob";
import {
  blankImage,
  copyRect,
  cropImage,
  downsampleImage,
  pixelAt,
  readPng,
  resampleImage,
  setPixel,
  writePng,
  type Image,
} from "../vendor/png";
import {
  FACINGS,
  type Facing,
  type OverlaySlot,
  type SpriteAnchors,
  type SpriteMeta,
} from "../vendor/slice";
import {
  applyFinish,
  cornerPalette,
  cornerSwatches,
  keepPalette,
  keyPalette,
  lowerPalette,
  lowerSwatches,
  splitFinish,
  wangBlobSheet,
  wangIndex,
  variantSheet,
  wangFillSheet,
  waterFrames,
  type ColourAdjustment,
  type SheetFinish,
  type Swatch,
  type WangMetadata,
} from "./tileset";

/**
 * The period layer: art generated on PixelLab for this project (the terms
 * grant ownership and distribution, so the output is committed), assembled
 * from the raw downloads under `var/assets/pixellab/` into
 * `public/stage/period/` with a manifest the stage loads over the vendor
 * layer. `items.json` is both the build spec and the record of every prompt.
 */

export interface PeriodRecord {
  tool: string;
  prompt: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  characterId?: string;
  date?: string;
  generations?: number;
  note?: string;
}

export interface PeriodImageItem extends PeriodRecord {
  id: string;
  kind: "image";
  /** the raw download, relative to the source root */
  file: string;
  /** grey blue-dominant pixels toward luminance, as a sheet's finish does */
  desaturate?: number;
  /** turn the hue and scale saturation and value, as a sheet's finish does */
  adjust?: ColourAdjustment;
  /**
   * The seasons this object changes in (`decor.plum~winter`): a drawing of
   * its own (`file`) or a recolour of the plain one, as a tileset's are.
   * `night` is the fifth sibling (`decor.lantern~night`): the lit frame the
   * scene binds while the clock is in the dark, a drawing of its own.
   */
  seasons?: Partial<Record<Season | "night", SeasonVariant>>;
}

/**
 * A pose of a sprite beyond its walk: a custom animation of the same
 * character, generated in three facings (south, west, north) and the fourth
 * mirrored by the build, a quarter off every pose.
 */
export interface SpriteAction {
  /** the pose's name, the key under `sprite.actions` (`hoe`, `kneel`) */
  id: string;
  /** directory holding `<facing>-<n>.png`, relative to the source root */
  dir: string;
  frames: number;
  /**
   * The facing built by mirroring its opposite rather than read from a
   * download: `east` is the west row flipped. Absent, all four are read.
   */
  mirror?: "east" | "west";
  /** the generation, when the pose is one */
  prompt?: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  date?: string;
  generations?: number;
  note?: string;
}

export interface PeriodSpriteItem extends PeriodRecord {
  id: string;
  kind: "sprite";
  /** directory holding `walk/<facing>-<n>.png` frames (south, west, east, north) */
  dir: string;
  frame: number;
  frames: number;
  /** the poses stacked after the walk rows, in this order */
  actions?: SpriteAction[];
  /**
   * A finish laid over every frame, walk and poses alike, the way a sheet or
   * a still takes one: a standard-mode quadruped comes back in whatever
   * colour the generator likes (the ox was a saturated yellow), and a
   * recolour costs no generation where a re-roll costs its walk again.
   */
  desaturate?: number;
  adjust?: ColourAdjustment;
}

/**
 * An overlay: a small still keyed to a slot on a figure (a hat, a sash, a
 * lamp, a basket), drawn by the scene at the wearer's anchor for that slot.
 * Either one still (`file`), shown as is for south, west, and north and
 * mirrored for east, or a facing apiece from an eight-direction object
 * (`dir`, holding `walk/<facing>-0.png` as the fetch lays one out).
 */
export interface PeriodOverlayItem extends PeriodRecord {
  id: string;
  kind: "overlay";
  file?: string;
  dir?: string;
  /** the slot; defaults to the catalog's `OVERLAYS` entry for the id */
  slot?: OverlaySlot;
  desaturate?: number;
  adjust?: ColourAdjustment;
}

/**
 * An effect drawn from one still: the frames a beat needs, built by the
 * build rather than generated (`effect.drum`: the drum swells on the beat
 * and settles). `frames` side by side, the way the fallback lays an effect.
 */
export interface PeriodEffectItem extends PeriodRecord {
  id: string;
  kind: "effect";
  file: string;
  /** how many frames the beat has (default 4) */
  frames?: number;
  desaturate?: number;
  adjust?: ColourAdjustment;
}

export interface PeriodTilesetItem extends PeriodRecord {
  id: string;
  kind: "tileset";
  /** the raw 4x4 Wang sheet, relative to the source root */
  file: string;
  /** the tileset metadata JSON beside it (corner map and bounding boxes) */
  metadata: string;
  /** `lower` builds a plain fill sheet of the lower terrain (the ground) */
  fill?: "lower" | "upper";
  /** grey blue-dominant pixels toward luminance by this amount (0..1) */
  desaturate?: number;
  /**
   * The ground this sheet's lower terrain is: the sheet was generated against
   * that terrain's own base tile, so its surround is the art the map already
   * lays there and the two meet with a drawn boundary rather than a cut. The
   * build then finishes the sheet in two halves, because the lower terrain
   * wears its own colour correction everywhere else on the map and must wear
   * it here (`splitFinish`). An id of the form `terrain.mountain@forest` is
   * the mountain as it meets the forest; the plain id is the sheet the ground
   * falls back to, which is drawn against grass.
   */
  against?: string;
  /**
   * Key the lower terrain out to transparency so the map's layer beneath
   * shows through the surround instead of a collar of this tileset's own
   * lower rendering. Wanted whenever the generator drew a lower terrain of
   * its own invention rather than the one the map lays, and off when the
   * sheet is chained (`against`), where the surround is the real thing.
   *
   * `upper` keeps only the upper terrain's own colours instead. It is the
   * wrong instrument for any biome whose own tile legitimately carries the
   * lower terrain's colours — a range with dry grass on its shoulders, a
   * canopy with sun on it — because the collar then falls inside the palette
   * it keeps and survives as a halo.
   */
  key?: "lower" | "upper";
  /**
   * Per-channel distance from the lower palette that still counts as the
   * lower terrain (default 0). One predicate serves both readers: what `key`
   * removes, and which half of a chained sheet `against` finishes as ground.
   */
  keyTolerance?: number;
  /**
   * Stack this many animation frames, cycling the upper terrain's brightest
   * tones between them. Water only: the scene advances a water tile by a
   * whole blob block per frame.
   */
  frames?: number;
  /** value swing between variant blocks (0 leaves every block the same tone) */
  variantTone?: number;
  /** turn the hue and scale saturation and value (the defaults leave them) */
  adjust?: ColourAdjustment;
  /**
   * The seasons this ground changes in, each a sibling sheet
   * (`<id>~<season>`) the scene binds in place of the plain one while a month
   * of that season is shown. A variant is either a recolour of the plain
   * sheet (`adjust` / `desaturate` laid over the ground's own finish) or its
   * own generation (`file` and `metadata`, finished on its own terms). A pair
   * whose upper or lower ground has a season is built for it too, each half
   * matched onto the colours its ground wears in that season, so the field
   * in autumn meets the scrub with no spring collar along the boundary.
   */
  seasons?: Partial<Record<Season, SeasonVariant>>;
}

export type Season = "spring" | "summer" | "autumn" | "winter";
export const SEASONS: readonly Season[] = [
  "spring",
  "summer",
  "autumn",
  "winter",
];

export interface SeasonVariant extends SheetFinish {
  /** a sheet of its own for the season, relative to the source root */
  file?: string;
  metadata?: string;
  /** the generation, when the variant is one */
  prompt?: string;
  settings?: Record<string, unknown>;
  jobId?: string;
  date?: string;
  generations?: number;
  note?: string;
}

export interface PeriodKitItem extends PeriodRecord {
  id: string;
  kind: "kit";
  /** directory holding the kit's pieces, `<n>.png` for 0..79 */
  dir: string;
}

/**
 * A floor laid as a ground: one kit's floor piece, cut to its cell and
 * stretched square, repeated over a flat blob sheet so the map builder lays
 * it the way it lays any terrain. A floor has no boundary of its own (the
 * wall stands on its edge), so every tile of the sheet is the same tile.
 */
export interface PeriodFloorItem extends PeriodRecord {
  id: string;
  kind: "floor";
  /** the kit's floor piece, relative to the source root */
  file: string;
  variantTone?: number;
}

export type PeriodItem =
  | PeriodImageItem
  | PeriodSpriteItem
  | PeriodTilesetItem
  | PeriodKitItem
  | PeriodFloorItem
  | PeriodOverlayItem
  | PeriodEffectItem;

/**
 * One art set's spec: the layer it writes, the tile its ground sheets are
 * drawn at, where the raw downloads sit, and where the built layer lands. The
 * period step builds whichever spec it is given, so a second set at a second
 * resolution is a second file rather than a second script.
 */
export interface PeriodSpec {
  version: 1;
  /** the layer this spec writes (`period`, `period32`) */
  source: StageSource;
  /** the tile its ground sheets are drawn at */
  tile: number;
  /** the raw PixelLab downloads, relative to the repository */
  root: string;
  /** the built layer, relative to the repository */
  out: string;
  /**
   * Another spec file beside this one whose built layer supplies every id
   * this spec does not draw itself, downsampled to this spec's tile. The
   * 16 px spec names the 32 px one, so the settlement art generated once at
   * 32 px (the kits, the furniture, the townsfolk, the yards and the pairs
   * they meet on) draws in both sets rather than in one.
   */
  derive?: string;
  items: PeriodItem[];
}

/** the layer a spec derives from, resolved by the caller */
export interface DeriveSource {
  source: StageSource;
  tile: number;
  /** where that layer's built files sit */
  dir: string;
  manifest: VendorManifest;
}

/** PixelLab facings → the stage's facings (rows down, left, right, up) */
const FACING_SOURCE: Record<(typeof FACINGS)[number], string> = {
  down: "south",
  left: "west",
  right: "east",
  up: "north",
};

/** The stage's facings → PixelLab's, the inverse of `FACING_SOURCE`. */
const SOURCE_FACING: Record<string, Facing> = Object.fromEntries(
  Object.entries(FACING_SOURCE).map(([facing, source]) => [source, facing]),
) as Record<string, Facing>;

/** the facing each one is the mirror of */
const OPPOSITE: Record<"east" | "west", "east" | "west"> = {
  east: "west",
  west: "east",
};

/** The image flipped across its vertical axis. */
export const mirrorImage = (image: Image): Image => {
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      setPixel(out, image.width - 1 - x, y, pixelAt(image, x, y));
    }
  }
  return out;
};

/**
 * The side a figure leads with, on screen: a figure walking west leads
 * left and one walking east leads right; facing the viewer it is the
 * figure's right hand, which is screen left, and facing away that same
 * hand is screen right. `hand` sits on this side and `back` on the other.
 */
const LEADING: Record<Facing, "left" | "right"> = {
  down: "left",
  left: "left",
  right: "right",
  up: "right",
};

const opaqueAt = (image: Image, x: number, y: number): boolean =>
  image.data[(y * image.width + x) * 4 + 3] !== 0;

/** the first and last opaque columns of one row, or null for a blank row */
const spanOf = (image: Image, y: number): [number, number] | null => {
  let first = -1;
  let last = -1;
  for (let x = 0; x < image.width; x += 1) {
    if (!opaqueAt(image, x, y)) continue;
    if (first < 0) first = x;
    last = x;
  }
  return first < 0 ? null : [first, last];
};

/**
 * Where an overlay attaches on one frame, read from the frame's own pixels:
 * `head` the topmost opaque row's centre, `shoulders` a quarter of the way
 * down the figure at that row's centre, `hand` the outermost opaque column
 * at mid-height on the facing's leading side, `back` the outermost on the
 * trailing side. A blank frame anchors at its centre, so a sheet with an
 * empty frame still carries an entry per frame.
 */
export const anchorsOf = (frame: Image, facing: Facing): SpriteAnchors => {
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < frame.height; y += 1) {
    if (!spanOf(frame, y)) continue;
    if (top < 0) top = y;
    bottom = y;
  }
  if (top < 0) {
    const centre: [number, number] = [
      Math.floor(frame.width / 2),
      Math.floor(frame.height / 2),
    ];
    return { head: centre, shoulders: centre, hand: centre, back: centre };
  }
  const centreOf = (y: number): [number, number] => {
    const span = spanOf(frame, y) ?? [0, frame.width - 1];
    return [Math.floor((span[0] + span[1]) / 2), y];
  };
  const height = bottom - top;
  const shouldersY = top + Math.round(height * 0.25);
  const midY = top + Math.round(height * 0.5);
  // the outermost opaque column at mid-height may fall on a blank row of a
  // thin figure; the nearest opaque row answers then
  let span = spanOf(frame, midY);
  for (let step = 1; !span && step <= height; step += 1) {
    span = spanOf(frame, midY - step) ?? spanOf(frame, midY + step);
  }
  const [first, last] = span ?? [0, frame.width - 1];
  const leading = LEADING[facing];
  return {
    head: centreOf(top),
    shoulders: centreOf(shouldersY),
    hand: [leading === "left" ? first : last, midY],
    back: [leading === "left" ? last : first, midY],
  };
};

/** one row of a sheet: a facing's frames, in order */
interface SpriteRow {
  facing: Facing;
  frames: Image[];
}

/**
 * The frames of one animation per facing, as the fetch lays them out:
 * `<dir>/<facing>-<n>.png` for `count` frames, and where `mirror` names a
 * facing, that facing built by flipping its opposite instead of read.
 */
const readFacings = (
  root: string,
  dir: string,
  count: number,
  label: string,
  mirror?: "east" | "west",
): Record<string, Image[]> => {
  const frames: Record<string, Image[]> = {};
  for (const source of Object.values(FACING_SOURCE)) {
    if (source === mirror) continue;
    frames[source] = [];
    for (let i = 0; i < count; i += 1) {
      const file = path.join(root, dir, `${source}-${i}.png`);
      try {
        frames[source].push(readPng(file));
      } catch {
        throw new NotFoundError(
          `${label} is missing ${path.relative(root, file)}`,
        );
      }
    }
  }
  if (mirror) {
    frames[mirror] = frames[OPPOSITE[mirror]].map(mirrorImage);
  }
  return frames;
};

/**
 * Stacks a sprite sheet: the walk's four rows first, then four rows per
 * action, the sheet as wide as the longest row and a blank cell wherever a
 * row is shorter. Every frame is square at `frame`. The meta indexes the
 * walk and each action per facing, and `anchors` carries an entry per frame
 * of the whole sheet, blank cells included, so a frame index is an anchor
 * index.
 */
export const assembleSprite = (
  frames: Record<string, Image[]>,
  {
    frame,
    count,
    actions = [],
  }: {
    frame: number;
    count: number;
    actions?: { id: string; count: number; frames: Record<string, Image[]> }[];
  },
): { image: Image; meta: SpriteMeta } => {
  const columns = Math.max(count, ...actions.map((action) => action.count));
  const groups: { id: string; rows: SpriteRow[] }[] = [
    { id: "walk", rows: rowsOf(frames, count, frame, "walk") },
    ...actions.map((action) => ({
      id: action.id,
      rows: rowsOf(action.frames, action.count, frame, action.id),
    })),
  ];
  const rowCount = groups.length * FACINGS.length;
  const image = blankImage(frame * columns, frame * rowCount);
  const walk = {} as SpriteMeta["walk"];
  const actionMeta: NonNullable<SpriteMeta["actions"]> = {};
  const anchors: SpriteAnchors[] = [];
  let row = 0;
  for (const group of groups) {
    const indexes = {} as Record<Facing, number[]>;
    for (const { facing, frames: list } of group.rows) {
      indexes[facing] = list.map((_, i) => row * columns + i);
      for (let column = 0; column < columns; column += 1) {
        const source = list[column];
        if (source) {
          copyRect({
            source,
            sx: 0,
            sy: 0,
            width: frame,
            height: frame,
            target: image,
            tx: column * frame,
            ty: row * frame,
          });
        }
        anchors.push(anchorsOf(source ?? blankImage(frame, frame), facing));
      }
      row += 1;
    }
    if (group.id === "walk") Object.assign(walk, indexes);
    else actionMeta[group.id] = indexes;
  }
  return {
    image,
    meta: {
      frameWidth: frame,
      frameHeight: frame,
      columns,
      walk,
      ...(actions.length ? { actions: actionMeta } : {}),
      anchors,
    },
  };
};

/**
 * A frame at the sprite's own size. A v3 custom animation comes back on a
 * canvas padded evenly round the character's (a 48 px figure's pose lands
 * on 68 x 68, the figure where the walk put it, ten clear pixels a side),
 * so a larger frame with an even margin is cropped to its centre; any
 * other size is refused, since a figure drawn at another scale would sit
 * wrong on every anchor.
 */
export const fitFrame = (
  source: Image,
  frame: number,
  label: string,
): Image => {
  if (source.width === frame && source.height === frame) return source;
  const dx = source.width - frame;
  const dy = source.height - frame;
  if (dx < 0 || dy < 0 || dx % 2 !== 0 || dy % 2 !== 0) {
    throw new BadRequestError(
      `${label} is ${source.width}x${source.height}, not ${frame}x${frame}`,
    );
  }
  const target = blankImage(frame, frame);
  copyRect({
    source,
    sx: dx / 2,
    sy: dy / 2,
    width: frame,
    height: frame,
    target,
    tx: 0,
    ty: 0,
  });
  return target;
};

/** one animation's rows in the stage's facing order, every frame fitted */
const rowsOf = (
  frames: Record<string, Image[]>,
  count: number,
  frame: number,
  label: string,
): SpriteRow[] =>
  FACINGS.map((facing) => {
    const list = frames[FACING_SOURCE[facing]];
    if (!list || list.length < count) {
      throw new BadRequestError(
        `${label} is missing ${FACING_SOURCE[facing]} frames (${list?.length ?? 0} of ${count})`,
      );
    }
    return {
      facing,
      frames: list
        .slice(0, count)
        .map((source, column) =>
          fitFrame(
            source,
            frame,
            `${label} frame ${FACING_SOURCE[facing]}-${column}`,
          ),
        ),
    };
  });

/** the opaque bounding box of an image, or the whole canvas when blank */
const boundsOf = (
  image: Image,
): { left: number; top: number; right: number; bottom: number } => {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    const span = spanOf(image, y);
    if (!span) continue;
    left = Math.min(left, span[0]);
    right = Math.max(right, span[1]);
    top = Math.min(top, y);
    bottom = y;
  }
  return right < 0
    ? { left: 0, top: 0, right: image.width - 1, bottom: image.height - 1 }
    : { left, top, right, bottom };
};

/**
 * The point of an overlay frame that lands on the wearer's anchor: a head
 * piece sits by its bottom centre on the top of the head, a shoulder piece
 * hangs by its top centre from the shoulders, and what a hand holds or a
 * back carries is centred on the anchor.
 */
export const pivotOf = (image: Image, slot: OverlaySlot): [number, number] => {
  const { left, top, right, bottom } = boundsOf(image);
  const x = Math.floor((left + right) / 2);
  if (slot === "head") return [x, bottom];
  if (slot === "shoulders") return [x, top];
  return [x, Math.floor((top + bottom) / 2)];
};

/**
 * An overlay sheet: one frame per facing side by side in the stage's facing
 * order, every frame the same size. With one still, south, west, and north
 * show it as drawn and east shows it mirrored, since a still is drawn from
 * the figure's left and the figure walking east shows its other side.
 */
export const overlaySheet = (
  frames: Partial<Record<Facing, Image>> & { still?: Image },
  slot: OverlaySlot,
): { image: Image; meta: OverlayMeta } => {
  const perFacing = FACINGS.map((facing): Image => {
    const own = frames[facing];
    if (own) return own;
    if (!frames.still) {
      throw new BadRequestError(`overlay has no ${facing} frame and no still`);
    }
    return facing === "right" ? mirrorImage(frames.still) : frames.still;
  });
  const width = Math.max(...perFacing.map((frame) => frame.width));
  const height = Math.max(...perFacing.map((frame) => frame.height));
  if (perFacing.some((f) => f.width !== width || f.height !== height)) {
    throw new BadRequestError("overlay frames differ in size");
  }
  const image = blankImage(width * FACINGS.length, height);
  const facings = {} as OverlayMeta["facings"];
  const pivots = {} as OverlayMeta["pivots"];
  perFacing.forEach((frame, column) => {
    copyRect({
      source: frame,
      sx: 0,
      sy: 0,
      width,
      height,
      target: image,
      tx: column * width,
      ty: 0,
    });
    facings[FACINGS[column]] = column;
    pivots[FACINGS[column]] = pivotOf(frame, slot);
  });
  return { image, meta: { slot, facings, pivots } };
};

/** how much the beat swells and settles, per frame of a four-frame effect */
const BEAT = [1, 1.12, 1, 0.88];

/**
 * A beaten effect from one still: each frame the still resampled about its
 * centre by the beat's scale, side by side, so the scene's looping effect
 * animation reads as a drum struck rather than a drum standing.
 */
export const beatFrames = (
  still: Image,
  frames = BEAT.length,
): { image: Image; frame: { width: number; height: number } } => {
  const image = blankImage(still.width * frames, still.height);
  for (let i = 0; i < frames; i += 1) {
    const scale = BEAT[i % BEAT.length];
    const width = Math.max(1, Math.round(still.width * scale));
    const height = Math.max(1, Math.round(still.height * scale));
    const scaled = resampleImage(still, { width, height });
    const dx = Math.floor((still.width - width) / 2);
    const dy = Math.floor((still.height - height) / 2);
    // a swollen frame overruns the cell; what runs over is clipped
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const tx = i * still.width + dx + x;
        const ty = dy + y;
        if (tx < i * still.width || tx >= (i + 1) * still.width) continue;
        if (ty < 0 || ty >= still.height) continue;
        setPixel(image, tx, ty, pixelAt(scaled, x, y));
      }
    }
  }
  return { image, frame: { width: still.width, height: still.height } };
};

/**
 * The ground a plain sheet id names, or null for a pair (`terrain.x@y`) or
 * anything that is not a ground at all. A pair draws a boundary and carries
 * one block, so only a plain sheet stacks rearrangements.
 */
const groundOfId = (id: string): Ground | null =>
  GROUNDS.find((ground) => tilesetIdOf(ground) === id) ?? null;

/** `terrain.field~autumn` for a season (or the night), the plain id for none. */
const seasonalIdOf = (id: string, season?: Season | "night"): string =>
  season ? `${id}~${season}` : id;

/**
 * The finish a sheet's own ground wears in a season: a generated variant is
 * finished on its own terms, a recolour rides on the plain sheet's finish,
 * and a ground with no variant in that season wears its plain finish.
 */
const ownFinishOf = (item: PeriodTilesetItem, season?: Season): SheetFinish => {
  const own: SheetFinish = { desaturate: item.desaturate, adjust: item.adjust };
  const variant = season ? item.seasons?.[season] : undefined;
  if (!variant) return own;
  const seasonal: SheetFinish = {
    desaturate: variant.desaturate,
    adjust: variant.adjust,
  };
  return variant.file ? seasonal : { ...own, then: seasonal };
};

/**
 * The seasons a sheet is built for: its own, and for a pair the seasons of
 * either ground it joins, since a boundary drawn in spring on one side and
 * autumn on the other is the collar the seasonal build exists to remove.
 */
export const seasonsOf = (
  spec: PeriodSpec,
  item: PeriodTilesetItem,
): Season[] => {
  const seasons = new Set<Season>(Object.keys(item.seasons ?? {}) as Season[]);
  const upper = upperGroundOf(item.id);
  for (const ground of [upper, item.against]) {
    if (!ground) continue;
    const drawing = itemDrawing(spec, ground);
    for (const season of Object.keys(drawing.seasons ?? {}) as Season[]) {
      seasons.add(season);
    }
  }
  return SEASONS.filter((season) => seasons.has(season));
};

/**
 * What the build did to the download. `items.json` carries these beside the
 * prompt, and they are as much of the art as the generation is: the same
 * sheet keyed two ways is two different biomes on the map.
 */
const finishOf = (item: PeriodItem): Record<string, unknown> | undefined => {
  if (item.kind === "kit") {
    return { stretch: KIT_FRAME.height / KIT_SOURCE.height };
  }
  if (item.kind === "floor") {
    const ground = groundOfId(item.id);
    return {
      stretch: KIT_SOURCE.cell.width / KIT_SOURCE.cell.height,
      ...(ground && blocksOf(ground) > 1 ? { variants: blocksOf(ground) } : {}),
      ...(item.variantTone ? { variantTone: item.variantTone } : {}),
    };
  }
  if (item.kind === "sprite") {
    const finish: Record<string, unknown> = {};
    if (item.actions?.length) {
      finish.actions = item.actions.map((action) => action.id);
      const mirror = item.actions.find((action) => action.mirror)?.mirror;
      if (mirror) finish.mirror = mirror;
    }
    if (item.desaturate) finish.desaturate = item.desaturate;
    if (item.adjust) finish.adjust = item.adjust;
    return Object.keys(finish).length ? finish : undefined;
  }
  if (item.kind === "overlay") {
    const finish: Record<string, unknown> = {
      slot: item.slot ?? OVERLAYS[item.id.slice("overlay.".length)],
    };
    if (!item.dir) finish.mirror = "east";
    if (item.desaturate) finish.desaturate = item.desaturate;
    if (item.adjust) finish.adjust = item.adjust;
    return finish;
  }
  if (item.kind === "effect") {
    const finish: Record<string, unknown> = {
      beat: item.frames ?? BEAT.length,
    };
    if (item.desaturate) finish.desaturate = item.desaturate;
    if (item.adjust) finish.adjust = item.adjust;
    return finish;
  }
  if (item.kind !== "tileset") return undefined;
  const finish: Record<string, unknown> = {};
  if (item.against) finish.against = item.against;
  if (item.fill) finish.fill = item.fill;
  if (item.desaturate) finish.desaturate = item.desaturate;
  if (item.key) finish.key = item.key;
  if (item.keyTolerance) finish.keyTolerance = item.keyTolerance;
  if (item.frames) finish.frames = item.frames;
  const ground = groundOfId(item.id);
  // the block count is derived rather than declared, and the showcase still
  // wants to see it, so the record carries what the build applied
  if (ground && !item.frames && blocksOf(ground) > 1) {
    finish.variants = blocksOf(ground);
  }
  if (item.variantTone) finish.variantTone = item.variantTone;
  if (item.adjust) finish.adjust = item.adjust;
  return Object.keys(finish).length ? finish : undefined;
};

/** The making of one id, carried into the manifest for the showcase page. */
export const recordOf = (item: PeriodItem): AssetRecord => {
  const finish = finishOf(item);
  return {
    tool: item.tool,
    prompt: item.prompt,
    ...(item.settings ? { settings: item.settings } : {}),
    ...(item.jobId ? { jobId: item.jobId } : {}),
    ...(item.characterId ? { characterId: item.characterId } : {}),
    ...(item.date ? { date: item.date } : {}),
    ...(item.generations === undefined
      ? {}
      : { generations: item.generations }),
    ...(item.note ? { note: item.note } : {}),
    ...(finish ? { finish } : {}),
  };
};

/**
 * The finish the ground named by `against` wears everywhere else on the map.
 * A chained sheet paints that ground in its own surround, so it has to be
 * corrected the same way or the map shows a patch of differently-lit grass
 * around every range.
 */
const itemDrawing = (spec: PeriodSpec, ground: string): PeriodTilesetItem => {
  const item = spec.items.find(
    (candidate) =>
      candidate.kind === "tileset" &&
      (candidate.id === `terrain.${ground}` ||
        candidate.id === `water.${ground}`),
  ) as PeriodTilesetItem | undefined;
  if (!item) {
    throw new BadRequestError(
      `no tileset item draws "${ground}", which another sheet is drawn against`,
    );
  }
  return item;
};

export const finishAgainst = (
  spec: PeriodSpec,
  against: string,
  season?: Season,
): SheetFinish => ownFinishOf(itemDrawing(spec, against), season);

/**
 * One tileset item's sheet as the build finishes it, before it is expanded to
 * blob tiles. Split out of the build because a sheet drawn against a ground has
 * to be recoloured onto the colours that ground wears, and a plain sheet is
 * itself drawn against grass: reading the plain sheet's raw tile would answer
 * with colours the map never shows, since `splitFinish` repaints every pixel it
 * classifies as the lower ground. Cached per item, since a pair asks for both
 * of its neighbours and every ground has several pairs.
 */
const finishedSheet = async (
  spec: PeriodSpec,
  root: string,
  item: PeriodTilesetItem,
  cache: Map<string, Promise<{ sheet: Image; meta: WangMetadata }>>,
  drawing: string[] = [],
  season?: Season,
): Promise<{ sheet: Image; meta: WangMetadata }> => {
  const key = seasonalIdOf(item.id, season);
  const cached = cache.get(key);
  if (cached) return cached;
  if (drawing.includes(item.id)) {
    throw new BadRequestError(
      `"${item.id}" is drawn against itself: ${[...drawing, item.id].join(" → ")}`,
    );
  }
  const work = (async () => {
    const tile = spec.tile;
    // a season with a sheet of its own is read from it; a recolour and a
    // ground the season leaves alone are read from the plain sheet
    const variant = season ? item.seasons?.[season] : undefined;
    const source =
      variant?.file && variant.metadata
        ? { file: variant.file, metadata: variant.metadata }
        : { file: item.file, metadata: item.metadata };
    const raw = await readPng(path.join(root, source.file));
    const meta = JSON.parse(
      await readFile(path.join(root, source.metadata), "utf8"),
    ) as WangMetadata;
    const own = ownFinishOf(item, season);
    if (!item.against) return { sheet: applyFinish(raw, own), meta };
    const drawn = upperGroundOf(item.id);
    const next = [...drawing, item.id];
    const index = wangIndex(meta);
    // a pair's own half wears the upper ground's seasonal recolour on top of
    // the pair's own finish, and is then matched onto the colours the upper
    // ground's own sheet wears in that season (a generated variant included)
    const upperSeasonal =
      drawn && season ? itemDrawing(spec, drawn).seasons?.[season] : undefined;
    const upper: SheetFinish =
      upperSeasonal && !upperSeasonal.file
        ? {
            ...own,
            then: {
              desaturate: upperSeasonal.desaturate,
              adjust: upperSeasonal.adjust,
            },
          }
        : own;
    return {
      sheet: splitFinish(raw, {
        lowerPalette: lowerSwatches(raw, meta, tile),
        upperPalette: cornerSwatches(raw, meta, "upper", tile),
        lowerBox: index.get("0000"),
        upperBox: index.get("1111"),
        lower: finishAgainst(spec, item.against, season),
        upper,
        lowerTarget: await paletteAgainst(
          spec,
          root,
          item.against,
          cache,
          next,
          season,
        ),
        upperTarget: drawn
          ? await paletteAgainst(spec, root, drawn, cache, next, season)
          : undefined,
      }),
      meta,
    };
  })();
  cache.set(key, work);
  return work;
};

/**
 * The colours the ground named by `against` actually wears on the map: the pure
 * tile of its own sheet, finished. A chained sheet paints that ground in its own
 * surround, and the generator reproduces the base tile it was chained to only
 * sometimes, so the surround is recoloured onto these rather than corrected the
 * same way and hoped over.
 */
export const paletteAgainst = async (
  spec: PeriodSpec,
  root: string,
  against: string,
  cache: Map<string, Promise<{ sheet: Image; meta: WangMetadata }>> = new Map(),
  drawing: string[] = [],
  season?: Season,
): Promise<Swatch[]> => {
  const item = itemDrawing(spec, against);
  const { sheet, meta } = await finishedSheet(
    spec,
    root,
    item,
    cache,
    drawing,
    season,
  );
  return cornerSwatches(sheet, meta, "upper", spec.tile);
};

/**
 * The ground a pair draws, read from its id: `terrain.mountain@forest` is the
 * mountain as it meets the wood. Undefined for a plain sheet, which is the sheet
 * every pair of that ground has to match.
 */
export const upperGroundOf = (id: string): string | undefined => {
  const at = id.indexOf("@");
  if (at < 0) return undefined;
  const dot = id.indexOf(".");
  return id.slice(dot + 1, at);
};

export interface BuildPeriodOptions {
  spec: PeriodSpec;
  root: string;
  outDir: string;
  /** the built layer to fill this spec's gaps from (`spec.derive`, resolved) */
  derive?: DeriveSource;
  log?: (line: string) => void;
}

/** One frame's anchors at a smaller tile: each lands on the pixel its block shrinks to. */
export const scaleAnchors = (
  anchors: SpriteAnchors,
  factor: number,
): SpriteAnchors =>
  Object.fromEntries(
    Object.entries(anchors).map(([slot, [x, y]]) => [
      slot,
      [Math.floor(x / factor), Math.floor(y / factor)],
    ]),
  ) as SpriteAnchors;

/** Halves (or thirds) every dimension an entry carries, at a whole factor. */
export const scaleEntry = (
  entry: AssetEntry,
  factor: number,
  id: string,
): AssetEntry => {
  const down = (value: number, what: string): number => {
    if (value % factor !== 0) {
      throw new BadRequestError(
        `${id}: ${what} ${value} does not divide by ${factor}`,
      );
    }
    return value / factor;
  };
  return {
    ...entry,
    width: down(entry.width, "width"),
    height: down(entry.height, "height"),
    ...(entry.frame
      ? {
          frame: {
            width: down(entry.frame.width, "frame width"),
            height: down(entry.frame.height, "frame height"),
          },
        }
      : {}),
    ...(entry.sprite
      ? {
          sprite: {
            ...entry.sprite,
            frameWidth: down(entry.sprite.frameWidth, "frame width"),
            frameHeight: down(entry.sprite.frameHeight, "frame height"),
            // an anchor is a pixel, not a dimension: it lands on the pixel
            // its block shrinks to, so it floors rather than divides
            ...(entry.sprite.anchors
              ? {
                  anchors: entry.sprite.anchors.map((anchor) =>
                    scaleAnchors(anchor, factor),
                  ),
                }
              : {}),
          },
        }
      : {}),
    ...(entry.overlay
      ? {
          overlay: {
            ...entry.overlay,
            pivots: Object.fromEntries(
              Object.entries(entry.overlay.pivots).map(([facing, [x, y]]) => [
                facing,
                [Math.floor(x / factor), Math.floor(y / factor)],
              ]),
            ) as OverlayMeta["pivots"],
          },
        }
      : {}),
    ...(entry.kit
      ? {
          kit: {
            cell: {
              x: down(entry.kit.cell.x, "cell x"),
              y: down(entry.kit.cell.y, "cell y"),
              size: down(entry.kit.cell.size, "cell size"),
            },
          },
        }
      : {}),
  };
};

export const buildPeriod = async ({
  spec,
  root,
  outDir,
  derive,
  log = () => {},
}: BuildPeriodOptions): Promise<VendorManifest> => {
  await mkdir(outDir, { recursive: true });
  const assets: Record<string, AssetEntry> = {};
  const sheets = new Map<
    string,
    Promise<{ sheet: Image; meta: WangMetadata }>
  >();
  /**
   * One ground sheet, plain or in a season: finished, expanded to blob tiles,
   * keyed, framed, and stacked. The seasonal sheet takes every step the
   * plain one does, since the scene binds it in the plain one's place.
   */
  const buildTileset = async (
    item: PeriodTilesetItem,
    season?: Season,
  ): Promise<void> => {
    const id = seasonalIdOf(item.id, season);
    const file = `${id}.png`;
    {
      const tile = spec.tile;
      const { sheet, meta } = await finishedSheet(
        spec,
        root,
        item,
        sheets,
        [],
        season,
      );
      let image = item.fill
        ? wangFillSheet({ sheet, meta, tile, fill: item.fill })
        : wangBlobSheet({ sheet, meta, tile });
      if (item.key === "lower") {
        image = keyPalette(
          image,
          lowerPalette(sheet, meta, tile),
          item.keyTolerance ?? 0,
        );
      }
      if (item.key === "upper") {
        image = keepPalette(
          image,
          cornerPalette(sheet, meta, "upper", tile),
          item.keyTolerance ?? 0,
        );
      }
      if (item.frames) {
        image = waterFrames(image, {
          frames: item.frames,
          palette: cornerPalette(sheet, meta, "upper", tile),
        });
      }
      // how many rearrangements a plain ground stacks is the map builder's
      // rule, not the author's: a sheet short of what the map addresses
      // renders blank, and the author is the one who would forget
      const ground = groundOfId(item.id);
      const variants = ground && !item.frames ? blocksOf(ground) : 1;
      if (variants > 1) {
        image = variantSheet(image, variants, {
          tone: item.variantTone,
          tile,
        });
      }
      await writePng(path.join(outDir, file), image);
      const variant = season ? item.seasons?.[season] : undefined;
      const record: AssetRecord = season
        ? {
            ...recordOf(item),
            season,
            ...(variant?.prompt ? { prompt: variant.prompt } : {}),
            ...(variant?.settings ? { settings: variant.settings } : {}),
            ...(variant?.jobId ? { jobId: variant.jobId } : {}),
            ...(variant?.date ? { date: variant.date } : {}),
            ...(variant?.note ? { note: variant.note } : {}),
            // a recolour spends no generation; a sheet of its own spends its own
            generations: variant?.file ? (variant.generations ?? 1) : 0,
            finish: {
              ...(recordOf(item).finish ?? {}),
              ...(variant?.file ? { file: variant.file } : {}),
              ...(variant?.adjust ? { seasonAdjust: variant.adjust } : {}),
              ...(variant?.desaturate
                ? { seasonDesaturate: variant.desaturate }
                : {}),
            },
          }
        : recordOf(item);
      assets[id] = {
        file,
        kind: "blob",
        width: image.width,
        height: image.height,
        pack: "pixellab",
        record,
      };
      log(
        `${id}  ${image.width}x${image.height}  ← ${variant?.file ?? item.file}`,
      );
    }
  };
  for (const item of spec.items) {
    const file = `${item.id}.png`;
    if (item.kind === "tileset") {
      await buildTileset(item);
      for (const season of seasonsOf(spec, item)) {
        await buildTileset(item, season);
      }
      continue;
    }
    if (item.kind === "kit") {
      // the generator draws a foreshortened 32 × 24 footprint, and the map
      // is square, so every row of every piece is stretched by the same
      // ratio; nearest-neighbour, so the art keeps its outlines
      const rows = Math.ceil(KIT_PIECES / KIT_COLUMNS);
      const image = blankImage(
        KIT_COLUMNS * KIT_FRAME.width,
        rows * KIT_FRAME.height,
      );
      for (let piece = 0; piece < KIT_PIECES; piece += 1) {
        const raw = await readPng(path.join(root, item.dir, `${piece}.png`));
        if (
          raw.width !== KIT_SOURCE.width ||
          raw.height !== KIT_SOURCE.height
        ) {
          throw new BadRequestError(
            `${item.id} piece ${piece} is ${raw.width}x${raw.height}, not ${KIT_SOURCE.width}x${KIT_SOURCE.height}`,
          );
        }
        const stretched = resampleImage(raw, KIT_FRAME);
        copyRect({
          source: stretched,
          sx: 0,
          sy: 0,
          width: KIT_FRAME.width,
          height: KIT_FRAME.height,
          target: image,
          tx: (piece % KIT_COLUMNS) * KIT_FRAME.width,
          ty: Math.floor(piece / KIT_COLUMNS) * KIT_FRAME.height,
        });
      }
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "kit",
        width: image.width,
        height: image.height,
        frames: KIT_PIECES,
        frame: { width: KIT_FRAME.width, height: KIT_FRAME.height },
        kit: { cell: { ...KIT_CELL } },
        pack: "pixellab",
        record: recordOf(item),
      };
      log(
        `${item.id}  ${image.width}x${image.height}  ${KIT_PIECES} pieces  ← ${item.dir}`,
      );
      continue;
    }
    if (item.kind === "floor") {
      const tile = spec.tile;
      const raw = await readPng(path.join(root, item.file));
      const cell = resampleImage(cropImage(raw, { ...KIT_SOURCE.cell }), {
        width: tile,
        height: tile,
      });
      let image = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
      BLOB_MASKS.forEach((_, position) => {
        copyRect({
          source: cell,
          sx: 0,
          sy: 0,
          width: tile,
          height: tile,
          target: image,
          tx: (position % BLOB_COLUMNS) * tile,
          ty: Math.floor(position / BLOB_COLUMNS) * tile,
        });
      });
      const ground = groundOfId(item.id);
      const variants = ground ? blocksOf(ground) : 1;
      if (variants > 1) {
        image = variantSheet(image, variants, { tone: item.variantTone, tile });
      }
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "blob",
        width: image.width,
        height: image.height,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(`${item.id}  ${image.width}x${image.height}  ← ${item.file}`);
      continue;
    }
    if (item.kind === "image") {
      // an object takes the same `desaturate` / `adjust` finish a sheet does:
      // the generator drifts rock toward violet whatever it is drawing, and a
      // marker off the map's range is the same fault as a tile off it
      const image = applyFinish(await readPng(path.join(root, item.file)), {
        desaturate: item.desaturate,
        adjust: item.adjust,
      });
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "image",
        width: image.width,
        height: image.height,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(`${item.id}  ${image.width}x${image.height}  ← ${item.file}`);
      for (const season of [...SEASONS, "night" as const]) {
        const variant = item.seasons?.[season];
        if (!variant) continue;
        const id = seasonalIdOf(item.id, season);
        const seasonal: SheetFinish = {
          desaturate: variant.desaturate,
          adjust: variant.adjust,
        };
        const drawn = variant.file
          ? applyFinish(await readPng(path.join(root, variant.file)), seasonal)
          : applyFinish(image, seasonal);
        const seasonalFile = `${id}.png`;
        await writePng(path.join(outDir, seasonalFile), drawn);
        assets[id] = {
          file: seasonalFile,
          kind: "image",
          width: drawn.width,
          height: drawn.height,
          pack: "pixellab",
          record: {
            ...recordOf(item),
            season,
            ...(variant.prompt ? { prompt: variant.prompt } : {}),
            ...(variant.settings ? { settings: variant.settings } : {}),
            ...(variant.jobId ? { jobId: variant.jobId } : {}),
            ...(variant.date ? { date: variant.date } : {}),
            ...(variant.note ? { note: variant.note } : {}),
            generations: variant.file ? (variant.generations ?? 1) : 0,
            finish: {
              ...(variant.file ? { file: variant.file } : {}),
              ...(variant.adjust ? { seasonAdjust: variant.adjust } : {}),
              ...(variant.desaturate
                ? { seasonDesaturate: variant.desaturate }
                : {}),
            },
          },
        };
        log(
          `${id}  ${drawn.width}x${drawn.height}  ← ${variant.file ?? item.file}`,
        );
      }
      continue;
    }
    if (item.kind === "overlay") {
      const slot = item.slot ?? OVERLAYS[item.id.slice("overlay.".length)];
      if (!slot) {
        throw new BadRequestError(
          `${item.id} names no slot and the catalog registers none for it`,
        );
      }
      const finish: SheetFinish = {
        desaturate: item.desaturate,
        adjust: item.adjust,
      };
      const frames: Partial<Record<Facing, Image>> & { still?: Image } = {};
      if (item.dir) {
        for (const [facing, source] of Object.entries(FACING_SOURCE)) {
          frames[facing as Facing] = applyFinish(
            await readPng(path.join(root, item.dir, "walk", `${source}-0.png`)),
            finish,
          );
        }
      } else if (item.file) {
        frames.still = applyFinish(
          await readPng(path.join(root, item.file)),
          finish,
        );
      } else {
        throw new BadRequestError(`${item.id} names neither a file nor a dir`);
      }
      const { image, meta } = overlaySheet(frames, slot);
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "overlay",
        width: image.width,
        height: image.height,
        frames: FACINGS.length,
        frame: { width: image.width / FACINGS.length, height: image.height },
        overlay: meta,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(
        `${item.id}  ${image.width}x${image.height}  ${slot}  ← ${item.dir ?? item.file}`,
      );
      continue;
    }
    if (item.kind === "effect") {
      const still = applyFinish(await readPng(path.join(root, item.file)), {
        desaturate: item.desaturate,
        adjust: item.adjust,
      });
      const { image, frame } = beatFrames(still, item.frames);
      await writePng(path.join(outDir, file), image);
      assets[item.id] = {
        file,
        kind: "effect",
        width: image.width,
        height: image.height,
        frames: item.frames ?? BEAT.length,
        frame,
        pack: "pixellab",
        record: recordOf(item),
      };
      log(
        `${item.id}  ${image.width}x${image.height}  ${item.frames ?? BEAT.length} frames  ← ${item.file}`,
      );
      continue;
    }
    const spriteFinish: SheetFinish = {
      desaturate: item.desaturate,
      adjust: item.adjust,
    };
    const finishFacings = (
      facings: Record<string, Image[]>,
    ): Record<string, Image[]> =>
      Object.fromEntries(
        Object.entries(facings).map(([facing, images]) => [
          facing,
          images.map((image) => applyFinish(image, spriteFinish)),
        ]),
      );
    const frames = finishFacings(
      readFacings(
        root,
        path.join(item.dir, "walk"),
        item.frames,
        `${item.id} walk`,
      ),
    );
    const actions = (item.actions ?? []).map((action) => ({
      id: action.id,
      count: action.frames,
      frames: finishFacings(
        readFacings(
          root,
          action.dir,
          action.frames,
          `${item.id} ${action.id}`,
          action.mirror,
        ),
      ),
    }));
    const { image, meta } = assembleSprite(frames, {
      frame: item.frame,
      count: item.frames,
      actions,
    });
    await writePng(path.join(outDir, file), image);
    assets[item.id] = {
      file,
      kind: "sprite",
      width: image.width,
      height: image.height,
      sprite: meta,
      pack: "pixellab",
      record: recordOf(item),
    };
    log(
      `${item.id}  ${image.width}x${image.height}  ${item.frames} frames${actions.length ? ` + ${actions.map((a) => a.id).join(", ")}` : ""}  ← ${item.dir}`,
    );
  }
  if (derive) {
    // whatever this spec does not draw itself is borrowed from the layer it
    // derives from, shrunk to this tile: a generation is spent once and both
    // sets draw it, and an id this spec does draw keeps its own drawing
    const factor = derive.tile / spec.tile;
    if (!Number.isInteger(factor) || factor < 1) {
      throw new BadRequestError(
        `${spec.source} at ${spec.tile} px cannot derive from ${derive.source} at ${derive.tile} px`,
      );
    }
    let derived = 0;
    for (const [id, entry] of Object.entries(derive.manifest.assets)) {
      if (assets[id]) continue;
      const image = downsampleImage(
        await readPng(path.join(derive.dir, entry.file)),
        factor,
      );
      const file = `${id}.png`;
      await writePng(path.join(outDir, file), image);
      assets[id] = {
        ...scaleEntry(entry, factor, id),
        file,
        record: entry.record
          ? { ...entry.record, derived: derive.source }
          : { tool: "derived", prompt: "", derived: derive.source },
      };
      derived += 1;
      log(
        `${id}  ${image.width}x${image.height}  ↓ ${derive.source} / ${factor}`,
      );
    }
    log(`${derived} derived from ${derive.source} at ${derive.tile} px`);
  }
  const manifest: VendorManifest = {
    version: 1,
    source: spec.source,
    tile: spec.tile,
    assets,
  };
  await writeFile(
    path.join(outDir, `${spec.source}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
};

/**
 * The layer a spec derives from, read from the sibling spec file and its
 * built manifest. The built layer is committed, so its absence is a fault
 * rather than a gap to skip: the derived ids would silently vanish from the
 * set and the site pages would fall back to the procedural stand-ins.
 */
export const deriveSourceOf = async (
  specPath: string,
  repo: string,
): Promise<DeriveSource> => {
  const other = JSON.parse(await readFile(specPath, "utf8")) as PeriodSpec;
  const dir = path.join(repo, other.out);
  const manifestPath = path.join(dir, `${other.source}.json`);
  let manifest: VendorManifest;
  try {
    manifest = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as VendorManifest;
  } catch {
    throw new NotFoundError(
      `${path.relative(repo, manifestPath)} is not built; run the ${other.source} build first`,
    );
  }
  return { source: other.source, tile: other.tile, dir, manifest };
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../../../..");
  const file = process.argv[2] ?? "items.json";
  const spec = JSON.parse(
    await readFile(path.resolve(here, file), "utf8"),
  ) as PeriodSpec;
  const root = process.env.STAGE_PIXELLAB_DIR ?? path.join(repo, spec.root);
  const outDir = path.join(repo, spec.out);
  const derive = spec.derive
    ? await deriveSourceOf(path.resolve(here, spec.derive), repo)
    : undefined;
  const manifest = await buildPeriod({
    spec,
    root,
    outDir,
    derive,
    log: (line) => console.log(line),
  });
  console.log(
    `${Object.keys(manifest.assets).length} ${spec.source} assets at ${spec.tile} px → ${path.relative(repo, outDir)}/${spec.source}.json`,
  );
}
