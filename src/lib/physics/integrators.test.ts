import { describe, expect, it } from "vitest";
import type { Body } from "./body";
import { totalEnergy } from "./gravity";
import { yoshida4 } from "./integrators";
import { phaseSpaceDistance } from "./periodicity";
import { simulate } from "./simulation";
import {
  CIRCULAR_BINARY,
  CIRCULAR_BINARY_PERIOD,
  ECCENTRIC_BINARY,
} from "./test-systems";

const closureAfterOnePeriod = (steps: number) =>
  phaseSpaceDistance(
    simulate(CIRCULAR_BINARY, {
      duration: CIRCULAR_BINARY_PERIOD,
      steps,
      samples: 1,
      integrator: yoshida4,
    })[1].bodies,
    CIRCULAR_BINARY,
  );

describe("yoshida4", () => {
  it("brings a circular binary back to its start after one period", () => {
    expect(closureAfterOnePeriod(2000)).toBeLessThan(5e-9);
  });

  it("converges with fourth order: halving the step divides the error by 16", () => {
    const ratio = closureAfterOnePeriod(200) / closureAfterOnePeriod(400);
    expect(ratio).toBeGreaterThan(14);
    expect(ratio).toBeLessThan(18);
  });

  it("keeps the energy error of an eccentric orbit bounded instead of letting it grow", () => {
    const e0 = totalEnergy(ECCENTRIC_BINARY);
    let state: readonly Body[] = ECCENTRIC_BINARY;
    const windowMaxima: number[] = [];
    // Ten windows of about ten orbits each.
    for (let window = 0; window < 10; window++) {
      let maxError = 0;
      for (let step = 0; step < 10_000; step++) {
        state = yoshida4(state, 0.002);
        maxError = Math.max(maxError, Math.abs((totalEnergy(state) - e0) / e0));
      }
      windowMaxima.push(maxError);
    }
    expect(Math.max(...windowMaxima)).toBeLessThan(1e-5);
    expect(windowMaxima[windowMaxima.length - 1]).toBeLessThan(1.1 * windowMaxima[0]);
  });
});
