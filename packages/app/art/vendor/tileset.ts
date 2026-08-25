import {
  BLOB_COLUMNS,
  BLOB_MASKS,
  BLOB_ROWS,
  BLOB_TILE_COUNT,
  wangIdOf,
} from "./blob";

export interface BlobTilesetOptions {
  name: string;
  image: string;
  tile?: number;
  /**
   * How many blob blocks the sheet stacks. A block is a frame for water and a
   * rearrangement for the ground the map is laid on, so this sizes the image
   * and the tile count without saying anything about time.
   */
  blocks?: number;
  /**
   * How many of those blocks are an animation. Only water animates: a stacked
   * rearrangement is addressed per cell by the map builder, and declaring it
   * as an animation makes every cell that lands on the first block cycle
   * through the rest while its neighbours sit still.
   */
  frames?: number;
  /** Milliseconds per water frame. */
  frameMs?: number;
}

export interface TiledTile {
  id: number;
  animation?: { tileid: number; duration: number }[];
}

export interface TiledTileset {
  name: string;
  type: "tileset";
  version: string;
  tiledversion: string;
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  margin: number;
  spacing: number;
  tiles?: TiledTile[];
  wangsets: {
    name: string;
    type: "mixed";
    tile: number;
    colors: {
      name: string;
      color: string;
      tile: number;
      probability: number;
    }[];
    wangtiles: { tileid: number; wangid: number[] }[];
  }[];
}

/** A Tiled tileset for a 47-tile blob sheet, with `blocks` of them stacked below. */
export const blobTileset = ({
  name,
  image,
  tile = 16,
  blocks = 1,
  frames = 1,
  frameMs = 400,
}: BlobTilesetOptions): TiledTileset => {
  const tiles: TiledTile[] = [];
  if (frames > 1) {
    BLOB_MASKS.forEach((_, index) => {
      tiles.push({
        id: index,
        animation: Array.from({ length: frames }, (__, frame) => ({
          tileid: index + frame * BLOB_TILE_COUNT,
          duration: frameMs,
        })),
      });
    });
  }
  return {
    name,
    type: "tileset",
    version: "1.10",
    tiledversion: "1.11.0",
    image,
    imagewidth: BLOB_COLUMNS * tile,
    imageheight: BLOB_ROWS * tile * blocks,
    tilewidth: tile,
    tileheight: tile,
    tilecount: BLOB_TILE_COUNT * blocks,
    columns: BLOB_COLUMNS,
    margin: 0,
    spacing: 0,
    ...(tiles.length ? { tiles } : {}),
    wangsets: [
      {
        name,
        type: "mixed",
        tile: -1,
        colors: [{ name, color: "#ff0000", tile: -1, probability: 1 }],
        wangtiles: BLOB_MASKS.map((mask, index) => ({
          tileid: index,
          wangid: wangIdOf(mask),
        })),
      },
    ],
  };
};
