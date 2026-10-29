/** Axis-aligned bounds in world coordinates, where y points up. */
export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** Rectangle in SVG coordinates, where y points down. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Scale and offsets that take world coordinates to pixels. */
export interface Transform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/** Bounds of every point of the given flat [x0, y0, x1, y1, ...] polylines. */
export function boundsOf(polylines: readonly ArrayLike<number>[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const points of polylines) {
    for (let i = 0; i < points.length; i += 2) {
      minX = Math.min(minX, points[i]);
      maxX = Math.max(maxX, points[i]);
      minY = Math.min(minY, points[i + 1]);
      maxY = Math.max(maxY, points[i + 1]);
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * SVG view box around the bounds, flipped so that world y points up on screen, with a
 * margin of `margin` times the larger side on every edge.
 */
export function viewBoxAround(bounds: Bounds, margin: number): Rect {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const pad = margin * Math.max(width, height);
  return {
    x: bounds.minX - pad,
    y: -bounds.maxY - pad,
    width: width + 2 * pad,
    height: height + 2 * pad,
  };
}

/**
 * Fits the view box into a `width` × `height` area the way SVG's default
 * `preserveAspectRatio` ("xMidYMid meet") does, so a canvas drawn with it lines up
 * with an SVG that uses the same view box.
 */
export function fitViewBox(viewBox: Rect, width: number, height: number): Transform {
  const scale = Math.min(width / viewBox.width, height / viewBox.height);
  return {
    scale,
    offsetX: (width - viewBox.width * scale) / 2 - viewBox.x * scale,
    offsetY: (height - viewBox.height * scale) / 2 - viewBox.y * scale,
  };
}

export const toScreenX = ({ scale, offsetX }: Transform, x: number): number => offsetX + x * scale;

// World y points up and screen y points down, hence the sign.
export const toScreenY = ({ scale, offsetY }: Transform, y: number): number => offsetY - y * scale;
