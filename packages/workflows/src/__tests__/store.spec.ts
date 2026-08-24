import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calculateScope, FileStore, type Entity } from "../store/store";

interface Probe extends Entity {
  value: number;
}

let root: string;
let store: FileStore;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "workflows-store-"));
  store = new FileStore(root);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("FileStore", () => {
  it("round-trips an entity through create and get", async () => {
    const entity: Probe = { id: "probe-1", model: "probe", value: 7 };
    const created = await store.create(entity);
    expect(created).toEqual(entity);
    const found = await store.get<Probe>("probe", "probe-1");
    expect(found).toEqual(entity);
  });

  it("returns undefined for a missing entity", async () => {
    expect(await store.get("probe", "missing")).toBeUndefined();
  });

  it("updates an entity in place", async () => {
    await store.create({ id: "probe-1", model: "probe", value: 7 });
    await store.update({ id: "probe-1", model: "probe", value: 9 });
    const found = await store.get<Probe>("probe", "probe-1");
    expect(found?.value).toBe(9);
  });

  it("queries children by scope", async () => {
    const parent: Entity = { id: "run-1", model: "run" };
    const scope = calculateScope(parent);
    await store.create({ id: "probe-1", model: "probe", scope, value: 1 });
    await store.create({ id: "probe-2", model: "probe", scope, value: 2 });
    await store.create({
      id: "probe-3",
      model: "probe",
      scope: "other",
      value: 3,
    });
    const children = await store.queryByScope<Probe>("probe", scope);
    expect(children.map((child) => child.id).sort()).toEqual([
      "probe-1",
      "probe-2",
    ]);
  });
});

describe("FileStore durability", () => {
  it("replaces the file atomically and leaves no temp file behind", async () => {
    const { readdir, readFile } = await import("node:fs/promises");
    await store.create({ id: "probe-1", model: "probe", value: 1 });
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.update({ id: "probe-1", model: "probe", value: index }),
      ),
    );
    const files = await readdir(join(root, "probe"));
    expect(files).toEqual(["probe-1.json"]);
    const raw = await readFile(join(root, "probe", "probe-1.json"), "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
    expect(await store.list("probe")).toHaveLength(1);
  });
});
