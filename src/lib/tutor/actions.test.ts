import { describe, expect, it } from "vitest";
import { formatNumber } from "../format";
import { LAB_START, outcomeOfLaunch } from "../learn/lab";
import { ORBITS } from "../orbits/catalog";
import { runSetLab, runSetLaunchSpeed, runShowOrbit } from "./actions";
import { labOutputSchema, launchOutputSchema, ORBIT_SLUGS, orbitOutputSchema, tutorTools } from "./tools";

describe("tool calls", () => {
  it("link exactly the orbits of the gallery", () => {
    expect([...ORBIT_SLUGS]).toEqual(ORBITS.map(({ slug }) => slug));
  });

  it("change the lab and report the force before and after", () => {
    const { values, output } = runSetLab(LAB_START, { distance: 8 });
    expect(values).toEqual({ mass1: 4, mass2: 4, distance: 8 });
    expect(output).toEqual({ mass1: 4, mass2: 4, distance: 8, force: 0.25, previousForce: 1 });
    expect(labOutputSchema.safeParse(output).success).toBe(true);
  });

  it("fit lab values the sliders cannot show", () => {
    expect(runSetLab(LAB_START, { mass1: 25, distance: 3.3 }).values).toEqual({ mass1: 10, mass2: 4, distance: 3.5 });
  });

  it("put the launcher on a step of its slider and say what happens", () => {
    expect(runSetLaunchSpeed({ percent: 95 })).toMatchObject({ speed: 0.95, output: { percent: 95, outcome: { kind: "orbit" } } });
    expect(runSetLaunchSpeed({ percent: 123 }).output.percent).toBe(125);
    expect(runSetLaunchSpeed({ percent: 500 }).output).toEqual({ percent: 160, outcome: { kind: "escape" } });
    expect(runSetLaunchSpeed({ percent: 10 }).output).toMatchObject({ percent: 20, outcome: { kind: "collision" } });
    expect(launchOutputSchema.safeParse(runSetLaunchSpeed({ percent: 95 }).output).success).toBe(true);
  });

  it("tell the model the launcher's time unit as the page computes it", () => {
    const circular = outcomeOfLaunch(1);
    expect(circular.kind).toBe("orbit");
    const period = circular.kind === "orbit" ? circular.period : Number.NaN;
    expect(tutorTools.setLaunchSpeed.description).toContain(`la órbita circular tarda ${formatNumber(period, 1)}.`);
  });

  it("name the orbit they link", () => {
    const output = runShowOrbit({ slug: "figura-de-ocho" });
    expect(output).toEqual({ slug: "figura-de-ocho", name: "Figura de ocho" });
    expect(orbitOutputSchema.safeParse(output).success).toBe(true);
  });
});
