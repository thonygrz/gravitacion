import { positionAt, trailPoints, type Trajectory } from "@/lib/orbits/trajectory";
import { fitViewBox, toScreenX, toScreenY, type Rect } from "@/lib/plot/viewport";
import { bodyColor } from "../orbit-colors";

export interface CanvasSize {
  /** CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Device pixels per CSS pixel. */
  readonly ratio: number;
}

export interface Frame {
  readonly trajectory: Trajectory;
  /** The same view box as the SVG underneath, so both line up. */
  readonly viewBox: Rect;
  readonly size: CanvasSize;
  readonly time: number;
  /** Simulated time each trail covers, or null for no trails. */
  readonly trailDuration: number | null;
}

// Each trail fades in this many stretches, from transparent at the tail to opaque at the body.
const TRAIL_STRETCHES = 24;

export function drawFrame(context: CanvasRenderingContext2D, frame: Frame, trailBuffer: Float64Array) {
  const { trajectory, viewBox, size, time, trailDuration } = frame;
  context.setTransform(size.ratio, 0, 0, size.ratio, 0, 0);
  context.clearRect(0, 0, size.width, size.height);
  const transform = fitViewBox(viewBox, size.width, size.height);
  const screenX = (i: number) => toScreenX(transform, trailBuffer[2 * i]);
  const screenY = (i: number) => toScreenY(transform, trailBuffer[2 * i + 1]);

  if (trailDuration !== null) {
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    trajectory.positions.forEach((_, body) => {
      const last = trailPoints(trajectory, body, time, trailDuration, trailBuffer) - 1;
      context.strokeStyle = bodyColor(body);
      for (let stretch = 0; stretch < TRAIL_STRETCHES; stretch++) {
        const from = Math.floor((stretch * last) / TRAIL_STRETCHES);
        const to = Math.floor(((stretch + 1) * last) / TRAIL_STRETCHES);
        if (to <= from) continue;
        context.globalAlpha = ((stretch + 1) / TRAIL_STRETCHES) ** 2;
        context.beginPath();
        context.moveTo(screenX(from), screenY(from));
        for (let i = from + 1; i <= to; i++) context.lineTo(screenX(i), screenY(i));
        context.stroke();
      }
    });
  }

  const radius = Math.max(4, Math.min(7, Math.min(size.width, size.height) * 0.012));
  trajectory.positions.forEach((_, body) => {
    const { x, y } = positionAt(trajectory, body, time);
    const cx = toScreenX(transform, x);
    const cy = toScreenY(transform, y);
    context.fillStyle = bodyColor(body);
    context.globalAlpha = 0.22;
    context.beginPath();
    context.arc(cx, cy, radius * 2.4, 0, 2 * Math.PI);
    context.fill();
    context.globalAlpha = 1;
    context.beginPath();
    context.arc(cx, cy, radius, 0, 2 * Math.PI);
    context.fill();
  });
}
