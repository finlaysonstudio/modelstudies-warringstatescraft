/**
 * Bootstrap helpers shared by the report definitions. Every interval is a
 * percentile 95% interval over `bootstrap` resamples from a seeded LCG, so
 * a report rebuilt from the same runs reproduces to the digit.
 */

export interface BootstrapOptions {
  bootstrap?: number;
  seed?: number;
}

export const DEFAULT_BOOTSTRAP = 10000;

export const rng = (seed: number) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
};

export const mean = (values: number[]): number =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

export const percentile = (sorted: number[], p: number): number =>
  sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
    : 0;

export const interval = (samples: number[]): [number, number] => {
  const sorted = [...samples].sort((a, b) => a - b);
  return [percentile(sorted, 0.025), percentile(sorted, 0.975)];
};

/** column means of a row matrix */
export const columnMeans = (rows: number[][], width: number): number[] => {
  const sums = new Array<number>(width).fill(0);
  for (const row of rows) {
    for (let column = 0; column < width; column++) sums[column] += row[column];
  }
  return sums.map((sum) => (rows.length ? sum / rows.length : 0));
};

const resample = (rows: number[][], next: () => number): number[][] =>
  rows.map(() => rows[Math.floor(next() * rows.length)]);

/**
 * A statistic of a row matrix, with a bootstrap interval per output
 * column. `stat` must return the same width on every call.
 */
export const bootstrapStat = (
  rows: number[][],
  stat: (rows: number[][]) => number[],
  { bootstrap = DEFAULT_BOOTSTRAP, seed = 42 }: BootstrapOptions = {},
): { value: number[]; ci: [number, number][] } => {
  const value = stat(rows);
  if (!rows.length) return { value, ci: value.map(() => [0, 0]) };
  const next = rng(seed);
  const samples: number[][] = value.map(() => []);
  for (let round = 0; round < bootstrap; round++) {
    const drawn = stat(resample(rows, next));
    for (let column = 0; column < drawn.length; column++) {
      samples[column].push(drawn[column]);
    }
  }
  return { value, ci: samples.map(interval) };
};

/**
 * Difference of column means, `a - b`, each side resampled independently
 * (Lamparth et al. 2024 `calc_comp`), with a bootstrap interval per column.
 */
export const bootstrapDiff = (
  a: number[][],
  b: number[][],
  width: number,
  { bootstrap = DEFAULT_BOOTSTRAP, seed = 42 }: BootstrapOptions = {},
): { value: number[]; ci: [number, number][] } => {
  const meansA = columnMeans(a, width);
  const meansB = columnMeans(b, width);
  const value = meansA.map((m, column) => m - meansB[column]);
  if (!a.length || !b.length) return { value, ci: value.map(() => [0, 0]) };
  const next = rng(seed);
  const samples: number[][] = value.map(() => []);
  for (let round = 0; round < bootstrap; round++) {
    const drawnA = columnMeans(resample(a, next), width);
    const drawnB = columnMeans(resample(b, next), width);
    for (let column = 0; column < width; column++) {
      samples[column].push(drawnA[column] - drawnB[column]);
    }
  }
  return { value, ci: samples.map(interval) };
};
