import { findOrbit } from "@/lib/orbits/catalog";
import { computeTrajectory, TRAJECTORY_INTERVALS } from "@/lib/orbits/trajectory";

// Integrates one period of the requested orbit off the main thread, so the 70 to 100 ms
// it takes on a desktop (more on a slower phone) never block the page.
addEventListener("message", (event: MessageEvent<unknown>) => {
  const request = event.data;
  const slug = typeof request === "object" && request !== null && "slug" in request ? request.slug : null;
  const orbit = typeof slug === "string" ? findOrbit(slug) : undefined;
  if (!orbit) return;
  postMessage(computeTrajectory(orbit.initialBodies, orbit.period, TRAJECTORY_INTERVALS));
});
