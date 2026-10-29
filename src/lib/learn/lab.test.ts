import { describe, expect, it } from "vitest";
import { fit, fitLab, LAB_LIMITS, LAB_START, LAUNCH_LIMITS } from "./lab";

describe("fit", () => {
  it("keeps values inside the limits", () => {
    expect(fit(25, LAB_LIMITS.mass)).toBe(10);
    expect(fit(-3, LAB_LIMITS.distance)).toBe(1);
    expect(fit(0, LAUNCH_LIMITS)).toBe(0.2);
  });

  it("moves values onto the slider's steps", () => {
    expect(fit(2.6, LAB_LIMITS.mass)).toBe(3);
    expect(fit(3.3, LAB_LIMITS.distance)).toBe(3.5);
    expect(fit(1.234, LAUNCH_LIMITS)).toBe(1.25);
  });

  it("leaves slider values exactly as they are", () => {
    for (let speed = LAUNCH_LIMITS.min; speed <= LAUNCH_LIMITS.max; speed += LAUNCH_LIMITS.step) {
      const slider = Number(speed.toFixed(2));
      expect(fit(slider, LAUNCH_LIMITS)).toBe(slider);
    }
  });
});

describe("fitLab", () => {
  it("changes only what it is given", () => {
    expect(fitLab(LAB_START, { distance: 8 })).toEqual({ mass1: 4, mass2: 4, distance: 8 });
  });

  it("fits every value it changes", () => {
    expect(fitLab(LAB_START, { mass1: 0, mass2: 7.4, distance: 12 })).toEqual({ mass1: 1, mass2: 7, distance: 10 });
  });
});
