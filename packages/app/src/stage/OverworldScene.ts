import Phaser from "phaser";

import type { StageBeat, StageSequence } from "../lib/types";
import { spriteFor } from "./assets";
import {
  facingOf,
  formation,
  lengthOf,
  PAN_MS,
  planBeat,
  routePlan,
  type StageAction,
  type StagePlaces,
  type StagePlan,
  type StagePoint,
} from "./beats";
import {
  ARCHETYPES,
  DECOR,
  EFFECTS,
  MARKER_VARIANTS,
  hashOf,
  MARKERS,
  TERRAINS,
  WATERS,
  decorId,
  effectId,
  markerId,
  terrainId,
  waterId,
  type Marker,
} from "./catalog";
import {
  isShownInMonth,
  monthRecord,
  seasonOf,
  seasonalDecorId,
  type Light,
  type Month,
} from "./almanac";
import { KIT_PASSABLE } from "./kit";
import { BARE_GROUND, type LegendKind } from "./legend";
import type { StageAsset, StageManifest } from "./manifest";
import { findPath, simplifyPath, type Grid } from "./route";
import { BASE_TILE, DEFAULT_STAGE_SET, stageSet } from "./sets";

/** the map of the set the stage plays on unless a caller names another */
export const MAP_URL = stageSet(DEFAULT_STAGE_SET).map;
/**
 * What each cell of the map belongs to: the He, the Jiang, the plank roads.
 * Written once by `npm run stage:map`, because the grid is the same at every
 * tile size and only the art it is drawn with differs.
 */
export const FEATURES_URL = "/stage/features.json";
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 400;

const FONT =
  '"IBM Plex Mono", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", monospace';
const ZOOMS = [3, 2.5, 2, 1.5, 1.25, 1];
export const MAX_ZOOM = 4;
/** one step of the zoom buttons */
export const ZOOM_STEP = 1.4;
/** zoom delta → zoom factor; exponential, so every step is the same ratio */
const ZOOM_RATE = 0.02;
/**
 * The most one wheel event may zoom by. A trackpad pinch arrives as a long run
 * of small deltas and a mouse wheel as one large one, so the cap is what lets a
 * single rate serve both: the pinch accumulates its own travel, and the cap
 * holds one notch of the wheel to one press of the zoom control, which is why
 * it is derived from `ZOOM_STEP` rather than tuned beside it.
 */
const ZOOM_DELTA_CAP = Math.log(ZOOM_STEP) / ZOOM_RATE;
/** how far a pointer may travel between down and up and still count as a click */
const CLICK_SLOP = 5;
/** the accent (`--color-brand-terminal`) as a Phaser colour */
const PICK_COLOR = 0xff7550;

/** What a reader picked out of the map. */
export interface StagePick {
  kind: LegendKind;
  /** the ground name, the decor id, or the place key */
  id: string;
  /** for a place, the marker the map drew (`region` when it has none) */
  marker?: string;
  /**
   * For a ground the map names, the gazetteer key of what it is: a click on
   * the water below Xianyang is `water` / `river` / `weishui`, and reads as
   * the Wei rather than as one more river.
   */
  feature?: string;
}

/** Where the camera stands, for the zoom control to render itself against. */
export interface StageZoom {
  zoom: number;
  min: number;
  max: number;
}

/** the ground names that are water rather than terrain */
const WATER_GROUNDS = new Set<string>(WATERS);

/** A thing on the map with bounds a click can land in. */
interface Pickable {
  pick: StagePick;
  /**
   * Read at hit time rather than stored: a label grows as the camera pulls
   * back (`updateLabels`), so its hit area has to grow with what is drawn.
   */
  bounds: () => Phaser.Geom.Rectangle;
  /** places sort above decor, then nearer the front of the map */
  order: number;
}

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

/**
 * Label tiers by zoom, so the zoomed-out map stays legible: majors (the
 * seats of power) always show and grow to hold their on-screen size, region
 * names show until the camera is close, and minor places (fords, passes,
 * towns) label only once the camera is near enough to read them. The
 * thresholds are ratios against the whole-map fit zoom, so they hold at any
 * canvas density or map size.
 */
type LabelTier = "major" | "region" | "minor";
const MINOR_LABEL_RATIO = 1.6;
const REGION_LABEL_MAX_RATIO = 4;

export interface OverworldCallbacks {
  onReady?: () => void;
  onBeatStart?: (beat: StageBeat, plan: StagePlan) => void;
  onBeatEnd?: (beat: StageBeat) => void;
  onIdle?: () => void;
  onError?: (message: string) => void;
  /** a click landed on something worth reading, or on bare ground (null) */
  onPick?: (pick: StagePick | null) => void;
  /** the camera's zoom and its bounds, whenever any of them changes */
  onZoom?: (zoom: StageZoom) => void;
}

export interface OverworldConfig extends OverworldCallbacks {
  manifest: StageManifest;
  script: StageSequence;
  /** place key → label in the run's language */
  names: Record<string, string>;
  /** seat → colour */
  colors: Record<string, number>;
  mapUrl?: string;
  /** the named-feature sidecar the map was built with (defaults to the overworld's) */
  featuresUrl?: string;
  /**
   * Whether a seat's colour flies over its home and its actors (default
   * true). A town has no seats to tell apart, so the settlement turns it off.
   */
  flags?: boolean;
  /** the game canvas in logical pixels (defaults to the watch page's view) */
  view?: { width: number; height: number };
  /** scrolling pans, the map is clickable, and the camera opens on the whole of it */
  interactive?: boolean;
  /** whether the camera flies to each beat (the explorer can switch it off) */
  follow?: boolean;
  /** whether the roofs are drawn over the rooms (the house page can hide them) */
  roofs?: boolean;
  /** the month of the almanac the site is shown in (none: the plain art, no weather) */
  month?: Month;
}

interface TiledPoint {
  name: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  /** a rectangle object (a room) carries these; a point carries none */
  width?: number;
  height?: number;
  properties?: { name: string; value: unknown }[] | Record<string, unknown>;
}

/** a roof over one room: lifted (faded) while someone is inside */
interface Roof {
  room: string;
  rect: Phaser.Geom.Rectangle;
  images: Phaser.GameObjects.Image[];
  alpha: number;
}

/** how far a roof fades when it lifts, and how fast it gets there */
/**
 * The season's light: a grade laid over the whole map below the labels.
 * Cold screens a pale blue over the ground, amber multiplies a harvest
 * tone into it, and warm is the slightest cream so a summer reads as one.
 */
const GRADES: Record<Light, { color: number; blend: number; alpha: number }> = {
  cold: { color: 0x9fb8d8, blend: Phaser.BlendModes.SCREEN, alpha: 0.16 },
  amber: { color: 0xf2cf98, blend: Phaser.BlendModes.MULTIPLY, alpha: 0.3 },
  warm: { color: 0xfff3dc, blend: Phaser.BlendModes.MULTIPLY, alpha: 0.1 },
};
const GRADE_DEPTH = 4500;
const WEATHER_DEPTH = 4600;
const GEESE_DEPTH = 4400;
/** how long one roll of the month's weather chance holds, in ms */
const WEATHER_SPELL_MS = 15000;
/** the skein of geese the autumn and spring months fly across the sky */
const GEESE_ID = "decor.geese";
const GEESE_CROSSING_MS = 36000;
const GEESE_REST_MS = 18000;
const FLAKE_TEXTURE = "stage.flake";
const ROOF_LIFTED_ALPHA = 0.12;
const ROOF_FADE_RATE = 0.08;
/** what a hidden decor answers a click with */
const EMPTY_BOUNDS = new Phaser.Geom.Rectangle(0, 0, 0, 0);

const propertiesOf = (object: TiledPoint): Record<string, unknown> =>
  Array.isArray(object.properties)
    ? Object.fromEntries(object.properties.map((p) => [p.name, p.value]))
    : (object.properties ?? {});

/** a label's drawn bounds, or nothing at all when the zoom has hidden it */
const boundsOf = (text: Phaser.GameObjects.Text): Phaser.Geom.Rectangle =>
  text.visible ? text.getBounds() : new Phaser.Geom.Rectangle();

/** the frame a figure rests on (a static sprite has one frame per facing) */
const restFrame = (sprite: NonNullable<StageAsset["sprite"]>): number =>
  sprite.walk.down[1] ?? sprite.walk.down[0] ?? 0;

/**
 * The overworld: the Tiled map, its places and their labels, the seats'
 * homes, and a queue of beats played one after another. Every direction is
 * planned by `planBeat` and animated here with tweens; the React shell reads
 * the callbacks for captions.
 */
export class OverworldScene extends Phaser.Scene {
  private readonly config: OverworldConfig;
  private readonly view: { width: number; height: number };
  private places: StagePlaces = {};
  private homes: Record<string, string> = {};
  private queue: StageBeat[] = [];
  private playing = false;
  private live: Phaser.GameObjects.GameObject[] = [];
  private loadedSprites = new Map<string, StageAsset>();
  private minZoom = ZOOMS[ZOOMS.length - 1];
  private fitZoom = 1;
  private labels: { text: Phaser.GameObjects.Text; tier: LabelTier }[] = [];
  private labelZoom = 0;
  private map?: Phaser.Tilemaps.Tilemap;
  /** the ground each tile layer paints, bottom to top, so a click reads the topmost */
  private grounds: { ground: string; layer: string }[] = [];
  private pickables: Pickable[] = [];
  private highlight?: Phaser.GameObjects.Graphics;
  /** what the page is showing, so a second click on the same thing closes it */
  private current: StagePick | null = null;
  /** the tiles the ground highlight covers, so the run closes as one thing */
  private currentRun?: { layer: string; inside: Uint8Array };
  /** cell → the feature that holds it, and each feature's own cells */
  private featureAt = new Map<number, string>();
  private featureCells = new Map<string, number[]>();
  /** the rooms a kit composed, by id, in pixels */
  private rooms = new Map<string, Phaser.Geom.Rectangle>();
  private roofs: Roof[] = [];
  /** the map's tilesets by the name the map binds them under, for the season swap */
  private tilesets: Phaser.Tilemaps.Tileset[] = [];
  /** every decor image and the decor it draws, for the month's showing and hiding */
  private decorImages: { decor: string; image: Phaser.GameObjects.Image }[] =
    [];
  private weather?: Phaser.GameObjects.Particles.ParticleEmitter;
  private weatherZone = new Phaser.Geom.Rectangle(0, 0, 1, 1);
  private weatherTimer?: Phaser.Time.TimerEvent;
  private grade?: Phaser.GameObjects.Rectangle;
  private geese?: Phaser.GameObjects.Image;
  private geeseTween?: Phaser.Tweens.Tween;
  /** the month shown, once `create` has applied it */
  month?: Month;
  /** the cells a figure cannot cross; absent on a map with no walls to respect */
  private grid?: Grid;
  private reportedZoom = 0;
  /**
   * The map's tile over the base tile. Every constant below is written for a
   * sixteen-pixel world and multiplied by this, so a set drawn at a larger
   * tile shows the same country at the same size rather than half of it twice
   * as close.
   */
  private unit = 1;
  /** whether the camera flies to each beat; the explorer toggles it live */
  follow: boolean;
  /**
   * whether the roofs are drawn at all; the house page toggles it live, and
   * `liftRoofs` fades every roof out while it is off
   */
  showRoofs: boolean;

  constructor(config: OverworldConfig) {
    super("overworld");
    this.config = config;
    this.view = config.view ?? { width: VIEW_WIDTH, height: VIEW_HEIGHT };
    this.follow = config.follow ?? true;
    this.showRoofs = config.roofs ?? true;
    this.month = config.month;
  }

  preload(): void {
    const { manifest } = this.config;
    this.load.on(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      (file: { key: string }) => {
        this.config.onError?.(`stage: failed to load ${file.key}`);
      },
    );
    this.load.tilemapTiledJSON("overworld", this.config.mapUrl ?? MAP_URL);
    // the named country, only where a reader can click it
    if (this.config.interactive)
      this.load.json("features", this.config.featuresUrl ?? FEATURES_URL);
    const image = (id: string): void => {
      const asset = manifest.assets[id];
      if (asset) this.load.image(id, asset.url);
    };
    TERRAINS.forEach((terrain) => image(terrainId(terrain)));
    WATERS.forEach((water) => image(waterId(water)));
    // the transition sheets the set carries (`terrain.mountain@forest`, one
    // ground as it meets another): the map names the ones it lays and `create`
    // binds a tileset by its name, so loading the set's own is enough
    Object.keys(manifest.assets)
      .filter((id) => id.includes("@"))
      .forEach((id) => image(id));
    // the seasons: a sibling sheet per ground or decor the year changes
    // (`terrain.field~autumn`), bound in place of the plain one by `setMonth`
    Object.keys(manifest.assets)
      .filter((id) => id.includes("~"))
      .forEach((id) => image(id));
    image(GEESE_ID);
    MARKERS.forEach((marker) => image(markerId(marker)));
    Object.values(MARKER_VARIANTS)
      .flat()
      .forEach((id) => image(id));
    DECOR.forEach((decor) => image(decorId(decor)));
    // the building kits: eighty pieces a frame apiece
    Object.values(manifest.assets)
      .filter((asset) => asset.kind === "kit" && asset.frame)
      .forEach((asset) => {
        this.load.spritesheet(asset.id, asset.url, {
          frameWidth: asset.frame!.width,
          frameHeight: asset.frame!.height,
        });
      });
    EFFECTS.forEach((effect) => {
      const asset = manifest.assets[effectId(effect)];
      if (!asset?.frame) return;
      this.load.spritesheet(asset.id, asset.url, {
        frameWidth: asset.frame.width,
        frameHeight: asset.frame.height,
      });
    });
    ARCHETYPES.forEach((archetype) => {
      const asset = spriteFor(manifest, archetype);
      if (!asset?.sprite || this.loadedSprites.has(asset.id)) return;
      this.loadedSprites.set(asset.id, asset);
      this.load.spritesheet(asset.id, asset.url, {
        frameWidth: asset.sprite.frameWidth,
        frameHeight: asset.sprite.frameHeight,
      });
    });
  }

  /**
   * How much to scale an asset drawn for a lower layer: a sixteen-pixel
   * effect on a thirty-two-pixel map doubles, and art from the set's own
   * layer is left alone.
   */
  private scaleOf(asset: StageAsset): number {
    return (this.unit * BASE_TILE) / (asset.tile || BASE_TILE);
  }

  create(): void {
    const map = this.make.tilemap({ key: "overworld" });
    this.map = map;
    this.unit = map.tileWidth / BASE_TILE;
    const tilesets = map.tilesets
      .map((tileset) =>
        this.textures.exists(tileset.name)
          ? map.addTilesetImage(tileset.name, tileset.name)
          : null,
      )
      .filter(
        (tileset): tileset is Phaser.Tilemaps.Tileset => tileset !== null,
      );
    this.tilesets = tilesets;
    // what moves is the map's own business: a water tileset declares its frames
    // as a Tiled animation, which Phaser plays, and no other ground declares one
    map.layers.forEach((layerData) => {
      map.createLayer(layerData.name, tilesets, 0, 0);
      // the ground layer is the grass everything else is laid over; every
      // other tile layer is named for the ground it paints
      this.grounds.push({
        ground: layerData.name === "ground" ? BARE_GROUND : layerData.name,
        layer: layerData.name,
      });
    });

    this.readFeatures(map);
    this.buildRooms(map);

    for (const object of (map.getObjectLayer("decor")?.objects ??
      []) as TiledPoint[]) {
      const id = object.type || object.class || "";
      const asset = this.config.manifest.assets[id];
      if (!asset || !this.textures.exists(id)) continue;
      const image = this.add
        .image(object.x, object.y, id)
        .setOrigin(0.5, 0.85)
        .setScale(this.scaleOf(asset))
        .setDepth(object.y);
      const decor = id.replace(/^decor\./, "");
      this.decorImages.push({ decor, image });
      // a decor the month has taken away is not there to be clicked
      const bounds = image.getBounds();
      this.addPickable(
        { kind: "decor", id: decor },
        () => (image.visible ? bounds : EMPTY_BOUNDS),
        object.y,
      );
    }

    const objects = (map.getObjectLayer("places")?.objects ??
      []) as TiledPoint[];
    for (const object of objects) {
      const key = object.name;
      this.places[key] = { x: object.x, y: object.y };
      const kind = object.type || object.class || "region";
      const label = this.config.names[key] ?? key;
      const pick: StagePick = { kind: "place", id: key, marker: kind };
      const room = this.rooms.get(key);
      if (kind !== "region") {
        const candidates = MARKER_VARIANTS[kind as Marker] ?? [
          markerId(kind as Marker),
        ];
        const pool = candidates.filter((id) => this.textures.exists(id));
        const id = pool.length ? pool[hashOf(key) % pool.length] : undefined;
        const asset = id ? this.config.manifest.assets[id] : undefined;
        if (room) {
          // a room is its own image: the walls the kit laid are what a
          // reader sees, and a click anywhere on them reads the place
          this.addPickable(pick, room, object.y);
        } else if (id && asset) {
          const image = this.add
            .image(object.x, object.y, id)
            .setOrigin(0.5, 0.85)
            .setScale(this.scaleOf(asset))
            .setDepth(object.y);
          this.addPickable(pick, image.getBounds(), object.y);
        }
        const tier: LabelTier =
          kind === "court" || kind === "altar" || kind === "hall"
            ? "major"
            : "minor";
        const text = this.add
          .text(object.x, object.y + 4 * this.unit, label, {
            fontFamily: FONT,
            fontSize: `${8 * this.unit}px`,
            color: "#f4f1ea",
            stroke: "#0b0d10",
            strokeThickness: 3,
          })
          .setOrigin(0.5, 0)
          .setResolution(3)
          .setDepth(5000);
        this.labels.push({ text, tier });
        this.addPickable(pick, () => boundsOf(text), object.y);
      } else {
        const text = this.add
          .text(object.x, object.y, label, {
            fontFamily: FONT,
            fontSize: `${10 * this.unit}px`,
            fontStyle: "italic",
            color: "#cfc9b8",
            stroke: "#0b0d10",
            strokeThickness: 3,
          })
          .setOrigin(0.5, 0.5)
          .setAlpha(0.8)
          .setResolution(3)
          .setDepth(4999);
        this.labels.push({ text, tier: "region" });
        // a region is its label and nothing else, so the hit area is drawn
        // generously around it
        this.addPickable(
          pick,
          () =>
            Phaser.Geom.Rectangle.Inflate(
              boundsOf(text),
              text.displayWidth * 0.25,
              text.displayHeight * 0.4,
            ),
          -1,
        );
      }
      const state = propertiesOf(object).state;
      if (typeof state === "string") this.homes[state] = key;
    }
    this.pickables.sort((a, b) => b.order - a.order);
    for (const [seat, home] of Object.entries(this.config.script.seats)) {
      this.homes[seat] = home.home;
      const point = this.places[home.home];
      const color = this.config.colors[seat];
      if (point && color !== undefined && this.config.flags !== false) {
        const u = this.unit;
        this.add
          .rectangle(point.x - 14 * u, point.y - 18 * u, 6 * u, 4 * u, color)
          .setDepth(6000);
        this.add
          .rectangle(point.x - 17 * u, point.y - 16 * u, 1 * u, 8 * u, 0x0b0d10)
          .setDepth(6000);
      }
    }

    for (const asset of this.loadedSprites.values()) {
      if (!asset.sprite) continue;
      for (const [facing, frames] of Object.entries(asset.sprite.walk)) {
        this.anims.create({
          key: `${asset.id}:${facing}`,
          frames: this.anims.generateFrameNumbers(asset.id, { frames }),
          frameRate: 6,
          repeat: -1,
        });
      }
    }
    for (const effect of EFFECTS) {
      const asset = this.config.manifest.assets[effectId(effect)];
      if (!asset?.frames || !this.textures.exists(asset.id)) continue;
      this.anims.create({
        key: asset.id,
        frames: this.anims.generateFrameNumbers(asset.id, {
          start: 0,
          end: asset.frames - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.fitZoom = Math.max(
      this.view.width / map.widthInPixels,
      this.view.height / map.heightInPixels,
    );
    if (this.config.interactive) {
      this.minZoom = this.fitZoom;
      camera.setZoom(this.minZoom);
      camera.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
      this.enableCameraControls();
    } else {
      camera.setZoom(1.5 / this.unit);
      const firstHome = Object.values(this.homes)
        .map((key) => this.places[key])
        .find((point) => point !== undefined);
      camera.centerOn(
        firstHome?.x ?? map.widthInPixels / 2,
        firstHome?.y ?? map.heightInPixels / 2,
      );
    }
    this.updateLabels();
    this.applyMonth();
    this.config.onReady?.();
    this.pump();
  }

  update(): void {
    this.updateLabels();
    this.reportZoom();
    this.liftRoofs();
    this.driftWeather();
  }

  /** Shows the site in a month of its year; `undefined` is the plain art. */
  setMonth(month: Month | undefined): void {
    if (month === this.month) return;
    this.month = month;
    if (this.map) this.applyMonth();
  }

  /**
   * The month on the map: every ground and pair the set carries a seasonal
   * sheet for is rebound to it (`tileset.setImage`, so the laid tiles need no
   * touch), the decor the month has taken away is hidden and the decor the
   * season redraws swaps its texture, the light is graded, the weather set
   * running, and the geese sent across the sky. Without a month all of it is
   * undone, so a replay and the explorer draw what they always drew.
   */
  private applyMonth(): void {
    const map = this.map;
    if (!map) return;
    const month = this.month;
    const season = month ? seasonOf(month) : undefined;
    const record = month ? monthRecord(month) : undefined;
    for (const tileset of this.tilesets) {
      const wanted =
        season && this.textures.exists(`${tileset.name}~${season}`)
          ? `${tileset.name}~${season}`
          : tileset.name;
      if (tileset.image?.key !== wanted)
        tileset.setImage(this.textures.get(wanted));
    }
    for (const { decor, image } of this.decorImages) {
      image.setVisible(month === undefined || isShownInMonth(decor, month));
      const wanted = season ? seasonalDecorId(decor, season) : `decor.${decor}`;
      const id = this.textures.exists(wanted) ? wanted : `decor.${decor}`;
      if (image.texture.key !== id) image.setTexture(id);
    }
    this.gradeLight(map, record?.light);
    this.setWeather(record?.weather);
    this.flyGeese(map, record?.geese === true);
  }

  private gradeLight(
    map: Phaser.Tilemaps.Tilemap,
    light: Light | undefined,
  ): void {
    if (!light) {
      this.grade?.destroy();
      this.grade = undefined;
      return;
    }
    const grade = GRADES[light];
    if (!this.grade) {
      this.grade = this.add
        .rectangle(0, 0, map.widthInPixels, map.heightInPixels)
        .setOrigin(0, 0)
        .setDepth(GRADE_DEPTH);
    }
    this.grade.setFillStyle(grade.color, grade.alpha).setBlendMode(grade.blend);
  }

  /**
   * The month's weather: a chance that any quarter-minute is snowing or
   * raining, rolled afresh each spell. Flakes fall over the camera's own view
   * (`weatherZone` follows it in `driftWeather`), sized against the zoom so
   * a flake is a flake at any distance.
   */
  private setWeather(
    weather: { kind: "snow" | "rain"; chance: number } | undefined,
  ): void {
    this.weatherTimer?.remove();
    this.weatherTimer = undefined;
    this.weather?.destroy();
    this.weather = undefined;
    if (!weather) return;
    if (!this.textures.exists(FLAKE_TEXTURE)) {
      const canvas = this.textures.createCanvas(FLAKE_TEXTURE, 2, 2);
      if (!canvas) return;
      const context = canvas.getContext();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 2, 2);
      canvas.refresh();
    }
    const zoomOf = () => Math.max(this.cameras.main.zoom, 0.05);
    const snow = weather.kind === "snow";
    const u = this.unit;
    const emitter = this.add.particles(0, 0, FLAKE_TEXTURE, {
      emitZone: {
        type: "random",
        source: {
          getRandomPoint: (point: { x: number; y: number }) => {
            const zone = this.weatherZone;
            point.x = zone.x + Math.random() * zone.width;
            point.y = zone.y + Math.random() * zone.height;
          },
        },
      },
      frequency: snow ? 24 : 6,
      quantity: 1,
      lifespan: snow ? { min: 3200, max: 5200 } : { min: 900, max: 1400 },
      speedX: {
        onEmit: () => ((snow ? 6 + Math.random() * 10 : 8) * u) / zoomOf(),
      },
      speedY: {
        onEmit: () =>
          ((snow ? 14 + Math.random() * 12 : 160 + Math.random() * 40) * u) /
          zoomOf(),
      },
      scaleX: { onEmit: () => (snow ? 1 : 0.5) / zoomOf() },
      scaleY: { onEmit: () => (snow ? 1 : 6) / zoomOf() },
      alpha: snow ? { start: 0.85, end: 0.2 } : { start: 0.45, end: 0.1 },
      tint: snow ? 0xffffff : 0xbfd4ec,
    });
    emitter.setDepth(WEATHER_DEPTH);
    this.weather = emitter;
    const roll = () => {
      const falling = Math.random() < weather.chance;
      if (falling) emitter.start();
      else emitter.stop();
    };
    roll();
    this.weatherTimer = this.time.addEvent({
      delay: WEATHER_SPELL_MS,
      loop: true,
      callback: roll,
    });
  }

  /** Keeps the weather falling over the camera's view rather than a fixed field. */
  private driftWeather(): void {
    if (!this.weather) return;
    const view = this.cameras.main.worldView;
    // flakes are born above the view so the top of it is never bare
    this.weatherZone.setTo(
      view.x - view.width * 0.1,
      view.y - view.height * 0.4,
      view.width * 1.2,
      view.height * 1.3,
    );
  }

  /** A skein of geese across the sky, once a crossing and a rest, while the month says so. */
  private flyGeese(map: Phaser.Tilemaps.Tilemap, flying: boolean): void {
    if (!flying || !this.textures.exists(GEESE_ID)) {
      this.geeseTween?.remove();
      this.geeseTween = undefined;
      this.geese?.destroy();
      this.geese = undefined;
      return;
    }
    if (this.geese) return;
    const asset = this.config.manifest.assets[GEESE_ID];
    const width = map.widthInPixels;
    const y = map.heightInPixels * 0.18;
    const span = (asset ? this.scaleOf(asset) : 1) * 64 * this.unit;
    this.geese = this.add
      .image(-span, y, GEESE_ID)
      .setScale(asset ? this.scaleOf(asset) : 1)
      .setAlpha(0.9)
      .setDepth(GEESE_DEPTH);
    this.geeseTween = this.tweens.add({
      targets: this.geese,
      x: width + span,
      y: y + map.heightInPixels * 0.08,
      duration: GEESE_CROSSING_MS,
      repeat: -1,
      repeatDelay: GEESE_REST_MS,
      ease: "Linear",
    });
  }

  /**
   * Reads the rooms, walls, and roofs a kit composed. A wall piece is drawn
   * on a canvas taller than its cell, so it is placed by the cell's offset
   * on the frame, and it sorts by the bottom of its cell so a figure north of
   * it stands behind its face. The roof pieces of one room are kept together
   * so the whole roof lifts when someone is inside. The walls also give the
   * map its blocked grid, with the water the map paints, and a map with no
   * walls keeps no grid: the overworld's routes cross rivers on purpose.
   */
  private buildRooms(map: Phaser.Tilemaps.Tilemap): void {
    const walls = map.getObjectLayer("walls");
    if (!walls) return;
    const tile = map.tileWidth;
    for (const object of (map.getObjectLayer("rooms")?.objects ??
      []) as TiledPoint[]) {
      this.rooms.set(
        object.name,
        new Phaser.Geom.Rectangle(
          object.x,
          object.y,
          object.width ?? tile,
          object.height ?? tile,
        ),
      );
    }
    const grid: Grid = {
      width: map.width,
      height: map.height,
      blocked: new Uint8Array(map.width * map.height),
    };
    for (const { ground, layer } of this.grounds) {
      if (!WATER_GROUNDS.has(ground)) continue;
      for (let y = 0; y < map.height; y += 1) {
        for (let x = 0; x < map.width; x += 1) {
          if (map.getTileAt(x, y, false, layer))
            grid.blocked[y * map.width + x] = 1;
        }
      }
    }
    const piece = (
      object: TiledPoint,
      depth: number,
    ): Phaser.GameObjects.Image | null => {
      const id = object.type || object.class || "";
      const asset = this.config.manifest.assets[id];
      const index = propertiesOf(object).piece;
      if (!asset?.kit || typeof index !== "number" || !this.textures.exists(id))
        return null;
      const scale = this.scaleOf(asset);
      return this.add
        .image(
          object.x - asset.kit.cell.x * scale,
          object.y - asset.kit.cell.y * scale,
          id,
          index,
        )
        .setOrigin(0, 0)
        .setScale(scale)
        .setDepth(depth);
    };
    for (const object of walls.objects as TiledPoint[]) {
      piece(object, object.y + tile);
      const index = propertiesOf(object).piece;
      if (typeof index === "number" && !KIT_PASSABLE.has(index)) {
        const cx = Math.floor(object.x / tile);
        const cy = Math.floor(object.y / tile);
        if (cx >= 0 && cy >= 0 && cx < map.width && cy < map.height) {
          grid.blocked[cy * map.width + cx] = 1;
        }
      }
    }
    this.grid = grid;
    const byRoom = new Map<string, Roof>();
    for (const object of (map.getObjectLayer("roofs")?.objects ??
      []) as TiledPoint[]) {
      const room = propertiesOf(object).room;
      const rect = typeof room === "string" ? this.rooms.get(room) : undefined;
      if (typeof room !== "string" || !rect) continue;
      let roof = byRoom.get(room);
      if (!roof) {
        roof = { room, rect, images: [], alpha: 1 };
        byRoom.set(room, roof);
        this.roofs.push(roof);
      }
      const image = piece(object, rect.bottom + 1);
      if (image) roof.images.push(image);
    }
  }

  /** the way round the walls, in pixels, or null when the map has no grid or no way */
  private routeOf(from: StagePoint, to: StagePoint): StagePoint[] | null {
    const grid = this.grid;
    const map = this.map;
    if (!grid || !map) return null;
    const cellOf = (point: StagePoint) => ({
      x: Math.floor(point.x / map.tileWidth),
      y: Math.floor(point.y / map.tileHeight),
    });
    const cells = findPath({ grid, from: cellOf(from), to: cellOf(to) });
    if (!cells) return null;
    const points = simplifyPath(cells).map((cell) => ({
      x: (cell.x + 0.5) * map.tileWidth,
      y: (cell.y + 0.5) * map.tileHeight,
    }));
    points[0] = from;
    points[points.length - 1] = to;
    return points;
  }

  /**
   * Fades a roof while a figure is inside its room, or while the reader has
   * the room open, and brings it back when the room empties. With the roofs
   * switched off every roof fades out and stays out.
   */
  private liftRoofs(): void {
    if (!this.roofs.length) return;
    const feet = this.live.filter(
      (object): object is Phaser.GameObjects.Sprite =>
        object instanceof Phaser.GameObjects.Sprite && object.active,
    );
    const open = this.current?.kind === "place" ? this.current.id : undefined;
    for (const roof of this.roofs) {
      const lifted =
        roof.room === open ||
        feet.some((sprite) => roof.rect.contains(sprite.x, sprite.y));
      const target = !this.showRoofs ? 0 : lifted ? ROOF_LIFTED_ALPHA : 1;
      if (roof.alpha === target) continue;
      roof.alpha =
        Math.abs(target - roof.alpha) < 0.01
          ? target
          : roof.alpha + (target - roof.alpha) * ROOF_FADE_RATE;
      for (const image of roof.images) image.setAlpha(roof.alpha);
    }
  }

  /** Tells the zoom control where the camera stands (a no-op until it moves). */
  private reportZoom(): void {
    const zoom = this.cameras.main.zoom;
    if (zoom === this.reportedZoom) return;
    this.reportedZoom = zoom;
    this.config.onZoom?.(this.zoomState);
  }

  get zoomState(): StageZoom {
    return {
      zoom: this.cameras.main.zoom,
      min: this.minZoom,
      max: MAX_ZOOM / this.unit,
    };
  }

  /** One press of the zoom control: in above one, out below it. */
  zoomBy(factor: number): void {
    const camera = this.cameras.main;
    this.setZoom(camera.zoom * factor);
  }

  /** Pulls the camera back until the whole country is on screen. */
  zoomToFit(): void {
    const camera = this.cameras.main;
    this.setZoom(this.minZoom);
    camera.centerOn(camera.getBounds().centerX, camera.getBounds().centerY);
  }

  /** Zooms about the middle of the view, within the camera's bounds. */
  private setZoom(value: number): void {
    const camera = this.cameras.main;
    const next = clamp(value, this.minZoom, MAX_ZOOM / this.unit);
    if (next === camera.zoom) return;
    camera.panEffect.reset();
    camera.zoomEffect.reset();
    camera.setZoom(next);
    this.reportZoom();
  }

  /** Applies the label tiers for the camera's zoom (no-op until it changes). */
  private updateLabels(): void {
    const zoom = this.cameras.main.zoom;
    if (zoom === this.labelZoom) return;
    this.labelZoom = zoom;
    const ratio = zoom / this.fitZoom;
    const majorScale = clamp(1 / zoom, 1, 2.6);
    const regionScale = clamp(1 / zoom, 1, 2.2);
    const minorScale = clamp(1 / zoom, 1, 1.4);
    for (const { text, tier } of this.labels) {
      if (tier === "major") {
        text.setVisible(true).setScale(majorScale);
      } else if (tier === "region") {
        text.setVisible(ratio <= REGION_LABEL_MAX_RATIO).setScale(regionScale);
      } else {
        text.setVisible(ratio >= MINOR_LABEL_RATIO).setScale(minorScale);
      }
    }
  }

  /**
   * Scrolling moves the map, as does dragging it, and a click reads whatever
   * it lands on. `CLICK_SLOP` is what tells a drag from a click, so one press
   * is either a pan or a pick and never both. Pinching the trackpad zooms at
   * the cursor, as does the wheel with the control or command key held: the
   * browser reports a pinch as exactly that wheel, so the two gestures are one
   * path, told apart only by how big a delta they send. The zoom control moves
   * the camera about the middle of the view.
   */
  private enableCameraControls(): void {
    const camera = this.cameras.main;
    /** where the press began, and where the camera stood when it did */
    let drag: {
      x: number;
      y: number;
      scrollX: number;
      scrollY: number;
    } | null = null;
    let dragging = false;
    const restCursor = (pointer: Phaser.Input.Pointer): string =>
      this.pickableAt(pointer.worldX, pointer.worldY) ? "pointer" : "grab";
    this.input.setDefaultCursor("grab");
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      camera.panEffect.reset();
      camera.zoomEffect.reset();
      drag = {
        x: pointer.x,
        y: pointer.y,
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
      };
      dragging = false;
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const start = drag;
      drag = null;
      dragging = false;
      this.input.setDefaultCursor(restCursor(pointer));
      if (!start) return;
      if (Phaser.Math.Distance.BetweenPoints(start, pointer) > CLICK_SLOP) {
        return;
      }
      this.pickAt(pointer.worldX, pointer.worldY);
    });
    this.input.on("pointerupoutside", () => {
      drag = null;
      dragging = false;
      this.input.setDefaultCursor("grab");
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (drag && pointer.isDown) {
        if (
          !dragging &&
          Phaser.Math.Distance.BetweenPoints(drag, pointer) <= CLICK_SLOP
        ) {
          return;
        }
        dragging = true;
        this.input.setDefaultCursor("grabbing");
        // the map follows the hand, and the camera's own bounds hold the edge
        camera.setScroll(
          drag.scrollX - (pointer.x - drag.x) / camera.zoom,
          drag.scrollY - (pointer.y - drag.y) / camera.zoom,
        );
        return;
      }
      this.input.setDefaultCursor(restCursor(pointer));
    });
    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _over: unknown,
        dx: number,
        dy: number,
      ) => {
        camera.panEffect.reset();
        camera.zoomEffect.reset();
        const event = pointer.event as WheelEvent | undefined;
        if (event?.ctrlKey || event?.metaKey) {
          const delta = clamp(dy, -ZOOM_DELTA_CAP, ZOOM_DELTA_CAP);
          this.zoomAt(pointer, Math.exp(-delta * ZOOM_RATE));
          return;
        }
        // the camera's own bounds stop the scroll at the edge of the country
        camera.scrollX += dx / camera.zoom;
        camera.scrollY += dy / camera.zoom;
      },
    );
  }

  /** Zooms about the cursor, holding the world point under it fixed. */
  private zoomAt(pointer: Phaser.Input.Pointer, factor: number): void {
    const camera = this.cameras.main;
    const prev = camera.zoom;
    const next = clamp(prev * factor, this.minZoom, MAX_ZOOM / this.unit);
    if (next === prev) return;
    const halfW = camera.width / 2;
    const halfH = camera.height / 2;
    const worldX = camera.scrollX + halfW + (pointer.x - halfW) / prev;
    const worldY = camera.scrollY + halfH + (pointer.y - halfH) / prev;
    camera.setZoom(next);
    camera.centerOn(
      worldX - (pointer.x - halfW) / next,
      worldY - (pointer.y - halfH) / next,
    );
    this.reportZoom();
  }

  /** Records one clickable thing; markers beat decor, and decor beats a region label. */
  private addPickable(
    pick: StagePick,
    bounds: Phaser.Geom.Rectangle | (() => Phaser.Geom.Rectangle),
    y: number,
  ): void {
    const tier = pick.kind === "decor" ? 1 : pick.marker === "region" ? 0 : 2;
    this.pickables.push({
      pick,
      bounds: typeof bounds === "function" ? bounds : () => bounds,
      order: tier * 1e6 + y,
    });
  }

  /**
   * Reads the named country beside the map. The file is written against the
   * same grid at every tile size, so a set drawn larger needs no second copy;
   * a grid of another shape is refused rather than read at an offset.
   */
  private readFeatures(map: Phaser.Tilemaps.Tilemap): void {
    const file = this.cache.json.get("features") as
      | { width?: number; height?: number; features?: Record<string, number[]> }
      | undefined;
    if (!file?.features) return;
    if (file.width !== map.width || file.height !== map.height) {
      this.config.onError?.("stage: the feature file is drawn to another grid");
      return;
    }
    for (const [id, cells] of Object.entries(file.features)) {
      this.featureCells.set(id, cells);
      for (const cell of cells) this.featureAt.set(cell, id);
    }
  }

  private pickableAt(worldX: number, worldY: number): StagePick | null {
    if (!this.config.interactive) return null;
    for (const candidate of this.pickables) {
      if (candidate.bounds().contains(worldX, worldY)) return candidate.pick;
    }
    return null;
  }

  /**
   * Reads the map at a point: a place or a piece of set dressing if the click
   * landed on one, otherwise the topmost ground painted there. Bare grass is
   * reported as nothing picked, which is what closes an open panel, and so is
   * a second click on whatever the panel already shows.
   */
  private pickAt(worldX: number, worldY: number): void {
    const marked = this.pickableAt(worldX, worldY);
    if (marked) {
      if (this.isCurrent(marked)) {
        this.clearPick();
        return;
      }
      this.showPick(marked, worldX, worldY);
      return;
    }
    const map = this.map;
    const tileX = map ? Math.floor(worldX / map.tileWidth) : -1;
    const tileY = map ? Math.floor(worldY / map.tileHeight) : -1;
    if (
      map &&
      tileX >= 0 &&
      tileY >= 0 &&
      tileX < map.width &&
      tileY < map.height
    ) {
      for (let i = this.grounds.length - 1; i >= 0; i -= 1) {
        const { ground, layer } = this.grounds[i];
        if (!map.getTileAt(tileX, tileY, false, layer)) continue;
        if (ground === BARE_GROUND) break;
        // a second click anywhere in the run already lit closes it, while one
        // on another run of the same ground opens that run instead
        if (
          this.current?.id === ground &&
          this.currentRun?.layer === layer &&
          this.currentRun.inside[tileY * map.width + tileX] === 1
        ) {
          this.clearPick();
          return;
        }
        const feature = this.featureAt.get(tileY * map.width + tileX);
        this.showPick(
          {
            kind: WATER_GROUNDS.has(ground) ? "water" : "terrain",
            id: ground,
            ...(feature ? { feature } : {}),
          },
          worldX,
          worldY,
          { layer, tileX, tileY },
        );
        return;
      }
    }
    this.clearPick();
  }

  /** Whether the panel is already showing this very thing. */
  private isCurrent(pick: StagePick): boolean {
    const current = this.current;
    return (
      current !== null &&
      current.kind === pick.kind &&
      current.id === pick.id &&
      current.marker === pick.marker
    );
  }

  private showPick(
    pick: StagePick,
    worldX: number,
    worldY: number,
    ground?: { layer: string; tileX: number; tileY: number },
  ): void {
    this.current = pick;
    this.drawHighlight(pick, worldX, worldY, ground);
    this.config.onPick?.(pick);
  }

  /** Drops the highlight and tells the page nothing is picked. */
  clearPick(): void {
    this.highlight?.destroy();
    this.highlight = undefined;
    this.current = null;
    this.currentRun = undefined;
    this.config.onPick?.(null);
  }

  private drawHighlight(
    pick: StagePick,
    worldX: number,
    worldY: number,
    ground?: { layer: string; tileX: number; tileY: number },
  ): void {
    this.highlight?.destroy();
    const graphics = this.add.graphics().setDepth(9000);
    this.highlight = graphics;
    this.currentRun = undefined;
    if (ground) {
      const inside = this.outlineGround(
        graphics,
        ground.layer,
        ground.tileX,
        ground.tileY,
        pick.feature ? this.featureCells.get(pick.feature) : undefined,
      );
      if (inside) this.currentRun = { layer: ground.layer, inside };
    } else {
      const bounds =
        this.pickables
          .find(
            (candidate) =>
              candidate.pick.id === pick.id &&
              candidate.pick.kind === pick.kind &&
              candidate.bounds().contains(worldX, worldY),
          )
          ?.bounds() ??
        new Phaser.Geom.Rectangle(worldX - 8, worldY - 8, 16, 16);
      graphics.lineStyle(Math.max(1, this.unit), PICK_COLOR, 0.9);
      graphics.strokeRoundedRect(
        bounds.x - 2,
        bounds.y - 2,
        bounds.width + 4,
        bounds.height + 4,
        3,
      );
    }
    graphics.setAlpha(0);
    this.tweens.add({ targets: graphics, alpha: 1, duration: 160 });
  }

  /**
   * Lights up what the click landed in: the cells of the named feature when
   * the map knows one, so the He lights as the He and not as every water it
   * runs into, and otherwise the connected run of that ground, so clicking a
   * range shows the range rather than one tile of it. Returns what it lit,
   * which is what a later click is tested against.
   */
  private outlineGround(
    graphics: Phaser.GameObjects.Graphics,
    layer: string,
    tileX: number,
    tileY: number,
    named?: number[],
  ): Uint8Array | undefined {
    const map = this.map;
    if (!map) return undefined;
    const width = map.width;
    const height = map.height;
    const tile = map.tileWidth;
    const inside = new Uint8Array(width * height);
    const cells: number[] = [];
    if (named) {
      for (const cell of named) {
        inside[cell] = 1;
        cells.push(cell);
      }
    } else {
      const stack = [tileY * width + tileX];
      inside[stack[0]] = 1;
      while (stack.length) {
        const cell = stack.pop()!;
        cells.push(cell);
        const x = cell % width;
        const y = (cell - x) / width;
        const step = (nx: number, ny: number): void => {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          const next = ny * width + nx;
          if (inside[next] || !map.getTileAt(nx, ny, false, layer)) return;
          inside[next] = 1;
          stack.push(next);
        };
        step(x - 1, y);
        step(x + 1, y);
        step(x, y - 1);
        step(x, y + 1);
      }
    }
    graphics.fillStyle(PICK_COLOR, 0.14);
    for (const cell of cells) {
      const x = cell % width;
      const y = (cell - x) / width;
      graphics.fillRect(x * tile, y * tile, tile, tile);
    }
    const filled = (x: number, y: number): boolean =>
      x >= 0 &&
      y >= 0 &&
      x < width &&
      y < height &&
      inside[y * width + x] === 1;
    graphics.lineStyle(Math.max(1, this.unit), PICK_COLOR, 0.85);
    graphics.beginPath();
    for (const cell of cells) {
      const x = cell % width;
      const y = (cell - x) / width;
      const left = x * tile;
      const top = y * tile;
      if (!filled(x - 1, y)) {
        graphics.moveTo(left, top);
        graphics.lineTo(left, top + tile);
      }
      if (!filled(x + 1, y)) {
        graphics.moveTo(left + tile, top);
        graphics.lineTo(left + tile, top + tile);
      }
      if (!filled(x, y - 1)) {
        graphics.moveTo(left, top);
        graphics.lineTo(left + tile, top);
      }
      if (!filled(x, y + 1)) {
        graphics.moveTo(left, top + tile);
        graphics.lineTo(left + tile, top + tile);
      }
    }
    graphics.strokePath();
    return inside;
  }

  /** Queues a beat; beats play in arrival order, one at a time. */
  enqueue(beat: StageBeat): void {
    this.queue.push(beat);
    this.pump();
  }

  get pending(): number {
    return this.queue.length + (this.playing ? 1 : 0);
  }

  private pump(): void {
    if (this.playing || !this.sys.isActive()) return;
    const beat = this.queue.shift();
    if (!beat) {
      this.config.onIdle?.();
      return;
    }
    this.playing = true;
    this.playBeat(beat, () => {
      this.playing = false;
      this.config.onBeatEnd?.(beat);
      this.pump();
    });
  }

  private zoomFor(plan: StagePlan): number {
    const width = plan.bounds.width + 200 * this.unit;
    const height = plan.bounds.height + 140 * this.unit;
    const fit = Math.min(this.view.width / width, this.view.height / height);
    const ladder = ZOOMS.map((zoom) => zoom / this.unit);
    return ladder.find((zoom) => zoom <= fit) ?? ladder[ladder.length - 1];
  }

  private playBeat(beat: StageBeat, done: () => void): void {
    const planned = planBeat({
      beat,
      places: this.places,
      homes: this.homes,
      unit: this.unit,
    });
    const plan = this.grid
      ? routePlan(planned, (from, to) => this.routeOf(from, to), this.unit)
      : planned;
    this.clearLive();
    this.config.onBeatStart?.(beat, plan);
    if (this.follow) {
      const camera = this.cameras.main;
      camera.pan(plan.focus.x, plan.focus.y, PAN_MS, "Sine.easeInOut");
      camera.zoomTo(this.zoomFor(plan), PAN_MS, "Sine.easeInOut");
    }
    this.time.delayedCall(PAN_MS, () => {
      plan.actions.forEach((action) => this.runAction(action));
    });
    this.time.delayedCall(plan.durationMs, done);
  }

  private clearLive(): void {
    for (const object of this.live) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.live = [];
  }

  /**
   * Walks a sprite along a polyline, turning to face each leg, and sorts it
   * by its feet as it goes so it passes behind a wall's face and in front of
   * a roof's eave. `onStep` follows it (the seat's flag rides on the lead).
   */
  private walkAlong({
    sprite,
    asset,
    points,
    ms,
    delay,
    onStep,
  }: {
    sprite: Phaser.GameObjects.Sprite;
    asset: StageAsset;
    points: StagePoint[];
    ms: number;
    delay: number;
    onStep?: (x: number, y: number) => void;
  }): void {
    const total = lengthOf(points) || 1;
    const step = (i: number): void => {
      if (!sprite.active) return;
      if (i >= points.length - 1) {
        sprite.anims.stop();
        sprite.setFrame(restFrame(asset.sprite!));
        return;
      }
      const a = points[i];
      const b = points[i + 1];
      const leg = Math.hypot(b.x - a.x, b.y - a.y);
      sprite.play(`${asset.id}:${facingOf(a, b)}`, true);
      this.tweens.add({
        targets: sprite,
        x: b.x,
        y: b.y,
        duration: Math.max(1, Math.round((ms * leg) / total)),
        ease: "Linear",
        onUpdate: () => {
          sprite.setDepth(sprite.y);
          onStep?.(sprite.x, sprite.y);
        },
        onComplete: () => step(i + 1),
      });
    };
    this.time.delayedCall(delay, () => step(0));
  }

  private runAction(action: StageAction): void {
    const { direction, from, to, travels, count, walkMs, totalMs } = action;
    const asset = spriteFor(this.config.manifest, direction.actor.archetype);
    const color = this.config.colors[direction.actor.seat] ?? 0xffffff;
    const offsets = formation(count, 10 * this.unit);
    const facing = travels ? facingOf(from, to) : "down";
    const actors: Phaser.GameObjects.Sprite[] = [];
    const way = action.path ?? [from, to];
    if (asset?.sprite) {
      const scale = this.scaleOf(asset);
      const stands = asset.sprite.frameHeight * scale;
      const u = this.unit;
      let flag: Phaser.GameObjects.Rectangle | undefined;
      let pole: Phaser.GameObjects.Rectangle | undefined;
      const placeFlag = (x: number, y: number): void => {
        flag?.setPosition(x + 6 * u, y - (stands + 4 * u));
        pole?.setPosition(x + 3 * u, y - (stands + 1 * u));
      };
      offsets.forEach((offset, i) => {
        const sprite = this.add
          .sprite(from.x + offset.x, from.y + offset.y, asset.id)
          .setOrigin(0.5, 1)
          .setScale(scale)
          .setDepth(from.y + offset.y);
        sprite.play(`${asset.id}:${facing}`);
        actors.push(sprite);
        this.live.push(sprite);
        if (travels) {
          this.walkAlong({
            sprite,
            asset,
            points: way.map((point) => ({
              x: point.x + offset.x,
              y: point.y + offset.y,
            })),
            ms: walkMs,
            delay: i * 70,
            onStep: i === 0 ? placeFlag : undefined,
          });
        } else {
          this.time.delayedCall(700 + i * 90, () => {
            if (!sprite.active) return;
            sprite.anims.stop();
            sprite.setFrame(restFrame(asset.sprite!));
          });
        }
      });
      const lead = actors[0];
      if (lead && this.config.flags !== false) {
        flag = this.add.rectangle(0, 0, 6 * u, 4 * u, color).setDepth(7000);
        pole = this.add.rectangle(0, 0, 1 * u, 9 * u, 0x0b0d10).setDepth(6999);
        placeFlag(lead.x, lead.y);
        this.live.push(flag, pole);
      }
    }
    if (action.effect) {
      const id = effectId(action.effect);
      const effectAsset = this.config.manifest.assets[id];
      if (effectAsset && this.textures.exists(id)) {
        const scale =
          this.scaleOf(effectAsset) *
          (action.effect === "flood" || action.effect === "grey" ? 2 : 1.5);
        this.time.delayedCall(travels ? walkMs : 200, () => {
          if (!this.sys.isActive()) return;
          const effect = this.add
            .sprite(to.x, to.y - 10 * this.unit, id)
            .setOrigin(0.5, 1)
            .setDepth(8000)
            .setScale(scale);
          effect.play(id);
          this.live.push(effect);
        });
      }
    }
    this.time.delayedCall(totalMs, () => {
      const targets = this.live.filter((object) => object.active);
      if (!targets.length) return;
      this.tweens.add({
        targets,
        alpha: 0,
        duration: 300,
        onComplete: () => this.clearLive(),
      });
    });
  }
}
