/**
 * Parser for an instrument written as markdown (`var/instruments/<id>.md`),
 * the source of truth a bank is emitted from. The format is the document's:
 * a `## 2. Protocol` section with the preamble (a blockquote after
 * `**Preamble`), `**Stem.** "…"`, and `**Probe.** "…"`; modules as
 * `### <Letter> · <title> · <n> items` followed by an optional
 * `Situation…:` paragraph; items as `### <id> · <title>` with statements
 * `1.` and `2.` and `construct:` / `design:` / `game:` lines; and a crux
 * subset named in a `## … Crux` section as a comma list ending in a period.
 * An optional `## … Renderings` section carries the arms' text: the
 * priorities line, the majority line, the zh preamble, stem, and probe, and
 * per-item renderings as `### <id> · <rendering>` blocks (an optional
 * `Situation:` line, then statements `1.` and `2.`). Shared by the emitter
 * (`scripts/emit-instrument.ts`) and the spec that holds the emitted bank
 * to the document.
 */
import { BadRequestError } from "@jaypie/errors";

export interface MarkdownItem {
  id: string;
  title: string;
  statements: [string, string];
  construct: string;
  design?: string;
  game?: string;
}

export interface MarkdownModule {
  id: string;
  title: string;
  /** the situation every item in the module states, when the module has one */
  situation?: string;
  items: MarkdownItem[];
}

/** one item as an arm renders it */
export interface MarkdownRendering {
  situation?: string;
  statements: [string, string];
}

/** the arms' text, from the `## … Renderings` section */
export interface MarkdownArms {
  /** prepended to the preamble in the priorities arm */
  priorities: string;
  /** appended after the courses in the informed arm; `{course}` is the course named */
  majority: string;
  zh: { preamble: string; stem: string; probe: string };
  /** item id → rendering id (`period`, `modern`, `zh`) → text */
  renderings: Record<string, Record<string, MarkdownRendering>>;
}

export interface MarkdownInstrument {
  preamble: string;
  stem: string;
  probe: string;
  modules: MarkdownModule[];
  crux: string[];
  /** present when the document carries a Renderings section */
  arms?: MarkdownArms;
}

const MODULE_HEADING = /^### ([A-Z]) · (.+?) · (\d+) items?\s*$/;
const ITEM_HEADING = /^### ([a-z]\d+) · (.+?)\s*$/;
const STATEMENT = /^([12])\. (.+)$/;
const FIELD = /^(construct|design|game): (.+)$/;
const SITUATION = /^Situation[^:]*: (.+)$/;
const RENDERING_HEADING = /^### ([a-z]\d+) · ([a-z][a-z-]*)\s*$/;

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

export function parseInstrumentMarkdown(text: string): MarkdownInstrument {
  const lines = text.split("\n");
  const preambleAt = lines.findIndex((line) => line.startsWith("**Preamble"));
  const quote = lines
    .slice(preambleAt + 1)
    .find((line) => line.startsWith("> "));
  const stemLine = lines.find((line) => line.startsWith("**Stem.**"));
  const probeLine = lines.find((line) => line.startsWith("**Probe.**"));
  const quoted = (line: string | undefined, what: string): string => {
    const match = line?.match(/"(.+)"/);
    if (!match) throw new BadRequestError(`instrument markdown: no ${what}`);
    return match[1]!;
  };
  if (preambleAt < 0 || !quote) {
    throw new BadRequestError("instrument markdown: no preamble blockquote");
  }
  const preamble = quote.slice(2).trim();
  const stem = quoted(stemLine, "stem");
  const probe = quoted(probeLine, "probe");

  const modules: MarkdownModule[] = [];
  let module: MarkdownModule | undefined;
  let item:
    | (Omit<MarkdownItem, "statements"> & {
        statements: (string | undefined)[];
      })
    | undefined;
  let inModules = false;
  const closeItem = () => {
    if (!item) return;
    const [one, two] = item.statements;
    if (!one || !two || !item.construct) {
      throw new BadRequestError(
        `instrument markdown: item ${item.id} lacks two statements or a construct`,
      );
    }
    module!.items.push({ ...item, statements: [one, two] });
    item = undefined;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      closeItem();
      inModules = /^## \d+\. The modules/.test(line);
      if (!inModules) module = undefined;
      continue;
    }
    if (!inModules) continue;
    const moduleMatch = line.match(MODULE_HEADING);
    if (moduleMatch) {
      closeItem();
      module = { id: moduleMatch[1]!, title: moduleMatch[2]!, items: [] };
      modules.push(module);
      continue;
    }
    const itemMatch = line.match(ITEM_HEADING);
    if (itemMatch) {
      closeItem();
      if (!module) {
        throw new BadRequestError(
          `instrument markdown: item ${itemMatch[1]} precedes any module`,
        );
      }
      if (!itemMatch[1]!.startsWith(module.id.toLowerCase())) {
        throw new BadRequestError(
          `instrument markdown: item ${itemMatch[1]} is under module ${module.id}`,
        );
      }
      item = {
        id: itemMatch[1]!,
        title: itemMatch[2]!,
        statements: [],
        construct: "",
      };
      continue;
    }
    if (!module) continue;
    if (!item) {
      const situation = line.match(SITUATION);
      if (situation) module.situation = capitalize(situation[1]!.trim());
      continue;
    }
    const statement = line.match(STATEMENT);
    if (statement) {
      item.statements[Number(statement[1]) - 1] = statement[2]!.trim();
      continue;
    }
    const field = line.match(FIELD);
    if (field) {
      item[field[1] as "construct" | "design" | "game"] = field[2]!.trim();
    }
  }
  closeItem();

  const cruxAt = lines.findIndex((line) => /^## .*Crux/i.test(line));
  const cruxLine =
    cruxAt >= 0 ? lines.slice(cruxAt + 1).find((l) => l.trim()) : "";
  const cruxMatch = cruxLine?.match(/: ((?:[a-z]\d+, )+[a-z]\d+)\./);
  if (!cruxMatch) {
    throw new BadRequestError("instrument markdown: no crux subset list");
  }
  const crux = cruxMatch[1]!.split(",").map((s) => s.trim());
  const known = new Set(modules.flatMap((m) => m.items.map((i) => i.id)));
  const unknown = crux.filter((id) => !known.has(id));
  if (unknown.length) {
    throw new BadRequestError(
      `instrument markdown: crux names unknown items ${unknown.join(", ")}`,
    );
  }
  const arms = parseRenderings(lines, { known, crux });

  for (const entry of modules) {
    const declared = text.match(
      new RegExp(`^### ${entry.id} · .+? · (\\d+) items?`, "m"),
    );
    if (declared && Number(declared[1]) !== entry.items.length) {
      throw new BadRequestError(
        `instrument markdown: module ${entry.id} declares ${declared[1]} items and holds ${entry.items.length}`,
      );
    }
  }
  return { preamble, stem, probe, modules, crux, ...(arms ? { arms } : {}) };
}

// The Renderings section: the arms' lines, then one block per (item,
// rendering). Every crux item must carry every rendering the section uses,
// so an arm fielded on the crux never falls back to the bank's wording.
function parseRenderings(
  lines: string[],
  options: { known: Set<string>; crux: string[] },
): MarkdownArms | undefined {
  const { known, crux } = options;
  const at = lines.findIndex((line) => /^## .*Renderings/i.test(line));
  if (at < 0) return undefined;
  const end = lines.findIndex(
    (line, index) => index > at && line.startsWith("## "),
  );
  const section = lines.slice(at + 1, end < 0 ? undefined : end);
  const quoted = (prefix: string): string => {
    const line = section.find((entry) => entry.startsWith(prefix));
    const match = line?.match(/"(.+)"/);
    if (!match) {
      throw new BadRequestError(`instrument markdown: no ${prefix} line`);
    }
    return match[1]!;
  };
  const preambleAt = section.findIndex((line) =>
    line.startsWith("**Preamble (zh)"),
  );
  const zhQuote =
    preambleAt >= 0
      ? section.slice(preambleAt + 1).find((line) => line.startsWith("> "))
      : undefined;
  if (!zhQuote) {
    throw new BadRequestError("instrument markdown: no zh preamble blockquote");
  }
  const majority = quoted("**Majority.**");
  if (!majority.includes("{course}")) {
    throw new BadRequestError(
      "instrument markdown: the majority line must carry {course}",
    );
  }
  const arms: MarkdownArms = {
    priorities: quoted("**Priorities.**"),
    majority,
    zh: {
      preamble: zhQuote.slice(2).trim(),
      stem: quoted("**Stem (zh).**"),
      probe: quoted("**Probe (zh).**"),
    },
    renderings: {},
  };
  let current:
    | {
        id: string;
        rendering: string;
        situation?: string;
        statements: (string | undefined)[];
      }
    | undefined;
  const close = () => {
    if (!current) return;
    const [one, two] = current.statements;
    if (!one || !two) {
      throw new BadRequestError(
        `instrument markdown: rendering ${current.id} · ${current.rendering} lacks two statements`,
      );
    }
    const byRendering = (arms.renderings[current.id] ??= {});
    if (byRendering[current.rendering]) {
      throw new BadRequestError(
        `instrument markdown: rendering ${current.id} · ${current.rendering} appears twice`,
      );
    }
    byRendering[current.rendering] = {
      ...(current.situation ? { situation: current.situation } : {}),
      statements: [one, two],
    };
    current = undefined;
  };
  for (const raw of section) {
    const line = raw.trimEnd();
    const heading = line.match(RENDERING_HEADING);
    if (heading) {
      close();
      if (!known.has(heading[1]!)) {
        throw new BadRequestError(
          `instrument markdown: rendering names unknown item ${heading[1]}`,
        );
      }
      current = { id: heading[1]!, rendering: heading[2]!, statements: [] };
      continue;
    }
    if (!current) continue;
    const situation = line.match(SITUATION);
    if (situation) {
      current.situation = capitalize(situation[1]!.trim());
      continue;
    }
    const statement = line.match(STATEMENT);
    if (statement) {
      current.statements[Number(statement[1]) - 1] = statement[2]!.trim();
    }
  }
  close();
  const ids = new Set(
    Object.values(arms.renderings).flatMap((entry) => Object.keys(entry)),
  );
  for (const id of crux) {
    for (const rendering of ids) {
      if (!arms.renderings[id]?.[rendering]) {
        throw new BadRequestError(
          `instrument markdown: crux item ${id} lacks the ${rendering} rendering`,
        );
      }
    }
  }
  return arms;
}
