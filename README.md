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
  lake/       @modelstudies/lake       — document lake seam: rights-aware retrieval over the source corpus
  cli/        @modelstudies/cli        — command-line verbs
  app/        @modelstudies/app        — replay viewer (port 3175)
var/<model>/  — every stored model as JSON: runs, studies, interview, probe, scorecards, reports, scenarios (git-ignored)
var/lake/     — the document corpus and its ingesters (git-ignored)
var/          — plans and meta materials (git-ignored)
```

Core engine code is lifted from the private `finlaysonstudio-cloudagent` repository and modularized behind two injected seams: `LlmClient` (all model calls) and `Store` (all persistence; `FileStore` locally, rooted at `var/`). Nothing under `var/` is committed: runs, studies, reports, and scenario materials are regenerated, and the Lamparth reference dataset ships inside the game package.

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
npm run cli -- game-list                                           # every run, with its own calls' cost
npm run cli -- game-cost <runId>                                   # usage and cost of a run and its branches, by role, model, and seat (--json)
npm run cli -- scorecard <rootRunId>
npm run cli -- game-run --scenario lamparth-2024-acc95-basic-revisionist --panel dev --dialog 3   # one Lamparth replication cell, dialog treatment
npm run cli -- study-run --scenarios "lamparth-2024-*" --models SOL,LUNA --replicates 10 --dialog 3 --dialog-words 350   # the replication: 8 cells × 2 models × 10 games, length-matched dialog
npm run cli -- study-run --resume <studyId>                        # play the arms that did not finish
npm run cli -- study-list
npm run cli -- study-report <studyId>                              # the study's report → var/reports/<studyId>.json
npm run materials                                                  # export scenario cards + prompts to var/scenarios/ (npm run app does this first)
npm run cli -- interview-run --plan crisis --panel dev --explain
npm run cli -- lake-search "hostage prince" --use prompt --limit 5   # the corpus; --use is required
npm run cli -- lake-get zuozhuan-legge-en --use prompt --from 1348 --lines 40
npm run cli -- lake-list --collection period                        # what the lake holds, with rights
npm run cli -- lake-index --verify                                  # rebuild var/lake/index.json
```

Panels: `dev` (SONNET, GEMINI_FLASH, LUNA) and `production` (see `packages/survey/src/panel.ts`). A comma-separated model list works anywhere a panel name does. `--seats` pins seats explicitly; unlisted seats fall back to round-robin over the panel. The fielded model set (`packages/survey/src/models.ts`): Opus, Sonnet, Sol, Luna, Gemini Flash, Gemini Flash Lite, Grok, and four open weights through Fireworks (DeepSeek, GLM, Kimi, Qwen).

Scenarios (in display order): `corridor-states` (an invented Warring States crisis: interior hegemon Upland, frontline Northmarch, distant pivot Saltmarch; fork at turn 4 when the frontline asks for grain and a relief column), `strait-states` (a modern strait crisis in the invented setting: mainland hegemon Broadland cordons island Shoalholm while distant naval power Farwater's fleet carries a weapon that looses on its own; fork at turn 3, Farwater seat), and eleven further scenarios (ten from `var/plans/20260821_Plan_warring_states_scenario_brainstorm.md`), each a modern situation rendered in the invented setting with three seats, six turns, and one fork: `hostage-prince` (hostage diplomacy; fork turn 3), `assassins-map` (a targeted killing with partial attribution; turn 3), `river-works` (upstream water works; turn 4), `wedge-state` (a buffer state asked to host a garrison; turn 3), `salt-and-iron` (export controls on a strategic input; turn 3), `coinage-reform` (rival coin standards and a clearing city; turn 4), `land-register` (a sweeping reform and the displaced nobles; turn 4), `schools-of-the-hundred` (an academy's dissent and state ideology; turn 3), `conscription-rolls` (mobilization under a long war; turn 4), `famine-granary` (relief across a hostile border; turn 3), and `borrowed-road` (a covenant's presiding court seizes a member's far northern isle from the watch-station it already holds there, and the remaining courts must decide whether the oath binds its author; fork turn 4, the council seat; `var/plans/20260822_Plan_borrowed_road_scenario.md`). Economic and social scenarios carry non-military rungs on their ladders. Last come the eight `lamparth-2024-*` cells: the Lamparth et al. 2024 U.S.-China wargame (arXiv 2403.03407) transcribed verbatim from its MIT repository, with real nouns, one model seat (the NSC Deputies Committee) and a scripted PRC, two moves answered by forced choice over the paper's 21 actions, and the paper's three treatments (AI accuracy, crew training, PRC posture) as separate cells; `--dialog <n>` and `--no-priorities` reproduce its other two treatments, and `--dialog-words 350` states the paper's chunk length in every dialog prompt. The seat sees the paper's cards and the priorities only (no summary, objectives, or ladder), so nothing names the paper, the treatment, or move two's outcome before it is due. A selection that is empty, duplicated, or the whole menu is retried twice; a game whose selection is still unusable completes but is excluded from the report and counted there. Each scenario declares what it simulates (the modern situation); the `/scenarios` and `/play` pages show it, and the seats never see it.

Adjudication: each turn the judge panel scores the combined actions on the scenario's escalation ladder and the `mode` folds the scores into one level (`median`); the narrator then writes the resolution narrative given that level. Judges default to the seated models and the narrator to the first of them; the run records `panel` and `narrator`. The human (`human`) may sit on the panel (the turn waits for a verdict: a rung, reasoning, flags) and may be the narrator (the turn waits for the narrative after the panel scores it).

### Usage and cost

Every model call records its tokens (input, output, reasoning, cache reads and writes, as the provider reported them) and the list-price dollars in force when the call was made, on the artifact it produced: each decision brief (dialog rounds included), each judge's verdict, the narrator's narrative, and each debrief. Prices are `@jaypie/llm`'s `LLM.COST` table; a model the table does not list is recorded with tokens but no dollars and shows as `+` beside a sum. `game-cost` and the run page fold a run and its branches into cost by role (seats, judges, narrator, debriefs), by model, and by seat (which model sat where and what it cost there), each call counted once across a tree. Reports carry the same fold for the whole study plus cost per game for every cell. Runs played before this capture show no usage; their cost cannot be recovered from the record (reasoning tokens were never stored).

### Studies and reports

A study is scenarios × models × replicates, each arm its own game. `study-run` plans and plays it (a second call with `--resume` plays whatever did not finish), and `study-report` builds the report the study's scenarios define: `basic` (escalation per turn, peak, and final across replicates) for the Warring States scenarios, `lamparth` for the eight Lamparth cells. The Lamparth report computes the paper's statistics for every subject model and for its reference groups (`packages/game/src/reference/lamparth-2024.json`: the MIT repository's human teams and its GPT-4 and GPT-3.5 games): action frequency per move, the total causal effect of each treatment factor, aggressiveness, actions selected, the Table 2 consistency statistic, and subject-minus-reference differences per action, every interval a seeded 95% bootstrap. `/studies` lists studies; `/studies/:id` shows the arm grid (each chip a replay link) and the report.

### The document lake

`var/lake/` holds the source corpus scenario authoring draws on: the period material the fiction is made from, the modern crisis record behind each scenario's `simulates`, the wargaming and escalation literature behind the ladders and the reports, and the repository's own exported scenario materials. Acquisition lives in `var/lake/bin/` (re-runnable, HTTP-cached ingesters, one registry entry per source); retrieval lives in `@modelstudies/lake` and is reached through the CLI, and later through the chat assistant's `search_lake` and `get_document` tools.

**The wall.** Every document carries a `use`: `prompt` material may reach text a seat reads and is period material only; `reader` material may inform `simulates`, plans, and the submission narrative and never a prompt; `internal` material is method reference. `use` is a required argument on every retrieval entry point, with no default, and it holds for retrieval by id as well as by query: a caller permitted `prompt` material cannot reach a `reader` document by knowing its name. `packages/lake/src/__tests__/wall.spec.ts` asserts it, as `materials.spec.ts` asserts that `simulates` never reaches a prompt.

**Rights.** Every document also carries `rights` and `redistribute`, which govern redistribution rather than retrieval. Only `public-domain`, `open-license`, and `government` documents may travel with the submission bundle; everything else is cited instead. Every search hit and every window carries its citation line, so a rights audit of the submission is a query rather than an archaeology project.

Search is BM25 over whole documents, scaled by how many of the query's terms a document carries, with snippets drawn from the best-matching lines; the whole corpus answers in well under a second. It is lexical, so it will fail on a query like "an episode about a subordinate who acted without orders"; an embedding sidecar belongs beside it, not instead of it. `lake-index` is the only writer of `var/lake/index.json`, and `--verify` recomputes each document's sha1 and word count against the text on disk.

Retrieval practice is documented as a skill in `.claude/skills/lake/`: which `use` each task takes, the Chinese-first shape of the period corpus (47 of its 52 documents are Chinese originals, so an English query for an episode finds almost nothing), how to size a read window against a document's line geometry, and the rights check before quoting. `references/period-terms.md` holds measured classical-Chinese search terms. The skill also carries the trip conditions for the embedding sidecar, so a query that fails because it names a shape rather than a vocabulary surfaces as a decision to make rather than as an empty result.

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
