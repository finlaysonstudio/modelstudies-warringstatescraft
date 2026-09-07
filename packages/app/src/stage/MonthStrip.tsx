import clsx from "clsx";

import {
  MONTHS,
  SEASONS,
  SEASON_LABELS,
  type Month,
  type Season,
} from "./almanac";

/**
 * The twelve months in their four seasons, one button each, for a page that
 * shows a map in a month of the almanac. A site page always has a month;
 * the explorer may have none, which `allowNone` offers as a first button.
 */
export function MonthStrip({
  month,
  language,
  onPick,
  allowNone = false,
}: {
  month: Month | null;
  language: "en" | "zh";
  onPick: (month: Month | null) => void;
  allowNone?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={language === "zh" ? "月" : "month"}
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      {allowNone && (
        <button
          type="button"
          onClick={() => onPick(null)}
          className={clsx(
            "cursor-pointer rounded-sm border border-white/10 px-2 py-1 font-plex-mono text-[10px] tracking-wide uppercase hover:bg-white/5",
            month === null ? "bg-white/10 text-white" : "text-zinc-500",
          )}
        >
          {language === "zh" ? "无时" : "no season"}
        </button>
      )}
      {SEASONS.map((season: Season) => (
        <span
          key={season}
          className="flex items-center gap-x-1 rounded-sm border border-white/10 p-0.5"
        >
          <span className="px-1 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            {SEASON_LABELS[season][language]}
          </span>
          {MONTHS.filter((record) => record.season === season).map((record) => (
            <button
              key={record.month}
              type="button"
              title={`${record.name.zh} · ${record.name.en}`}
              aria-pressed={record.month === month}
              onClick={() => onPick(record.month)}
              className={clsx(
                "cursor-pointer rounded-sm px-1.5 py-1 font-plex-mono text-[10px] tracking-wide uppercase",
                record.month === month
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {language === "zh" ? record.name.zh : record.month}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
