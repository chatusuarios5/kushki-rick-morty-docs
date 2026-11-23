import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas e2e. Por defecto, contra el servidor de desarrollo (si ya hay uno en el puerto 3000 se
 * reutiliza; si no, Playwright lo arranca). Con BASE_URL se prueban otros entornos, p. ej. producción:
 *   BASE_URL=https://kushki-rick-morty-docs.vercel.app npm run test:e2e
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const isLocal = baseURL.startsWith("http://localhost");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // Un solo worker: las pruebas usan la API pública real y no queremos saturarla.
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: isLocal
    ? {
        command: "npm run dev -- -p 3000",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
