/**
 * The overworld maps: `npm run stage:map`.
 *
 * Rasterizes `geography.json` once and writes one Tiled map per art set into
 * `packages/app/public/stage/` (committed) beside an ASCII sketch of the grid
 * for review, then checks the places layer against every key the chapters and
 * homes require, and each set's layers against every ground the map draws.
 *
 * The coverage check is not a nicety. A map binds a ground's sheet by pixel
 * geometry, so a set whose layers answer a ground at the wrong tile renders
 * that whole terrain as garbage rather than as nothing.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkPlaces, placesOfTiledMap } from "@modelstudies/game";

import type { StageSet } from "../../src/stage/sets";
import { BASE_TILE, STAGE_SETS } from "../../src/stage/sets";
import type { VendorManifest } from "../vendor/manifest";
import {
  asciiOf,
  blocksOf,
  buildTiledMap,
  featureFileOf,
  GROUNDS,
  rasterMapOf,
  tilesetIdOf,
  type Geography,
  type Ground,
} from "./map";

const here = dirname(fileURLToPath(import.meta.url));
const publicStage = resolve(here, "../../public/stage");

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
      if (blocks < blocksOf(ground as Ground)) {
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

const geo = JSON.parse(
  readFileSync(join(here, "geography.json"), "utf8"),
) as Geography;
const raster = rasterMapOf(geo);
const grid = raster.grid;
/** the grounds a fill actually puts on the country, whatever the vocabulary holds */
const drawn = new Set<Ground>(grid.flat());
writeFileSync(join(here, "overworld.txt"), `${asciiOf(grid)}\n`);

// the named country, written once: the grid is the same for every set, and
// the explorer reads it to say which river a click landed in
const featureFile = featureFileOf(geo, raster);
writeFileSync(join(publicStage, "features.json"), JSON.stringify(featureFile));
console.log(
  `features: ${Object.keys(featureFile.features).length} named (${Object.entries(
    featureFile.features,
  )
    .map(([id, cells]) => `${id} ${cells.length}`)
    .join(", ")}) → features.json`,
);

const layers = new Map<string, VendorManifest>();
for (const source of new Set(STAGE_SETS.flatMap((set) => set.sources))) {
  const file = join(publicStage, source, `${source}.json`);
  if (!existsSync(file)) continue;
  layers.set(source, JSON.parse(readFileSync(file, "utf8")) as VendorManifest);
}

let failed = false;
for (const set of STAGE_SETS) {
  const pairs = pairsOf(set, layers);
  const map = buildTiledMap({
    geo,
    grid,
    tile: set.tile,
    imageDir: set.sources[set.sources.length - 1],
    pairs,
  });
  writeFileSync(join(publicStage, basename(set.map)), JSON.stringify(map));
  const places = checkPlaces(placesOfTiledMap(map as never));
  const ground = coverageOf(set, layers);
  const laid = map.tilesets.filter((tileset) => tileset.name.includes("@"));
  console.log(
    `${set.id}: ${geo.width}×${geo.height} at ${set.tile} px, ${map.layers.length} layers, ${Object.keys(geo.places).length} places (${places.present.length} required present, ${places.missing.length} missing, ${places.extra.length} extra), ${laid.length} of ${pairs.size} transitions laid → ${basename(set.map)}`,
  );
  if (places.missing.length)
    console.log(`  missing: ${places.missing.join(", ")}`);
  if (places.extra.length) console.log(`  extra: ${places.extra.join(", ")}`);
  // what the set carries and the map never lays: a terrain in the vocabulary
  // that no fill uses, or a pair whose ground has moved out from under it.
  // Neither is a fault -- a sheet is the record of a generation, and the
  // vocabulary is allowed to run ahead of the geography -- but an unlaid sheet
  // is invisible, so the build names it rather than leaving it to be noticed.
  // a plain ground is measured against the grid rather than against the map's
  // tilesets, because every ground in the vocabulary is registered whether or
  // not a fill uses it; a pair is registered only where it is actually laid
  const names = new Set(map.tilesets.map((tileset) => tileset.name));
  const unlaid = [
    ...GROUNDS.filter((ground) => !drawn.has(ground)).map(tilesetIdOf),
    ...[...pairs.keys()].filter((id) => !names.has(id)),
  ];
  if (unlaid.length) console.log(`  unlaid: ${unlaid.sort().join(", ")}`);
  for (const [what, ids] of Object.entries(ground)) {
    if (!ids.length) continue;
    failed = true;
    console.log(`  ${what} ground: ${ids.join(", ")}`);
  }
}
if (failed) {
  console.log(
    "a ground the map draws is unanswered at the set's tile; run the set's art build",
  );
}
