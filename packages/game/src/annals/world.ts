/**
 * The state layer. An episode changes the country: a city is sacked, a house
 * is extinguished, a canal exists afterward and did not before. `worldAt`
 * folds every earlier episode's changes so a run of the Annals reads as one
 * country changing rather than fifty-one disconnected clips.
 */
import { listEpisodes } from "./episodes";
import type { WorldChange } from "./types";

export interface WorldState {
  /** place key → the marker the map should draw instead of its own */
  markers: Record<string, string>;
  /** cast keys with no state left, in the order they went */
  extinguished: string[];
}

export const emptyWorld = (): WorldState => ({ markers: {}, extinguished: [] });

export const applyChange = (world: WorldState, change: WorldChange): void => {
  if ("place" in change) {
    world.markers[change.place] = change.marker;
    return;
  }
  if (!world.extinguished.includes(change.state)) {
    world.extinguished.push(change.state);
  }
};

/**
 * The country as the episode at `order` opens: every change of every earlier
 * episode, folded in chronicle order. The episode's own changes are what it
 * leaves behind, so they are not applied until the one after it.
 */
export const worldAt = (order: number): WorldState => {
  const world = emptyWorld();
  for (const episode of listEpisodes()) {
    if (episode.order >= order) break;
    for (const change of episode.effects ?? []) applyChange(world, change);
  }
  return world;
};

/** the country after every episode on record */
export const worldAfterAll = (): WorldState => worldAt(Number.MAX_SAFE_INTEGER);
