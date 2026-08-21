import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

// Runs live at <repo>/data/runs/*.json, resolved relative to this package.
const runsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/runs",
);

interface RunFile {
  id?: string;
  scenarioTitle?: string;
  createdAt?: string;
  status?: string;
  branch?: { parent?: string | null; lane?: string; decidedBy?: string | null };
  children?: unknown[];
  turns?: unknown[];
}

async function buildScenarioIndex(): Promise<object[]> {
  const dir = path.join(runsDir, "..", "scenarios");
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
        scenario?: { title?: string; summary?: string };
        seats?: unknown[];
        turns?: unknown[];
      };
      index.push({
        id: materials.id ?? file.replace(/\.json$/, ""),
        title: materials.scenario?.title ?? "",
        summary: materials.scenario?.summary ?? "",
        seatCount: Array.isArray(materials.seats) ? materials.seats.length : 0,
        turnCount: Array.isArray(materials.turns) ? materials.turns.length : 0,
      });
    } catch {
      // unreadable file: skip it
    }
  }
  return index;
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
        scenarioTitle: run.scenarioTitle ?? "",
        createdAt: run.createdAt ?? "",
        status: run.status ?? "active",
        branch: {
          parent: run.branch?.parent ?? null,
          lane: run.branch?.lane ?? "root",
          decidedBy: run.branch?.decidedBy ?? null,
        },
        childrenCount: Array.isArray(run.children) ? run.children.length : 0,
        turnCount: Array.isArray(run.turns) ? run.turns.length : 0,
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
    const match =
      /^\/data\/(runs|scorecards|scenarios)\/([A-Za-z0-9._-]+)\.json$/.exec(
      url,
    );
    if (match) {
      try {
        const body = await readFile(
          path.join(runsDir, "..", match[1], `${match[2]}.json`),
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
    name: "situation-eval-runs-data",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), runsData()],
});
