import { clsx } from "clsx";
import type { RunLane, RunStatus } from "../lib/types";

// Lane chips: root is plain, independent reads sky, consensus carries the
// brand accent (the lane where a single model's decision seeds the timeline).
export function LaneChip({ lane }: { lane: RunLane }) {
  return (
    <span
      className={clsx(
        "rounded-sm border px-1.5 py-0.5 font-plex-mono text-[10px] tracking-wide uppercase",
        lane === "consensus" && "border-brand-terminal/40 text-brand-terminal",
        lane === "independent" && "border-sky-400/40 text-sky-400",
        lane === "root" && "border-white/10 bg-white/[0.03] text-zinc-400",
      )}
    >
      {lane}
    </span>
  );
}

const statusColor: Record<RunStatus, string> = {
  complete: "text-brand-terminal",
  active: "text-sky-400",
  error: "text-red-400",
};

export function StatusChip({ status }: { status: RunStatus }) {
  return (
    <span
      className={clsx(
        "font-plex-mono text-[10px] tracking-wide uppercase",
        statusColor[status] ?? "text-zinc-400",
      )}
    >
      {status}
    </span>
  );
}
