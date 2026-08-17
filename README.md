# Situation Eval 🏛️🎲

Evaluation protocols for frontier AI in diplomatic and strategic decision-making: a branching multi-model war game wrapped in a values instrument, analyzed by a multi-judge consensus panel.

Built for the ChinaTalk "Evals for the Situation Room" contest. See `var/plans/` for the working plan.

## What it does

1. **Values instrument (declared).** Each model sits a forced-choice crisis-values instrument with explanation probes before playing.
2. **War game (revealed).** A configurable multi-turn scenario (first: Taiwan Strait 2027) with one model per seat. Every turn, every cell issues a structured **decision brief** (situation, options, decision, rationale, red lines). Turns are adjudicated by a judge panel (escalation ladder scoring, median consensus) plus a narrator model; a human GM gate with **ask-the-bench** is available for attended runs.
3. **Branching (n·2).** At the scenario's decision point the game forks: n **independent** branches (each roster model decides the focal seat's move alone) and n **consensus** branches (each model sees all n blind memos, including its own, and issues a consensus decision, reporting where it deferred and where it broke). Each branch plays out as its own timeline with the deciding model running the focal seat.
4. **Analysis.** Scorecards: escalation series per branch, branch divergence, conformity delta (independent vs consensus decision per model), plus debrief self-knowledge material.
5. **Replays.** A dark-theme web app for browsing runs turn by turn: injects, decision briefs, adjudications, branch trees.

## Layout

```
packages/
  workflows/  @modelstudies/workflows  — composition graph engine, LlmClient + Store seams, provider selector
  survey/     @modelstudies/survey     — instrument, session, banks, interview sitting loop
  judges/     @modelstudies/judges     — judge specs, fan-out planner, runner, consensus folds, label pipeline
  game/       @modelstudies/game       — scenario config, engine, branching, metrics
  cli/        @modelstudies/cli        — command-line verbs
  app/        @modelstudies/app        — replay viewer (port 3175)
data/         — run artifacts (runs, interviews, scorecards) as JSON
var/          — plans and meta materials (git-ignored)
```

Core engine code is lifted from the private `finlaysonstudio-cloudagent` repository and modularized behind two injected seams: `LlmClient` (all model calls) and `Store` (all persistence; `FileStore` locally).

## Use

```bash
npm install
npm test                 # vitest across all packages
npm run typecheck
npm run app              # replay viewer at http://localhost:3175

# secrets: .env in the repo root (provider API keys)
npm run cli -- game-run --scenario taiwan-strait --panel dev        # full game with branching
npm run cli -- game-run --panel dev --turns 2                       # quick smoke (no branch point)
npm run cli -- game-run --panel dev --gate                          # attended: human GM gate
npm run cli -- game-list
npm run cli -- scorecard <rootRunId>
npm run cli -- interview-run --plan crisis --panel dev --explain
```

Panels: `dev` (SONNET, GEMINI_FLASH, LUNA) and `production` (see `packages/survey/src/panel.ts`). A comma-separated model list works anywhere a panel name does.

## Ports (NN = 75)

| Port | Role |
|---|---|
| 3075 | web microsite (later phase) |
| 3175 | app (replay viewer) |
| 8075 | api (later phase) |
| 9075 / 9175 | dynamo / dynamo-admin (later phase) |

> Keep this file and CLAUDE.md in sync. When changing scope, tools, targets, or conventions, update both documents. CLAUDE.md is the agent-facing source of truth (how to work); README.md is the human-facing source of truth (what this is and how to use it).
