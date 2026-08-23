# Warring States Bench 🏛️🎲

Evaluation protocols for frontier AI in diplomatic and strategic decision-making: a branching multi-model war game wrapped in a values instrument, analyzed by a multi-judge consensus panel.

Built for the ChinaTalk "Evals for the Situation Room" contest. See `var/plans/` for the working plan.

## What it does

1. **Values instrument (declared).** Each model sits a forced-choice crisis-values instrument with explanation probes before playing.
2. **War game (revealed).** A configurable multi-turn scenario (first: Corridor States, an invented Warring States crisis) with one model per seat. Every turn, every cell issues a structured **decision brief** (situation, options, decision, rationale, red lines). Turns are adjudicated by a configurable **judge panel** (escalation ladder scoring; participants and a combining `mode`, currently only `median`) plus a **narrator** that resolves the decisions into what happens next. A human can hold any of the three roles: a seat, a chair on the panel, or the narrator.
3. **Branching.** Two fork modes. **Start fork (matrix):** every seat lists its candidate models (the human included); the game forks at turn 1 into one branch per seat assignment (2 × 2 × 2 = 8; 5 per seat = 125), and each branch plays the whole scenario. **Decision-point fork (n·2):** at the scenario's decision point the game forks into n **independent** branches (each roster model decides the focal seat's move alone) and n **consensus** branches (each model sees all n blind memos, including its own, and issues a consensus decision, reporting where it deferred and where it broke). Each branch plays out as its own timeline.
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
data/         — interviews, scorecards, reports, reference data, and scenario materials as JSON
var/runs/     — game runs (git-ignored)
var/          — plans and meta materials (git-ignored)
```

Core engine code is lifted from the private `finlaysonstudio-cloudagent` repository and modularized behind two injected seams: `LlmClient` (all model calls) and `Store` (all persistence; `FileStore` locally).

## Use

```bash
npm install
npm test                 # vitest across all packages
npm run typecheck
npm run app              # replay viewer at http://localhost:3175 (/scenarios reads the cards and prompts; /play runs a game)

# secrets: .env in the repo root (provider API keys)
npm run cli -- game-run --scenario strait-states --panel dev        # full game with branching
npm run cli -- game-run --panel dev --turns 2                       # quick smoke (no branch point)
npm run cli -- game-run --panel dev --judges claude-opus-5,grok-4.6 --judge-mode median --narrator gpt-5.6-sol
npm run cli -- game-run --scenario corridor-states --seats saltmarch=claude-opus-5,upland=gpt-5.6-luna
npm run cli -- game-run --scenario corridor-states --matrix "upland=claude-sonnet-5|gpt-5.6-luna,northmarch=claude-sonnet-5|gemini-3.7-flash,saltmarch=gpt-5.6-luna|gemini-3.7-flash"   # start fork, 8 branches
npm run cli -- game-list
npm run cli -- scorecard <rootRunId>
npm run cli -- game-run --scenario lamparth-2024-acc95-basic-revisionist --panel dev --dialog 3   # one Lamparth replication cell, dialog treatment
npm run cli -- study-run --scenarios "lamparth-2024-*" --models SOL,LUNA --replicates 10 --dialog 3   # the replication: 8 cells × 2 models × 10 games
npm run cli -- study-run --resume <studyId>                        # play the arms that did not finish
npm run cli -- study-list
npm run cli -- study-report <studyId>                              # the study's report → data/reports/<studyId>.json
npm run cli -- materials                                           # export scenario cards + prompts to data/scenarios/
npm run cli -- interview-run --plan crisis --panel dev --explain
```

Panels: `dev` (SONNET, GEMINI_FLASH, LUNA) and `production` (see `packages/survey/src/panel.ts`). A comma-separated model list works anywhere a panel name does. `--seats` pins seats explicitly; unlisted seats fall back to round-robin over the panel. The fielded model set (`packages/survey/src/models.ts`): Opus, Sonnet, Sol, Luna, Gemini Flash, Gemini Flash Lite, Grok, and four open weights through Fireworks (DeepSeek, GLM, Kimi, Qwen).

Scenarios (in display order): `corridor-states` (an invented Warring States crisis: interior hegemon Upland, frontline Northmarch, distant pivot Saltmarch; fork at turn 4 when the frontline asks for grain and a relief column), `strait-states` (a modern strait crisis in the invented setting: mainland hegemon Broadland cordons island Shoalholm while distant naval power Farwater's fleet carries a weapon that looses on its own; fork at turn 3, Farwater seat), and ten further scenarios from `var/plans/20260821_Plan_warring_states_scenario_brainstorm.md`, each a modern situation rendered in the invented setting with three seats, six turns, and one fork: `hostage-prince` (hostage diplomacy; fork turn 3), `assassins-map` (a targeted killing with partial attribution; turn 3), `river-works` (upstream water works; turn 4), `wedge-state` (a buffer state asked to host a garrison; turn 3), `salt-and-iron` (export controls on a strategic input; turn 3), `coinage-reform` (rival coin standards and a clearing city; turn 4), `land-register` (a sweeping reform and the displaced nobles; turn 4), `schools-of-the-hundred` (an academy's dissent and state ideology; turn 3), `conscription-rolls` (mobilization under a long war; turn 4), `famine-granary` (relief across a hostile border; turn 3). Economic and social scenarios carry non-military rungs on their ladders. Last come the eight `lamparth-2024-*` cells: the Lamparth et al. 2024 U.S.-China wargame (arXiv 2403.03407) transcribed verbatim from its MIT repository, with real nouns, one model seat (the NSC Deputies Committee) and a scripted PRC, two moves answered by forced choice over the paper's 21 actions, and the paper's three treatments (AI accuracy, crew training, PRC posture) as separate cells; `--dialog <n>` and `--no-priorities` reproduce its other two treatments. Each scenario declares what it simulates (the modern situation); the `/scenarios` and `/play` pages show it, and the seats never see it.

Adjudication: each turn the judge panel scores the combined actions on the scenario's escalation ladder and the `mode` folds the scores into one level (`median`); the narrator then writes the resolution narrative given that level. Judges default to the seated models and the narrator to the first of them; the run records `panel` and `narrator`. The human (`human`) may sit on the panel (the turn waits for a verdict: a rung, reasoning, flags) and may be the narrator (the turn waits for the narrative after the panel scores it).

### Studies and reports

A study is scenarios × models × replicates, each arm its own game. `study-run` plans and plays it (a second call with `--resume` plays whatever did not finish), and `study-report` builds the report the study's scenarios define: `basic` (escalation per turn, peak, and final across replicates) for the Warring States scenarios, `lamparth` for the eight Lamparth cells. The Lamparth report computes the paper's statistics for every subject model and for its reference groups (`data/reference/lamparth-2024.json`: the MIT repository's human teams and its GPT-4 and GPT-3.5 games): action frequency per move, the total causal effect of each treatment factor, aggressiveness, actions selected, the Table 2 consistency statistic, and subject-minus-reference differences per action, every interval a seeded 95% bootstrap. `/studies` lists studies; `/studies/:id` shows the arm grid (each chip a replay link) and the report.

### Play in the browser

`/play` (dev server only) runs the start fork. Tick the candidates for every seat (models and "you"); the page deals six starting models (Opus, Sol, Gemini Flash, Grok, GLM, Kimi K3) across the seats at random and marks the focal seat and starts one branch per seat assignment, all playing at once. In every branch you sit in, you play every turn: the console shows one tab per branch waiting on you, and each prompt carries **that branch's own line** (every prior turn of that run: inject, narrative, escalation rung, every seat's decision) and **the table** (the other seats' briefs for the current turn, since model seats move first and the human moves last). Which model holds another seat, wrote a candidate memo, or sat on the panel is hidden from the player (every model id reads `model`, the table is shuffled) until the game completes and the replays open. The Panel card picks the judges (tick "you" to sit on the panel), the mode, and the narrator (a radio: a named model or you; Sol by default). The judges default to the same six models. The other seats' moves for the current turn stay collapsed until expanded. Every turn of every branch then waits on the console for your verdict card (rung, reasoning, flags) or your narration card (the scored turn, the masked panel, your narrative). Sessions live in the dev server's memory; runs land in `var/runs/` (root holds the matrix, children carry `branch.lane: "matrix"`) and replay at `/runs/<id>`. `/` filters replays by scenario; `/scenarios` switches between every exported scenario.

### Read the matrix

`/runs/<id>/matrix` charts every branch of a start-fork root: escalation rung by turn, one line per branch. Every comparison dimension is an axis: each seat, the judging panel (its judges and combining method), and the source root. Clicking an axis name colors the chart by it; the chips under it filter (double-click shows one value only); "split by dimension" draws one small chart per axis, and clicking a small chart zooms into it. "Color by model · any seat" recolors by where one model sat. Clicking a line isolates that branch; clicking a grid point isolates every branch through that rung on that turn.

`?with=<id>,<id>` combines further matrix roots of the same scenario into one chart, offered as chips under **Combine roots**. Use it to pool a matrix played twice, or two complementary matrices, or the same matrix judged by different panels: when the combined roots were judged differently, "judging panel" appears as its own axis, so branches scored by different judges (or, later, a different combining method) can be separated rather than silently pooled. The header states how many of the implied seats × panel cells are covered, how many were played twice, and whether the narrator differs. Roots from another scenario are refused with a note.

## Ports (NN = 75)

| Port        | Role                                |
| ----------- | ----------------------------------- |
| 3075        | web microsite (later phase)         |
| 3175        | app (replay viewer)                 |
| 8075        | api (later phase)                   |
| 9075 / 9175 | dynamo / dynamo-admin (later phase) |

> Keep this file and CLAUDE.md in sync. When changing scope, tools, targets, or conventions, update both documents. CLAUDE.md is the agent-facing source of truth (how to work); README.md is the human-facing source of truth (what this is and how to use it).
