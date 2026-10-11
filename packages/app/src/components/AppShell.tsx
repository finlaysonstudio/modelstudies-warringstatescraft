import clsx from "clsx";
import { Radar } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Fragment, type ReactNode } from "react";
import { CAMPAIGNS } from "../campaigns";
import { SNAPSHOT, SNAPSHOT_DATE, SNAPSHOT_LABEL } from "../lib/snapshot";
import {
  siteLanguageOf,
  siteSectionOf,
  siteSectionsOf,
  sitePathOf,
} from "../stage/site";
import { SITES } from "../stage/sites";

// Site chrome: three-row grid, main is the only scroll container. The top
// bar carries the campaign-level destinations; the Craft and World sub sites
// each add their own section bar beneath, and a site a third bar of its own
// pages. Branding lives in the bottom bar.
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const site = SITES.find(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`),
  );
  const section = site
    ? siteSectionOf(site, pathname.slice(site.path.length + 1))
    : undefined;
  const inCraft = pathname === "/craft" || pathname.startsWith("/craft/");
  const inWorld = pathname === "/world" || pathname.startsWith("/world/");
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-surface-base font-geist text-zinc-300">
      <header className="border-b border-white/10">
        {SNAPSHOT && <SnapshotBar />}
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
          <NavLink to="/" label="Home" exact />
          <Dot />
          <NavLink to={CAMPAIGNS.craft.path} label={CAMPAIGNS.craft.title} />
          <Dot />
          <NavLink to={CAMPAIGNS.world.path} label={CAMPAIGNS.world.title} />
          <Dot />
          <NavLink to={CAMPAIGNS.awry.path} label={CAMPAIGNS.awry.title} />
          <Dot />
          <NavLink to={CAMPAIGNS.annals.path} label={CAMPAIGNS.annals.title} />
        </div>
        {inCraft && (
          <div className="border-t border-white/5">
            <div className="mx-auto flex h-9 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
              <SectionLink
                to="/craft#chronicle"
                label="Chronicle"
                active={
                  pathname === "/craft" ||
                  pathname.startsWith("/craft/chapters")
                }
              />
              <Dot />
              <SectionLink
                to="/craft#studies"
                label="Studies"
                active={pathname.startsWith("/craft/studies")}
              />
              <Dot />
              <SectionLink
                to="/craft/survey"
                label="Survey"
                active={pathname.startsWith("/craft/survey")}
              />
              <Dot />
              <SectionLink
                to="/craft/play"
                label="Play"
                active={pathname.startsWith("/craft/play")}
              />
            </div>
          </div>
        )}
        {inWorld && (
          <div className="border-t border-white/5">
            <div className="mx-auto flex h-9 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
              <SectionLink
                to="/world/map"
                label="Map"
                active={pathname.startsWith("/world/map")}
              />
              <Dot />
              {SITES.map((site) => (
                <Fragment key={site.id}>
                  <SectionLink
                    to={site.path}
                    label={site.crumb}
                    active={pathname.startsWith(site.path)}
                  />
                  <Dot />
                </Fragment>
              ))}
              <SectionLink
                to="/world/tiles"
                label="Tiles"
                active={pathname.startsWith("/world/tiles")}
              />
            </div>
          </div>
        )}
        {site && (
          <div className="border-t border-white/5">
            <div className="mx-auto flex h-8 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
              {siteSectionsOf(site).map((entry, index) => (
                <Fragment key={entry.id}>
                  {index > 0 && <Dot />}
                  <SectionLink
                    to={sitePathOf(site, entry.id)}
                    label={entry.label}
                    active={section === entry.id}
                    preserveSearch
                  />
                </Fragment>
              ))}
              <LanguageToggle />
            </div>
          </div>
        )}
      </header>
      {/* relative: absolutely positioned descendants must anchor inside the
          scroll container, not the document. */}
      <main className="relative overflow-y-auto">{children}</main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 sm:px-16">
          <Brand />
        </div>
      </footer>
    </div>
  );
}

// A snapshot is a date. The bar says so on every page rather than leaving a
// reader to infer it from the newest study on the front page.
function SnapshotBar() {
  return (
    <div className="border-b border-white/5 bg-white/[0.02]">
      <div className="mx-auto flex h-8 w-full max-w-7xl items-center gap-x-2 px-6 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase sm:px-16">
        <span className="text-card-accent">{SNAPSHOT_LABEL}</span>
        {SNAPSHOT_DATE && (
          <>
            <Dot />
            <span>{SNAPSHOT_DATE}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-zinc-700">
      ·
    </span>
  );
}

function NavLink({
  to,
  label,
  exact = false,
}: {
  to: string;
  label: string;
  exact?: boolean;
}) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={clsx(
        "font-plex-mono text-xs tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-terminal",
        active ? "text-white" : "text-zinc-500 hover:text-zinc-200",
      )}
    >
      {label}
    </Link>
  );
}

// One control for the two languages a site is written in, at the far end of
// the site's own bar: a press reads the page in the other one. The choice is
// the query string's, so it follows the reader across the site's pages.
function LanguageToggle() {
  const [params, setParams] = useSearchParams();
  const language = siteLanguageOf(params);
  return (
    <button
      type="button"
      onClick={() =>
        setParams(
          (next) => {
            if (language === "en") next.set("language", "zh");
            else next.delete("language");
            return next;
          },
          { replace: true },
        )
      }
      aria-label={language === "en" ? "Read in Chinese" : "Read in English"}
      className="ml-auto cursor-pointer rounded-sm border border-white/10 px-2 py-0.5 font-plex-mono text-[10px] tracking-wide uppercase hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
    >
      <span
        className={language === "en" ? "text-brand-terminal" : "text-zinc-500"}
      >
        en
      </span>
      <span aria-hidden className="mx-1.5 text-zinc-700">
        |
      </span>
      <span
        className={language === "zh" ? "text-brand-terminal" : "text-zinc-500"}
      >
        zh
      </span>
    </button>
  );
}

function SectionLink({
  to,
  label,
  active,
  preserveSearch = false,
}: {
  to: string;
  label: string;
  active: boolean;
  /** a move between a site's pages keeps its query string (the month) */
  preserveSearch?: boolean;
}) {
  const { search } = useLocation();
  return (
    <Link
      to={preserveSearch ? { pathname: to, search } : to}
      className={clsx(
        "font-plex-mono text-[10px] tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-terminal",
        active ? "text-brand-terminal" : "text-zinc-500 hover:text-zinc-200",
      )}
    >
      {label}
    </Link>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex cursor-pointer items-center gap-x-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-terminal"
    >
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-sm bg-brand-terminal"
      >
        <Radar className="size-4 text-white" strokeWidth={2} />
      </span>
      <span className="text-base font-semibold tracking-tight text-white">
        Warring States Craft
      </span>
    </Link>
  );
}
