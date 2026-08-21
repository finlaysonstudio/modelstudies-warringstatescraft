# CLAUDE.md

> Keep this file and README.md in sync. When changing scope, tools, targets, or conventions, update both documents. CLAUDE.md is the agent-facing source of truth (how to work); README.md is the human-facing source of truth (what this is and how to use it).

## What this is

Situation Eval: a branching multi-model war game + values instrument + judges' box, targeting the ChinaTalk "Evals for the Situation Room" contest (deadline 2026-09-01). The active plan is `var/plans/20260816_PLAN_SITUATION_ROOM_SUBMISSION.md`.

## Working rules

- Run `npm test` and `npm run typecheck` before declaring a task done; `npm run format` before committing.
- TypeScript, ESM, moduleResolution bundler, no build step for node packages (each exports `./src/index.ts`). The app builds with Vite.
- Throw `@jaypie/errors` classes, never vanilla `Error`.
- All LLM calls go through the injected `LlmClient` seam (`@modelstudies/workflows`); all persistence through the `Store` seam (`FileStore` → `data/`). Never import `@jaypie/llm` from browser code.
- Dependency direction: `game`/`survey`/`judges` → `workflows`; `cli`/`app` → all. `app` imports types only from node packages.
- Scenario content is data (`packages/game/src/scenario/`); engine code stays scenario-agnostic.
- Rosters use `MODEL` constants mirrored in `packages/survey/src/models.ts` (browser-safe mirror of `@jaypie/llm` `LLM.MODEL`; drift is CI-checked). Panels: `dev` for development speed, `production` for full runs.
- Run artifacts are JSON under `data/` (`runs/`, `interview/`, `probe/`, `scorecards/`); the app's dev server serves them at `/data/*`. Scenario materials (every card and prompt, rendered with no history) are exported by `cli materials` to `data/scenarios/<id>.json` and rendered at `/scenarios`; re-export after editing scenario content or prompt builders. The run schema lives in `packages/game/src/types.ts` and is mirrored in `packages/app/src/lib/types.ts` — change both together.
- Upstream provenance: composition engine, survey core, judges, label pipeline, and the visual system are lifted from `finlaysonstudio-cloudagent` (see plan §Extraction Map). Do not propose upstream fixes from this repo; note candidate contributions in the plan instead.
- Visual style: Cloud Agent Studio conventions (Tailwind v4 CSS-first tokens in `globals.css` `@theme`, Geist + IBM Plex Mono, dark-only, single accent `brand-terminal`, `rounded-sm`, hairline `border-white/10`, mono-caps `text-card-accent` eyebrows, `clsx` only, lucide-react only, `cursor-pointer` on buttons).

## Ports

NN=75: app 3175; reserved 3075 web, 8075 api, 9075/9175 dynamo (later phases).

## Secrets

`.env` at repo root (provider API keys). Never commit it.
