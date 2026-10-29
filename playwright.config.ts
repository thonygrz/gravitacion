import { defineConfig, devices } from "@playwright/test";

// A port of its own, so the tests never pick up a `next dev` left running on 3000.
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // Not *.spec.ts or *.test.ts: Vitest would collect those too.
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  // With four workers, the browsers, their orbit workers and the server compete for the
  // CPU and Firefox stalls for seconds; with two the whole run passed and was faster
  // (1.7 instead of about 2 minutes, measured on 28/10/2026 on 8 logical cores).
  workers: 2,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // The Chrome installed on the machine, at the three widths of the verification matrix.
    {
      name: "chrome-1280",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chrome-768",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 768, height: 1024 } },
    },
    {
      name: "chrome-375-touch",
      use: { ...devices["Pixel 7"], channel: "chrome", viewport: { width: 375, height: 740 } },
    },
    // Playwright's own Firefox build (`npx playwright install firefox`). On Windows it
    // sometimes hangs closing a browser context once a test has finished ("can't access
    // property _maybeDontRestoreTabs"), more often with several contexts at once: it runs
    // one test at a time and gets one retry, which the report marks as flaky.
    {
      name: "firefox-1280",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } },
      workers: 1,
      retries: 1,
    },
    // Playwright's WebKit build (`npx playwright install webkit`), the engine of Safari, with
    // the profile of an iPhone 15 Pro Max held upright: 430 px wide, touch and a mobile viewport.
    {
      name: "webkit-430-iphone",
      use: { ...devices["iPhone 15 Pro Max"] },
      // On Windows this WebKit has an orbit ready in 1.1 to 2 s (desktop Chrome, in 0.3 to 0.4),
      // and under the load of a run it once took over the default 5 s (measured on 29/10/2026).
      expect: { timeout: 15_000 },
    },
  ],
  webServer: {
    // The production build of the code as it is now, which is what gets deployed. A
    // server already on the port is never reused: it could be serving an older build
    // (it happened on 29/10/2026), so a busy port fails the run instead.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    // No API key, whatever .env.local holds: Next.js never overrides a variable that is
    // already set, even to an empty string. The tutor stays in its reduced mode, and the
    // tests that need the model answer for it in the browser.
    env: { ANTHROPIC_API_KEY: "" },
  },
});
