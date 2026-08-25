/**
 * The map's place list: the names of the objects on the `places` object
 * layer of a Tiled JSON map (`.tmj`). Pure; the caller reads the file.
 */
import { BadRequestError } from "@jaypie/errors";

import { MemoryPlaces, type Places } from "./places";

export interface TiledObject {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  type?: string;
  properties?: { name: string; value: unknown }[];
}

export interface TiledLayer {
  name?: string;
  type?: string;
  objects?: TiledObject[];
  layers?: TiledLayer[];
}

export interface TiledMap {
  width?: number;
  height?: number;
  tilewidth?: number;
  tileheight?: number;
  layers?: TiledLayer[];
}

export const PLACES_LAYER = "places";

const flatten = (layers: TiledLayer[] = []): TiledLayer[] =>
  layers.flatMap((layer) =>
    layer.type === "group" ? flatten(layer.layers) : [layer],
  );

/** every named object on the `places` layer, in map order */
export const placeObjectsOf = (map: TiledMap): TiledObject[] => {
  const layer = flatten(map.layers).find(
    (entry) => entry.type === "objectgroup" && entry.name === PLACES_LAYER,
  );
  if (!layer) {
    throw new BadRequestError(`The map has no "${PLACES_LAYER}" object layer`);
  }
  return (layer.objects ?? []).filter((object) => object.name);
};

export const placesOfTiledMap = (map: TiledMap): Places =>
  new MemoryPlaces(placeObjectsOf(map).map((object) => object.name!));
