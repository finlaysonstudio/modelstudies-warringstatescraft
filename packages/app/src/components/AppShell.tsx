import clsx from "clsx";
import { Radar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

// Site chrome: three-row grid, main is the only scroll container. The top bar
// carries a quiet mono nav link back to the index; branding lives in the
// bottom bar.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-surface-base font-geist text-zinc-300">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-x-4 px-6 sm:px-16">
          <NavLink to="/" label="Replays" exact />
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <NavLink to="/studies" label="Studies" />
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <NavLink to="/values" label="Values" />
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <NavLink to="/scenarios" label="Scenarios" />
          <span aria-hidden className="text-zinc-700">
            ·
          </span>
          <NavLink to="/play" label="Play" />
        </div>
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
        Warring States Bench
      </span>
    </Link>
  );
}
