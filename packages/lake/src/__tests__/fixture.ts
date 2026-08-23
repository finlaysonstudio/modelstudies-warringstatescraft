/**
 * A small lake on disk: five documents across four collections, with one
 * document on each side of the wall. Every spec builds its own copy under a
 * temp root and indexes it through the real builder.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildLakeIndex, countWords, sha1 } from "../indexer";
import { FileLake } from "../lake";
import type { LakeManifest } from "../types";

export interface FixtureDocument {
  manifest: Omit<LakeManifest, "bytes" | "words" | "sha1" | "acquiredAt"> &
    Partial<Pick<LakeManifest, "bytes" | "words" | "sha1" | "acquiredAt">>;
  text: string;
}

export const ZHAN_GUO_CE = [
  "The King of Qin held the prince of Zhao as a hostage in the western capital.",
  "The envoy said: a hostage is a promise written in a person.",
  "",
  "When the hostage prince was returned, the covenant held for nine years.",
].join("\n");

export const ZUO_ZHUAN = [
  "The prince of Jin swore the covenant at the altar.",
  "The prince rode out; the prince returned; the prince was buried in autumn.",
  "A covenant broken in spring is answered in summer.",
].join("\n");

export const CRS_TAIWAN = [
  "Congressional Research Service report on Taiwan and the hostage question.",
  "A prince is not a party to a modern detention dispute.",
].join("\n");

export const RAND_ESCALATION = [
  "Escalation ladders in crisis wargaming, with rungs for a hostage seizure.",
].join("\n");

export const HOUSE_SIMULATES = [
  "hostage-prince\tThe Hostage Prince",
  "  Detention diplomacy: a citizen held as leverage in a bilateral dispute.",
].join("\n");

export const FIXTURE_DOCUMENTS: FixtureDocument[] = [
  {
    manifest: {
      id: "zhan-guo-ce",
      title: "Zhan Guo Ce (Intrigues of the Warring States)",
      collection: "period",
      tier: 1,
      use: "prompt",
      rights: "public-domain",
      redistribute: true,
      citation: "Zhan Guo Ce. Wikisource. Public domain.",
      sourceUrl: "https://zh.wikisource.org/wiki/戰國策",
      language: "en",
    },
    text: ZHAN_GUO_CE,
  },
  {
    manifest: {
      id: "zuo-zhuan-legge",
      title: "Zuo Zhuan (Legge)",
      collection: "period",
      tier: 1,
      use: "prompt",
      rights: "public-domain",
      redistribute: false,
      citation: "Legge, James, trans. The Ch'un Ts'ew with the Tso Chuen.",
      language: "en",
    },
    text: ZUO_ZHUAN,
  },
  {
    manifest: {
      id: "crs-taiwan-hostage",
      title: "CRS: Taiwan and detention diplomacy",
      collection: "situation",
      tier: 2,
      use: "reader",
      rights: "government",
      redistribute: true,
      topic: "taiwan",
      language: "en",
    },
    text: CRS_TAIWAN,
  },
  {
    manifest: {
      id: "rand-escalation",
      title: "RAND: escalation ladders",
      collection: "method",
      tier: 3,
      use: "internal",
      rights: "free-download",
      redistribute: false,
      topic: "escalation",
      language: "en",
    },
    text: RAND_ESCALATION,
  },
  {
    manifest: {
      id: "house-simulates",
      title: "House: scenario simulates index",
      collection: "house",
      tier: 5,
      use: "reader",
      rights: "public-domain",
      redistribute: true,
      language: "en",
    },
    text: HOUSE_SIMULATES,
  },
];

export const writeFixtureDocument = async (
  root: string,
  { manifest, text }: FixtureDocument,
): Promise<void> => {
  const dir = join(root, manifest.collection);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${manifest.id}.txt`), `${text}\n`, "utf8");
  const full: LakeManifest = {
    bytes: Buffer.byteLength(text, "utf8"),
    words: countWords(text),
    sha1: sha1(text),
    acquiredAt: "2026-08-22",
    ...manifest,
  } as LakeManifest;
  await writeFile(
    join(dir, `${manifest.id}.json`),
    `${JSON.stringify(full, null, 2)}\n`,
    "utf8",
  );
};

export const createFixtureLake = async (
  documents: FixtureDocument[] = FIXTURE_DOCUMENTS,
): Promise<{ root: string; lake: FileLake }> => {
  const root = await mkdtemp(join(tmpdir(), "lake-fixture-"));
  for (const document of documents) await writeFixtureDocument(root, document);
  await buildLakeIndex({ root });
  return { root, lake: new FileLake(root) };
};

export const removeFixtureLake = (root: string): Promise<void> =>
  rm(root, { recursive: true, force: true });
