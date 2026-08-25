import { BadRequestError } from "@jaypie/errors";

import { cropImage, type Image } from "./png";

export interface CellSpec {
  width: number;
  height: number;
}

/** Cuts a sheet into equal cells, row major. */
export const sliceGrid = (sheet: Image, cell: CellSpec): Image[] => {
  if (sheet.width % cell.width !== 0 || sheet.height % cell.height !== 0) {
    throw new BadRequestError(
      `a ${sheet.width}×${sheet.height} sheet does not divide into ${cell.width}×${cell.height} cells`,
    );
  }
  const columns = sheet.width / cell.width;
  const rows = sheet.height / cell.height;
  const cells: Image[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push(
        cropImage(sheet, {
          x: column * cell.width,
          y: row * cell.height,
          width: cell.width,
          height: cell.height,
        }),
      );
    }
  }
  return cells;
};

export type Facing = "down" | "left" | "right" | "up";

export const FACINGS: readonly Facing[] = ["down", "left", "right", "up"];

/** A walking sprite sheet: frames in rows per facing, RPG Maker order. */
export interface SpriteMeta {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  walk: Record<Facing, number[]>;
}

export interface SpriteMetaOptions {
  frameWidth?: number;
  frameHeight?: number;
  columns?: number;
}

export const spriteMeta = ({
  frameWidth = 16,
  frameHeight = 32,
  columns = 3,
}: SpriteMetaOptions = {}): SpriteMeta => ({
  frameWidth,
  frameHeight,
  columns,
  walk: Object.fromEntries(
    FACINGS.map((facing, row) => [
      facing,
      Array.from({ length: columns }, (_, i) => row * columns + i),
    ]),
  ) as Record<Facing, number[]>,
});
