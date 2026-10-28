import { describe, expect, it } from "vitest";
import { simulate } from "./simulation";
import { CIRCULAR_BINARY, CIRCULAR_BINARY_PERIOD } from "./test-systems";

describe("simulate", () => {
  it("records evenly spaced samples with both ends included", () => {
    const samples = simulate(CIRCULAR_BINARY, {
      duration: CIRCULAR_BINARY_PERIOD,
      steps: 400,
      samples: 4,
    });
    expect(samples).toHaveLength(5);
    expect(samples[0].bodies).toBe(CIRCULAR_BINARY);
    samples.forEach((sample, i) => {
      expect(sample.time).toBeCloseTo((i * CIRCULAR_BINARY_PERIOD) / 4, 12);
    });
  });

  it("rejects step counts that are not positive or that the samples do not divide", () => {
    expect(() => simulate(CIRCULAR_BINARY, { duration: 1, steps: 0, samples: 1 })).toThrow(RangeError);
    expect(() => simulate(CIRCULAR_BINARY, { duration: 1, steps: 10, samples: 3 })).toThrow(RangeError);
  });
});
