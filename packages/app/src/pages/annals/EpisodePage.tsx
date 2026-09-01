import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ACTS_BY_ID } from "../../lib/annals";
import { labelOf } from "../../lib/gazetteer";
import type {
  Episode,
  EpisodeIndexEntry,
  GazetteerFile,
  Language,
} from "../../lib/types";
import { seatColor } from "../../stage/catalog";
import { stageSetOf } from "../../stage/sets";
import { Stage } from "../../stage/Stage";

// One episode of the Annals: the stage above, the scenes revealed one at a
// time beneath it, and the sources under that. Space advances, as on the
// watch page. `?scene=` opens at a scene; `?play=all` is the continuous cut
// and advances on a timer, chaining to the next episode when this one ends.

const AUTOPLAY_MS = 4200;

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready";
      episode: Episode;
      index: EpisodeIndexEntry[];
      gazetteer: GazetteerFile | null;
    };

export function EpisodePage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [revealed, setRevealed] = useState(1);
  const language: Language = params.get("language") === "zh" ? "zh" : "en";
  const set = stageSetOf(params.get("set"));
  const autoplay = params.get("play") === "all";

  useEffect(() => {
    let cancelled = false;
    setState({ phase: "loading" });
    setRevealed(Math.max(1, Number(params.get("scene")) || 1));
    void (async () => {
      try {
        const res = await fetch(
          `/data/episodes/${encodeURIComponent(id)}.json`,
        );
        if (!res.ok) throw new Error(`episode responded ${res.status}`);
        const episode = (await res.json()) as Episode;
        let index: EpisodeIndexEntry[] = [];
        let gazetteer: GazetteerFile | null = null;
        try {
          const [indexRes, gazetteerRes] = await Promise.all([
            fetch("/data/episodes.json"),
            fetch("/data/world/gazetteer.json"),
          ]);
          if (indexRes.ok)
            index = (await indexRes.json()) as EpisodeIndexEntry[];
          if (gazetteerRes.ok) {
            gazetteer = (await gazetteerRes.json()) as GazetteerFile;
          }
        } catch {
          // place labels fall back to keys; no neighbours
        }
        if (!cancelled) setState({ phase: "ready", episode, index, gazetteer });
      } catch (error) {
        if (!cancelled) {
          setState({
            phase: "error",
            message: error instanceof Error ? error.message : "fetch failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // the scene query is the opening position only; advancing does not refetch
  }, [id]);

  const episode = state.phase === "ready" ? state.episode : null;
  const index = state.phase === "ready" ? state.index : [];
  const gazetteer = state.phase === "ready" ? state.gazetteer : null;
  const scenes = episode?.beats ?? [];
  const done = revealed >= scenes.length;

  const beats = useMemo(
    () => scenes.slice(0, Math.min(revealed, scenes.length)),
    [scenes, revealed],
  );

  const names = useMemo(() => {
    const table: Record<string, string> = {};
    for (const key of Object.keys(gazetteer?.entries ?? {})) {
      table[key] = labelOf(gazetteer, key, "chronicle", language);
    }
    return table;
  }, [gazetteer, language]);

  const seatNames = useMemo(() => {
    const table: Record<string, string> = {};
    for (const [seat, entry] of Object.entries(episode?.seats ?? {})) {
      table[seat] = labelOf(
        gazetteer,
        entry.state ?? seat,
        "chronicle",
        language,
      );
    }
    return table;
  }, [episode, gazetteer, language]);

  const colors = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(episode?.seats ?? {}).map((seat, order) => [
          seat,
          seatColor(order),
        ]),
      ),
    [episode],
  );

  const position = index.findIndex((entry) => entry.id === id);
  const previous = position > 0 ? index[position - 1] : null;
  const next = position >= 0 ? (index[position + 1] ?? null) : null;

  const advance = useCallback(() => {
    setRevealed((value) => Math.min(value + 1, scenes.length));
  }, [scenes.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowRight") {
        event.preventDefault();
        advance();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setRevealed((value) => Math.max(value - 1, 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  // the continuous cut: advance on a timer, then move to the next episode
  useEffect(() => {
    if (!autoplay || scenes.length === 0) return;
    const timer = window.setTimeout(() => {
      if (!done) {
        advance();
        return;
      }
      if (next) navigate(`/annals/${next.id}?play=all`);
      else navigate("/annals");
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, revealed, done, next, navigate, advance, scenes.length]);

  if (state.phase === "loading") {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-zinc-600 sm:px-16">
        loading…
      </p>
    );
  }
  if (state.phase === "error" || !episode) {
    return (
      <p className="px-6 pt-16 font-plex-mono text-xs text-red-400 sm:px-16">
        failed to load the episode:{" "}
        {state.phase === "error" ? state.message : "no episode"}. Run{" "}
        <span className="text-zinc-300">cli annals-build</span> to write
        var/episodes/.
      </p>
    );
  }

  const act = ACTS_BY_ID[episode.act];
  const shown = scenes.slice(0, revealed);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          <Link to="/annals" className="hover:text-white">
            The Annals
          </Link>
          {" › "}
          <Link to={`/annals?act=${episode.act}`} className="hover:text-white">
            {act?.title.en ?? episode.act}
          </Link>
          {" › "}
          {episode.date}
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          {episode.title[language]}
        </h1>
        <p className="mt-1 font-plex-mono text-xs text-zinc-500">
          {episode.title[language === "en" ? "zh" : "en"]}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {Object.entries(episode.seats).map(([seat, entry]) => (
            <span key={seat} className="font-plex-mono text-xs text-zinc-500">
              {seatNames[seat] ?? seat}
              <span className="text-zinc-700"> · {entry.home}</span>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(params);
              if (language === "en") nextParams.set("language", "zh");
              else nextParams.delete("language");
              setParams(nextParams, { replace: true });
            }}
            className="cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-white"
          >
            {language === "en" ? "中文" : "English"}
          </button>
        </div>
      </header>

      <section aria-label="Stage" className="mt-8">
        <Stage
          script={episode}
          beats={beats}
          names={names}
          seatNames={seatNames}
          colors={colors}
          language={language}
          set={set.id}
          eyebrow={`Annals · ${act ? `Act ${act.order}` : episode.act} · ${episode.date}`}
        />
      </section>

      <p className="mt-8 text-sm leading-relaxed text-zinc-300">
        {episode.blurb[language]}
      </p>

      <ol className="mt-8 space-y-5">
        {shown.map((scene, order) => (
          <li
            key={scene.id}
            className={clsx(
              "rounded-sm border px-4 py-3",
              order === revealed - 1 && !done
                ? "border-brand-terminal/40 bg-white/5"
                : "border-white/10",
            )}
          >
            <p className="font-plex-mono text-[10px] tracking-wide text-zinc-600 uppercase">
              scene {scene.turn}
              {scene.venue ? ` · ${scene.venue}` : ""}
              {scene.focus ? ` · ${names[scene.focus] ?? scene.focus}` : ""}
            </p>
            {scene.card && (
              <p className="mt-1 text-base text-white">
                {scene.card.title[language]}
                {scene.card.date ? (
                  <span className="ml-2 font-plex-mono text-[10px] text-zinc-500">
                    {scene.card.date}
                  </span>
                ) : null}
              </p>
            )}
            {(scene.lines ?? []).map((line, lineOrder) => (
              <p key={lineOrder} className="mt-2 text-sm text-zinc-300">
                <span className="font-plex-mono text-[10px] tracking-wide text-card-accent uppercase">
                  {line.speaker}
                </span>{" "}
                {line.text[language]}
              </p>
            ))}
            <p className="mt-2 font-plex-mono text-[10px] text-zinc-600">
              {scene.directions.map((direction) => direction.kind).join(" · ")}
            </p>
          </li>
        ))}
      </ol>

      {!done && (
        <div className="mt-8 flex items-center gap-x-4">
          <button
            type="button"
            onClick={advance}
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80"
          >
            Next scene
          </button>
          <span className="font-plex-mono text-[10px] text-zinc-600">
            {revealed} of {scenes.length} · space advances
            {autoplay ? " · playing the whole chronicle" : ""}
          </span>
        </div>
      )}

      <section aria-label="Sources" className="mt-12">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Sources
        </p>
        <p className="mt-2 font-plex-mono text-[10px] text-zinc-500">
          {episode.sources.length > 0
            ? episode.sources.join(" · ")
            : "none recorded"}
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-zinc-600">
          The Annals are an exhibit rather than an instrument. Real people are
          named and real years are stated, and nothing on this page reaches a
          model or is scored. Quoted lines are our own renderings from the
          classical text.
        </p>
      </section>

      {episode.chapter && (
        <section aria-label="Played as" className="mt-10">
          <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
            Played as
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            A bench chapter bends this episode at its decision point, and asks a
            model to take the seat.
          </p>
          <Link
            to={`/craft/chapters/${episode.chapter}`}
            className="mt-3 inline-block cursor-pointer rounded-sm border border-white/10 px-3 py-1.5 font-plex-mono text-[10px] tracking-wide text-zinc-300 uppercase hover:bg-white/5"
          >
            {episode.chapter}
          </Link>
        </section>
      )}

      <nav className="mt-12 flex flex-wrap items-center justify-between gap-3">
        {previous ? (
          <Link
            to={`/annals/${previous.id}`}
            className="cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-white"
          >
            ← {previous.date} · {previous.title.en}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/annals/${next.id}`}
            className="cursor-pointer font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase hover:text-white"
          >
            {next.date} · {next.title.en} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
