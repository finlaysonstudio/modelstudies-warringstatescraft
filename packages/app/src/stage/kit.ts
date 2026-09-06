/**
 * A building kit: the eighty pieces PixelLab's `create_building_kit` returns
 * for a square top-down kit, indexed the same way in every kit it generates.
 * The builder composes a room's walls and roof out of them and the scene
 * draws what the builder composed, so the table lives here, browser-safe,
 * and both sides read the one copy.
 *
 * Every piece is drawn on one canvas whose cell footprint sits at a fixed
 * offset: a wall's top surface is lifted by the wall's height, a roof's
 * eaves hang past the cell on every side, and a south wall's face hangs
 * down to the cell's own bottom edge. The period build stretches the
 * generator's foreshortened 32 × 24 footprint to the map's square 32 × 32
 * (`KIT_STRETCH`), and `KIT_FRAME` and `KIT_CELL` describe the stretched
 * canvas the manifest carries.
 */

export const KIT_PIECES = 80;
export const KIT_COLUMNS = 10;

/**
 * How many cells tall a wall stands (the kit's `wall_tiles`). A roof sits on
 * top of the walls, and in a top-down drawing height goes up the screen, so
 * the roof over a room is laid this many rows north of the floor it covers.
 */
export const KIT_WALL_TILES = 2;

/** the generator's canvas: 52 × 87 with the 32 × 24 footprint at (10, 55) */
export const KIT_SOURCE = {
  width: 52,
  height: 87,
  cell: { x: 10, y: 55, width: 32, height: 24 },
} as const;

/** rows are stretched by this so the footprint becomes square */
export const KIT_STRETCH = 32 / 24;

/** the stretched canvas every frame of a kit sheet is */
export const KIT_FRAME = { width: 52, height: 116 } as const;

/** where the 32 × 32 cell sits on the stretched canvas */
export const KIT_CELL = { x: 10, y: 74, size: 32 } as const;

export type Side = "n" | "e" | "s" | "w";
export type Corner = "ne" | "se" | "sw" | "nw";

/** piece index by role, as `get_tiles_pro` reports them */
export const KIT = {
  floor: 0,
  /** a wall along one edge of the cell, seen from inside the room */
  side: { n: 1, e: 2, s: 3, w: 4 } as Record<Side, number>,
  /** the inner (concave) corner block */
  corner: { ne: 5, se: 6, sw: 7, nw: 8 } as Record<Corner, number>,
  /** the outer corner: two walls meeting at the room's corner */
  outer: { ne: 9, se: 10, sw: 11, nw: 12 } as Record<Corner, number>,
  pillar: 31,
  /**
   * doorways: a north or south door is two cells wide (`a` carries the left
   * jamb, `b` the right); an east or west door is the gap between `a`, the
   * wall's end north of it, and `b`, the wall resuming south of it
   */
  door: {
    n: [32, 33],
    e: [34, 35],
    s: [36, 37],
    w: [38, 39],
  } as Record<Side, [number, number]>,
  /** the flat roof surface, at floor level (a terrace) */
  floorRoof: 44,
  roof: {
    eave: { n: 60, e: 61, s: 62, w: 63 } as Record<Side, number>,
    hip: { ne: 64, se: 65, sw: 66, nw: 67 } as Record<Corner, number>,
    valley: { ne: 68, se: 69, sw: 70, nw: 71 } as Record<Corner, number>,
    ridge: { ew: 72, ns: 73 },
    end: { e: 74, w: 75, n: 76, s: 77 } as Record<Side, number>,
    pyramid: 78,
    interior: 79,
  },
} as const;

/** the pieces a figure may stand on: the floor and the doorways */
export const KIT_PASSABLE: ReadonlySet<number> = new Set([
  KIT.floor,
  KIT.floorRoof,
  ...KIT.door.n,
  ...KIT.door.s,
]);

/** one piece placed on one cell */
export interface KitPlacement {
  x: number;
  y: number;
  piece: number;
}

/**
 * A hipped roof over a `width` × `height` footprint: hips at the corners,
 * eaves along the edges, a ridge down the long axis with its ends at the
 * eaves, and the slope's interior between. A single cell takes the pyramid.
 * The roof is lifted `lift` rows up the screen, since it sits on the walls
 * rather than on the floor, and the wall's south face shows beneath its
 * eave the way a door does under a porch.
 */
export const roofOf = ({
  x,
  y,
  width,
  height,
  lift = KIT_WALL_TILES,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  lift?: number;
}): KitPlacement[] => {
  const out: KitPlacement[] = [];
  const put = (dx: number, dy: number, piece: number): void => {
    out.push({ x: x + dx, y: y + dy - lift, piece });
  };
  const { roof } = KIT;
  if (width === 1 && height === 1) {
    put(0, 0, roof.pyramid);
    return out;
  }
  if (height === 1) {
    for (let i = 0; i < width; i += 1) {
      put(
        i,
        0,
        i === 0 ? roof.end.w : i === width - 1 ? roof.end.e : roof.ridge.ew,
      );
    }
    return out;
  }
  if (width === 1) {
    for (let j = 0; j < height; j += 1) {
      put(
        0,
        j,
        j === 0 ? roof.end.n : j === height - 1 ? roof.end.s : roof.ridge.ns,
      );
    }
    return out;
  }
  if (width >= height) {
    const ridgeRow = Math.floor((height - 1) / 2);
    for (let j = 0; j < height; j += 1) {
      for (let i = 0; i < width; i += 1) {
        const left = i === 0;
        const right = i === width - 1;
        const top = j === 0;
        const bottom = j === height - 1;
        let piece: number;
        if (top && left) piece = roof.hip.nw;
        else if (top && right) piece = roof.hip.ne;
        else if (bottom && left) piece = roof.hip.sw;
        else if (bottom && right) piece = roof.hip.se;
        else if (top) piece = roof.eave.n;
        else if (bottom) piece = roof.eave.s;
        else if (j === ridgeRow)
          piece = left ? roof.end.w : right ? roof.end.e : roof.ridge.ew;
        else if (left) piece = roof.eave.w;
        else if (right) piece = roof.eave.e;
        else piece = roof.interior;
        put(i, j, piece);
      }
    }
    return out;
  }
  const ridgeColumn = Math.floor((width - 1) / 2);
  for (let j = 0; j < height; j += 1) {
    for (let i = 0; i < width; i += 1) {
      const left = i === 0;
      const right = i === width - 1;
      const top = j === 0;
      const bottom = j === height - 1;
      let piece: number;
      if (top && left) piece = roof.hip.nw;
      else if (top && right) piece = roof.hip.ne;
      else if (bottom && left) piece = roof.hip.sw;
      else if (bottom && right) piece = roof.hip.se;
      else if (left) piece = roof.eave.w;
      else if (right) piece = roof.eave.e;
      else if (i === ridgeColumn)
        piece = top ? roof.end.n : bottom ? roof.end.s : roof.ridge.ns;
      else if (top) piece = roof.eave.n;
      else if (bottom) piece = roof.eave.s;
      else piece = roof.interior;
      put(i, j, piece);
    }
  }
  return out;
};

export interface DoorSpec {
  side: Side;
  /** cells from the room's north-west corner along that side */
  at: number;
  /** cells the opening spans (a north or south door is always two) */
  width?: number;
}

/**
 * The wall ring of a `width` × `height` room, one cell thick, with its
 * doors cut: outer corners at the four corners, sides between, a two-cell
 * doorway in a north or south wall, and a gap of `width` cells in an east
 * or west wall with the wall's end pieces either side of it.
 */
export const wallsOf = ({
  x,
  y,
  width,
  height,
  doors = [],
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  doors?: DoorSpec[];
}): KitPlacement[] => {
  const pieces = new Map<string, number | null>();
  const key = (i: number, j: number): string => `${i},${j}`;
  const set = (i: number, j: number, piece: number | null): void => {
    pieces.set(key(i, j), piece);
  };
  for (let i = 0; i < width; i += 1) {
    set(i, 0, KIT.side.n);
    set(i, height - 1, KIT.side.s);
  }
  for (let j = 0; j < height; j += 1) {
    set(0, j, KIT.side.w);
    set(width - 1, j, KIT.side.e);
  }
  set(0, 0, KIT.outer.nw);
  set(width - 1, 0, KIT.outer.ne);
  set(0, height - 1, KIT.outer.sw);
  set(width - 1, height - 1, KIT.outer.se);
  for (const door of doors) {
    const [a, b] = KIT.door[door.side];
    if (door.side === "n" || door.side === "s") {
      const j = door.side === "n" ? 0 : height - 1;
      const span = Math.max(2, door.width ?? 2);
      set(door.at, j, a);
      set(door.at + span - 1, j, b);
      for (let i = door.at + 1; i < door.at + span - 1; i += 1) set(i, j, null);
    } else {
      const i = door.side === "e" ? width - 1 : 0;
      const span = Math.max(1, door.width ?? 1);
      if (door.at > 0) set(i, door.at - 1, a);
      for (let j = door.at; j < door.at + span; j += 1) set(i, j, null);
      if (door.at + span < height) set(i, door.at + span, b);
    }
  }
  const out: KitPlacement[] = [];
  for (const [at, piece] of pieces) {
    if (piece === null) continue;
    const [i, j] = at.split(",").map(Number);
    out.push({ x: x + i, y: y + j, piece });
  }
  return out;
};

export interface WallGap {
  /** cells from the wall's start */
  at: number;
  width?: number;
}

/**
 * A freestanding wall from one cell to another along a row or a column,
 * seen from the south: a row wears the north-side piece (its top and its
 * south face) and a column the east-side piece (its top alone). A gap in a
 * row is a two-cell doorway with a lintel; a gap in a column is open, with
 * the wall's end pieces either side.
 */
export const wallLineOf = ({
  from,
  to,
  gaps = [],
}: {
  from: [number, number];
  to: [number, number];
  gaps?: WallGap[];
}): KitPlacement[] => {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const pieces: (number | null)[] = [];
  if (y0 === y1) {
    const length = Math.abs(x1 - x0) + 1;
    for (let i = 0; i < length; i += 1) pieces.push(KIT.side.n);
    for (const gap of gaps) {
      const span = Math.max(2, gap.width ?? 2);
      pieces[gap.at] = KIT.door.n[0];
      pieces[gap.at + span - 1] = KIT.door.n[1];
      for (let i = gap.at + 1; i < gap.at + span - 1; i += 1) pieces[i] = null;
    }
    const step = x1 >= x0 ? 1 : -1;
    return pieces.flatMap((piece, i) =>
      piece === null ? [] : [{ x: x0 + i * step, y: y0, piece }],
    );
  }
  if (x0 === x1) {
    const length = Math.abs(y1 - y0) + 1;
    for (let j = 0; j < length; j += 1) pieces.push(KIT.side.e);
    for (const gap of gaps) {
      const span = Math.max(1, gap.width ?? 1);
      if (gap.at > 0) pieces[gap.at - 1] = KIT.door.e[0];
      for (let j = gap.at; j < gap.at + span; j += 1) pieces[j] = null;
      if (gap.at + span < length) pieces[gap.at + span] = KIT.door.e[1];
    }
    const step = y1 >= y0 ? 1 : -1;
    return pieces.flatMap((piece, j) =>
      piece === null ? [] : [{ x: x0, y: y0 + j * step, piece }],
    );
  }
  return [];
};
