import { expect, test, type Locator, type Page } from "@playwright/test";

const position = (page: Page) => page.getByRole("slider", { name: "Posición en el periodo" });

const widthOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("the element is not on screen");
  return box.width;
};

test.describe("orbit player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/galeria/figura-de-ocho");
  });

  test("starts playing once the orbit is computed", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
    const start = Number(await position(page).inputValue());
    await expect.poll(async () => Number(await position(page).inputValue())).toBeGreaterThan(start);
  });

  test("pauses and resumes with the keyboard", async ({ page }) => {
    const pause = page.getByRole("button", { name: "Pausar" });
    await pause.focus();
    await page.keyboard.press("Space");
    const play = page.getByRole("button", { name: "Reproducir" });
    await expect(play).toBeFocused();
    const stopped = await position(page).inputValue();
    await page.waitForTimeout(400);
    await expect(position(page)).toHaveValue(stopped);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  });

  test("moves through the period, changes speed and hides the trails from the keyboard", async ({ page }) => {
    await page.getByRole("button", { name: "Pausar" }).click();

    const slider = position(page);
    await slider.focus();
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("1");
    await expect(slider).toHaveAttribute("aria-valuetext", "Tiempo 0,03 de 6,33");

    await page.getByRole("radio", { name: "1×" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "2×" })).toBeChecked();

    const trails = page.getByRole("checkbox", { name: "Estelas" });
    await expect(trails).toBeChecked();
    await trails.focus();
    await page.keyboard.press("Space");
    await expect(trails).not.toBeChecked();

    await page.getByRole("button", { name: "Reiniciar" }).click();
    await expect(slider).toHaveValue("0");
  });
});

test("keeps the time reading and the slider the same width as the time runs", async ({ page }) => {
  // Goggles' period has two whole digits, so the reading goes from 0,00 to 10,46.
  await page.goto("/galeria/goggles");
  await page.getByRole("button", { name: "Pausar" }).click();
  const slider = position(page);
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  const readingAtStart = page.getByText("0,00 / 10,46", { exact: true });
  await expect(readingAtStart).toBeVisible();
  const sliderAtStart = await widthOf(slider);
  const readingWidth = await widthOf(readingAtStart);
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("200");
  // On a narrow screen the reading wraps below the slider, so its own width is checked too.
  expect(await widthOf(slider)).toBeCloseTo(sliderAtStart, 0);
  const readingAtEnd = page.getByText("10,46 / 10,46", { exact: true }).filter({ visible: true });
  expect(await widthOf(readingAtEnd)).toBeCloseTo(readingWidth, 0);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("waits paused, with the whole orbit drawn, until asked to play", async ({ page }) => {
    await page.goto("/galeria/figura-de-ocho");
    const play = page.getByRole("button", { name: "Reproducir" });
    await expect(play).toBeEnabled();
    await expect(page.getByText("Tu sistema pide reducir el movimiento")).toBeVisible();
    await page.waitForTimeout(400);
    await expect(position(page)).toHaveValue("0");
    await play.click();
    await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  });
});
