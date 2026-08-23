import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { Command } from "commander";

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true });

const program = new Command();
program
  .name("warringstates")
  .description("Warring States Bench: war game runs, instruments, analysis");

const dataRoot = () => resolve(process.cwd(), "data");
/** runs and studies land in git-ignored var/; every other model stays under data/ */
const storeOptions = () => ({
  roots: {
    runs: resolve(process.cwd(), "var", "runs"),
    studies: resolve(process.cwd(), "var", "studies"),
  },
});

/** comma-separated model ids; a `MODELS` constant name (SOL, OPUS, ...) resolves to its id */
const resolveModels = async (spec: string): Promise<string[]> => {
  const { MODELS } = await import("@modelstudies/survey");
  const named = MODELS as Record<string, string>;
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => named[part] ?? part);
};

/** comma-separated ids; a trailing `*` matches every registered scenario with that prefix */
const resolveScenarios = async (spec: string): Promise<string[]> => {
  const { listScenarios } = await import("@modelstudies/game");
  const known = listScenarios().map((scenario) => scenario.id);
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) =>
      part.endsWith("*")
        ? known.filter((id) => id.startsWith(part.slice(0, -1)))
        : [part],
    );
};

const consoleLog = {
  trace: (...args: unknown[]) => console.log("[trace]", ...args),
  debug: (...args: unknown[]) => console.log("[debug]", ...args),
  warn: (...args: unknown[]) => console.warn("[warn]", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
};

const parsePanelMode = async (mode: string) => {
  const { PANEL_MODES } = await import("@modelstudies/game");
  const { BadRequestError } = await import("@jaypie/errors");
  if (!(PANEL_MODES as string[]).includes(mode)) {
    throw new BadRequestError(
      `Unknown judge mode "${mode}"; expected one of ${PANEL_MODES.join(", ")}`,
    );
  }
  return mode as (typeof PANEL_MODES)[number];
};

const resolveRoster = async (panelOrModels: string): Promise<string[]> => {
  if (panelOrModels.includes(","))
    return panelOrModels.split(",").map((m) => m.trim());
  const survey = await import("@modelstudies/survey");
  const panel = survey.getPanel(panelOrModels) as
    { models?: string[] } | string[];
  const models = Array.isArray(panel) ? panel : panel.models;
  if (!models?.length) throw new Error(`Panel has no models: ${panelOrModels}`);
  return models;
};

program
  .command("game-run")
  .description("Run a war game (root run branches at the decision point)")
  .option("--scenario <id>", "scenario id", "corridor-states")
  .option("--panel <name>", "panel name or comma-separated model ids", "dev")
  .option(
    "--seats <pairs>",
    "explicit seat assignment, comma-separated seat=model pairs",
  )
  .option(
    "--matrix <spec>",
    "fork at the start: comma-separated seat=model|model pairs (one branch per combination; replaces the decision-point fork)",
  )
  .option("--turns <n>", "play only the first N scenario turns")
  .option(
    "--dialog <n>",
    "rounds of simulated team dialog before each model decision (Lamparth treatment)",
  )
  .option(
    "--no-priorities",
    "withhold the scenario's priorities block (instruction ablation)",
  )
  .option("--narrator <model>", "narrator model id")
  .option("--judges <models>", "comma-separated judge model ids")
  .option("--judge-mode <mode>", "how judge verdicts combine", "median")
  .option("--resume <runId>", "resume an existing run")
  .action(async (options) => {
    const { FileStore, defaultLlmClient } =
      await import("@modelstudies/workflows");
    const { GameEngine } = await import("@modelstudies/game");
    const roster = await resolveRoster(options.panel);
    const engine = new GameEngine({
      dialog: options.dialog ? Number(options.dialog) : undefined,
      llm: defaultLlmClient,
      log: consoleLog,
      maxTurns: options.turns ? Number(options.turns) : undefined,
      priorities: options.priorities,
      matrix: options.matrix
        ? Object.fromEntries(
            options.matrix.split(",").map((pair: string) => {
              const [seat, models] = pair.split("=").map((s) => s.trim());
              return [seat, (models ?? "").split("|").map((m) => m.trim())];
            }),
          )
        : undefined,
      narrator: options.narrator,
      panel: {
        judges: options.judges
          ? options.judges.split(",").map((m: string) => m.trim())
          : undefined,
        mode: await parsePanelMode(options.judgeMode),
      },
      roster,
      scenario: options.scenario,
      seats: options.seats
        ? Object.fromEntries(
            options.seats.split(",").map((pair: string) => {
              const [seat, model] = pair.split("=").map((s) => s.trim());
              return [seat, model];
            }),
          )
        : undefined,
      store: new FileStore(dataRoot(), storeOptions()),
    });
    const run = await engine.play(options.resume);
    console.log(
      `\nroot run: ${run.id} (${run.status}${run.statusDetail ? ` — ${run.statusDetail}` : ""})`,
    );
    if (run.children.length)
      console.log(`branches: ${run.children.join(", ")}`);
  });

program
  .command("study-run")
  .description(
    "Plan and play a study: every scenario × model × replicate as its own game (resumes with --resume)",
  )
  .option(
    "--scenarios <ids>",
    "comma-separated scenario ids; a trailing * expands a prefix (e.g. lamparth-2024-*)",
  )
  .option(
    "--models <ids>",
    "comma-separated subject model ids (MODELS constant names such as SOL resolve)",
  )
  .option("--replicates <k>", "games per scenario per model", "1")
  .option("--title <text>", "study title")
  .option("--report <id>", "reporting definition (defaults to the scenarios')")
  .option(
    "--seats <pairs>",
    "seat assignment applied to every arm, comma-separated seat=model pairs",
  )
  .option(
    "--dialog <n>",
    "rounds of simulated team dialog before each model decision",
  )
  .option("--no-priorities", "withhold the scenario's priorities block")
  .option("--narrator <model>", "narrator model id")
  .option("--judges <models>", "comma-separated judge model ids")
  .option("--judge-mode <mode>", "how judge verdicts combine", "median")
  .option("--concurrency <n>", "arms played at once", "2")
  .option("--plan-only", "write the study without playing it", false)
  .option("--resume <studyId>", "play the incomplete arms of an existing study")
  .action(async (options) => {
    const { FileStore, defaultLlmClient } =
      await import("@modelstudies/workflows");
    const { planStudy, runStudy } = await import("@modelstudies/game");
    const store = new FileStore(dataRoot(), storeOptions());
    let id: string = options.resume;
    if (!id) {
      if (!options.scenarios || !options.models) {
        throw new Error(
          "--scenarios and --models are required without --resume",
        );
      }
      const study = await planStudy({
        dialog: options.dialog ? Number(options.dialog) : undefined,
        models: await resolveModels(options.models),
        narrator: options.narrator,
        panel: {
          judges: options.judges
            ? options.judges.split(",").map((m: string) => m.trim())
            : undefined,
          mode: await parsePanelMode(options.judgeMode),
        },
        priorities: options.priorities,
        replicates: Number(options.replicates),
        report: options.report,
        scenarios: await resolveScenarios(options.scenarios),
        seats: options.seats
          ? Object.fromEntries(
              options.seats.split(",").map((pair: string) => {
                const [seat, model] = pair.split("=").map((s) => s.trim());
                return [seat, model];
              }),
            )
          : undefined,
        store,
        title: options.title,
      });
      id = study.id;
      console.log(
        `study: ${study.id}  ${study.arms.length} arms (${study.scenarios.length} cells × ${study.models.length} models × ${study.replicates}) report:${study.report}`,
      );
      if (options.planOnly) return;
    }
    const study = await runStudy({
      concurrency: Number(options.concurrency),
      id,
      llm: defaultLlmClient,
      log: consoleLog,
      store,
    });
    console.log(
      `\nstudy: ${study.id} (${study.status}${study.statusDetail ? ` — ${study.statusDetail}` : ""})`,
    );
  });

program
  .command("study-list")
  .description("List studies and their progress")
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const store = new FileStore(dataRoot(), storeOptions());
    const studies = await store.list<{
      id: string;
      model: string;
      title: string;
      status: string;
      statusDetail?: string;
      report: string;
      createdAt: string;
      arms: { status: string }[];
    }>("studies");
    for (const study of studies.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    )) {
      const complete = study.arms.filter(
        (arm) => arm.status === "complete",
      ).length;
      console.log(
        `${study.id}  ${study.status.padEnd(8)}  ${study.report.padEnd(9)}  arms:${complete}/${study.arms.length}  ${study.title}`,
      );
    }
  });

program
  .command("study-report")
  .description(
    "Build a study's report (its reporting definition) and write data/reports/<studyId>.json",
  )
  .argument("<studyId>", "study id")
  .option("--bootstrap <n>", "bootstrap resamples", "10000")
  .option("--no-save", "print only")
  .action(async (studyId: string, options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildStudyReport } = await import("@modelstudies/game");
    const report = await buildStudyReport({
      bootstrap: Number(options.bootstrap),
      id: studyId,
      save: options.save,
      store: new FileStore(dataRoot(), storeOptions()),
    });
    console.log(JSON.stringify(report, null, 2));
    if (options.save) {
      console.error(`→ data/reports/${report.id}.json`);
    }
  });

program
  .command("game-list")
  .description("List recorded runs")
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const store = new FileStore(dataRoot(), storeOptions());
    const runs = await store.list<{
      id: string;
      model: string;
      status: string;
      scenarioTitle: string;
      createdAt: string;
      branch: { lane: string; decidedBy: string | null };
      turns: unknown[];
    }>("runs");
    for (const run of runs.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    )) {
      console.log(
        `${run.id}  ${run.status.padEnd(8)}  ${run.branch.lane.padEnd(11)}` +
          `${(run.branch.decidedBy ?? "-").padEnd(22)}  turns:${run.turns.length}  ${run.scenarioTitle}`,
      );
    }
  });

program
  .command("materials")
  .description(
    "Export every scenario's cards and prompts to data/scenarios/<id>.json",
  )
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildAllMaterials } = await import("@modelstudies/game");
    const store = new FileStore(dataRoot(), storeOptions());
    for (const materials of buildAllMaterials()) {
      await store.create(materials);
      console.log(
        `${materials.id}  seats:${materials.seats.length}  turns:${materials.turns.length}  → data/scenarios/${materials.id}.json`,
      );
    }
  });

program
  .command("scorecard")
  .description("Build the scorecard for a root run")
  .argument("<rootId>", "root run id")
  .action(async (rootId: string) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildScorecard } = await import("@modelstudies/game");
    const scorecard = await buildScorecard({
      rootId,
      store: new FileStore(dataRoot(), storeOptions()),
    });
    console.log(JSON.stringify(scorecard, null, 2));
  });

program
  .command("values-scorecard")
  .description(
    "Aggregate a plan's interviews into the declared-values scorecard",
  )
  .option("--plan <id>", "instrument plan", "crisis")
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildValuesScorecard } = await import("@modelstudies/survey");
    const scorecard = await buildValuesScorecard({
      plan: options.plan,
      store: new FileStore(dataRoot(), storeOptions()),
    });
    for (const row of scorecard.models) {
      console.log(
        `${row.model.padEnd(22)} ${row.status.padEnd(9)} overall:${
          row.overall.positiveShare === null
            ? "—"
            : Math.round(row.overall.positiveShare * 100) + "%"
        } ` +
          row.topics
            .map(
              (topic) =>
                `${topic.topic}:${
                  topic.positiveShare === null
                    ? "—"
                    : Math.round(topic.positiveShare * 100) + "%"
                }`,
            )
            .join(" "),
      );
    }
  });

program
  .command("interview-run")
  .description("Run a values-instrument sitting across a panel")
  .option("--plan <id>", "instrument plan", "crisis")
  .option("--panel <name>", "panel name or comma-separated model ids", "dev")
  .option("--repetitions <n>", "target total repetitions per item", "1")
  .option("--explain", "probe an explanation for each answer", false)
  .option("--retry", "re-ask nonconforming turns", false)
  .option("--resume <ids>", "comma-separated interview ids to resume")
  .action(async (options) => {
    const { FileStore, defaultLlmClient } =
      await import("@modelstudies/workflows");
    const survey = await import("@modelstudies/survey");
    const models = options.panel.includes(",")
      ? options.panel.split(",").map((m: string) => m.trim())
      : undefined;
    const interviews = await survey.runInterviews({
      explain: options.explain,
      llm: defaultLlmClient,
      log: consoleLog,
      models,
      panel: models ? undefined : options.panel,
      plan: options.plan,
      repetitions: Number(options.repetitions),
      resume: options.resume
        ? options.resume.split(",").map((id: string) => id.trim())
        : undefined,
      retry: options.retry,
      store: new FileStore(dataRoot(), storeOptions()),
    });
    for (const interview of interviews) {
      console.log(
        `${interview.id}  ${String(interview.status).padEnd(9)}  ${interview.respondent ?? interview.llm ?? ""}`,
      );
    }
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
