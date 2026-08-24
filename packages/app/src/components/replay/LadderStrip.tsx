import { clsx } from "clsx";

// The escalation ladder as a strip, filled to the current rung.
export function LadderStrip({
  escalation,
  ladder,
}: {
  escalation: number;
  ladder?: string[];
}) {
  if (!ladder || ladder.length === 0) {
    return (
      <span className="font-plex-mono text-[10px] tracking-wide text-zinc-400 uppercase">
        ESC {escalation}
      </span>
    );
  }
  return (
    <div
      className="flex gap-x-0.5"
      role="img"
      aria-label={`escalation ${escalation} of ${ladder.length - 1}: ${ladder[escalation] ?? ""}`}
    >
      {ladder.map((label, level) => (
        <span
          key={level}
          title={label}
          className={clsx(
            "h-3 flex-1 rounded-[2px]",
            level <= escalation ? "bg-brand-terminal" : "bg-white/5",
          )}
        />
      ))}
    </div>
  );
}
