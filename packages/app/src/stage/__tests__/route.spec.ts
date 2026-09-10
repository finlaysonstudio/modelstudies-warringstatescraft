import { describe, expect, it } from "vitest";

import { findPath, simplifyPath, type Grid } from "../route";

/** a grid drawn as rows of `.` (open) and `#` (blocked) */
const gridOf = (rows: string[]): Grid => ({
  width: rows[0].length,
  height: rows.length,
  blocked: Uint8Array.from(rows.join(""), (c) => (c === "#" ? 1 : 0)),
});

describe("findPath", () => {
  it("walks straight across open ground", () => {
    const grid = gridOf(["....", "....", "...."]);
    const path = findPath({ grid, from: { x: 0, y: 1 }, to: { x: 3, y: 1 } });
    expect(path).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ]);
  });

  it("goes round a wall by its door rather than through it", () => {
    // a room with one door in its south wall; the way in is by the door
    const grid = gridOf([
      "#######",
      "#.....#",
      "#.....#",
      "###.###",
      ".......",
    ]);
    const path = findPath({ grid, from: { x: 0, y: 4 }, to: { x: 5, y: 1 } });
    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 0, y: 4 });
    expect(path![path!.length - 1]).toEqual({ x: 5, y: 1 });
    expect(path).toContainEqual({ x: 3, y: 3 });
    for (const cell of path!) {
      expect(
        grid.blocked[cell.y * grid.width + cell.x],
        `${cell.x},${cell.y}`,
      ).toBe(0);
    }
  });

  it("never cuts a corner", () => {
    const grid = gridOf(["..", ".."]);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 1, y: 1 } });
    expect(path).toHaveLength(3);
  });

  it("allows the goal itself to stand on what blocks", () => {
    const grid = gridOf(["..#"]);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 2, y: 0 } });
    expect(path).toHaveLength(3);
  });

  it("answers null when no way exists, or a point is off the grid", () => {
    const grid = gridOf([".#."]);
    expect(
      findPath({ grid, from: { x: 0, y: 0 }, to: { x: 2, y: 0 } }),
    ).toBeNull();
    expect(
      findPath({ grid, from: { x: 0, y: 0 }, to: { x: 3, y: 0 } }),
    ).toBeNull();
  });

  it("is the point itself when the goal is the start", () => {
    const grid = gridOf(["..."]);
    expect(
      findPath({ grid, from: { x: 1, y: 0 }, to: { x: 1, y: 0 } }),
    ).toEqual([{ x: 1, y: 0 }]);
  });
});

describe("simplifyPath", () => {
  it("keeps only the turns", () => {
    expect(
      simplifyPath([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
    ]);
  });

  it("leaves a short path alone", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    expect(simplifyPath(path)).toBe(path);
  });
});

describe("findPath with a cost grid", () => {
  /** rows of digits: the cost of each cell, `0` blocked */
  const costGridOf = (rows: string[]): Grid => {
    const cost = Uint8Array.from(rows.join(""), (c) => Number(c));
    return {
      width: rows[0].length,
      height: rows.length,
      blocked: cost.map((c) => (c === 0 ? 1 : 0)),
      cost,
    };
  };

  it("keeps to the lane past a field", () => {
    // a road one row below the straight line: down, along, and up is cheaper
    const grid = costGridOf(["88888", "11111", "88888"]);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 4, y: 0 } });
    expect(path).not.toBeNull();
    expect(path!.filter((cell) => cell.y === 1).length).toBe(5);
  });

  it("takes the straight line when the detour costs more", () => {
    const grid = costGridOf(["11111", "11111", "88888"]);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 4, y: 0 } });
    expect(path).toEqual([0, 1, 2, 3, 4].map((x) => ({ x, y: 0 })));
  });

  it("still refuses a blocked cell and allows the goal on one", () => {
    const grid = costGridOf(["101", "101", "111"]);
    const path = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 2, y: 0 } });
    expect(path).not.toBeNull();
    expect(path!.some((cell) => cell.x === 1 && cell.y < 2)).toBe(false);
    const onto = findPath({ grid, from: { x: 0, y: 0 }, to: { x: 1, y: 0 } });
    expect(onto).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
  });
});
