import { blobIndexOf, maskOf } from "../../art/vendor/blob";
import {
  ARCHETYPES,
  ARCHETYPE_SPRITES,
  DECOR,
  EFFECTS,
  MARKERS,
  MARKER_VARIANTS,
  TERRAINS,
  WATERS,
  decorId,
  effectId,
  markerId,
  terrainId,
  waterId,
} from "./catalog";
import type { StageAsset, StageManifest, StageSource } from "./manifest";
import { stageSet, type StageSet } from "./sets";

/**
 * What `/craft/tiles` shows for one art set: the art that set generated for
 * itself, in catalog order, with what it still borrows from a lower layer
 * named rather than rendered. The purchased packs are deliberately absent —
 * their licence keeps them out of anything that travels.
 */

export type ShowcaseGroup = "ground" | "pair" | "place" | "decor" | "figure";

/** The lower ground a transition sheet is drawn against, or null for a plain one. */
export const lowerOf = (id: string): string | null =>
  id.includes("@") ? (id.split("@")[1] ?? null) : null;

export const groupOf = (id: string): ShowcaseGroup | null => {
  // a transition is named for the ground it draws and the one it is laid over
  if (id.includes("@")) return "pair";
  if (id.startsWith("terrain.") || id.startsWith("water.")) return "ground";
  if (id.startsWith("image.")) return "place";
  if (id.startsWith("decor.")) return "decor";
  if (id.startsWith("sprite.")) return "figure";
  return null;
};

/** The ids the map asks for, per group, in the order a reader should meet them. */
export const CATALOG_ORDER: Record<ShowcaseGroup, string[]> = {
  ground: [...TERRAINS.map(terrainId), ...WATERS.map(waterId)],
  // a transition answers an adjacency the geography happens to draw, not a
  // catalog entry, so the set's own ids are the order and they sort by name
  pair: [],
  place: MARKERS.flatMap(
    (marker) => MARKER_VARIANTS[marker] ?? [markerId(marker)],
  ),
  decor: DECOR.map(decorId),
  figure: ARCHETYPES.map((archetype) => ARCHETYPE_SPRITES[archetype][0]),
};

/** Every catalog id the stage may ask for, whichever layer answers. */
export const WANTED_IDS: string[] = [
  ...CATALOG_ORDER.ground,
  ...CATALOG_ORDER.place,
  ...CATALOG_ORDER.decor,
  ...CATALOG_ORDER.figure,
  ...EFFECTS.map(effectId),
];

export interface ShowcaseSection {
  group: ShowcaseGroup;
  title: string;
  blurb: string;
  assets: StageAsset[];
}

/** A catalog id this set does not draw itself, and the layer that answers it. */
export interface BorrowedId {
  id: string;
  /** the layer standing in, or null when nothing does */
  from: StageSource | null;
}

export interface Showcase {
  /** the set the showcase was built for */
  set: StageSet;
  /** the layer this set draws itself */
  own: StageSource;
  sections: ShowcaseSection[];
  /** how many ids the layer supplies */
  count: number;
  /** every generation they cost, failed attempts included */
  generations: number;
  /** catalog ids the map asks for that this set does not draw itself */
  borrowed: BorrowedId[];
}

/** The layer a set draws itself: the highest it stacks. */
export const ownSourceOf = (set: StageSet): StageSource =>
  set.sources[set.sources.length - 1];

const SECTIONS: { group: ShowcaseGroup; title: string; blurb: string }[] = [
  {
    group: "ground",
    title: "Ground",
    blurb:
      "One sixteen-tile corner sheet per biome, expanded to the forty-seven tile blob layout the map addresses. Each patch below is autotiled by the map's own rule, so what shows is the transition, not a swatch.",
  },
  {
    group: "pair",
    title: "Transitions",
    blurb:
      "Where two terrains meet and neither is grass, a sheet of its own draws the boundary. Each was generated against both neighbours' base tiles, so it reproduces them exactly and the map can lay it in place of the plain sheet. Each patch below stands on the ground it is laid over rather than on grass.",
  },
  {
    group: "place",
    title: "Places",
    blurb:
      "The marker over a court, town, pass, ford, or work. A town has three renderings and the map picks one per place by a hash of its key, so a repeated building varies without any data change.",
  },
  {
    group: "decor",
    title: "Decor",
    blurb:
      "Set dressing the map scatters between the places. These carry no label and no game meaning; they are there so the country between two courts is not empty.",
  },
  {
    group: "figure",
    title: "Figures",
    blurb:
      "One walk cycle per archetype, four frames a facing, animated as the stage walks a move from one place to another. Each card names the frame it was generated at.",
  },
];

/** One set's own art, grouped and ordered, with what it does not cover. */
export const showcaseOf = (manifest: StageManifest): Showcase => {
  const set = stageSet(manifest.set);
  const source = ownSourceOf(set);
  const own = Object.values(manifest.assets).filter(
    (asset) => asset.source === source,
  );
  const ids = new Set(own.map((asset) => asset.id));
  const sections = SECTIONS.map(({ group, title, blurb }) => {
    const order = CATALOG_ORDER[group];
    const assets = own
      .filter((asset) => groupOf(asset.id) === group)
      .sort((a, b) => {
        // an id the catalog does not list still shows, after the ones it does
        const rankA = order.indexOf(a.id);
        const rankB = order.indexOf(b.id);
        if (rankA === -1 || rankB === -1) {
          return rankA === rankB ? a.id.localeCompare(b.id) : rankB - rankA;
        }
        return rankA - rankB;
      });
    return { group, title, blurb, assets };
  }).filter((section) => section.assets.length > 0);
  return {
    set,
    own: source,
    sections,
    count: own.length,
    generations: own.reduce(
      (sum, asset) => sum + (asset.record?.generations ?? 0),
      0,
    ),
    borrowed: WANTED_IDS.filter((id) => !ids.has(id)).map((id) => ({
      id,
      from: manifest.assets[id]?.source ?? null,
    })),
  };
};

/** The patch a ground is shown on, in tiles. */
export const PATCH = { width: 21, height: 9 };

const inEllipse = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean => {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
};

/**
 * A lobed island with two bays bitten out of it and one lone tile off the
 * coast. The shape is chosen to exercise the sheet rather than to flatter it:
 * a card shows the four outer corners, the inner corners where a bay closes,
 * and the isolated tile, beside the fill.
 */
export const islandShape = ({ width, height } = PATCH): boolean[][] =>
  Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (x === width - 3 && y === 1) return true;
      const bay =
        inEllipse(x, y, 8.5, 0.6, 2.4, 1.9) ||
        inEllipse(x, y, 4.6, 7.6, 2.2, 1.6);
      if (bay) return false;
      return (
        inEllipse(x, y, 8, 4.4, 6.6, 3.5) || inEllipse(x, y, 15, 5.2, 3.2, 2.4)
      );
    }),
  );

/**
 * The sheet index each cell takes, or -1 where the ground is absent. Off the
 * patch counts as absent, unlike the map, which runs every terrain off its
 * own edge: an island has to show its coast.
 */
export const patchIndexes = (shape: boolean[][]): number[][] =>
  shape.map((row, y) =>
    row.map((present, x) =>
      present
        ? blobIndexOf(maskOf((dx, dy) => shape[y + dy]?.[x + dx] === true))
        : -1,
    ),
  );
