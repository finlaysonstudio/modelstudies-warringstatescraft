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
  SETTLEMENT_FEATURES,
  SETTLEMENT_NAMES,
  STROLL_PLACES,
  TOWNSFOLK,
  settlementMapOf,
  type Townsperson,
} from "../../stage/settlement";
import { Stage } from "../../stage/Stage";

// A model town of the period on the same stage as the overworld, walked by
// its own people. Nothing here is a game: no seat marches to the town and no
// chapter is set in it. The page keeps the stage's beat queue fed with
// strolls and labours drawn at random from the townsfolk, so the town reads
// as inhabited rather than as a plan.

const VIEW = { width: 960, height: 640 };
/** beats kept in flight; the scene plays one at a time and the page tops up on idle */
const AHEAD = 3;
/** the trades whose labour smokes: a kiln, a furnace, a foundry */
const SMOKING = new Set(["kiln", "foundry", "smithy"]);
/** how many lines of the town's day the page keeps */
const LOG = 8;

const seatOf = (person: Townsperson): string => `town:${person.archetype}`;

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

const nextBeat = (n: number): { beat: StageBeat; line: Line } => {
  const person = pick(TOWNSFOLK);
  const seat = seatOf(person);
  const home = person.home;
  const atWork = home !== undefined && Math.random() < 0.4;
  const direction: StageDirection = atWork
    ? {
        kind: "labour",
        actor: { seat, archetype: person.archetype },
        at: home,
        ...(SMOKING.has(home) ? { effect: "smoke" } : {}),
      }
    : (() => {
        const from = home ?? pick(STROLL_PLACES);
        let to = pick(STROLL_PLACES);
        while (to === from) to = pick(STROLL_PLACES);
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
    const label = SETTLEMENT_NAMES[key]?.[language] ?? key;
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
      id: `town.${n}`,
      kind: "scene",
      turn: n,
      seat,
      title: person.label.en,
      directions: [direction],
    },
    line,
  };
};

export function Settlement() {
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
        Object.entries(SETTLEMENT_NAMES).map(([key, label]) => [
          key,
          label[language],
        ]),
      ),
    [language],
  );
  const seatNames = useMemo(
    () =>
      Object.fromEntries(
        TOWNSFOLK.map((person) => [seatOf(person), person.label[language]]),
      ),
    [language],
  );
  const colors = useMemo(
    () => Object.fromEntries(TOWNSFOLK.map((person) => [seatOf(person), 0])),
    [],
  );
  const script = useMemo<StageSequence>(
    () => ({
      id: `settlement.${language}`,
      model: "authored",
      language,
      naming: "chronicle",
      createdAt: "2026-09-06",
      seats: Object.fromEntries(
        TOWNSFOLK.map((person) => [
          seatOf(person),
          { home: person.home ?? "market", model: "authored" },
        ]),
      ),
      places: Object.keys(SETTLEMENT_NAMES),
      beats: [],
    }),
    [language],
  );

  const feed = useCallback((count: number) => {
    const next: StageBeat[] = [];
    const said: Line[] = [];
    for (let i = 0; i < count; i += 1) {
      counter.current += 1;
      const { beat, line } = nextBeat(counter.current);
      next.push(beat);
      said.push(line);
    }
    setBeats((list) => [...list, ...next]);
    setLines((list) => [...said.reverse(), ...list].slice(0, LOG));
  }, []);

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
    const groups = new Map<Townsperson["order"], Townsperson[]>();
    for (const person of TOWNSFOLK) {
      const list = groups.get(person.order) ?? [];
      list.push(person);
      groups.set(person.order, list);
    }
    return [...groups.entries()];
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/craft" className="hover:text-white">
            Warring States Craft
          </Link>
          {" › "}City
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {language === "zh" ? "模范之城" : "A Model City"}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          A capital of the period drawn to one plan and walked by its own
          people. The twin city is the Zhongshan capital at Lingshou as the
          excavators found it: the palace terraces along the north of the east
          city, the offices and wards below them, the royal tombs in the north
          of the west city and the market, the orchard, and the workshops
          beneath. The three gates a side, the temple on the left and the altar
          of soil on the right, and the court before the palace are the
          Kaogongji's rule; the market well with each trade in its own row is
          the Guanzi's; the standing wall and its moat are Xue's. Click any
          gate, hall, kiln, or ward to read what it is and what the statutes and
          the site reports say of it. The figures are the townsfolk the
          registers counted: officials, artisans, merchants, farmers,
          households, and convict labour.
        </p>
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
            {walking ? "the town is awake · pause" : "wake the town"}
          </button>
          <label className="flex cursor-pointer items-center gap-x-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            <input
              type="checkbox"
              checked={follow}
              onChange={(event) => setFollow(event.target.checked)}
              className="cursor-pointer accent-brand-terminal"
            />
            follow the townsfolk
          </label>
        </div>
      </header>

      <section aria-label="Settlement map" className="mt-8">
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
          map={settlementMapOf(set)}
          featureNotes={SETTLEMENT_FEATURES}
          onIdle={onIdle}
          onReady={onReady}
        />
        {beats.length === 0 && <FirstStep onStart={start} />}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section
          aria-label="The town's day"
          className="rounded-sm border border-white/10 bg-black/20 p-5"
        >
          <h2 className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            {language === "zh" ? "市中一日" : "The town's day"}
          </h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              {language === "zh" ? "城尚未醒。" : "Nothing has stirred yet."}
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
            {language === "zh" ? "四民" : "Who lives here"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {language === "zh"
              ? "管子分四民各居其所：士就闲燕，农就田野，工就官府，商就市井。商君书十三数并计仓、丁、老弱、官、马牛、刍稿。此城之人依此而分。"
              : "The Guanzi keeps the four orders each to its own quarter so a trade passes from father to son unspoken; the Book of Lord Shang counts granaries, adults, the old and the weak, officials, horses and oxen, fodder and straw. The town's people are sorted the same way, by order and then by craft."}
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
          <li>
            <span className="text-zinc-200">
              Lingshou, the Zhongshan capital
            </span>{" "}
            (Sanji, Pingshan, Hebei; excavated 1974–1993, site report 2005): two
            walled cities side by side, seven rammed-earth platforms along the
            north of the east city, offices and workshops south of them, the
            royal necropolis in the west city and King Cuo's mausoleum outside
            it with its bronze plan, the earliest scaled plan from China.
          </li>
          <li>
            <span className="text-zinc-200">Xue</span> (Tengzhou, Shandong): a
            Warring States circuit still standing four to eight metres high,
            twelve gates, three iron workshops inside the wall.
          </li>
          <li>
            <span className="text-zinc-200">Boren</span> (Longyao, Hebei): a
            Zhao county town of about four square kilometres, its 2025 season
            tracing the wall, the road, the water, and an intact kiln.
          </li>
          <li>
            <span className="text-zinc-200">The Kaogongji</span>: the ideal
            capital nine li square with three gates a side and nine avenues,
            temple left, altar right, court in front, market behind; some thirty
            trades in six divisions.
          </li>
          <li>
            <span className="text-zinc-200">
              The Zhouli, the Guanzi, and the Shuihudi statutes
            </span>
            : the market's staff and its three sessions, the four orders in
            their quarters, the price tags and the sealed cash box, the granary
            seals, the stable inspection, the workshop quotas, and the case form
            that describes one house.
          </li>
        </ul>
      </section>
    </div>
  );
}

function FirstStep({ onStart }: { onStart: () => void }) {
  return (
    <p className="mt-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
      the town wakes when the map has loaded ·{" "}
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
