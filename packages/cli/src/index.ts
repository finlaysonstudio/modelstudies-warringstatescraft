import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { Command } from "commander";

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true });

const program = new Command();
program
  .name("situationeval")
  .description("Situation Room evals: war game runs, instruments, analysis");

const dataRoot = () => resolve(process.cwd(), "data");

const consoleLog = {
  trace: (...args: unknown[]) => console.log("[trace]", ...args),
  debug: (...args: unknown[]) => console.log("[debug]", ...args),
  warn: (...args: unknown[]) => console.warn("[warn]", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
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
  .option("--scenario <id>", "scenario id", "taiwan-strait")
  .option("--panel <name>", "panel name or comma-separated model ids", "dev")
  .option("--turns <n>", "play only the first N scenario turns")
  .option("--narrator <model>", "narrator model id")
  .option("--judges <models>", "comma-separated judge model ids")
  .option("--gate", "human GM gate (interactive)", false)
  .option("--resume <runId>", "resume an existing run")
  .action(async (options) => {
    const { FileStore, defaultLlmClient } =
      await import("@modelstudies/workflows");
    const { GameEngine } = await import("@modelstudies/game");
    const { humanGate } = await import("./gate");
    const roster = await resolveRoster(options.panel);
    const engine = new GameEngine({
      gate: options.gate ? humanGate : undefined,
      judges: options.judges
        ? options.judges.split(",").map((m: string) => m.trim())
        : undefined,
      llm: defaultLlmClient,
      log: consoleLog,
      maxTurns: options.turns ? Number(options.turns) : undefined,
      narrator: options.narrator,
      roster,
      scenario: options.scenario,
      store: new FileStore(dataRoot()),
    });
    const run = await engine.play(options.resume);
    console.log(
      `\nroot run: ${run.id} (${run.status}${run.statusDetail ? ` — ${run.statusDetail}` : ""})`,
    );
    if (run.children.length)
      console.log(`branches: ${run.children.join(", ")}`);
  });

program
  .command("game-list")
  .description("List recorded runs")
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const store = new FileStore(dataRoot());
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
  .command("scorecard")
  .description("Build the scorecard for a root run")
  .argument("<rootId>", "root run id")
  .action(async (rootId: string) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildScorecard } = await import("@modelstudies/game");
    const scorecard = await buildScorecard({
      rootId,
      store: new FileStore(dataRoot()),
    });
    console.log(JSON.stringify(scorecard, null, 2));
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
      store: new FileStore(dataRoot()),
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
