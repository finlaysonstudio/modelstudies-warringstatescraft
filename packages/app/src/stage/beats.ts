import type { StageBeat, StageDirection, StageEffect } from "../lib/types";

/** A point on the map in pixels. */
export interface StagePoint {
  x: number;
  y: number;
}

export type StagePlaces = Record<string, StagePoint>;

/** One direction resolved onto the map, ready for the scene to animate. */
export interface StageAction {
  direction: StageDirection;
  /** Where the actors appear; a route starts here. */
  from: StagePoint;
  /** Where the direction lands (a route's destination, an `at`, or the home). */
  to: StagePoint;
  /** Whether the actors travel from `from` to `to`. */
  travels: boolean;
  count: number;
  effect?: StageEffect;
  /** Walk time in milliseconds (0 when nothing travels). */
  walkMs: number;
  /** Time held at `to` after arrival. */
  holdMs: number;
  /** Total time before the action fades. */
  totalMs: number;
}

export interface StagePlan {
  beat: StageBeat;
  actions: StageAction[];
  /** The point the camera settles on. */
  focus: StagePoint;
  /** The rectangle every action fits in (pixels). */
  bounds: { x: number; y: number; width: number; height: number };
  /** The plan's running time. */
  durationMs: number;
}

export const WALK_SPEED_PX_PER_S = 160;
export const WALK_MIN_MS = 900;
export const WALK_MAX_MS = 3200;
export const HOLD_MS = 900;
export const AT_MS = 1600;
export const PAN_MS = 500;
export const TAIL_MS = 300;

const DEFAULT_COUNT = 1;

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

/** The place a direction lands on: `to` for a route, `at` when given, else the home. */
export const landingOf = (
  direction: StageDirection,
  home: string | undefined,
): string | undefined => direction.to ?? direction.at ?? home;

export const planAction = ({
  direction,
  places,
  home,
}: {
  direction: StageDirection;
  places: StagePlaces;
  home?: string;
}): StageAction | null => {
  const landing = landingOf(direction, home);
  const to = landing ? places[landing] : undefined;
  if (!to) return null;
  const origin = direction.from ? places[direction.from] : undefined;
  const travels = origin !== undefined && direction.from !== landing;
  const from = origin ?? to;
  const distance = travels ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
  const walkMs = travels
    ? clamp(
        Math.round((distance / WALK_SPEED_PX_PER_S) * 1000),
        WALK_MIN_MS,
        WALK_MAX_MS,
      )
    : 0;
  const holdMs = travels ? HOLD_MS : AT_MS;
  return {
    direction,
    from,
    to,
    travels,
    count: clamp(direction.count ?? DEFAULT_COUNT, 1, 16),
    effect: direction.effect,
    walkMs,
    holdMs,
    totalMs: walkMs + holdMs,
  };
};

/**
 * Lays a beat out on the map. Actions play together; the plan lasts as long
 * as its longest action plus the camera pan and a short tail.
 */
export const planBeat = ({
  beat,
  places,
  homes,
}: {
  beat: StageBeat;
  places: StagePlaces;
  /** seat → home place key */
  homes: Record<string, string>;
}): StagePlan => {
  const actions = beat.directions
    .map((direction) =>
      planAction({ direction, places, home: homes[direction.actor.seat] }),
    )
    .filter((action): action is StageAction => action !== null);
  const points: StagePoint[] = actions.flatMap((action) => [
    action.from,
    action.to,
  ]);
  const focusKey = beat.focus ? places[beat.focus] : undefined;
  if (focusKey) points.push(focusKey);
  if (points.length === 0 && beat.seat && homes[beat.seat]) {
    const home = places[homes[beat.seat]];
    if (home) points.push(home);
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const bounds =
    points.length === 0
      ? { x: 0, y: 0, width: 0, height: 0 }
      : {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
  const focus =
    focusKey ??
    (points.length
      ? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
      : { x: 0, y: 0 });
  const longest = actions.reduce(
    (max, action) => Math.max(max, action.totalMs),
    0,
  );
  return {
    beat,
    actions,
    focus,
    bounds,
    durationMs: PAN_MS + (actions.length ? longest : AT_MS / 2) + TAIL_MS,
  };
};

/** The facing a walk from `from` to `to` should show. */
export const facingOf = (
  from: StagePoint,
  to: StagePoint,
): "down" | "left" | "right" | "up" => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
};

/** Offsets that spread `count` actors around a point, in a loose column. */
export const formation = (count: number, spacing = 10): StagePoint[] =>
  Array.from({ length: count }, (_, i) => ({
    x: (i % 4) * spacing - (Math.min(count, 4) - 1) * (spacing / 2),
    y:
      Math.floor(i / 4) * spacing - Math.floor((count - 1) / 4) * (spacing / 2),
  }));
