import clsx from "clsx";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  Language,
  StageBeat,
  StageDirection,
  StageSequence,
} from "../../lib/types";
import { STAGE_SETS, stageSetOf } from "../../stage/sets";
import {
  ORDER_LABELS,
  siteMapOf,
  type Order,
  type Site as SiteRecord,
  type Townsperson,
} from "../../stage/sites";
import { Stage } from "../../stage/Stage";

// A site of the period on the same stage as the overworld, walked by its own
// people: the city, the village, or the house, each a record in
// `stage/sites/`. Nothing here is a game: no seat marches to a site and no
// chapter is set in one. The page keeps the stage's beat queue fed with
// strolls and labours drawn at random from the site's people, so it reads
// as inhabited rather than as a plan.

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

const nextBeat = (
  site: SiteRecord,
  n: number,
): { beat: StageBeat; line: Line } => {
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
  const [walking, setWalking] = useState(true);
  const [follow, setFollow] = useState(false);
  const [beats, setBeats] = useState<StageBeat[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const counter = useRef(0);
  const played = useRef(0);

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
        site.folk.map((person) => [
          seatOf(site, person),
          person.label[language],
        ]),
      ),
    [site, language],
  );
  const colors = useMemo(
    () =>
      Object.fromEntries(site.folk.map((person) => [seatOf(site, person), 0])),
    [site],
  );
  const script = useMemo<StageSequence>(
    () => ({
      id: `${site.id}.${language}`,
      model: "authored",
      language,
      naming: "chronicle",
      createdAt: "2026-09-06",
      seats: Object.fromEntries(
        site.folk.map((person) => [
          seatOf(site, person),
          { home: person.home ?? site.strollPlaces[0], model: "authored" },
        ]),
      ),
      places: Object.keys(site.names),
      beats: [],
    }),
    [site, language],
  );

  const feed = useCallback(
    (count: number) => {
      const next: StageBeat[] = [];
      const said: Line[] = [];
      for (let i = 0; i < count; i += 1) {
        counter.current += 1;
        const { beat, line } = nextBeat(site, counter.current);
        next.push(beat);
        said.push(line);
      }
      setBeats((list) => [...list, ...next]);
      setLines((list) => [...said.reverse(), ...list].slice(0, LOG));
    },
    [site],
  );

  // the scene reports idle when its queue runs dry; the town keeps walking
  // as long as the switch is on, one beat ahead of the reader's patience
  const onIdle = useCallback(() => {
    played.current = counter.current;
    if (walking) feed(1);
  }, [walking, feed]);

  // the scene reports idle only after a beat has played, so the first beats
  // are fed when the map is ready; a paused town stays still until woken
  const onReady = useCallback(() => {
    if (walking && counter.current === 0) feed(AHEAD);
  }, [walking, feed]);

  const start = () => {
    setWalking(true);
    feed(AHEAD);
  };

  const byOrder = useMemo(() => {
    const groups = new Map<Order, Townsperson[]>();
    for (const person of site.folk) {
      const list = groups.get(person.order) ?? [];
      list.push(person);
      groups.set(person.order, list);
    }
    return [...groups.entries()];
  }, [site]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
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
          <label className="flex cursor-pointer items-center gap-x-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
              className="cursor-pointer accent-brand-terminal"
            />
            follow the people
          </label>
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
          flags={false}
          set={set.id}
          eyebrow={false}
          map={siteMapOf(site, set)}
          featureNotes={site.features}
          onIdle={onIdle}
          onReady={onReady}
        />
        {beats.length === 0 && (
          <FirstStep note={site.words.firstStep} onStart={start} />
        )}
      </section>

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
        </section>
      </div>

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
              {source.text.startsWith(":") ? "" : " "}
              {source.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
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
