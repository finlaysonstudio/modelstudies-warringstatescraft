import Phaser from "phaser";

import type { StageBeat, StageScript } from "../lib/types";
import { spriteFor } from "./assets";
import {
  facingOf,
  formation,
  PAN_MS,
  planBeat,
  type StageAction,
  type StagePlaces,
  type StagePlan,
} from "./beats";
import {
  ARCHETYPES,
  DECOR,
  EFFECTS,
  MARKER_VARIANTS,
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
import { BARE_GROUND, type LegendKind } from "./legend";
import type { StageAsset, StageManifest } from "./manifest";
import { BASE_TILE, DEFAULT_STAGE_SET, stageSet } from "./sets";

/** the map of the set the stage plays on unless a caller names another */
export const MAP_URL = stageSet(DEFAULT_STAGE_SET).map;
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

/** stable per-place hash, used to vary repeated marker buildings */
const hashOf = (key: string): number => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
};

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
  script: StageScript;
  /** place key → label in the run's language */
  names: Record<string, string>;
  /** seat → colour */
  colors: Record<string, number>;
  mapUrl?: string;
  /** the game canvas in logical pixels (defaults to the watch page's view) */
  view?: { width: number; height: number };
  /** scrolling pans, the map is clickable, and the camera opens on the whole of it */
  interactive?: boolean;
  /** whether the camera flies to each beat (the explorer can switch it off) */
  follow?: boolean;
}

interface TiledPoint {
  name: string;
  type?: string;
  class?: string;
  x: number;
  y: number;
  properties?: { name: string; value: unknown }[] | Record<string, unknown>;
}

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

  constructor(config: OverworldConfig) {
    super("overworld");
    this.config = config;
    this.view = config.view ?? { width: VIEW_WIDTH, height: VIEW_HEIGHT };
    this.follow = config.follow ?? true;
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
    const image = (id: string): void => {
      const asset = manifest.assets[id];
      if (asset) this.load.image(id, asset.url);
    };
    TERRAINS.forEach((terrain) => image(terrainId(terrain)));
    WATERS.forEach((water) => image(waterId(water)));
    MARKERS.forEach((marker) => image(markerId(marker)));
    Object.values(MARKER_VARIANTS)
      .flat()
      .forEach((id) => image(id));
    DECOR.forEach((decor) => image(decorId(decor)));
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
      this.addPickable(
        { kind: "decor", id: id.replace(/^decor\./, "") },
        image.getBounds(),
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
      if (kind !== "region") {
        const candidates = MARKER_VARIANTS[kind as Marker] ?? [
          markerId(kind as Marker),
        ];
        const pool = candidates.filter((id) => this.textures.exists(id));
        const id = pool.length ? pool[hashOf(key) % pool.length] : undefined;
        const asset = id ? this.config.manifest.assets[id] : undefined;
        if (id && asset) {
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
      if (point && color !== undefined) {
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
    this.config.onReady?.();
    this.pump();
  }

  update(): void {
    this.updateLabels();
    this.reportZoom();
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
        this.showPick(
          { kind: WATER_GROUNDS.has(ground) ? "water" : "terrain", id: ground },
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
   * Lights up the whole run of one ground the click landed in: the connected
   * tiles of that layer, filled faintly and outlined where they end. Clicking
   * a range shows the range rather than one tile of it. Returns the run it
   * lit, which is what a later click is tested against.
   */
  private outlineGround(
    graphics: Phaser.GameObjects.Graphics,
    layer: string,
    tileX: number,
    tileY: number,
  ): Uint8Array | undefined {
    const map = this.map;
    if (!map) return undefined;
    const width = map.width;
    const height = map.height;
    const tile = map.tileWidth;
    const inside = new Uint8Array(width * height);
    const stack = [tileY * width + tileX];
    inside[stack[0]] = 1;
    const cells: number[] = [];
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
    const plan = planBeat({
      beat,
      places: this.places,
      homes: this.homes,
      unit: this.unit,
    });
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

  private runAction(action: StageAction): void {
    const { direction, from, to, travels, count, walkMs, totalMs } = action;
    const asset = spriteFor(this.config.manifest, direction.actor.archetype);
    const color = this.config.colors[direction.actor.seat] ?? 0xffffff;
    const offsets = formation(count, 10 * this.unit);
    const facing = travels ? facingOf(from, to) : "down";
    const actors: Phaser.GameObjects.Sprite[] = [];
    if (asset?.sprite) {
      const scale = this.scaleOf(asset);
      const stands = asset.sprite.frameHeight * scale;
      offsets.forEach((offset, i) => {
        const sprite = this.add
          .sprite(from.x + offset.x, from.y + offset.y, asset.id)
          .setOrigin(0.5, 1)
          .setScale(scale)
          .setDepth(1000 + from.y + offset.y);
        sprite.play(`${asset.id}:${facing}`);
        actors.push(sprite);
        this.live.push(sprite);
        if (travels) {
          this.tweens.add({
            targets: sprite,
            x: to.x + offset.x,
            y: to.y + offset.y,
            duration: walkMs,
            delay: i * 70,
            ease: "Linear",
            onUpdate: () => sprite.setDepth(1000 + sprite.y),
            onComplete: () => {
              if (!sprite.active) return;
              sprite.anims.stop();
              sprite.setFrame(restFrame(asset.sprite!));
            },
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
      if (lead) {
        const u = this.unit;
        const flag = this.add
          .rectangle(
            lead.x + 6 * u,
            lead.y - (stands + 4 * u),
            6 * u,
            4 * u,
            color,
          )
          .setDepth(7000);
        const pole = this.add
          .rectangle(
            lead.x + 3 * u,
            lead.y - (stands + 1 * u),
            1 * u,
            9 * u,
            0x0b0d10,
          )
          .setDepth(6999);
        this.live.push(flag, pole);
        if (travels) {
          this.tweens.add({
            targets: flag,
            x: to.x + offsets[0].x + 6 * u,
            y: to.y + offsets[0].y - (stands + 4 * u),
            duration: walkMs,
            ease: "Linear",
          });
          this.tweens.add({
            targets: pole,
            x: to.x + offsets[0].x + 3 * u,
            y: to.y + offsets[0].y - (stands + 1 * u),
            duration: walkMs,
            ease: "Linear",
          });
        }
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
