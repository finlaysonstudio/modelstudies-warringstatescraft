import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeDataSnapshot } from "@modelstudies/app/server/data";

// Build the deployable snapshot: the app compiled with its live affordances
// disabled, then every `/data/*` URL the app can fetch written as a file
// beside it. The output is the whole deliverable — copy `site/` into a bucket
// and the site is up.

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageDir, "../..");
const appDir = path.join(repoRoot, "packages/app");
export const siteDir = path.join(packageDir, "site");

const run = (
  command: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>,
) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const date =
    process.env.SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
  const label = process.env.SNAPSHOT_LABEL || "ChinaTalk submission snapshot";

  // Scenario materials are the chapter pages' own source and are re-rendered
  // from the scenario modules, so a stale export would ship a chapter the code
  // no longer writes.
  console.log("[1/3] materials");
  run("npm", ["run", "materials"], repoRoot);

  console.log("[2/3] app bundle");
  await rm(siteDir, { recursive: true, force: true });
  run("npx", ["vite", "build", "--outDir", siteDir, "--emptyOutDir"], appDir, {
    VITE_SNAPSHOT: "1",
    VITE_SNAPSHOT_DATE: date,
    VITE_SNAPSHOT_LABEL: label,
  });

  // The vendor art layer is purchased under a licence that forbids
  // redistribution, and a public bucket is redistribution: the PNGs would be
  // downloadable one file at a time. It is also the only layer the site does
  // not need. Every archetype the catalog lists names its own sprite first
  // (`ARCHETYPE_SPRITES`), which the fallback and period layers both draw, and
  // the vendor entries are stand-ins behind them; the maps name no vendor
  // tileset; and `loadStageManifest` skips a layer whose manifest is absent.
  // So the layer is dropped from the deployed tree and the stage renders on
  // art this project owns. `--vendor` keeps it, for a deployment whose licence
  // permits it.
  if (process.argv.includes("--vendor")) {
    console.log("  vendor art layer kept (--vendor)");
  } else {
    await rm(path.join(siteDir, "stage/vendor"), {
      recursive: true,
      force: true,
    });
    console.log("  vendor art layer dropped (licence forbids redistribution)");
  }

  console.log("[3/3] data snapshot");
  const snapshot = await writeDataSnapshot(path.join(siteDir, "data"));
  for (const [group, count] of Object.entries(snapshot.counts)) {
    console.log(`  ${group.padEnd(14)} ${count}`);
  }
  console.log(
    `  ${"total".padEnd(14)} ${snapshot.entries.length} files, ${mb(snapshot.bytes)}`,
  );
  console.log(`\nsite: ${siteDir}`);
}

await main();
