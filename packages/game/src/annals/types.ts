/**
 * The Annals of the Warring States: the period itself, authored as stage
 * sequences and played on the same overworld the recorded games play on.
 *
 * An `Episode` is a `StageSequence` with a date, an act, and a place in the
 * chronicle. It is an educational exhibit and is separate from the bench:
 * nothing here is played, scored, or elicited, and nothing here reaches a
 * model. That separation is what lets the Annals name real people and state
 * real years where the chapters may not (`wall.spec.ts` holds it, and the
 * people live in `people.ts` rather than in `GAZETTEER`).
 */
import type { Language } from "../types";
import type {
  StageDirection,
  StageLine,
  StageSeat,
  StageSequence,
  VenueId,
} from "../stage/types";

export type Localized = Record<Language, string>;

/** the five acts, in chronicle order */
export type ActId =
  "partition" | "reformers" | "kings" | "ledger" | "unification";

export interface Act {
  id: ActId;
  /** 1-based position */
  order: number;
  /** the span the act covers, as a reader is told it */
  date: string;
  title: Localized;
  blurb: Localized;
}

/**
 * What an episode leaves changed on the country. Later episodes are staged
 * over the fold of every earlier change (`worldAt`), so a sacked city stays
 * sacked and an extinguished house stays grey.
 */
export type WorldChange =
  | {
      /** a place key on the map */
      place: string;
      /** a marker id from the app's catalog (`MARKERS`) */
      marker: string;
    }
  | {
      /** a cast key */
      state: string;
      status: "extinguished";
    };

/**
 * The model recorded on a seat of an authored sequence. No model played it:
 * a person wrote it down (as `SCRIPTED_MODEL` records a seat the scenario
 * played for itself).
 */
export const AUTHORED_ACTOR = "authored";

export interface Episode extends StageSequence {
  model: "episodes";
  act: ActId;
  /** dense and unique across the Annals; the order a reader meets them in */
  order: number;
  /** the date as a reader is told it ("453 BCE", "409 to 387 BCE") */
  date: string;
  /** the year the episode turns on, negative for BCE: the sort key */
  year: number;
  title: Localized;
  /** one paragraph under the stage */
  blurb: Localized;
  /** the bench chapter this episode anchors, when it anchors one */
  chapter?: string;
  /** lake document ids, rendered under the stage and never near a prompt */
  sources: string[];
  /** the venues the beats ask for, in first-seen order */
  venues: VenueId[];
  /** what the episode leaves changed on the map */
  effects?: WorldChange[];
}

/** one scene as it is authored; `buildEpisode` turns it into a beat */
export interface SceneSpec {
  /** `s1`, `s2`, ... when absent */
  id?: string;
  venue?: VenueId;
  /** the state whose colours and props dress the venue */
  dressing?: string;
  /** the place the camera settles on before the directions play */
  focus?: string;
  /** a title card at the head of the scene */
  card?: Localized;
  /** the date on the card */
  date?: string;
  lines?: StageLine[];
  cite?: string[];
  /** what plays */
  play: StageDirection[];
}

/** one episode as it is authored */
export interface EpisodeSpec {
  id: string;
  act: ActId;
  date: string;
  year: number;
  title: Localized;
  blurb: Localized;
  chapter?: string;
  sources?: string[];
  /** seat → the cast member it plays and the place it acts from */
  seats: Record<string, { state?: string; home: string }>;
  effects?: WorldChange[];
  scenes: SceneSpec[];
}

export type { StageDirection, StageLine, StageSeat, VenueId };
