/**
 * The vendor step: `npm run stage:vendor`.
 *
 * Reads the purchased packs from `STAGE_VENDOR_DIR` (default `var/assets/vendor`),
 * runs the transforms `packs.json` declares, and writes the stage's vendor
 * directory (`packages/app/public/stage/vendor/`, git-ignored). Nothing under
 * the vendor tree is committed or uploaded anywhere.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildVendor } from "./vendor";
import type { PacksManifest } from "./manifest";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../..");
const packs = JSON.parse(
  readFileSync(join(here, "packs.json"), "utf8"),
) as PacksManifest;
const root = process.env.STAGE_VENDOR_DIR ?? resolve(repo, packs.root);
const out = resolve(here, "../../public/stage/vendor");

mkdirSync(out, { recursive: true });
const manifest = buildVendor({
  packs,
  load: (file) => new Uint8Array(readFileSync(join(root, file))),
  emit: (file, bytes) => {
    writeFileSync(join(out, file), bytes);
  },
  log: (line) => {
    console.warn(line);
  },
});
writeFileSync(join(out, "vendor.json"), JSON.stringify(manifest, null, 2));
console.log(
  `stage vendor: ${Object.keys(manifest.assets).length} assets from ${root} → ${out}`,
);
