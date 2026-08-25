import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BadRequestError } from "@jaypie/errors";

/**
 * Downloads a generated PixelLab Wang tileset (the sheet and its corner
 * metadata) into the raw asset tree `items.json` builds from. The MCP tool
 * reports the id; this fetches the two files under the name the spec uses,
 * so the period layer rebuilds from `var/assets/pixellab/` alone.
 *
 *   npm run stage:fetch -- <name>=<tilesetId> [<name>=<id> ...]
 */

const ENDPOINT = "https://api.pixellab.ai/mcp/tilesets";

export interface FetchTilesetOptions {
  id: string;
  name: string;
  dir: string;
  log?: (line: string) => void;
}

const download = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new BadRequestError(`${url} answered ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

export const fetchTileset = async ({
  id,
  name,
  dir,
  log = () => {},
}: FetchTilesetOptions): Promise<void> => {
  await mkdir(dir, { recursive: true });
  const image = await download(`${ENDPOINT}/${id}/image?inline=true`);
  const metadata = await download(`${ENDPOINT}/${id}/metadata`);
  await writeFile(path.join(dir, `${name}.png`), image);
  await writeFile(path.join(dir, `${name}.json`), metadata);
  log(`${name}  ${image.length} bytes  ← ${id}`);
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../../../..");
  const dir = path.join(repo, "var/assets/pixellab/tilesets");
  const pairs = process.argv.slice(2);
  if (!pairs.length) {
    throw new BadRequestError("name=<tilesetId> pairs are required");
  }
  for (const pair of pairs) {
    const [name, id] = pair.split("=");
    if (!name || !id) throw new BadRequestError(`"${pair}" is not name=id`);
    await fetchTileset({ id, name, dir, log: (line) => console.log(line) });
  }
}
