import { clsx } from "clsx";
import { useState } from "react";
import type { UsageRole, UsageRow, UsageTotals } from "../lib/types";
import { formatTokens, formatUsd, groupUsage } from "../lib/usage";
import { Bar } from "./PonyBenchPrimitives";

// Cost and token usage for a run, a tree, or a study: one block with the
// total in its bar and three tables inside (by role, by model, by seat).
// Every number is a sum of what each call recorded at the time it was made.

const ROLE_LABEL: Record<UsageRole, string> = {
  seat: "seats",
  judge: "judges",
  narrator: "narrator",
  debrief: "debriefs",
};

const th = "py-1.5 pr-4 font-normal whitespace-nowrap";
const td = "py-1.5 pr-4 align-top whitespace-nowrap";
const num = clsx(td, "text-right font-plex-mono text-zinc-400 tabular-nums");

export function usageDetail(total: UsageTotals): string {
  if (!total.calls) return "no usage recorded";
  return (
    `${formatUsd(total.usd)}${total.unpriced ? "+" : ""} · ${total.calls} calls · ` +
    `${formatTokens(total.input + total.cacheRead)} in · ${formatTokens(
      total.output + total.reasoning,
    )} out`
  );
}

function TotalsCells({ totals }: { totals: UsageTotals }) {
  return (
    <>
      <td className={num}>{totals.calls}</td>
      <td className={num}>{formatTokens(totals.input)}</td>
      <td className={num}>
        {totals.cacheRead ? formatTokens(totals.cacheRead) : "—"}
      </td>
      <td className={num}>{formatTokens(totals.output)}</td>
      <td className={num}>
        {totals.reasoning ? formatTokens(totals.reasoning) : "—"}
      </td>
      <td className={clsx(num, "text-zinc-200")}>
        {formatUsd(totals.usd)}
        {totals.unpriced > 0 && (
          <span
            className="text-amber-300"
            title={`${totals.unpriced} call(s) had no list price at call time`}
          >
            +
          </span>
        )}
      </td>
    </>
  );
}

function UsageTable({
  label,
  rows,
}: {
  label: string;
  rows: { key: string; totals: UsageTotals }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto px-4 pb-3">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 font-plex-mono text-[10px] tracking-wide text-zinc-500 uppercase">
            <th className={th}>{label}</th>
            <th className={clsx(th, "text-right")}>Calls</th>
            <th className={clsx(th, "text-right")}>Input</th>
            <th className={clsx(th, "text-right")}>Cached</th>
            <th className={clsx(th, "text-right")}>Output</th>
            <th className={clsx(th, "text-right")}>Reasoning</th>
            <th className={clsx(th, "text-right")}>USD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-white/5">
              <td className={clsx(td, "text-zinc-200")}>{row.key}</td>
              <TotalsCells totals={row.totals} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsageSection({
  total,
  rows,
  note,
  defaultOpen = false,
  delay = 0,
}: {
  total: UsageTotals;
  rows: UsageRow[];
  /** what the sum covers, e.g. "this run and its 6 branches" */
  note?: string;
  defaultOpen?: boolean;
  delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!total.calls) return null;
  const byRole = groupUsage(rows, (row) => row.role).map((group) => ({
    key: ROLE_LABEL[group.key],
    totals: group.totals,
  }));
  const byModel = groupUsage(rows, (row) => row.model);
  const bySeat = rows
    .filter((row) => row.role === "seat")
    .map((row) => ({ key: `${row.seat} ← ${row.model}`, totals: row }));
  return (
    <section
      className="animate-rise mt-10 rounded-sm border border-white/10 bg-white/[0.02] motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
      aria-label="Cost"
    >
      <Bar
        open={open}
        onToggle={() => setOpen((value) => !value)}
        label="Cost"
        detail={usageDetail(total)}
      />
      {open && (
        <div className="border-t border-white/5 pt-2">
          {note && (
            <p className="px-4 pb-2 font-plex-mono text-[10px] text-zinc-600">
              {note}
            </p>
          )}
          <UsageTable label="Role" rows={byRole} />
          <UsageTable label="Model" rows={byModel} />
          <UsageTable label="Seat" rows={bySeat} />
          <p className="px-4 pb-3 font-plex-mono text-[10px] text-zinc-600">
            USD is the list price in force when each call was made. Input
            excludes cached reads; reasoning is shown beside output where the
            provider reports it separately.
            {total.unpriced > 0 &&
              ` ${total.unpriced} call(s) had no list price (marked +).`}
          </p>
        </div>
      )}
    </section>
  );
}
