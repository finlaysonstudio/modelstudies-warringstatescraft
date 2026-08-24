/**
 * Journal — the append-only seam beside {@link Store}. A store holds an
 * entity as a full put; a journal holds the events that produced it, one
 * JSON line per event, appended before anything else happens with the
 * result. An entity is a checkpoint derived from its journal, never the other
 * way round, so a resume folds the journal and asks only for what it lacks.
 *
 * FileJournal keeps `root/<model>/<id>.jsonl` beside FileStore's
 * `root/<model>/<id>.json`; FileStore lists `.json` only, so the journal is
 * invisible to it and to anything serving the store's files.
 */
import { InternalError } from "@jaypie/errors";
import { appendFile, mkdir, open, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export interface JournalEvent {
  /** event type */
  t: string;
  /** ISO timestamp */
  at: string;
  [key: string]: unknown;
}

export interface JournalRead<T extends JournalEvent> {
  events: T[];
  /**
   * Fragments that are not events: the write a crash interrupted, either as
   * the trailing text without its newline or, once a later append has moved
   * on to a fresh line, as a line that does not parse. Dropped from `events`
   * and kept here, in order, so a caller can report them.
   */
  torn?: string[];
}

export interface Journal {
  append(model: string, id: string, event: JournalEvent): Promise<void>;
  read<T extends JournalEvent>(
    model: string,
    id: string,
  ): Promise<JournalRead<T>>;
  exists(model: string, id: string): Promise<boolean>;
}

/**
 * Parse newline-delimited JSON. A line that does not parse, or a tail
 * without its newline, is the write a crash interrupted: it is dropped and
 * reported as `torn`, never read as a shorter event. A parsed line that is
 * not an event object is corruption of another kind and throws.
 */
export function parseJournal<T extends JournalEvent>(
  raw: string,
  options: { name?: string } = {},
): JournalRead<T> {
  const name = options.name ?? "journal";
  const events: T[] = [];
  const torn: string[] = [];
  let start = 0;
  let line = 0;
  for (;;) {
    const end = raw.indexOf("\n", start);
    if (end === -1) break;
    line += 1;
    const text = raw.slice(start, end);
    start = end + 1;
    if (text.trim() === "") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      torn.push(text);
      continue;
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new InternalError(`${name}: line ${line} is not an event`);
    }
    events.push(parsed as T);
  }
  const tail = raw.slice(start);
  if (tail.trim() !== "") torn.push(tail);
  return torn.length ? { events, torn } : { events };
}

const safeName = (id: string) => id.replaceAll("/", "__");

export class FileJournal implements Journal {
  /** journals this process has already checked for a torn tail */
  private readonly healed = new Set<string>();

  constructor(private readonly root: string) {}

  path(model: string, id: string): string {
    return join(this.root, model, `${safeName(id)}.jsonl`);
  }

  // The first append to a journal in this process looks at its last byte: a
  // file a crash left mid-line gets a newline first, so the fragment stays a
  // line of its own (reported as torn) and the new event starts clean.
  private async heal(path: string): Promise<void> {
    if (this.healed.has(path)) return;
    this.healed.add(path);
    let size: number;
    try {
      ({ size } = await stat(path));
    } catch {
      return;
    }
    if (size === 0) return;
    const handle = await open(path, "r");
    try {
      const { buffer } = await handle.read(Buffer.alloc(1), 0, 1, size - 1);
      if (buffer[0] !== 0x0a) await appendFile(path, "\n", { flag: "a" });
    } finally {
      await handle.close();
    }
  }

  async append(model: string, id: string, event: JournalEvent): Promise<void> {
    await mkdir(join(this.root, model), { recursive: true });
    const path = this.path(model, id);
    await this.heal(path);
    // One write of one line on an O_APPEND descriptor: it lands whole or, if
    // the process dies mid-write, as a fragment `read` recognizes as torn.
    await appendFile(path, `${JSON.stringify(event)}\n`, { flag: "a" });
  }

  async read<T extends JournalEvent>(
    model: string,
    id: string,
  ): Promise<JournalRead<T>> {
    let raw: string;
    try {
      raw = await readFile(this.path(model, id), "utf8");
    } catch {
      return { events: [] };
    }
    return parseJournal<T>(raw, { name: `${model}/${id}` });
  }

  async exists(model: string, id: string): Promise<boolean> {
    try {
      await stat(this.path(model, id));
      return true;
    } catch {
      return false;
    }
  }
}

/** In-memory journal for tests: the same contract, lines kept as strings. */
export class MemoryJournal implements Journal {
  lines = new Map<string, string[]>();
  /** a fragment after the last complete line, per journal (see `tear`) */
  fragments = new Map<string, string>();

  private key(model: string, id: string) {
    return `${model}:${id}`;
  }

  async append(model: string, id: string, event: JournalEvent): Promise<void> {
    const key = this.key(model, id);
    const list = this.lines.get(key) ?? [];
    list.push(JSON.stringify(event));
    this.lines.set(key, list);
    // a real file keeps the fragment in front of the new line; `read` would
    // then refuse it as a bad middle line, exactly as FileJournal would
    const fragment = this.fragments.get(key);
    if (fragment !== undefined) {
      this.fragments.delete(key);
      list.splice(list.length - 1, 0, fragment);
    }
  }

  async read<T extends JournalEvent>(
    model: string,
    id: string,
  ): Promise<JournalRead<T>> {
    const key = this.key(model, id);
    const list = this.lines.get(key);
    if (!list) return { events: [] };
    const body = list.map((line) => `${line}\n`).join("");
    return parseJournal<T>(body + (this.fragments.get(key) ?? ""), {
      name: `${model}/${id}`,
    });
  }

  async exists(model: string, id: string): Promise<boolean> {
    return this.lines.has(this.key(model, id));
  }

  /** Simulate a crash mid-write: the last line loses its tail and newline. */
  tear(model: string, id: string): void {
    const key = this.key(model, id);
    const list = this.lines.get(key);
    if (!list?.length) return;
    const last = list.pop()!;
    this.fragments.set(
      key,
      last.slice(0, Math.max(1, Math.floor(last.length / 2))),
    );
  }
}
