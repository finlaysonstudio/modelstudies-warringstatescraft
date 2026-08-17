import { BadRequestError } from "@jaypie/errors";
import { describe, expect, it } from "vitest";

import { PAPER_ROCK_SCISSORS } from "../bank/paperRockScissors";
import { buildInstrument } from "../instrument";
import { createSession, isValidAnswer } from "../session";

const fixedNow = () => new Date("2026-07-17T12:00:00.000Z");

describe("isValidAnswer", () => {
  const byName = Object.fromEntries(
    PAPER_ROCK_SCISSORS.map((item) => [item.name, item]),
  );
  it("accepts option codes", () => {
    expect(isValidAnswer(byName.throw!, 2)).toBe(true);
    expect(isValidAnswer(byName.throw!, 9)).toBe(false);
  });
  it("accepts in-range numeric entry on open items", () => {
    expect(isValidAnswer(byName.rounds!, 5)).toBe(true);
    expect(isValidAnswer(byName.rounds!, 12)).toBe(false);
    expect(isValidAnswer(byName.rounds!, 10)).toBe(true);
  });
  it("rejects non-finite and non-integer values", () => {
    expect(isValidAnswer(byName.rounds!, Number.NaN)).toBe(false);
    expect(isValidAnswer(byName.rounds!, 4.5)).toBe(false);
  });
});

describe("createSession", () => {
  it("walks items in order and completes", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw", "counter"],
    });
    const session = createSession(instrument, { now: fixedNow });
    expect(session.isComplete()).toBe(false);
    const first = session.current();
    expect(first).not.toBeNull();
    session.answer(first!.options[0]!.code);
    session.answer(session.current()!.options[0]!.code);
    expect(session.isComplete()).toBe(true);
    expect(session.current()).toBeNull();
  });
  it("rejects invalid answers", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw"],
    });
    const session = createSession(instrument, { now: fixedNow });
    expect(() => session.answer(99)).toThrow(BadRequestError);
  });
  it("records declines with raw text", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw"],
    });
    const session = createSession(instrument, { now: fixedNow });
    session.decline("As an AI I do not play games of chance.");
    const exported = session.toExport();
    expect(exported.declined).toBe(1);
    expect(exported.responses.throw!.declined).toBe(true);
    expect(exported.responses.throw!.raw).toMatch(/AI/);
  });
  it("throws when answering a complete session", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw"],
    });
    const session = createSession(instrument, { now: fixedNow });
    session.answer(1);
    expect(() => session.answer(1)).toThrow(BadRequestError);
  });
  it("exports joinable responses and rehydrates", () => {
    const instrument = buildInstrument({
      plan: "paper-rock-scissors",
      include: ["throw", "counter"],
    });
    const session = createSession(instrument, { now: fixedNow });
    session.answer(session.current()!.options[0]!.code);
    const exported = session.toExport();
    expect(exported.plan).toBe("paper-rock-scissors");
    expect(exported.completedAt).toBeNull();
    const resumed = createSession(instrument, {
      now: fixedNow,
      responses: exported.responses,
    });
    expect(resumed.progress().remaining).toBe(1);
    resumed.answer(resumed.current()!.options[0]!.code);
    expect(resumed.isComplete()).toBe(true);
    expect(resumed.toExport().completedAt).toBe("2026-07-17T12:00:00.000Z");
  });
});
