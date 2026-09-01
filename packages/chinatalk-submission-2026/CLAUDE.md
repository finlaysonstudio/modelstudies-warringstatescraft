# @modelstudies/chinatalk-submission-2026

> Keep this file and README.md in sync.

The static snapshot of the app, and the CDK that hosts it. Two halves that meet
in `site/`: `scripts/build.ts` fills it, `scripts/publish.ts` syncs it, and
`src/stacks/site-stack.ts` makes the bucket it syncs into.

## The build

`scripts/build.ts` → `site/` (git-ignored):

1. `npm run materials` at the repo root, because the chapter pages read the
   scenario export and a stale one would ship a chapter the code no longer
   writes.
2. `vite build` of `packages/app` with `--outDir site`, carrying
   `VITE_SNAPSHOT=1`, `VITE_SNAPSHOT_DATE`, and `VITE_SNAPSHOT_LABEL`. The app
   reads those through `packages/app/src/lib/snapshot.ts`: `SNAPSHOT` puts a
   date bar in the chrome and `LIVE_PLAY` false draws `LivePlayNotice` grayed
   wherever a game could be started.
3. `writeDataSnapshot` from `@modelstudies/app/server/data`.

`site/stage/vendor` is removed unless `--vendor` is passed: the packs forbid
redistribution and the layer is unneeded (`ARCHETYPE_SPRITES` names each
archetype's own sprite first, the fallback and period layers draw it, no `.tmj`
names a vendor tileset, and `loadStageManifest` skips an absent layer).

## The data seam

`packages/app/server/data.ts` is the one place that knows how `/data/*` is
composed. The Vite dev server mounts `dataHandler`; the snapshot writes the
same URLs as files with `writeDataSnapshot`. Adding a `/data` URL means adding
it in both halves of that module, and the deployed site then answers what the
dev server answers. Journals (`var/interview/<id>.jsonl`) never travel: they
are the record, not the site.

## The stack

`SubmissionSiteStack`, one `JaypieWebDeploymentBucket`, named
`cdk-modelstudies-situationeval-chinatalk-submission-2026-<env>-<nonce>`.
`spa: true` for deep links, `waf: false` and `destination: false` for cost, an
explicit CSP for the Google Fonts hosts and Phaser's `blob:` textures. The
`zone` prop defaults to `CDK_ENV_HOSTED_ZONE` or `modelstudies.com`; passing
`""` opts out of the alias and the certificate, which is how `siteStack.spec.ts`
synthesizes with no AWS session (resolving a zone is a lookup).

Bucket name, distribution id, distribution domain, and host are published to
SSM under `/modelstudies-situationeval/<env>-<nonce>/chinatalk-submission-2026/`.
`publish.ts` reads them there rather than taking a bucket on the command line.

## Environment inputs

`PROJECT_SPONSOR` (`modelstudies`), `PROJECT_KEY` (`situationeval`),
`PROJECT_ENV` (`sandbox`), `PROJECT_NONCE`, `CDK_ENV_HOSTED_ZONE`,
`CDK_ENV_SUBDOMAIN` (`chinatalk-submission-2026`), `CDK_ENV_REPO` (lights up the
GitHub OIDC deploy role). `SNAPSHOT_DATE` and `SNAPSHOT_LABEL` name the
snapshot in the site's own chrome.

## Commands

- `npm run submission` (root) — build `site/`
- `npm run submission:serve` — serve it with the distribution's SPA rule
- `npm run submission:synth` / `npm run diff` — the stack
- `npm run submission:publish [-- --dry-run]` — sync and invalidate

Infrastructure deploys ride `.github/workflows/deploy-sandbox.yml`. Never
deploy the stack from local.
