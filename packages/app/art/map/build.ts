/**
 * The overworld map: `npm run stage:map`.
 *
 * Rasterizes `geography.json` and writes `packages/app/public/stage/overworld.tmj`
 * (committed) beside an ASCII sketch of the same grid for review, then checks
 * the places layer against every key the chapters and homes require.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkPlaces, placesOfTiledMap } from "@modelstudies/game";

import { asciiOf, buildTiledMap, rasterize, type Geography } from "./map";

const here = dirname(fileURLToPath(import.meta.url));
const geo = JSON.parse(
  readFileSync(join(here, "geography.json"), "utf8"),
) as Geography;
const grid = rasterize(geo);
const map = buildTiledMap({ geo, grid });
const out = resolve(here, "../../public/stage");
writeFileSync(join(out, "overworld.tmj"), JSON.stringify(map));
writeFileSync(join(here, "overworld.txt"), `${asciiOf(grid)}\n`);
const check = checkPlaces(placesOfTiledMap(map as never));
console.log(
  `stage map: ${geo.width}×${geo.height}, ${map.layers.length} layers, ${Object.keys(geo.places).length} places (${check.present.length} required present, ${check.missing.length} missing, ${check.extra.length} extra)`,
);
if (check.missing.length) console.log(`missing: ${check.missing.join(", ")}`);
if (check.extra.length) console.log(`extra: ${check.extra.join(", ")}`);
