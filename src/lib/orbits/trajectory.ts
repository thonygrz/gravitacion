import type { Body } from "../physics/body";
import { simulateAdaptive } from "../physics/dormand-prince";
import { vec2, type Vec2 } from "../physics/vector";

/**
 * Samples per period for drawing and animating. In the close encounters of Butterfly I,
 * Goggles and Yin-Yang I, two consecutive samples are up to 14 px apart on an 800 px
 * canvas with 2000 samples and about 6 px with 6000 (measured on 28/10/2026), which
 * cost 70 to 100 ms per orbit on a desktop.
 */
export const TRAJECTORY_INTERVALS = 6000;

/** One period of a periodic orbit, sampled at evenly spaced times. */
export interface Trajectory {
  readonly period: number;
  /** Equal time intervals in the period: each body has `intervals + 1` positions, the last one closing the loop. */
  readonly intervals: number;
  /** Positions of each body, flattened as [x0, y0, x1, y1, ...]. */
  readonly positions: readonly Float64Array[];
}

export function computeTrajectory(
  initialBodies: readonly Body[],
  period: number,
  intervals: number,
): Trajectory {
  const samples = simulateAdaptive(initialBodies, { duration: period, samples: intervals });
  const positions = initialBodies.map((_, body) => {
    const flat = new Float64Array(2 * samples.length);
    samples.forEach(({ bodies }, i) => {
      flat[2 * i] = bodies[body].position.x;
      flat[2 * i + 1] = bodies[body].position.y;
    });
    return flat;
  });
  return { period, intervals, positions };
}

// Fractional sample index of `time`, wrapped into the period.
function indexAt({ period, intervals }: Trajectory, time: number): number {
  const wrapped = ((time % period) + period) % period;
  return (wrapped / period) * intervals;
}

// Linear interpolation between the two samples around a fractional index, wrapped into
// the loop (the closing sample is the first one again).
function interpolate(flat: Float64Array, intervals: number, index: number, out: Float64Array, at: number): void {
  const wrapped = ((index % intervals) + intervals) % intervals;
  const i = Math.floor(wrapped);
  const f = wrapped - i;
  out[at] = flat[2 * i] + (flat[2 * i + 2] - flat[2 * i]) * f;
  out[at + 1] = flat[2 * i + 1] + (flat[2 * i + 3] - flat[2 * i + 1]) * f;
}

export function positionAt(trajectory: Trajectory, body: number, time: number): Vec2 {
  const point = new Float64Array(2);
  interpolate(trajectory.positions[body], trajectory.intervals, indexAt(trajectory, time), point, 0);
  return vec2(point[0], point[1]);
}

/** Room, in points, that `trailPoints` needs for a trail of `duration`. */
export const trailCapacity = ({ period, intervals }: Trajectory, duration: number): number =>
  Math.ceil((Math.min(duration, period) / period) * intervals) + 2;

/**
 * Writes into `out` the path a body followed during the `duration` before `time`, as
 * [x, y, ...] from the oldest point to the current one, and returns how many points it wrote.
 * The trail is capped at one period and wraps around the start of the loop.
 */
export function trailPoints(
  trajectory: Trajectory,
  body: number,
  time: number,
  duration: number,
  out: Float64Array,
): number {
  const { period, intervals } = trajectory;
  const flat = trajectory.positions[body];
  const head = indexAt(trajectory, time);
  const tail = head - (Math.min(duration, period) / period) * intervals;

  let count = 0;
  const write = (index: number) => {
    interpolate(flat, intervals, index, out, 2 * count);
    count++;
  };
  write(tail);
  for (let k = Math.floor(tail) + 1; k < head; k++) write(k);
  write(head);
  return count;
}
