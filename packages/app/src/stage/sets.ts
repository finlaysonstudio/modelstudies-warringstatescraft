import type { StageSource } from "./manifest";

/**
 * The stage's art sets. A set is one complete answer to the catalog at one
 * resolution: the layers it stacks, the tile its sheets are drawn at, and the
 * Tiled map built to that tile. Two exist — the sixteen-pixel set the first
 * bespoke pass produced, and the thirty-two-pixel set drawn over it at a
 * higher shading grade — and `/craft/tiles` shows either.
 *
 * The tile is not decoration: a ground sheet is bound to the map by pixel
 * geometry, so a set's map and its ground art have to agree. Everything that
 * is not a ground (a marker, a figure, an effect) is placed in world pixels
 * and is scaled by the ratio between the set's tile and the layer the asset
 * came from, so a lower layer still resolves rather than rendering at half
 * size.
 */
export interface StageSet {
  id: StageSetId;
  /** what the page and the eyebrow call it */
  title: string;
  /** the tile this set's ground sheets and map are built at */
  tile: number;
  /** art layers, lowest first; a higher layer replaces the lower id */
  sources: StageSource[];
  /** the Tiled map built at this set's tile */
  map: string;
  blurb: string;
}

export type StageSetId = "period-16" | "period-32";

/** The tile every layer is drawn at unless its manifest says otherwise. */
export const BASE_TILE = 16;

export const STAGE_SETS: readonly StageSet[] = [
  {
    id: "period-16",
    title: "Period 16",
    tile: 16,
    sources: ["fallback", "vendor", "period"],
    map: "/stage/overworld.tmj",
    blurb:
      "The first bespoke pass: every ground a sixteen-pixel corner sheet, generated at highly detailed with medium shading, over the purchased stand-ins and the procedural fallback beneath them.",
  },
  {
    id: "period-32",
    title: "Period 32",
    tile: 32,
    sources: ["fallback", "vendor", "period", "period32"],
    map: "/stage/overworld32.tmj",
    blurb:
      "The same country drawn again at thirty-two pixels a tile and one shading grade higher, with four times the pixels to hold the texture the sixteen-pixel sheets could only suggest.",
  },
];

/** The set the map and every scene open on. */
export const DEFAULT_STAGE_SET: StageSetId = "period-32";

export const stageSet = (id: StageSetId): StageSet =>
  STAGE_SETS.find((set) => set.id === id) ?? STAGE_SETS[0];

/** Reads a set id off a query string, falling back to the default. */
export const stageSetOf = (value: string | null | undefined): StageSet =>
  STAGE_SETS.find((set) => set.id === value) ?? stageSet(DEFAULT_STAGE_SET);
