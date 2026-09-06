/**
 * What a set's art layers answer for the grounds a map draws: shared by the
 * overworld build and the settlement build, since both bind a ground's sheet
 * by pixel geometry and both would render a wrong-tile sheet as garbage.
 */
import type { StageSet } from "../../src/stage/sets";
import { BASE_TILE } from "../../src/stage/sets";
import type { VendorManifest } from "../vendor/manifest";
import {
  GROUNDS,
  blocksOf,
  pairBlocksOf,
  tilesetIdOf,
  type Ground,
} from "./map";

/** What a set's layers answer for every ground the map draws. */
export interface GroundCoverage {
  /** ground ids no layer of the set supplies */
  missing: string[];
  /** ground ids a layer supplies at the wrong tile, which would render as garbage */
  mismatched: string[];
  /** ground ids whose sheet carries fewer blocks than the map addresses */
  short: string[];
}

/**
 * The pair sheets a set's layers supply at its own tile: an id of the form
 * `terrain.mountain@forest`, whose upper half is a ground the map draws and
 * whose lower half is the ground it is laid over. A pair at another set's
 * tile belongs to another map and is left out rather than bound as garbage.
 */
export const pairsOf = (
  set: StageSet,
  layers: Map<string, VendorManifest>,
): Set<string> => {
  const grounds = new Set<string>(GROUNDS);
  const pairs = new Set<string>();
  for (const source of set.sources) {
    const manifest = layers.get(source);
    if (!manifest) continue;
    const tile = manifest.tile ?? BASE_TILE;
    for (const id of Object.keys(manifest.assets)) {
      const [sheet, lower] = id.split("@");
      if (!lower || !grounds.has(lower)) continue;
      const ground = sheet.split(".")[1];
      if (!grounds.has(ground)) continue;
      if (tile !== set.tile) {
        pairs.delete(id);
        continue;
      }
      const blocks = Math.floor(manifest.assets[id].height / (6 * set.tile));
      if (blocks < pairBlocksOf(ground as Ground)) {
        pairs.delete(id);
        continue;
      }
      pairs.add(id);
    }
  }
  return pairs;
};

export const coverageOf = (
  set: StageSet,
  layers: Map<string, VendorManifest>,
): GroundCoverage => {
  const coverage: GroundCoverage = { missing: [], mismatched: [], short: [] };
  for (const ground of GROUNDS) {
    const id = tilesetIdOf(ground);
    let found: { manifest: VendorManifest; tile: number } | undefined;
    for (const source of set.sources) {
      const manifest = layers.get(source);
      if (manifest?.assets[id]) {
        found = { manifest, tile: manifest.tile ?? BASE_TILE };
      }
    }
    if (!found) {
      coverage.missing.push(id);
      continue;
    }
    if (found.tile !== set.tile) {
      coverage.mismatched.push(`${id} (${found.tile} px)`);
      continue;
    }
    const entry = found.manifest.assets[id];
    const blocks = Math.floor(entry.height / (6 * set.tile));
    if (blocks < blocksOf(ground)) {
      coverage.short.push(`${id} (${blocks} of ${blocksOf(ground)} blocks)`);
    }
  }
  return coverage;
};
