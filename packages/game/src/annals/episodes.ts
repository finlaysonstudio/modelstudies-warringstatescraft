/**
 * The register of episodes. Registration order is chronicle order and is
 * what `Episode.order` records, so the timeline, the continuous cut, and
 * `worldAt` all read the same sequence.
 */
import { NotFoundError } from "@jaypie/errors";

import { buildEpisode } from "./build";
import { PARTITION } from "./episodes/partition";
import { REFORMERS } from "./episodes/reformers";
import { KINGS } from "./episodes/kings";
import { LEDGER } from "./episodes/ledger";
import { UNIFICATION } from "./episodes/unification";
import type { Episode, EpisodeSpec } from "./types";

export const EPISODE_SPECS: EpisodeSpec[] = [
  ...PARTITION,
  ...REFORMERS,
  ...KINGS,
  ...LEDGER,
  ...UNIFICATION,
];

const cache = new Map<string, Episode>();

const orderOf = (id: string): number =>
  EPISODE_SPECS.findIndex((spec) => spec.id === id);

/** one episode, built and cached */
export const getEpisode = (id: string): Episode => {
  const cached = cache.get(id);
  if (cached) return cached;
  const index = orderOf(id);
  if (index === -1) throw new NotFoundError(`Unknown episode: ${id}`);
  const episode = { ...buildEpisode(EPISODE_SPECS[index]), order: index };
  cache.set(id, episode);
  return episode;
};

/** every episode, in chronicle order */
export const listEpisodes = (): Episode[] =>
  EPISODE_SPECS.map((spec) => getEpisode(spec.id));

export const episodeIds = (): string[] => EPISODE_SPECS.map((spec) => spec.id);

/** the episodes that anchor one bench chapter, in chronicle order */
export const episodesForChapter = (chapter: string): Episode[] =>
  listEpisodes().filter((episode) => episode.chapter === chapter);
