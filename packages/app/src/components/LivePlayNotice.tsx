import clsx from "clsx";
import { Lock } from "lucide-react";
import { LIVE_PLAY, LIVE_PLAY_NOTE } from "../lib/snapshot";

/**
 * The disabled seat. Live play — a person taking a court against the models —
 * needs a server that calls them, which a static deployment does not have. The
 * affordance is drawn grayed rather than dropped: a reader should see that the
 * bench has a seat for them and that this deployment is not the one that runs
 * it. Renders nothing where live play is available.
 */
export function LivePlayNotice({ className }: { className?: string }) {
  if (LIVE_PLAY) return null;
  return (
    <div
      className={clsx(
        "rounded-sm border border-white/5 bg-white/[0.02] p-4 opacity-60",
        className,
      )}
      aria-label="Live play unavailable"
    >
      <div className="flex items-center gap-x-2">
        <Lock aria-hidden className="size-3.5 text-zinc-600" />
        <p className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
          Live play · unavailable
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">{LIVE_PLAY_NOTE}</p>
      <button
        type="button"
        disabled
        aria-disabled
        className="mt-3 inline-block cursor-not-allowed rounded-sm border border-white/5 px-2 py-1 font-plex-mono text-[10px] tracking-wide text-zinc-600 uppercase"
      >
        take a seat →
      </button>
    </div>
  );
}
