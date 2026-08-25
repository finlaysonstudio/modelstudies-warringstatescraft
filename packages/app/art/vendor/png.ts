import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

/** An RGBA raster, four bytes per pixel, row major. */
export interface Image {
  width: number;
  height: number;
  data: Uint8Array;
}

export type Rgba = [number, number, number, number];

export const blankImage = (width: number, height: number): Image => ({
  width,
  height,
  data: new Uint8Array(width * height * 4),
});

export const decodePng = (bytes: Uint8Array): Image => {
  const png = PNG.sync.read(Buffer.from(bytes));
  return {
    width: png.width,
    height: png.height,
    data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length),
  };
};

export const encodePng = (image: Image): Uint8Array => {
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data);
  return new Uint8Array(PNG.sync.write(png));
};

export const readPng = (path: string): Image => decodePng(readFileSync(path));

export const writePng = (path: string, image: Image): void => {
  writeFileSync(path, encodePng(image));
};

const offset = (image: Image, x: number, y: number): number =>
  (y * image.width + x) * 4;

export const pixelAt = (image: Image, x: number, y: number): Rgba => {
  const at = offset(image, x, y);
  return [
    image.data[at],
    image.data[at + 1],
    image.data[at + 2],
    image.data[at + 3],
  ];
};

export const setPixel = (
  image: Image,
  x: number,
  y: number,
  color: Rgba,
): void => {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const at = offset(image, x, y);
  image.data[at] = color[0];
  image.data[at + 1] = color[1];
  image.data[at + 2] = color[2];
  image.data[at + 3] = color[3];
};

export const samePixel = (
  a: Image,
  ax: number,
  ay: number,
  b: Image,
  bx: number,
  by: number,
): boolean => {
  const oa = offset(a, ax, ay);
  const ob = offset(b, bx, by);
  for (let i = 0; i < 4; i += 1) {
    if (a.data[oa + i] !== b.data[ob + i]) return false;
  }
  return true;
};

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CopyRect {
  source: Image;
  sx: number;
  sy: number;
  width: number;
  height: number;
  target: Image;
  tx: number;
  ty: number;
}

/** Copies a rectangle byte for byte (no blending). */
export const copyRect = ({
  source,
  sx,
  sy,
  width,
  height,
  target,
  tx,
  ty,
}: CopyRect): void => {
  for (let y = 0; y < height; y += 1) {
    const from = offset(source, sx, sy + y);
    const to = offset(target, tx, ty + y);
    target.data.set(source.data.subarray(from, from + width * 4), to);
  }
};

/** Draws source over target with source-over alpha (opaque pixels replace). */
export const blit = ({
  source,
  sx,
  sy,
  width,
  height,
  target,
  tx,
  ty,
}: CopyRect): void => {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixelAt(source, sx + x, sy + y);
      if (a === 0) continue;
      if (a === 255) {
        setPixel(target, tx + x, ty + y, [r, g, b, a]);
        continue;
      }
      const [tr, tg, tb, ta] = pixelAt(target, tx + x, ty + y);
      const alpha = a / 255;
      const back = (ta / 255) * (1 - alpha);
      const out = alpha + back;
      const mix = (s: number, t: number): number =>
        out === 0 ? 0 : Math.round((s * alpha + t * back) / out);
      setPixel(target, tx + x, ty + y, [
        mix(r, tr),
        mix(g, tg),
        mix(b, tb),
        Math.round(out * 255),
      ]);
    }
  }
};

export const cropImage = (image: Image, rect: Rect): Image => {
  const out = blankImage(rect.width, rect.height);
  copyRect({
    source: image,
    sx: rect.x,
    sy: rect.y,
    width: rect.width,
    height: rect.height,
    target: out,
    tx: 0,
    ty: 0,
  });
  return out;
};

export const fillRect = (image: Image, rect: Rect, color: Rgba): void => {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      setPixel(image, x, y, color);
    }
  }
};

export const isBlank = (image: Image): boolean => {
  for (let i = 3; i < image.data.length; i += 4) {
    if (image.data[i] !== 0) return false;
  }
  return true;
};
