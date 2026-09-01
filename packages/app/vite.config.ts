import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin, type ViteDevServer } from "vite";
import { dataHandler } from "./server/data.ts";

function runsData(): Plugin {
  return {
    name: "warring-states-runs-data",
    configureServer(server) {
      server.middlewares.use(dataHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(dataHandler);
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
