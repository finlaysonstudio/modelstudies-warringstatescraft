import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

// Shared surface primitives: the collapsible bar that heads each block, the
// quieter rule inside one, and the toggle.

// The header of a collapsible block. The whole bar is the hit target.
// status lights the right edge: a pulsing dot while work is in flight, a
// steady check once it has settled.
export function Bar({
  open,
  onToggle,
  label,
  detail,
  status,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  detail?: string;
  status?: "running" | "done";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-center gap-x-3 px-4 py-2.5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
    >
      <ChevronDown
        className={clsx(
          "size-3.5 shrink-0 text-zinc-500 transition-transform",
          !open && "-rotate-90",
        )}
        strokeWidth={2}
      />
      <span className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        {label}
      </span>
      {detail && (
        <span className="ml-auto truncate pl-4 font-plex-mono text-[10px] text-zinc-600">
          {detail}
        </span>
      )}
      {status && (
        <span
          aria-label={status === "running" ? "running" : "settled"}
          className={clsx(
            "shrink-0 font-plex-mono text-[10px] text-brand-terminal",
            !detail && "ml-auto",
            status === "running" && "animate-pulse",
          )}
        >
          {status === "running" ? "●" : "✓"}
        </span>
      )}
    </button>
  );
}

// A rule inside a block, one step quieter than a Bar. With onToggle it
// becomes a collapsible header for the content beneath it.
export function Section({
  label,
  detail,
  open,
  onToggle,
}: {
  label: string;
  detail?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  if (!onToggle) {
    return (
      <p className="border-b border-white/5 px-4 pt-3 pb-2 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-center gap-x-2 border-b border-white/5 px-4 pt-3 pb-2 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-terminal"
    >
      <ChevronDown
        className={clsx(
          "size-3 shrink-0 text-zinc-600 transition-transform",
          !open && "-rotate-90",
        )}
        strokeWidth={2}
      />
      <span className="font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      {detail && (
        <span className="ml-auto truncate pl-4 font-plex-mono text-[10px] text-zinc-700">
          {detail}
        </span>
      )}
    </button>
  );
}
