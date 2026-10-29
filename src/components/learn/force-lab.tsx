"use client";

import { useId } from "react";
import { formatNumber } from "@/lib/format";
import { forceChange, type ForceChange } from "@/lib/learn/force";
import { LAB_LIMITS, LAB_START } from "@/lib/learn/lab";
import { gravitationalForce } from "@/lib/physics/gravity";
import { bodyColor } from "../orbit-colors";
import { useLearn } from "./learn-state";

// The drawing is 640 × 200; at the largest distance the bodies sit 260 units from the centre.
const WIDTH = 640;
const MIDDLE_Y = 100;
const HALF_SPAN = 260;
// Arrow length for a force of 1 G, which is the starting one.
const ARROW_PER_FORCE = 30;

// The radius grows with the cube root of the mass, as for bodies of the same density.
const radiusOf = (mass: number) => 10 + 6 * Math.cbrt(mass);

function describeChange(change: ForceChange): string {
  switch (change.kind) {
    case "same":
      return "La fuerza no ha cambiado.";
    case "larger":
      return `La fuerza se ha multiplicado por ${formatNumber(change.factor, 2)} respecto al valor anterior.`;
    case "smaller":
      return `La fuerza es ${formatNumber(change.factor, 2)} veces menor que antes.`;
  }
}

function Arrow({ from, to, color }: { readonly from: number; readonly to: number; readonly color: string }) {
  const direction = Math.sign(to - from);
  return (
    <g stroke={color} fill={color}>
      <line x1={from} y1={MIDDLE_Y} x2={to - direction * 8} y2={MIDDLE_Y} strokeWidth={4} />
      <polygon points={`${to},${MIDDLE_Y} ${to - direction * 10},${MIDDLE_Y - 7} ${to - direction * 10},${MIDDLE_Y + 7}`} />
    </g>
  );
}

export function ForceLab() {
  const { lab, previousLab, setLab } = useLearn();
  const ids = { mass1: useId(), mass2: useId(), distance: useId() };
  const force = gravitationalForce(lab.mass1, lab.mass2, lab.distance);
  const change = previousLab
    ? forceChange(gravitationalForce(previousLab.mass1, previousLab.mass2, previousLab.distance), force)
    : null;

  const offset = (lab.distance / LAB_LIMITS.distance.max) * HALF_SPAN;
  const x1 = WIDTH / 2 - offset;
  const x2 = WIDTH / 2 + offset;
  const r1 = radiusOf(lab.mass1);
  const r2 = radiusOf(lab.mass2);
  // Each arrow stops before the middle so the two never cross.
  const room = offset - Math.max(r1, r2) - 10;
  const wanted = force * ARROW_PER_FORCE;
  const arrow = Math.min(wanted, room);

  const sliders = [
    { key: "mass1", label: "Masa del primer cuerpo", value: lab.mass1, limits: LAB_LIMITS.mass, decimals: 0 },
    { key: "mass2", label: "Masa del segundo cuerpo", value: lab.mass2, limits: LAB_LIMITS.mass, decimals: 0 },
    { key: "distance", label: "Distancia entre los dos", value: lab.distance, limits: LAB_LIMITS.distance, decimals: 1 },
  ] as const;

  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-4 sm:p-5">
      <svg
        viewBox={`0 0 ${WIDTH} 200`}
        role="img"
        aria-label={`Dos cuerpos de masas ${formatNumber(lab.mass1, 0)} y ${formatNumber(lab.mass2, 0)} a una distancia de ${formatNumber(lab.distance, 1)}: se atraen con una fuerza de ${formatNumber(force, 3)} G.`}
        className="w-full rounded-xl bg-night"
      >
        <line x1={x1} y1={MIDDLE_Y + 50} x2={x2} y2={MIDDLE_Y + 50} stroke="currentColor" className="text-muted" strokeDasharray="4 6" />
        <text x={WIDTH / 2} y={MIDDLE_Y + 72} textAnchor="middle" className="fill-muted text-[15px]">
          r = {formatNumber(lab.distance, 1)}
        </text>
        <circle cx={x1} cy={MIDDLE_Y} r={r1} fill={bodyColor(0)} />
        <circle cx={x2} cy={MIDDLE_Y} r={r2} fill={bodyColor(1)} />
        {arrow > 2 && (
          <>
            <Arrow from={x1 + r1 + 4} to={x1 + r1 + 4 + arrow} color={bodyColor(0)} />
            <Arrow from={x2 - r2 - 4} to={x2 - r2 - 4 - arrow} color={bodyColor(1)} />
          </>
        )}
      </svg>
      {wanted > room && (
        <p className="mt-2 text-sm text-muted">Las flechas están recortadas: esta fuerza no cabe en el dibujo.</p>
      )}

      <p className="mt-4 text-lg tabular-nums">
        F = G · m₁ · m₂ / r² = G · {formatNumber(lab.mass1, 0)} · {formatNumber(lab.mass2, 0)} /{" "}
        {formatNumber(lab.distance, 1)}² = <strong className="text-accent">{formatNumber(force, 3)} G</strong>
      </p>
      <p aria-live="polite" className="mt-1 min-h-6 text-sm text-muted">
        {change && describeChange(change)}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {sliders.map(({ key, label, value, limits, decimals }) => (
          <div key={key}>
            <label htmlFor={ids[key]} className="flex justify-between text-sm text-muted">
              {label} <span className="tabular-nums text-ink">{formatNumber(value, decimals)}</span>
            </label>
            <input
              id={ids[key]}
              type="range"
              min={limits.min}
              max={limits.max}
              step={limits.step}
              value={value}
              onChange={(event) => setLab({ [key]: Number(event.target.value) })}
              className="mt-2 w-full accent-accent"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLab({ distance: lab.distance * 2 })}
          disabled={lab.distance * 2 > LAB_LIMITS.distance.max}
          className="rounded-lg border border-line px-4 py-2 text-sm transition-colors hover:border-muted disabled:opacity-50"
        >
          Duplicar la distancia
        </button>
        <button
          type="button"
          onClick={() => setLab({ mass1: lab.mass1 * 2 })}
          disabled={lab.mass1 * 2 > LAB_LIMITS.mass.max}
          className="rounded-lg border border-line px-4 py-2 text-sm transition-colors hover:border-muted disabled:opacity-50"
        >
          Duplicar la primera masa
        </button>
        <button
          type="button"
          onClick={() => setLab(LAB_START)}
          className="rounded-lg border border-line px-4 py-2 text-sm transition-colors hover:border-muted"
        >
          Volver al principio
        </button>
      </div>
    </div>
  );
}
