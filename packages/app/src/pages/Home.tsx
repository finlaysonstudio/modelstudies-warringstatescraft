import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CAMPAIGNS, campaignOf, type Campaign } from "../campaigns";
import { libraryOf, type LibraryGame } from "../lib/library";
import type { RunIndexEntry, StudyIndexEntry } from "../lib/types";

interface Headline {
  craftChapters: number;
  craftGames: number;
  awryGames: number;
  awryModels: number;
}

// Home: the project in one line, the method in one paragraph, and the two
// campaigns as cards, each with one headline number read from data.
export function Home({ notFound = false }: { notFound?: boolean }) {
  const [headline, setHeadline] = useState<Headline | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [runsRes, studiesRes] = await Promise.all([
          fetch("/data/runs.json"),
          fetch("/data/studies.json"),
        ]);
        const runs = runsRes.ok
          ? ((await runsRes.json()) as RunIndexEntry[])
          : [];
        const studies = studiesRes.ok
          ? ((await studiesRes.json()) as StudyIndexEntry[])
          : [];
        const library = libraryOf(runs);
        const craft = library.filter(
          (game: LibraryGame) => campaignOf(game.scenario) === "craft",
        );
        const awry = library.filter(
          (game: LibraryGame) => campaignOf(game.scenario) === "awry",
        );
        const awryModels = new Set(
          studies
            .filter((study) =>
              study.scenarios.some((id) => campaignOf(id) === "awry"),
            )
            .flatMap((study) => study.models),
        );
        if (!cancelled) {
          setHeadline({
            craftChapters: new Set(craft.map((game) => game.scenario)).size,
            craftGames: craft.length,
            awryGames: awry.length,
            awryModels: awryModels.size,
          });
        }
      } catch {
        // headline numbers are decoration; the cards stand without them
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 sm:px-16 sm:pt-20">
      <header className="animate-rise motion-reduce:animate-none">
        <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
          Evals for the Situation Room
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Warring States Craft
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-zinc-400">
          A branching multi-model war game wrapped in a values instrument.
          Frontier models hold the seats of rival courts; every turn a judge
          panel scores the combined actions on an escalation ladder and a
          narrator resolves them into the next turn's public record. Before a
          model plays, a forced-choice survey asks where it says it stands, so
          declared values can be read against revealed play.
        </p>
        {notFound && (
          <p className="mt-4 font-plex-mono text-xs text-amber-300">
            No page at this address — the campaigns below are the way in.
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <CampaignCard
          campaign={CAMPAIGNS.craft}
          stats={
            headline
              ? [
                  { value: headline.craftChapters, label: "chapters played" },
                  { value: headline.craftGames, label: "games in the library" },
                ]
              : []
          }
          delay={60}
        />
        <CampaignCard
          campaign={CAMPAIGNS.awry}
          stats={
            headline
              ? [
                  { value: headline.awryGames, label: "games" },
                  { value: headline.awryModels, label: "subject models" },
                ]
              : []
          }
          delay={120}
        />
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  stats,
  delay,
}: {
  campaign: Campaign;
  stats: { value: number; label: string }[];
  delay: number;
}) {
  return (
    <Link
      to={campaign.path}
      className="animate-rise block cursor-pointer rounded-sm border border-white/10 bg-black/20 p-6 hover:border-white/20 hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Campaign
      </p>
      <h2 className="mt-2 text-xl font-medium tracking-tight text-white">
        {campaign.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-zinc-400">
        {campaign.blurb}
      </p>
      {stats.length > 0 && (
        <div className="mt-5 flex gap-x-8 border-t border-white/5 pt-4">
          {stats.map((stat) => (
            <p key={stat.label}>
              <span className="font-plex-mono text-lg text-white">
                {stat.value}
              </span>
              <span className="mt-0.5 block font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
                {stat.label}
              </span>
            </p>
          ))}
        </div>
      )}
    </Link>
  );
}
