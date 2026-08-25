import type { StageArchetype } from "../lib/types";
import { ARCHETYPE_SPRITES } from "./catalog";
import type { StageAsset, StageManifest, StageManifestFile } from "./manifest";

export const STAGE_BASE = "/stage";

const resolveFile = (
  file: StageManifestFile,
  source: "vendor" | "fallback",
): Record<string, StageAsset> =>
  Object.fromEntries(
    Object.entries(file.assets).map(([id, entry]) => [
      id,
      { ...entry, id, source, url: `${STAGE_BASE}/${source}/${entry.file}` },
    ]),
  );

const fetchManifest = async (
  source: "vendor" | "fallback",
  fetcher: typeof fetch,
): Promise<StageManifestFile | null> => {
  const response = await fetcher(`${STAGE_BASE}/${source}/${source}.json`);
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return null;
  return (await response.json()) as StageManifestFile;
};

/**
 * Loads the fallback manifest (always present) and, when the vendor step has
 * run, the vendor manifest over it: a vendor asset replaces the fallback
 * asset of the same id, and every id the fallback covers stays resolvable.
 */
export const loadStageManifest = async (
  fetcher: typeof fetch = fetch,
): Promise<StageManifest> => {
  const fallback = await fetchManifest("fallback", fetcher);
  if (!fallback) {
    throw new Error(
      "stage: the fallback manifest is missing (run `npm run stage:fallback`)",
    );
  }
  const vendor = await fetchManifest("vendor", fetcher);
  return {
    assets: {
      ...resolveFile(fallback, "fallback"),
      ...(vendor ? resolveFile(vendor, "vendor") : {}),
    },
    vendor: vendor !== null,
  };
};

/** The first sprite asset on record for an archetype, in catalog preference order. */
export const spriteFor = (
  manifest: StageManifest,
  archetype: StageArchetype,
): StageAsset | undefined => {
  for (const id of ARCHETYPE_SPRITES[archetype]) {
    const asset = manifest.assets[id];
    if (asset?.kind === "sprite") return asset;
  }
  return undefined;
};
