import { tool } from "ai";
import { z } from "zod";

/** The gallery orbits the tutor can link to; a test keeps the list equal to the catalog. */
export const ORBIT_SLUGS = ["lagrange", "figura-de-ocho", "butterfly-i", "goggles", "moth-i", "yin-yang-i"] as const;

export const labOutputSchema = z.object({
  mass1: z.number(),
  mass2: z.number(),
  distance: z.number(),
  force: z.number(),
  previousForce: z.number(),
});

export const launchOutputSchema = z.object({
  percent: z.number(),
  outcome: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("collision"), closest: z.number() }),
    z.object({ kind: z.literal("escape") }),
    z.object({ kind: z.literal("orbit"), closest: z.number(), farthest: z.number(), period: z.number() }),
  ]),
});

export const orbitOutputSchema = z.object({ slug: z.enum(ORBIT_SLUGS), name: z.string() });

/**
 * The tools that operate the page. They have no `execute`: the browser runs them on the
 * page state and sends the output back with the conversation, where `outputSchema`
 * validates it like any other input.
 */
export const tutorTools = {
  setLab: tool({
    description:
      "Cambia el laboratorio de fuerza de la lección 1. Las masas van de 1 a 10 en pasos de 1 y la distancia de 1 a 10 en pasos de 0,5; un valor fuera de rango se ajusta al más cercano. Omite lo que no quieras cambiar. Devuelve los valores aplicados y la fuerza antes y después del cambio, en unidades de G.",
    inputSchema: z.object({
      mass1: z.number().optional().describe("Masa del primer cuerpo"),
      mass2: z.number().optional().describe("Masa del segundo cuerpo"),
      distance: z.number().optional().describe("Distancia entre los centros de los dos cuerpos"),
    }),
    outputSchema: labOutputSchema,
  }),
  setLaunchSpeed: tool({
    description:
      "Pone la velocidad del lanzador de la lección 3, en porcentaje de la velocidad de una órbita circular, de 20 a 160 en pasos de 5. Devuelve qué le pasa al planeta: choca con la estrella, se escapa u orbita, y en ese caso a qué distancias mínima y máxima de la estrella y con qué periodo. Las distancias se miden con la del lanzamiento como unidad (el planeta sale a distancia 1) y el periodo, en unidades de tiempo de la página: la órbita circular tarda 6,3. El usuario lo ve escrito en la página y puede pulsar «Lanzar» para verlo moverse.",
    inputSchema: z.object({ percent: z.number().describe("Porcentaje de la velocidad de una órbita circular") }),
    outputSchema: launchOutputSchema,
  }),
  showOrbit: tool({
    description: "Pone en la conversación un enlace a una de las seis órbitas de la galería de tres cuerpos.",
    inputSchema: z.object({ slug: z.enum(ORBIT_SLUGS).describe("Identificador de la órbita en la galería") }),
    outputSchema: orbitOutputSchema,
  }),
};

export type TutorTools = typeof tutorTools;
