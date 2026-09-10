/**
 * The register as a thing that stands and changes: who is on it, who is
 * away, what a role does in a month. Browser-safe and data-only, so the
 * page, the scene's populace, and the specs read one implementation.
 *
 * `villagersOf` flattens a register and its visitors into the townsfolk the
 * page has always read, `registerAt` folds every earlier month's changes
 * forward the way the Annals fold `WorldChange`, and `circuitOf` resolves a
 * role's day onto the map's own places.
 */
import type { Month } from "./almanac";
import type { StagePoint } from "./beats";
import type {
  Circuit,
  Household,
  Order,
  RegisterChange,
  Role,
  Site,
  Stop,
  Townsperson,
  Villager,
} from "./site";

/** the seat a drawn villager acts under: two of one archetype are two people */
export const seatOfVillager = (site: Pick<Site, "seat">, id: string): string =>
  `${site.seat}:${id}`;

/** the class the page sorts a role under */
export const ORDER_OF_ROLE: Record<Role, Order> = {
  head: "household",
  son: "household",
  brother: "household",
  wife: "household",
  daughter: "household",
  child: "household",
  old: "household",
  elder: "official",
  oxmaster: "household",
  wulao: "household",
  widow: "household",
  postclerk: "official",
  pedlar: "merchant",
  countyclerk: "official",
  fieldofficer: "official",
  lieutenant: "official",
  ox: "household",
  master: "family",
  lady: "family",
  dowager: "family",
  concubine: "family",
  heir: "family",
  younglady: "family",
  girl: "family",
  steward: "servant",
  retainer: "retainer",
  tutor: "retainer",
  musician: "servant",
  gatekeeper: "servant",
  maid: "servant",
  cook: "servant",
  groom: "servant",
  porter: "servant",
  physician: "retainer",
  invocator: "retainer",
  diviner: "retainer",
  caller: "retainer",
  suitor: "retainer",
  matchmaker: "retainer",
};

/** a villager as the page's townsperson */
export const townspersonOf = (villager: Villager): Townsperson => ({
  id: villager.id,
  archetype: villager.archetype,
  order: ORDER_OF_ROLE[villager.role],
  label: villager.name,
  home: villager.home,
});

/** every villager on a register, in register order, then the visitors */
export const allVillagers = (
  site: Pick<Site, "register" | "visitors">,
): Villager[] => [
  ...(site.register ?? []).flatMap((household) => household.members),
  ...(site.visitors ?? []),
];

/**
 * The drawn people of a registered site as townsfolk, so that everything
 * reading `folk` reads a register too. A site with no register answers with
 * its `folk` as written.
 */
export const villagersOf = (
  site: Pick<Site, "register" | "visitors" | "folk">,
): Townsperson[] =>
  site.register || site.visitors
    ? allVillagers(site)
        .filter((villager) => villager.drawn)
        .map(townspersonOf)
    : [...site.folk];

/** the household a villager belongs to, or none for a visitor */
export const householdOf = (
  site: Pick<Site, "register">,
  villagerId: string,
): Household | undefined =>
  (site.register ?? []).find((household) =>
    household.members.some((member) => member.id === villagerId),
  );

/** the register as it stands in a month, after the earlier months' changes */
export interface RegisterState {
  register: Household[];
  visitors: Villager[];
  /** villager ids away this month and, for the register, why (the change's month) */
  away: Map<string, Month | "year">;
  /** villager ids struck off by an earlier month */
  struck: Set<string>;
}

const cloneHousehold = (household: Household): Household => ({
  ...household,
  members: household.members.map((member) => ({ ...member })),
});

/** applies one change to a register state in place */
export const applyChange = (
  state: RegisterState,
  change: RegisterChange,
  month: Month,
): void => {
  const { villager, set } = change;
  const owner = state.register.find((h) =>
    h.members.some((m) => m.id === villager),
  );
  const member =
    owner?.members.find((m) => m.id === villager) ??
    state.visitors.find((v) => v.id === villager);
  if (!member) return;
  if (set.relation !== undefined) member.relation = set.relation;
  if (set.age !== undefined) member.age = set.age;
  if (set.role !== undefined) member.role = set.role;
  if (set.sprite !== undefined) member.sprite = set.sprite;
  if (set.overlays !== undefined) member.overlays = set.overlays;
  if (set.household !== undefined && owner && set.household !== owner.id) {
    const target = state.register.find((h) => h.id === set.household);
    if (target) {
      owner.members = owner.members.filter((m) => m.id !== villager);
      target.members.push(member);
    }
  }
  if (set.away === "year") state.away.set(villager, "year");
  else if (set.away !== undefined && set.away === month)
    state.away.set(villager, set.away);
  if (set.struck) {
    state.struck.add(villager);
    if (owner) owner.members = owner.members.filter((m) => m.id !== villager);
    state.visitors = state.visitors.filter((v) => v.id !== villager);
  }
};

/**
 * The register in `month`: every change of every earlier month folded
 * forward, in month order. A change `away` for one month keeps the villager
 * off the map in that month alone (including the change's own month, since
 * the page opens a month with its events laid on the first day); `year`
 * keeps them off for the rest of the year; `struck` takes them off the
 * register. The current month's other changes are the populace's to fold at
 * the day's roll-over, so they are not applied here.
 */
export const registerAt = (
  site: Pick<Site, "register" | "visitors" | "events">,
  month: Month,
): RegisterState => {
  const state: RegisterState = {
    register: (site.register ?? []).map(cloneHousehold),
    visitors: (site.visitors ?? []).map((v) => ({ ...v })),
    away: new Map(),
    struck: new Set(),
  };
  const events = [...(site.events ?? [])].sort(
    (a, b) => a.month - b.month || a.day - b.day || a.hour - b.hour,
  );
  for (const event of events) {
    for (const change of event.changes ?? []) {
      if (event.month < month) applyChange(state, change, month);
      else if (event.month === month) {
        // only the month's own absence counts before its day has rolled
        const away = change.set.away;
        if (away === month || away === "year")
          state.away.set(change.villager, away);
      }
    }
  }
  return state;
};

/** whether a villager is drawn on the map in a month */
export const isPresent = (state: RegisterState, villager: Villager): boolean =>
  villager.drawn &&
  !state.away.has(villager.id) &&
  !state.struck.has(villager.id);

/** a small deterministic hash, for the jitter */
const hashOf = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};

/** the widest a stop's hour is moved by the jitter, in double-hours */
export const JITTER_HOURS = 0.12;

/** a stop with its placeholders resolved and its hour jittered */
export interface ResolvedStop extends Omit<Stop, "hour" | "at"> {
  /** a fraction of the day's twelve double-hours, 1 to 13 */
  hour: number;
  /** a place key of the map */
  at: string;
}

/** what a circuit is resolved against: the map's places and their markers */
export interface CircuitContext {
  places: Record<string, StagePoint>;
  /** place key → marker, for the nearest-well rule */
  markers: Record<string, string | undefined>;
  /** the map's exit for `edge`; `edge` itself when the site has such a place */
  edge?: string;
}

const nearest = (
  from: StagePoint,
  keys: string[],
  places: Record<string, StagePoint>,
): string | undefined => {
  let best: string | undefined;
  let bestD = Number.POSITIVE_INFINITY;
  for (const key of keys) {
    const p = places[key];
    if (!p) continue;
    const d = Math.hypot(p.x - from.x, p.y - from.y);
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  }
  return best;
};

/** the circuit a role follows in a month, if the site wrote one */
export const circuitFor = (
  site: Pick<Site, "circuits">,
  role: Role,
  month: Month,
): Circuit | undefined =>
  site.circuits?.find((c) => c.role === role && c.month === month);

/**
 * A villager's day in a month: the role's circuit with `home`, `well`,
 * `plot`, `block`, and `edge` resolved onto the map and a seeded jitter of
 * a few minutes on every hour (seeded by the villager's id, so a reload
 * keeps it). A stop whose place the map lacks is dropped. Nothing at all
 * for a villager away for the month, or a role with no circuit.
 */
export const circuitOf = ({
  site,
  villager,
  month,
  context,
  state,
}: {
  site: Pick<Site, "circuits" | "register" | "blockOf">;
  villager: Villager;
  month: Month;
  context: CircuitContext;
  /** the register as it stands; without it nobody is away */
  state?: RegisterState;
}): ResolvedStop[] => {
  if (state && !isPresent(state, villager)) return [];
  const circuit = circuitFor(site, villager.role, month);
  if (!circuit) return [];
  const household = householdOf(site, villager.id);
  const home = context.places[villager.home] ? villager.home : undefined;
  const origin = home ? context.places[home] : undefined;
  const wells = Object.keys(context.markers).filter(
    (key) => context.markers[key] === "well",
  );
  const resolve = (at: string): string | undefined => {
    switch (at) {
      case "home":
        return home;
      case "well":
        return origin ? nearest(origin, wells, context.places) : wells[0];
      case "plot":
        return household?.plot;
      case "block":
        return (
          (household && site.blockOf?.(household, month)) ?? household?.plot
        );
      case "edge":
        return context.edge ?? (context.places.edge ? "edge" : undefined);
      default:
        return context.places[at] ? at : undefined;
    }
  };
  const out: ResolvedStop[] = [];
  circuit.stops.forEach((stop, i) => {
    const at = resolve(stop.at);
    if (!at) return;
    const jitter =
      (hashOf(`${villager.id}:${month}:${i}`) * 2 - 1) * JITTER_HOURS;
    out.push({ ...stop, at, hour: stop.hour + jitter });
  });
  return out.sort((a, b) => a.hour - b.hour);
};
