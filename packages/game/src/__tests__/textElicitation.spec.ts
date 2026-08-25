import { describe, expect, it } from "vitest";

import type {
  EntityLike,
  LlmClient,
  LlmOperateOptions,
  Store,
} from "@modelstudies/workflows";

import {
  answersPrompt,
  CHOICE_RETRIES,
  parseSelection,
  selectionPrompt,
  splitAnswers,
} from "../briefs";
import { GameEngine } from "../engine";
import { LAMPARTH_2024 } from "../scenario/lamparth2024";
import { STRAIT_STATES } from "../scenario/straitStates";
import { getScenario } from "../scenarios";
import type { Run, ScenarioTurn } from "../types";

class MemoryStore implements Store {
  readonly entities = new Map<string, EntityLike>();
  async create<T extends EntityLike>(entity: T): Promise<T> {
    return this.update(entity);
  }
  async get<T extends EntityLike>(model: string, id: string) {
    return this.entities.get(`${model}/${id}`) as T | undefined;
  }
  async queryByScope<T extends EntityLike>(model: string, scope: string) {
    return [...this.entities.values()].filter(
      (entity) => entity.model === model && entity.scope === scope,
    ) as T[];
  }
  async update<T extends EntityLike>(entity: T): Promise<T> {
    this.entities.set(`${entity.model}/${entity.id}`, structuredClone(entity));
    return entity;
  }
}

const moveOne = LAMPARTH_2024.turns[0];
const moveTwo = LAMPARTH_2024.turns[1];

describe("parseSelection", () => {
  const one = (reply: string) => parseSelection(reply, moveOne);
  const two = (reply: string) => parseSelection(reply, moveTwo);

  it("reads bare ids, in the order given, first occurrence only", () => {
    expect(one("b, e")).toEqual(["b", "e"]);
    expect(one("e b")).toEqual(["e", "b"]);
    expect(one("b; e; b")).toEqual(["b", "e"]);
    expect(two("a, a1, d, h, i")).toEqual(["a", "a1", "d", "h", "i"]);
  });

  it("strips brackets, quotes, and trailing punctuation", () => {
    expect(one("[b], [e].")).toEqual(["b", "e"]);
    expect(one('"b" and "e"')).toEqual(["b", "e"]);
    expect(two("(a1) (d) (k)")).toEqual(["a1", "d", "k"]);
  });

  it("matches ids as whole tokens, so a1 never reads as a", () => {
    expect(two("a1")).toEqual(["a1"]);
    expect(two("a, a1")).toEqual(["a", "a1"]);
    // the ids inside a word are not ids
    expect(one("abandon the patrol")).toEqual([]);
  });

  it("takes the last line of a reply that talks first", () => {
    expect(
      two("The team debated at length and settled on three actions.\nd, f, k"),
    ).toEqual(["d", "f", "k"]);
  });

  it("reads a one-per-line list when every line opens with a bracketed id", () => {
    expect(two("[a] Military Action\n[a3] Defend\n[d] Diplomacy")).toEqual([
      "a",
      "a3",
      "d",
    ]);
    // a prose line in the list falls back to the last line
    expect(
      two("We chose two.\n[d] Diplomacy\n[f] Economic Incentives"),
    ).toEqual(["f"]);
  });

  it("falls back to labels: exact first, then a unique prefix", () => {
    expect(two("Diplomacy, Cyber Operations")).toEqual(["d", "k"]);
    expect(two("diplomacy; economic incentives.")).toEqual(["d", "f"]);
    expect(two("Conduct Foreign")).toEqual(["i"]);
  });

  it("drops an ambiguous label prefix rather than guessing", () => {
    // "Military Action" is the exact label of `a` and the prefix of three more
    expect(two("Military Action")).toEqual(["a"]);
    expect(two("Military Action:")).toEqual(["a"]);
    expect(two("Conduct")).toEqual([]);
    expect(two("Economic")).toEqual([]);
  });

  it("never reads prose as a selection, though `a` is an id and an article", () => {
    // the probe's own failure text: it names no action and must not code one
    expect(
      two(
        "Our overall response plan is to prioritize diplomatic efforts and " +
          "the desired end state is a de-escalation of the situation.",
      ),
    ).toEqual([]);
    expect(two("We would take a measured approach here.")).toEqual([]);
    // a bracketed id inside prose still counts: the menu prints them that way
    expect(two("We select [d] and nothing further.")).toEqual(["d"]);
  });

  it("drops unknown tokens and reads an empty reply as nothing", () => {
    expect(one("b, zzz, q9")).toEqual(["b"]);
    expect(one("")).toEqual([]);
    expect(one("   \n\n  ")).toEqual([]);
    expect(one("we decline to answer")).toEqual([]);
  });

  it("reads a whole-menu reply whole, for validateChoices to reject", () => {
    expect(one("a, b, c, d, e, f, g")).toHaveLength(7);
  });

  it("reads a zh menu the same way", () => {
    const zh = getScenario("corridor-states", { language: "zh" });
    const turn: ScenarioTurn = {
      index: 1,
      title: zh.turns[0].title,
      inject: "",
      choices: [
        { id: "a", label: "遣使议和" },
        { id: "b", label: "增兵上党" },
      ],
    };
    expect(parseSelection("a、b", turn)).toEqual(["a", "b"]);
    expect(parseSelection("遣使议和，增兵上党", turn)).toEqual(["a", "b"]);
  });
});

describe("splitAnswers", () => {
  it("splits on the (n) markers and falls back to one entry", () => {
    expect(splitAnswers("(1) Deter. (2) De-escalate.")).toEqual([
      "Deter.",
      "De-escalate.",
    ]);
    expect(splitAnswers("(1) Deter.\n(2) De-escalate.")).toEqual([
      "Deter.",
      "De-escalate.",
    ]);
    expect(splitAnswers("Our plan is to deter.")).toEqual([
      "Our plan is to deter.",
    ]);
    expect(splitAnswers("(1) One answer only.")).toEqual(["One answer only."]);
    // a marker mid-sentence is not a numbering
    expect(splitAnswers("We chose (1) of the options.")).toEqual([
      "We chose (1) of the options.",
    ]);
    expect(splitAnswers("   ")).toEqual([]);
  });
});

describe("the text elicitation prompts", () => {
  const run: Run = {
    id: "run_test",
    model: "runs",
    scenario: LAMPARTH_2024.id,
    scenarioTitle: LAMPARTH_2024.title,
    createdAt: "2026-08-24",
    status: "active",
    roster: { us: "gpt-3.5-turbo-0125", prc: "scripted" },
    escalationLadder: [...LAMPARTH_2024.escalationLadder],
    branch: {
      parent: null,
      lane: "root",
      decidedBy: null,
      point: null,
      seed: null,
    },
    children: [],
    turns: [],
    debriefs: [],
  };
  const seat = LAMPARTH_2024.seats[0];

  it("withholds the menu from the answers call and asks only the questions", () => {
    const prompt = answersPrompt(run, LAMPARTH_2024, seat, moveTwo);
    expect(prompt).toContain("QUESTIONS:");
    for (const question of moveTwo.questions ?? []) {
      expect(prompt).toContain(question);
    }
    expect(prompt).not.toContain("Select all that apply");
    expect(prompt).not.toContain("[a1]");
    expect(prompt).toContain("Do not select any actions yet.");
  });

  it("puts the whole menu and one instruction on the selection call", () => {
    const prompt = selectionPrompt(moveTwo, LAMPARTH_2024);
    for (const choice of moveTwo.choices ?? []) {
      expect(prompt).toContain(`[${choice.id}] ${choice.label}`);
    }
    expect(prompt).toContain("on one line and nothing else");
  });
});

/**
 * The engine end to end on the text path. The stub answers a plain call by
 * `reply`, which sees (turn, attempt) so a script can fail and then comply.
 */
const makeTextStub = (reply: (turn: number, attempt: number) => string) => {
  const calls: { prompt: string; options?: LlmOperateOptions }[] = [];
  const attempts = new Map<number, number>();
  const llm: LlmClient = {
    async operate(prompt: string, options?: LlmOperateOptions) {
      calls.push({ prompt, options });
      if (options?.system?.includes("escalation adjudicator")) {
        return { content: { escalation: 2, reasoning: "test", flags: [] } };
      }
      if (options?.system?.includes("game master narrator")) {
        return { content: "Narrated resolution." };
      }
      if (prompt.includes("Write a candid")) return { content: "Debrief." };
      if (prompt.includes("SELECT YOUR ACTIONS")) {
        const turnText = (options?.history ?? [])
          .map((entry) => entry.content)
          .reverse()
          .find((content) => /TURN (\d+)/.test(content));
        const turn = Number(/TURN (\d+)/.exec(turnText ?? "")?.[1] ?? 1);
        const attempt = attempts.get(turn) ?? 0;
        attempts.set(turn, attempt + 1);
        return { content: reply(turn, attempt) };
      }
      return { content: "(1) Our end state is a restored status quo." };
    },
  };
  return { calls, llm };
};

describe("elicitBrief on the text path", () => {
  it("asks twice, matches the reply, and never sends a schema", async () => {
    const { calls, llm } = makeTextStub((turn) =>
      turn === 1 ? "b, e" : "a, a1, d, h, i",
    );
    const run = await new GameEngine({
      elicit: "text",
      llm,
      roster: ["gpt-3.5-turbo-0125"],
      scenario: LAMPARTH_2024.id,
      store: new MemoryStore(),
    }).play();

    expect(run.status).toBe("complete");
    expect(run.elicit).toBe("text");
    const [one, two] = run.turns.map((turn) =>
      turn.briefs.find((brief) => brief.seat === "us")!,
    );
    expect(one.memo.choices).toEqual(["b", "e"]);
    expect(one.memo.answers).toEqual([
      "Our end state is a restored status quo.",
    ]);
    expect(one.memo.decision).toBe(
      "Hold fire unless fired upon; Place automated defenses on manual firing control. AI decides target/human decides firing.",
    );
    expect(one.memo.options).toHaveLength(7);
    expect(one.retries).toBeUndefined();
    expect(one.unusable).toBeUndefined();
    expect(two.memo.choices).toEqual(["a", "a1", "d", "h", "i"]);

    const seatCalls = calls.filter((call) =>
      call.options?.system?.includes("You will help simulate a wargame"),
    );
    expect(seatCalls.every((call) => call.options?.format === undefined)).toBe(
      true,
    );
    // two calls per move plus the debrief
    expect(seatCalls).toHaveLength(5);
    const selection = seatCalls[1];
    expect(selection.prompt).toContain("SELECT YOUR ACTIONS");
    // the answers ride on the history of the selection call
    expect(selection.options?.history).toHaveLength(2);
    expect(selection.options?.history?.[1].content).toContain(
      "restored status quo",
    );
  });

  it("retries only the selection call, keeping the answers it already paid for", async () => {
    // the two shapes the probe found, then a compliant reply
    const probe = [
      "Our overall response plan is to prioritize diplomatic efforts and the " +
        "desired end state is a de-escalation of the situation.",
      "I recommend we pursue every option available to us.",
      "d, f, k",
    ];
    const { calls, llm } = makeTextStub((turn, attempt) =>
      turn === 1 ? "b" : probe[attempt],
    );
    const run = await new GameEngine({
      elicit: "text",
      llm,
      roster: ["gpt-3.5-turbo-0125"],
      scenario: LAMPARTH_2024.id,
      store: new MemoryStore(),
    }).play();

    const two = run.turns[1].briefs.find((brief) => brief.seat === "us")!;
    expect(two.retries).toBe(2);
    expect(two.unusable).toBeUndefined();
    expect(two.memo.choices).toEqual(["d", "f", "k"]);
    expect(two.memo.answers).toEqual([
      "Our end state is a restored status quo.",
    ]);
    // one answers call for the move, three selection calls
    const moveTwo = calls.filter(
      (call) =>
        call.options?.system?.includes("You will help simulate a wargame") &&
        (call.prompt.includes("TURN 2") ||
          call.prompt.includes("SELECT YOUR ACTIONS") ||
          call.prompt.startsWith("Your selection was not usable")),
    );
    expect(
      moveTwo.filter((call) => call.prompt.includes("TURN 2")),
    ).toHaveLength(1);
    const retries = moveTwo.filter((call) =>
      call.prompt.startsWith("Your selection was not usable"),
    );
    expect(retries).toHaveLength(2);
    expect(retries[0].prompt).toContain("(empty selection)");
    expect(retries[0].prompt).toContain("SELECT YOUR ACTIONS");
  });

  it("marks a selection that stays unmatched unusable and completes the game", async () => {
    const { llm } = makeTextStub((turn) =>
      turn === 1 ? "b" : "We prefer not to select from this menu.",
    );
    const run = await new GameEngine({
      elicit: "text",
      llm,
      roster: ["gpt-3.5-turbo-0125"],
      scenario: LAMPARTH_2024.id,
      store: new MemoryStore(),
    }).play();

    expect(run.status).toBe("complete");
    const two = run.turns[1].briefs.find((brief) => brief.seat === "us")!;
    expect(two.retries).toBe(CHOICE_RETRIES);
    expect(two.unusable).toBe("empty selection");
    expect(two.memo.choices).toEqual([]);
    expect(two.error).toBeUndefined();
  });

  it("follows the capability table without a flag", async () => {
    const { llm } = makeTextStub(() => "b, e");
    const run = await new GameEngine({
      llm,
      roster: ["gpt-3.5-turbo-0125"],
      scenario: LAMPARTH_2024.id,
      store: new MemoryStore(),
    }).play();
    expect(run.elicit).toBe("text");
    expect(
      run.turns[0].briefs.find((brief) => brief.seat === "us")!.memo.choices,
    ).toEqual(["b", "e"]);
  });

  it("refuses a text model on a memo scenario", () => {
    const { llm } = makeTextStub(() => "b");
    expect(
      () =>
        new GameEngine({
          llm,
          roster: ["gpt-3.5-turbo-0125"],
          scenario: STRAIT_STATES.id,
          store: new MemoryStore(),
        }),
    ).toThrow(/forced-choice/);
    expect(
      () =>
        new GameEngine({
          elicit: "text",
          llm,
          roster: ["gpt-4o-2024-08-06"],
          scenario: STRAIT_STATES.id,
          store: new MemoryStore(),
        }),
    ).toThrow(/forced-choice/);
    // the schema path is untouched on a memo scenario
    expect(
      () =>
        new GameEngine({
          llm,
          roster: ["gpt-4-0613"],
          scenario: STRAIT_STATES.id,
          store: new MemoryStore(),
        }),
    ).not.toThrow();
  });
});
