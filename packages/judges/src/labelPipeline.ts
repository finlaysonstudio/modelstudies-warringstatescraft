// Helpers shared across the labeling pipeline services
// (interview-labeling-panel, interview-label-reducer, label-meta-consensus).

// A minimal worker pool: run every task, at most `concurrency` in flight.
export async function runPool<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array<T>(tasks.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, tasks.length)) },
    async () => {
      while (next < tasks.length) {
        const index = next++;
        results[index] = await tasks[index]!();
      }
    },
  );
  await Promise.all(workers);
  return results;
}

// Labels normalize to lowercase per the conventions, deduped in-list.
export function toLabels(content: unknown): string[] {
  const labels = (content as { labels?: unknown } | null)?.labels;
  if (!Array.isArray(labels)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of labels) {
    if (typeof entry !== "string") continue;
    const normalized = entry.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

// Exact-string votes across lists, most votes first, alphabetical within a
// count.
export function tallyVotes(
  lists: { labels?: string[]; error?: string }[],
): { label: string; votes: number }[] {
  const votes = new Map<string, number>();
  for (const list of lists) {
    if (list.error) continue;
    for (const label of list.labels ?? []) {
      votes.set(label, (votes.get(label) ?? 0) + 1);
    }
  }
  return [...votes.entries()]
    .map(([label, count]) => ({ label, votes: count }))
    .sort(
      (left, right) =>
        right.votes - left.votes || left.label.localeCompare(right.label),
    );
}
