/**
 * The populace: one figure per drawn villager and visitor, standing at their
 * homes when the map is ready and never destroyed by a beat. Each tick the
 * scheduler compares the clock with every figure's next stop and sends the
 * figure walking when the hour has passed it; an event's hour sends its
 * attendants to its place and hands the script to the beat queue; the day's
 * roll-over folds the played events' register changes.
 *
 * Phaser-free on purpose: everything the figures do on screen goes through
 * a `PopulaceDriver` the scene implements, so the scheduler is tested with a
 * fake driver and the scene only draws.
 */
import type { Month } from "./almanac";
import {
  advanceClock,
  clampHour,
  isNight,
  openClock,
  type SiteClock,
} from "./clock";
import type { Localized } from "./legend";
import {
  allVillagers,
  applyChange,
  circuitOf,
  householdOf,
  isPresent,
  registerAt,
  type CircuitContext,
  type RegisterState,
  type ResolvedStop,
} from "./register";
import type { Attendance, Household, Site, SiteEvent, Villager } from "./site";

export interface Figure {
  id: string;
  villager: Villager;
  household?: Household;
  /** the day's stops, resolved and in hour order */
  stops: ResolvedStop[];
  /** the index of the next stop to leave for */
  next: number;
  /** the place the figure stands at, or is walking to */
  at: string;
  /** the stop the figure last arrived at */
  stop?: ResolvedStop;
  walking: boolean;
  /** off the map: away for the month, struck, or through the edge */
  hidden: boolean;
  /** the event the figure is attending, while it plays */
  attending?: string;
}

/** what the scene does for the scheduler */
export interface PopulaceDriver {
  /** stands the figure at a place at once (its first placing, or a jump) */
  place(figure: Figure, at: string): void;
  /** walks the figure to a place along the way round, then calls `onArrive` */
  walk(figure: Figure, to: string, onArrive: () => void): void;
  /** plays a pose on arrival, or the rest frame when none */
  pose(figure: Figure, pose: string | undefined): void;
  /** the overlays worn now: the villager's own and the stop's */
  overlays(figure: Figure, ids: string[]): void;
  /** shows or hides the figure (the night at home, the edge, a month away) */
  show(figure: Figure, visible: boolean): void;
  /** a stop's line, for the day log */
  line(text: Localized, clock: SiteClock, figure: Figure): void;
  /** plays an event's script; the driver calls `eventDone` when the last scene ends */
  event(event: SiteEvent, attendees: Figure[]): void;
  /** tears a figure down (struck from the register) */
  remove(figure: Figure): void;
}

export interface PopulaceOptions {
  site: Site;
  month: Month;
  context: CircuitContext;
  driver: PopulaceDriver;
  /** the double-hour the clock opens at (卯 by default) */
  hour?: number;
  /** the event the clock opens just before */
  event?: string;
}

/** how far before an event's hour a jump lands, so the walk in is seen */
const EVENT_LEAD = 0.15;

/** the figures an attendance names, of those present */
export const attendeesOf = (
  attend: Attendance | undefined,
  figures: Figure[],
  wus: Site["wus"],
): Figure[] => {
  const present = figures.filter((f) => !f.hidden);
  if (!attend || attend === "none") return [];
  if (attend === "all") return present;
  if (attend === "heads")
    return present.filter(
      (f) =>
        f.household?.head === f.id ||
        f.villager.role === "head" ||
        f.villager.role === "widow" ||
        f.villager.role === "master",
    );
  if (attend === "men")
    return present.filter(
      (f) => f.villager.sex === "m" && f.villager.age !== "小",
    );
  if (attend === "women")
    return present.filter(
      (f) => f.villager.sex === "f" && f.villager.age !== "小",
    );
  if (attend === "young")
    return present.filter(
      (f) =>
        f.villager.age === "小" ||
        ["daughter", "child", "girl", "heir", "younglady"].includes(
          f.villager.role,
        ) ||
        (f.villager.age === "大" &&
          ["son", "daughter"].includes(f.villager.relation)),
    );
  if ("wu" in attend) {
    const wu = wus?.find((w) => w.id === attend.wu);
    return present.filter(
      (f) => f.household && wu?.households.includes(f.household.id),
    );
  }
  return present.filter((f) => attend.villagers.includes(f.id));
};

/** the place an event happens: the first direction's landing */
export const placeOfEvent = (event: SiteEvent): string | undefined => {
  for (const scene of event.script) {
    for (const direction of scene) {
      const at = direction.at ?? direction.to ?? direction.from;
      if (at) return at;
    }
  }
  return undefined;
};

export class Populace {
  readonly site: Site;
  readonly month: Month;
  clock: SiteClock;
  paused = false;
  figures: Figure[] = [];
  private readonly byId = new Map<string, Figure>();
  private state: RegisterState;
  private readonly context: CircuitContext;
  private readonly driver: PopulaceDriver;
  /** the events laid on the day being watched, in hour order */
  private events: SiteEvent[];
  private played = new Set<string>();
  private playing?: SiteEvent;
  private night: boolean;
  /** the first day carries the month's events; later days are ordinary */
  private eventsToday = true;

  constructor({ site, month, context, driver, hour, event }: PopulaceOptions) {
    this.site = site;
    this.month = month;
    this.context = context;
    this.driver = driver;
    this.state = registerAt(site, month);
    this.events = (site.events ?? [])
      .filter((e) => e.month === month)
      .sort((a, b) => a.hour - b.hour || a.day - b.day);
    const opening = event ? this.events.find((e) => e.id === event) : undefined;
    this.clock = openClock(
      month,
      opening ? opening.hour - EVENT_LEAD : (hour ?? undefined),
    );
    if (opening) {
      for (const e of this.events) {
        if (e === opening) break;
        this.played.add(e.id);
      }
    } else {
      // a clock opened later in the day has the earlier events behind it
      for (const e of this.events) {
        if (e.hour < this.clock.hour - EVENT_LEAD) this.played.add(e.id);
      }
    }
    this.night = isNight(this.clock.hour);
    this.build();
  }

  /** every figure, built from the register as it stands, placed at the hour */
  private build(): void {
    for (const figure of this.figures) this.driver.remove(figure);
    this.figures = [];
    this.byId.clear();
    for (const villager of allVillagers({
      register: this.state.register,
      visitors: this.state.visitors,
    })) {
      if (!villager.drawn) continue;
      const present = isPresent(this.state, villager);
      const figure: Figure = {
        id: villager.id,
        villager,
        household: householdOf({ register: this.state.register }, villager.id),
        stops: present ? this.stopsOf(villager) : [],
        next: 0,
        at: villager.home,
        walking: false,
        hidden: !present,
      };
      this.figures.push(figure);
      this.byId.set(figure.id, figure);
      this.settle(figure);
    }
  }

  private stopsOf(villager: Villager): ResolvedStop[] {
    return circuitOf({
      site: this.site,
      villager,
      month: this.month,
      context: this.context,
      state: this.state,
    });
  }

  /** stands a figure where the clock says it is, without walking */
  private settle(figure: Figure): void {
    const hour = this.clock.hour;
    let index = -1;
    figure.stops.forEach((stop, i) => {
      if (stop.hour <= hour) index = i;
    });
    const stop = index >= 0 ? figure.stops[index] : undefined;
    figure.next = index + 1;
    figure.stop = stop;
    figure.at = stop?.at ?? figure.villager.home;
    figure.walking = false;
    figure.attending = undefined;
    if (figure.hidden) {
      this.driver.show(figure, false);
      return;
    }
    this.driver.place(figure, figure.at);
    this.driver.pose(figure, stop?.pose);
    this.dress(figure);
    this.driver.show(figure, this.visible(figure));
  }

  private dress(figure: Figure): void {
    this.driver.overlays(figure, [
      ...(figure.villager.overlays ?? []),
      ...(figure.stop?.overlays ?? []),
    ]);
  }

  /** a figure at home in the night, or through the edge, is not drawn */
  private visible(figure: Figure): boolean {
    if (figure.hidden || figure.walking) return !figure.hidden;
    if (figure.at === (this.context.edge ?? "edge")) return false;
    if (figure.at === figure.villager.home && isNight(this.clock.hour))
      return false;
    return true;
  }

  figure(id: string): Figure | undefined {
    return this.byId.get(id);
  }

  /** the register as the day stands, for the page */
  get register(): RegisterState {
    return this.state;
  }

  /** the events of the month on the register's first day, played or not */
  get eventsOfMonth(): SiteEvent[] {
    return this.events;
  }

  get current(): SiteEvent | undefined {
    return this.playing;
  }

  /** advances the clock by watching time and moves whoever is due */
  tick(deltaMs: number): void {
    if (this.paused) return;
    const { clock, rolled } = advanceClock(this.clock, deltaMs);
    this.clock = clock;
    if (rolled) this.rollDay();
    const night = isNight(clock.hour);
    if (night !== this.night) {
      this.night = night;
      for (const figure of this.figures) {
        if (!figure.walking && !figure.hidden)
          this.driver.show(figure, this.visible(figure));
      }
    }
    if (this.eventsToday && !this.playing) this.startDueEvent();
    for (const figure of this.figures) {
      if (figure.walking || figure.hidden || figure.attending) continue;
      this.dispatch(figure);
    }
  }

  /** sends a figure to its latest due stop, skipping any it has missed */
  private dispatch(figure: Figure): void {
    let due = -1;
    for (let i = figure.next; i < figure.stops.length; i += 1) {
      if (figure.stops[i].hour <= this.clock.hour) due = i;
      else break;
    }
    if (due < 0) return;
    const stop = figure.stops[due];
    figure.next = due + 1;
    figure.stop = stop;
    this.goTo(figure, stop.at, () => {
      this.driver.pose(figure, stop.pose);
      this.dress(figure);
      if (stop.line) this.driver.line(stop.line, this.clock, figure);
    });
  }

  private goTo(figure: Figure, to: string, then: () => void): void {
    if (figure.at === to && !figure.walking) {
      then();
      this.driver.show(figure, this.visible(figure));
      return;
    }
    // a figure leaving home at night, or the edge, comes into view first
    figure.walking = true;
    this.driver.show(figure, true);
    figure.at = to;
    this.driver.walk(figure, to, () => {
      figure.walking = false;
      then();
      this.driver.show(figure, this.visible(figure));
    });
  }

  private startDueEvent(): void {
    const event = this.events.find(
      (e) => !this.played.has(e.id) && e.hour <= this.clock.hour,
    );
    if (!event) return;
    this.played.add(event.id);
    this.playing = event;
    const attendees = attendeesOf(event.attend, this.figures, this.site.wus);
    const place = placeOfEvent(event);
    for (const figure of attendees) {
      figure.attending = event.id;
      if (place) {
        this.goTo(figure, place, () => {
          this.driver.pose(figure, undefined);
        });
      }
    }
    this.driver.event(event, attendees);
  }

  /** the driver's word that the event's last scene has ended */
  eventDone(id: string): void {
    if (this.playing?.id !== id) return;
    this.playing = undefined;
    for (const figure of this.figures) {
      if (figure.attending === id) {
        figure.attending = undefined;
        // back to wherever the day has got to
        this.dispatch(figure);
      }
    }
  }

  /** the day rolls: the played events' changes fold and the circuits re-resolve */
  private rollDay(): void {
    const changes = this.events
      .filter((e) => this.played.has(e.id))
      .flatMap((e) => e.changes ?? []);
    for (const change of changes) applyChange(this.state, change, this.month);
    this.eventsToday = false;
    this.playing = undefined;
    for (const figure of this.figures) {
      const villager = allVillagers(this.state).find((v) => v.id === figure.id);
      if (!villager || this.state.struck.has(figure.id)) {
        figure.hidden = true;
        this.driver.show(figure, false);
        continue;
      }
      figure.villager = villager;
      figure.household = householdOf(this.state, figure.id);
      figure.hidden = !isPresent(this.state, villager);
      figure.stops = figure.hidden ? [] : this.stopsOf(villager);
      figure.attending = undefined;
      figure.walking = false;
      this.settle(figure);
    }
  }

  /** moves the clock to an hour of the day and stands everyone where they would be */
  jumpTo(hour: number): void {
    this.clock = { ...this.clock, hour: clampHour(hour) };
    this.night = isNight(this.clock.hour);
    this.playing = undefined;
    for (const figure of this.figures) this.settle(figure);
    if (this.eventsToday) {
      for (const e of this.events) {
        if (e.hour < this.clock.hour - EVENT_LEAD) this.played.add(e.id);
      }
    }
  }

  /** opens the clock just before an event of the month, on the first day */
  jumpToEvent(id: string): void {
    const event = this.events.find((e) => e.id === id);
    if (!event) return;
    this.eventsToday = true;
    this.clock = { ...this.clock, day: 1 };
    this.played = new Set(
      this.events.filter((e) => e.hour < event.hour).map((e) => e.id),
    );
    this.played.delete(id);
    this.jumpTo(event.hour - EVENT_LEAD);
  }

  /** the next event after the clock, for the page's skip button */
  nextEvent(): SiteEvent | undefined {
    if (!this.eventsToday) return this.events[0];
    return this.events.find((e) => !this.played.has(e.id));
  }
}
