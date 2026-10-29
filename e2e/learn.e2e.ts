import { expect, test, type Page } from "@playwright/test";

// The check question whose prompt matches, with its own "Comprobar" button and result.
const questionForm = (page: Page, prompt: RegExp) =>
  page
    .locator("form")
    .filter({ visible: true })
    .filter({ has: page.getByRole("group", { name: prompt }) });

test.describe("force lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aprende");
  });

  test("writes the formula with its numbers and divides the force by four at twice the distance", async ({ page }) => {
    await expect(page.getByRole("img", { name: /masas 4 y 4 a una distancia de 4: .* 1 G/ })).toBeVisible();
    await expect(page.getByText(/= G · 4 · 4 \/ 4² = 1 G/)).toBeVisible();
    await page.getByRole("button", { name: "Duplicar la distancia" }).click();
    await expect(page.getByRole("slider", { name: /Distancia entre los dos/ })).toHaveValue("8");
    await expect(page.getByText(/= G · 4 · 4 \/ 8² = 0,25 G/)).toBeVisible();
    await expect(page.getByText("La fuerza es 4 veces menor que antes.")).toBeVisible();
  });

  test("changes a mass from the keyboard", async ({ page }) => {
    const mass = page.getByRole("slider", { name: /Masa del primer cuerpo/ });
    await mass.focus();
    await page.keyboard.press("ArrowRight");
    await expect(mass).toHaveValue("5");
    await expect(page.getByText("La fuerza se ha multiplicado por 1,25 respecto al valor anterior.")).toBeVisible();
  });
});

test("corrects a check question with its fixed explanation", async ({ page }) => {
  await page.goto("/aprende");
  const form = questionForm(page, /Si duplicas la distancia/);
  await form.getByRole("radio", { name: "Se reduce a la mitad" }).check();
  await form.getByRole("button", { name: "Comprobar" }).click();
  await expect(form.getByRole("status")).toContainText("No es eso.");
  await expect(form.getByRole("status")).toContainText("La respuesta es: se reduce a la cuarta parte.");
  await form.getByRole("radio", { name: "Se reduce a la cuarta parte" }).check();
  await form.getByRole("button", { name: "Comprobar" }).click();
  await expect(form.getByRole("status")).toContainText("¡Correcto!");
});

test.describe("orbit launcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aprende");
  });

  test("tells a fall, an orbit and an escape apart by the launch speed", async ({ page }) => {
    const speed = page.getByRole("slider", { name: /Velocidad de lanzamiento/ });
    await expect(page.getByText(/^Órbita circular/)).toBeVisible();
    await speed.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(speed).toHaveAttribute("aria-valuetext", "95 % de la velocidad de una órbita circular");
    await expect(page.getByText(/^Órbita elíptica: cae hasta/)).toBeVisible();
    await page.keyboard.press("Home");
    await expect(page.getByText(/choca con ella/)).toBeVisible();
    await page.keyboard.press("End");
    await expect(page.getByText(/^Se escapa: la estrella lo va frenando/)).toBeVisible();
  });

  test("launches the planet and stops it on request", async ({ page }) => {
    await page.getByRole("button", { name: "Lanzar" }).click();
    const stop = page.getByRole("button", { name: "Parar" });
    await expect(stop).toBeVisible();
    await stop.click();
    await expect(page.getByRole("button", { name: "Lanzar" })).toBeVisible();
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("draws the whole launch at once instead of animating it", async ({ page }) => {
    await page.goto("/aprende");
    await page.getByRole("button", { name: "Lanzar" }).click();
    await expect(page.getByRole("button", { name: "Lanzar" })).toBeVisible();
    const points = await page.locator("svg polyline").filter({ visible: true }).getAttribute("points");
    expect(points?.trim().split(" ").length).toBeGreaterThan(1000);
  });
});
