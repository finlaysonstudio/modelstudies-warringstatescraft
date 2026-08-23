/**
 * Lake — read seam over the document corpus, mirroring the Store seam's shape
 * (an interface the callers depend on, one file-backed implementation, a
 * memory implementation in tests). Acquisition is not part of the seam: the
 * ingesters in `var/lake/bin/` write the tree, and this reads it.
 *
 * The lake is git-ignored, so an absent lake is an ordinary state rather than
 * a broken install. It fails loudly instead of returning nothing, because a
 * silently empty corpus reads as "the sources say nothing on this".
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NotFoundError } from "@jaypie/errors";

import type { LakeIndex, LakeManifest } from "./types";

export interface Lake {
  /** the built index; throws when the lake has never been indexed */
  index(): Promise<LakeIndex>;
  manifest(id: string): Promise<LakeManifest | undefined>;
  /** normalized plain text, or undefined when the index is ahead of the tree */
  text(id: string): Promise<string | undefined>;
}

export const INDEX_FILE = "index.json";

export class FileLake implements Lake {
  private cached: LakeIndex | undefined;
  private byId: Map<string, LakeManifest> | undefined;

  constructor(private readonly root: string) {}

  /** drop the cached index, for a process that outlives a re-index */
  reload(): void {
    this.cached = undefined;
    this.byId = undefined;
  }

  async index(): Promise<LakeIndex> {
    if (this.cached) return this.cached;
    const path = join(this.root, INDEX_FILE);
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch {
      throw new NotFoundError(
        `No lake index at ${path}. Ingest with \`node var/lake/bin/ingest.mjs\`, then build it with \`npm run cli lake-index\`.`,
      );
    }
    const index = JSON.parse(raw) as LakeIndex;
    this.cached = index;
    this.byId = new Map(index.docs.map((doc) => [doc.id, doc]));
    return index;
  }

  async manifest(id: string): Promise<LakeManifest | undefined> {
    await this.index();
    return this.byId?.get(id);
  }

  async text(id: string): Promise<string | undefined> {
    const manifest = await this.manifest(id);
    if (!manifest) return undefined;
    try {
      return await readFile(
        join(this.root, manifest.collection, `${id}.txt`),
        "utf8",
      );
    } catch {
      return undefined;
    }
  }
}

/** in-memory lake for tests and for callers holding documents already */
export class MemoryLake implements Lake {
  constructor(
    private readonly documents: { manifest: LakeManifest; text: string }[],
    private readonly built: LakeIndex,
  ) {}

  async index(): Promise<LakeIndex> {
    return this.built;
  }

  async manifest(id: string): Promise<LakeManifest | undefined> {
    return this.documents.find((doc) => doc.manifest.id === id)?.manifest;
  }

  async text(id: string): Promise<string | undefined> {
    return this.documents.find((doc) => doc.manifest.id === id)?.text;
  }
}
