import { describe, expect, it } from "vitest";
import { phaseSpaceDistance, returnProximity } from "./periodicity";
import { CIRCULAR_BINARY, CIRCULAR_BINARY_PERIOD } from "./test-systems";
import { scale, vec2 } from "./vector";

describe("phaseSpaceDistance", () => {
  it("is zero for the same state and combines position and velocity differences", () => {
    expect(phaseSpaceDistance(CIRCULAR_BINARY, CIRCULAR_BINARY)).toBe(0);
    const [first, second] = CIRCULAR_BINARY;
    const moved = [
      {
        ...first,
        position: vec2(first.position.x + 3, first.position.y),
        velocity: vec2(first.velocity.x, first.velocity.y + 4),
      },
      second,
    ];
    expect(phaseSpaceDistance(moved, CIRCULAR_BINARY)).toBeCloseTo(5, 12);
  });
});

describe("returnProximity", () => {
  it("finds the period of a circular binary", () => {
    const { time, distance } = returnProximity(CIRCULAR_BINARY, {
      from: 0.9 * CIRCULAR_BINARY_PERIOD,
      to: 1.1 * CIRCULAR_BINARY_PERIOD,
    });
    expect(time).toBeCloseTo(CIRCULAR_BINARY_PERIOD, 8);
    expect(distance).toBeLessThan(2e-9);
  });

  it("reproduces the figure-eight period Simó computed (Chenciner and Montgomery, 2000)", () => {
    // Caption of figure 1: x1 = -x2, x3 = 0 and V = v3 = -2·v1 = -2·v2.
    const v3 = vec2(-0.93240737, -0.86473146);
    const figureEight = [
      { mass: 1, position: vec2(0.97000436, -0.24308753), velocity: scale(v3, -0.5) },
      { mass: 1, position: vec2(-0.97000436, 0.24308753), velocity: scale(v3, -0.5) },
      { mass: 1, position: vec2(0, 0), velocity: v3 },
    ];
    const { time, distance } = returnProximity(figureEight, { from: 6.2, to: 6.45 });
    expect(time).toBeCloseTo(6.32591398, 6);
    expect(distance).toBeLessThan(1e-7);
  });

  it("rejects a window that does not start after t = 0", () => {
    expect(() => returnProximity(CIRCULAR_BINARY, { from: 0, to: 1 })).toThrow(RangeError);
    expect(() => returnProximity(CIRCULAR_BINARY, { from: 2, to: 1 })).toThrow(RangeError);
  });
});
