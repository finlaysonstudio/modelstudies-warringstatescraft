// Deterministic presentation order. The same seed always yields the same
// permutation, so independently running sittings (one process per model)
// agree on each turn's order without any coordination — consistency across
// a panel falls out of the seed convention, not shared state.

export interface SeededShuffleOptions {
  seed: string;
}

export interface TurnSeedOptions {
  plan: string;
  item: string;
  /** 1-based repetition number within the sitting. */
  turn: number;
}

// FNV-1a 32-bit string hash.
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// mulberry32 PRNG — small, fast, and stable across runtimes.
function mulberry32(state: number): () => number {
  let a = state;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle driven by a string seed; the input is not mutated. */
export function seededShuffle<T>(
  items: readonly T[],
  options: SeededShuffleOptions,
): T[] {
  const random = mulberry32(hashSeed(options.seed));
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * The canonical seed for one turn of one item: every respondent on the same
 * plan sees the same option order on the same repetition.
 */
export function turnSeed(options: TurnSeedOptions): string {
  return `${options.plan}:${options.item}:${options.turn}`;
}

export interface BalancedOrdersOptions {
  /** Per-item seed, e.g. `${plan}:${item}` — no turn component. */
  seed: string;
  /** Number of repetitions to produce an order for. */
  turns: number;
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += 1) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) {
      result.push([items[i]!, ...tail]);
    }
  }
  return result;
}

/**
 * One option order per turn, balanced across the run: the full permutation
 * set is cycled to cover every turn, then the sequence is seeded-shuffled —
 * so 12 turns of a two-option item present each order exactly 6 times
 * (counts stay within ±1 whenever turns is not a multiple of the
 * permutation count). Deterministic in (seed, turns), so independent
 * sittings agree turn by turn. Items with more than 5 options fall back to
 * an independent per-turn shuffle (the permutation set is too large to
 * balance meaningfully).
 */
export function balancedOrders<T>(
  items: readonly T[],
  options: BalancedOrdersOptions,
): T[][] {
  const { seed, turns } = options;
  if (turns < 1) return [];
  if (items.length < 2) {
    return Array.from({ length: turns }, () => [...items]);
  }
  if (items.length > 5) {
    return Array.from({ length: turns }, (_, index) =>
      seededShuffle(items, { seed: `${seed}:${index + 1}` }),
    );
  }
  const cycle = permutations(items);
  const deck: T[][] = [];
  while (deck.length < turns) deck.push(...cycle);
  return seededShuffle(deck, { seed }).slice(0, turns);
}
