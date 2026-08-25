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

/** A Tiled tileset for a 47-tile blob sheet (one block per water frame stacked below). */
export const blobTileset = ({
  name,
  image,
  tile = 16,
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
    imageheight: BLOB_ROWS * tile * frames,
    tilewidth: tile,
    tileheight: tile,
    tilecount: BLOB_TILE_COUNT * frames,
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
