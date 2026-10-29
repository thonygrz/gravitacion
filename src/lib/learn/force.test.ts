import { describe, expect, it } from "vitest";
import { gravitationalForce } from "../physics/gravity";
import { forceChange } from "./force";

describe("forceChange", () => {
  it("reads doubling the distance as a force four times smaller", () => {
    const before = gravitationalForce(4, 4, 4);
    const after = gravitationalForce(4, 4, 8);
    expect(forceChange(before, after)).toEqual({ kind: "smaller", factor: 4 });
  });

  it("reads tripling a mass as a force three times larger", () => {
    expect(forceChange(gravitationalForce(2, 5, 3), gravitationalForce(6, 5, 3))).toEqual({
      kind: "larger",
      factor: expect.closeTo(3, 12),
    });
  });

  it("calls a change of rounding size no change", () => {
    expect(forceChange(1, 1 + 1e-12)).toEqual({ kind: "same" });
    expect(forceChange(0.375, 0.375)).toEqual({ kind: "same" });
  });
});
