import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Serve the built snapshot the way the distribution serves it, so the site can
// be read before it is deployed. The one rule worth reproducing is the SPA
// rewrite: an extension-less path answers with index.html, and a path with an
// extension that is not there answers 404 rather than HTML.

const siteDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../site",
);
const port = Number(process.env.PORT || 3176);

const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".tmj": "application/json; charset=utf-8",
  ".webp": "image/webp",
};

const fileOr404 = async (file: string): Promise<string | null> => {
  try {
    return (await stat(file)).isFile() ? file : null;
  } catch {
    return null;
  }
};

createServer((req, res) => {
  void (async () => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    // reject any traversal before it reaches the filesystem
    const requested = path.join(siteDir, path.normalize(url));
    if (!requested.startsWith(siteDir)) {
      res.statusCode = 403;
      res.end("forbidden");
      return;
    }
    const extension = path.extname(requested);
    const file =
      (await fileOr404(requested)) ??
      (extension ? null : path.join(siteDir, "index.html"));
    if (!file) {
      res.statusCode = 404;
      res.end("not found");
      return;
    }
    res.setHeader(
      "Content-Type",
      TYPES[path.extname(file)] ?? "application/octet-stream",
    );
    createReadStream(file).pipe(res);
  })().catch((error: unknown) => {
    res.statusCode = 500;
    res.end(error instanceof Error ? error.message : "error");
  });
}).listen(port, () => {
  console.log(`snapshot: http://localhost:${port}`);
});
