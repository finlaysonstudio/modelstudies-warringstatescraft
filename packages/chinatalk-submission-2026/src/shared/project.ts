// Naming and environment inputs, the same shape the studio's other repos use.
// Everything here reads the environment so a deploy is configured by the CI
// environment rather than by a value checked into the tree.

export const PROJECT_SPONSOR = process.env.PROJECT_SPONSOR || "modelstudies";
export const PROJECT_KEY = process.env.PROJECT_KEY || "warringstates";
export const PROJECT_ENV = process.env.PROJECT_ENV || "sandbox";
export const PROJECT_NONCE = process.env.PROJECT_NONCE || "dev";

export const PROJECT_PREFIX = `${PROJECT_SPONSOR}-${PROJECT_KEY}`;
export const PROJECT_QUALIFIER = `${PROJECT_ENV}-${PROJECT_NONCE}`;

export const stackId = (component: string) =>
  `cdk-${PROJECT_SPONSOR}-${PROJECT_KEY}-${component}-${PROJECT_ENV}-${PROJECT_NONCE}`;

export const cdkEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
} as const;

/**
 * The zone the site is hosted under. An explicit empty `CDK_ENV_HOSTED_ZONE`
 * opts out (`??`, not `||`), and the stack still deploys: the bucket and
 * distribution exist and the site answers on the CloudFront domain, with no
 * certificate and no alias record. Opting out is also the only way to synth
 * with no AWS session, since resolving a zone is a lookup.
 */
export const HOSTED_ZONE =
  process.env.CDK_ENV_HOSTED_ZONE ?? "modelstudies.com";

/**
 * The subdomain, which `envHostname` composes with `PROJECT_ENV` and the zone.
 * At `sandbox` that is `chinatalk-submission-2026.sandbox.modelstudies.com`;
 * at `production` the environment drops out of the name entirely.
 */
export const SITE_SUBDOMAIN =
  process.env.CDK_ENV_SUBDOMAIN || "chinatalk-submission-2026";
