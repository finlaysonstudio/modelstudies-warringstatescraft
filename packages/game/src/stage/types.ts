/**
 * The stage script: what the animated overworld plays for one run. A
 * staging is derived from the run's record after the game and stored as
 * `var/stagings/<id>.json` (model `stagings`); it is presentation, like a
 * scorecard, and nothing in it reaches a prompt.
 */
import type { Language, Naming, Usage } from "../types";

/** the closed vocabulary of stage directions, grouped by ladder band */
export type StageDirectionKind =
  // band 0: ordinary posture
  | "idle"
  | "market-open"
  // band 1: envoys and petitions
  | "envoy"
  | "hostage"
  | "petition"
  // band 2: subversion and coin
  | "gold"
  | "toll"
  | "refuse"
  | "seize-books"
  // band 3: grain and roads
  | "granary-close"
  | "carts-back"
  | "price"
  // band 4: levies and posture
  | "column"
  | "garrison"
  | "wall-build"
  | "fleet"
  // band 5: seizure and raids
  | "raid"
  | "gates-taken"
  | "enforce"
  | "expel"
  // band 6: war
  | "battle"
  | "siege"
  | "execute"
  | "works-cut"
  // band 7: annihilation
  | "sack"
  | "flood"
  | "extinguish"
  | "tripods";

/** the figures that act; one drawing each, palette-swapped per state */
export type StageArchetype =
  | "envoy"
  | "general"
  | "infantry"
  | "crossbowman"
  | "cavalry"
  | "chariot"
  | "merchant"
  | "peasant"
  | "clerk"
  | "scholar"
  | "mohist"
  | "assassin"
  | "hostage"
  | "labourer"
  | "court"
  | "boat";

/** the effect a direction plays at its place or on arrival */
export type StageEffect =
  | "scroll"
  | "coin"
  | "bar"
  | "plate"
  | "dust"
  | "banner"
  | "fire"
  | "smoke"
  | "arrows"
  | "splash"
  | "flood"
  | "grey";

export interface StageActor {
  /** the seat whose figure acts */
  seat: string;
  archetype: StageArchetype;
}

/**
 * One stage direction. `from`, `to`, and `at` are gazetteer keys present
 * on the map; which of them a kind takes is its arity rule (`DIRECTIONS`).
 */
export interface StageDirection {
  kind: StageDirectionKind;
  actor: StageActor;
  from?: string;
  to?: string;
  at?: string;
  /** the seat on the other side of a battle, siege, raid, or refusal */
  against?: string;
  /** figures in the group, for columns and crowds */
  count?: number;
  effect?: StageEffect;
}

export type StageBeatKind =
  "inject" | "brief" | "verdict" | "narrative" | "debrief";

/**
 * One beat of the script. Beats are addressed by id from the watch page
 * (`t1.inject`, `t1.brief.qin`, `t1.verdict`, `t1.narrative`, `debrief`),
 * so the page reveals them in its own order (the followed seat before the
 * table) and the stage plays what was revealed.
 */
export interface StageBeat {
  id: string;
  kind: StageBeatKind;
  /** 1-based turn index; 0 for the debrief */
  turn: number;
  /** brief beats: the seat whose directions these are */
  seat?: string;
  /** inject beats: the turn title for the title card */
  title?: string;
  /** the place the camera moves to before the directions play */
  focus?: string;
  /** verdict and narrative beats: the panel's rung */
  rung?: number;
  /** verdict beats: the panel returned no score */
  unscored?: true;
  directions: StageDirection[];
  /** the coder's reply was invalid twice, so this turn is the fallback */
  fallback?: true;
  /** fallback beats: the cue words that chose the directions */
  cues?: string[];
}

/** how a staging was produced */
export type StageSource = "fallback" | "coder" | "random";

export const STAGE_SOURCES: StageSource[] = ["fallback", "coder", "random"];

export interface StageSeat {
  /** the cast member the seat plays, when the scenario names one */
  state?: string;
  /** the place the seat's figures start from and return to */
  home: string;
  /** the model that played the seat */
  model: string;
}

export interface StageScript {
  id: string;
  model: "stagings";
  run: string;
  scenario: string;
  language: Language;
  naming: Naming;
  createdAt: string;
  source: StageSource;
  /** random stagings: the seed that chose the directions */
  seed?: number;
  /** coder stagings: the model that coded the turns */
  coder?: string;
  seats: Record<string, StageSeat>;
  /** every place key the beats address, in first-seen order */
  places: string[];
  beats: StageBeat[];
  /** coder stagings: turns the fallback stood in for */
  fallbackTurns?: number[];
  /** the coder calls, in the order they were made */
  usage?: Usage;
}
