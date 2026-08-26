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

/**
 * A colour and how much of the tile it covers. The share is what tells a body
 * from a highlight: a palette alone says which shades a terrain is drawn in,
 * and only the count says which of them is the ground and which is the glint
 * on one crown.
 */
export interface Swatch {
  colour: Rgba;
  /** pixels of the tile wearing it */
  count: number;
}

/** The colours of a Wang tileset's plain lower or upper tile, with their area. */
export const cornerSwatches = (
  sheet: Image,
  meta: WangMetadata,
  corner: WangCornerValue,
  tile = 16,
): Swatch[] => {
  const index = wangIndex(meta);
  const bit = corner === "upper" ? 1 : 0;
  const box = boxOf(index, keyOf(bit, bit, bit, bit));
  const at = new Map<number, Swatch>();
  const swatches: Swatch[] = [];
  for (let y = 0; y < tile; y += 1) {
    for (let x = 0; x < tile; x += 1) {
      const pixel = pixelAt(sheet, box.x + x, box.y + y);
      if (pixel[3] === 0) continue;
      const packed = (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];
      const seen = at.get(packed);
      if (seen) {
        seen.count += 1;
        continue;
      }
      const swatch = { colour: pixel, count: 1 };
      at.set(packed, swatch);
      swatches.push(swatch);
    }
  }
  return swatches;
};

/** The distinct colours of a Wang tileset's plain lower or upper tile. */
export const cornerPalette = (
  sheet: Image,
  meta: WangMetadata,
  corner: WangCornerValue,
  tile = 16,
): Rgba[] =>
  cornerSwatches(sheet, meta, corner, tile).map((swatch) => swatch.colour);

/** The colours of a Wang tileset's plain lower tile, with their area. */
export const lowerSwatches = (
  sheet: Image,
  meta: WangMetadata,
  tile = 16,
): Swatch[] => cornerSwatches(sheet, meta, "lower", tile);

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
  /** the colours of the sheet's plain lower tile, with the area each covers */
  lowerPalette: Swatch[];
  /** the colours of the sheet's plain upper tile, with the area each covers */
  upperPalette: Swatch[];
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
  lowerTarget?: Swatch[];
  /**
   * The colours this sheet's own terrain wears on the map, where that terrain is
   * drawn by another sheet: a pair's upper half against the plain sheet of the
   * same ground. Chaining fixes the base tile and nothing else, so a pair can
   * reproduce the tile it was given and still draw the rest of the range in its
   * own palette, which puts a bright patch of the range wherever that pair is
   * laid. Recolouring the upper half onto the plain sheet's colours is what makes
   * the two indistinguishable; it is identity for a pair that already matched.
   */
  upperTarget?: Swatch[];
  /**
   * The two plain tiles' boxes. Each is one terrain and nothing else by
   * construction, so no nearest-palette guess should be allowed to hand any of
   * their pixels to the other half. Left to the guess, a fraction of a percent
   * of the plain upper tile comes back wearing the lower ground — and that tile
   * is what `paletteAgainst` hands every pair of the ground as its target, so a
   * rare stray colour becomes a slot in the target for a whole transition band
   * to land in. A quarter of the hills pairs was grass's light shade, which is a
   * cream bar along every contact.
   */
  lowerBox?: Box;
  upperBox?: Box;
}

const inBox = (box: Box | undefined, x: number, y: number): boolean =>
  !!box &&
  x >= box.x &&
  x < box.x + box.width &&
  y >= box.y &&
  y < box.y + box.height;

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

export interface MatchPaletteOptions {
  /** the colours the image is drawn in, with the area each covers */
  from: Swatch[];
  /** the colours it is to be drawn in, with the area each covers */
  to: Swatch[];
  /**
   * What the region being recoloured actually wears, with the area each colour
   * covers. A generator draws a boundary in shades the plain tile never carries,
   * and every one of those snaps to whichever palette entry it sits nearest: a
   * wide lit shoulder a shade off the ground's highlight becomes the highlight
   * outright, and the map reads a pale ribbon tracing every boundary. Given the
   * region's own histogram, a colour `from` does not carry is placed by where
   * its own area sits instead, which puts a band covering the middle of the
   * region onto the shade covering the middle of the target. The entries `from`
   * does carry keep their `from`-derived place, so the plain tile still
   * reproduces pixel for pixel.
   */
  area?: Swatch[];
}

const colourKey = (colour: Rgba): string =>
  `${colour[0]},${colour[1]},${colour[2]}`;

/**
 * The share of a region a colour has to cover before it counts as that ground's
 * body rather than a detail on it. A body is placed by its own area; a detail
 * follows its nearest neighbour.
 */
const BODY_SHARE = 0.05;

/**
 * Places each shade of one histogram on the target shade covering the same
 * share of area, darkest onto darkest. Returns a colour per input swatch, in
 * the order given.
 */
const placeByArea = (
  swatches: Swatch[],
  toRanked: Swatch[],
  toEnds: number[],
): Rgba[] => {
  const total = swatches.reduce((sum, swatch) => sum + swatch.count, 0) || 1;
  const ranked = swatches
    .map((swatch, at) => ({ swatch, at }))
    .sort((a, b) => luminance(a.swatch.colour) - luminance(b.swatch.colour));
  const placed: Rgba[] = new Array(swatches.length);
  let below = 0;
  for (const { swatch, at } of ranked) {
    // the middle of this shade's own band, so a shade is placed by where its
    // area sits rather than by how many other shades happen to be listed
    const middle = (below + swatch.count / 2) / total;
    below += swatch.count;
    const found = toEnds.findIndex((end) => middle <= end);
    placed[at] = toRanked[found === -1 ? toRanked.length - 1 : found].colour;
  }
  return placed;
};

/**
 * Recolours an image from one palette onto another by luminance, darkest onto
 * darkest and lightest onto lightest, with each shade landing where the same
 * area of the target lies: a shade covering the middle half of one tile becomes
 * the shade covering the middle half of the other. A pixel takes the colour its
 * nearest entry maps to; alpha is kept.
 *
 * This is how a sheet's surround is made the ground it stands in rather than
 * something close to it. Chaining a generation to a base tile asks for that
 * tile back, and the generator returns it exactly for some sheets and returns
 * its own brighter meadow for others; there is no setting that decides which,
 * so the build closes the gap after the fact. Rank rather than nearest-in-
 * target, because two renderings of the same material carry the same few
 * shades in the same order and rank preserves the shading a nearest match
 * would flatten. Weighted by area rather than by position in that order,
 * because the two renderings do not carry the same number of shades: spreading
 * nine evenly over six puts the body of one on the highlight of the other, and
 * the patch reads a grade lighter than the ground it is standing in.
 */
export const matchPalette = (
  image: Image,
  { from, to, area }: MatchPaletteOptions,
): Image => {
  if (!from.length || !to.length) return image;
  const colours = from.map((swatch) => swatch.colour);
  const byLuminance = (a: Swatch, b: Swatch): number =>
    luminance(a.colour) - luminance(b.colour);
  const toRanked = [...to].sort(byLuminance);
  // where each target shade ends, as a share of the tile
  const toTotal = toRanked.reduce((sum, swatch) => sum + swatch.count, 0) || 1;
  let running = 0;
  const toEnds = toRanked.map((swatch) => (running += swatch.count / toTotal));
  const mapped = placeByArea(from, toRanked, toEnds);
  // A colour the plain tile does not carry is one the generator invented after
  // it reproduced the tile it was chained to, so it is placed by its share of
  // the region rather than by the entry it happens to sit nearest. How much of
  // the region it covers is what says which of the two placements to trust. A
  // shade covering a body's worth of the region is that ground as this sheet
  // draws it, and its own area is where it goes: a pair whose turf is a shade
  // off the plain sheet's is the case `upperTarget` exists to close, and forcing
  // it darker leaves the pair a visibly different green from the plain sheet
  // beside it. A rarer shade is a detail — a rim, a fleck, a dithered edge — and
  // there the area of a handful of pixels says nothing, so it follows its
  // nearest neighbour and may only ever be darkened: the fault that rule was
  // written for is a band reading brighter than the ground it belongs to, and a
  // correction that could also lighten puts a new light mark on the shore.
  const known = new Set(colours.map(colourKey));
  const strays = new Map<string, Rgba>();
  if (area) {
    const placed = placeByArea(area, toRanked, toEnds);
    const total = area.reduce((sum, swatch) => sum + swatch.count, 0) || 1;
    area.forEach((swatch, at) => {
      const key = colourKey(swatch.colour);
      if (known.has(key)) return;
      const near = mapped[nearestIndex(swatch.colour, colours)];
      const body = swatch.count / total >= BODY_SHARE;
      strays.set(
        key,
        body || luminance(placed[at]) < luminance(near) ? placed[at] : near,
      );
    });
  }
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixel = pixelAt(image, x, y);
      if (pixel[3] === 0) continue;
      const colour =
        strays.get(colourKey(pixel)) ?? mapped[nearestIndex(pixel, colours)];
      setPixel(out, x, y, [colour[0], colour[1], colour[2], pixel[3]]);
    }
  }
  return out;
};

/** The share of a plain tile's area each of its colours covers. */
const sharesOf = (swatches: Swatch[]): Map<string, number> => {
  const total = swatches.reduce((sum, swatch) => sum + swatch.count, 0) || 1;
  const shares = new Map<string, number>();
  for (const swatch of swatches) {
    const key = colourKey(swatch.colour);
    shares.set(key, (shares.get(key) ?? 0) + swatch.count / total);
  }
  return shares;
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
 *
 * A colour both plain tiles carry is nearest to both, and a tie broken by which
 * half is tested first hands a terrain's own body to the other one: the
 * downland's turf is 40% of its plain tile and a handful of pixels of the
 * meadow's brightest highlight, so an equal distance sent every one of those
 * pixels to the meadow and the whole region came back painted in grass's
 * lightest shade — a flat pale shelf a tile deep wherever the region's edge ran
 * straight. A tie therefore goes to whichever ground actually wears the colour,
 * by area. Only on a tie: a strictly nearer palette is still the answer.
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
    lowerBox,
    upperBox,
  }: SplitFinishOptions,
): Image => {
  const lowerColours = lowerPalette.map((swatch) => swatch.colour);
  const upperColours = upperPalette.map((swatch) => swatch.colour);
  const lowerShares = sharesOf(lowerPalette);
  const upperShares = sharesOf(upperPalette);
  // classify before recolouring, so each half is matched against what it
  // actually wears: the transition band belongs to whichever half claims it,
  // and its area is what keeps it from being read as that ground's highlight
  const belongsLower = new Uint8Array(image.width * image.height);
  const areas = [new Map<string, Swatch>(), new Map<string, Swatch>()];
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const pixel = pixelAt(image, x, y);
      const toLower = nearest(pixel, lowerColours);
      const toUpper = nearest(pixel, upperColours);
      const key = colourKey(pixel);
      const isLower = inBox(upperBox, x, y)
        ? false
        : inBox(lowerBox, x, y)
          ? true
          : toLower === toUpper
            ? (lowerShares.get(key) ?? 0) >= (upperShares.get(key) ?? 0)
            : toLower < toUpper;
      belongsLower[y * image.width + x] = isLower ? 1 : 0;
      if (pixel[3] === 0) continue;
      const into = areas[isLower ? 0 : 1];
      const seen = into.get(key);
      if (seen) seen.count += 1;
      else into.set(key, { colour: [...pixel], count: 1 });
    }
  }
  const lowered = lowerTarget
    ? matchPalette(image, {
        from: lowerPalette,
        to: lowerTarget,
        area: [...areas[0].values()],
      })
    : applyFinish(image, lower);
  const uppered = upperTarget
    ? matchPalette(image, {
        from: upperPalette,
        to: upperTarget,
        area: [...areas[1].values()],
      })
    : applyFinish(image, upper);
  const out = blankImage(image.width, image.height);
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const from = belongsLower[y * image.width + x] ? lowered : uppered;
      setPixel(out, x, y, pixelAt(from, x, y));
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
