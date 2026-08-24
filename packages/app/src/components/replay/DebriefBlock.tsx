import { useState } from "react";
import { Bar } from "../PonyBenchPrimitives";

// One seat's end-of-game debrief, collapsed to its bar.
export function DebriefBlock({
  debrief,
}: {
  debrief: { seat: string; model: string; text: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-white/10 bg-black/20">
      <Bar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label={debrief.seat}
        detail={debrief.model}
      />
      {open && (
        <div className="border-t border-white/5 px-4 py-4">
          <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-line text-zinc-300">
            {debrief.text}
          </p>
        </div>
      )}
    </div>
  );
}
