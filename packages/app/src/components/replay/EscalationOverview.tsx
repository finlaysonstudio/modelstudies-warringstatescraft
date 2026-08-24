import type { TurnRecord } from "../../lib/types";

// One square per adjudicated turn, opacity by escalation level.
export function EscalationOverview({
  turns,
  ladder,
}: {
  turns: TurnRecord[];
  ladder?: string[];
}) {
  const levels = turns.map((turn) => turn.adjudication?.escalation ?? 0);
  const maxLevel = Math.max(ladder ? ladder.length - 1 : 0, ...levels, 1);
  return (
    <section
      className="animate-rise mt-10 motion-reduce:animate-none"
      style={{ animationDelay: "120ms" }}
      aria-label="Escalation overview"
    >
      <p className="font-plex-mono text-xs tracking-wide text-card-accent uppercase">
        Escalation
      </p>
      <div className="mt-3 flex items-end gap-x-3">
        {turns.map((turn) => {
          const level = turn.adjudication?.escalation ?? 0;
          return (
            <div
              key={turn.index}
              className="flex flex-col items-center gap-y-1"
            >
              <span
                className="size-4 rounded-[2px] bg-brand-terminal"
                style={{ opacity: Math.max(level / maxLevel, 0.12) }}
                title={
                  ladder?.[level]
                    ? `T${turn.index} · ${ladder[level]}`
                    : `T${turn.index} · escalation ${level}`
                }
              />
              <span className="font-plex-mono text-[10px] text-zinc-600">
                T{turn.index}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
