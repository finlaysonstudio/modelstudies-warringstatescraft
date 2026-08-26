import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CAMPAIGNS } from "../../campaigns";
import { ACTS, episodesOfAct } from "../../lib/annals";
import type { EpisodeIndexEntry } from "../../lib/types";

// The timeline: five act bands from the flooding of Jinyang to the surrender
// of Qi, each episode a card with its date, its title, and the bench chapter
// it anchors. `?act=` narrows to one band; `?play=all` is the continuous cut
// and hands off to the player, which chains the episodes in order.

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; episodes: EpisodeIndexEntry[] };

export function AnnalsHome() {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const act = params.get("act");
  const play = params.get("play");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/data/episodes.json");
        if (!res.ok) throw new Error(`episodes responded ${res.status}`);
        const episodes = (await res.json()) as EpisodeIndexEntry[];
        if (!cancelled) setState({ phase: "ready", episodes });
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
  }, []);

  const episodes = state.phase === "ready" ? state.episodes : [];
  const bands = useMemo(
    () =>
      ACTS.filter((entry) => !act || entry.id === act).map((entry) => ({
        act: entry,
        episodes: episodesOfAct(episodes, entry.id),
      })),
    [episodes, act],
  );

  // the continuous cut opens at the first episode and chains from there
  if (play === "all" && episodes.length > 0) {
    return <Navigate to={`/annals/${episodes[0].id}?play=all`} replace />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-16 pb-24 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          The Annals of the Warring States
        </p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight text-white">
          {CAMPAIGNS.annals.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
          {CAMPAIGNS.annals.blurb}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to="/annals?play=all"
            className="cursor-pointer rounded-sm bg-brand-terminal px-4 py-2 text-sm font-medium text-white hover:bg-brand-terminal/80"
          >
            Play the whole chronicle
          </Link>
          <span className="font-plex-mono text-[10px] text-zinc-600">
            {episodes.length} episode{episodes.length === 1 ? "" : "s"} · five
            acts · 453 to 221 BCE
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => setParams({})}
            className={clsx(
              "cursor-pointer font-plex-mono text-[10px] tracking-wide uppercase hover:text-white",
              act ? "text-zinc-500" : "text-brand-terminal",
            )}
          >
            every act
          </button>
          {ACTS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setParams({ act: entry.id })}
              className={clsx(
                "cursor-pointer font-plex-mono text-[10px] tracking-wide uppercase hover:text-white",
                act === entry.id ? "text-brand-terminal" : "text-zinc-500",
              )}
            >
              {entry.title.en}
            </button>
          ))}
        </div>
      </header>

      {state.phase === "loading" && (
        <p className="mt-10 font-plex-mono text-xs text-zinc-600">loading…</p>
      )}
      {state.phase === "error" && (
        <p className="mt-10 font-plex-mono text-xs text-red-400">
          failed to load the Annals: {state.message}. Run{" "}
          <span className="text-zinc-300">cli annals-build</span> to write{" "}
          var/episodes/.
        </p>
      )}
      {state.phase === "ready" && episodes.length === 0 && (
        <p className="mt-10 font-plex-mono text-xs text-zinc-500">
          no episodes on record; run{" "}
          <span className="text-zinc-300">cli annals-build</span>
        </p>
      )}

      <div className="mt-12 space-y-14">
        {bands.map(({ act: band, episodes: inBand }) => (
          <section key={band.id} aria-label={band.title.en}>
            <div className="flex flex-wrap items-baseline gap-x-4">
              <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
                Act {band.order}
              </p>
              <h2 className="text-2xl font-medium tracking-tight text-white">
                {band.title.en}
              </h2>
              <span className="font-plex-mono text-[10px] text-zinc-600">
                {band.date}
              </span>
              <span className="font-plex-mono text-[10px] text-zinc-600">
                {band.title.zh}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {band.blurb.en}
            </p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {inBand.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/annals/${entry.id}`}
                    className="block h-full cursor-pointer rounded-sm border border-white/10 px-4 py-3 hover:bg-white/5"
                  >
                    <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                      {entry.date}
                    </p>
                    <p className="mt-1 text-base text-white">
                      {entry.title.en}
                    </p>
                    <p className="font-plex-mono text-[10px] text-zinc-600">
                      {entry.title.zh}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                      {entry.blurb.en}
                    </p>
                    <p className="mt-2 font-plex-mono text-[10px] text-zinc-600">
                      {entry.sceneCount} scene
                      {entry.sceneCount === 1 ? "" : "s"}
                      {entry.chapter ? ` · played as ${entry.chapter}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
