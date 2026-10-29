import { describe, expect, it } from "vitest";
import { fit, LAUNCH_LIMITS, outcomeOfLaunch } from "../learn/lab";
import { TUTOR_INSTRUCTIONS } from "./instructions";

const outcomeAt = (percent: number) => outcomeOfLaunch(fit(percent / 100, LAUNCH_LIMITS)).kind;

describe("TUTOR_INSTRUCTIONS", () => {
  it("give the launcher's thresholds as the page computes them", () => {
    expect(TUTOR_INSTRUCTIONS).toContain("hasta el 50 % el planeta choca con la estrella, del 55 al 140 % orbita");
    expect(TUTOR_INSTRUCTIONS).toContain("desde el 145 % se escapa");
    expect([outcomeAt(50), outcomeAt(55), outcomeAt(140), outcomeAt(145)]).toEqual(["collision", "orbit", "orbit", "escape"]);
  });
});
