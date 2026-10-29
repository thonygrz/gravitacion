import type { z } from "zod";
import { fit, fitLab, LAUNCH_LIMITS, outcomeOfLaunch, type LabValues } from "../learn/lab";
import { findOrbit } from "../orbits/catalog";
import { gravitationalForce } from "../physics/gravity";
import type { labOutputSchema, launchOutputSchema, ORBIT_SLUGS, orbitOutputSchema } from "./tools";

// What the browser does with each tool call, apart from the React state it sets.

const forceOf = ({ mass1, mass2, distance }: LabValues) => gravitationalForce(mass1, mass2, distance);

export function runSetLab(
  current: LabValues,
  change: Partial<LabValues>,
): { readonly values: LabValues; readonly output: z.infer<typeof labOutputSchema> } {
  const values = fitLab(current, change);
  return { values, output: { ...values, force: forceOf(values), previousForce: forceOf(current) } };
}

export function runSetLaunchSpeed({ percent }: { readonly percent: number }): {
  readonly speed: number;
  readonly output: z.infer<typeof launchOutputSchema>;
} {
  const speed = fit(percent / 100, LAUNCH_LIMITS);
  return { speed, output: { percent: Math.round(speed * 100), outcome: outcomeOfLaunch(speed) } };
}

export function runShowOrbit({ slug }: { readonly slug: (typeof ORBIT_SLUGS)[number] }): z.infer<typeof orbitOutputSchema> {
  return { slug, name: findOrbit(slug)?.name ?? slug };
}
