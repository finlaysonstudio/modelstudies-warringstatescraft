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
  EFFECTS,
  MARKERS,
  TERRAINS,
  WATERS,
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
import { disc, line, rect, rgba, ring, shade, triangle } from "./draw";

const TILE = 16;
const CLEAR: Rgba = [0, 0, 0, 0];

const TERRAIN_COLORS: Record<
  Terrain,
  { fill: string; rim: string; dots?: string }
> = {
  grass: { fill: "#5f8f3f", rim: "#5f8f3f", dots: "#578538" },
  loess: { fill: "#c9a86a", rim: "#a3844c" },
  road: { fill: "#8a6a45", rim: "#6b4f31" },
  cobble: { fill: "#8c8c88", rim: "#63635f", dots: "#7a7a76" },
  forest: { fill: "#2f6b2f", rim: "#1f4a1f", dots: "#255a25" },
  mountain: { fill: "#7d7468", rim: "#4e463d", dots: "#6a6257" },
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
  const mounted = archetype === "cavalry" || archetype === "chariot";
  if (mounted) {
    // a mount beneath the rider
    rect(
      out,
      fx + 1,
      fy + 21 + bob,
      14,
      6,
      archetype === "cavalry" ? HORSE : bodyColor,
    );
    rect(out, fx + 2, fy + 27, 2, 4, DARK);
    rect(out, fx + 12, fy + 27, 2, 4, DARK);
    if (archetype === "chariot") {
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
      rect(out, fx + 4, fy + headY - 6 + bob, 8, 3, accentColor);
      break;
    case "scholar":
    case "clerk":
      rect(out, fx + 5, fy + headY - 6 + bob, 6, 3, rgba("#2c3e50"));
      break;
    case "envoy":
      rect(out, fx + 5, fy + headY - 5 + bob, 6, 2, accentColor);
      break;
    case "mohist":
    case "assassin":
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
  const image = blobSheet([
    {
      fill: rgba(colors.fill),
      rim: rgba(colors.rim),
      dots: colors.dots ? rgba(colors.dots) : undefined,
    },
  ]);
  const tileset = `${id}.tsj`;
  writeFileSync(
    join(out, tileset),
    JSON.stringify(blobTileset({ name: id, image: `${id}.png` }), null, 2),
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
      blobTileset({ name: id, image: `${id}.png`, frames: frames.length }),
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

const manifest: VendorManifest = { version: 1, source: "fallback", assets };
writeFileSync(join(out, "fallback.json"), JSON.stringify(manifest, null, 2));
console.log(`stage fallback: ${Object.keys(assets).length} assets → ${out}`);
