// Capturas de pantalla para revisar el diseño: node e2e/screenshots.mjs [carpeta]
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const outDir = path.resolve(process.argv[2] ?? "test-results/screens");
const base = process.env.BASE_URL ?? "http://localhost:3000";

const shots = [
  { name: "home", url: "/", full: false },
  { name: "home-full", url: "/", full: true },
  { name: "try-empty", url: "/try", full: false },
  { name: "try-result", url: "/try?id=1", full: false, wait: "text=Rick Sanchez" },
  { name: "docs", url: "/docs", full: false },
  { name: "character", url: "/character/1", full: false },
  { name: "not-found", url: "/character/999999", full: false },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const viewport of [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  for (const shot of shots) {
    if (viewport.label === "mobile" && shot.full) continue;
    await page.goto(base + shot.url, { waitUntil: "networkidle" });
    if (shot.wait) await page.waitForSelector(shot.wait);
    await page.waitForTimeout(600);
    const file = path.join(outDir, `${viewport.label}-${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: shot.full });
    console.log(file);
  }
  await page.close();
}

await browser.close();
