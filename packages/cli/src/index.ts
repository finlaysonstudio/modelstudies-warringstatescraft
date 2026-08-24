import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { Command } from "commander";

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true });

const program = new Command();
program
  .name("warringstates")
  .description("Warring States Craft: war game runs, instruments, analysis");

/** every stored model lands under git-ignored var/<model>/ */
const varRoot = () => resolve(process.cwd(), "var");
/** the corpus lives beside them */
const lakeRoot = () => resolve(varRoot(), "lake");

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

/** a registered panel id (`dev`, `production`, ...) or not: anything else is model ids */
const isPanel = async (spec: string): Promise<boolean> => {
  const { listPanels } = await import("@modelstudies/survey");
  return listPanels().some((panel) => panel.id === spec);
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

type CliLogger = typeof consoleLog & { file: string };

/**
 * The console log teed to `var/log/<yyyymmdd>-<hhmmss>-<command>.jsonl`,
 * one `{ at, level, msg, ...context }` per line: the first string argument
 * is the message, object arguments merge as context, anything else joins the
 * message. Diagnostic and deletable; the journal beside each sitting is the
 * record.
 */
const createCliLog = (command: string): CliLogger => {
  const dir = resolve(varRoot(), "log");
  mkdirSync(dir, { recursive: true });
  const started = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const name =
    `${started.getFullYear()}${pad(started.getMonth() + 1)}${pad(started.getDate())}` +
    `-${pad(started.getHours())}${pad(started.getMinutes())}${pad(started.getSeconds())}` +
    `-${command}.jsonl`;
  const file = resolve(dir, name);
  const write = (level: string, args: unknown[]) => {
    const context: Record<string, unknown> = {};
    const parts: string[] = [];
    for (const arg of args) {
      if (arg instanceof Error) {
        parts.push(arg.message);
        context.stack = arg.stack;
      } else if (typeof arg === "object" && arg !== null) {
        Object.assign(context, arg);
      } else {
        parts.push(String(arg));
      }
    }
    const line = {
      at: new Date().toISOString(),
      level,
      msg: parts.join(" "),
      ...context,
      pid: process.pid,
    };
    try {
      appendFileSync(file, `${JSON.stringify(line)}\n`);
    } catch {
      // the console line still goes out; a log that cannot be written is not
      // worth stopping the run for
    }
  };
  return {
    file,
    trace: (...args: unknown[]) => {
      consoleLog.trace(...args);
      write("trace", args);
    },
    debug: (...args: unknown[]) => {
      consoleLog.debug(...args);
      write("debug", args);
    },
    warn: (...args: unknown[]) => {
      consoleLog.warn(...args);
      write("warn", args);
    },
    error: (...args: unknown[]) => {
      consoleLog.error(...args);
      write("error", args);
    },
  };
};

/**
 * The default client with its outer retry reporting into the log, and a
 * signal that ends a backoff wait when the run is interrupted.
 */
const llmFor = async (log: CliLogger, signal?: AbortSignal) => {
  const { createLlmClient } = await import("@modelstudies/workflows");
  return createLlmClient({
    retry: {
      ...(signal ? { signal } : {}),
      onRetry: (attempt) =>
        log.warn(
          `retry ${attempt.attempt}/${attempt.attempts} (${attempt.reason}) in ${Math.round(attempt.delayMs / 1000)}s: ${attempt.error instanceof Error ? attempt.error.message : String(attempt.error)}`,
          {
            model: attempt.model,
            reason: attempt.reason,
            delayMs: attempt.delayMs,
          },
        ),
    },
  });
};

/**
 * One controller for the run: the first SIGINT or SIGTERM aborts it (every
 * sitting stops between calls and checkpoints); a second exits at once. The
 * journal holds everything up to the last landed call either way.
 */
const interruptible = (log: CliLogger): AbortController => {
  const controller = new AbortController();
  let signals = 0;
  const onSignal = (signal: string) => {
    signals += 1;
    if (signals === 1) {
      log.warn(
        `${signal}: stopping after the calls in flight land (again to exit now)`,
      );
      controller.abort();
      return;
    }
    log.error(`${signal} again: exiting; the journals hold every landed call`);
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  return controller;
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

const parseLanguage = async (language: string) => {
  const { LANGUAGES } = await import("@modelstudies/game");
  const { BadRequestError } = await import("@jaypie/errors");
  if (!(LANGUAGES as string[]).includes(language)) {
    throw new BadRequestError(
      `Unknown language "${language}"; expected one of ${LANGUAGES.join(", ")}`,
    );
  }
  return language as (typeof LANGUAGES)[number];
};

const parseNaming = async (naming: string) => {
  const { NAMINGS } = await import("@modelstudies/game");
  const { BadRequestError } = await import("@jaypie/errors");
  if (!(NAMINGS as string[]).includes(naming)) {
    throw new BadRequestError(
      `Unknown naming "${naming}"; expected one of ${NAMINGS.join(", ")}`,
    );
  }
  return naming as (typeof NAMINGS)[number];
};

const resolveRoster = async (panelOrModels: string): Promise<string[]> => {
  if (!(await isPanel(panelOrModels))) return resolveModels(panelOrModels);
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
    "--dialog-words <n>",
    "target words per dialog round, stated in the dialog prompts (the paper's chunks were about 350)",
  )
  .option(
    "--no-priorities",
    "withhold the scenario's priorities block (instruction ablation)",
  )
  .option("--language <lang>", "render the chapter in en or zh", "en")
  .option(
    "--naming <naming>",
    "render names as chronicle, masked, or modern",
    "chronicle",
  )
  .option("--pivot <id>", "apply one of the chapter's pivots")
  .option("--narrator <model>", "narrator model id")
  .option("--judges <models>", "comma-separated judge model ids")
  .option("--judge-mode <mode>", "how judge verdicts combine", "median")
  .option("--resume <runId>", "resume an existing run")
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { GameEngine } = await import("@modelstudies/game");
    const log = createCliLog("game-run");
    const roster = await resolveRoster(options.panel);
    const engine = new GameEngine({
      dialog: options.dialog ? Number(options.dialog) : undefined,
      dialogWords: options.dialogWords
        ? Number(options.dialogWords)
        : undefined,
      llm: await llmFor(log),
      log,
      maxTurns: options.turns ? Number(options.turns) : undefined,
      priorities: options.priorities,
      language: await parseLanguage(options.language),
      naming: await parseNaming(options.naming),
      pivot: options.pivot,
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
      store: new FileStore(varRoot()),
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
    "comma-separated subject model ids (MODELS constant names such as SOL resolve; with --resume, adds models)",
  )
  .option(
    "--replicates <k>",
    "games per scenario per model (default 1; with --resume, raises the study's count)",
  )
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
  .option("--dialog-words <n>", "target words per dialog round")
  .option("--no-priorities", "withhold the scenario's priorities block")
  .option("--language <lang>", "render every arm in en or zh", "en")
  .option(
    "--naming <naming>",
    "render names as chronicle, masked, or modern",
    "chronicle",
  )
  .option("--pivot <id>", "apply one of the chapter's pivots to every arm")
  .option("--narrator <model>", "narrator model id")
  .option("--judges <models>", "comma-separated judge model ids")
  .option("--judge-mode <mode>", "how judge verdicts combine", "median")
  .option("--concurrency <n>", "arms played at once", "2")
  .option("--plan-only", "write the study without playing it", false)
  .option(
    "--resume <studyId>",
    "play the incomplete arms of an existing study; with --replicates or --models, extend it first",
  )
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { extendStudy, planStudy, runStudy } =
      await import("@modelstudies/game");
    const log = createCliLog("study-run");
    const store = new FileStore(varRoot());
    let id: string = options.resume;
    if (id && (options.replicates || options.models)) {
      const study = await extendStudy({
        id,
        models: options.models
          ? await resolveModels(options.models)
          : undefined,
        replicates: options.replicates ? Number(options.replicates) : undefined,
        store,
      });
      console.log(
        `study: ${study.id}  ${study.arms.length} arms (${study.scenarios.length} cells × ${study.models.length} models × ${study.replicates}) ${study.statusDetail ?? study.status}`,
      );
      if (options.planOnly) return;
    }
    if (!id) {
      if (!options.scenarios || !options.models) {
        throw new Error(
          "--scenarios and --models are required without --resume",
        );
      }
      const study = await planStudy({
        dialog: options.dialog ? Number(options.dialog) : undefined,
        dialogWords: options.dialogWords
          ? Number(options.dialogWords)
          : undefined,
        models: await resolveModels(options.models),
        narrator: options.narrator,
        panel: {
          judges: options.judges
            ? options.judges.split(",").map((m: string) => m.trim())
            : undefined,
          mode: await parsePanelMode(options.judgeMode),
        },
        priorities: options.priorities,
        language: await parseLanguage(options.language),
        naming: await parseNaming(options.naming),
        pivot: options.pivot,
        replicates: Number(options.replicates ?? 1),
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
      llm: await llmFor(log),
      log,
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
    const store = new FileStore(varRoot());
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
    "Build a study's report (its reporting definition) and write var/reports/<studyId>.json",
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
      store: new FileStore(varRoot()),
    });
    console.log(JSON.stringify(report, null, 2));
    if (options.save) {
      console.error(`→ var/reports/${report.id}.json`);
    }
  });

const usd = (value: number): string => `$${value.toFixed(4)}`;

/** one line of totals: calls, tokens in and out, dollars, unpriced count */
const usageLine = (
  totals: import("@modelstudies/workflows").UsageTotals,
): string =>
  `calls:${String(totals.calls).padStart(4)}  in:${tokens(totals.input).padStart(7)}` +
  `  out:${tokens(totals.output).padStart(7)}  ${usd(totals.usd).padStart(9)}` +
  (totals.unpriced ? `  (+${totals.unpriced} unpriced)` : "");

const tokens = (value: number): string =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(2)}M`
    : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}k`
      : String(value);

/** milliseconds as seconds, minutes, or hours */
const duration = (ms: number): string =>
  ms >= 3_600_000
    ? `${(ms / 3_600_000).toFixed(1)}h`
    : ms >= 60_000
      ? `${(ms / 60_000).toFixed(1)}m`
      : `${(ms / 1000).toFixed(1)}s`;

/** mean wall clock per timed call, blank when nothing was timed */
const latencyLine = (
  latency: import("@modelstudies/survey").LatencyTotals,
): string =>
  latency.calls
    ? `  avg:${duration(Math.round(latency.ms / latency.calls)).padStart(6)}/call`
    : "";

program
  .command("game-list")
  .description("List recorded runs with each run's own calls and cost")
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { usageOf } = await import("@modelstudies/game");
    const store = new FileStore(varRoot());
    const runs = await store.list<import("@modelstudies/game").Run>("runs");
    for (const run of runs.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    )) {
      const usage = usageOf(run);
      const cost = usage.total.calls
        ? `${usd(usage.total.usd)}${usage.total.unpriced ? "+" : ""}`
        : "-";
      console.log(
        `${run.id}  ${run.status.padEnd(8)}  ${run.branch.lane.padEnd(11)}` +
          `${(run.branch.decidedBy ?? "-").padEnd(22)}  turns:${run.turns.length}` +
          `  ${cost.padStart(9)}  ${run.scenarioTitle}`,
      );
    }
  });

program
  .command("game-cost")
  .description(
    "Usage and cost of a run and every branch under it, by role, seat, and model",
  )
  .argument("<runId>", "run id (a root sums its whole tree)")
  .option("--json", "print the fold as JSON")
  .action(async (runId: string, options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { groupUsage, usageOfTree } = await import("@modelstudies/game");
    const usage = await usageOfTree({
      rootId: runId,
      store: new FileStore(varRoot()),
    });
    if (options.json) {
      console.log(JSON.stringify(usage, null, 2));
      return;
    }
    const line = (
      label: string,
      totals: import("@modelstudies/game").UsageTotals,
    ) =>
      `${label.padEnd(56)}  calls:${String(totals.calls).padStart(4)}` +
      `  in:${tokens(totals.input).padStart(8)}  out:${tokens(totals.output).padStart(8)}` +
      `  reason:${tokens(totals.reasoning).padStart(8)}  ${usd(totals.usd).padStart(10)}` +
      (totals.unpriced ? `  (${totals.unpriced} unpriced)` : "");
    console.log(`${runId}: ${usage.runs} run(s)`);
    console.log(line("total", usage.total));
    console.log("\nby role");
    for (const { key, totals } of groupUsage(usage.rows, (row) => row.role)) {
      console.log(line(`  ${key}`, totals));
    }
    console.log("\nby model");
    for (const { key, totals } of groupUsage(usage.rows, (row) => row.model)) {
      console.log(line(`  ${key}`, totals));
    }
    console.log("\nby seat");
    for (const row of usage.rows.filter((row) => row.role === "seat")) {
      console.log(line(`  ${row.seat} ← ${row.model}`, row));
    }
  });

program
  .command("materials")
  .description(
    "Export every scenario's cards and prompts to var/scenarios/<id>.json and every instrument plan's description to var/instruments/<plan>.json",
  )
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildAllMaterials } = await import("@modelstudies/game");
    const { buildInstrument, listPlans } = await import("@modelstudies/survey");
    const store = new FileStore(varRoot());
    for (const materials of buildAllMaterials()) {
      await store.create(materials);
      console.log(
        `${materials.id}  seats:${materials.seats.length}  turns:${materials.turns.length}  → var/scenarios/${materials.id}.json`,
      );
    }
    for (const plan of listPlans()) {
      const instrument = buildInstrument({ plan });
      const topics = new Map<string, number>();
      for (const item of instrument.items) {
        const topic = item.topic ?? "—";
        topics.set(topic, (topics.get(topic) ?? 0) + 1);
      }
      await store.create({
        id: plan,
        model: "instruments",
        createdAt: new Date().toISOString(),
        title: instrument.title,
        category: instrument.category,
        ...(instrument.instruction
          ? { instruction: instrument.instruction }
          : {}),
        ...(instrument.probe ? { probe: instrument.probe } : {}),
        ...(instrument.optionOrder
          ? { optionOrder: instrument.optionOrder }
          : {}),
        items: instrument.items.length,
        topics: [...topics.entries()].map(([topic, items]) => ({
          topic,
          items,
        })),
        ...(instrument.subsets ? { subsets: instrument.subsets } : {}),
        ...(instrument.arms
          ? {
              arms: Object.entries(instrument.arms).map(([id, arm]) => ({
                id,
                title: arm.title,
                items: (arm.items ?? instrument.items.map((i) => i.name))
                  .length,
              })),
            }
          : {}),
      });
      console.log(
        `${plan}  items:${instrument.items.length}  → var/instruments/${plan}.json`,
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
      store: new FileStore(varRoot()),
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
      store: new FileStore(varRoot()),
    });
    console.log(
      `usage: ${scorecard.usage.total.calls} calls, ${usd(scorecard.usage.total.usd)}` +
        (scorecard.usage.total.unpriced
          ? ` (+${scorecard.usage.total.unpriced} unpriced)`
          : "") +
        latencyLine(scorecard.usage.latency),
    );
    for (const row of scorecard.models) {
      console.log(
        `${row.model.padEnd(42)} ${(row.arm ?? "default").padEnd(13)} ${row.status.padEnd(9)} overall:${
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
  .command("ladder-scorecard")
  .description(
    "Aggregate a plan's sittings into the ladder scorecard (strips, position, composites, arm deltas)",
  )
  .option("--plan <id>", "instrument plan", "crisis-situated")
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildLadderScorecard } = await import("@modelstudies/survey");
    const scorecard = await buildLadderScorecard({
      plan: options.plan,
      store: new FileStore(varRoot()),
    });
    console.log(
      `usage: ${scorecard.usage.total.calls} calls, ${usd(scorecard.usage.total.usd)}` +
        latencyLine(scorecard.usage.latency),
    );
    for (const row of scorecard.models) {
      const strips = row.modules
        .map(
          (module) =>
            `${module.module}:${module.strip
              .map((score) =>
                score.accepted === null ? "." : score.accepted ? "#" : "-",
              )
              .join("")}${module.inconsistent ? "!" : ""}`,
        )
        .join(" ");
      console.log(
        `${row.model.padEnd(42)} ${row.composites.gameRung.padEnd(13)} ${strips}`,
      );
    }
    console.error(`-> var/scorecards/${scorecard.id}.json`);
  });

program
  .command("predict")
  .description(
    "Join a ladder scorecard's declared readings to a study's played choices (the prediction map)",
  )
  .requiredOption("--study <id>", "study id")
  .option("--scorecard <id>", "ladder scorecard id", "ladder-crisis-situated")
  .option("--no-save", "print only")
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { buildPredictionReport } = await import("./predict");
    const store = new FileStore(varRoot());
    const scorecard = await store.get<
      import("./predict").PredictionShares &
        import("@modelstudies/workflows").Entity
    >("scorecards", options.scorecard);
    if (!scorecard) {
      console.error(
        `Unknown scorecard: ${options.scorecard} (build it with ladder-scorecard)`,
      );
      process.exitCode = 1;
      return;
    }
    const report = await buildPredictionReport({
      save: options.save,
      scorecard,
      store,
      studyId: options.study,
    });
    console.log(JSON.stringify(report, null, 2));
    if (options.save) {
      console.error(`-> var/reports/${report.id}.json`);
    }
  });

program
  .command("interview-run")
  .description("Run a values-instrument sitting across a panel")
  .option("--plan <id>", "instrument plan", "crisis")
  .option(
    "--arm <id>",
    "a treatment arm the plan declares (crisis-situated: priorities, informed, dress-period, dress-modern, zh); the sitting keeps to the arm's items and records the arm",
  )
  .option("--panel <name>", "panel name or comma-separated model ids", "dev")
  .option(
    "--repetitions <n>",
    "target total repetitions per item (default 1; with --resume, the record's target unless given)",
  )
  .option("--explain", "probe an explanation for each answer", false)
  .option("--retry", "re-ask nonconforming turns", false)
  .option(
    "--items <spec>",
    "comma-separated item names, or a subset the plan declares (crisis-situated: crux); the sitting keeps to it on resume",
  )
  .option(
    "--budget-usd <n>",
    "dollar cap shared by the roster; every sitting stops as pending once the running sum reaches it (resume continues)",
  )
  .option(
    "--resume <ids>",
    "comma-separated fielding or interview ids to resume (a fielding resumes every sitting it opened)",
  )
  .action(async (options) => {
    const { FileJournal, FileStore } = await import("@modelstudies/workflows");
    const survey = await import("@modelstudies/survey");
    const log = createCliLog("interview-run");
    const controller = interruptible(log);
    console.error(`log → ${log.file}`);
    const store = new FileStore(varRoot());
    const models = (await isPanel(options.panel))
      ? undefined
      : await resolveModels(options.panel);
    const interviews = await survey.runInterviews({
      ...(options.arm ? { arm: String(options.arm) } : {}),
      explain: options.explain,
      journal: new FileJournal(varRoot()),
      llm: await llmFor(log, controller.signal),
      log,
      models,
      panel: models ? undefined : options.panel,
      plan: options.plan,
      repetitions: options.repetitions
        ? Number(options.repetitions)
        : options.resume
          ? undefined
          : 1,
      resume: options.resume
        ? options.resume.split(",").map((id: string) => id.trim())
        : undefined,
      retry: options.retry,
      ...(options.items ? { items: String(options.items).split(",") } : {}),
      ...(options.budgetUsd !== undefined
        ? { budgetUsd: Number(options.budgetUsd) }
        : {}),
      signal: controller.signal,
      store,
    });
    const fieldings = new Set(
      interviews.map((interview) => interview.fielding).filter(Boolean),
    );
    for (const fielding of fieldings) console.log(`fielding ${fielding}`);
    const usages = [];
    for (const interview of interviews) {
      const detail = interview.error ?? interview.statusDetail;
      const usage = await survey.interviewUsage({ store, entity: interview });
      usages.push(usage);
      console.log(
        `${interview.id}  ${String(interview.status).padEnd(9)}  ${(interview.respondent ?? "").padEnd(42)}` +
          (interview.arm ? `arm:${interview.arm}  ` : "") +
          `${interview.answered}/${interview.answered + interview.declined + interview.remaining}` +
          `  ${usageLine(usage.total)}${latencyLine(usage.latency)}` +
          (detail ? `  ${detail}` : ""),
      );
    }
    if (interviews.length > 1) {
      const roster = survey.usageOfInterviews(usages);
      console.log(
        `roster  ${usageLine(roster.total)}${latencyLine(roster.latency)}`,
      );
    }
    const budgeted = interviews.some((interview) =>
      interview.statusDetail?.startsWith("budget exhausted"),
    );
    if (controller.signal.aborted || budgeted) {
      const ids =
        [...fieldings].join(",") || interviews.map((i) => i.id).join(",");
      console.log(
        `${controller.signal.aborted ? "interrupted" : "budget exhausted"}; resume with --resume ${ids}` +
          (budgeted ? " --budget-usd <n>" : ""),
      );
      if (controller.signal.aborted) process.exitCode = 130;
    }
  });

program
  .command("interview-list")
  .description(
    "List fieldings and their sittings (plan, model, status, reps, answered/declined, cost); sittings fielded singly follow",
  )
  .action(async () => {
    const { FileStore } = await import("@modelstudies/workflows");
    const survey = await import("@modelstudies/survey");
    const store = new FileStore(varRoot());
    const fieldings = await store.list<
      import("@modelstudies/survey").FieldingEntity
    >(survey.FIELDING_MODEL);
    const interviews = await store.list<
      import("@modelstudies/survey").InterviewEntity
    >(survey.INTERVIEW_MODEL);
    const byId = new Map(interviews.map((entity) => [entity.id, entity]));
    const listed = new Set<string>();
    const sittingLine = async (
      entity: import("@modelstudies/survey").InterviewEntity,
    ) => {
      listed.add(entity.id);
      const usage = await survey.interviewUsage({ store, entity });
      const detail = entity.error ?? entity.statusDetail;
      return (
        `  ${entity.id}  ${String(entity.status).padEnd(9)}  ${entity.plan.padEnd(20)}` +
        `  ${survey.respondentOf(entity).padEnd(42)}  reps:${String(entity.repetitions ?? 1).padStart(2)}` +
        `  ${String(entity.answered).padStart(3)}/${String(entity.declined).padStart(2)}` +
        (entity.arm ? `  arm:${entity.arm}` : "") +
        (entity.items ? `  items:${entity.items.length}` : "") +
        `  ${usageLine(usage.total)}${latencyLine(usage.latency)}` +
        (detail ? `  ${detail}` : "")
      );
    };
    for (const fielding of fieldings.sort((a, b) =>
      a.startedAt.localeCompare(b.startedAt),
    )) {
      console.log(
        `${fielding.id}  ${fielding.status.padEnd(9)}  ${fielding.plan}  ${fielding.panel ?? fielding.models.join(",")}` +
          `  reps:${fielding.repetitions}` +
          (fielding.arm ? `  arm:${fielding.arm}` : "") +
          (fielding.items ? `  items:${fielding.items.length}` : "") +
          (fielding.budgetUsd !== undefined
            ? `  budget:${usd(fielding.budgetUsd)}`
            : "") +
          (fielding.statusDetail ? `  ${fielding.statusDetail}` : ""),
      );
      for (const id of Object.values(fielding.interviews)) {
        const entity = byId.get(id);
        console.log(entity ? await sittingLine(entity) : `  ${id}  (missing)`);
      }
    }
    const loose = interviews
      .filter((entity) => !listed.has(entity.id))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    if (loose.length) {
      console.log("(no fielding)");
      for (const entity of loose) console.log(await sittingLine(entity));
    }
  });

program
  .command("interview-cost")
  .description("Usage and cost of one sitting, by role (answer, probe)")
  .argument("<id>", "interview id")
  .option("--json", "print the fold as JSON")
  .action(async (id: string, options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { NotFoundError } = await import("@jaypie/errors");
    const survey = await import("@modelstudies/survey");
    const store = new FileStore(varRoot());
    const entity = await store.get<
      import("@modelstudies/survey").InterviewEntity
    >(survey.INTERVIEW_MODEL, id);
    if (!entity) throw new NotFoundError(`No interview: ${id}`);
    const probes = await store.queryByScope<
      import("@modelstudies/survey").ProbeEntity
    >(survey.PROBE_MODEL, entity.id);
    const usage = survey.usageOfInterview({ entity, probes });
    const latency = survey.latencyOfInterview({ entity, probes });
    if (options.json) {
      console.log(JSON.stringify({ ...usage, quantiles: latency }, null, 2));
      return;
    }
    console.log(
      `${id}: ${entity.plan} · ${survey.respondentOf(entity)} · ${entity.status}`,
    );
    console.log(
      `total  ${usageLine(usage.total)}${latencyLine(usage.latency)}`,
    );
    for (const row of usage.rows) {
      console.log(
        `${row.role.padEnd(6)} ${usageLine(row)}${latencyLine(row.latency)}`,
      );
    }
    for (const row of latency) {
      console.log(
        `${row.role.padEnd(6)} latency over ${row.calls} timed calls: mean ${duration(row.meanMs)}` +
          `  median ${duration(row.medianMs)}  p90 ${duration(row.p90Ms)}  max ${duration(row.maxMs)}`,
      );
    }
  });

program
  .command("interview-estimate")
  .description(
    "Estimate calls, tokens, and cost of a fielding before fielding it (tokens per call from prior sittings of each model when any exist, else a stated heuristic; prices from the table today)",
  )
  .option("--plan <id>", "instrument plan", "crisis")
  .option("--panel <name>", "panel name or comma-separated model ids", "dev")
  .option("--repetitions <n>", "repetitions per item", "1")
  .option("--explain", "probe an explanation for each answer", false)
  .option("--items <spec>", "item names or a subset the plan declares")
  .option(
    "--arm <id>",
    "estimate one arm the plan declares (its items, preamble, rendering, probe)",
  )
  .option("--arms", "estimate every arm the plan declares, after the default")
  .option("--json", "print the estimate as JSON")
  .action(async (options) => {
    const { FileStore } = await import("@modelstudies/workflows");
    const { BadRequestError } = await import("@jaypie/errors");
    const survey = await import("@modelstudies/survey");
    const store = new FileStore(varRoot());
    const models = (await isPanel(options.panel))
      ? survey.resolvePanel({ panel: options.panel }).models
      : await resolveModels(options.panel);
    const instrument = survey.buildInstrument({ plan: options.plan });
    if (options.arm && options.arms) {
      throw new BadRequestError("pass --arm <id> or --arms, not both");
    }
    // The default arm, then each named arm: one estimate per arm.
    const arms: (string | undefined)[] = options.arms
      ? [undefined, ...Object.keys(instrument.arms ?? {})]
      : [options.arm ? String(options.arm) : undefined];
    const estimates = [];
    for (const arm of arms) {
      estimates.push(
        await survey.estimateFielding({
          plan: options.plan,
          models,
          repetitions: Number(options.repetitions),
          explain: options.explain,
          ...(arm !== undefined ? { arm } : {}),
          ...(options.items
            ? {
                items: survey.resolveItems(
                  instrument,
                  String(options.items).split(","),
                ),
              }
            : {}),
          store,
        }),
      );
    }
    if (options.json) {
      console.log(
        JSON.stringify(
          estimates.length === 1 ? estimates[0] : estimates,
          null,
          2,
        ),
      );
      return;
    }
    const figure = (f: import("@modelstudies/survey").TokenFigure) =>
      `${f.input}/${f.output} ${f.source}${f.n ? `(n=${f.n})` : ""}`;
    for (const estimate of estimates) {
      console.log(
        `${estimate.plan}${estimate.arm ? ` · arm ${estimate.arm}` : ""}: ${estimate.sittings[0]?.items ?? 0} items × ${estimate.repetitions} reps` +
          (estimate.explain ? " × (answer + probe)" : "") +
          ` over ${models.length} model(s)`,
      );
      for (const sitting of estimate.sittings) {
        console.log(
          `  ${sitting.model.padEnd(42)}  calls:${String(sitting.calls).padStart(5)}` +
            `  in:${tokens(sitting.input).padStart(8)}  out:${tokens(sitting.output).padStart(8)}` +
            `  ${(sitting.usd === null ? "unpriced" : usd(sitting.usd)).padStart(10)}` +
            `  answer ${figure(sitting.answer)}` +
            (sitting.probe ? `  probe ${figure(sitting.probe)}` : "") +
            (sitting.ms === null ? "" : `  ~${duration(sitting.ms)} serial`),
        );
      }
      console.log(
        `  ${"total".padEnd(42)}  calls:${String(estimate.calls).padStart(5)}` +
          `  in:${tokens(estimate.input).padStart(8)}  out:${tokens(estimate.output).padStart(8)}` +
          `  ${usd(estimate.usd).padStart(10)}` +
          (estimate.unpriced.length
            ? `  (unpriced: ${estimate.unpriced.join(", ")})`
            : "") +
          (estimate.wallMs === null
            ? ""
            : `  wall ~${duration(estimate.wallMs)} (longest sitting)`),
      );
    }
    if (estimates.length > 1) {
      const calls = estimates.reduce((sum, e) => sum + e.calls, 0);
      const total = estimates.reduce((sum, e) => sum + e.usd, 0);
      console.log(
        `${"all arms".padEnd(42)}  calls:${String(calls).padStart(5)}  ${usd(total).padStart(30)}`,
      );
    }
  });

program
  .command("interview-verify")
  .description(
    "Check a sitting against its journal (prompt hashes, entity, probes); --rebuild rewrites the entity and probes from the journal",
  )
  .argument("<id>", "interview id")
  .option("--rebuild", "rewrite the entity and its probes from the journal")
  .option("--json", "print the report as JSON")
  .action(async (id: string, options) => {
    const { FileJournal, FileStore } = await import("@modelstudies/workflows");
    const { verifyInterview } = await import("@modelstudies/survey");
    const report = await verifyInterview({
      id,
      journal: new FileJournal(varRoot()),
      rebuild: !!options.rebuild,
      store: new FileStore(varRoot()),
    });
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    const { entity } = report;
    console.log(
      `${id}  ${entity.status}${entity.statusDetail ? ` (${entity.statusDetail})` : ""}${entity.error ? ` error: ${entity.error}` : ""}`,
    );
    console.log(
      `journal: ${report.events} events, ${report.calls} calls, ${usd(report.usd)}${report.unpriced ? ` (+${report.unpriced} unpriced)` : ""}` +
        (report.stop ? `, stopped: ${report.stop.reason}` : ", no stop line"),
    );
    console.log(
      `prompts: ${report.promptsChecked} checked, ${report.promptMismatches.length} mismatched` +
        (report.promptMismatches.length
          ? ` (${report.promptMismatches.map((m) => `${m.item}#${m.rep}`).join(", ")})`
          : ""),
    );
    for (const fragment of report.torn) {
      console.log(
        `torn: ${fragment.slice(0, 80)}${fragment.length > 80 ? "…" : ""}`,
      );
    }
    for (const line of report.drift) console.log(`drift: ${line}`);
    for (const line of report.probeDrift) console.log(`probe: ${line}`);
    if (report.drift.length === 0 && report.probeDrift.length === 0) {
      console.log("entity and probes match the journal");
    }
    if (report.rebuilt) console.log("rebuilt from the journal");
    else if (report.drift.length || report.probeDrift.length) {
      console.log("pass --rebuild to rewrite them from the journal");
    }
  });

program
  .command("lake-search")
  .description(
    "Search the document lake; --use is required and names the side of the wall",
  )
  .argument("<query>", 'terms, or "a quoted phrase" to match literally')
  .requiredOption("--use <use>", "prompt | reader | internal | any")
  .option("--collection <collection>", "period, situation, method, house")
  .option("--topic <topic>", "manifest topic")
  .option("--tier <tier>", "1 period, 2 situation, 3 method, 5 house")
  .option("--limit <n>", "documents to return", "8")
  .option("--snippets <n>", "snippets per document", "3")
  .option("--context <n>", "lines around each snippet", "1")
  .option("--json", "print the result as JSON")
  .action(async (query: string, options) => {
    const { FileLake, searchLake } = await import("@modelstudies/lake");
    const result = await searchLake({
      collection: options.collection,
      context: Number(options.context),
      lake: new FileLake(lakeRoot()),
      limit: Number(options.limit),
      query,
      snippets: Number(options.snippets),
      tier: options.tier ? Number(options.tier) : undefined,
      topic: options.topic,
      use: options.use,
    });
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(
      `${result.matched} of ${result.searched} documents matched ${JSON.stringify(query)}  [use:${result.use}]`,
    );
    for (const hit of result.hits) {
      console.log(
        `\n\u2500\u2500 ${hit.id}  [${hit.collection}/${hit.use} tier ${hit.tier}]` +
          `  score ${hit.score.toFixed(2)}  hits ${hit.hits}`,
      );
      console.log(`   ${hit.title}`);
      for (const snippet of hit.snippets) {
        console.log(
          `   line ${String(snippet.line).padStart(6)}  ${snippet.text.split("\n").join("\n" + " ".repeat(15))}`,
        );
      }
      console.log(
        `   cite: ${hit.citation ?? "(none recorded)"}${hit.redistribute ? "" : "  [not redistributable]"}`,
      );
    }
    if (result.missing.length) {
      console.log(
        `\nindex is ahead of the tree: no text for ${result.missing.join(", ")}`,
      );
    }
  });

program
  .command("lake-get")
  .description("Read a bounded window of one lake document, with its citation")
  .argument("<id>", "document id")
  .requiredOption("--use <use>", "prompt | reader | internal | any")
  .option("--from <line>", "first line, 1-indexed", "1")
  .option("--lines <n>", "lines to return", "80")
  .option("--json", "print the window as JSON")
  .action(async (id: string, options) => {
    const { FileLake, getDocument } = await import("@modelstudies/lake");
    const document = await getDocument({
      from: Number(options.from),
      id,
      lake: new FileLake(lakeRoot()),
      lines: Number(options.lines),
      use: options.use,
    });
    if (options.json) {
      console.log(JSON.stringify(document, null, 2));
      return;
    }
    console.log(
      `${document.id}  [${document.collection}/${document.use} tier ${document.tier}]` +
        `  lines ${document.from}-${document.to} of ${document.totalLines}`,
    );
    console.log(document.title);
    console.log(
      `cite: ${document.citation ?? "(none recorded)"}${document.redistribute ? "" : "  [not redistributable]"}`,
    );
    console.log("\u2500".repeat(72));
    console.log(document.text);
  });

program
  .command("lake-list")
  .description("List what the lake holds, with rights and use")
  .option("--use <use>", "prompt | reader | internal | any", "any")
  .option("--collection <collection>", "one collection")
  .option("--topic <topic>", "manifest topic")
  .option("--tier <tier>", "one tier")
  .option("--rights <rights>", "one rights value")
  .option("--redistributable", "only what may travel with the bundle")
  .option("--json", "print the manifests as JSON")
  .action(async (options) => {
    const { FileLake, listDocuments } = await import("@modelstudies/lake");
    const documents = await listDocuments({
      collection: options.collection,
      lake: new FileLake(lakeRoot()),
      redistributable: options.redistributable,
      rights: options.rights,
      tier: options.tier ? Number(options.tier) : undefined,
      topic: options.topic,
      use: options.use,
    });
    if (options.json) {
      console.log(JSON.stringify(documents, null, 2));
      return;
    }
    for (const doc of documents) {
      console.log(
        `${doc.id.padEnd(34)}  ${doc.collection.padEnd(10)}  ${doc.use.padEnd(8)}` +
          `  ${doc.rights.padEnd(14)}  ${doc.words.toLocaleString().padStart(10)} words` +
          `  ${doc.redistribute ? "" : "no-redist  "}${doc.title}`,
      );
    }
    const words = documents.reduce((sum, doc) => sum + doc.words, 0);
    console.log(
      `\n${documents.length} documents, ${words.toLocaleString()} words`,
    );
  });

program
  .command("lake-index")
  .description("Rebuild var/lake/index.json from the manifests on disk")
  .option("--verify", "recompute sha1 and word counts against the text")
  .option("--json", "print the index summary as JSON")
  .action(async (options) => {
    const { buildLakeIndex } = await import("@modelstudies/lake");
    const { index, issues } = await buildLakeIndex({
      root: lakeRoot(),
      verify: options.verify,
    });
    if (options.json) {
      console.log(
        JSON.stringify({ ...index, docs: undefined, issues }, null, 2),
      );
    } else {
      console.log(
        `index: ${index.documents} documents, ${index.words.toLocaleString()} words, ` +
          `${index.redistributable} redistributable`,
      );
      for (const [collection, totals] of Object.entries(index.byCollection)) {
        console.log(
          `  ${collection.padEnd(12)}${String(totals.documents).padStart(4)} docs` +
            `  ${totals.words.toLocaleString().padStart(12)} words`,
        );
      }
      for (const issue of issues) {
        console.log(
          `  ${issue.excluded ? "excluded" : "warning "}  ${issue.collection}/${issue.id}: ${issue.problem}`,
        );
      }
    }
    if (issues.some((issue) => issue.excluded)) process.exitCode = 1;
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
