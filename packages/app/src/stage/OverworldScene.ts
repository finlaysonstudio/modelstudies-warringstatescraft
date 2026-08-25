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
import type { StageAsset, StageManifest } from "./manifest";

export const MAP_URL = "/stage/overworld.tmj";
export const WATER_FRAME_STRIDE = 48;
export const WATER_FRAME_MS = 400;
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 400;

const FONT =
  '"IBM Plex Mono", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", monospace';
const ZOOMS = [3, 2.5, 2, 1.5, 1.25, 1];
export const MAX_ZOOM = 4;
/** wheel delta → zoom factor; exponential so trackpads glide and wheels step */
const WHEEL_ZOOM_RATE = 0.0015;

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
  /** drag pans and the wheel zooms; the camera opens on the whole map */
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
  private waterTiles: { tile: Phaser.Tilemaps.Tile; base: number }[] = [];
  private waterFrame = 0;
  private live: Phaser.GameObjects.GameObject[] = [];
  private loadedSprites = new Map<string, StageAsset>();
  private minZoom = ZOOMS[ZOOMS.length - 1];
  private fitZoom = 1;
  private labels: { text: Phaser.GameObjects.Text; tier: LabelTier }[] = [];
  private labelZoom = 0;
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

  create(): void {
    const map = this.make.tilemap({ key: "overworld" });
    const tilesets = map.tilesets
      .map((tileset) =>
        this.textures.exists(tileset.name)
          ? map.addTilesetImage(tileset.name, tileset.name)
          : null,
      )
      .filter(
        (tileset): tileset is Phaser.Tilemaps.Tileset => tileset !== null,
      );
    map.layers.forEach((layerData) => {
      const layer = map.createLayer(layerData.name, tilesets, 0, 0);
      if (!layer) return;
      if (WATERS.some((water) => water === layerData.name)) {
        layer.forEachTile((tile) => {
          if (tile.index > 0) this.waterTiles.push({ tile, base: tile.index });
        });
      }
    });
    if (this.waterTiles.length) {
      this.time.addEvent({
        delay: WATER_FRAME_MS,
        loop: true,
        callback: () => {
          this.waterFrame = (this.waterFrame + 1) % 3;
          for (const { tile, base } of this.waterTiles) {
            tile.index = base + this.waterFrame * WATER_FRAME_STRIDE;
          }
        },
      });
    }

    for (const object of (map.getObjectLayer("decor")?.objects ??
      []) as TiledPoint[]) {
      const id = object.type || object.class || "";
      if (!this.textures.exists(id)) continue;
      this.add
        .image(object.x, object.y, id)
        .setOrigin(0.5, 0.85)
        .setDepth(object.y);
    }

    const objects = (map.getObjectLayer("places")?.objects ??
      []) as TiledPoint[];
    for (const object of objects) {
      const key = object.name;
      this.places[key] = { x: object.x, y: object.y };
      const kind = object.type || object.class || "region";
      const label = this.config.names[key] ?? key;
      if (kind !== "region") {
        const candidates = MARKER_VARIANTS[kind as Marker] ?? [
          markerId(kind as Marker),
        ];
        const pool = candidates.filter((id) => this.textures.exists(id));
        const id = pool.length ? pool[hashOf(key) % pool.length] : undefined;
        if (id) {
          this.add
            .image(object.x, object.y, id)
            .setOrigin(0.5, 0.85)
            .setDepth(object.y);
        }
        const tier: LabelTier =
          kind === "court" || kind === "altar" || kind === "hall"
            ? "major"
            : "minor";
        const text = this.add
          .text(object.x, object.y + 4, label, {
            fontFamily: FONT,
            fontSize: "8px",
            color: "#f4f1ea",
            stroke: "#0b0d10",
            strokeThickness: 3,
          })
          .setOrigin(0.5, 0)
          .setResolution(3)
          .setDepth(5000);
        this.labels.push({ text, tier });
      } else {
        const text = this.add
          .text(object.x, object.y, label, {
            fontFamily: FONT,
            fontSize: "10px",
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
      }
      const state = propertiesOf(object).state;
      if (typeof state === "string") this.homes[state] = key;
    }
    for (const [seat, home] of Object.entries(this.config.script.seats)) {
      this.homes[seat] = home.home;
      const point = this.places[home.home];
      const color = this.config.colors[seat];
      if (point && color !== undefined) {
        this.add
          .rectangle(point.x - 14, point.y - 18, 6, 4, color)
          .setDepth(6000);
        this.add
          .rectangle(point.x - 17, point.y - 16, 1, 8, 0x0b0d10)
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
      camera.setZoom(1.5);
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

  /** Drag pans, the wheel zooms at the cursor, and a beat's pan is cancelled
   * by taking hold of the map. */
  private enableCameraControls(): void {
    const camera = this.cameras.main;
    this.input.setDefaultCursor("grab");
    this.input.on("pointerdown", () => {
      camera.panEffect.reset();
      camera.zoomEffect.reset();
      this.input.setDefaultCursor("grabbing");
    });
    this.input.on("pointerup", () => this.input.setDefaultCursor("grab"));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    });
    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _over: unknown,
        _dx: number,
        dy: number,
      ) => {
        const prev = camera.zoom;
        const next = clamp(
          prev * Math.exp(-dy * WHEEL_ZOOM_RATE),
          this.minZoom,
          MAX_ZOOM,
        );
        if (next === prev) return;
        camera.panEffect.reset();
        camera.zoomEffect.reset();
        // hold the world point under the cursor fixed through the zoom
        const halfW = camera.width / 2;
        const halfH = camera.height / 2;
        const worldX = camera.scrollX + halfW + (pointer.x - halfW) / prev;
        const worldY = camera.scrollY + halfH + (pointer.y - halfH) / prev;
        camera.setZoom(next);
        camera.centerOn(
          worldX - (pointer.x - halfW) / next,
          worldY - (pointer.y - halfH) / next,
        );
      },
    );
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
    const width = plan.bounds.width + 200;
    const height = plan.bounds.height + 140;
    const fit = Math.min(this.view.width / width, this.view.height / height);
    return ZOOMS.find((zoom) => zoom <= fit) ?? ZOOMS[ZOOMS.length - 1];
  }

  private playBeat(beat: StageBeat, done: () => void): void {
    const plan = planBeat({ beat, places: this.places, homes: this.homes });
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
    const offsets = formation(count);
    const facing = travels ? facingOf(from, to) : "down";
    const actors: Phaser.GameObjects.Sprite[] = [];
    if (asset?.sprite) {
      offsets.forEach((offset, i) => {
        const sprite = this.add
          .sprite(from.x + offset.x, from.y + offset.y, asset.id)
          .setOrigin(0.5, 1)
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
        const flag = this.add
          .rectangle(
            lead.x + 6,
            lead.y - (asset.sprite.frameHeight + 4),
            6,
            4,
            color,
          )
          .setDepth(7000);
        const pole = this.add
          .rectangle(
            lead.x + 3,
            lead.y - (asset.sprite.frameHeight + 1),
            1,
            9,
            0x0b0d10,
          )
          .setDepth(6999);
        this.live.push(flag, pole);
        if (travels) {
          this.tweens.add({
            targets: flag,
            x: to.x + offsets[0].x + 6,
            y: to.y + offsets[0].y - (asset.sprite.frameHeight + 4),
            duration: walkMs,
            ease: "Linear",
          });
          this.tweens.add({
            targets: pole,
            x: to.x + offsets[0].x + 3,
            y: to.y + offsets[0].y - (asset.sprite.frameHeight + 1),
            duration: walkMs,
            ease: "Linear",
          });
        }
      }
    }
    if (action.effect) {
      const id = effectId(action.effect);
      if (this.textures.exists(id)) {
        this.time.delayedCall(travels ? walkMs : 200, () => {
          if (!this.sys.isActive()) return;
          const effect = this.add
            .sprite(to.x, to.y - 10, id)
            .setOrigin(0.5, 1)
            .setDepth(8000)
            .setScale(
              action.effect === "flood" || action.effect === "grey" ? 2 : 1.5,
            );
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
