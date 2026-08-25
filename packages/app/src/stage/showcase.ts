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
import type { StageAsset, StageManifest } from "./manifest";

/**
 * What `/craft/tiles` shows: the art this project generated for itself, in
 * catalog order, with what the map still borrows from a lower layer named
 * rather than rendered. The purchased packs are deliberately absent — their
 * licence keeps them out of anything that travels.
 */

export type ShowcaseGroup = "ground" | "place" | "decor" | "figure";

export const groupOf = (id: string): ShowcaseGroup | null => {
  if (id.startsWith("terrain.") || id.startsWith("water.")) return "ground";
  if (id.startsWith("image.")) return "place";
  if (id.startsWith("decor.")) return "decor";
  if (id.startsWith("sprite.")) return "figure";
  return null;
};

/** The ids the map asks for, per group, in the order a reader should meet them. */
export const CATALOG_ORDER: Record<ShowcaseGroup, string[]> = {
  ground: [...TERRAINS.map(terrainId), ...WATERS.map(waterId)],
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

export interface Showcase {
  sections: ShowcaseSection[];
  /** how many ids the layer supplies */
  count: number;
  /** every generation they cost, failed attempts included */
  generations: number;
  /** catalog ids the map asks for that this layer does not supply */
  borrowed: string[];
}

const SECTIONS: { group: ShowcaseGroup; title: string; blurb: string }[] = [
  {
    group: "ground",
    title: "Ground",
    blurb:
      "One sixteen-tile corner sheet per biome, expanded to the forty-seven tile blob layout the map addresses. Each patch below is autotiled by the map's own rule, so what shows is the transition, not a swatch.",
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
      "One walk cycle per archetype, four frames a facing, generated at 24 px and animated as the stage walks a move from one place to another.",
  },
];

/** The project's own art, grouped and ordered, with what it does not cover. */
export const showcaseOf = (manifest: StageManifest): Showcase => {
  const own = Object.values(manifest.assets).filter(
    (asset) => asset.source === "period",
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
    sections,
    count: own.length,
    generations: own.reduce(
      (sum, asset) => sum + (asset.record?.generations ?? 0),
      0,
    ),
    borrowed: WANTED_IDS.filter((id) => !ids.has(id)),
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
