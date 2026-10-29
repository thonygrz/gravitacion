"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import { LAUNCH_LIMITS, outcomeOfLaunch, STAR_RADIUS } from "@/lib/learn/lab";
import type { Body } from "@/lib/physics/body";
import { yoshida4 } from "@/lib/physics/integrators";
import { circularSpeed, type LaunchOutcome } from "@/lib/physics/launch";
import { length, sub, vec2, type Vec2 } from "@/lib/physics/vector";
import { bodyColor } from "../orbit-colors";
import { useLearn } from "./learn-state";

// A star of mass 1 at the origin and a planet launched from distance 1, so the
// circular speed and the circular period are 1 and 2π.
const LAUNCH_POINT = vec2(1, 0);
// Yoshida's step: at the closest approach the slider allows, about 0.15, it still
// covers less than 3° of the turn.
const STEP = 0.002;
// Simulated time per second of animation: a circular orbit takes about four seconds.
const TIME_SCALE = 1.5;
// Far enough to call it an escape and stop: the view ends 3.2 units from the star.
const ESCAPED = 6;
// The trail keeps one point every two steps and drops the oldest beyond this many.
const TRAIL_POINTS = 2000;
// Without animation the whole path is drawn at once, for at most this much time.
const STATIC_DURATION = 40;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const startBodies = (speed: number): Body[] => [
  { mass: 1, position: vec2(0, 0), velocity: vec2(0, 0) },
  // Light enough that the star barely moves, so the outcome matches launchOutcome.
  { mass: 1e-9, position: LAUNCH_POINT, velocity: vec2(0, speed * circularSpeed(1, 1)) },
];

const distanceToStar = ([star, planet]: readonly Body[]) => length(sub(planet.position, star.position));

const toPoints = (trail: readonly number[]) => {
  let points = "";
  for (let i = 0; i < trail.length; i += 2) points += `${trail[i].toFixed(3)},${(-trail[i + 1]).toFixed(3)} `;
  return points;
};

function describe(outcome: LaunchOutcome, speed: number): string {
  switch (outcome.kind) {
    case "collision":
      return "Cae hacia la estrella y choca con ella: le falta velocidad para esquivarla.";
    case "escape":
      return "Se escapa: la estrella lo va frenando, pero nunca llega a detenerlo ni a hacerlo volver.";
    case "orbit": {
      const period = formatNumber(outcome.period, 1);
      if (Math.abs(speed - 1) < 0.025) {
        return `Órbita circular: se mantiene siempre a la misma distancia y da una vuelta cada ${period} unidades de tiempo.`;
      }
      return speed < 1
        ? `Órbita elíptica: cae hasta ${formatNumber(outcome.closest, 2)} de la estrella y vuelve al punto de lanzamiento cada ${period} unidades de tiempo.`
        : `Órbita elíptica: se aleja hasta ${formatNumber(outcome.farthest, 2)} de la estrella y vuelve al punto de lanzamiento cada ${period} unidades de tiempo.`;
    }
  }
}

interface View {
  /** Launch speed this view belongs to; a different slider value means a fresh start. */
  readonly speed: number;
  readonly planet: Vec2;
  readonly points: string;
  readonly ended: boolean;
}

export function OrbitLauncher() {
  const { launchSpeed, setLaunchSpeed } = useLearn();
  const sliderId = useId();
  const outcome = outcomeOfLaunch(launchSpeed);
  const [view, setView] = useState<View | null>(null);
  const [playing, setPlaying] = useState(false);
  const bodiesRef = useRef<Body[]>([]);
  const trailRef = useRef<number[]>([]);

  // A view from another speed is stale: the slider moved since that launch.
  const current = view !== null && view.speed === launchSpeed ? view : null;
  const running = playing && current !== null && !current.ended;

  // Hidden by a navigation (React Activity), the page runs this cleanup and the
  // animation stops; it carries on from the same point when the page is shown again.
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (previous !== null) {
        const steps = Math.min(200, Math.round(((now - previous) / 1000) * (TIME_SCALE / STEP)));
        let bodies = bodiesRef.current;
        let ended = false;
        for (let step = 1; step <= steps && !ended; step++) {
          bodies = yoshida4(bodies, STEP);
          const distance = distanceToStar(bodies);
          ended = distance <= STAR_RADIUS || distance >= ESCAPED;
          if (step % 2 === 0 || ended) trailRef.current.push(bodies[1].position.x, bodies[1].position.y);
        }
        if (trailRef.current.length > 2 * TRAIL_POINTS) trailRef.current.splice(0, trailRef.current.length - 2 * TRAIL_POINTS);
        bodiesRef.current = bodies;
        setView({ speed: launchSpeed, planet: bodies[1].position, points: toPoints(trailRef.current), ended });
        if (ended) return;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, launchSpeed]);

  const launch = () => {
    bodiesRef.current = startBodies(launchSpeed);
    trailRef.current = [LAUNCH_POINT.x, LAUNCH_POINT.y];
    if (!window.matchMedia(REDUCED_MOTION).matches) {
      setView({ speed: launchSpeed, planet: LAUNCH_POINT, points: "", ended: false });
      setPlaying(true);
      return;
    }
    // With reduced motion, draw the whole path at once instead of animating it: one
    // turn of an orbit, or the way to the star or out of the view.
    const duration = outcome.kind === "orbit" ? Math.min(outcome.period, STATIC_DURATION) : STATIC_DURATION;
    let bodies = bodiesRef.current;
    let ended = false;
    for (let step = 1; step * STEP <= duration && !ended; step++) {
      bodies = yoshida4(bodies, STEP);
      const distance = distanceToStar(bodies);
      ended = distance <= STAR_RADIUS || distance >= ESCAPED;
      if (step % 2 === 0 || ended) trailRef.current.push(bodies[1].position.x, bodies[1].position.y);
    }
    bodiesRef.current = bodies;
    setView({ speed: launchSpeed, planet: bodies[1].position, points: toPoints(trailRef.current), ended: true });
    setPlaying(false);
  };

  const planet = current?.planet ?? LAUNCH_POINT;
  const percent = Math.round(launchSpeed * 100);

  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <svg
          viewBox="-3.2 -2.4 4.8 4.8"
          role="img"
          aria-label={`Un planeta lanzado al ${percent} % de la velocidad de una órbita circular alrededor de una estrella.`}
          className="mx-auto aspect-square w-full max-w-md rounded-xl bg-night"
        >
          <circle cx={0} cy={0} r={STAR_RADIUS * 2.2} className="fill-accent" opacity={0.15} />
          <circle cx={0} cy={0} r={STAR_RADIUS} className="fill-accent" />
          <line
            x1={LAUNCH_POINT.x}
            y1={0}
            x2={LAUNCH_POINT.x}
            y2={-0.45 * launchSpeed}
            stroke="currentColor"
            className="text-muted"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 3"
          />
          {current && (
            <polyline
              points={current.points}
              fill="none"
              stroke={bodyColor(1)}
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <circle cx={planet.x} cy={-planet.y} r={0.06} fill={bodyColor(1)} />
        </svg>

        <div>
          <label htmlFor={sliderId} className="flex justify-between text-sm text-muted">
            Velocidad de lanzamiento <span className="tabular-nums text-ink">{percent} %</span>
          </label>
          <input
            id={sliderId}
            type="range"
            min={LAUNCH_LIMITS.min}
            max={LAUNCH_LIMITS.max}
            step={LAUNCH_LIMITS.step}
            value={launchSpeed}
            onChange={(event) => setLaunchSpeed(Number(event.target.value))}
            aria-valuetext={`${percent} % de la velocidad de una órbita circular`}
            className="mt-2 w-full accent-accent"
          />
          <p className="mt-1 text-xs text-muted">100 % es la velocidad justa para dar vueltas en círculo.</p>

          <p aria-live="polite" className="mt-4 min-h-12 leading-relaxed">
            {describe(outcome, launchSpeed)}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={running ? () => setPlaying(false) : launch}
              className="inline-flex min-w-32 items-center justify-center rounded-lg bg-accent px-4 py-2 font-medium text-night"
            >
              {running ? "Parar" : "Lanzar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
