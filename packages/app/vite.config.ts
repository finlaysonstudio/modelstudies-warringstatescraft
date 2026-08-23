import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
  defineConfig,
  type Connect,
  type Plugin,
  type ViteDevServer,
} from "vite";

// Resolved relative to this package: every stored model lives at
// <repo>/var/<model>/*.json (git-ignored), served here under /data/<model>/.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
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
    files = (await readdir(studiesDir)).filter((file) => file.endsWith(".json"));
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
        order?: number;
        scenario?: { title?: string; summary?: string; simulates?: string };
        seats?: unknown[];
        turns?: unknown[];
      };
      index.push({
        id: materials.id ?? file.replace(/\.json$/, ""),
        order: materials.order ?? Number.MAX_SAFE_INTEGER,
        title: materials.scenario?.title ?? "",
        summary: materials.scenario?.summary ?? "",
        simulates: materials.scenario?.simulates ?? "",
        seatCount: Array.isArray(materials.seats) ? materials.seats.length : 0,
        turnCount: Array.isArray(materials.turns) ? materials.turns.length : 0,
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return (index as { order: number }[]).sort((a, b) => a.order - b.order);
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
      });
    } catch {
      // unreadable file: skip it rather than break the index
    }
  }
  return index;
}

const handler: Connect.NextHandleFunction = (req, res, next) => {
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
    const match =
      /^\/data\/(runs|studies|scorecards|scenarios|reports)\/([A-Za-z0-9._-]+)\.json$/.exec(
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

function runsData(): Plugin {
  return {
    name: "warring-states-runs-data",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// Play API: the Node-side module at server/play.ts, loaded through Vite's SSR
// pipeline so the workspace TypeScript runs with no build step. Dev server
// only; the production bundle never references it.
type PlayModule = typeof import("./server/play");

const playModulePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "server/play.ts",
);

const readJson = (req: Connect.IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

function playApi(): Plugin {
  return {
    name: "warring-states-play-api",
    configureServer(server: ViteDevServer) {
      const load = () =>
        server.ssrLoadModule(playModulePath) as Promise<PlayModule>;
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (!url.startsWith("/api/play")) {
          next();
          return;
        }
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        void (async () => {
          const play = await load();
          const rest = url.slice("/api/play".length).replace(/^\//, "");
          const [id, action] = rest.split("/");
          if (req.method === "GET" && rest === "catalog") {
            send(200, play.catalog());
          } else if (req.method === "GET" && rest === "") {
            send(200, play.listSessions());
          } else if (req.method === "POST" && rest === "") {
            const body = (await readJson(req)) as Parameters<
              PlayModule["createSession"]
            >[0];
            send(201, play.createSession(body));
          } else if (req.method === "GET" && id && !action) {
            send(200, play.getSession(id));
          } else if (req.method === "POST" && id && action === "answer") {
            const body = (await readJson(req)) as {
              promptId: string;
              memo: Parameters<PlayModule["answerPrompt"]>[2];
            };
            send(200, play.answerPrompt(id, body.promptId, body.memo));
          } else if (req.method === "POST" && id && action === "judge") {
            const body = (await readJson(req)) as {
              promptId: string;
              verdict: Parameters<PlayModule["answerJudge"]>[2];
            };
            send(200, play.answerJudge(id, body.promptId, body.verdict));
          } else if (req.method === "POST" && id && action === "narrate") {
            const body = (await readJson(req)) as {
              promptId: string;
              narrative: string;
            };
            send(200, play.answerNarrate(id, body.promptId, body.narrative));
          } else {
            send(404, { error: "not found" });
          }
        })().catch((error: unknown) => {
          const status =
            typeof error === "object" &&
            error !== null &&
            "status" in error &&
            typeof (error as { status: unknown }).status === "number"
              ? (error as { status: number }).status
              : 500;
          send(status, {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), runsData(), playApi()],
});
