/**
 * The Annals of the Warring States: about fifty staged episodes covering the
 * turning points of the period, authored rather than derived, played on the
 * same overworld the recorded games play on.
 *
 * The Annals are an educational exhibit and are separate from the bench.
 * Nothing here is played, scored, or elicited; nothing here reaches a model;
 * and nothing under `scenario/` imports from this module (`wall.spec.ts`).
 */
export type {
  Act,
  ActId,
  Episode,
  EpisodeSpec,
  Localized,
  SceneSpec,
  WorldChange,
} from "./types";
export { AUTHORED_ACTOR } from "./types";
export { ACTS, ACTS_BY_ID, actOf } from "./acts";
export { act, buildEpisode } from "./build";
export {
  EPISODE_SPECS,
  episodeIds,
  episodesForChapter,
  getEpisode,
  listEpisodes,
} from "./episodes";
export { PEOPLE, PEOPLE_BY_KEY, personOf } from "./people";
export type { Person } from "./people";
export { ANNALS_PLACES } from "./places";
export { applyChange, emptyWorld, worldAfterAll, worldAt } from "./world";
export type { WorldState } from "./world";
