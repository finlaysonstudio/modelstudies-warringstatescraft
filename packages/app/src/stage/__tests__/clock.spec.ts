import { describe, expect, it } from "vitest";

import {
  advanceClock,
  clampHour,
  clockLabel,
  DAY_START,
  DAYS_IN_MONTH,
  hourLightOf,
  isNight,
  NIGHT_SPEED,
  NIGHT_START,
  nightOf,
  openClock,
  parseHour,
  SHICHEN,
  SHICHEN_MS,
  shichenOf,
} from "../clock";

describe("the site clock", () => {
  it("names twelve double-hours in order, 子 first", () => {
    expect(SHICHEN.map((s) => s.hour)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(SHICHEN[0].name.zh).toBe("子");
    expect(SHICHEN[3].name.zh).toBe("卯");
    expect(SHICHEN[11].name.zh).toBe("亥");
    for (const s of SHICHEN) {
      expect(s.name.en).toBeTruthy();
      expect(s.animal.en).toBeTruthy();
      expect(s.animal.zh).toBeTruthy();
      expect(s.span).toMatch(/\d/);
    }
  });

  it("opens a month on day 1 at 卯", () => {
    const clock = openClock(3);
    expect(clock).toEqual({ month: 3, day: 1, hour: DAY_START });
    expect(shichenOf(clock.hour).name.zh).toBe("卯");
    expect(openClock(3, 7).hour).toBe(7);
    expect(clampHour(0)).toBe(1);
    expect(clampHour(20)).toBeLessThan(13);
  });

  it("tells night from day at the edges of 卯 and 戌", () => {
    expect(isNight(1)).toBe(true);
    expect(isNight(3.99)).toBe(true);
    expect(isNight(DAY_START)).toBe(false);
    expect(isNight(10.99)).toBe(false);
    expect(isNight(NIGHT_START)).toBe(true);
  });

  it("runs a day hour in SHICHEN_MS and a night hour four times as fast", () => {
    const day = advanceClock(openClock(1, 5), SHICHEN_MS);
    expect(day.clock.hour).toBeCloseTo(6, 6);
    expect(day.rolled).toBe(false);
    const night = advanceClock(openClock(1, 11), SHICHEN_MS / NIGHT_SPEED);
    expect(night.clock.hour).toBeCloseTo(12, 6);
    expect(NIGHT_SPEED).toBe(4);
  });

  it("changes rate at dusk inside one step", () => {
    // half an hour of day, then a quarter step at night speed: one hour
    const { clock } = advanceClock(openClock(1, 10.5), SHICHEN_MS * 0.75);
    expect(clock.hour).toBeCloseTo(11 + 0.25 * NIGHT_SPEED, 6);
  });

  it("rolls the day at the end of 亥 and wraps the month's last day", () => {
    const { clock, rolled } = advanceClock(
      openClock(1, 12.5),
      SHICHEN_MS / NIGHT_SPEED,
    );
    expect(rolled).toBe(true);
    expect(clock.day).toBe(2);
    // half the step reaches the end of 亥, the other half is half a night hour
    expect(clock.hour).toBeCloseTo(1.5, 6);
    const last = advanceClock(
      { month: 1, day: DAYS_IN_MONTH, hour: 12.9 },
      SHICHEN_MS,
    );
    expect(last.rolled).toBe(true);
    expect(last.clock.day).toBe(1);
  });

  it("grades the light: dawn through 卯, dusk through 酉, full night between", () => {
    expect(nightOf(4)).toBe(1);
    expect(nightOf(4.5)).toBeCloseTo(0.5);
    expect(nightOf(7)).toBe(0);
    expect(nightOf(10.5)).toBeCloseTo(0.5);
    expect(nightOf(11)).toBe(1);
    expect(nightOf(2)).toBe(1);
    expect(hourLightOf(2)).toBe("night");
    expect(hourLightOf(4.2)).toBe("dawn");
    expect(hourLightOf(7)).toBe("day");
    expect(hourLightOf(10.5)).toBe("dusk");
  });

  it("labels the hour in both languages and parses the query", () => {
    const clock = openClock(2, 6);
    expect(clockLabel(clock, "zh")).toContain("巳");
    expect(clockLabel(clock, "en")).toContain("day 1");
    expect(parseHour("6")).toBe(6);
    expect(parseHour("13")).toBeUndefined();
    expect(parseHour(null)).toBeUndefined();
  });
});
