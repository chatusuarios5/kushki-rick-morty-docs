import { expect, test } from "@playwright/test";

test.describe("Portada", () => {
  test("muestra el escenario principal y la navegación", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /Rick and Morty/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Probar la API" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver documentación" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Try it out" })).toBeVisible();
  });

  test("carga más personajes al hacer scroll, sin duplicados", async ({ page }) => {
    await page.goto("/");
    const cards = page.getByTestId("character-grid").locator("li a");
    await expect(cards).toHaveCount(20);

    // Bajamos hasta el final varias veces: cada vez debe llegar una página nueva.
    for (const expected of [40, 60]) {
      await page.mouse.wheel(0, 20_000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(cards).toHaveCount(expected);
    }

    const hrefs = await cards.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    await expect(page.getByRole("progressbar", { name: "Personajes cargados" })).toHaveAttribute("aria-valuenow", "60");
  });

  test("scroll largo: las imágenes llegan por la caché propia y no se rompen", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    const grid = page.getByTestId("character-grid");
    const cards = grid.locator("li a");

    for (let expected = 40; expected <= 160; expected += 20) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(cards).toHaveCount(expected, { timeout: 30_000 });
    }
    await expect(page.getByText("La API está limitando las peticiones")).toHaveCount(0);

    // Los avatares se sirven desde /avatar/{id}.jpeg (caché propia), no directamente desde la API.
    const sources = await grid
      .locator("img")
      .evaluateAll((imgs) => imgs.map((img) => new URL(img.getAttribute("src") ?? "", location.href)));
    expect(sources.length).toBeGreaterThan(0);
    for (const url of sources) {
      expect(url.origin).toBe(new URL(page.url()).origin);
      expect(url.pathname).toMatch(/^\/avatar\/\d+\.jpeg$/);
    }

    // Las imágenes visibles al final del recorrido deben terminar de cargar sin romperse.
    await page.waitForTimeout(1500);
    const broken = await grid.locator("img").evaluateAll((elements) =>
      (elements as HTMLImageElement[])
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute("alt")),
    );
    expect(broken).toEqual([]);
  });

  test("filtra por estado", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Muertos" }).click();
    const grid = page.getByTestId("character-grid");
    await expect(grid.locator("li a").first()).toBeVisible();
    const labels = await grid.locator("li a [title^='status']").allTextContents();
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((label) => label.includes("Muerto"))).toBe(true);

    await page.getByRole("tab", { name: "Todos" }).click();
    await expect(grid.locator("li a")).toHaveCount(20);
  });
});
