/**
 * Walking that respects walls. A site drawn from a kit has interiors, and a
 * figure told to go from the kitchen to the hall has to leave by the door,
 * cross the court, and come in by the other door, rather than pass through
 * the wall between. The scene builds a blocked grid from the kit pieces the
 * map lays and the water it paints, and this finds a way across it.
 *
 * Four-connected A* on the cell grid with a Manhattan heuristic: a figure
 * never cuts a corner, because a doorway is two cells wide and a corner cut
 * beside a jamb reads as walking through it. The endpoints are always
 * allowed, since a place may stand on furniture or in a doorway, and a path
 * is a list of cells from the start to the goal inclusive, or null when no
 * way exists.
 */

export interface Cell {
  x: number;
  y: number;
}

export interface Grid {
  width: number;
  height: number;
  /** one byte per cell, row-major; non-zero is blocked */
  blocked: Uint8Array;
}

const STEPS: readonly Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/** a binary heap of cell indexes keyed by f, smallest first */
class Heap {
  private items: number[] = [];
  constructor(private readonly f: Float64Array) {}
  get size(): number {
    return this.items.length;
  }
  push(index: number): void {
    const items = this.items;
    items.push(index);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.f[items[parent]] <= this.f[items[i]]) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }
  pop(): number {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length && last !== undefined) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let best = i;
        if (left < items.length && this.f[items[left]] < this.f[items[best]])
          best = left;
        if (right < items.length && this.f[items[right]] < this.f[items[best]])
          best = right;
        if (best === i) break;
        [items[best], items[i]] = [items[i], items[best]];
        i = best;
      }
    }
    return top;
  }
}

/**
 * The cells from `from` to `to`, both included, or null when the goal cannot
 * be reached. A start or goal off the grid is null too.
 */
export const findPath = ({
  grid,
  from,
  to,
}: {
  grid: Grid;
  from: Cell;
  to: Cell;
}): Cell[] | null => {
  const { width, height, blocked } = grid;
  const inside = (cell: Cell): boolean =>
    cell.x >= 0 && cell.y >= 0 && cell.x < width && cell.y < height;
  if (!inside(from) || !inside(to)) return null;
  const at = (cell: Cell): number => cell.y * width + cell.x;
  const start = at(from);
  const goal = at(to);
  if (start === goal) return [from];
  const size = width * height;
  const g = new Float64Array(size).fill(Number.POSITIVE_INFINITY);
  const f = new Float64Array(size).fill(Number.POSITIVE_INFINITY);
  const came = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const h = (index: number): number =>
    Math.abs((index % width) - to.x) +
    Math.abs(Math.floor(index / width) - to.y);
  g[start] = 0;
  f[start] = h(start);
  const open = new Heap(f);
  open.push(start);
  while (open.size) {
    const current = open.pop();
    if (current === goal) {
      const path: Cell[] = [];
      for (let index = goal; index !== -1; index = came[index]) {
        path.push({ x: index % width, y: Math.floor(index / width) });
      }
      return path.reverse();
    }
    if (closed[current]) continue;
    closed[current] = 1;
    const cx = current % width;
    const cy = Math.floor(current / width);
    for (const step of STEPS) {
      const nx = cx + step.x;
      const ny = cy + step.y;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const next = ny * width + nx;
      if (closed[next]) continue;
      // the goal is always allowed: a place may stand on what blocks
      if (blocked[next] && next !== goal) continue;
      const tentative = g[current] + 1;
      if (tentative >= g[next]) continue;
      came[next] = current;
      g[next] = tentative;
      f[next] = tentative + h(next);
      open.push(next);
    }
  }
  return null;
};

/** Drops every cell that lies on the straight run between its neighbours. */
export const simplifyPath = (path: Cell[]): Cell[] => {
  if (path.length < 3) return path;
  const out: Cell[] = [path[0]];
  for (let i = 1; i < path.length - 1; i += 1) {
    const before = out[out.length - 1];
    const here = path[i];
    const after = path[i + 1];
    const straight =
      (here.x - before.x) * (after.y - here.y) ===
      (here.y - before.y) * (after.x - here.x);
    if (!straight) out.push(here);
  }
  out.push(path[path.length - 1]);
  return out;
};
