import clsx from "clsx";
import { Radar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { CAMPAIGNS } from "../campaigns";

// Site chrome: three-row grid, main is the only scroll container. The top
// bar carries the three campaign-level destinations; the Craft sub site adds
// its own section bar beneath. Branding lives in the bottom bar.
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const inCraft = pathname === "/craft" || pathname.startsWith("/craft/");
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-surface-base font-geist text-zinc-300">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
          <NavLink to="/" label="Home" exact />
          <Dot />
          <NavLink to={CAMPAIGNS.craft.path} label={CAMPAIGNS.craft.title} />
          <Dot />
          <NavLink to={CAMPAIGNS.awry.path} label={CAMPAIGNS.awry.title} />
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

function SectionLink({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
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
