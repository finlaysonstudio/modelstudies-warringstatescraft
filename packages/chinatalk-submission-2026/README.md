# ChinaTalk Submission 2026

A static snapshot of Warring States Craft, and the CDK that hosts it.

The bench that produced the results runs on a workstation: it calls models,
scores turns, and writes artifacts into git-ignored `var/`. This package turns
one moment of that tree into files an object store can serve, and stands up the
bucket and distribution to serve them from.

Nothing is computed on request. The deployed site is the app's own pages and
art, plus every `/data/*.json` URL the app can fetch written out as a file.

## The site

`https://chinatalk-submission-2026.sandbox.modelstudies.com`

## Build it

```
npm run submission          # from the repo root
npm run submission:serve    # read it at http://localhost:3176
```

`build` runs three steps: it re-exports scenario materials, builds the app
bundle with its live affordances disabled, and writes the data snapshot beside
it. The output is `site/`, git-ignored, about 116 MB across roughly 1,550
files.

Two things are deliberately not in `site/`:

- **The vendor art layer.** The purchased packs are licensed without
  redistribution rights, and a public bucket redistributes them. The layer is
  also the only one the site does not need: every archetype names its own
  sprite first and the fallback and period layers both draw it, and no map
  names a vendor tileset. `npm run submission -- --vendor` keeps the layer for
  a deployment whose licence permits it.
- **Anything that would play a game.** Live play needs a server that calls the
  models. The affordance is drawn grayed rather than dropped, so a reader sees
  that the bench has a seat and that this deployment does not run it.

## Deploy it

Infrastructure rides GitHub Actions (`.github/workflows/deploy-chinatalk-submission-2026.yml`,
`workflow_dispatch`). Content is synced from the workstation that holds `var/`:

```
npm run submission
npm run submission:publish             # aws s3 sync + invalidation
npm run submission:publish -- --dry-run
```

`publish` reads the bucket and distribution from SSM rather than taking them on
the command line, so a sync cannot land on the wrong bucket.

## What the stack is

One stack, one bucket, one distribution, no compute on the request path.

- `spa: true` — a deep link like `/craft/replays/<id>` is a route in the
  browser router and not a key in the bucket, so a viewer-request CloudFront
  Function rewrites an extension-less URI to `/index.html`. A `/data/…json`
  request carries an extension and is left alone, which keeps a missing
  artifact a 404 rather than a page of HTML the fetch would try to parse.
- `waf: false`, `destination: false` — the content is public and static, and
  access logging would add a second bucket and a forwarder function.
- The CSP admits the Google Fonts stylesheet and font hosts the page loads, and
  `blob:` images, which is how Phaser hands back textures it builds on a canvas.

The host is composed by `envHostname` from the subdomain and `PROJECT_ENV`, so
`sandbox` gives `chinatalk-submission-2026.sandbox.modelstudies.com` and
`production` would drop the environment out of the name. Only sandbox is
configured.
