import { describe, expect, it } from "vitest";
import { CIRCULAR_BINARY, CIRCULAR_BINARY_PERIOD } from "../physics/test-systems";
import {
  computeTrajectory,
  positionAt,
  trailCapacity,
  trailPoints,
  type Trajectory,
} from "./trajectory";

// One body going once around the unit circle in `period`, sampled `intervals` times.
function circle(intervals: number, period = 1): Trajectory {
  const flat = new Float64Array(2 * (intervals + 1));
  for (let i = 0; i <= intervals; i++) {
    const angle = (2 * Math.PI * i) / intervals;
    flat[2 * i] = Math.cos(angle);
    flat[2 * i + 1] = Math.sin(angle);
  }
  return { period, intervals, positions: [flat] };
}

const onCircle = (intervals: number, index: number): [number, number] => {
  const angle = (2 * Math.PI * index) / intervals;
  return [Math.cos(angle), Math.sin(angle)];
};

const pointsOf = (out: Float64Array, count: number): [number, number][] =>
  Array.from({ length: count }, (_, i) => [out[2 * i], out[2 * i + 1]]);

const midpoint = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

function expectPoints(actual: [number, number][], expected: [number, number][]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach(([x, y], i) => {
    expect(x).toBeCloseTo(expected[i][0], 12);
    expect(y).toBeCloseTo(expected[i][1], 12);
  });
}

describe("computeTrajectory", () => {
  it("samples one period of a circular binary, from the initial positions back to them", () => {
    const trajectory = computeTrajectory(CIRCULAR_BINARY, CIRCULAR_BINARY_PERIOD, 400);
    expect(trajectory.period).toBe(CIRCULAR_BINARY_PERIOD);
    expect(trajectory.positions).toHaveLength(2);
    expect(trajectory.positions[0]).toHaveLength(2 * 401);
    expect(Array.from(trajectory.positions[0].subarray(0, 2))).toEqual([-0.5, 0]);

    // A quarter of a turn counterclockwise later, the first body is at the bottom.
    const quarter = trajectory.positions[0].subarray(200, 202);
    expect(quarter[0]).toBeCloseTo(0, 6);
    expect(quarter[1]).toBeCloseTo(-0.5, 6);

    const closing = trajectory.positions[1].subarray(800, 802);
    expect(closing[0]).toBeCloseTo(0.5, 8);
    expect(closing[1]).toBeCloseTo(0, 8);
  });
});

describe("positionAt", () => {
  const trajectory = circle(4);

  it("returns the samples at their times and interpolates linearly between them", () => {
    expect(positionAt(trajectory, 0, 0.25).x).toBeCloseTo(0, 12);
    expect(positionAt(trajectory, 0, 0.25).y).toBeCloseTo(1, 12);
    expect(positionAt(trajectory, 0, 0.125).x).toBeCloseTo(0.5, 12);
    expect(positionAt(trajectory, 0, 0.125).y).toBeCloseTo(0.5, 12);
  });

  it("wraps times before the start and after the end of the period", () => {
    expect(positionAt(trajectory, 0, 1.25).y).toBeCloseTo(1, 12);
    expect(positionAt(trajectory, 0, -0.25).y).toBeCloseTo(-1, 12);
    expect(positionAt(trajectory, 0, 1).x).toBeCloseTo(1, 12);
  });
});

describe("trailPoints", () => {
  const trajectory = circle(8);
  const out = new Float64Array(2 * trailCapacity(trajectory, 1));

  it("goes from the oldest point to the current position through the samples in between", () => {
    const count = trailPoints(trajectory, 0, 0.5625, 0.25, out);
    expectPoints(pointsOf(out, count), [
      midpoint(onCircle(8, 2), onCircle(8, 3)),
      onCircle(8, 3),
      onCircle(8, 4),
      midpoint(onCircle(8, 4), onCircle(8, 5)),
    ]);
  });

  it("does not repeat a point when the ends fall on samples", () => {
    const count = trailPoints(trajectory, 0, 0.5, 0.25, out);
    expectPoints(pointsOf(out, count), [onCircle(8, 2), onCircle(8, 3), onCircle(8, 4)]);
  });

  it("wraps around the start of the loop", () => {
    const count = trailPoints(trajectory, 0, 0.0625, 0.25, out);
    expectPoints(pointsOf(out, count), [
      midpoint(onCircle(8, 6), onCircle(8, 7)),
      onCircle(8, 7),
      onCircle(8, 0),
      midpoint(onCircle(8, 0), onCircle(8, 1)),
    ]);
  });

  it("is capped at one full period", () => {
    const count = trailPoints(trajectory, 0, 0.3, 5, out);
    const points = pointsOf(out, count);
    expect(count).toBe(10);
    expect(points[0][0]).toBeCloseTo(points[count - 1][0], 12);
    expect(points[0][1]).toBeCloseTo(points[count - 1][1], 12);
  });

  it("never writes more points than trailCapacity", () => {
    for (const duration of [0.01, 0.1, 0.3, 0.7, 1, 2]) {
      const capacity = trailCapacity(trajectory, duration);
      const buffer = new Float64Array(2 * capacity);
      for (let time = -1; time <= 2; time += 0.037) {
        expect(trailPoints(trajectory, 0, time, duration, buffer)).toBeLessThanOrEqual(capacity);
      }
    }
  });
});
