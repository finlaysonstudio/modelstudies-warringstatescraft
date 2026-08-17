import { Radar } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

// Site chrome: three-row grid, main is the only scroll container. The top bar
// carries a quiet mono nav link back to the index; branding lives in the
// bottom bar.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-dvh grid-rows-[auto_1fr_auto] bg-surface-base font-geist text-zinc-300">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-x-8 px-6 sm:px-16">
          <Link
            to="/"
            className="font-plex-mono text-xs tracking-wide text-zinc-500 uppercase hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-terminal"
          >
            Replays
          </Link>
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
        Situation Eval
      </span>
    </Link>
  );
}
