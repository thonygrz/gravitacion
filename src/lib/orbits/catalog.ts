import type { Body } from "../physics/body";
import { vec2 } from "../physics/vector";

export interface OrbitSource {
  readonly label: string;
  readonly url?: string;
}

export interface PeriodicOrbit {
  /** URL segment of the orbit's page. */
  readonly slug: string;
  readonly name: string;
  /** One or two sentences, for the gallery card and the detail page. */
  readonly summary: string;
  /**
   * Time after which the published initial conditions come back to themselves,
   * measured with our integrator (see the catalog tests). The animation loops over it.
   */
  readonly period: number;
  /** Period as printed in the source, to four decimals; absent when derived analytically. */
  readonly publishedPeriod?: number;
  readonly initialBodies: readonly Body[];
  readonly source: OrbitSource;
}

// Šuvakov and Dmitrašinović start every orbit from the same collinear "Euler
// point": bodies at x = -1, 1 and 0 with velocities v, v and -2v, so the centre
// of mass stays at rest and each orbit is described by v alone.
function fromEulerPoint(vx: number, vy: number): Body[] {
  const v = vec2(vx, vy);
  return [
    { mass: 1, position: vec2(-1, 0), velocity: v },
    { mass: 1, position: vec2(1, 0), velocity: v },
    { mass: 1, position: vec2(0, 0), velocity: vec2(-2 * vx, -2 * vy) },
  ];
}

// Lagrange's equilateral solution with unit radius: each body is pulled toward
// the centre with G·m²/(√3·r²), so the rigid rotation needs v² = G·m/(√3·r).
const LAGRANGE_SPEED = 3 ** -0.25;

function lagrangeTriangle(): Body[] {
  return [90, 210, 330].map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    const radial = vec2(Math.cos(angle), Math.sin(angle));
    return {
      mass: 1,
      position: radial,
      velocity: vec2(-radial.y * LAGRANGE_SPEED, radial.x * LAGRANGE_SPEED),
    };
  });
}

const PRL_2013: OrbitSource = {
  label: "Šuvakov y Dmitrašinović, Phys. Rev. Lett. 110, 114301 (2013), tabla I",
  url: "https://arxiv.org/abs/1303.0181",
};

export const ORBITS: readonly PeriodicOrbit[] = [
  {
    slug: "lagrange",
    name: "Lagrange",
    summary:
      "Los tres cuerpos forman un triángulo equilátero rígido que gira a velocidad constante: cada uno recorre la misma circunferencia.",
    period: (2 * Math.PI) / LAGRANGE_SPEED,
    initialBodies: lagrangeTriangle(),
    source: {
      label: "Lagrange (1772), triángulo equilátero en rotación; condiciones derivadas analíticamente",
    },
  },
  {
    slug: "figura-de-ocho",
    name: "Figura de ocho",
    summary:
      "Los tres cuerpos se persiguen por una misma curva con forma de ocho, cada uno un tercio de periodo por detrás del anterior.",
    period: 6.325897,
    publishedPeriod: 6.325,
    initialBodies: fromEulerPoint(0.3471128135672417, 0.532726851767674),
    source: {
      label: "Šuvakov (2013), arXiv:1312.7002, tabla I, órbita M8 (Moore, 1993)",
      url: "https://arxiv.org/abs/1312.7002",
    },
  },
  {
    slug: "butterfly-i",
    name: "Butterfly I",
    summary:
      "Los cuerpos que empiezan en los extremos trazan bucles a izquierda y derecha, y el del centro va y viene entre ellos con lazos alargados.",
    period: 6.23466,
    publishedPeriod: 6.2356,
    initialBodies: fromEulerPoint(0.30689, 0.12551),
    source: PRL_2013,
  },
  {
    slug: "goggles",
    name: "Goggles",
    summary:
      "Dos cuerpos dibujan anillos a cada lado y el tercero cruza una y otra vez por el centro, entre ellos.",
    period: 10.464852,
    publishedPeriod: 10.4668,
    initialBodies: fromEulerPoint(0.0833, 0.12789),
    source: PRL_2013,
  },
  {
    slug: "moth-i",
    name: "Moth I",
    summary:
      "Dos cuerpos trazan lazos en esquinas opuestas y el tercero describe grandes bucles alrededor del centro.",
    period: 14.894026,
    publishedPeriod: 14.8939,
    initialBodies: fromEulerPoint(0.46444, 0.39606),
    source: PRL_2013,
  },
  {
    slug: "yin-yang-i",
    name: "Yin-Yang I",
    summary:
      "Dos cuerpos giran en mitades opuestas del plano y el tercero las enlaza con lazos que se cruzan en el centro.",
    period: 17.329052,
    publishedPeriod: 17.3284,
    initialBodies: fromEulerPoint(0.51394, 0.30474),
    source: PRL_2013,
  },
];

export const findOrbit = (slug: string): PeriodicOrbit | undefined =>
  ORBITS.find((orbit) => orbit.slug === slug);
