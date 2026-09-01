import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SSM } from "../src/shared/ssm-keys.js";

// Sync the built snapshot into the bucket the stack made and invalidate the
// distribution. The bucket is read from SSM rather than taken as an argument,
// so a publish cannot land on the wrong bucket by a typo, and the ambient AWS
// session is the only credential involved.
//
// Two syncs, because the two halves of the site expire differently: Vite's
// hashed assets are immutable and are named by their content, while the
// entry document and the data files are the same key every deploy and have to
// be revalidated. `--delete` runs on the second pass alone, so an asset a page
// still references is never removed before its page is replaced.

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../site",
);

const dryRun = process.argv.includes("--dry-run");

// The nonce is half the SSM path, and its local default (`dev`) belongs to no
// deployment. Without it this script reads a parameter nothing wrote and
// reports a missing parameter rather than a missing nonce, so refuse first.
if (!process.env.PROJECT_NONCE) {
  throw new Error(
    "PROJECT_NONCE is not set. It is the nonce the stack was deployed with, " +
      "carried on the sandbox environment in GitHub:\n" +
      "  gh variable list -R finlaysonstudio/modelstudies-warringstatescraft -e sandbox\n" +
      "  PROJECT_NONCE=<nonce> npm run submission:publish",
  );
}

const aws = (args: string[]): string => {
  const result = spawnSync("aws", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `aws ${args.join(" ")} exited ${result.status}: ${result.stderr?.trim()}`,
    );
  }
  return result.stdout.trim();
};

const parameter = (name: string): string =>
  aws([
    "ssm",
    "get-parameter",
    "--name",
    name,
    "--query",
    "Parameter.Value",
    "--output",
    "text",
  ]);

const sync = (args: string[]) => {
  const full = [
    "s3",
    "sync",
    siteDir,
    ...args,
    ...(dryRun ? ["--dryrun"] : []),
  ];
  const result = spawnSync("aws", full, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`aws s3 sync exited ${result.status}`);
  }
};

const bucket = parameter(SSM.site.bucketName);
const distribution = parameter(SSM.site.distributionId);
// Before the zone exists there is no vanity host, and the CloudFront domain
// is the only way to reach the site.
const host = (() => {
  try {
    return parameter(SSM.site.host);
  } catch {
    return parameter(SSM.site.distributionDomain);
  }
})();

console.log(`bucket:       ${bucket}`);
console.log(`distribution: ${distribution}`);
console.log(`host:         https://${host}`);

// content-hashed assets: never revalidated
sync([
  `s3://${bucket}`,
  "--exclude",
  "*",
  "--include",
  "assets/*",
  "--cache-control",
  "public, max-age=31536000, immutable",
]);

// everything else, the entry document and the data included
sync([
  `s3://${bucket}`,
  "--exclude",
  "assets/*",
  "--cache-control",
  "public, max-age=300, must-revalidate",
  "--delete",
]);

if (dryRun) {
  console.log("\ndry run: no invalidation");
} else {
  const invalidation = aws([
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distribution,
    "--paths",
    "/*",
    "--query",
    "Invalidation.Id",
    "--output",
    "text",
  ]);
  console.log(`\ninvalidation: ${invalidation}`);
  console.log(`site:         https://${host}`);
}
