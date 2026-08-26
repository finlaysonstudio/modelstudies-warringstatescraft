import { BadRequestError } from "@jaypie/errors";

import {
  BLOB_COLUMNS,
  BLOB_MASKS,
  BLOB_ROWS,
  E,
  N,
  NE,
  NW,
  S,
  SE,
  SW,
  W,
} from "../vendor/blob";
import {
  blankImage,
  copyRect,
  pixelAt,
  setPixel,
  type Image,
  type Rgba,
} from "../vendor/png";

/**
 * Expands a PixelLab top-down Wang tileset (16 corner-coded tiles) into the
 * stage's 47-tile blob sheet by dual-grid quadrant sampling: every output
 * quadrant is the quadrant of the Wang cell centred on that tile corner, so
 * the terrain boundary (and its painted transition) lands inside the blob
 * tile and the surround out to the tile edge is the tileset's own lower
 * terrain. With every biome chained to one shared lower base, that surround
 * meets the ground layer in the same rendering.
 */

export type WangCornerValue = "upper" | "lower";

/**
 * Greys blue-dominant pixels toward their luminance by `amount` (0..1),
 * leaving green- and red-dominant pixels (the grass, the transition tufts)
 * untouched. The generator's stone keeps drifting violet however grey is
 * prompted; this pins it down deterministically.
 */
export const greyBlue = (image: Image, amount: number): Image => {
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = pixelAt(image, x, y);
      if (a > 0 && b > r && b > g) {
        const grey = Math.round((r + g + b) / 3);
        setPixel(out, x, y, [
          Math.round(r + (grey - r) * amount),
          Math.round(g + (grey - g) * amount),
          Math.round(b + (grey - b) * amount),
          a,
        ]);
      } else {
        setPixel(out, x, y, [r, g, b, a]);
      }
    }
  }
  return out;
};

export interface WangTileMeta {
  corners: Record<"NW" | "NE" | "SW" | "SE", WangCornerValue>;
  bounding_box: { x: number; y: number; width: number; height: number };
}

export interface WangMetadata {
  tileset_data: { tiles: WangTileMeta[] };
}

type Box = WangTileMeta["bounding_box"];

const keyOf = (nw: number, ne: number, sw: number, se: number): string =>
  `${nw}${ne}${sw}${se}`;

/**
 * Tile boxes by corner configuration (NW, NE, SW, SE; 1 = upper).
 *
 * A generation at a deep transition comes back as a 25-tile sheet whose four
 * extra tiles are cliff walls: they repeat a corner configuration a plain tile
 * already holds, and they belong in the map cell *below* the boundary, which a
 * blob sheet has no cell to put them in. The first tile of a configuration
 * wins, so a wall never displaces the tile the quadrant sampler expects. A
 * corner the generator calls `transition` is neither terrain, and reads as the
 * lower one, which is where those tiles sit.
 */
export const wangIndex = (meta: WangMetadata): Map<string, Box> => {
  const index = new Map<string, Box>();
  for (const tile of meta.tileset_data.tiles) {
    const bit = (value: WangCornerValue): number => (value === "upper" ? 1 : 0);
    const key = keyOf(
      bit(tile.corners.NW),
      bit(tile.corners.NE),
      bit(tile.corners.SW),
      bit(tile.corners.SE),
    );
    if (index.has(key)) continue;
    index.set(key, tile.bounding_box);
  }
  return index;
};

const boxOf = (index: Map<string, Box>, key: string): Box => {
  const box = index.get(key);
  if (!box) {
    throw new BadRequestError(
      `the Wang tileset has no tile for corners ${key}`,
    );
  }
  return box;
};

/** quadrant offsets within a tile, by quadrant name */
const QUADRANTS = {
  NW: { x: 0, y: 0 },
  NE: { x: 1, y: 0 },
  SW: { x: 0, y: 1 },
  SE: { x: 1, y: 1 },
} as const;

type QuadrantName = keyof typeof QUADRANTS;

export interface WangBlobOptions {
  sheet: Image;
  meta: WangMetadata;
  /** tile edge in pixels (default 16) */
  tile?: number;
}

/** The 47-tile blob sheet (8 x 6 grid) composed from a Wang tileset. */
export const wangBlobSheet = ({
  sheet,
  meta,
  tile = 16,
}: WangBlobOptions): Image => {
  const index = wangIndex(meta);
  const half = tile / 2;
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  const copyQuadrant = (
    sourceKey: string,
    sourceQuadrant: QuadrantName,
    tx: number,
    ty: number,
    targetQuadrant: QuadrantName,
  ): void => {
    const box = boxOf(index, sourceKey);
    const sq = QUADRANTS[sourceQuadrant];
    const tq = QUADRANTS[targetQuadrant];
    copyRect({
      source: sheet,
      sx: box.x + sq.x * half,
      sy: box.y + sq.y * half,
      width: half,
      height: half,
      target: out,
      tx: tx + tq.x * half,
      ty: ty + tq.y * half,
    });
  };
  BLOB_MASKS.forEach((mask, position) => {
    const tx = (position % BLOB_COLUMNS) * tile;
    const ty = Math.floor(position / BLOB_COLUMNS) * tile;
    const bit = (flag: number): number => ((mask & flag) !== 0 ? 1 : 0);
    const n = bit(N);
    const e = bit(E);
    const s = bit(S);
    const w = bit(W);
    // the Wang cell centred on each tile corner supplies that quadrant
    copyQuadrant(keyOf(bit(NW), n, w, 1), "SE", tx, ty, "NW");
    copyQuadrant(keyOf(n, bit(NE), 1, e), "SW", tx, ty, "NE");
    copyQuadrant(keyOf(w, 1, bit(SW), s), "NE", tx, ty, "SW");
    copyQuadrant(keyOf(1, e, s, bit(SE)), "NW", tx, ty, "SE");
  });
  return out;
};

/** A full blob sheet of one Wang tile (the ground layer's plain fill). */
export const wangFillSheet = ({
  sheet,
  meta,
  tile = 16,
  fill = "lower",
}: WangBlobOptions & { fill?: WangCornerValue }): Image => {
  const index = wangIndex(meta);
  const bit = fill === "upper" ? 1 : 0;
  const box = boxOf(index, keyOf(bit, bit, bit, bit));
  const out = blankImage(BLOB_COLUMNS * tile, BLOB_ROWS * tile);
  BLOB_MASKS.forEach((_, position) => {
    copyRect({
      source: sheet,
      sx: box.x,
      sy: box.y,
      width: tile,
      height: tile,
      target: out,
      tx: (position % BLOB_COLUMNS) * tile,
      ty: Math.floor(position / BLOB_COLUMNS) * tile,
    });
  });
  return out;
};

/** The distinct colours of a Wang tileset's plain lower or upper tile. */
export const cornerPalette = (
  sheet: Image,
  meta: WangMetadata,
  corner: WangCornerValue,
  tile = 16,
): Rgba[] => {
  const index = wangIndex(meta);
  const bit = corner === "upper" ? 1 : 0;
  const box = boxOf(index, keyOf(bit, bit, bit, bit));
  const seen = new Set<number>();
  const palette: Rgba[] = [];
  for (let y = 0; y < tile; y += 1) {
    for (let x = 0; x < tile; x += 1) {
      const pixel = pixelAt(sheet, box.x + x, box.y + y);
      if (pixel[3] === 0) continue;
      const packed = (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];
      if (seen.has(packed)) continue;
      seen.add(packed);
      palette.push(pixel);
    }
  }
  return palette;
};

/** The distinct colours of a Wang tileset's plain lower tile. */
export const lowerPalette = (
  sheet: Image,
  meta: WangMetadata,
  tile = 16,
): Rgba[] => cornerPalette(sheet, meta, "lower", tile);

/**
 * Drops every pixel of the lower terrain to transparency. A biome tileset
 * paints its transition against its own lower terrain, so an unkeyed blob
 * sheet carries a fringe of that terrain out to the tile edge and lays it
 * over whatever the map drew beneath — a collar of grass around a mountain
 * that meets loess or a river. Keying leaves only the biome and the parts of
 * the transition band that are not lower terrain (the scree, the bushes, the
 * bank), so the layer below shows through and every pair of terrains meets
 * without a generation per pair.
 *
 * `tolerance` is the largest per-channel distance from a palette colour that
 * still counts as lower terrain. Zero keys exact matches only; a few steps
 * catch the blended pixels along the boundary, which the generator dithers
 * between the two terrains and an exact key leaves behind as flecks.
 */
export const keyPalette = (
  image: Image,
  palette: Rgba[],
  tolerance = 0,
): Image => {
  const out = blankImage(image.width, image.height);
  const keyed = (r: number, g: number, b: number): boolean =>
    palette.some(
      (colour) =>
        Math.abs(r - colour[0]) <= tolerance &&
        Math.abs(g - colour[1]) <= tolerance &&
        Math.abs(b - colour[2]) <= tolerance,
    );
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = pixelAt(image, x, y);
      if (a > 0 && keyed(r, g, b)) continue;
      setPixel(out, x, y, [r, g, b, a]);
    }
  }
  return out;
};

/**
 * Keeps only what the upper terrain is made of and drops the rest. Keying the
 * lower palette alone leaves the collar the generator paints between the two
 * terrains, which lands as a warm rim around a grey crag once the ground
 * beneath is something other than the grass it was drawn against. The upper
 * tile carries its own outline colour, so the region keeps its dark edge.
 */
export const keepPalette = (
  image: Image,
  palette: Rgba[],
  tolerance = 0,
): Image => {
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = pixelAt(image, x, y);
      const kept = palette.some(
        (colour) =>
          Math.abs(r - colour[0]) <= tolerance &&
          Math.abs(g - colour[1]) <= tolerance &&
          Math.abs(b - colour[2]) <= tolerance,
      );
      if (a > 0 && kept) setPixel(out, x, y, [r, g, b, a]);
    }
  }
  return out;
};

const luminance = ([r, g, b]: Rgba): number =>
  0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Stacks `frames` copies of a blob sheet, cycling the water's brightest tones
 * between them, so the scene's water animation (it advances a water tile by a
 * whole blob block per frame) plays as ripples moving over a still surface.
 * The generator draws one sheet per tileset; deriving the frames from it
 * keeps every frame's banks and edges identical, which three separate
 * generations could not.
 */
export const waterFrames = (
  sheet: Image,
  { frames, palette }: { frames: number; palette: Rgba[] },
): Image => {
  const ramp = [...palette]
    .sort((a, b) => luminance(b) - luminance(a))
    .slice(0, Math.max(2, Math.min(frames, palette.length)));
  const out = blankImage(sheet.width, sheet.height * frames);
  for (let frame = 0; frame < frames; frame += 1) {
    const shifted = new Map<number, Rgba>();
    ramp.forEach((colour, index) => {
      shifted.set(
        (colour[0] << 16) | (colour[1] << 8) | colour[2],
        ramp[(index + frame) % ramp.length],
      );
    });
    for (let y = 0; y < sheet.height; y += 1) {
      for (let x = 0; x < sheet.width; x += 1) {
        const [r, g, b, a] = pixelAt(sheet, x, y);
        const swap = a > 0 ? shifted.get((r << 16) | (g << 8) | b) : undefined;
        setPixel(
          out,
          x,
          frame * sheet.height + y,
          swap ? [swap[0], swap[1], swap[2], a] : [r, g, b, a],
        );
      }
    }
  }
  return out;
};

/**
 * Shifts each tile's content within itself, wrapping at the tile edge. A
 * seamless tile stays seamless under a toroidal shift, so this rearranges a
 * tile's speckles without inventing a pixel or breaking the join.
 */
export const shiftTiles = (
  image: Image,
  { dx, dy, tile = 16 }: { dx: number; dy: number; tile?: number },
): Image => {
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const ox = Math.floor(x / tile) * tile;
      const oy = Math.floor(y / tile) * tile;
      const sx = ox + ((((x - ox + dx) % tile) + tile) % tile);
      const sy = oy + ((((y - oy + dy) % tile) + tile) % tile);
      setPixel(out, x, y, pixelAt(image, sx, sy));
    }
  }
  return out;
};

/**
 * Stacks `count` rearrangements of a fill sheet, so the ground layer can pick
 * one per cell and a wide field of one terrain stops reading as a grid. A
 * generated Wang tile's plain fill is flat by construction — it has to tile
 * against itself on every side — so the variety has to come from arranging
 * the few pixels it does carry, not from asking for a busier tile.
 */
export const variantSheet = (
  image: Image,
  count: number,
  { tone = 0, tile = 16 }: { tone?: number; tile?: number } = {},
): Image => {
  const out = blankImage(image.width, image.height * count);
  for (let variant = 0; variant < count; variant += 1) {
    const shifted =
      variant === 0
        ? image
        : shiftTiles(image, { dx: variant * 5, dy: variant * 7, tile });
    // a few pixels rearranged is not much on a near-flat tile, so each block
    // also carries its own tone: the field mottles instead of reading as one
    // colour under a grid of speckles
    const block =
      tone === 0 || count < 2
        ? shifted
        : adjustColour(shifted, {
            value: 1 + tone * ((variant / (count - 1)) * 2 - 1),
          });
    copyRect({
      source: block,
      sx: 0,
      sy: 0,
      width: block.width,
      height: block.height,
      target: out,
      tx: 0,
      ty: variant * image.height,
    });
  }
  return out;
};

export interface ColourAdjustment {
  /** degrees around the wheel; positive turns red toward yellow */
  hue?: number;
  saturation?: number;
  value?: number;
}

/**
 * Turns a sheet's hue and scales its saturation and value (the defaults leave
 * the channel alone). The generator picks its own palette, so this is how a
 * tileset that came back too bright, too grey, or the wrong side of a hue is
 * brought into the map's range without spending another generation.
 */
export const adjustColour = (
  image: Image,
  { hue = 0, saturation = 1, value = 1 }: ColourAdjustment,
): Image => {
  const out = blankImage(image.width, image.height);
  const clamp = (n: number): number =>
    Math.max(0, Math.min(255, Math.round(n)));
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [r, g, b, a] = pixelAt(image, x, y);
      if (a === 0) {
        setPixel(out, x, y, [r, g, b, a]);
        continue;
      }
      const [h, s, v] = toHsv(r, g, b);
      const [nr, ng, nb] = fromHsv(
        (((h + hue) % 360) + 360) % 360,
        Math.max(0, Math.min(1, s * saturation)),
        Math.max(0, Math.min(1, v * value)),
      );
      setPixel(out, x, y, [clamp(nr), clamp(ng), clamp(nb), a]);
    }
  }
  return out;
};

/**
 * What a sheet's colour is brought into the map's range by. The generator
 * picks its own palette, so every terrain carries one of these.
 */
export interface SheetFinish {
  /** grey blue-dominant pixels toward luminance by this amount (0..1) */
  desaturate?: number;
  /** turn the hue and scale saturation and value */
  adjust?: ColourAdjustment;
}

export const applyFinish = (image: Image, finish: SheetFinish = {}): Image => {
  let out = image;
  if (finish.desaturate) out = greyBlue(out, finish.desaturate);
  if (finish.adjust) out = adjustColour(out, finish.adjust);
  return out;
};

export interface SplitFinishOptions {
  /** the colours of the sheet's plain lower tile */
  lowerPalette: Rgba[];
  /** the colours of the sheet's plain upper tile */
  upperPalette: Rgba[];
  /** the finish the lower terrain wears everywhere else on the map */
  lower?: SheetFinish;
  /** the finish this sheet's own terrain wears */
  upper?: SheetFinish;
  /**
   * The colours the lower terrain actually wears on the map. When given, the
   * lower half is recoloured onto them (`matchPalette`) instead of wearing
   * their correction, because the generator only sometimes reproduces the base
   * tile it was chained to and a correction cannot close the gap when it does
   * not.
   */
  lowerTarget?: Rgba[];
  /**
   * The colours this sheet's own terrain wears on the map, where that terrain is
   * drawn by another sheet: a pair's upper half against the plain sheet of the
   * same ground. Chaining fixes the base tile and nothing else, so a pair can
   * reproduce the tile it was given and still draw the rest of the range in its
   * own palette, which puts a bright patch of the range wherever that pair is
   * laid. Recolouring the upper half onto the plain sheet's colours is what makes
   * the two indistinguishable; it is identity for a pair that already matched.
   */
  upperTarget?: Rgba[];
}

const nearestIndex = (pixel: Rgba, palette: Rgba[]): number => {
  let best = Infinity;
  let at = 0;
  for (let i = 0; i < palette.length; i += 1) {
    const dr = pixel[0] - palette[i][0];
    const dg = pixel[1] - palette[i][1];
    const db = pixel[2] - palette[i][2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < best) {
      best = distance;
      at = i;
    }
  }
  return at;
};

/**
 * Recolours an image from one palette onto another by luminance rank: the
 * darkest colour of `from` becomes the darkest of `to`, the lightest the
 * lightest, and a pixel takes the colour its nearest entry maps to. Alpha is
 * kept.
 *
 * This is how a sheet's surround is made the ground it stands in rather than
 * something close to it. Chaining a generation to a base tile asks for that
 * tile back, and the generator returns it exactly for some sheets and returns
 * its own brighter meadow for others; there is no setting that decides which,
 * so the build closes the gap after the fact. Rank rather than nearest-in-
 * target, because two renderings of the same material carry the same few
 * shades in the same order and rank preserves the shading a nearest match
 * would flatten.
 */
export const matchPalette = (image: Image, from: Rgba[], to: Rgba[]): Image => {
  if (!from.length || !to.length) return image;
  const fromRanked = from
    .map((colour, at) => ({ colour, at }))
    .sort((a, b) => luminance(a.colour) - luminance(b.colour));
  const toRanked = [...to].sort((a, b) => luminance(a) - luminance(b));
  const mapped: Rgba[] = new Array(from.length);
  fromRanked.forEach(({ at }, rank) => {
    const target =
      fromRanked.length === 1
        ? 0
        : Math.round((rank * (toRanked.length - 1)) / (fromRanked.length - 1));
    mapped[at] = toRanked[target];
  });
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixel = pixelAt(image, x, y);
      if (pixel[3] === 0) continue;
      const colour = mapped[nearestIndex(pixel, from)];
      setPixel(out, x, y, [colour[0], colour[1], colour[2], pixel[3]]);
    }
  }
  return out;
};

const nearest = (pixel: Rgba, palette: Rgba[]): number => {
  let best = Infinity;
  for (const colour of palette) {
    const dr = pixel[0] - colour[0];
    const dg = pixel[1] - colour[1];
    const db = pixel[2] - colour[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < best) best = distance;
  }
  return best;
};

/**
 * Finishes a sheet in two halves. A sheet drawn against another terrain
 * carries both terrains, and each already wears a correction of its own: the
 * range is lifted and saturated, the grass it stands in is dulled and
 * darkened. One finish over the whole sheet puts the range's correction on the
 * grass, so each pixel takes the finish of the terrain it is nearer to.
 *
 * Nearest, not a tolerance around the lower palette: the band the generator
 * draws between two terrains — the saplings at a wood's edge, the scree at a
 * range's foot — is made of colours that are neither terrain's, and a rule
 * that can only recognise the lower exactly leaves that whole band lit for the
 * upper. Which is a halo: a bright rim around every wood, on grass that has
 * been darkened around it.
 */
export const splitFinish = (
  image: Image,
  {
    lowerPalette,
    upperPalette,
    lower,
    upper,
    lowerTarget,
    upperTarget,
  }: SplitFinishOptions,
): Image => {
  const lowered = lowerTarget
    ? matchPalette(image, lowerPalette, lowerTarget)
    : applyFinish(image, lower);
  const uppered = upperTarget
    ? matchPalette(image, upperPalette, upperTarget)
    : applyFinish(image, upper);
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixel = pixelAt(image, x, y);
      const isLower =
        nearest(pixel, lowerPalette) <= nearest(pixel, upperPalette);
      setPixel(out, x, y, pixelAt(isLower ? lowered : uppered, x, y));
    }
  }
  return out;
};

const toHsv = (r: number, g: number, b: number): [number, number, number] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  let hue = 0;
  if (span !== 0) {
    if (max === r) hue = 60 * (((g - b) / span) % 6);
    else if (max === g) hue = 60 * ((b - r) / span + 2);
    else hue = 60 * ((r - g) / span + 4);
  }
  return [(hue + 360) % 360, max === 0 ? 0 : span / max, max / 255];
};

const fromHsv = (
  hue: number,
  saturation: number,
  value: number,
): [number, number, number] => {
  const chroma = value * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = value - chroma;
  const sector = Math.floor(hue / 60) % 6;
  const rgb: [number, number, number] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ][sector] as [number, number, number];
  return [(rgb[0] + base) * 255, (rgb[1] + base) * 255, (rgb[2] + base) * 255];
};
