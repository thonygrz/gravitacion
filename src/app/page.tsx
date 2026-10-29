import Link from "next/link";
import { OrbitDrawing } from "@/components/orbit-drawing";
import { findOrbit } from "@/lib/orbits/catalog";
import { orbitFigure } from "@/lib/orbits/figure";
import { computeTrajectory, TRAJECTORY_INTERVALS } from "@/lib/orbits/trajectory";

const PARTS = [
  {
    href: "/aprende",
    title: "Aprende la ley",
    text: "Cuatro lecciones cortas para entender la gravitación universal, con un laboratorio para tocar la fórmula y un planeta que puedes lanzar alrededor de una estrella.",
    action: "Empezar",
  },
  {
    href: "/galeria",
    title: "Galería de órbitas",
    text: "Seis soluciones del problema de los tres cuerpos, de Lagrange a Yin-Yang I, simuladas en tu navegador y con las condiciones iniciales de cada una.",
    action: "Ver la galería",
  },
] as const;

export default function Home() {
  const eight = findOrbit("figura-de-ocho");
  const figure = eight && orbitFigure(computeTrajectory(eight.initialBodies, eight.period, TRAJECTORY_INTERVALS));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            La gravedad, de dos cuerpos a tres
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Una sola fórmula explica por qué caen las cosas y por qué los planetas giran. Con dos cuerpos da órbitas
            sencillas; con tres no hay una fórmula general, pero algunas posiciones de partida dan movimientos que se
            repiten para siempre.
          </p>
        </div>
        {figure && (
          <div className="relative aspect-16/10 rounded-2xl border border-line bg-panel/60">
            <div className="absolute inset-4">
              <OrbitDrawing figure={figure} markStarts className="size-full" />
            </div>
          </div>
        )}
      </div>

      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        {PARTS.map(({ href, title, text, action }) => (
          <li key={href}>
            <article className="relative flex h-full flex-col rounded-2xl border border-line bg-panel/80 p-6 transition-colors hover:border-accent/60 has-focus-visible:border-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
              <h2 className="font-display text-2xl font-semibold">
                <Link
                  href={href}
                  scroll={href !== "/galeria"}
                  className="outline-none after:absolute after:inset-0 after:rounded-2xl"
                >
                  {title}
                </Link>
              </h2>
              <p className="mt-3 leading-relaxed text-muted">{text}</p>
              <p aria-hidden="true" className="mt-auto pt-5 font-medium text-accent">
                {action} →
              </p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
