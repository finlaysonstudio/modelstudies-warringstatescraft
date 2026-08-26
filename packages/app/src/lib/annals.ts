/**
 * The Annals as the browser needs them: the five acts, and the helpers the
 * timeline and the player page read.
 *
 * The acts are a mirror of `packages/game/src/annals/acts.ts` (as `catalog.ts`
 * mirrors the stage vocabulary), because the app imports types from the node
 * packages and never their data. `annals.spec.ts` holds the two together, so
 * drift fails CI rather than showing a reader an empty band.
 */
import type { ActId, EpisodeIndexEntry, Language } from "./types";

export interface ActMeta {
  id: ActId;
  order: number;
  date: string;
  title: Record<Language, string>;
  blurb: Record<Language, string>;
}

export const ACTS: ActMeta[] = [
  {
    id: "partition",
    order: 1,
    date: "453 to 375 BCE",
    title: { en: "The Partition", zh: "分晋" },
    blurb: {
      en: "The largest state in the north is divided by three of its own ministers, and fifty years later the king they nominally serve writes the division down as lawful. A ministerial house takes a second throne the same way. The age begins with the discovery that a state can be taken from inside.",
      zh: "北方最大之国，为其三家之臣所分；五十年后，名义上之天子且著其分为常法。齐之田氏亦以是道取其君之位。此世之始，在于知国可自内而取。",
    },
  },
  {
    id: "reformers",
    order: 2,
    date: "420 to 307 BCE",
    title: { en: "The Reformers", zh: "变法" },
    blurb: {
      en: "A generation of administrators discovers what a state is capable of when land is measured, households are registered, and rank is bought with heads rather than birth. Every reform in this act outlives the man who made it, and several of them kill him.",
      zh: "一代治术之士，度田、著籍、以首级易爵而不以世胄，遂知国力之所极。此篇诸法，皆存于其人之后，而其人多以法死。",
    },
  },
  {
    id: "kings",
    order: 3,
    date: "353 to 278 BCE",
    title: { en: "Kings and persuaders", zh: "称王与纵横" },
    blurb: {
      en: "The dukes and marquesses call themselves kings, which leaves the actual king with nothing but the altars. Travelling arguers sell alliance in two directions at once, and the states that buy the arguments lose the wars.",
      zh: "公侯自王，而王者独存宗庙。策士鬻纵横之说于两端，买其说者败其兵。",
    },
  },
  {
    id: "ledger",
    order: 4,
    date: "270 to 246 BCE",
    title: { en: "The ledger", zh: "长平之算" },
    blurb: {
      en: "Qin stops fighting for territory and starts fighting for the other side's manpower. The arithmetic is explicit, it is written down, and at Changping it is carried out on four hundred thousand men.",
      zh: "秦不复争地而争人。其算甚明，且著于策；至长平，行之于四十万众。",
    },
  },
  {
    id: "unification",
    order: 5,
    date: "238 to 221 BCE",
    title: { en: "The unification", zh: "一统" },
    blurb: {
      en: "Seventeen years, six states, one order of conquest chosen for the ledger rather than for glory. It ends with a court that has no rival left to send an envoy to, and a decree that there will be one axle width, one script, and one law.",
      zh: "十七年而并六国，其次第出于算而不出于名。既讫，无敌国可遣使；乃下令：车同轨，书同文，法出于一。",
    },
  },
];

export const ACTS_BY_ID: Record<ActId, ActMeta> = Object.fromEntries(
  ACTS.map((act) => [act.id, act]),
) as Record<ActId, ActMeta>;

/** the episodes of one act, in chronicle order */
export const episodesOfAct = (
  episodes: EpisodeIndexEntry[],
  act: ActId,
): EpisodeIndexEntry[] => episodes.filter((entry) => entry.act === act);

/** the episode that anchors a bench chapter, when one does */
export const episodeForChapter = (
  episodes: EpisodeIndexEntry[],
  chapter: string,
): EpisodeIndexEntry | undefined =>
  episodes.find((entry) => entry.chapter === chapter);
