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
  | "tripods"
  // The Annals (scope `annals`, `DIRECTIONS`): kinds an authored episode of
  // the period needs and a played game has no use for. They carry a band so
  // a caption can be grouped, and `directionsFor("game")` keeps every one of
  // them out of the coder prompt, the fallback's cue table, and the random
  // stager.
  | "decree"
  | "covenant"
  | "enthrone"
  | "usurp"
  | "partition"
  | "abdicate"
  | "audience"
  | "debate"
  | "divine"
  | "funeral"
  | "flee"
  | "assassinate"
  | "duel"
  | "surrender"
  | "bury"
  | "canal-cut"
  | "tomb-burn"
  | "mint"
  | "measure"
  | "tally-split"
  | "jade-return"
  | "oxen";

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
  | "boat"
  // the Annals: the figures a scripted history needs on the floor of a hall,
  // in a camp, or at an altar
  | "dowager"
  | "chancellor"
  | "minister"
  | "eunuch"
  | "herald"
  | "guard"
  | "diviner"
  | "physician"
  | "executioner"
  | "persuader"
  | "retainer"
  | "spy"
  | "engineer"
  | "horse-archer"
  | "charioteer"
  | "drummer"
  | "standard-bearer"
  | "ox";

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
  | "grey"
  // the Annals: weather, light, and the objects an episode turns on
  | "night"
  | "rain"
  | "snow"
  | "torch"
  | "jade"
  | "tally"
  | "bronze"
  | "bell"
  | "stele"
  | "oxen-fire";

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
  | "inject"
  | "brief"
  | "verdict"
  | "narrative"
  | "debrief"
  /** the Annals: one authored scene of an episode */
  | "scene";

/**
 * A venue is where a beat plays. Only `overworld` is built today; the rest
 * are the interior and close-exterior sets of the venue plan, declared here
 * so an episode can name the set it wants before the set exists and the
 * player can fall back to the country.
 */
export type VenueId =
  | "overworld"
  | "hall"
  | "square"
  | "gates"
  | "field"
  | "camp"
  | "chamber"
  | "road"
  | "river"
  | "works"
  | "academy"
  | "altar";

/** a line of dialogue under the stage, written in both languages */
export interface StageLine {
  /** a cast key, a people key, or a bare name */
  speaker: string;
  text: Record<Language, string>;
}

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
  // The four fields below belong to authored sequences (the Annals). The run
  // path never writes them and every reader treats them as optional.
  /** where the beat plays; `overworld` when absent */
  venue?: VenueId;
  /** the state whose colours and props dress the venue */
  dressing?: string;
  /** a title card at the head of the scene */
  card?: { title: Record<Language, string>; date?: string };
  /** the subtitle track */
  lines?: StageLine[];
  /** lake document ids, rendered under the stage and never near a prompt */
  cite?: string[];
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

/**
 * What the stage can play: a list of beats, the seats that act in them, and
 * the places they address. Two things are sequences — a `StageScript`, coded
 * from a run's record, and an `Episode` of the Annals, authored from the
 * period itself — and everything downstream of the data (`validateScript`,
 * `beatsRevealed`, `planBeat`, `Stage`, `OverworldScene`) takes this base
 * rather than either of them.
 */
export interface StageSequence {
  id: string;
  model: string;
  language: Language;
  naming: Naming;
  createdAt: string;
  seats: Record<string, StageSeat>;
  /** every place key the beats address, in first-seen order */
  places: string[];
  beats: StageBeat[];
}

export interface StageScript extends StageSequence {
  model: "stagings";
  run: string;
  scenario: string;
  source: StageSource;
  /** random stagings: the seed that chose the directions */
  seed?: number;
  /** coder stagings: the model that coded the turns */
  coder?: string;
  /** coder stagings: turns the fallback stood in for */
  fallbackTurns?: number[];
  /** the coder calls, in the order they were made */
  usage?: Usage;
}
