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
  const map = buildTiledMap({
    geo,
    grid,
    tile: set.tile,
    imageDir: set.sources[set.sources.length - 1],
  });
  writeFileSync(join(publicStage, basename(set.map)), JSON.stringify(map));
  const places = checkPlaces(placesOfTiledMap(map as never));
  const ground = coverageOf(set, layers);
  console.log(
    `${set.id}: ${geo.width}×${geo.height} at ${set.tile} px, ${map.layers.length} layers, ${Object.keys(geo.places).length} places (${places.present.length} required present, ${places.missing.length} missing, ${places.extra.length} extra) → ${basename(set.map)}`,
  );
  if (places.missing.length)
    console.log(`  missing: ${places.missing.join(", ")}`);
  if (places.extra.length) console.log(`  extra: ${places.extra.join(", ")}`);
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
