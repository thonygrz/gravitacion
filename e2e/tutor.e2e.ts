import { expect, test, type Page } from "@playwright/test";
import { TUTOR_ERRORS } from "../src/lib/tutor/errors";

// The server under test has no API key (playwright.config.ts). Where a test needs the
// model, the browser answers /api/tutor itself, so no run ever reaches the provider.

const SSE_HEADERS = { "content-type": "text/event-stream", "cache-control": "no-cache", "x-vercel-ai-ui-message-stream": "v1" };

const stream = (chunks: readonly object[]) => [...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`), "data: [DONE]\n\n"].join("");

const textAnswer = (text: string) =>
  stream([
    { type: "start" },
    { type: "start-step" },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
    { type: "finish-step" },
    { type: "finish" },
  ]);

const doubleDistance = stream([
  { type: "start" },
  { type: "start-step" },
  { type: "tool-input-start", toolCallId: "c1", toolName: "setLab" },
  { type: "tool-input-available", toolCallId: "c1", toolName: "setLab", input: { distance: 8 } },
  { type: "finish-step" },
  { type: "finish" },
]);

/** Plays the model: answers each request with the next stream and keeps the bodies sent. */
async function playTutor(page: Page, answers: readonly string[]): Promise<unknown[]> {
  const bodies: unknown[] = [];
  await page.route("**/api/tutor", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, headers: SSE_HEADERS, body: answers[bodies.length - 1] ?? textAnswer("De nada.") });
  });
  return bodies;
}

const tutorPanel = (page: Page) => page.getByRole("region", { name: "Pregúntale al tutor" });

const questionForm = (page: Page, prompt: RegExp) =>
  page
    .locator("form")
    .filter({ visible: true })
    .filter({ has: page.getByRole("group", { name: prompt }) });

test("without a key, says so and leaves the fixed corrections working", async ({ page, request }) => {
  expect(await (await request.get("/api/tutor")).json()).toEqual({ available: false });
  await page.goto("/aprende");
  const tutor = tutorPanel(page);
  await expect(tutor.getByText(/El tutor no está disponible en esta copia de la web/)).toBeVisible();
  await expect(tutor.getByRole("textbox")).toHaveCount(0);

  const form = questionForm(page, /Si triplicas la masa/);
  await form.getByRole("radio", { name: "Se multiplica por 9" }).check();
  await form.getByRole("button", { name: "Comprobar" }).click();
  await expect(form.getByRole("status")).toContainText("No es eso.");
  await expect(form.getByRole("button", { name: "Pregúntale al tutor por qué" })).toHaveCount(0);
});

test("changes the lab through a tool and sends the result back to the model", async ({ page }) => {
  const bodies = await playTutor(page, [doubleDistance, textAnswer("Con el doble de distancia, la fuerza es la cuarta parte.")]);
  await page.goto("/aprende");
  const tutor = tutorPanel(page);
  await tutor.getByRole("textbox", { name: "Tu pregunta" }).fill("Duplica la distancia");
  await tutor.getByRole("button", { name: "Enviar" }).click();

  await expect(tutor.getByText("Con el doble de distancia, la fuerza es la cuarta parte.")).toBeVisible();
  await expect(tutor.getByText(/Laboratorio cambiado: masas 4 y 4, distancia 8, fuerza 0,25 G\./)).toBeVisible();
  await expect(page.getByRole("slider", { name: /Distancia entre los dos/ })).toHaveValue("8");
  await expect(page.getByText(/= G · 4 · 4 \/ 8² = 0,25 G/)).toBeVisible();

  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toMatchObject({
    messages: [
      {
        role: "user",
        parts: [{ type: "text", text: "Duplica la distancia" }],
        metadata: { context: { answers: {}, lab: { mass1: 4, mass2: 4, distance: 4 }, launchSpeed: 1 } },
      },
    ],
  });
  expect(bodies[1]).toMatchObject({
    messages: [
      { role: "user" },
      {
        role: "assistant",
        parts: expect.arrayContaining([
          expect.objectContaining({
            type: "tool-setLab",
            state: "output-available",
            output: { mass1: 4, mass2: 4, distance: 8, force: 0.25, previousForce: 1 },
          }),
        ]),
      },
    ],
  });
});

test("sends a tool result once, also when the model then says nothing", async ({ page }) => {
  // Every answer opens a step, so an empty one ends the run of automatic sends.
  const nothing = stream([{ type: "start" }, { type: "start-step" }, { type: "finish-step" }, { type: "finish" }]);
  const bodies = await playTutor(page, [doubleDistance, nothing, textAnswer("Una de más.")]);
  await page.goto("/aprende");
  const tutor = tutorPanel(page);
  await tutor.getByRole("textbox", { name: "Tu pregunta" }).fill("Duplica la distancia");
  await tutor.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("slider", { name: /Distancia entre los dos/ })).toHaveValue("8");
  await expect(tutor.getByRole("button", { name: "Enviar" })).toBeVisible();
  await expect.poll(() => bodies.length).toBe(2);
  await page.waitForTimeout(500);
  expect(bodies).toHaveLength(2);
});

test("asks the tutor about a wrong answer, with the answers so far", async ({ page }) => {
  const bodies = await playTutor(page, [textAnswer("Cada masa multiplica la fuerza una sola vez.")]);
  await page.goto("/aprende");
  const form = questionForm(page, /Si triplicas la masa/);
  await form.getByRole("radio", { name: "Se multiplica por 9" }).check();
  await form.getByRole("button", { name: "Comprobar" }).click();
  await form.getByRole("button", { name: "Pregúntale al tutor por qué" }).click();

  await expect(tutorPanel(page).getByText("Cada masa multiplica la fuerza una sola vez.")).toBeVisible();
  await expect(form.getByRole("button", { name: "Pregunta enviada al tutor" })).toBeDisabled();
  expect(bodies[0]).toMatchObject({
    messages: [
      {
        parts: [{ text: expect.stringContaining("he contestado «Se multiplica por 9». ¿Por qué no es correcto?") }],
        metadata: { context: { answers: { mass: false } } },
      },
    ],
  });
});

test("shows the tutor's own message when a request fails, and a generic one otherwise", async ({ page }) => {
  const failures = [
    { status: 413, body: TUTOR_ERRORS.tooLong },
    { status: 502, body: "Bad gateway" },
  ];
  await page.route("**/api/tutor", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
    const failure = failures.shift() ?? { status: 500, body: "" };
    return route.fulfill({ status: failure.status, contentType: "text/plain", body: failure.body });
  });
  await page.goto("/aprende");
  const tutor = tutorPanel(page);
  const input = tutor.getByRole("textbox", { name: "Tu pregunta" });

  await input.fill("Hola");
  await tutor.getByRole("button", { name: "Enviar" }).click();
  await expect(tutor.getByRole("alert")).toHaveText(TUTOR_ERRORS.tooLong);

  await input.fill("¿Sigues ahí?");
  await tutor.getByRole("button", { name: "Enviar" }).click();
  await expect(tutor.getByRole("alert")).toHaveText(TUTOR_ERRORS.failed);
});
