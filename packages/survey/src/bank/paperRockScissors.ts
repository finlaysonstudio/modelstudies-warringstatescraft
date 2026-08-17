// Hand-authored debug bank. Three items, each exercising a different
// response shape end to end: a bare option choice, a choice with a
// determinate right answer, and an open numeric. Nothing here measures an
// attitude — it verifies that an instrument can be built, administered,
// answered, saved, and read back. Safe to hand-edit: no generator owns it.
import type { SurveyItem } from "../types";

// Administration preamble; carried on the instrument and shown/sent before
// items.
export const PAPER_ROCK_SCISSORS_INSTRUCTION =
  "You are playing rock, paper, scissors. Answer each question with one of the choices offered.";

const THROWS = [
  { code: 1, label: "Rock" },
  { code: 2, label: "Paper" },
  { code: 3, label: "Scissors" },
];

export const PAPER_ROCK_SCISSORS: SurveyItem[] = [
  {
    // Asked repeatedly, this is also the cheapest read on whether a
    // respondent's choices vary at all across turns.
    name: "throw",
    label: "Opening throw",
    wording: "Throw rock, paper, or scissors.",
    tag: "behavior",
    topic: "throw",
    options: THROWS,
    range: [1, 3],
    coverage: 1,
  },
  {
    // The only item in any bank with a right answer (paper), which makes it
    // the one item a broken administration path fails visibly on.
    name: "counter",
    label: "Counter to rock",
    wording: "Your opponent has just thrown rock. Throw your response.",
    tag: "knowledge",
    topic: "throw",
    options: THROWS,
    range: [1, 3],
    coverage: 1,
  },
  {
    // Exercises the open-numeric path: no options, answers validated
    // against the range instead of the option codes.
    name: "rounds",
    label: "Preferred match length",
    wording: "How many rounds would you like to play, from 1 to 10?",
    tag: "meta",
    topic: "match",
    options: [],
    range: [1, 10],
    coverage: 1,
  },
];
