import { describe, expect, it } from "vitest";

import type { LlmClient, LlmOperateOptions } from "@modelstudies/workflows";

import { getScenario, listScenarios, listScenarioTexts } from "../scenarios";
import { CORRIDOR_STATES } from "../scenario/corridorStates";
import {
  ARCHETYPES,
  BAND_COUNT,
  bandOf,
  buildStageScript,
  checkPlaces,
  chapterPlaceKeys,
  cueHits,
  DIRECTIONS,
  DIRECTION_KINDS,
  directionsInBand,
  EFFECTS,
  fallbackStage,
  HOMES,
  MemoryPlaces,
  mentionsOf,
  randomStage,
  requiredPlaceKeys,
  stagingId,
  validateDirection,
  validateScript,
  weaveTurn,
  worldPlaces,
} from "../stage";
import type { StageBeat, StageDirection, StageSeat } from "../stage";
import type { DecisionBrief, Run, TurnRecord } from "../types";
import { GAZETTEER } from "../world/gazetteer";

const scenario = getScenario(CORRIDOR_STATES.id);

const brief = (
  seat: string,
  decision: string,
  rationale = "",
): DecisionBrief => ({
  seat,
  model: "model-a",
  memo: {
    situation: "",
    options: [],
    decision,
    rationale,
    redLines: [],
  },
});

const turn = (
  index: number,
  briefs: DecisionBrief[],
  escalation?: number,
  narrative = "",
): TurnRecord => ({
  index,
  title: scenario.turns[index - 1]?.title ?? `Turn ${index}`,
  inject: scenario.turns[index - 1]?.inject ?? "",
  briefs,
  ...(escalation === undefined
    ? {}
    : {
        adjudication: {
          panel: [],
          mode: "median" as const,
          escalation,
          narrative,
        },
      }),
});

const run = (turns: TurnRecord[], status: Run["status"] = "complete"): Run => ({
  id: "run_stage",
  model: "runs",
  scenario: scenario.id,
  scenarioTitle: scenario.title,
  createdAt: "2026-08-24T00:00:00.000Z",
  status,
  roster: Object.fromEntries(
    scenario.seats.map((seat) => [seat.id, "model-a"]),
  ),
  escalationLadder: [...scenario.escalationLadder],
  branch: {
    parent: null,
    lane: "root",
    decidedBy: null,
    point: null,
    seed: null,
  },
  children: [],
  turns,
  debriefs: [],
});

const fixture = (): Run =>
  run([
    turn(
      1,
      [
        brief(
          "qin",
          "Send an envoy to Handan with a covenant letter; hold the levies at home.",
          "Envoys are cheaper than soldiers.",
        ),
        brief(
          "zhao",
          "Raise the levies and march a column to Shangdang to garrison the highland.",
          "The highland is the wall of Handan.",
        ),
        brief(
          "qi",
          "Wait and observe; open the market at Linzi.",
          "No move yet.",
        ),
      ],
      1,
      "Qin's envoy reaches Handan; Zhao's column takes the road to Shangdang.",
    ),
    turn(
      2,
      [
        brief(
          "qin",
          "March the army through the Hangu pass to Shangdang and take the seventeen towns by assault.",
          "Force settles what gold could not.",
        ),
        brief(
          "zhao",
          "Reinforce the column at Shangdang; hold the walls at Changping.",
          "Hold.",
        ),
        brief("qi", "Refuse Qin's gold; send grain to Zhao.", "Lip and teeth."),
      ],
      6,
      "The two columns meet at Shangdang and the towns change hands in blood.",
    ),
  ]);

describe("the direction vocabulary", () => {
  it("maps every rung of every registered chapter's ladder to a band with directions", () => {
    for (const entry of listScenarios()) {
      if (entry.id.startsWith("lamparth-2024") || entry.id === "taiwan-strait")
        continue;
      for (let rung = 0; rung < entry.escalationLadder.length; rung += 1) {
        const band = bandOf(rung, entry.escalationLadder.length);
        expect(band).toBeGreaterThanOrEqual(0);
        expect(band).toBeLessThan(BAND_COUNT);
        expect(
          directionsInBand(band).length,
          `${entry.id} rung ${rung}`,
        ).toBeGreaterThan(0);
      }
      // the top rung is always annihilation and the bottom always ordinary
      expect(bandOf(0, entry.escalationLadder.length)).toBe(0);
      expect(
        bandOf(
          entry.escalationLadder.length - 1,
          entry.escalationLadder.length,
        ),
      ).toBe(BAND_COUNT - 1);
    }
  });

  it("covers every band and declares a known actor and effect for every kind", () => {
    const bands = new Set(DIRECTION_KINDS.map((kind) => DIRECTIONS[kind].band));
    expect([...bands].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (const kind of DIRECTION_KINDS) {
      const rule = DIRECTIONS[kind];
      expect(ARCHETYPES).toContain(rule.actor);
      if (rule.effect) expect(EFFECTS).toContain(rule.effect);
      expect(rule.cues.length).toBeGreaterThan(0);
      expect(rule.gloss.length).toBeGreaterThan(0);
    }
  });

  it("stretches a seven-rung ladder over the eight bands", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((rung) => bandOf(rung, 7))).toEqual([
      0, 1, 2, 4, 5, 6, 7,
    ]);
  });
});

describe("validateDirection", () => {
  const context = {
    places: new MemoryPlaces(["xianyang", "handan", "shangdang"]),
    seats: ["qin", "zhao"],
  };
  const qin = { seat: "qin", archetype: "envoy" as const };

  it("holds a route to distinct known places", () => {
    expect(
      validateDirection(
        { kind: "envoy", actor: qin, from: "xianyang", to: "handan" },
        context,
      ),
    ).toEqual([]);
    expect(
      validateDirection(
        { kind: "envoy", actor: qin, from: "xianyang", to: "xianyang" },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "envoy", actor: qin, from: "xianyang" },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "envoy", actor: qin, from: "xianyang", to: "linzi" },
        context,
      )[0],
    ).toContain("not on the map");
  });

  it("holds an `at` direction to one place and refuses a route's slots", () => {
    expect(
      validateDirection(
        {
          kind: "garrison",
          actor: { seat: "zhao", archetype: "infantry" },
          at: "shangdang",
        },
        context,
      ),
    ).toEqual([]);
    expect(
      validateDirection(
        {
          kind: "garrison",
          actor: { seat: "zhao", archetype: "infantry" },
          from: "handan",
          to: "shangdang",
        },
        context,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("refuses an unknown kind, seat, archetype, effect, self-against, and a bad count", () => {
    expect(
      validateDirection({ kind: "parade" as never, actor: qin }, context),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "idle", actor: { seat: "chu", archetype: "court" } },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "idle", actor: { seat: "qin", archetype: "dragon" as never } },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "idle", actor: qin, effect: "glitter" as never },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        { kind: "battle", actor: qin, at: "shangdang", against: "qin" },
        context,
      ),
    ).toHaveLength(1);
    expect(
      validateDirection(
        {
          kind: "column",
          actor: qin,
          from: "xianyang",
          to: "shangdang",
          count: 0,
        },
        context,
      ),
    ).toHaveLength(1);
  });
});

describe("the places check", () => {
  it("requires every home and every key a chapter names, and reports what the map lacks", () => {
    const required = requiredPlaceKeys();
    for (const home of Object.values(HOMES)) expect(required).toContain(home);
    for (const key of required) expect(GAZETTEER).toHaveProperty(key);
    expect(checkPlaces(worldPlaces()).missing).toEqual([]);
    const partial = new MemoryPlaces(
      required.filter((key) => key !== "hangu" && key !== "linzi"),
    );
    const check = checkPlaces(partial);
    expect(check.missing).toEqual(["hangu", "linzi"]);
    expect(check.present).toHaveLength(required.length - 2);
    expect(
      checkPlaces(new MemoryPlaces([...required, "atlantis"])).extra,
    ).toEqual(["atlantis"]);
  });

  it("lists the corridor chapter's keys from both languages plus its homes", () => {
    const keys = chapterPlaceKeys(CORRIDOR_STATES.id);
    for (const key of [
      "xianyang",
      "handan",
      "linzi",
      "shangdang",
      "taihang",
      "changping",
      "hangu",
      "river",
    ]) {
      expect(keys).toContain(key);
    }
    expect(chapterPlaceKeys("nowhere")).toEqual([]);
    expect(
      listScenarioTexts().every((text) => chapterPlaceKeys(text.id).length > 0),
    ).toBe(true);
  });
});

describe("mentions", () => {
  it("weighs places by name under the run's naming and language, states at a quarter weight on their court", () => {
    const en = mentionsOf({
      texts: [
        "March to Shangdang. Shangdang holds. Zhao watches from Handan; Ji is far.",
      ],
      naming: "chronicle",
      language: "en",
    });
    expect(en.get("shangdang")).toBe(2);
    expect(en.get("handan")).toBe(1.25);
    expect(
      mentionsOf({
        texts: ["Zhao, Zhao, Zhao; Shangdang."],
        naming: "chronicle",
        language: "en",
      }).get("handan"),
    ).toBe(0.25);
    expect(en.get("ji")).toBe(1);
    expect(en.get("jixia")).toBeUndefined();
    const masked = mentionsOf({
      texts: ["A column to Tallgate."],
      naming: "masked",
      language: "en",
    });
    expect(masked.get("shangdang")).toBe(1);
    const zh = mentionsOf({
      texts: ["秦军入上党，上党守将请援于邯郸。"],
      naming: "chronicle",
      language: "zh",
    });
    expect(zh.get("shangdang")).toBe(2);
    expect(zh.get("handan")).toBe(1);
    expect(zh.get("xianyang")).toBe(0.25);
  });
});

describe("cueHits", () => {
  it("reads a decision for the cue words of each kind", () => {
    const hits = cueHits(
      "Send an envoy with gold; march a column to the pass.",
    );
    const of = (kind: string) => hits.find((hit) => hit.kind === kind)!;
    expect(of("envoy").hits).toBeGreaterThan(0);
    expect(of("gold").hits).toBeGreaterThan(0);
    expect(of("column").hits).toBeGreaterThan(0);
    expect(of("flood").hits).toBe(0);
  });
});

describe("fallbackStage", () => {
  it("produces a valid script on a run fixture, with the beat skeleton per turn and the debrief", async () => {
    const script = await fallbackStage({
      run: fixture(),
      scenario,
      now: "2026-08-24T00:00:00.000Z",
    });
    expect(script.id).toBe("run_stage");
    expect(script.model).toBe("stagings");
    expect(script.source).toBe("fallback");
    expect(validateScript(script, worldPlaces())).toEqual([]);
    expect(Object.keys(script.seats)).toEqual(["qin", "zhao", "qi"]);
    expect(script.seats.qin).toEqual({
      state: "qin",
      home: "xianyang",
      model: "model-a",
    });
    const ids = script.beats.map((beat) => beat.id);
    expect(ids).toEqual([
      "t1.inject",
      "t1.brief.qin",
      "t1.brief.zhao",
      "t1.brief.qi",
      "t1.verdict",
      "t1.narrative",
      "t2.inject",
      "t2.brief.qin",
      "t2.brief.zhao",
      "t2.brief.qi",
      "t2.verdict",
      "t2.narrative",
      "debrief",
    ]);
    expect(script.places).toContain("shangdang");
    expect(script.usage).toBeUndefined();
    expect(script.fallbackTurns).toBeUndefined();
  });

  it("reads the decisions: an envoy walks court to court, a column marches to the named place, a quiet seat idles", async () => {
    const script = await fallbackStage({ run: fixture(), scenario });
    const beat = (id: string): StageBeat =>
      script.beats.find((entry) => entry.id === id)!;
    const qin = beat("t1.brief.qin").directions[0];
    expect(qin).toMatchObject({
      kind: "envoy",
      actor: { seat: "qin", archetype: "envoy" },
      from: "xianyang",
      to: "handan",
      against: "zhao",
      effect: "scroll",
    });
    expect(beat("t1.brief.qin").cues).toContain("envoy");
    expect(beat("t1.brief.qin").directions).toHaveLength(1);
    const zhao = beat("t1.brief.zhao").directions;
    // the seat's own words reach above the rung's band: a column marches
    expect(zhao).toHaveLength(1);
    expect(zhao[0]).toMatchObject({
      kind: "column",
      from: "handan",
      to: "shangdang",
      count: 6,
      effect: "dust",
    });
    expect(zhao[0].against).toBeUndefined();
    const qi = beat("t1.brief.qi").directions[0];
    expect(qi).toMatchObject({ kind: "idle", at: "linzi" });
    // rung 1: no consequence and no investment below band 4
    expect(beat("t1.narrative").directions).toEqual([]);
    const qinTwo = beat("t2.brief.qin").directions[0];
    expect(qinTwo).toMatchObject({
      kind: "column",
      from: "xianyang",
      to: "shangdang",
    });
    expect(beat("t2.brief.qi").directions[0]).toMatchObject({
      kind: "granary-close",
      at: "linzi",
      effect: "bar",
    });
    expect(beat("t2.verdict").rung).toBe(6);
    const narrative = beat("t2.narrative");
    expect(narrative.rung).toBe(6);
    expect(narrative.directions).toHaveLength(1);
    expect(narrative.directions[0]).toMatchObject({
      kind: "battle",
      at: "shangdang",
      actor: { seat: "qin" },
      against: "zhao",
    });
    expect(narrative.focus).toBe("shangdang");
  });

  it("marks an unscored turn and skips the verdict when the turn was not adjudicated", async () => {
    const unscored = run(
      [
        {
          ...turn(
            1,
            [
              brief("qin", "Wait."),
              brief("zhao", "Wait."),
              brief("qi", "Wait."),
            ],
            0,
          ),
          adjudication: {
            panel: [],
            mode: "median",
            escalation: 0,
            unscored: true,
            narrative: "",
          },
        },
        turn(2, [
          brief("qin", "Wait."),
          brief("zhao", "Wait."),
          brief("qi", "Wait."),
        ]),
      ],
      "active",
    );
    const script = await fallbackStage({ run: unscored, scenario });
    const verdict = script.beats.find((beat) => beat.id === "t1.verdict")!;
    expect(verdict.unscored).toBe(true);
    expect(verdict.rung).toBeUndefined();
    expect(script.beats.some((beat) => beat.id === "t2.verdict")).toBe(false);
    expect(script.beats.some((beat) => beat.kind === "debrief")).toBe(false);
  });

  it("refuses a place list that lacks a home", async () => {
    await expect(
      fallbackStage({
        run: fixture(),
        scenario,
        places: new MemoryPlaces(["handan", "linzi"]),
      }),
    ).rejects.toThrow(/not on the map/);
  });
});

describe("weaveTurn", () => {
  const seats: Record<string, StageSeat> = {
    qin: { home: "xianyang", model: "a" },
    zhao: { home: "handan", model: "b" },
    qi: { home: "linzi", model: "c" },
  };
  const column = (seat: string, to: string): StageDirection => ({
    kind: "column",
    actor: { seat, archetype: "infantry" },
    from: seats[seat].home,
    to,
    count: 6,
  });

  it("meets two columns at one place as a battle from band 6, a raid at 5, a standoff at 4, nothing below", () => {
    const meet = (band: number) =>
      weaveTurn({
        directions: [column("qin", "shangdang"), column("zhao", "shangdang")],
        band,
        focus: "shangdang",
        seats,
      });
    const battle = meet(6);
    expect(battle).toHaveLength(1);
    expect(battle[0]).toMatchObject({
      kind: "battle",
      at: "shangdang",
      actor: { seat: "qin" },
      against: "zhao",
    });
    expect(meet(5)[0]).toMatchObject({
      kind: "raid",
      from: "xianyang",
      to: "shangdang",
      against: "zhao",
    });
    expect(meet(4).map((direction) => direction.kind)).toEqual([
      "garrison",
      "garrison",
    ]);
    // below band 4 nothing meets; the band's own consequence plays instead
    expect(meet(3).map((direction) => direction.kind)).toEqual([
      "granary-close",
    ]);
  });

  it("steps a route consequence down a band when the escalator is already at the focus", () => {
    // zhao alone escalates at its own court: a raid needs a road from
    // elsewhere, so the band-4 garrison stands in, placed at the focus
    const derived = weaveTurn({
      directions: [
        {
          kind: "wall-build",
          actor: { seat: "zhao", archetype: "labourer" },
          at: "handan",
          count: 6,
        },
      ],
      band: 5,
      focus: "handan",
      seats,
    });
    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({ kind: "garrison", at: "handan" });
    expect(derived[0]).not.toHaveProperty("from");
    // two columns on a court: the holder defends
    expect(
      weaveTurn({
        directions: [column("qin", "handan"), column("qi", "handan")],
        band: 6,
        focus: "handan",
        seats,
      })[0],
    ).toMatchObject({
      kind: "battle",
      actor: { seat: "qin" },
      against: "zhao",
    });
  });

  it("invests another seat's court by band", () => {
    const at = (band: number) =>
      weaveTurn({
        directions: [column("qin", "handan")],
        band,
        focus: "handan",
        seats,
      })[0];
    expect(at(7)).toMatchObject({
      kind: "sack",
      at: "handan",
      against: "zhao",
    });
    expect(at(6).kind).toBe("siege");
    expect(at(5).kind).toBe("gates-taken");
    expect(at(4).kind).toBe("garrison");
  });

  it("plays the band's consequence at the focus when nothing converges, and nothing at the low bands", () => {
    const envoy: StageDirection = {
      kind: "envoy",
      actor: { seat: "qin", archetype: "envoy" },
      from: "xianyang",
      to: "handan",
    };
    expect(
      weaveTurn({ directions: [envoy], band: 1, focus: "handan", seats }),
    ).toEqual([]);
    const raid = weaveTurn({
      directions: [envoy],
      band: 5,
      focus: "handan",
      seats,
    });
    expect(raid[0]).toMatchObject({
      kind: "raid",
      from: "xianyang",
      to: "handan",
      actor: { seat: "qin" },
      against: "zhao",
    });
    expect(raid[0].at).toBeUndefined();
    expect(weaveTurn({ directions: [], focus: "handan", seats })).toEqual([]);
  });
});

describe("randomStage", () => {
  it("is valid, seeded, and different across seeds", async () => {
    const one = await randomStage({ run: fixture(), scenario, seed: 1 });
    const again = await randomStage({ run: fixture(), scenario, seed: 1 });
    const two = await randomStage({ run: fixture(), scenario, seed: 2 });
    expect(one.id).toBe("run_stage.random1");
    expect(one.source).toBe("random");
    expect(one.seed).toBe(1);
    expect(validateScript(one, worldPlaces())).toEqual([]);
    expect(validateScript(two, worldPlaces())).toEqual([]);
    const kinds = (script: typeof one) =>
      script.beats
        .filter((beat) => beat.kind === "brief")
        .flatMap((beat) =>
          beat.directions.map(
            (direction) => `${direction.kind}:${direction.to ?? direction.at}`,
          ),
        );
    expect(kinds(one)).toEqual(kinds(again));
    expect(kinds(one)).not.toEqual(kinds(two));
    // the verdict is the record's, not random
    expect(one.beats.find((beat) => beat.id === "t2.verdict")?.rung).toBe(6);
  });

  it("names its variant", () => {
    expect(stagingId("run_x")).toBe("run_x");
    expect(stagingId("run_x", "random3")).toBe("run_x.random3");
  });
});

describe("buildStageScript (the coder)", () => {
  const reply = (
    seatsDirections: Record<string, unknown[]>,
    focus = "handan",
    consequence: unknown[] = [],
  ) => ({
    focus,
    seats: Object.entries(seatsDirections).map(([seat, directions]) => ({
      seat,
      directions,
    })),
    consequence,
  });
  const good = () =>
    reply({
      qin: [
        {
          kind: "envoy",
          seat: "qin",
          archetype: "envoy",
          from: "xianyang",
          to: "handan",
          at: null,
          against: "zhao",
          count: null,
          effect: "scroll",
        },
      ],
      zhao: [
        {
          kind: "column",
          seat: "zhao",
          archetype: "infantry",
          from: "handan",
          to: "shangdang",
          at: null,
          against: null,
          count: 6,
          effect: "dust",
        },
      ],
      qi: [
        {
          kind: "idle",
          seat: "qi",
          archetype: "court",
          from: null,
          to: null,
          at: null,
          against: null,
          count: null,
          effect: null,
        },
      ],
    });

  const client = (
    replies: unknown[],
  ): LlmClient & { calls: LlmOperateOptions[]; prompts: string[] } => {
    const calls: LlmOperateOptions[] = [];
    const prompts: string[] = [];
    return {
      calls,
      prompts,
      async operate(prompt: string, options?: LlmOperateOptions) {
        calls.push(options ?? {});
        prompts.push(prompt);
        const content = replies.shift() ?? good();
        return {
          content,
          usage: [
            {
              input: 10,
              output: 5,
              reasoning: 0,
              total: 15,
              model: "coder",
              usd: 0.001,
            },
          ],
        };
      },
    };
  };

  it("codes each turn through the seam with a constrained format and stamps usage", async () => {
    const llm = client([good(), good()]);
    const script = await buildStageScript({
      run: fixture(),
      scenario,
      llm,
      model: "coder",
    });
    expect(script.source).toBe("coder");
    expect(script.coder).toBe("coder");
    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[0].model).toBe("coder");
    expect(llm.calls[0].system).toContain("stage coder");
    expect(llm.calls[0].system).toContain("- envoy (band 1, from + to");
    expect(llm.calls[0].system).toContain("- xianyang: Xianyang");
    expect(llm.prompts[0]).toContain("Send an envoy to Handan");
    const format = llm.calls[0].format as {
      properties: { focus: { enum: string[] } };
    };
    expect(format.properties.focus.enum).toContain("shangdang");
    expect(format.properties.focus.enum).not.toContain("kuaiji");
    expect(script.usage).toHaveLength(2);
    expect(script.fallbackTurns).toBeUndefined();
    const beat = script.beats.find((entry) => entry.id === "t1.brief.zhao")!;
    expect(beat.directions[0]).toMatchObject({
      kind: "column",
      from: "handan",
      to: "shangdang",
      count: 6,
      effect: "dust",
    });
    expect(beat.fallback).toBeUndefined();
    expect(validateScript(script, worldPlaces())).toEqual([]);
  });

  it("retries once with the errors on the history, then falls back for the turn and marks its beats", async () => {
    const bad = reply({
      qin: [
        {
          kind: "envoy",
          seat: "qin",
          archetype: "envoy",
          from: "xianyang",
          to: "atlantis",
          at: null,
          against: null,
          count: null,
          effect: null,
        },
      ],
      zhao: [
        {
          kind: "idle",
          seat: "zhao",
          archetype: "court",
          from: null,
          to: null,
          at: null,
          against: null,
          count: null,
          effect: null,
        },
      ],
      qi: [
        {
          kind: "idle",
          seat: "qi",
          archetype: "court",
          from: null,
          to: null,
          at: null,
          against: null,
          count: null,
          effect: null,
        },
      ],
    });
    const llm = client([bad, bad, good()]);
    const invalid: { turn: number; attempt: number; errors: string[] }[] = [];
    const script = await buildStageScript({
      run: fixture(),
      scenario,
      llm,
      model: "coder",
      onInvalid: (event) => invalid.push(event),
    });
    expect(llm.calls).toHaveLength(3);
    expect(llm.calls[1].history).toHaveLength(2);
    expect(llm.prompts[1]).toContain('"to" names "atlantis"');
    expect(invalid.map((event) => event.attempt)).toEqual([1, 2]);
    expect(script.fallbackTurns).toEqual([1]);
    expect(
      script.beats.find((entry) => entry.id === "t1.brief.qin")?.fallback,
    ).toBe(true);
    expect(
      script.beats.find((entry) => entry.id === "t1.narrative")?.fallback,
    ).toBe(true);
    expect(
      script.beats.find((entry) => entry.id === "t2.brief.qin")?.fallback,
    ).toBeUndefined();
    expect(script.usage).toHaveLength(3);
    expect(validateScript(script, worldPlaces())).toEqual([]);
  });

  it("reads a fenced JSON string and refuses a missing seat", async () => {
    const asText = "```json\n" + JSON.stringify(good()) + "\n```";
    const missing = reply({ qin: good().seats[0].directions });
    const llm = client([asText, missing, missing]);
    const script = await buildStageScript({
      run: fixture(),
      scenario,
      llm,
      model: "coder",
    });
    expect(script.fallbackTurns).toEqual([2]);
    expect(llm.prompts[2]).toContain('"zhao" is missing');
  });

  it("is built from a Run after the game: its inputs are the record, never a prompt's", () => {
    // the coder takes { run, scenario, llm, model }; nothing it reads is an
    // input of elicitBrief, and nothing it writes is read by one
    const options: Parameters<typeof buildStageScript>[0] = {
      run: fixture(),
      scenario,
      llm: client([]),
      model: "coder",
    };
    expect(Object.keys(options).sort()).toEqual([
      "llm",
      "model",
      "run",
      "scenario",
    ]);
  });
});

describe("placesOfTiledMap", () => {
  it("reads the names on the places object layer, through groups, and refuses a map without one", async () => {
    const { placesOfTiledMap, placeObjectsOf } = await import("../stage");
    const map = {
      width: 4,
      height: 4,
      layers: [
        { name: "ground", type: "tilelayer" },
        {
          name: "markers",
          type: "group",
          layers: [
            {
              name: "places",
              type: "objectgroup",
              objects: [
                { name: "xianyang", x: 16, y: 32 },
                { name: "", x: 0, y: 0 },
                { name: "handan", x: 48, y: 16, type: "court" },
              ],
            },
          ],
        },
      ],
    };
    expect(placeObjectsOf(map).map((object) => object.name)).toEqual([
      "xianyang",
      "handan",
    ]);
    const places = placesOfTiledMap(map);
    expect(places.has("handan")).toBe(true);
    expect(places.has("linzi")).toBe(false);
    expect(() =>
      placesOfTiledMap({ layers: [{ name: "ground", type: "tilelayer" }] }),
    ).toThrow(/places/);
  });
});
