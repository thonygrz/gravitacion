import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrbitDrawing } from "@/components/orbit-drawing";
import { bodyColor } from "@/components/orbit-colors";
import { OrbitPlayer } from "@/components/player/orbit-player";
import { formatNumber } from "@/lib/format";
import { findOrbit, ORBITS } from "@/lib/orbits/catalog";
import { orbitFigure } from "@/lib/orbits/figure";
import { computeTrajectory, TRAJECTORY_INTERVALS } from "@/lib/orbits/trajectory";

// The whole page must be static. Besides guarding that, it makes a request for an
// unknown orbit wait for the render instead of streaming a shell first, so notFound()
// answers with a real 404 rather than a 200 carrying the not-found page.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return ORBITS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/galeria/[slug]">): Promise<Metadata> {
  const orbit = findOrbit((await params).slug);
  return orbit ? { title: orbit.name, description: orbit.summary } : {};
}

export default async function OrbitPage({ params }: PageProps<"/galeria/[slug]">) {
  const orbit = findOrbit((await params).slug);
  if (!orbit) notFound();
  const figure = orbitFigure(computeTrajectory(orbit.initialBodies, orbit.period, TRAJECTORY_INTERVALS));
  const others = ORBITS.filter(({ slug }) => slug !== orbit.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/galeria"
        // The gallery restores the scroll position it had.
        scroll={false}
        className="inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> Volver a la galería
      </Link>

      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{orbit.name}</h1>
        <p className="mt-3 leading-relaxed text-muted">{orbit.summary}</p>
      </header>

      <div className="mt-6">
        <OrbitPlayer slug={orbit.slug} name={orbit.name} period={orbit.period} viewBox={figure.viewBox}>
          <OrbitDrawing figure={figure} className="size-full" />
        </OrbitPlayer>
      </div>

      {/* grid-cols-1 lets the column shrink below the table, which then scrolls on its own. */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="datos">
          <h2 id="datos" className="font-display text-xl font-semibold">
            Datos de la órbita
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Periodo</dt>
              <dd className="mt-0.5 tabular-nums">
                {formatNumber(orbit.period, 6)}
                {orbit.publishedPeriod !== undefined && (
                  <span className="text-muted"> (publicado: {formatNumber(orbit.publishedPeriod, 4)})</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Masas y unidades</dt>
              <dd className="mt-0.5">
                Tres masas iguales a 1 y constante de gravitación <span className="whitespace-nowrap">G = 1</span>.
              </dd>
            </div>
            <div>
              <dt className="text-muted">Fuente de las condiciones iniciales</dt>
              <dd className="mt-0.5">
                {orbit.source.url ? (
                  <a href={orbit.source.url} className="underline decoration-accent underline-offset-4 hover:text-accent">
                    {orbit.source.label}
                  </a>
                ) : (
                  orbit.source.label
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El periodo es el tiempo que tarda el sistema en volver a su estado de partida. La animación usa el
            medido con este motor, para que el bucle encaje sin saltos; las tablas lo publican redondeado.
          </p>
        </section>

        <section aria-labelledby="condiciones">
          <h2 id="condiciones" className="font-display text-xl font-semibold">
            Condiciones iniciales
          </h2>
          <div role="region" aria-labelledby="condiciones" tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm tabular-nums">
              <caption className="sr-only">Posición y velocidad de cada cuerpo en el instante inicial</caption>
              <thead className="bg-panel text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Cuerpo</th>
                  <th scope="col" className="px-3 py-2 font-medium">x</th>
                  <th scope="col" className="px-3 py-2 font-medium">y</th>
                  <th scope="col" className="px-3 py-2 font-medium">vx</th>
                  <th scope="col" className="px-3 py-2 font-medium">vy</th>
                </tr>
              </thead>
              <tbody>
                {orbit.initialBodies.map(({ position, velocity }, body) => (
                  <tr key={body} className="border-t border-line">
                    <th scope="row" className="px-3 py-2 font-medium whitespace-nowrap">
                      <span aria-hidden="true" className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: bodyColor(body) }} />
                      {body + 1}
                    </th>
                    <td className="px-3 py-2">{formatNumber(position.x, 16)}</td>
                    <td className="px-3 py-2">{formatNumber(position.y, 16)}</td>
                    <td className="px-3 py-2">{formatNumber(velocity.x, 16)}</td>
                    <td className="px-3 py-2">{formatNumber(velocity.y, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <nav aria-labelledby="otras" className="mt-12 border-t border-line pt-8">
        <h2 id="otras" className="font-display text-xl font-semibold">
          Otras órbitas
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map(({ slug, name }) => (
            <li key={slug}>
              <Link
                href={`/galeria/${slug}`}
                className="inline-block rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-accent/70"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
