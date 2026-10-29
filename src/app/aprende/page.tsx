import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckQuestion } from "@/components/learn/check-question";
import { ForceLab } from "@/components/learn/force-lab";
import { LearnProvider } from "@/components/learn/learn-state";
import { OrbitLauncher } from "@/components/learn/orbit-launcher";
import { TutorPanel, TutorProvider } from "@/components/learn/tutor";
import { formatNumber } from "@/lib/format";
import { NEWTON_G_SI } from "@/lib/learn/constants";
import { gravitationalForce } from "@/lib/physics/gravity";

export const metadata: Metadata = {
  title: "Aprende la ley de la gravitación",
  description:
    "La ley de la gravitación universal en cuatro lecciones cortas, con un laboratorio para tocar la fórmula y un planeta que puedes lanzar.",
};

const LESSONS = [
  { id: "todo-atrae", title: "Todo atrae a todo" },
  { id: "la-formula", title: "La fórmula" },
  { id: "orbitas", title: "Caer sin llegar nunca" },
  { id: "tres-cuerpos", title: "¿Y con tres cuerpos?" },
] as const;

function Lesson({ index, children }: { readonly index: number; readonly children: ReactNode }) {
  const { id, title } = LESSONS[index];
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 border-t border-line pt-10">
      <p className="text-sm font-medium text-accent">Lección {index + 1}</p>
      <h2 id={`${id}-titulo`} className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-5 leading-relaxed">{children}</div>
    </section>
  );
}

export default function LearnPage() {
  const twoPeople = gravitationalForce(70, 70, 1, NEWTON_G_SI);

  return (
    <LearnProvider>
      <TutorProvider>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
          <div className="space-y-12">
            <header>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                La ley de la gravitación universal
              </h1>
              <p className="mt-4 max-w-3xl leading-relaxed text-muted">
                Una sola regla, la que escribió Isaac Newton, explica por qué caen las cosas y por qué los planetas dan
                vueltas alrededor del Sol. Aquí la verás en cuatro pasos y podrás tocarla: cambiar masas y distancias, y
                lanzar un planeta alrededor de una estrella. Si algo no te cuadra, pregúntale al tutor: te lo explica a tu
                nivel y puede mover el laboratorio por ti.
              </p>
              <nav aria-label="Lecciones" className="mt-6">
                <ol className="flex flex-wrap gap-2 text-sm">
                  {LESSONS.map(({ id, title }, index) => (
                    <li key={id}>
                      <a href={`#${id}`} className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-accent/70">
                        {index + 1}. {title}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#tutor" className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-accent/70">
                      Pregúntale al tutor
                    </a>
                  </li>
                </ol>
              </nav>
            </header>

            <Lesson index={0}>
              <p>
                Cualquier par de objetos con masa se atrae: tú y la Tierra, la Tierra y la Luna, o dos piedras sobre una
                mesa. A esa atracción la llamamos gravedad, y solo depende de dos cosas: cuánta masa tienen y a qué
                distancia están.
              </p>
              <p>
                Pruébalo en el laboratorio: cambia las masas y la distancia, y mira cómo crecen o encogen las flechas, que
                muestran la fuerza con la que cada cuerpo tira del otro. Los dos tiran con la misma fuerza.
              </p>
              <ForceLab />
              <CheckQuestion id="mass" />
            </Lesson>

            <Lesson index={1}>
              <p className="rounded-xl border border-line bg-panel px-4 py-3 text-center font-display text-2xl">
                F = G · m₁ · m₂ / r²
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>F</strong> es la fuerza con la que se atraen los dos cuerpos.
                </li>
                <li>
                  <strong>m₁</strong> y <strong>m₂</strong> son sus masas. Si una se duplica, la fuerza se duplica.
                </li>
                <li>
                  <strong>r</strong> es la distancia entre sus centros, y está al cuadrado: si se duplica, la fuerza se
                  divide entre 4; si se triplica, entre 9.
                </li>
                <li>
                  <strong>G</strong> es la constante de gravitación, un número fijo y diminuto:{" "}
                  {formatNumber(NEWTON_G_SI / 1e-11, 3)} × 10⁻¹¹ en unidades del Sistema Internacional (valor recomendado
                  por CODATA en 2022).
                </li>
              </ul>
              <p>
                Por eso no notamos la atracción entre dos personas: dos personas de 70 kg separadas un metro se atraen con
                unos {formatNumber(twoPeople, 7)} newtons, la unidad de fuerza. Hace falta la masa de un planeta para que la
                gravedad se note.
              </p>
              <p>
                En el laboratorio, G vale 1 y la fuerza se mide en unidades de G: lo que importa es cómo cambia. Pulsa
                «Duplicar la distancia» y comprueba que la fuerza queda dividida entre cuatro.
              </p>
              <CheckQuestion id="distance" />
            </Lesson>

            <Lesson index={2}>
              <p>
                La gravedad no solo hace caer las cosas: también mantiene a los planetas en órbita. Imagina que lanzas un
                planeta de lado, cerca de una estrella. La estrella tira de él todo el tiempo y le va curvando el camino.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Con poca velocidad, la curva lo lleva hasta la estrella: choca.</li>
                <li>Con la velocidad justa, cae alrededor de ella sin llegar nunca a tocarla: eso es una órbita.</li>
                <li>Con demasiada velocidad, se escapa y no vuelve.</li>
              </ul>
              <OrbitLauncher />
              <CheckQuestion id="orbit" />
              <CheckQuestion id="escape" />
            </Lesson>

            <Lesson index={3}>
              <p>
                Con dos cuerpos, la fórmula da la órbita exacta para siempre: un círculo, una elipse o una curva que se
                escapa, como las que acabas de ver. Con tres, cada uno tira de los otros dos a la vez y no hay una fórmula
                general que diga dónde estarán. Aun así, con ciertas posiciones y velocidades de partida el movimiento se
                repite para siempre.
              </p>
              <p>
                <Link href="/galeria" scroll={false} className="inline-block rounded-lg bg-accent px-4 py-2 font-medium text-night">
                  Ver la galería de órbitas de tres cuerpos
                </Link>
              </p>
            </Lesson>
          </div>
          {/* Beside the lessons on wide screens, so the tutor stays in view while it moves the lab. */}
          <div className="mt-12 lg:sticky lg:top-6 lg:mt-0">
            <TutorPanel />
          </div>
        </div>
      </TutorProvider>
    </LearnProvider>
  );
}
