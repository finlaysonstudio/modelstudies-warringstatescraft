/**
 * The settlement maps: `npm run stage:settlement`.
 *
 * The same builder the overworld uses (`art/map/map.ts`), pointed at the
 * town's own geography, writing one Tiled map per art set beside the
 * overworld's (`settlement.tmj`, `settlement32.tmj`) and one feature sidecar
 * (`settlement.features.json`), since the grid is the same at every tile.
 * The places are checked against `src/stage/settlement.ts` rather than the
 * gazetteer: no chapter is set in the town, so its names are its own.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SETTLEMENT_FEATURES,
  SETTLEMENT_NAMES,
} from "../../src/stage/settlement";
import { STAGE_SETS } from "../../src/stage/sets";
import { coverageOf, pairsOf } from "../map/coverage";
import {
  asciiOf,
  buildTiledMap,
  featureFileOf,
  rasterMapOf,
  type Geography,
  type Ground,
} from "../map/map";
import type { VendorManifest } from "../vendor/manifest";

const here = dirname(fileURLToPath(import.meta.url));
const publicStage = resolve(here, "../../public/stage");

const geo = JSON.parse(
  readFileSync(join(here, "geography.json"), "utf8"),
) as Geography;
const raster = rasterMapOf(geo);
const grid = raster.grid;
const drawn = new Set<Ground>(grid.flat());
writeFileSync(join(here, "settlement.txt"), `${asciiOf(grid)}\n`);

const featureFile = featureFileOf(geo, raster);
writeFileSync(
  join(publicStage, "settlement.features.json"),
  JSON.stringify(featureFile),
);
console.log(
  `features: ${Object.keys(featureFile.features).length} named (${Object.entries(
    featureFile.features,
  )
    .map(([id, cells]) => `${id} ${cells.length}`)
    .join(", ")}) → settlement.features.json`,
);

let failed = false;
// every named feature has a note and every note names a drawn feature
const noted = new Set(Object.keys(SETTLEMENT_FEATURES));
for (const id of Object.keys(featureFile.features)) {
  if (!noted.has(id)) {
    failed = true;
    console.log(`feature ${id} is drawn but has no note`);
  }
}
for (const id of noted) {
  if (!featureFile.features[id]) {
    failed = true;
    console.log(`feature ${id} has a note but is not drawn`);
  }
}
// every place is named and every name is a place
const named = new Set(Object.keys(SETTLEMENT_NAMES));
for (const key of Object.keys(geo.places)) {
  if (!named.has(key)) {
    failed = true;
    console.log(`place ${key} is on the map but has no name`);
  }
}
for (const key of named) {
  if (!geo.places[key]) {
    failed = true;
    console.log(`place ${key} is named but not on the map`);
  }
}

const layers = new Map<string, VendorManifest>();
for (const source of new Set(STAGE_SETS.flatMap((set) => set.sources))) {
  const file = join(publicStage, source, `${source}.json`);
  if (!existsSync(file)) continue;
  layers.set(source, JSON.parse(readFileSync(file, "utf8")) as VendorManifest);
}

for (const set of STAGE_SETS) {
  const pairs = pairsOf(set, layers);
  const map = buildTiledMap({
    geo,
    grid,
    tile: set.tile,
    imageDir: set.sources[set.sources.length - 1],
    pairs,
  });
  const file = set.tile === 32 ? "settlement32.tmj" : "settlement.tmj";
  writeFileSync(join(publicStage, file), JSON.stringify(map));
  const ground = coverageOf(set, layers);
  const laid = map.tilesets.filter((tileset) => tileset.name.includes("@"));
  console.log(
    `${set.id}: ${geo.width}×${geo.height} at ${set.tile} px, ${map.layers.length} layers, ${Object.keys(geo.places).length} places, ${geo.decor?.length ?? 0} decor, ${[...drawn].length} grounds drawn, ${laid.length} of ${pairs.size} transitions laid → ${file}`,
  );
  for (const [what, ids] of Object.entries(ground)) {
    // only a ground the town draws matters here; the overworld build reports the rest
    const own = ids.filter((id: string) =>
      drawn.has(id.split(" ")[0].split(".")[1] as Ground),
    );
    if (!own.length) continue;
    failed = true;
    console.log(`  ${what} ground: ${own.join(", ")}`);
  }
}
if (failed) process.exit(1);
