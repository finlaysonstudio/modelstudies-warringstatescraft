import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect } from "vite";

// The one place that knows how `/data/*` is composed. The Vite dev server
// mounts `dataHandler`; the static snapshot writes the same URLs as files
// with `writeDataSnapshot`. Both read this module, so a deployed snapshot and
// the development server cannot answer differently.

// Resolved relative to this package: every stored model lives at
// <repo>/var/<model>/*.json (git-ignored), served here under /data/<model>/.
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const varDir = path.join(repoRoot, "var");
const modelDir = (model: string) => path.join(varDir, model);
const runsDir = modelDir("runs");
const studiesDir = modelDir("studies");

interface RunFile {
  id?: string;
  scenario?: string;
  scenarioTitle?: string;
  createdAt?: string;
  status?: string;
  roster?: Record<string, string>;
  branch?: { parent?: string | null; lane?: string; decidedBy?: string | null };
  children?: unknown[];
  turns?: unknown[];
  matrix?: Record<string, string[]>;
  panel?: { judges?: string[]; mode?: string };
  narrator?: string;
  study?: string;
  replicate?: number;
  language?: string;
  naming?: string;
  pivot?: string;
}

interface StudyFile {
  id?: string;
  title?: string;
  createdAt?: string;
  status?: string;
  statusDetail?: string;
  report?: string;
  scenarios?: string[];
  models?: string[];
  replicates?: number;
  arms?: { status?: string }[];
}

async function buildStudyIndex(): Promise<object[]> {
  let files: string[] = [];
  try {
    files = (await readdir(studiesDir)).filter((file) =>
      file.endsWith(".json"),
    );
  } catch {
    return [];
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const study = JSON.parse(
        await readFile(path.join(studiesDir, file), "utf8"),
      ) as StudyFile;
      const arms = Array.isArray(study.arms) ? study.arms : [];
      index.push({
        id: study.id ?? file.replace(/\.json$/, ""),
        title: study.title ?? "",
        createdAt: study.createdAt ?? "",
        status: study.status ?? "active",
        ...(study.statusDetail ? { statusDetail: study.statusDetail } : {}),
        report: study.report ?? "basic",
        scenarios: study.scenarios ?? [],
        models: study.models ?? [],
        replicates: study.replicates ?? 0,
        armCount: arms.length,
        completeCount: arms.filter((arm) => arm.status === "complete").length,
        errorCount: arms.filter((arm) => arm.status === "error").length,
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { createdAt: string }[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

interface ScorecardFile {
  kind?: string;
  id?: string;
  plan?: string;
  title?: string;
  createdAt?: string;
  models?: unknown[];
}

// one entry per scorecard on record; /values loads each by id
async function buildScorecardIndex(): Promise<object[]> {
  const dir = modelDir("scorecards");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const scorecard = JSON.parse(
        await readFile(path.join(dir, file), "utf8"),
      ) as ScorecardFile;
      const id = scorecard.id ?? file.replace(/\.json$/, "");
      index.push({
        id,
        kind:
          scorecard.kind ?? (id.startsWith("ladder-") ? "ladder" : "values"),
        plan: scorecard.plan ?? "",
        title: scorecard.title ?? "",
        createdAt: scorecard.createdAt ?? "",
        modelCount: Array.isArray(scorecard.models)
          ? scorecard.models.length
          : 0,
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { plan: string }[]).sort((a, b) =>
    a.plan.localeCompare(b.plan),
  );
}

async function buildScenarioIndex(): Promise<object[]> {
  const dir = modelDir("scenarios");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const materials = JSON.parse(
        await readFile(path.join(dir, file), "utf8"),
      ) as {
        id?: string;
        base?: string;
        order?: number;
        renderings?: { id: string; naming: string; language: string }[];
        scenario?: {
          title?: string;
          summary?: string;
          simulates?: string;
          chapter?: { order: number; date: string };
          report?: string;
          decisionPoints?: { turn: number; seat: string }[];
        };
        seats?: { id?: string; name?: string }[];
        turns?: unknown[];
      };
      const id = materials.id ?? file.replace(/\.json$/, "");
      // one entry per scenario: the default rendering lists the others
      if (materials.base && materials.base !== id) continue;
      index.push({
        id,
        order: materials.order ?? Number.MAX_SAFE_INTEGER,
        title: materials.scenario?.title ?? "",
        summary: materials.scenario?.summary ?? "",
        simulates: materials.scenario?.simulates ?? "",
        seatCount: Array.isArray(materials.seats) ? materials.seats.length : 0,
        turnCount: Array.isArray(materials.turns) ? materials.turns.length : 0,
        renderings: materials.renderings ?? [
          { id, naming: "chronicle", language: "en" },
        ],
        ...(materials.scenario?.chapter
          ? { chapter: materials.scenario.chapter }
          : {}),
        report: materials.scenario?.report ?? "basic",
        seats: (materials.seats ?? []).map((seat) => ({
          id: seat.id ?? "",
          name: seat.name ?? seat.id ?? "",
        })),
        decisionPoints: materials.scenario?.decisionPoints ?? [],
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { order: number }[]).sort((a, b) => a.order - b.order);
}

interface FieldingFile {
  id?: string;
  plan?: string;
  arm?: string;
  panel?: string;
  models?: string[];
  repetitions?: number;
  condition?: string;
  language?: string;
  items?: string[];
  budgetUsd?: number;
  interviews?: Record<string, string>;
  status?: string;
  statusDetail?: string;
  startedAt?: string;
  completedAt?: string;
}

// one entry per fielding on record; /craft/survey lists them
async function buildFieldingIndex(): Promise<object[]> {
  const dir = modelDir("fielding");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const fielding = JSON.parse(
        await readFile(path.join(dir, file), "utf8"),
      ) as FieldingFile;
      index.push({
        id: fielding.id ?? file.replace(/\.json$/, ""),
        plan: fielding.plan ?? "",
        ...(fielding.arm ? { arm: fielding.arm } : {}),
        ...(fielding.panel ? { panel: fielding.panel } : {}),
        models: fielding.models ?? [],
        repetitions: fielding.repetitions ?? 0,
        ...(fielding.condition ? { condition: fielding.condition } : {}),
        ...(fielding.language ? { language: fielding.language } : {}),
        ...(fielding.items ? { items: fielding.items } : {}),
        ...(fielding.budgetUsd !== undefined
          ? { budgetUsd: fielding.budgetUsd }
          : {}),
        interviews: fielding.interviews ?? {},
        status: fielding.status ?? "active",
        ...(fielding.statusDetail
          ? { statusDetail: fielding.statusDetail }
          : {}),
        startedAt: fielding.startedAt ?? "",
        ...(fielding.completedAt ? { completedAt: fielding.completedAt } : {}),
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { startedAt: string }[]).sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  );
}

interface StagingFile {
  id?: string;
  run?: string;
  scenario?: string;
  source?: string;
  seed?: number;
  coder?: string;
  createdAt?: string;
  beats?: unknown[];
  fallbackTurns?: number[];
}

// one entry per staging on record; the watch page offers a run's stagings
async function buildStagingIndex(): Promise<object[]> {
  const dir = modelDir("stagings");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const staging = JSON.parse(
        await readFile(path.join(dir, file), "utf8"),
      ) as StagingFile;
      index.push({
        id: staging.id ?? file.replace(/\.json$/, ""),
        run: staging.run ?? "",
        scenario: staging.scenario ?? "",
        source: staging.source ?? "fallback",
        ...(staging.seed !== undefined ? { seed: staging.seed } : {}),
        ...(staging.coder ? { coder: staging.coder } : {}),
        createdAt: staging.createdAt ?? "",
        beatCount: Array.isArray(staging.beats) ? staging.beats.length : 0,
        ...(staging.fallbackTurns?.length
          ? { fallbackTurns: staging.fallbackTurns }
          : {}),
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { id: string }[]).sort((a, b) => a.id.localeCompare(b.id));
}

async function buildIndex(): Promise<object[]> {
  let files: string[] = [];
  try {
    files = (await readdir(runsDir)).filter((file) => file.endsWith(".json"));
  } catch {
    return []; // missing dir → empty index
  }
  const index: object[] = [];
  for (const file of files) {
    try {
      const run = JSON.parse(
        await readFile(path.join(runsDir, file), "utf8"),
      ) as RunFile;
      index.push({
        id: run.id ?? file.replace(/\.json$/, ""),
        scenario: run.scenario ?? "",
        scenarioTitle: run.scenarioTitle ?? "",
        createdAt: run.createdAt ?? "",
        status: run.status ?? "active",
        roster: run.roster ?? {},
        branch: {
          parent: run.branch?.parent ?? null,
          lane: run.branch?.lane ?? "root",
          decidedBy: run.branch?.decidedBy ?? null,
        },
        childrenCount: Array.isArray(run.children) ? run.children.length : 0,
        turnCount: Array.isArray(run.turns) ? run.turns.length : 0,
        // matrix roots only; the app's combine picker reads these to offer
        // and label other roots of the same scenario
        ...(run.matrix ? { matrix: run.matrix } : {}),
        ...(run.panel ? { panel: run.panel } : {}),
        ...(run.narrator ? { narrator: run.narrator } : {}),
        ...(run.study ? { study: run.study, replicate: run.replicate } : {}),
        ...(run.language ? { language: run.language } : {}),
        ...(run.naming ? { naming: run.naming } : {}),
        ...(run.pivot ? { pivot: run.pivot } : {}),
      });
    } catch {
      // unreadable file: skip it rather than break the index
    }
  }
  return index;
}

interface EpisodeFile {
  id?: string;
  act?: string;
  order?: number;
  date?: string;
  year?: number;
  title?: Record<string, string>;
  blurb?: Record<string, string>;
  chapter?: string;
  venues?: string[];
  places?: string[];
  beats?: unknown[];
}

/**
 * One entry per episode of the Annals, in chronicle order. The timeline
 * reads this; the player page reads the episode itself.
 */
async function buildEpisodeIndex(): Promise<object[]> {
  const dir = modelDir("episodes");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
  const index: {
    id: string;
    act: string;
    order: number;
    date: string;
    year: number;
    title: Record<string, string>;
    blurb: Record<string, string>;
    chapter?: string;
    venues: string[];
    sceneCount: number;
  }[] = [];
  for (const file of files) {
    try {
      const episode = JSON.parse(
        await readFile(path.join(dir, file), "utf8"),
      ) as EpisodeFile;
      index.push({
        id: episode.id ?? file.replace(/\.json$/, ""),
        act: episode.act ?? "",
        order: episode.order ?? 0,
        date: episode.date ?? "",
        year: episode.year ?? 0,
        title: episode.title ?? { en: "", zh: "" },
        blurb: episode.blurb ?? { en: "", zh: "" },
        ...(episode.chapter ? { chapter: episode.chapter } : {}),
        venues: episode.venues ?? [],
        sceneCount: Array.isArray(episode.beats) ? episode.beats.length : 0,
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return index.sort((a, b) => a.order - b.order);
}

export const dataHandler: Connect.NextHandleFunction = (req, res, next) => {
  const url = (req.url ?? "").split("?")[0];
  if (req.method !== "GET" || !url.startsWith("/data/")) {
    next();
    return;
  }
  void (async () => {
    if (url === "/data/runs.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildIndex()));
      return;
    }
    if (url === "/data/scenarios.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildScenarioIndex()));
      return;
    }
    if (url === "/data/studies.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildStudyIndex()));
      return;
    }
    if (url === "/data/scorecards.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildScorecardIndex()));
      return;
    }
    if (url === "/data/fieldings.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildFieldingIndex()));
      return;
    }
    if (url === "/data/stagings.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildStagingIndex()));
      return;
    }
    if (url === "/data/episodes.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(await buildEpisodeIndex()));
      return;
    }
    // every probe of one sitting: var/probe/<interviewId>#<item>.json
    const probes = /^\/data\/probes\/([A-Za-z0-9._-]+)\.json$/.exec(url);
    if (probes) {
      const dir = modelDir("probe");
      let files: string[] = [];
      try {
        files = (await readdir(dir)).filter(
          (file) => file.startsWith(`${probes[1]}#`) && file.endsWith(".json"),
        );
      } catch {
        // missing dir → empty list
      }
      const list: unknown[] = [];
      for (const file of files) {
        try {
          list.push(JSON.parse(await readFile(path.join(dir, file), "utf8")));
        } catch {
          // unreadable file: skip it
        }
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(list));
      return;
    }
    const match =
      /^\/data\/(runs|studies|scorecards|scenarios|reports|fielding|interview|instruments|stagings|episodes|world)\/([A-Za-z0-9._-]+)\.json$/.exec(
        url,
      );
    if (match) {
      try {
        const body = await readFile(
          path.join(modelDir(match[1]), `${match[2]}.json`),
          "utf8",
        );
        res.setHeader("Content-Type", "application/json");
        res.end(body);
      } catch {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "not found" }));
      }
      return;
    }
    next();
  })().catch(next);
};

// ---------------------------------------------------------------------------
// Static snapshot
// ---------------------------------------------------------------------------

/** The generated indexes, by the URL each is served at. */
const INDEXES: Record<string, () => Promise<object[]>> = {
  "runs.json": buildIndex,
  "scenarios.json": buildScenarioIndex,
  "studies.json": buildStudyIndex,
  "scorecards.json": buildScorecardIndex,
  "fieldings.json": buildFieldingIndex,
  "stagings.json": buildStagingIndex,
  "episodes.json": buildEpisodeIndex,
};

/**
 * Store models copied entity by entity, matching the dev handler's own
 * allowlist. `probe` is absent on purpose: probes are served gathered per
 * sitting at /data/probes/<interviewId>.json, never one file at a time.
 */
const ENTITY_MODELS = [
  "runs",
  "studies",
  "scorecards",
  "scenarios",
  "reports",
  "fielding",
  "interview",
  "instruments",
  "stagings",
  "episodes",
  "world",
] as const;

export interface SnapshotEntry {
  /** the URL path under /data, e.g. "runs/abc.json" */
  key: string;
  bytes: number;
}

export interface SnapshotResult {
  /** absolute directory written */
  dir: string;
  entries: SnapshotEntry[];
  /** bytes written, every file summed */
  bytes: number;
  /** file count per group, indexes first */
  counts: Record<string, number>;
}

const writeJsonFile = async (
  dir: string,
  key: string,
  body: string,
): Promise<SnapshotEntry> => {
  const file = path.join(dir, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body, "utf8");
  return { key, bytes: Buffer.byteLength(body, "utf8") };
};

/**
 * Write every `/data/*` URL the app can fetch as a file under `outDir`, so an
 * object store answers what the dev server's middleware answers. Only the
 * `.json` files of the models above travel: the journals beside a sitting
 * (`var/interview/<id>.jsonl`) are the record, not the site.
 */
export async function writeDataSnapshot(
  outDir: string,
): Promise<SnapshotResult> {
  const entries: SnapshotEntry[] = [];
  const counts: Record<string, number> = {};

  for (const [key, build] of Object.entries(INDEXES)) {
    entries.push(
      await writeJsonFile(outDir, key, JSON.stringify(await build())),
    );
  }
  counts.indexes = Object.keys(INDEXES).length;

  for (const model of ENTITY_MODELS) {
    const dir = modelDir(model);
    let files: string[] = [];
    try {
      files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
    } catch {
      files = []; // a model with nothing on record writes nothing
    }
    for (const file of files) {
      try {
        entries.push(
          await writeJsonFile(
            outDir,
            `${model}/${file}`,
            await readFile(path.join(dir, file), "utf8"),
          ),
        );
      } catch {
        // unreadable file: skip it rather than fail the snapshot
      }
    }
    counts[model] = files.length;
  }

  // probes gathered per sitting, the shape /craft/survey/:interviewId reads
  const probeDir = modelDir("probe");
  let probeFiles: string[] = [];
  try {
    probeFiles = (await readdir(probeDir)).filter((file) =>
      file.endsWith(".json"),
    );
  } catch {
    probeFiles = [];
  }
  const bySitting = new Map<string, string[]>();
  for (const file of probeFiles) {
    const id = file.slice(0, file.indexOf("#"));
    if (!id) continue;
    bySitting.set(id, [...(bySitting.get(id) ?? []), file]);
  }
  for (const [id, files] of bySitting) {
    const list: unknown[] = [];
    for (const file of files) {
      try {
        list.push(
          JSON.parse(await readFile(path.join(probeDir, file), "utf8")),
        );
      } catch {
        // unreadable file: skip it
      }
    }
    entries.push(
      await writeJsonFile(outDir, `probes/${id}.json`, JSON.stringify(list)),
    );
  }
  counts.probes = bySitting.size;

  return {
    dir: outDir,
    entries,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    counts,
  };
}
