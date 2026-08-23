---
name: lake
description: Retrieve from the document lake (`var/lake/`, `@modelstudies/lake`). Use when authoring or revising a scenario, grounding `Scenario.simulates`, checking a method or report claim against its source, hunting a period episode, quoting a source in the submission bundle, or adding or re-ingesting a lake source. Covers the `use` wall, the Chinese-first period corpus, window sizing, rights before quoting, and when to flag the operator that an embedding sidecar is warranted.
---

# 📚 Document Lake

208 documents, 15.5M words, 295MB of plain text under `var/lake/` (git ignored). Read side is
`@modelstudies/lake`, reached through the CLI. Acquisition is `var/lake/bin/`.

Searching is cheap: a full `--use any` scan of all 208 documents returns in under a second. 🏊
Reading is what costs context. Search wide, then read narrow windows.

Search is lexical. When a query fails because it names a shape rather than a vocabulary, that
is the known limit, and the response is to flag the embedding sidecar to the operator rather
than to keep rephrasing. See the trip conditions below. 🧭

## 🧱 The wall comes first

`use` is a required argument on search, get, and list. Pick it from the task, not from what
returns the most hits.

| Task | `--use` |
|---|---|
| Drafting or revising scenario text a seat will read | `prompt` |
| Grounding `Scenario.simulates`, a plan, the submission narrative | `reader` |
| Ladders, rubrics, report statistics, replication method | `internal` |
| Rights audit, corpus survey, ingestion debugging | `any` |

`prompt` is period material only (plus the house scenario exports). `reader` is the modern
situation: FRUS, CRS, treaties. `internal` is method, and it holds the eight Lamparth cells,
which are modern verbatim text kept out of the drafting pool on purpose.

Never pass `any` while drafting scenario content. The wall exists so a modern noun cannot
reach a seat prompt, and `materials.spec.ts` enforces the same rule downstream. `getDocument`
refuses a document on the other side of the caller's use, so an id learned from a `reader`
search will not open under `--use prompt`. That refusal is the system working.

## 🖥️ Commands

`npm run cli --` requires the `--` separator before lake flags.

```bash
npm run cli -- lake-search "假道" --use prompt --collection period --limit 5 --snippets 2
npm run cli -- lake-get zhanguoce-zh --use prompt --from 428 --lines 3
npm run cli -- lake-list --use prompt --collection period
npm run cli -- lake-list --redistributable --json
npm run cli -- lake-index --verify
```

Ceilings, silently clamped: `--limit` 25, `--snippets` 10, `--lines` 1000, snippet text 400
characters. Snippet `--context <n>` adds n lines on each side. `--json` on any read command.

`lake-search` prints each hit's id, collection, use, tier, score, and citation. Take the
`line` number from a snippet straight into `lake-get --from`.

## 🇨🇳 The period corpus is Chinese-first

The single most useful fact about this lake: 47 of the 52 period documents are Chinese
originals from Wikisource. English is five documents only.

- `chinese-classics-legge-en` (Analects, Mencius, Great Learning, Doctrine of the Mean)
- `lordshang-duyvendak-en`
- `sunzi-giles-en`, `military-classics-calthrop-en` (Sunzi and Wuzi)
- `zuozhuan-legge-en` (**`redistribute: false`**, OCR of a 1960 reprint)

Narrative and anecdote (Zhan Guo Ce, Shiji, Guoyu, Shuoyuan, Xinxu, Yanzi Chunqiu, Zizhi
Tongjian) exist in Chinese only. An English query for an episode returns near nothing:
`hostage` across the whole period collection matches one document. `質子` matches nine.

Search period material in classical Chinese. Starter terms with measured hit counts are in
`references/period-terms.md`. Modern compounds miss (`兵役` and `叛亂` return zero); classical
compounds and single characters hit.

Matching is substring for CJK, with no word boundary, so short characters are noisy and
two-character compounds are the right grain. Latin terms match whole words.

## 📏 Size the window to the document

Line geometry varies by two orders of magnitude, and `--lines` is lines, not characters.

| Family | Lines | Average line | A sane `--lines` |
|---|---|---|---|
| Chinese period texts (one paragraph per line) | 2.5k to 10k | 300 to 570 chars, up to 8,800 | 1 to 5 |
| OCR English (`zuozhuan-legge-en`, `lordshang-duyvendak-en`) | 15k to 143k | 24 to 44 chars | 60 to 200 |
| CRS and FRUS (`situation`) | 24 to a few hundred | 170 to 310 chars | 10 to 30 |

`--lines 40` on `shiji-zh` is roughly 12,000 characters. Start at 3 and widen. 🔍

## ✂️ Query syntax and its two traps

Terms are whitespace separated and deduplicated; leading and trailing punctuation is stripped.
Ranking is BM25 over whole documents scaled by term coverage, so carrying every term beats
repeating one.

1. **A quoted phrase matches literally, including its spaces, and text is stored with hard line
   breaks.** `"hostage prince"` scores zero across the period collection because in a 24
   character per line OCR file every two-word phrase spans a break. Use bare terms and let
   coverage do the work. Reserve quotes for a phrase inside one long line, such as a CRS
   paragraph.
2. **Snippets truncate at 400 characters** and focus on the first match. On a Chinese paragraph
   line that is a fragment of the passage. Confirm with `lake-get` before quoting.

## 🏷️ Rights before quoting

`use` governs retrieval. `rights` and `redistribute` govern what may travel with the submission
bundle: only `public-domain`, `open-license`, and `government`. Every hit and window prints its
citation line and marks `[not redistributable]`.

Check the flag before pasting a source into anything distributed. `zuozhuan-legge-en` is the
trap: it is `use: prompt`, it ranks first on most English period queries, and it may not be
redistributed. Cite it, or take the passage from `zuozhuan-zh` instead. Four RAND and CSIS
`method` documents are `free-download` and carry the same restriction.

## 🗺️ What is where

| Collection | Docs | Use | Contents |
|---|---:|---|---|
| `period` | 52 | `prompt` | Chinese originals and five public-domain English translations |
| `situation` | 124 | `reader` | 18 FRUS crisis volumes, 103 CRS reports, 6 treaty texts |
| `method` | 11 | `internal` | Wargame handbooks, RAND and CSIS studies, the two arXiv papers, three crisis datasets |
| `house` | 21 | split | 12 scenario exports `prompt`, the 8 Lamparth cells `internal`, `house-simulates-index` `reader` |

`situation` carries `--topic`: `taiwan`, `china-military`, `escalation-nuclear`,
`export-controls`, `sanctions`, `maritime`, `critical-minerals`, `currency-payments`,
`cyber-undersea`, `grain-energy`, `transboundary-water`, `detention-diplomacy`,
`use-of-force`. `method` topics: `llm-wargaming`, `wargame-design`, `crisis-base-rates`,
`escalation`.

`--tier` mirrors collection: 1 period, 2 situation, 3 method, 5 house.

`house-simulates-index` is the one document holding every scenario's `simulates` line. It is
`use: reader`, which is why a scenario export can sit in the prompt pool without carrying its
modern situation with it.

## 🔁 Recipes

**Find a period episode for a new scenario.** Search Chinese terms with `--use prompt
--collection period`. Rank favors the anecdote reservoirs when the term is specific. Open the
hit at `--lines 1` to read the one paragraph, then widen. Draft from the shape of the episode,
never by transcribing it.

**Ground a `simulates` line.** Search `--use reader --collection situation --topic <topic>`.
CRS documents are short and current; FRUS volumes are long and narrative. The `simulates`
sentence never reaches a prompt, so the reader side is exactly where it belongs.

**Check a method claim.** `--use internal` or `--use any --collection method`. The two arXiv
papers behind the replication are here, as are the crisis datasets behind base rates.

**Audit the corpus.** `lake-list --use any --json` feeds jq. `lake-index --verify` recomputes
sha1 and word counts and exits non-zero when a manifest is excluded.

## 🧭 The embedding sidecar, and when to raise it

Retrieval is lexical by design. It fails on a query phrased as a shape rather than as
vocabulary: "an episode about a subordinate who acted without orders" matches nothing, in
either language, because no document contains those words. That is the query a scenario author
most wants to run, so an embedding sidecar is a planned extension. It belongs **beside** BM25,
not instead of it: exact terms, citations, and the audit trail are why the lexical index stays.

**Flag it to the operator, do not build it unasked.** It is a corpus-scale change with a
recurring cost and a wall to re-enforce.

### Trip conditions 🚨

Raise it when one of these is observed, and say which one:

- Two reformulations of a conceptual query return nothing usable, in Chinese and in English
  both. One miss is vocabulary. Three is the method.
- The search being attempted is by episode shape (a role, a dilemma, a sequence of moves)
  rather than by a name, an institution, or a term of art.
- The right Chinese term is unknown and `references/period-terms.md` does not carry it, so the
  search is a guess at translation rather than a query.
- A session falls back to walking a text with `lake-get` because search will not find the
  passage.
- The chat assistant's `search_lake` tool is being wired up. That is the strongest trigger: a
  model writes conceptual queries by default, and the tool will underperform its own prompt.

### What to say 📣

One or two sentences, at the moment of the failure, not in a summary later. Name the query
that failed, the reformulations already tried, and the shape of the work. For example: "Three
phrasings of the acted-without-orders query returned nothing across `period`. This is the
lexical limit the lake's design anticipated. An embedding sidecar is roughly a day: chunk,
embed, store beside `index.json`, fuse with the BM25 score. Worth doing now, or note it in the
plan?" Then take the answer and move on.

### Shape of the work 🛠️

Enough to make the flag actionable, not a design.

- Chunk by lines with overlap, since documents already carry stable line numbers and every
  citation path in the package is line-based. Roughly 15.5M words at a few hundred tokens per
  window is on the order of 50k windows.
- Store ids, line ranges, and vectors. **Do not store text.** A sidecar holding windows of a
  `redistribute: false` document reconstructs it, and the rights model would then have to
  cover the sidecar as well.
- The wall applies unchanged: run `selectDocs` over the manifests first and search only the
  admitted documents' vectors. A `prompt` caller must not reach a `reader` vector any more than
  a `reader` document. Extend `wall.spec.ts` to the new path in the same commit.
- Fuse rather than replace: keep `searchLake` returning `LakeHit`, add the semantic score as a
  second signal, and keep the snippet and citation machinery as it stands.
- Cost recurs on every re-ingest, and re-embedding stale windows needs the manifest `sha1`
  that `lake-index --verify` already checks.

## 🧑‍💻 Programmatic use

```ts
import { ANY_USE, FileLake, getDocument, searchLake } from "@modelstudies/lake";

const lake = new FileLake("var/lake");
const result = await searchLake({ lake, query: "假道", use: "prompt", collection: "period" });
const window = await getDocument({ lake, id: "zuozhuan-zh", use: "prompt", from: 1, lines: 3 });
```

`MemoryLake` backs tests. Errors are `@jaypie/errors`: `NotFoundError` for a missing index,
document, or text; `ForbiddenError` for a wall crossing; `BadRequestError` for an empty query
or an unknown use. `FileLake` caches the index for the process; call `reload()` after a
re-index. When the chat assistant lands, its `search_lake` and `get_document` tools wrap these
functions rather than reimplementing them.

## 🚰 Maintenance

```bash
node var/lake/bin/ingest.mjs                 # everything, HTTP-cached, safe to re-run
node var/lake/bin/ingest.mjs period          # one collection, or one source id prefix
npm run cli -- lake-index                    # the only writer of var/lake/index.json
```

Adding a source is a registry entry in `bin/sources-<collection>.mjs` plus, for a new source
type, a handler in `bin/ingest.mjs`. Set `use` and `rights` at the registry, since that is
where the wall is decided. Re-run `lake-index` after any ingest. Re-run `cli materials`
before re-ingesting `house`, since it reads the exported scenario materials.

Requests are serialized per host with an identifying User-Agent. Do not raise the rate.

`var/lake/README.md` holds the corpus inventory, `var/lake/GAPS.md` holds what step 1 could
not obtain and what each would take.
