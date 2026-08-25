import { setPixel, type Image, type Rgba } from "../vendor/png";

export const rgba = (hex: string, alpha = 255): Rgba => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  alpha,
];

export const shade = (color: Rgba, factor: number): Rgba => [
  Math.max(0, Math.min(255, Math.round(color[0] * factor))),
  Math.max(0, Math.min(255, Math.round(color[1] * factor))),
  Math.max(0, Math.min(255, Math.round(color[2] * factor))),
  color[3],
];

export const rect = (
  image: Image,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgba,
): void => {
  for (let j = y; j < y + height; j += 1) {
    for (let i = x; i < x + width; i += 1) setPixel(image, i, j, color);
  }
};

export const disc = (
  image: Image,
  cx: number,
  cy: number,
  radius: number,
  color: Rgba,
): void => {
  for (let j = Math.floor(cy - radius); j <= Math.ceil(cy + radius); j += 1) {
    for (let i = Math.floor(cx - radius); i <= Math.ceil(cx + radius); i += 1) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      if (dx * dx + dy * dy <= radius * radius) setPixel(image, i, j, color);
    }
  }
};

export const ring = (
  image: Image,
  cx: number,
  cy: number,
  radius: number,
  color: Rgba,
): void => {
  for (
    let j = Math.floor(cy - radius) - 1;
    j <= Math.ceil(cy + radius) + 1;
    j += 1
  ) {
    for (
      let i = Math.floor(cx - radius) - 1;
      i <= Math.ceil(cx + radius) + 1;
      i += 1
    ) {
      const dx = i + 0.5 - cx;
      const dy = j + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(d - radius) <= 0.75) setPixel(image, i, j, color);
    }
  }
};

export const line = (
  image: Image,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgba,
): void => {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    setPixel(image, x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

/** A filled triangle by scanline (vertices in pixel coordinates). */
export const triangle = (
  image: Image,
  points: [number, number][],
  color: Rgba,
): void => {
  const [a, b, c] = points;
  const minY = Math.min(a[1], b[1], c[1]);
  const maxY = Math.max(a[1], b[1], c[1]);
  const minX = Math.min(a[0], b[0], c[0]);
  const maxX = Math.max(a[0], b[0], c[0]);
  const edge = (
    p: [number, number],
    q: [number, number],
    x: number,
    y: number,
  ): number => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const e0 = edge(a, b, px, py);
      const e1 = edge(b, c, px, py);
      const e2 = edge(c, a, px, py);
      if ((e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0)) {
        setPixel(image, x, y, color);
      }
    }
  }
};
