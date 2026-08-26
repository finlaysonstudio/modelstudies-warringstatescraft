/**
 * The stage: a run's record coded into stage directions for the animated
 * overworld. Built after the game from the `Run` (never from a prompt's
 * inputs) and stored as model `stagings`.
 */
export * from "./types";
export {
  ARCHETYPES,
  BANDS,
  BAND_COUNT,
  bandOf,
  CONSEQUENCES,
  DIRECTIONS,
  DIRECTION_KINDS,
  directionsFor,
  directionsInBand,
  EFFECTS,
  GAME_ARCHETYPES,
  GAME_EFFECTS,
  GAME_KINDS,
  scopeOf,
} from "./vocabulary";
export type { DirectionRule, DirectionScope, PlaceRule } from "./vocabulary";
export { HOMES, homeOf } from "./homes";
export {
  chapterPlaceKeys,
  checkPlaces,
  MemoryPlaces,
  requiredPlaceKeys,
  worldPlaces,
} from "./places";
export type { Places, PlacesCheck } from "./places";
export {
  validateBeat,
  validateDirection,
  validateDirections,
  validateScript,
} from "./validate";
export type { ValidationContext } from "./validate";
export { focusOf, mentionsOf, mergeMentions, STATE_WEIGHT } from "./mentions";
export type { MentionOptions } from "./mentions";
export { escalatorOf, weaveTurn } from "./weave";
export type { WeaveOptions } from "./weave";
export {
  assembleStage,
  briefOf,
  stageSeats,
  stagingId,
  turnContext,
} from "./assemble";
export type {
  AssembleOptions,
  SeatChoice,
  TurnChoice,
  TurnChooser,
  TurnContext,
} from "./assemble";
export {
  cueHits,
  fallbackSeat,
  fallbackStage,
  fallbackTurn,
  placeDirection,
} from "./fallback";
export type { FallbackOptions } from "./fallback";
export { randomStage, randomTurn, randomVariant, seededRandom } from "./random";
export type { RandomOptions } from "./random";
export {
  buildStageScript,
  coderPrompt,
  coderSystem,
  coderTurn,
  readReply,
  stageFormat,
} from "./coder";
export type { BuildStageScriptOptions } from "./coder";
export { PLACES_LAYER, placeObjectsOf, placesOfTiledMap } from "./tiled";
export type { TiledLayer, TiledMap, TiledObject } from "./tiled";
