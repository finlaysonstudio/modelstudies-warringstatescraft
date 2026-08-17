import { describe, expect, it } from "vitest";

import { PAPER_ROCK_SCISSORS } from "../bank/paperRockScissors";
import { formatItemPrompt } from "../format";

const item = (name: string) =>
  PAPER_ROCK_SCISSORS.find((candidate) => candidate.name === name)!;

describe("formatItemPrompt", () => {
  it("renders wording, numbered options, and answer instruction", () => {
    const prompt = formatItemPrompt(item("throw"));
    expect(prompt).toContain("Throw rock, paper, or scissors.");
    expect(prompt).toContain("1. Rock");
    expect(prompt).toContain("3. Scissors");
    expect(prompt).toContain("Answer with the number of your choice.");
  });
  it("reverses option order for the experimental condition", () => {
    const prompt = formatItemPrompt(item("throw"), { reverseOptions: true });
    expect(prompt.indexOf("3. Scissors")).toBeLessThan(
      prompt.indexOf("1. Rock"),
    );
  });
  it("renders numeric range instruction for open items", () => {
    const prompt = formatItemPrompt(item("rounds"));
    expect(prompt).toContain("between 1 and 10");
  });
});
