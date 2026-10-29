import type { Metadata } from "next";
import { GalleryGrid, type GalleryItem } from "@/components/gallery/gallery-grid";
import { ORBITS } from "@/lib/orbits/catalog";
import { orbitFigure } from "@/lib/orbits/figure";
import { computeTrajectory, TRAJECTORY_INTERVALS } from "@/lib/orbits/trajectory";

export const metadata: Metadata = {
  title: "Galería de órbitas",
  description:
    "Seis soluciones periódicas del problema de los tres cuerpos, de Lagrange a Yin-Yang I, para ver en movimiento.",
};

export default function GalleryPage() {
  // Integrated at build time: the page is prerendered and the drawings are plain SVG.
  const items: GalleryItem[] = ORBITS.map((orbit) => ({
    slug: orbit.slug,
    name: orbit.name,
    summary: orbit.summary,
    period: orbit.period,
    figure: orbitFigure(computeTrajectory(orbit.initialBodies, orbit.period, TRAJECTORY_INTERVALS)),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Galería de órbitas periódicas
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          Tres cuerpos que se atraen entre sí no tienen una solución general que se pueda escribir con
          una fórmula. Aun así, con ciertas posiciones y velocidades de partida, el movimiento se repite
          para siempre. Estas son seis de esas órbitas: elige una para verla en movimiento.
        </p>
      </header>
      <GalleryGrid items={items} />
    </div>
  );
}
