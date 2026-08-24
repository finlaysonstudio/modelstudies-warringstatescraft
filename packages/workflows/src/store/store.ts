/**
 * Store — minimal persistence seam mirroring the upstream entity verbs
 * (create/get/update are full puts; queryByScope filters children).
 * FileStore keeps one JSON file per entity under root/<model>/<id>.json.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface Entity {
  id: string;
  /** entity type name, e.g. "interview" | "probe" | "runs" */
  model: string;
  scope?: string;
  [key: string]: unknown;
}

/** minimal structural constraint so typed entities need no index signature */
export interface EntityLike {
  id: string;
  model: string;
  scope?: string;
}

export interface Store {
  create<T extends EntityLike>(entity: T): Promise<T>;
  get<T extends EntityLike>(model: string, id: string): Promise<T | undefined>;
  queryByScope<T extends EntityLike>(
    model: string,
    scope: string,
  ): Promise<T[]>;
  update<T extends EntityLike>(entity: T): Promise<T>;
}

export const calculateScope = (parent: EntityLike | string): string =>
  typeof parent === "string" ? parent : parent.id;

const safeName = (id: string) => id.replaceAll("/", "__");

export class FileStore implements Store {
  constructor(private readonly root: string) {}

  private dir(model: string) {
    return join(this.root, model);
  }

  private path(model: string, id: string) {
    return join(this.dir(model), `${safeName(id)}.json`);
  }

  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }

  async get<T extends EntityLike>(
    model: string,
    id: string,
  ): Promise<T | undefined> {
    try {
      const raw = await readFile(this.path(model, id), "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async list<T extends EntityLike>(model: string): Promise<T[]> {
    try {
      const files = await readdir(this.dir(model));
      const entities: T[] = [];
      for (const file of files.filter((name) => name.endsWith(".json"))) {
        const raw = await readFile(join(this.dir(model), file), "utf8");
        entities.push(JSON.parse(raw) as T);
      }
      return entities;
    } catch {
      return [];
    }
  }

  async queryByScope<T extends EntityLike>(
    model: string,
    scope: string,
  ): Promise<T[]> {
    const all = await this.list<T>(model);
    return all.filter((entity) => entity.scope === scope);
  }

  // Atomic replace: the JSON lands in a sibling temp file and is renamed
  // over the entity, so a reader (or a crash) sees the old file or the new
  // one, never a truncated one. `list` filters on `.json`, which the temp
  // name does not end in.
  async update<T extends EntityLike>(entity: T): Promise<T> {
    await mkdir(this.dir(entity.model), { recursive: true });
    const target = this.path(entity.model, entity.id);
    const temp = `${target}.${randomUUID().slice(0, 8)}.tmp`;
    await writeFile(temp, JSON.stringify(entity, null, 2));
    await rename(temp, target);
    return entity;
  }
}
