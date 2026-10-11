import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  Language,
  StageBeat,
  StageDirection,
  StageSequence,
} from "../../lib/types";
import {
  SEASON_LABELS,
  TASK_SHARE,
  monthOfToday,
  monthRecord,
  parseMonth,
  type Cite,
  type Month,
  type MonthPlan,
  type Rite,
  type Task,
} from "../../stage/almanac";
import { DIRECTION_RULES } from "../../stage/catalog";
import {
  clockLabel,
  parseHour,
  SHICHEN,
  type SiteClock,
} from "../../stage/clock";
import type { Localized } from "../../stage/legend";
import { MonthStrip } from "../../stage/MonthStrip";
import type { Figure } from "../../stage/populace";
import {
  isPresent,
  ORDER_OF_ROLE,
  registerAt,
  villagersOf,
  type RegisterState,
} from "../../stage/register";
import { STAGE_SETS, stageSetOf } from "../../stage/sets";
import {
  ORDER_LABELS,
  siteMapOf,
  type Household,
  type Order,
  type Site as SiteRecord,
  type SiteEvent,
  type Townsperson,
  type Villager,
} from "../../stage/sites";
import { Stage } from "../../stage/Stage";

// A site of the period on the same stage as the overworld, walked by its own
// people: the city, the village, or the house, each a record in
// `stage/sites/`. Nothing here is a game: no seat marches to a site and no
// chapter is set in one. The page keeps the stage's beat queue fed from the
// site's year (`stage/almanac.ts`, `stage/sites/years/`): most beats are the
// month's tasks, the rest strolls drawn at random from the site's people, and
// the month's rites play once when it opens, so it reads as inhabited rather
// than as a plan, and as a month rather than as one undated day. `?month=`
// picks the month; it opens on the Xia month of today's date.

const VIEW = { width: 960, height: 640 };
/** beats kept in flight; the scene plays one at a time and the page tops up on idle */
const AHEAD = 3;
/** how many lines of the site's day the page keeps */
const LOG = 8;

const seatOf = (site: SiteRecord, person: Townsperson): string =>
  `${site.seat}:${person.archetype}`;

const pick = <T,>(list: readonly T[]): T =>
  list[Math.floor(Math.random() * list.length)];

interface Line {
  id: string;
  en: string;
  zh: string;
}

/** one random thing a townsperson does: a stroll between places or a spell at work */
/** The count words a log line uses; a stroll is never more than three. */
const NUMBERS = ["", "One", "Two", "Three"];

/** The English plural of a townsperson's label. */
const pluralOf = (label: string): string => {
  const last = label.split(" ").pop() ?? label;
  const stem = label.slice(0, label.length - last.length);
  if (last === "child") return `${stem}children`;
  if (last === "ox") return `${stem}oxen`;
  return `${label}s`;
};

/** A task drawn by weight: a task of weight 3 is drawn three times as often as one of 1. */
const weightedTask = (tasks: readonly Task[]): Task => {
  const total = tasks.reduce((sum, task) => sum + (task.weight ?? 1), 0);
  let roll = Math.random() * total;
  for (const task of tasks) {
    roll -= task.weight ?? 1;
    if (roll < 0) return task;
  }
  return tasks[tasks.length - 1];
};

/** The first of the site's people of an archetype; the year is held to name only these. */
const personOf = (
  site: SiteRecord,
  archetype: Townsperson["archetype"],
): Townsperson | undefined =>
  site.folk.find((person) => person.archetype === archetype);

/** One of the month's tasks as a beat, with its own line for the log. */
const taskBeat = (
  site: SiteRecord,
  task: Task,
  n: number,
): { beat: StageBeat; line: Line } | null => {
  const person = personOf(site, task.who);
  if (!person) return null;
  const seat = seatOf(site, person);
  const actor = { seat, archetype: person.archetype };
  const count = task.count && task.count > 1 ? { count: task.count } : {};
  const direction: StageDirection =
    DIRECTION_RULES[task.kind].places === "route"
      ? { kind: task.kind, actor, from: task.from, to: task.to, ...count }
      : {
          kind: task.kind,
          actor,
          at: task.at,
          ...count,
          effect:
            task.effect ??
            (task.kind === "labour" && task.at && site.smoking.includes(task.at)
              ? "smoke"
              : undefined),
        };
  return {
    beat: {
      id: `${site.id}.${n}`,
      kind: "scene",
      turn: n,
      seat,
      title: person.label.en,
      directions: [direction],
    },
    line: { id: `line.${n}`, ...task.line },
  };
};

/** A rite of the month as a beat: the observance at its place, the banner over it. */
const riteBeat = (
  site: SiteRecord,
  rite: Rite,
  n: number,
): { beat: StageBeat; line: Line } | null => {
  const person = personOf(site, rite.who);
  if (!person) return null;
  const seat = seatOf(site, person);
  return {
    beat: {
      id: `${site.id}.${n}`,
      kind: "scene",
      turn: n,
      seat,
      title: rite.title.en,
      directions: [
        {
          kind: "rite",
          actor: { seat, archetype: person.archetype },
          at: rite.at,
          ...(rite.count && rite.count > 1 ? { count: rite.count } : {}),
          effect: rite.effect ?? "banner",
        },
      ],
    },
    line: { id: `line.${n}`, ...rite.line },
  };
};

const nextBeat = (
  site: SiteRecord,
  plan: MonthPlan,
  n: number,
): { beat: StageBeat; line: Line } => {
  // most beats are the month's own work; the rest keep the streets walked
  if (plan.tasks.length && Math.random() < TASK_SHARE) {
    const drawn = taskBeat(site, weightedTask(plan.tasks), n);
    if (drawn) return drawn;
  }
  const person = pick(site.folk);
  const seat = seatOf(site, person);
  const home = person.home;
  const atWork = home !== undefined && Math.random() < 0.4;
  const direction: StageDirection = atWork
    ? {
        kind: "labour",
        actor: { seat, archetype: person.archetype },
        at: home,
        ...(site.smoking.includes(home) ? { effect: "smoke" } : {}),
      }
    : (() => {
        const from = home ?? pick(site.strollPlaces);
        let to = pick(site.strollPlaces);
        while (to === from) to = pick(site.strollPlaces);
        const count =
          person.order === "household" || person.order === "farmer"
            ? 1 + Math.floor(Math.random() * 3)
            : 1;
        return {
          kind: "stroll",
          actor: { seat, archetype: person.archetype },
          from,
          to,
          ...(count > 1 ? { count } : {}),
        };
      })();
  // a labour without smoke still carries the rule's default effect unless
  // the direction names none, so it is stripped here rather than in the rule
  if (direction.kind === "labour" && !direction.effect) {
    direction.effect = undefined;
  }
  const name = (key: string, language: Language) => {
    const label = site.names[key]?.[language] ?? key;
    // the English names carry their own article unevenly ("The Great Hall",
    // "the river fields", "Market Well"), so the line supplies one
    return language === "en" ? label.replace(/^the /i, "") : label;
  };
  const count = direction.kind === "stroll" ? (direction.count ?? 1) : 1;
  const who =
    count > 1
      ? `${NUMBERS[count]} ${pluralOf(person.label.en)}`
      : `The ${person.label.en}`;
  const line: Line =
    direction.kind === "labour"
      ? {
          id: `line.${n}`,
          en: `${who} works at the ${name(direction.at!, "en")}.`,
          zh: `${person.label.zh}于${name(direction.at!, "zh")}劳作。`,
        }
      : {
          id: `line.${n}`,
          en: `${who} ${count > 1 ? "go" : "goes"} from the ${name(direction.from!, "en")} to the ${name(direction.to!, "en")}.`,
          zh: `${person.label.zh}${count > 1 ? `${count}人` : ""}自${name(direction.from!, "zh")}往${name(direction.to!, "zh")}。`,
        };
  return {
    beat: {
      id: `${site.id}.${n}`,
      kind: "scene",
      turn: n,
      seat,
      title: person.label.en,
      directions: [direction],
    },
    line,
  };
};

export function Site({ site }: { site: SiteRecord }) {
  const [params, setParams] = useSearchParams();
  const set = stageSetOf(params.get("set"));
  const [language, setLanguage] = useState<Language>("en");
  // a registered site runs its people on a clock rather than on a beat feed
  const registered = site.register !== undefined;
  const openHour = parseHour(params.get("hour"));
  const openEvent = params.get("event") ?? undefined;
  const [clock, setClock] = useState<SiteClock | null>(null);
  const [nextEvent, setNextEvent] = useState<SiteEvent | undefined>();
  const [paused, setPaused] = useState(false);
  const [jump, setJump] = useState<
    { key: number; hour?: number; event?: string } | undefined
  >();
  const [walking, setWalking] = useState(true);
  const [follow, setFollow] = useState(false);
  const [roofs, setRoofs] = useState(true);
  const [beats, setBeats] = useState<StageBeat[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const counter = useRef(0);
  const played = useRef(0);
  const month = parseMonth(params.get("month")) ?? monthOfToday();
  const plan = site.year[month];
  const record = monthRecord(month);
  const state = useMemo<RegisterState | null>(
    () => (registered ? registerAt(site, month) : null),
    [site, month, registered],
  );
  const folk = useMemo(() => villagersOf(site), [site]);
  const eventsOfMonth = useMemo(
    () =>
      (site.events ?? [])
        .filter((event) => event.month === month)
        .sort((a, b) => a.day - b.day || a.hour - b.hour),
    [site, month],
  );
  const villagerOf = useCallback(
    (id: string): { villager: Villager; household?: Household } | undefined => {
      for (const household of state?.register ?? []) {
        const villager = household.members.find((m) => m.id === id);
        if (villager) return { villager, household };
      }
      const visitor = state?.visitors.find((v) => v.id === id);
      return visitor ? { villager: visitor } : undefined;
    },
    [state],
  );
  const onClock = useCallback((next: SiteClock, upcoming?: SiteEvent) => {
    setClock(next);
    setNextEvent(upcoming);
  }, []);
  const onLine = useCallback(
    (line: Localized, at: SiteClock, figure?: Figure) => {
      const id = `${figure?.id ?? "event"}.${at.day}.${at.hour.toFixed(2)}`;
      setLines((list) =>
        [{ id, en: line.en, zh: line.zh }, ...list].slice(0, LOG),
      );
    },
    [],
  );
  // a jump is addressable: `?event=` and `?hour=` open the clock the same way
  const jumpTo = (target: { hour?: number; event?: string }) => {
    setJump({ key: Date.now(), ...target });
    setParams(
      (next) => {
        next.delete("event");
        next.delete("hour");
        if (target.event) next.set("event", target.event);
        else if (target.hour !== undefined)
          next.set("hour", String(Math.floor(target.hour)));
        return next;
      },
      { replace: true },
    );
  };
  // the month's rites play once, when it opens; the ref is armed by the month
  const ritesDue = useRef(true);
  const setMonth = (next: Month | null) =>
    setParams(
      (params) => {
        if (next === null) params.delete("month");
        else params.set("month", String(next));
        return params;
      },
      { replace: true },
    );

  const names = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(site.names).map(([key, label]) => [
          key,
          label[language],
        ]),
      ),
    [site, language],
  );
  const seatNames = useMemo(
    () =>
      Object.fromEntries(
        folk.map((person) => [seatOf(site, person), person.label[language]]),
      ),
    [site, folk, language],
  );
  const colors = useMemo(
    () => Object.fromEntries(folk.map((person) => [seatOf(site, person), 0])),
    [site, folk],
  );
  const script = useMemo<StageSequence>(
    () => ({
      id: `${site.id}.${language}`,
      model: "authored",
      language,
      naming: "chronicle",
      createdAt: "2026-09-06",
      seats: Object.fromEntries(
        folk.map((person) => [
          seatOf(site, person),
          { home: person.home ?? site.strollPlaces[0], model: "authored" },
        ]),
      ),
      places: Object.keys(site.names),
      beats: [],
    }),
    [site, folk, language],
  );

  const feed = useCallback(
    (count: number) => {
      const next: StageBeat[] = [];
      const said: Line[] = [];
      if (ritesDue.current) {
        ritesDue.current = false;
        for (const rite of plan.rites ?? []) {
          counter.current += 1;
          const drawn = riteBeat(site, rite, counter.current);
          if (!drawn) continue;
          next.push(drawn.beat);
          said.push(drawn.line);
        }
      }
      for (let i = 0; i < count; i += 1) {
        counter.current += 1;
        const { beat, line } = nextBeat(site, plan, counter.current);
        next.push(beat);
        said.push(line);
      }
      setBeats((list) => [...list, ...next]);
      setLines((list) => [...said.reverse(), ...list].slice(0, LOG));
    },
    [site, plan],
  );

  // a new month empties the day and opens with its rites; before the map is
  // ready the counter is still zero and `onReady` feeds the first beats
  useEffect(() => {
    ritesDue.current = true;
    setBeats([]);
    setLines([]);
    if (walking && counter.current > 0) feed(AHEAD);
    // feed and walking are read at the moment the month turns, on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, site]);

  // the scene reports idle when its queue runs dry; the town keeps walking
  // as long as the switch is on, one beat ahead of the reader's patience
  const onIdle = useCallback(() => {
    played.current = counter.current;
    if (walking && !registered) feed(1);
  }, [walking, feed, registered]);

  // the scene reports idle only after a beat has played, so the first beats
  // are fed when the map is ready; a paused town stays still until woken
  const onReady = useCallback(() => {
    if (walking && !registered && counter.current === 0) feed(AHEAD);
  }, [walking, feed, registered]);

  const start = () => {
    setWalking(true);
    if (!registered) feed(AHEAD);
  };

  const byOrder = useMemo(() => {
    const groups = new Map<Order, Townsperson[]>();
    for (const person of folk) {
      const list = groups.get(person.order) ?? [];
      list.push(person);
      groups.set(person.order, list);
    }
    return [...groups.entries()];
  }, [folk]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/world" className="hover:text-white">
            The World
          </Link>
          {" › "}
          {site.crumb}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {site.title[language]}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">{site.intro}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ToggleGroup
            options={[
              { value: "en", label: "en" },
              { value: "zh", label: "zh" },
            ]}
            value={language}
            onPick={(value) => {
              setLanguage(value as Language);
              setBeats([]);
              setLines([]);
            }}
          />
          <ToggleGroup
            options={STAGE_SETS.map((option) => ({
              value: option.id,
              label: `${option.tile} px`,
            }))}
            value={set.id}
            onPick={(value) =>
              setParams(
                (next) => {
                  next.set("set", value);
                  return next;
                },
                { replace: true },
              )
            }
          />
          {!registered && (
            <button
              type="button"
              onClick={() => (walking ? setWalking(false) : start())}
              className={clsx(
                "cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal",
                walking ? "text-white" : "text-zinc-400",
              )}
            >
              {walking ? site.words.awake : site.words.wake}
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-x-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
              className="cursor-pointer accent-brand-terminal"
            />
            follow the people
          </label>
          <MonthStrip month={month} language={language} onPick={setMonth} />
          {site.words.roofs && (
            <label className="flex cursor-pointer items-center gap-x-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
              <input
                type="checkbox"
                checked={!roofs}
                onChange={(event) => setRoofs(!event.target.checked)}
                className="cursor-pointer accent-brand-terminal"
              />
              {site.words.roofs}
            </label>
          )}
        </div>
      </header>

      <section aria-label={`${site.crumb} map`} className="mt-8">
        <Stage
          script={script}
          beats={beats}
          names={names}
          seatNames={seatNames}
          colors={colors}
          language={language}
          view={VIEW}
          interactive
          follow={follow}
          roofs={roofs}
          month={month}
          flags={false}
          set={set.id}
          eyebrow={false}
          map={siteMapOf(site, set)}
          featureNotes={site.features}
          onIdle={onIdle}
          onReady={onReady}
          populace={
            registered ? { site, hour: openHour, event: openEvent } : undefined
          }
          paused={paused}
          jump={jump}
          onClock={registered ? onClock : undefined}
          onLine={registered ? onLine : undefined}
          renderFigure={
            registered
              ? (id, close) => {
                  const found = villagerOf(id);
                  if (!found) return null;
                  return (
                    <FigureCard
                      villager={found.villager}
                      household={found.household}
                      state={state}
                      language={language}
                      onClose={close}
                    />
                  );
                }
              : undefined
          }
        />
        {registered ? (
          <ClockStrip
            clock={clock}
            paused={paused}
            next={nextEvent}
            language={language}
            onPause={() => setPaused((p) => !p)}
            onHour={(hour) => jumpTo({ hour })}
            onSkip={() => nextEvent && jumpTo({ event: nextEvent.id })}
          />
        ) : (
          beats.length === 0 && (
            <FirstStep note={site.words.firstStep} onStart={start} />
          )
        )}
      </section>

      <MonthCard record={record} plan={plan} language={language} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section
          aria-label={site.words.day.en}
          className="rounded-sm border border-white/10 bg-black/20 p-5"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            {site.words.day[language]}
          </h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              {site.words.nothing[language]}
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {lines.map((line, index) => (
                <li
                  key={line.id}
                  className={clsx(
                    "text-sm",
                    index === 0 ? "text-zinc-200" : "text-zinc-500",
                  )}
                >
                  {line[language]}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          aria-label="Who lives here"
          className="rounded-sm border border-white/10 bg-black/20 p-5"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            {site.words.folk[language]}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {site.words.folkNote[language]}
          </p>
          {state && (
            <RegisterPanel site={site} state={state} language={language} />
          )}
          {!state && (
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {byOrder.map(([order, people]) => (
                <div key={order}>
                  <dt className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                    {ORDER_LABELS[order][language]}
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-300">
                    {people
                      .map((person) => person.label[language])
                      .join(language === "zh" ? "、" : ", ")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      {registered && (
        <EventsPanel
          events={eventsOfMonth}
          language={language}
          onJump={(id) => jumpTo({ event: id })}
        />
      )}

      <section
        aria-label="Sources"
        className="mt-6 rounded-sm border border-white/10 bg-black/20 p-5"
      >
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          What the plan is drawn from
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          {site.sources.map((source) => (
            <li key={source.name}>
              <span className="text-zinc-200">{source.name}</span>
              {source.era && (
                <span className="ml-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                  {ERA_LABELS[source.era]?.[language] ?? source.era}
                </span>
              )}
              {source.text.startsWith(":") ? "" : " "}
              {source.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A lake citation as the page prints it: the document, the line, and what it is. */
const citeOf = (cite: Cite): string =>
  `${cite.id}${cite.line ? `:${cite.line}` : ""}${cite.note ? ` · ${cite.note}` : ""}`;

/**
 * The month: the almanac's record (the name, the terms, the pentads, the
 * ordinance) beside what this site does in it (the note, the rites, the
 * tasks), every line cited to the lake by id and line.
 */
function MonthCard({
  record,
  plan,
  language,
}: {
  record: ReturnType<typeof monthRecord>;
  plan: MonthPlan;
  language: Language;
}) {
  const zh = language === "zh";
  return (
    <section
      aria-label="The month"
      className="mt-6 grid gap-6 rounded-sm border border-white/10 bg-black/20 p-5 lg:grid-cols-2"
    >
      <div>
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          {zh ? "月令" : "The almanac"}
        </h2>
        <p className="mt-2 text-lg text-white">
          {record.name.zh}
          <span className="ml-2 text-sm text-zinc-400">
            {record.name.en} · {SEASON_LABELS[record.season][language]} ·{" "}
            {record.terms[language]}
          </span>
        </p>
        <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-plex-mono text-[11px] text-zinc-400">
          {record.pentads.map((pentad, index) => (
            <li key={index} title={pentad[zh ? "en" : "zh"]}>
              {pentad[language]}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-zinc-300">
          {record.ordinance[language]}
        </p>
        <p className="mt-3 font-plex-mono text-[10px] text-zinc-600">
          {record.sources.map(citeOf).join(" · ")}
        </p>
      </div>
      <div>
        <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          {zh ? "是月" : "This month here"}
        </h2>
        <p className="mt-2 text-sm text-zinc-300">{plan.note[language]}</p>
        {plan.rites && plan.rites.length > 0 && (
          <ul className="mt-3 space-y-2">
            {plan.rites.map((rite) => (
              <li key={rite.title.en} className="text-sm">
                <span className="text-zinc-100">{rite.title[language]}</span>
                <span className="text-zinc-400"> · {rite.line[language]}</span>
                <span className="block font-plex-mono text-[10px] text-zinc-600">
                  {citeOf(rite.cite)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <ul className="mt-3 space-y-1 text-sm text-zinc-500">
          {plan.tasks.map((task, index) => (
            <li key={index}>{task.line[language]}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FirstStep({ note, onStart }: { note: string; onStart: () => void }) {
  return (
    <p className="mt-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
      {note} ·{" "}
      <button
        type="button"
        onClick={onStart}
        className="cursor-pointer text-zinc-300 hover:text-white"
      >
        wake it now
      </button>
    </p>
  );
}

function ToggleGroup({
  options,
  value,
  onPick,
}: {
  options: { value: string; label: string }[];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-x-1 rounded-sm border border-white/10 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onPick(option.value)}
          className={clsx(
            "cursor-pointer rounded-sm px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase",
            option.value === value
              ? "bg-white/10 text-white"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** the eras a source is marked by: the period's own witnesses, and the Han ones read for the customs */
const ERA_LABELS: Record<string, Localized> = {
  "warring-states": { en: "period", zh: "戰國" },
  qin: { en: "Qin", zh: "秦" },
  han: { en: "Han witness", zh: "漢人所記" },
  later: { en: "later", zh: "後世" },
};

/** the relation words of the register, rendered for the reader */
const ageLabel = (age: Villager["age"], language: Language): string =>
  language === "zh"
    ? age
    : age === "大"
      ? "adult"
      : age === "小"
        ? "minor"
        : "old";

/**
 * The clock under the map: the day and the double-hour, a pause, the twelve
 * hours to jump to, and a skip to the month's next event.
 */
function ClockStrip({
  clock,
  paused,
  next,
  language,
  onPause,
  onHour,
  onSkip,
}: {
  clock: SiteClock | null;
  paused: boolean;
  next: SiteEvent | undefined;
  language: Language;
  onPause: () => void;
  onHour: (hour: number) => void;
  onSkip: () => void;
}) {
  const zh = language === "zh";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
      <button
        type="button"
        onClick={onPause}
        className="cursor-pointer rounded-sm border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/5 hover:text-white"
        aria-label={paused ? (zh ? "續" : "resume") : zh ? "停" : "pause"}
      >
        {paused ? "▶" : "❚❚"}
      </button>
      <span className="text-zinc-300">
        {clock ? clockLabel(clock, language) : zh ? "候" : "waiting"}
      </span>
      <span className="flex items-center gap-x-0.5">
        {SHICHEN.map((s) => (
          <button
            key={s.hour}
            type="button"
            onClick={() => onHour(s.hour)}
            title={zh ? `${s.name.zh}時` : `${s.name.en}, ${s.span}`}
            className={clsx(
              "cursor-pointer rounded-sm px-1 py-0.5 hover:bg-white/10",
              clock && Math.floor(clock.hour) === s.hour
                ? "bg-white/10 text-white"
                : "text-zinc-500",
            )}
          >
            {s.name.zh}
          </button>
        ))}
      </span>
      {next && (
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer rounded-sm border border-white/10 px-2 py-1 text-zinc-300 hover:bg-white/5 hover:text-white"
        >
          ⏩ {next.title[language]}
        </button>
      )}
    </div>
  );
}

/** the card for a figure picked on the map: the register's entry */
function FigureCard({
  villager,
  household,
  state,
  language,
  onClose,
}: {
  villager: Villager;
  household?: Household;
  state: RegisterState | null;
  language: Language;
  onClose: () => void;
}) {
  const zh = language === "zh";
  const away = state?.away.get(villager.id);
  return (
    <div>
      <div className="flex items-start justify-between gap-x-3">
        <p className="font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
          {household
            ? zh
              ? `${household.surname}氏 · ${household.rank ?? ""}`
              : `${household.surname} household${household.rank ? ` · ${household.rank}` : ""}`
            : zh
              ? "客"
              : "visitor"}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={zh ? "关闭" : "Close"}
          className="-mt-1 cursor-pointer px-1 leading-none text-zinc-500 hover:text-white"
        >
          ×
        </button>
      </div>
      <h3 className="mt-1 text-sm font-medium text-white">
        {villager.name[language]}
        <span className="ml-2 font-normal text-zinc-400">
          {villager.name[zh ? "en" : "zh"]}
        </span>
      </h3>
      <p className="mt-2 text-xs text-zinc-300">
        {villager.relation} · {ageLabel(villager.age, language)} ·{" "}
        {ORDER_LABELS[ORDER_OF_ROLE[villager.role]][language]}
      </p>
      {away && (
        <p className="mt-1 text-xs text-zinc-500">
          {zh ? "本月不在" : "away this month"}
        </p>
      )}
      {household?.note && (
        <p className="mt-2 text-xs text-pretty text-zinc-500">
          {household.note[language]}
        </p>
      )}
    </div>
  );
}

/**
 * The register as the Liye slips write it: the households by 伍 where the
 * site groups them, else in the register's own order; each the head's rank
 * and name, then the members by relation and age class, the absent and the
 * struck marked.
 */
function RegisterPanel({
  site,
  state,
  language,
}: {
  site: SiteRecord;
  state: RegisterState;
  language: Language;
}) {
  const zh = language === "zh";
  const byId = new Map(state.register.map((h) => [h.id, h]));
  const groups: { title: string; households: Household[] }[] = site.wus
    ? [...site.wus]
        .sort((a, b) => a.order - b.order)
        .map((wu) => ({
          title: zh
            ? `第${wu.order}伍 · 伍老${nameOf(state, wu.wulao, language)}`
            : `Wu ${wu.order} · elder ${nameOf(state, wu.wulao, language)}`,
          households: wu.households
            .map((id) => byId.get(id))
            .filter((h): h is Household => h !== undefined),
        }))
    : [{ title: zh ? "戶籍" : "The register", households: state.register }];
  return (
    <div className="mt-4 space-y-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            {group.title}
          </p>
          <ul className="mt-1 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {group.households.map((household) => (
              <li key={household.id} className="text-sm">
                <span className="text-zinc-200">
                  {household.rank ? `${household.rank} ` : ""}
                  {zh ? `${household.surname}氏` : household.surname}
                </span>
                <span className="block text-xs text-zinc-400">
                  {household.members.map((member, index) => {
                    const struck = state.struck.has(member.id);
                    const away = state.away.has(member.id);
                    return (
                      <span key={member.id}>
                        {index > 0 ? (zh ? "、" : ", ") : ""}
                        <span
                          className={clsx(
                            struck && "line-through text-zinc-600",
                            !struck && away && "text-zinc-600",
                            !member.drawn && "italic",
                          )}
                          title={
                            struck
                              ? zh
                                ? "除籍"
                                : "struck off"
                              : away
                                ? zh
                                  ? "不在"
                                  : "away"
                                : `${member.relation} · ${ageLabel(member.age, language)}`
                          }
                        >
                          {member.relation}
                          {member.name[language]}
                          {member.age !== "大" ? `(${member.age})` : ""}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {state.visitors.length > 0 && (
        <div>
          <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            {zh ? "來客" : "Who comes"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {state.visitors
              .filter((v) => isPresent(state, v) || !v.drawn)
              .map((v) => `${v.name[language]}（${v.relation}）`)
              .join(zh ? "、" : ", ")}
          </p>
        </div>
      )}
    </div>
  );
}

const nameOf = (
  state: RegisterState,
  id: string,
  language: Language,
): string => {
  for (const household of state.register) {
    const member = household.members.find((m) => m.id === id);
    if (member) return member.name[language];
  }
  return id;
};

/** the month's events by day and hour, each a link that opens the clock before it */
function EventsPanel({
  events,
  language,
  onJump,
}: {
  events: SiteEvent[];
  language: Language;
  onJump: (id: string) => void;
}) {
  const zh = language === "zh";
  if (!events.length) return null;
  return (
    <section
      aria-label="Events of the month"
      className="mt-6 rounded-sm border border-white/10 bg-black/20 p-5"
    >
      <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        {zh ? "本月之事" : "What happens this month"}
      </h2>
      <ul className="mt-3 space-y-2">
        {events.map((event) => {
          const s = SHICHEN.find((h) => h.hour === event.hour);
          return (
            <li key={event.id} className="text-sm">
              <button
                type="button"
                onClick={() => onJump(event.id)}
                className="cursor-pointer text-zinc-100 hover:text-white"
              >
                {event.title[language]}
              </button>
              <span className="ml-2 font-plex-mono text-[10px] text-zinc-500 uppercase">
                {zh
                  ? `${event.day}日 ${s?.name.zh ?? ""}時`
                  : `day ${event.day} · ${s?.name.en ?? ""}`}
              </span>
              <span className="block text-zinc-400">
                {event.line[language]}
              </span>
              <span className="block font-plex-mono text-[10px] text-zinc-600">
                {event.cite.map(citeOf).join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
