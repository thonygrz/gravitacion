import { expect, test, type Page } from "@playwright/test";

// Every query goes through getByRole: pages hidden by React Activity stay in the DOM
// with display: none, and role queries skip them.

const ORBITS = [
  ["Lagrange", "/galeria/lagrange"],
  ["Figura de ocho", "/galeria/figura-de-ocho"],
  ["Butterfly I", "/galeria/butterfly-i"],
  ["Goggles", "/galeria/goggles"],
  ["Moth I", "/galeria/moth-i"],
  ["Yin-Yang I", "/galeria/yin-yang-i"],
] as const;

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

// Sorts by period and scrolls to the bottom, so there is state worth restoring, then
// opens Yin-Yang I, the last card in either order. Returns the scroll position it left.
async function leaveGalleryWithState(page: Page) {
  await page.goto("/galeria");
  await page.getByRole("radio", { name: "Periodo" }).check();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const left = await scrollY(page);
  expect(left).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Yin-Yang I" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Yin-Yang I" })).toBeVisible();
  return left;
}

async function expectGalleryAsLeft(page: Page, left: number) {
  await expect(page.getByRole("heading", { level: 1, name: "Galería de órbitas periódicas" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Periodo" })).toBeChecked();
  await expect.poll(() => scrollY(page)).toBe(left);
  await expect(page.getByRole("link", { name: "Yin-Yang I" })).toBeFocused();
}

test("lists the six orbits, each with its own address", async ({ page }) => {
  await page.goto("/galeria");
  for (const [name, href] of ORBITS) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("orders the orbits by period on request", async ({ page }) => {
  await page.goto("/galeria");
  const titles = page.getByRole("heading", { level: 2 });
  await expect(titles).toHaveText(ORBITS.map(([name]) => name));
  await page.getByRole("radio", { name: "Periodo" }).check();
  await expect(titles).toHaveText(["Butterfly I", "Figura de ocho", "Lagrange", "Goggles", "Moth I", "Yin-Yang I"]);
});

test("keeps the order, the scroll position and the focus when coming back by the link", async ({ page }) => {
  const left = await leaveGalleryWithState(page);
  await page.getByRole("link", { name: "Volver a la galería" }).click();
  await expectGalleryAsLeft(page, left);
});

test("keeps the order, the scroll position and the focus when coming back with the browser", async ({ page }) => {
  const left = await leaveGalleryWithState(page);
  await page.goBack();
  await expectGalleryAsLeft(page, left);
});

test("keeps the gallery as it was after going through several orbits", async ({ page }) => {
  const left = await leaveGalleryWithState(page);
  for (const name of ["Moth I", "Goggles", "Lagrange"]) {
    await page.getByRole("navigation", { name: "Otras órbitas" }).getByRole("link", { name }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  }
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Galería" }).click();
  await expectGalleryAsLeft(page, left);
});

test("opens an orbit directly from its address", async ({ page }) => {
  await page.goto("/galeria/goggles");
  await expect(page.getByRole("heading", { level: 1, name: "Goggles" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Simulación de la órbita Goggles/ })).toBeVisible();
});

test("answers 404 for an orbit that does not exist", async ({ page }) => {
  const response = await page.goto("/galeria/no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "No encontramos esta página" })).toBeVisible();
});
