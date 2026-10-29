import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/aprende",
  "/galeria",
  "/galeria/lagrange",
  "/galeria/figura-de-ocho",
  "/galeria/butterfly-i",
  "/galeria/goggles",
  "/galeria/moth-i",
  "/galeria/yin-yang-i",
];

for (const path of PAGES) {
  test(`${path} fits the width of the window`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test("is in Spanish and starts with a link that skips to the content", async ({ page, browserName }) => {
  await page.goto("/galeria");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  if (browserName === "webkit") {
    // In WebKit, Tab skips links and goes to the first button, and so does Alt+Tab (measured
    // on 29/10/2026). The link is focused directly once it is the first focusable element.
    const firstFocusable = page.locator("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])").first();
    await expect(firstFocusable).toHaveText("Saltar al contenido");
    await skip.focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#contenido");
  // Focusable from the link but kept out of the tab order. Following the link itself is
  // left out: Firefox under Playwright keeps waiting after an in-page navigation.
  await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
  await expect(page.getByRole("main")).toHaveAttribute("tabindex", "-1");
});
