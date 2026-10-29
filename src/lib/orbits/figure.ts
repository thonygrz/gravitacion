import { pathData, simplifyPolyline } from "../plot/polyline";
import { boundsOf, viewBoxAround, type Rect } from "../plot/viewport";
import type { Trajectory } from "./trajectory";

/** Static drawing of an orbit: the view box around it and one SVG path per body. */
export interface OrbitFigure {
  readonly viewBox: Rect;
  readonly paths: readonly string[];
  /** Where each body starts, in the SVG coordinates of the view box (y pointing down). */
  readonly starts: readonly { readonly x: number; readonly y: number }[];
}

// Margin around the orbit, as a fraction of its larger side.
const MARGIN = 0.06;
// Simplification tolerance as a fraction of the view box width: under half a pixel
// even on a 1000-pixel-wide canvas.
const TOLERANCE = 1 / 2000;
// Thousandths of a unit are well below a pixel at any size the app draws.
const DECIMALS = 3;

export function orbitFigure(trajectory: Trajectory): OrbitFigure {
  const viewBox = viewBoxAround(boundsOf(trajectory.positions), MARGIN);
  const tolerance = viewBox.width * TOLERANCE;
  return {
    viewBox,
    paths: trajectory.positions.map((points) =>
      pathData(simplifyPolyline(points, tolerance), DECIMALS),
    ),
    starts: trajectory.positions.map((points) => ({ x: points[0], y: -points[1] })),
  };
}
