"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { formatNumber } from "@/lib/format";
import { trailCapacity, type Trajectory } from "@/lib/orbits/trajectory";
import type { Rect } from "@/lib/plot/viewport";
import { drawFrame, type CanvasSize } from "./draw";

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
const DEFAULT_SPEED_INDEX = 2;
// Each trail covers the last fifth of the period.
const TRAIL_FRACTION = 0.2;
// The position slider moves in steps of half a percent of the period.
const POSITION_STEPS = 200;
// After a stalled frame (a background tab) the animation resumes instead of jumping ahead.
const MAX_FRAME_SECONDS = 0.1;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// The worker is our own code, but what crosses postMessage is checked like any other input.
function isTrajectory(value: unknown): value is Trajectory {
  if (typeof value !== "object" || value === null) return false;
  if (!("period" in value && "intervals" in value && "positions" in value)) return false;
  const { period, intervals, positions } = value;
  return (
    typeof period === "number" &&
    typeof intervals === "number" &&
    Array.isArray(positions) &&
    positions.every((points: unknown) => points instanceof Float64Array && points.length === 2 * (intervals + 1))
  );
}

interface OrbitPlayerProps {
  readonly slug: string;
  readonly name: string;
  readonly period: number;
  /** View box of `children`, the static drawing of the whole orbit laid under the animation. */
  readonly viewBox: Rect;
  readonly children: ReactNode;
}

export function OrbitPlayer({ slug, name, period, viewBox, children }: OrbitPlayerProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState<CanvasSize | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [trails, setTrails] = useState(true);
  const [time, setTime] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);
  const speedGroup = useId();
  const positionId = useId();
  const speed = SPEEDS[speedIndex];
  const ready = trajectory !== null;

  // Hidden by a navigation, the page keeps its state (React Activity) but runs these
  // cleanups: the worker, the observer and the animation stop until it is shown again.
  useEffect(() => {
    if (trajectory) return;
    const worker = new Worker(new URL("./trajectory.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!isTrajectory(event.data)) return;
      worker.terminate();
      setTrajectory(event.data);
      setPlaying(!prefersReducedMotion());
    });
    // Without this the player would wait forever; the static drawing stays on screen.
    const fail = () => {
      worker.terminate();
      setFailed(true);
    };
    worker.addEventListener("error", fail);
    worker.addEventListener("messageerror", fail);
    worker.postMessage({ slug });
    return () => worker.terminate();
  }, [slug, trajectory]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height, ratio: window.devicePixelRatio || 1 });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !trajectory) return;
    let frame = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (previous !== null) {
        const elapsed = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
        setTime((current) => (current + elapsed * speed) % trajectory.period);
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, trajectory]);

  const trailBuffer = useMemo(
    () => (trajectory ? new Float64Array(2 * trailCapacity(trajectory, TRAIL_FRACTION * trajectory.period)) : null),
    [trajectory],
  );

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !trajectory || !trailBuffer || !size) return;
    drawFrame(
      context,
      { trajectory, viewBox, size, time, trailDuration: trails ? TRAIL_FRACTION * trajectory.period : null },
      trailBuffer,
    );
  }, [trajectory, trailBuffer, viewBox, size, time, trails]);

  const position = Math.round((time / period) * POSITION_STEPS);

  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-3 sm:p-4">
      <div
        ref={stageRef}
        className="relative aspect-4/3 max-h-[65vh] w-full overflow-hidden rounded-xl bg-night sm:aspect-video"
      >
        <div className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-25" : "opacity-100"}`}>
          {children}
        </div>
        <canvas
          ref={canvasRef}
          width={size ? Math.round(size.width * size.ratio) : 0}
          height={size ? Math.round(size.height * size.ratio) : 0}
          role="img"
          aria-label={`Simulación de la órbita ${name}: tres cuerpos de igual masa que se atraen entre sí.`}
          className="absolute inset-0 size-full"
        />
        {!ready && (
          <p role="status" className="absolute bottom-3 left-3 rounded-md bg-night/80 px-3 py-1.5 text-sm text-muted">
            {failed ? "No se pudo calcular la animación en este navegador." : "Calculando la órbita…"}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            disabled={!ready}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-night transition-opacity disabled:opacity-50"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
              {playing ? <path d="M4 2h3v12H4zM9 2h3v12H9z" /> : <path d="M4 2.5v11l9-5.5z" />}
            </svg>
            {playing ? "Pausar" : "Reproducir"}
          </button>
          <button
            type="button"
            onClick={() => setTime(0)}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-ink transition-colors hover:border-muted disabled:opacity-50"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.6]">
              <path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.8h2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reiniciar
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-4 py-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
            <input
              type="checkbox"
              checked={trails}
              onChange={(event) => setTrails(event.target.checked)}
              className="size-4 accent-accent"
            />
            Estelas
          </label>
        </div>

        <fieldset className="flex flex-wrap items-center gap-3">
          <legend className="float-left text-sm text-muted">Velocidad</legend>
          <div className="inline-flex rounded-lg border border-line bg-night p-1">
            {SPEEDS.map((value, index) => (
              <label
                key={value}
                className="relative rounded-md px-2.5 py-1 text-sm tabular-nums text-muted transition-colors hover:text-ink has-checked:bg-accent has-checked:font-medium has-checked:text-night has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
              >
                {/* Transparent and covering the label: the click lands on the radio itself. */}
                <input
                  type="radio"
                  name={speedGroup}
                  value={value}
                  checked={speedIndex === index}
                  onChange={() => setSpeedIndex(index)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {formatNumber(value, 2)}×
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label htmlFor={positionId} className="text-sm text-muted">
            Posición en el periodo
          </label>
          <input
            id={positionId}
            type="range"
            min={0}
            max={POSITION_STEPS}
            step={1}
            value={position}
            onChange={(event) => setTime((Number(event.target.value) / POSITION_STEPS) * period)}
            disabled={!ready}
            aria-valuetext={`Tiempo ${formatNumber(time, 2)} de ${formatNumber(period, 2)}`}
            className="min-w-40 flex-1 accent-accent"
          />
          <span aria-hidden="true" className="text-sm tabular-nums text-muted">
            {formatNumber(time, 2)} / {formatNumber(period, 2)}
          </span>
        </div>

        {reducedMotion && !playing && ready && (
          <p className="text-sm text-muted">
            Tu sistema pide reducir el movimiento, así que la animación empieza en pausa.
          </p>
        )}
      </div>
    </div>
  );
}
