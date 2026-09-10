/**
 * The clock a registered site runs on: twelve double-hours (時辰) of one
 * day of one month. A double-hour of the working day is `SHICHEN_MS`, so a
 * day's work is about four and a half minutes of watching; the night runs
 * `NIGHT_SPEED` times as fast (decided 2026-09-09), and the page says so.
 * Browser-safe and pure: the scene advances it by its update delta, and the
 * populace reads it.
 */
import type { Month } from "./almanac";
import type { Localized } from "./legend";
import type { Hour } from "./site";

/** how long one double-hour of the day lasts, in ms */
export const SHICHEN_MS = 40_000;
/** how much faster the night runs than the day */
export const NIGHT_SPEED = 4;
/** the first double-hour of the working day (卯, dawn) and the first of the night (戌) */
export const DAY_START: Hour = 4;
export const NIGHT_START: Hour = 11;

export interface Shichen {
  hour: Hour;
  name: Localized;
  /** the animal of the branch, for the eyebrow */
  animal: Localized;
  /** the modern span, for a reader who wants it */
  span: string;
}

export const SHICHEN: readonly Shichen[] = [
  {
    hour: 1,
    name: { en: "zi", zh: "子" },
    animal: { en: "rat", zh: "鼠" },
    span: "23–1",
  },
  {
    hour: 2,
    name: { en: "chou", zh: "丑" },
    animal: { en: "ox", zh: "牛" },
    span: "1–3",
  },
  {
    hour: 3,
    name: { en: "yin", zh: "寅" },
    animal: { en: "tiger", zh: "虎" },
    span: "3–5",
  },
  {
    hour: 4,
    name: { en: "mao", zh: "卯" },
    animal: { en: "hare", zh: "兔" },
    span: "5–7",
  },
  {
    hour: 5,
    name: { en: "chen", zh: "辰" },
    animal: { en: "dragon", zh: "龍" },
    span: "7–9",
  },
  {
    hour: 6,
    name: { en: "si", zh: "巳" },
    animal: { en: "snake", zh: "蛇" },
    span: "9–11",
  },
  {
    hour: 7,
    name: { en: "wu", zh: "午" },
    animal: { en: "horse", zh: "馬" },
    span: "11–13",
  },
  {
    hour: 8,
    name: { en: "wei", zh: "未" },
    animal: { en: "goat", zh: "羊" },
    span: "13–15",
  },
  {
    hour: 9,
    name: { en: "shen", zh: "申" },
    animal: { en: "monkey", zh: "猴" },
    span: "15–17",
  },
  {
    hour: 10,
    name: { en: "you", zh: "酉" },
    animal: { en: "cock", zh: "雞" },
    span: "17–19",
  },
  {
    hour: 11,
    name: { en: "xu", zh: "戌" },
    animal: { en: "dog", zh: "狗" },
    span: "19–21",
  },
  {
    hour: 12,
    name: { en: "hai", zh: "亥" },
    animal: { en: "pig", zh: "豬" },
    span: "21–23",
  },
];

/**
 * A moment of the site's year: the month, the day (1 to 30), and the hour
 * as a fraction of the day's twelve double-hours, `1` being the start of 子
 * and `13` the end of 亥. The clock opens at 卯 when a month opens.
 */
export interface SiteClock {
  month: Month;
  day: number;
  hour: number;
}

export const DAYS_IN_MONTH = 30;

export const openClock = (
  month: Month,
  hour: number = DAY_START,
): SiteClock => ({
  month,
  day: 1,
  hour: clampHour(hour),
});

export const clampHour = (hour: number): number =>
  Math.min(13 - 1e-9, Math.max(1, hour));

/** the double-hour an instant falls in */
export const shichenOf = (hour: number): Shichen =>
  SHICHEN[Math.min(11, Math.max(0, Math.floor(hour) - 1))];

/** whether the instant is in the night, 戌 through 寅 */
export const isNight = (hour: number): boolean =>
  hour < DAY_START || hour >= NIGHT_START;

/**
 * The clock after `deltaMs` of watching: a day's double-hour lasts
 * `SHICHEN_MS`, a night's a quarter of that. Crossing the end of 亥 rolls the
 * day; the month never rolls (a page is one month), so day 30 is followed by
 * day 1 again with `rolled` counting the crossings.
 */
export const advanceClock = (
  clock: SiteClock,
  deltaMs: number,
): { clock: SiteClock; rolled: boolean } => {
  let { hour, day } = clock;
  let left = deltaMs;
  let rolled = false;
  // step to each boundary between day and night speeds so a delta that
  // spans dusk is not all charged at one rate
  while (left > 0) {
    const night = isNight(hour);
    const rate = (night ? NIGHT_SPEED : 1) / SHICHEN_MS;
    const boundary =
      hour < DAY_START ? DAY_START : hour < NIGHT_START ? NIGHT_START : 13;
    const room = (boundary - hour) / rate;
    if (left < room) {
      hour += left * rate;
      left = 0;
    } else {
      left -= room;
      hour = boundary;
      if (hour >= 13) {
        hour = 1;
        day = day >= DAYS_IN_MONTH ? 1 : day + 1;
        rolled = true;
      }
    }
  }
  return { clock: { month: clock.month, day, hour }, rolled };
};

/** the light of the hour: how far into the night the instant is, 0 by day and 1 at deep night */
export const nightOf = (hour: number): number => {
  // dusk runs through 酉 and the dawn through 卯; the night between is full
  if (hour >= 4 && hour < 5) return 1 - (hour - 4);
  if (hour >= 10 && hour < 11) return hour - 10;
  return isNight(hour) ? 1 : 0;
};

/** the hour's cast over the month's own grade: cold before 辰, amber from 申 */
export type HourLight = "dawn" | "day" | "dusk" | "night";
export const hourLightOf = (hour: number): HourLight => {
  if (isNight(hour)) return "night";
  if (hour < 5) return "dawn";
  if (hour >= 9) return "dusk";
  return "day";
};

/** the eyebrow's line: the double-hour's name and animal, the day */
export const clockLabel = (clock: SiteClock, language: "en" | "zh"): string => {
  const s = shichenOf(clock.hour);
  return language === "zh"
    ? `${clock.day}日 ${s.name.zh}時（${s.animal.zh}）`
    : `day ${clock.day} · hour of the ${s.animal.en} (${s.name.en}, ${s.span})`;
};

/** `?hour=` parsed as a double-hour 1–12, else undefined */
export const parseHour = (value: string | null): Hour | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? (n as Hour) : undefined;
};
