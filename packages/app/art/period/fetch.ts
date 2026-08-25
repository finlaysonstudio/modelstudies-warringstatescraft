import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

import { BadRequestError } from "@jaypie/errors";

/**
 * Downloads generated PixelLab art into the raw asset tree `items.json` builds
 * from. The MCP tool reports an id; this fetches the files under the name the
 * spec uses, so a period layer rebuilds from `var/assets/pixellab/` alone.
 *
 *   npm run stage:fetch -- [--kind <kind>] [--dir <sub>] <name>=<id> [...]
 *
 * `--kind` is what the id names: `tileset` (the Wang sheet and its corner
 * metadata, the default), `object` (one PNG, or one frame per facing when the
 * object was generated in eight directions), or `character` (the animation
 * frames). Anything with facings is unpacked to `<name>/walk/<facing>-<n>.png`,
 * so a still and a walk cycle read the same way. `--dir` names the
 * subdirectory of the raw tree the files land in, so a second art set's
 * downloads sit beside the first set's rather than over them.
 */

const ENDPOINT = "https://api.pixellab.ai/mcp";

export type FetchKind = "tileset" | "object" | "character";

/** where each kind lands when `--dir` is absent */
const DEFAULT_DIR: Record<FetchKind, string> = {
  tileset: "tilesets",
  object: "objects",
  character: "",
};

/** the stage's facings, in the names PixelLab gives its rotations */
const FACINGS = ["south", "west", "east", "north"];

export interface FetchOptions {
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
}: FetchOptions): Promise<void> => {
  await mkdir(dir, { recursive: true });
  const image = await download(`${ENDPOINT}/tilesets/${id}/image?inline=true`);
  const metadata = await download(`${ENDPOINT}/tilesets/${id}/metadata`);
  await writeFile(path.join(dir, `${name}.png`), image);
  await writeFile(path.join(dir, `${name}.json`), metadata);
  log(`${name}  ${image.length} bytes  ← ${id}`);
};

/** the first bytes of a zip local header, which a multi-rotation download is */
const isZip = (data: Uint8Array): boolean =>
  data[0] === 0x50 && data[1] === 0x4b;

/**
 * One object. A single-direction object downloads as a PNG and lands as
 * `<name>.png`; an eight-direction object downloads as an archive of
 * rotations and lands as a one-frame sprite, so a still like the barge is
 * read by the same spec entry a walk cycle is.
 */
export const fetchObject = async ({
  id,
  name,
  dir,
  log = () => {},
}: FetchOptions): Promise<void> => {
  const data = await download(`${ENDPOINT}/objects/${id}/download`);
  if (!isZip(data)) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${name}.png`), data);
    log(`${name}  ${data.length} bytes  ← ${id}`);
    return;
  }
  const written = await writeFrames({
    entries: readZip(data),
    dir: path.join(dir, name, "walk"),
    name,
  });
  log(`${name}  ${written} rotations  ← ${id}`);
};

/**
 * The zip entries, by name. The archive PixelLab serves is small and flat, so
 * this reads the central directory rather than taking a dependency: an entry
 * is either stored whole or raw-deflated, and anything else is refused rather
 * than written as rubbish.
 */
export const readZip = (data: Uint8Array): Map<string, Uint8Array> => {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let end = data.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end -= 1;
  if (end < 0) throw new BadRequestError("the download is not a zip archive");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) {
      throw new BadRequestError("the zip central directory is malformed");
    }
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const offset = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(
      data.subarray(at + 46, at + 46 + nameLength),
    );
    // the local header repeats the name and carries its own extra field
    const localName = view.getUint16(offset + 26, true);
    const localExtra = view.getUint16(offset + 28, true);
    const from = offset + 30 + localName + localExtra;
    const raw = data.subarray(from, from + size);
    if (method === 0) entries.set(name, raw);
    else if (method === 8)
      entries.set(name, new Uint8Array(inflateRawSync(raw)));
    else throw new BadRequestError(`${name} uses zip method ${method}`);
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

/**
 * The archive's frames for one facing, in order: the animation's frames when
 * the subject was animated (`<State>/animations/<name>/<facing>/frame_NNN.png`),
 * otherwise the single rotation it was generated with. A still and a walk
 * cycle then land in the same shape, and the spec's `frames` count is what
 * says which one an id is.
 */
const framesOf = (
  entries: Map<string, Uint8Array>,
  facing: string,
): Uint8Array[] => {
  const animated = [...entries.keys()]
    .filter((entry) =>
      new RegExp(`/animations/[^/]+/${facing}/frame_\\d+\\.png$`).test(entry),
    )
    .sort();
  if (animated.length) {
    return animated.map((entry) => entries.get(entry) as Uint8Array);
  }
  // a character's archive nests its rotations under a state, an object's does not
  const rotation = [...entries.keys()].find((entry) =>
    new RegExp(`(^|/)rotations/${facing}\\.png$`).test(entry),
  );
  return rotation ? [entries.get(rotation) as Uint8Array] : [];
};

/** Writes each facing's frames as `<facing>-<n>.png`, returning how many. */
const writeFrames = async ({
  entries,
  dir,
  name,
}: {
  entries: Map<string, Uint8Array>;
  dir: string;
  name: string;
}): Promise<number> => {
  await mkdir(dir, { recursive: true });
  let written = 0;
  for (const facing of FACINGS) {
    const frames = framesOf(entries, facing);
    if (frames.length === 0) {
      throw new BadRequestError(`${name} has no ${facing} frames`);
    }
    for (const [index, frame] of frames.entries()) {
      await writeFile(path.join(dir, `${facing}-${index}.png`), frame);
      written += 1;
    }
  }
  return written;
};

/**
 * A character's walk frames, laid out the way the period build reads them.
 * The archive holds one directory per state, the animations under it.
 */
export const fetchCharacter = async ({
  id,
  name,
  dir,
  log = () => {},
}: FetchOptions): Promise<void> => {
  const entries = readZip(
    await download(`${ENDPOINT}/characters/${id}/download`),
  );
  const written = await writeFrames({
    entries,
    dir: path.join(dir, name, "walk"),
    name,
  });
  log(`${name}  ${written} frames  ← ${id}`);
};

const FETCH: Record<FetchKind, (options: FetchOptions) => Promise<void>> = {
  tileset: fetchTileset,
  object: fetchObject,
  character: fetchCharacter,
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../../../..");
  const args = process.argv.slice(2);
  const take = (flag: string): string | undefined => {
    const at = args.indexOf(`--${flag}`);
    if (at === -1) return undefined;
    // an empty value is a value: `--dir ""` is the root of the raw tree
    const value = args[at + 1];
    if (value === undefined) {
      throw new BadRequestError(`--${flag} needs a value`);
    }
    args.splice(at, 2);
    return value;
  };
  const kind = (take("kind") ?? "tileset") as FetchKind;
  if (!FETCH[kind]) throw new BadRequestError(`"${kind}" is not a fetch kind`);
  const dir = path.join(
    repo,
    "var/assets/pixellab",
    take("dir") ?? DEFAULT_DIR[kind],
  );
  if (!args.length) {
    throw new BadRequestError("name=<id> pairs are required");
  }
  for (const pair of args) {
    const [name, id] = pair.split("=");
    if (!name || !id) throw new BadRequestError(`"${pair}" is not name=id`);
    await FETCH[kind]({ id, name, dir, log: (line) => console.log(line) });
  }
}
