/**
 * The fallback sheets: `npm run stage:fallback`.
 *
 * Writes a flat-colour sheet for every id in the stage catalog into
 * `packages/app/public/stage/fallback/` (committed), in exactly the layouts
 * the vendor step produces, so the stage renders from a fresh checkout and
 * any id the purchased packs do not cover still resolves.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { StageArchetype, StageEffect } from "../../src/lib/types";
import {
  ARCHETYPES,
  DECOR,
  EFFECTS,
  MARKERS,
  TERRAINS,
  WATERS,
  type Decor,
  type Marker,
  type Terrain,
  type Water,
} from "../../src/stage/catalog";
import {
  BLOB_COLUMNS,
  BLOB_MASKS,
  BLOB_ROWS,
  E,
  N,
  NE,
  NW,
  S,
  SE,
  SW,
  W,
} from "../vendor/blob";
import type { AssetEntry, VendorManifest } from "../vendor/manifest";
import {
  blankImage,
  encodePng,
  setPixel,
  type Image,
  type Rgba,
} from "../vendor/png";
import { FACINGS, spriteMeta, type Facing } from "../vendor/slice";
import { blobTileset } from "../vendor/tileset";
import { blocksOf } from "../map/map";
import { variantSheet } from "../period/tileset";
import { disc, line, rect, rgba, ring, shade, triangle } from "./draw";

const TILE = 16;
const CLEAR: Rgba = [0, 0, 0, 0];

const TERRAIN_COLORS: Record<
  Terrain,
  { fill: string; rim: string; dots?: string }
> = {
  grass: { fill: "#5f8f3f", rim: "#5f8f3f", dots: "#578538" },
  tallgrass: { fill: "#4a7f37", rim: "#3a662b", dots: "#437431" },
  scrub: { fill: "#8a9b55", rim: "#6f7f42", dots: "#7d8d4c" },
  loess: { fill: "#c9a86a", rim: "#a3844c" },
  steppe: { fill: "#b3ab66", rim: "#8f884e", dots: "#a49d5c" },
  road: { fill: "#8a6a45", rim: "#6b4f31" },
  cobble: { fill: "#8c8c88", rim: "#63635f", dots: "#7a7a76" },
  forest: { fill: "#2f6b2f", rim: "#1f4a1f", dots: "#255a25" },
  bamboo: { fill: "#7fae3c", rim: "#5e872b", dots: "#71a034" },
  hills: { fill: "#6f8f52", rim: "#55703c", dots: "#638047" },
  mountain: { fill: "#7d7468", rim: "#4e463d", dots: "#6a6257" },
  qinling: { fill: "#5e5f63", rim: "#3a3b3f", dots: "#4e4f53" },
  taihang: { fill: "#4c5057", rim: "#2f3238", dots: "#3f434a" },
  shu: { fill: "#a29a86", rim: "#726b5c", dots: "#8e8674" },
  marsh: { fill: "#4f7a5a", rim: "#3a5c44", dots: "#436a4e" },
  field: { fill: "#9bb04a", rim: "#7a8c34", dots: "#889a3e" },
};

const WATER_COLORS: Record<Water, string[]> = {
  river: ["#3d7bc4", "#4a89d0", "#3671b8"],
  sea: ["#2c5f9e", "#3468a8", "#27568f"],
};

const paintBlobTile = (
  out: Image,
  tx: number,
  ty: number,
  mask: number,
  fill: Rgba,
  rim: Rgba,
  dots?: Rgba,
): void => {
  rect(out, tx, ty, TILE, TILE, fill);
  if (dots) {
    for (let y = 0; y < TILE; y += 1) {
      for (let x = 0; x < TILE; x += 1) {
        if ((x * 7 + y * 3) % 11 === 0) setPixel(out, tx + x, ty + y, dots);
      }
    }
  }
  const has = (bit: number): boolean => (mask & bit) !== 0;
  const r = 2;
  if (!has(N)) rect(out, tx, ty, TILE, r, rim);
  if (!has(S)) rect(out, tx, ty + TILE - r, TILE, r, rim);
  if (!has(W)) rect(out, tx, ty, r, TILE, rim);
  if (!has(E)) rect(out, tx + TILE - r, ty, r, TILE, rim);
  // rounded outer corners
  if (!has(N) && !has(W)) {
    rect(out, tx, ty, 2, 2, CLEAR);
    setPixel(out, tx + 2, ty + 2, rim);
  }
  if (!has(N) && !has(E)) {
    rect(out, tx + TILE - 2, ty, 2, 2, CLEAR);
    setPixel(out, tx + TILE - 3, ty + 2, rim);
  }
  if (!has(S) && !has(W)) {
    rect(out, tx, ty + TILE - 2, 2, 2, CLEAR);
    setPixel(out, tx + 2, ty + TILE - 3, rim);
  }
  if (!has(S) && !has(E)) {
    rect(out, tx + TILE - 2, ty + TILE - 2, 2, 2, CLEAR);
    setPixel(out, tx + TILE - 3, ty + TILE - 3, rim);
  }
  // inner corners
  if (has(N) && has(W) && !has(NW)) rect(out, tx, ty, 3, 3, rim);
  if (has(N) && has(E) && !has(NE)) rect(out, tx + TILE - 3, ty, 3, 3, rim);
  if (has(S) && has(W) && !has(SW)) rect(out, tx, ty + TILE - 3, 3, 3, rim);
  if (has(S) && has(E) && !has(SE))
    rect(out, tx + TILE - 3, ty + TILE - 3, 3, 3, rim);
};

const blobSheet = (
  frames: { fill: Rgba; rim: Rgba; dots?: Rgba; wave?: number }[],
): Image => {
  const out = blankImage(BLOB_COLUMNS * TILE, BLOB_ROWS * TILE * frames.length);
  frames.forEach((frame, f) => {
    BLOB_MASKS.forEach((mask, index) => {
      const tx = (index % BLOB_COLUMNS) * TILE;
      const ty = Math.floor(index / BLOB_COLUMNS) * TILE + f * BLOB_ROWS * TILE;
      paintBlobTile(out, tx, ty, mask, frame.fill, frame.rim, frame.dots);
      if (frame.wave !== undefined) {
        const light = shade(frame.fill, 1.25);
        for (let y = 0; y < TILE; y += 1) {
          if ((y + frame.wave * 2) % 6 !== 2) continue;
          for (let x = 2; x < TILE - 2; x += 1) {
            if ((x + y) % 5 < 2) setPixel(out, tx + x, ty + y, light);
          }
        }
      }
    });
  });
  return out;
};

const SPRITE_COLORS: Record<StageArchetype, { body: string; accent: string }> =
  {
    envoy: { body: "#3b5bdb", accent: "#e8c547" },
    general: { body: "#b3261e", accent: "#e8c547" },
    infantry: { body: "#6b4f31", accent: "#9aa0a6" },
    crossbowman: { body: "#556b2f", accent: "#3b2a1a" },
    cavalry: { body: "#7a3e1f", accent: "#e8c547" },
    chariot: { body: "#8b5a2b", accent: "#e8c547" },
    merchant: { body: "#6f42c1", accent: "#e8c547" },
    peasant: { body: "#c8a165", accent: "#8b6b3e" },
    clerk: { body: "#7f8c8d", accent: "#ecf0f1" },
    scholar: { body: "#ecf0f1", accent: "#2c3e50" },
    mohist: { body: "#2c2c2c", accent: "#95a5a6" },
    assassin: { body: "#1b1b1b", accent: "#b3261e" },
    hostage: { body: "#e0c9a6", accent: "#3b5bdb" },
    labourer: { body: "#b07d3a", accent: "#6b4f31" },
    court: { body: "#e8c547", accent: "#b3261e" },
    boat: { body: "#8b5a2b", accent: "#ecf0f1" },
    // the Annals: the court, the bureau, and the road, plus the one beast
    // the vocabulary asks for by name
    dowager: { body: "#7d3c98", accent: "#e8c547" },
    chancellor: { body: "#4a235a", accent: "#e8c547" },
    minister: { body: "#1f4e79", accent: "#ecf0f1" },
    eunuch: { body: "#5d6d7e", accent: "#d4ac0d" },
    herald: { body: "#c0392b", accent: "#f7dc6f" },
    guard: { body: "#4d5656", accent: "#c0c0c0" },
    diviner: { body: "#e8daef", accent: "#5b2c6f" },
    physician: { body: "#d5f5e3", accent: "#186a3b" },
    executioner: { body: "#641e16", accent: "#2c2c2c" },
    persuader: { body: "#1abc9c", accent: "#f3e7c9" },
    retainer: { body: "#8d6e63", accent: "#d7ccc8" },
    spy: { body: "#212f3d", accent: "#5d6d7e" },
    engineer: { body: "#7e5109", accent: "#aeb6bf" },
    "horse-archer": { body: "#784212", accent: "#f5b942" },
    charioteer: { body: "#935116", accent: "#e8c547" },
    drummer: { body: "#a04000", accent: "#f3e7c9" },
    "standard-bearer": { body: "#922b21", accent: "#f7dc6f" },
    ox: { body: "#8d6748", accent: "#f2f0e8" },
  };

const SKIN = rgba("#f1c9a5");
const HAIR = rgba("#2b1b10");
const DARK = rgba("#3a2a1a");
const HORSE = rgba("#5b3a1e");

const drawPerson = (
  out: Image,
  fx: number,
  fy: number,
  archetype: StageArchetype,
  facing: Facing,
  step: number,
): void => {
  const { body, accent } = SPRITE_COLORS[archetype];
  const bodyColor = rgba(body);
  const accentColor = rgba(accent);
  const bob = step === 1 ? -1 : 0;
  if (archetype === "boat") {
    rect(out, fx + 2, fy + 22 + bob, 12, 5, bodyColor);
    rect(out, fx + 3, fy + 27 + bob, 10, 1, shade(bodyColor, 0.7));
    line(out, fx + 8, fy + 10 + bob, fx + 8, fy + 22 + bob, DARK);
    triangle(
      out,
      [
        [fx + 8, fy + 11 + bob],
        [fx + 8, fy + 20 + bob],
        [facing === "left" ? fx + 3 : fx + 13, fy + 18 + bob],
      ],
      accentColor,
    );
    return;
  }
  if (archetype === "ox") {
    // a beast rather than a person: a long body, a low head, and horns
    rect(out, fx + 2, fy + 16 + bob, 12, 8, bodyColor);
    rect(out, fx + 2, fy + 22 + bob, 12, 2, shade(bodyColor, 0.75));
    const nose = facing === "left" ? fx : fx + 12;
    rect(out, nose, fy + 18 + bob, 4, 5, shade(bodyColor, 1.1));
    rect(
      out,
      nose + (facing === "left" ? 0 : 3),
      fy + 15 + bob,
      1,
      3,
      accentColor,
    );
    rect(
      out,
      nose + (facing === "left" ? 3 : 0),
      fy + 15 + bob,
      1,
      3,
      accentColor,
    );
    for (const lx of [3, 6, 9, 12])
      rect(out, fx + lx, fy + 24 + bob, 2, 5, DARK);
    return;
  }
  const mounted =
    archetype === "cavalry" ||
    archetype === "chariot" ||
    archetype === "horse-archer" ||
    archetype === "charioteer";
  if (mounted) {
    // a mount beneath the rider
    rect(
      out,
      fx + 1,
      fy + 21 + bob,
      14,
      6,
      archetype === "chariot" || archetype === "charioteer" ? bodyColor : HORSE,
    );
    rect(out, fx + 2, fy + 27, 2, 4, DARK);
    rect(out, fx + 12, fy + 27, 2, 4, DARK);
    if (archetype === "chariot" || archetype === "charioteer") {
      disc(out, fx + 4, fy + 28, 2.2, DARK);
      disc(out, fx + 12, fy + 28, 2.2, DARK);
    } else {
      // head of the horse
      rect(out, facing === "left" ? fx : fx + 13, fy + 18 + bob, 3, 5, HORSE);
    }
  }
  const legTop = mounted ? 19 : 24;
  // legs: alternate which foot leads
  const lead = step === 0 ? 0 : step === 2 ? 1 : 0;
  rect(out, fx + 5, fy + legTop + bob, 2, mounted ? 3 : 6 - lead, DARK);
  rect(out, fx + 9, fy + legTop + bob, 2, mounted ? 3 : 5 + lead, DARK);
  // body
  const bodyTop = mounted ? 10 : 14;
  rect(out, fx + 4, fy + bodyTop + bob, 8, 10, bodyColor);
  rect(out, fx + 4, fy + bodyTop + 5 + bob, 8, 1, accentColor);
  // head
  const headY = bodyTop - 4;
  disc(out, fx + 8, fy + headY + bob, 4, SKIN);
  rect(out, fx + 4, fy + headY - 4 + bob, 8, 3, HAIR);
  if (facing === "up") rect(out, fx + 4, fy + headY - 4 + bob, 8, 7, HAIR);
  const eye = shade(DARK, 0.6);
  if (facing === "down") {
    setPixel(out, fx + 6, fy + headY + 1 + bob, eye);
    setPixel(out, fx + 9, fy + headY + 1 + bob, eye);
  } else if (facing === "left") {
    setPixel(out, fx + 5, fy + headY + 1 + bob, eye);
  } else if (facing === "right") {
    setPixel(out, fx + 10, fy + headY + 1 + bob, eye);
  }
  // headwear and gear
  switch (archetype) {
    case "general":
    case "court":
    case "dowager":
    case "chancellor":
      rect(out, fx + 4, fy + headY - 6 + bob, 8, 3, accentColor);
      break;
    case "scholar":
    case "clerk":
    case "minister":
    case "persuader":
    case "physician":
      rect(out, fx + 5, fy + headY - 6 + bob, 6, 3, rgba("#2c3e50"));
      break;
    case "envoy":
    case "eunuch":
    case "retainer":
      rect(out, fx + 5, fy + headY - 5 + bob, 6, 2, accentColor);
      break;
    case "mohist":
    case "assassin":
    case "spy":
    case "executioner":
      rect(out, fx + 4, fy + headY - 4 + bob, 8, 5, bodyColor);
      break;
    case "infantry":
      line(out, fx + 13, fy + 6 + bob, fx + 13, fy + 26 + bob, DARK);
      setPixel(out, fx + 13, fy + 5 + bob, rgba("#c0c0c0"));
      break;
    case "crossbowman":
      rect(out, fx + 11, fy + 16 + bob, 5, 1, DARK);
      rect(out, fx + 13, fy + 13 + bob, 1, 6, DARK);
      break;
    case "merchant":
    case "labourer":
      rect(out, fx + 11, fy + 17 + bob, 4, 5, rgba("#a67c52"));
      break;
    case "hostage":
      rect(out, fx + 2, fy + 21 + bob, 12, 1, rgba("#9aa0a6"));
      break;
    case "guard":
      // a helm and a shafted weapon held upright
      rect(out, fx + 4, fy + headY - 6 + bob, 8, 3, rgba("#c0c0c0"));
      line(out, fx + 13, fy + 4 + bob, fx + 13, fy + 26 + bob, DARK);
      break;
    case "herald":
    case "standard-bearer":
      // a staff with a pennant
      line(out, fx + 13, fy + 3 + bob, fx + 13, fy + 26 + bob, DARK);
      rect(out, fx + 9, fy + 4 + bob, 4, 5, accentColor);
      break;
    case "drummer":
      disc(out, fx + 12, fy + 19 + bob, 3.4, accentColor);
      rect(out, fx + 9, fy + 14 + bob, 1, 4, DARK);
      break;
    case "diviner":
      // a cracked shell held up
      disc(out, fx + 12, fy + 16 + bob, 3, rgba("#f2f0e8"));
      line(out, fx + 11, fy + 14 + bob, fx + 13, fy + 18 + bob, DARK);
      break;
    case "engineer":
      // a measuring rod across the body
      line(out, fx + 2, fy + 20 + bob, fx + 14, fy + 15 + bob, rgba("#a67c52"));
      break;
    default:
      break;
  }
};

const spriteSheet = (archetype: StageArchetype): Image => {
  const meta = spriteMeta();
  const out = blankImage(meta.frameWidth * meta.columns, meta.frameHeight * 4);
  FACINGS.forEach((facing, row) => {
    for (let step = 0; step < meta.columns; step += 1) {
      drawPerson(
        out,
        step * meta.frameWidth,
        row * meta.frameHeight,
        archetype,
        facing,
        step,
      );
    }
  });
  return out;
};

const EFFECT_FRAMES = 6;

const paintEffect = (
  out: Image,
  fx: number,
  frame: number,
  effect: StageEffect,
): void => {
  const t = frame / (EFFECT_FRAMES - 1);
  switch (effect) {
    case "fire": {
      const h = 6 + Math.round(4 * Math.abs(Math.sin(frame * 1.3)));
      triangle(
        out,
        [
          [fx + 3, 15],
          [fx + 13, 15],
          [fx + 8, 15 - h],
        ],
        rgba("#e25822"),
      );
      triangle(
        out,
        [
          [fx + 5, 15],
          [fx + 11, 15],
          [fx + 8, 15 - h + 3],
        ],
        rgba("#f5b942"),
      );
      break;
    }
    case "smoke": {
      const grey = rgba("#8a8a8a", Math.round(220 - 150 * t));
      disc(out, fx + 8, 13 - Math.round(9 * t), 3 + 2 * t, grey);
      disc(out, fx + 5, 14 - Math.round(6 * t), 2, grey);
      break;
    }
    case "dust": {
      const tan = rgba("#c9b58a", Math.round(230 - 150 * t));
      for (let i = 0; i < 5; i += 1) {
        disc(
          out,
          fx + 3 + i * 2.5,
          12 - Math.round((i % 3) * 2 * t),
          1.5 + t,
          tan,
        );
      }
      break;
    }
    case "arrows": {
      const shaft = rgba("#3a2a1a");
      for (let i = 0; i < 3; i += 1) {
        const x = fx + 2 + i * 4;
        const y = Math.round(t * 10) - 2 + i;
        line(out, x, y, x + 3, y + 4, shaft);
        setPixel(out, x + 3, y + 4, rgba("#c0c0c0"));
      }
      break;
    }
    case "splash": {
      ring(
        out,
        fx + 8,
        8,
        2 + 6 * t,
        rgba("#8fd3ff", Math.round(255 - 180 * t)),
      );
      break;
    }
    case "flood": {
      rect(
        out,
        fx,
        16 - Math.round(4 + 12 * t),
        16,
        Math.round(4 + 12 * t),
        rgba("#3d7bc4", 200),
      );
      break;
    }
    case "scroll": {
      const bob = frame % 2;
      rect(out, fx + 3, 5 + bob, 10, 7, rgba("#f3e7c9"));
      rect(out, fx + 3, 5 + bob, 10, 1, rgba("#a67c52"));
      rect(out, fx + 3, 11 + bob, 10, 1, rgba("#a67c52"));
      rect(out, fx + 9, 7 + bob, 2, 2, rgba("#b3261e"));
      break;
    }
    case "coin": {
      const w = Math.max(1, Math.round(6 * Math.abs(Math.cos(frame * 0.7))));
      rect(out, fx + 8 - Math.floor(w / 2), 5, w, 6, rgba("#e8c547"));
      break;
    }
    case "bar": {
      rect(out, fx + 3, 6 + (frame % 2), 10, 4, rgba("#c0c0c0"));
      rect(out, fx + 3, 6 + (frame % 2), 10, 1, rgba("#ececec"));
      break;
    }
    case "plate": {
      rect(out, fx + 4, 5 + (frame % 2), 8, 6, rgba("#b87333"));
      setPixel(out, fx + 8, 8 + (frame % 2), rgba("#3a2a1a"));
      break;
    }
    case "banner": {
      line(out, fx + 4, 2, fx + 4, 15, DARK);
      const wave = Math.round(2 * Math.sin(frame * 1.1));
      triangle(
        out,
        [
          [fx + 5, 3],
          [fx + 13 + wave, 6],
          [fx + 5, 9],
        ],
        rgba("#b3261e"),
      );
      break;
    }
    case "grey": {
      rect(out, fx + 1, 1, 14, 14, rgba("#6c6c6c", Math.round(60 + 120 * t)));
      break;
    }
    // the Annals: weather, light, and the things a scene is about
    case "night": {
      rect(out, fx, 0, 16, 16, rgba("#101a2c", Math.round(70 + 90 * t)));
      for (const [sx, sy] of [
        [3, 3],
        [9, 2],
        [13, 6],
        [6, 9],
      ] as const) {
        if ((sx + frame) % 3 !== 0) continue;
        setPixel(out, fx + sx, sy, rgba("#f3e7c9"));
      }
      break;
    }
    case "rain": {
      const drop = rgba("#8fb8e0", 210);
      for (let i = 0; i < 6; i += 1) {
        const x = fx + 1 + i * 2.6;
        const y = (i * 3 + frame * 3) % 16;
        line(out, Math.round(x), y, Math.round(x) - 1, y + 3, drop);
      }
      break;
    }
    case "snow": {
      const flake = rgba("#f2f0e8", 235);
      for (let i = 0; i < 7; i += 1) {
        const x = fx + 1 + ((i * 5 + frame) % 14);
        const y = (i * 2 + frame * 2) % 16;
        setPixel(out, x, y, flake);
      }
      break;
    }
    case "torch": {
      line(out, fx + 8, 15, fx + 8, 8, rgba("#6b4f31"));
      const h = 3 + Math.round(2 * Math.abs(Math.sin(frame * 1.5)));
      triangle(
        out,
        [
          [fx + 6, 8],
          [fx + 10, 8],
          [fx + 8, 8 - h],
        ],
        rgba("#f5b942"),
      );
      disc(out, fx + 8, 9, 4 + t, rgba("#f5b942", Math.round(70 - 40 * t)));
      break;
    }
    case "jade": {
      const green = rgba("#7fd1ae");
      ring(out, fx + 8, 8, 5, green);
      ring(out, fx + 8, 8, 2, green);
      ring(
        out,
        fx + 8,
        8,
        5 + 3 * t,
        rgba("#d5f5e3", Math.round(200 - 170 * t)),
      );
      break;
    }
    case "tally": {
      // two halves of a tiger tally closing on each other
      const gap = Math.round(4 * (1 - t));
      rect(out, fx + 2 - gap, 6, 6, 5, rgba("#b87333"));
      rect(out, fx + 8 + gap, 6, 6, 5, rgba("#b87333"));
      rect(out, fx + 2 - gap, 6, 6, 1, rgba("#d8a05a"));
      rect(out, fx + 8 + gap, 6, 6, 1, rgba("#d8a05a"));
      break;
    }
    case "bronze": {
      const body = rgba("#7b8b6f");
      rect(out, fx + 4, 6 + (frame % 2), 8, 6, body);
      rect(out, fx + 3, 5 + (frame % 2), 10, 2, shade(body, 1.2));
      rect(out, fx + 5, 12 + (frame % 2), 1, 3, shade(body, 0.7));
      rect(out, fx + 10, 12 + (frame % 2), 1, 3, shade(body, 0.7));
      break;
    }
    case "bell": {
      const body = rgba("#a9946f");
      const sway = Math.round(1.5 * Math.sin(frame * 1.2));
      rect(out, fx + 5 + sway, 4, 6, 8, body);
      rect(out, fx + 4 + sway, 12, 8, 2, shade(body, 0.8));
      ring(
        out,
        fx + 8,
        9,
        5 + 4 * t,
        rgba("#e8c547", Math.round(160 - 140 * t)),
      );
      break;
    }
    case "stele": {
      const stoneColor = rgba("#8c8c88");
      const rise = Math.round(6 * (1 - t));
      rect(out, fx + 6, 4 + rise, 4, 11, stoneColor);
      rect(out, fx + 6, 4 + rise, 4, 1, shade(stoneColor, 1.25));
      rect(out, fx + 4, 14, 8, 2, shade(stoneColor, 0.8));
      break;
    }
    case "oxen-fire": {
      const horse = rgba("#8d6748");
      const x = fx + 1 + Math.round(4 * t);
      rect(out, x, 8, 9, 5, horse);
      rect(out, x + 8, 6, 2, 3, rgba("#f2f0e8"));
      const h = 3 + Math.round(3 * Math.abs(Math.sin(frame * 1.4)));
      triangle(
        out,
        [
          [x - 1, 12],
          [x + 2, 12],
          [x, 12 - h],
        ],
        rgba("#e25822"),
      );
      break;
    }
    default:
      break;
  }
};

const effectSheet = (effect: StageEffect): Image => {
  const out = blankImage(TILE * EFFECT_FRAMES, TILE);
  for (let frame = 0; frame < EFFECT_FRAMES; frame += 1) {
    paintEffect(out, frame * TILE, frame, effect);
  }
  return out;
};

const marker = (kind: Marker): Image => {
  const wall = rgba("#4a4a4a");
  const roof = rgba("#8b1e1e");
  const wood = rgba("#8b5a2b");
  const stone = rgba("#8c8c88");
  switch (kind) {
    case "court": {
      const out = blankImage(32, 32);
      rect(out, 2, 6, 28, 24, rgba("#d9c39a"));
      rect(out, 2, 6, 28, 2, wall);
      rect(out, 2, 28, 28, 2, wall);
      rect(out, 2, 6, 2, 24, wall);
      rect(out, 28, 6, 2, 24, wall);
      rect(out, 13, 26, 6, 4, roof);
      rect(out, 9, 12, 14, 8, roof);
      rect(out, 11, 20, 10, 5, rgba("#f3e7c9"));
      triangle(
        out,
        [
          [7, 12],
          [25, 12],
          [16, 6],
        ],
        shade(roof, 0.8),
      );
      return out;
    }
    case "town": {
      const out = blankImage(16, 16);
      rect(out, 3, 8, 10, 7, rgba("#d9c39a"));
      triangle(
        out,
        [
          [1, 8],
          [15, 8],
          [8, 2],
        ],
        roof,
      );
      rect(out, 7, 11, 2, 4, wood);
      return out;
    }
    case "hall": {
      const out = blankImage(16, 16);
      rect(out, 2, 7, 12, 8, rgba("#f3e7c9"));
      rect(out, 1, 5, 14, 3, wall);
      rect(out, 4, 9, 2, 3, wall);
      rect(out, 10, 9, 2, 3, wall);
      return out;
    }
    case "pass": {
      const out = blankImage(32, 16);
      triangle(
        out,
        [
          [0, 15],
          [13, 15],
          [6, 2],
        ],
        stone,
      );
      triangle(
        out,
        [
          [19, 15],
          [32, 15],
          [25, 2],
        ],
        stone,
      );
      rect(out, 13, 12, 6, 3, rgba("#8a6a45"));
      return out;
    }
    case "ford": {
      const out = blankImage(16, 16);
      for (let i = 0; i < 4; i += 1)
        disc(out, 3 + i * 3.3, 8 + (i % 2) * 3, 1.5, stone);
      return out;
    }
    case "field": {
      const out = blankImage(16, 16);
      for (let y = 2; y < 15; y += 3) rect(out, 1, y, 14, 1, rgba("#7a8c34"));
      return out;
    }
    case "works": {
      const out = blankImage(16, 16);
      rect(out, 2, 5, 12, 7, stone);
      rect(out, 2, 5, 12, 1, shade(stone, 1.2));
      rect(out, 0, 6, 2, 5, rgba("#3d7bc4"));
      rect(out, 14, 6, 2, 5, rgba("#3d7bc4"));
      return out;
    }
    case "harbour": {
      const out = blankImage(16, 16);
      rect(out, 6, 2, 4, 12, wood);
      rect(out, 4, 6, 8, 1, wood);
      rect(out, 4, 10, 8, 1, wood);
      return out;
    }
    case "camp": {
      const out = blankImage(16, 16);
      triangle(
        out,
        [
          [2, 14],
          [14, 14],
          [8, 4],
        ],
        rgba("#d9c39a"),
      );
      line(out, 8, 4, 8, 14, wood);
      line(out, 11, 1, 11, 6, DARK);
      triangle(
        out,
        [
          [12, 1],
          [15, 2],
          [12, 4],
        ],
        roof,
      );
      return out;
    }
    case "saltern": {
      const out = blankImage(16, 16);
      rect(out, 1, 8, 6, 5, wood);
      rect(out, 2, 9, 4, 3, rgba("#f2f0e8"));
      rect(out, 9, 8, 6, 5, wood);
      rect(out, 10, 9, 4, 3, rgba("#f2f0e8"));
      disc(out, 8, 5, 2.5, rgba("#f2f0e8"));
      return out;
    }
    case "market": {
      const out = blankImage(16, 16);
      rect(out, 1, 6, 6, 3, rgba("#d9c39a"));
      rect(out, 1, 9, 1, 5, wood);
      rect(out, 6, 9, 1, 5, wood);
      line(out, 8, 4, 14, 4, wood);
      line(out, 11, 4, 11, 9, wood);
      rect(out, 8, 5, 2, 2, rgba("#e8c547"));
      rect(out, 13, 5, 2, 2, rgba("#e8c547"));
      return out;
    }
    case "academy": {
      const out = blankImage(16, 16);
      rect(out, 2, 7, 12, 8, rgba("#f3e7c9"));
      rect(out, 1, 5, 14, 3, wall);
      rect(out, 4, 9, 2, 3, wall);
      rect(out, 10, 9, 2, 3, wall);
      rect(out, 7, 1, 2, 5, stone);
      return out;
    }
    case "altar": {
      const out = blankImage(16, 16);
      rect(out, 1, 12, 14, 3, rgba("#d9c39a"));
      rect(out, 3, 9, 10, 3, shade(rgba("#d9c39a"), 0.9));
      rect(out, 5, 6, 6, 3, shade(rgba("#d9c39a"), 0.8));
      rect(out, 6, 3, 4, 3, rgba("#6b5a35"));
      rect(out, 6, 6, 1, 2, rgba("#6b5a35"));
      rect(out, 9, 6, 1, 2, rgba("#6b5a35"));
      return out;
    }
    case "weir": {
      const out = blankImage(16, 16);
      rect(out, 0, 6, 16, 5, rgba("#3d7bc4"));
      rect(out, 0, 4, 16, 2, rgba("#d9c39a"));
      rect(out, 0, 11, 16, 2, rgba("#d9c39a"));
      for (let x = 2; x < 16; x += 3) rect(out, x, 5, 1, 7, wood);
      rect(out, 7, 4, 2, 9, shade(wood, 1.2));
      return out;
    }
    // the Annals: what a scripted history puts on the country
    case "canal": {
      const out = blankImage(16, 16);
      rect(out, 0, 5, 16, 6, rgba("#d9c39a"));
      rect(out, 0, 6, 16, 4, rgba("#3d7bc4"));
      rect(out, 0, 6, 16, 1, rgba("#8fd3ff"));
      for (let x = 1; x < 16; x += 4) rect(out, x, 11, 1, 2, shade(wood, 0.8));
      return out;
    }
    case "dike": {
      const out = blankImage(16, 16);
      rect(out, 0, 9, 16, 5, rgba("#3d7bc4"));
      rect(out, 0, 5, 16, 4, rgba("#c9a86a"));
      rect(out, 0, 5, 16, 1, rgba("#e0c9a6"));
      for (let x = 2; x < 16; x += 5) rect(out, x, 3, 2, 2, rgba("#7a8c34"));
      return out;
    }
    case "tomb": {
      const out = blankImage(16, 16);
      disc(out, 8, 13, 7, shade(rgba("#c9a86a"), 0.85));
      disc(out, 8, 10, 5.5, rgba("#c9a86a"));
      rect(out, 7, 3, 2, 5, stone);
      rect(out, 6, 3, 4, 1, shade(stone, 1.2));
      return out;
    }
    case "wall": {
      const out = blankImage(32, 16);
      rect(out, 0, 7, 32, 6, rgba("#a09880"));
      rect(out, 0, 7, 32, 1, shade(rgba("#a09880"), 1.25));
      for (let x = 0; x < 32; x += 6) rect(out, x, 4, 4, 3, rgba("#a09880"));
      rect(out, 14, 2, 5, 11, shade(rgba("#a09880"), 0.85));
      return out;
    }
    case "foundry": {
      const out = blankImage(16, 16);
      rect(out, 2, 7, 12, 8, rgba("#5a5a5a"));
      rect(out, 5, 3, 4, 4, rgba("#4a4a4a"));
      rect(out, 5, 1, 4, 2, rgba("#8a8a8a"));
      rect(out, 5, 10, 6, 3, rgba("#e25822"));
      return out;
    }
    case "mint": {
      const out = blankImage(16, 16);
      rect(out, 2, 6, 12, 9, rgba("#d9c39a"));
      rect(out, 1, 4, 14, 3, wall);
      disc(out, 8, 10, 3.4, rgba("#e8c547"));
      rect(out, 7, 9, 2, 2, rgba("#d9c39a"));
      return out;
    }
    case "bridge": {
      const out = blankImage(32, 16);
      rect(out, 0, 8, 32, 4, rgba("#3d7bc4"));
      rect(out, 2, 5, 28, 3, wood);
      rect(out, 2, 5, 28, 1, shade(wood, 1.25));
      for (const x of [6, 15, 24]) rect(out, x, 8, 2, 5, shade(wood, 0.7));
      return out;
    }
    case "ferry": {
      const out = blankImage(16, 16);
      rect(out, 0, 8, 16, 5, rgba("#3d7bc4"));
      rect(out, 3, 7, 10, 4, wood);
      rect(out, 4, 11, 8, 1, shade(wood, 0.7));
      line(out, 8, 1, 8, 7, shade(wood, 0.8));
      return out;
    }
    case "waystation": {
      const out = blankImage(16, 16);
      rect(out, 3, 8, 10, 6, rgba("#d9c39a"));
      triangle(
        out,
        [
          [1, 8],
          [15, 8],
          [8, 3],
        ],
        shade(wood, 0.8),
      );
      rect(out, 7, 11, 2, 3, wood);
      rect(out, 13, 2, 1, 6, DARK);
      return out;
    }
    case "beacon-tower": {
      const out = blankImage(16, 32);
      rect(out, 4, 12, 8, 19, rgba("#a09880"));
      rect(out, 3, 8, 10, 5, shade(rgba("#a09880"), 1.1));
      rect(out, 5, 4, 6, 4, wood);
      triangle(
        out,
        [
          [5, 4],
          [11, 4],
          [8, 0],
        ],
        rgba("#e25822"),
      );
      return out;
    }
    case "ruin": {
      const out = blankImage(16, 16);
      rect(out, 2, 9, 4, 6, shade(rgba("#d9c39a"), 0.8));
      rect(out, 8, 11, 3, 4, shade(rgba("#d9c39a"), 0.7));
      rect(out, 12, 8, 2, 7, shade(rgba("#d9c39a"), 0.8));
      for (const [rx, ry] of [
        [6, 14],
        [11, 15],
        [3, 15],
      ] as const)
        setPixel(out, rx, ry, stone);
      return out;
    }
    case "shrine": {
      const out = blankImage(16, 16);
      rect(out, 4, 8, 8, 7, rgba("#f3e7c9"));
      rect(out, 2, 6, 12, 3, roof);
      rect(out, 7, 11, 2, 4, wood);
      rect(out, 6, 2, 4, 4, shade(roof, 0.8));
      return out;
    }
    default:
      return blankImage(16, 16);
  }
};

const decor = (kind: Decor): Image => {
  const wood = rgba("#8b5a2b");
  const stone = rgba("#8c8c88");
  const earth = rgba("#c9a86a");
  const green = rgba("#2f6b2f");
  switch (kind) {
    case "pine": {
      const out = blankImage(32, 32);
      for (const [cx, cy] of [
        [9, 18],
        [20, 14],
        [24, 24],
      ] as const) {
        rect(out, cx - 1, cy, 2, 6, wood);
        triangle(
          out,
          [
            [cx - 6, cy + 1],
            [cx + 6, cy + 1],
            [cx, cy - 9],
          ],
          green,
        );
      }
      return out;
    }
    case "bamboo": {
      const out = blankImage(32, 32);
      const stalk = rgba("#7fae3c");
      for (let i = 0; i < 5; i += 1) {
        const x = 8 + i * 4;
        line(out, x, 28, x + (i % 2 ? 2 : -1), 8, stalk);
        line(out, x, 12 + i, x + 4, 9 + i, shade(stalk, 1.2));
      }
      return out;
    }
    case "beacon": {
      const out = blankImage(32, 48);
      rect(out, 10, 16, 12, 28, earth);
      rect(out, 10, 16, 12, 2, shade(earth, 0.8));
      rect(out, 8, 10, 16, 6, shade(earth, 1.1));
      rect(out, 12, 4, 8, 6, wood);
      return out;
    }
    case "tumulus": {
      const out = blankImage(40, 32);
      disc(out, 20, 30, 15, shade(earth, 0.9));
      disc(out, 20, 24, 12, earth);
      disc(out, 18, 20, 7, shade(earth, 1.1));
      rect(out, 32, 26, 3, 5, stone);
      return out;
    }
    case "stele": {
      const out = blankImage(32, 32);
      disc(out, 16, 27, 6, shade(earth, 0.9));
      rect(out, 13, 6, 6, 21, stone);
      rect(out, 13, 6, 6, 2, shade(stone, 1.2));
      line(out, 16, 10, 16, 22, shade(stone, 0.7));
      return out;
    }
    case "boat": {
      const out = blankImage(32, 32);
      rect(out, 6, 18, 20, 6, wood);
      rect(out, 8, 24, 16, 2, shade(wood, 0.7));
      line(out, 16, 6, 16, 18, shade(wood, 0.8));
      return out;
    }
    case "horses": {
      const out = blankImage(40, 32);
      const horse = rgba("#5b3a1e");
      for (const [hx, hy] of [
        [8, 14],
        [22, 10],
        [28, 20],
      ] as const) {
        rect(out, hx, hy, 10, 5, horse);
        rect(out, hx + 8, hy - 3, 3, 4, horse);
        rect(out, hx + 1, hy + 5, 1, 3, shade(horse, 0.7));
        rect(out, hx + 8, hy + 5, 1, 3, shade(horse, 0.7));
      }
      return out;
    }
    case "grove": {
      const out = blankImage(40, 32);
      for (const [gx, gy] of [
        [8, 12],
        [20, 10],
        [32, 12],
        [14, 22],
        [26, 24],
      ] as const) {
        rect(out, gx, gy + 4, 2, 4, wood);
        disc(out, gx + 1, gy, 4.5, shade(green, 1.3));
      }
      return out;
    }
    case "rocks": {
      const out = blankImage(32, 32);
      disc(out, 12, 20, 7, stone);
      disc(out, 22, 24, 5, shade(stone, 0.85));
      disc(out, 20, 14, 4, shade(stone, 1.1));
      return out;
    }
    default:
      return blankImage(16, 16);
  }
};

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../public/stage/fallback");
mkdirSync(out, { recursive: true });

const assets: Record<string, AssetEntry> = {};
const emitImage = (
  id: string,
  image: Image,
  entry: Omit<AssetEntry, "file" | "width" | "height" | "pack">,
): void => {
  const file = `${id}.png`;
  writeFileSync(join(out, file), encodePng(image));
  assets[id] = {
    file,
    width: image.width,
    height: image.height,
    pack: "fallback",
    ...entry,
  };
};

for (const terrain of TERRAINS) {
  const colors = TERRAIN_COLORS[terrain];
  const id = `terrain.${terrain}`;
  const sheet = blobSheet([
    {
      fill: rgba(colors.fill),
      rim: rgba(colors.rim),
      dots: colors.dots ? rgba(colors.dots) : undefined,
    },
  ]);
  // the ground layer picks a variant per cell, so grass carries the stack
  const blocks = blocksOf(terrain);
  const image = blocks > 1 ? variantSheet(sheet, blocks) : sheet;
  const tileset = `${id}.tsj`;
  writeFileSync(
    join(out, tileset),
    JSON.stringify(
      blobTileset({ name: id, image: `${id}.png`, blocks }),
      null,
      2,
    ),
  );
  emitImage(id, image, { kind: "blob", tileset });
}
for (const water of WATERS) {
  const id = `water.${water}`;
  const frames = WATER_COLORS[water].map((hex, wave) => ({
    fill: rgba(hex),
    rim: shade(rgba(hex), 0.75),
    wave,
  }));
  const tileset = `${id}.tsj`;
  writeFileSync(
    join(out, tileset),
    JSON.stringify(
      blobTileset({
        name: id,
        image: `${id}.png`,
        blocks: frames.length,
        frames: frames.length,
      }),
      null,
      2,
    ),
  );
  emitImage(id, blobSheet(frames), {
    kind: "water",
    frames: frames.length,
    tileset,
  });
}
for (const archetype of ARCHETYPES) {
  emitImage(`sprite.${archetype}`, spriteSheet(archetype), {
    kind: "sprite",
    sprite: spriteMeta(),
  });
}
for (const effect of EFFECTS) {
  emitImage(`effect.${effect}`, effectSheet(effect), {
    kind: "effect",
    frames: EFFECT_FRAMES,
    frame: { width: TILE, height: TILE },
  });
}
for (const kind of MARKERS) {
  emitImage(`image.${kind}`, marker(kind), { kind: "image" });
}
for (const kind of DECOR) {
  emitImage(`decor.${kind}`, decor(kind), { kind: "image" });
}

const manifest: VendorManifest = { version: 1, source: "fallback", assets };
writeFileSync(join(out, "fallback.json"), JSON.stringify(manifest, null, 2));
console.log(`stage fallback: ${Object.keys(assets).length} assets → ${out}`);
