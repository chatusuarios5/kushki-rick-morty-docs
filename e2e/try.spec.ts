import { expect, test, type Page } from "@playwright/test";

/**
 * La consola llama a la API real desde el navegador. Para que las pruebas no dependan del límite
 * de peticiones de la API (429 sin CORS), Playwright hace la petición real fuera del navegador,
 * reintenta los 429 y entrega la respuesta auténtica (status, cuerpo y cabeceras) a la página.
 */
async function routeApiWithRetry(page: Page) {
  await page.route(/rickandmortyapi\.com\/api\/character\/[^/]+$/, async (route) => {
    for (let attempt = 0; ; attempt++) {
      const response = await route.fetch();
      if (response.status() !== 429 || attempt >= 5) {
        await route.fulfill({ response, headers: { ...response.headers(), "access-control-allow-origin": "*" } });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  });
}

test.beforeEach(async ({ page }) => {
  await routeApiWithRetry(page);
});

test.describe("Try it out", () => {
  test("consulta un personaje y muestra la respuesta", async ({ page }) => {
    await page.goto("/try");
    await expect(page.getByText("Aún no hay respuesta")).toBeVisible();

    const input = page.getByLabel("ID del personaje");
    await input.fill("2");
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByText("Morty Smith")).toBeVisible();
    await expect(page.getByText("200 OK")).toBeVisible();
    await expect(page).toHaveURL(/\/try\?id=2$/);

    await page.getByRole("tab", { name: "Body" }).click();
    await expect(page.getByText('"Morty Smith"')).toBeVisible();
    await page.getByRole("tab", { name: /Headers/ }).click();
    await expect(page.getByRole("rowheader", { name: "content-type" })).toBeVisible();
  });

  test("ejecuta automáticamente el ID de la URL y navega con las flechas", async ({ page }) => {
    await page.goto("/try?id=1");
    await expect(page.getByText("Rick Sanchez").first()).toBeVisible();
    await page.getByRole("button", { name: "ID siguiente" }).click();
    await expect(page.getByText("Morty Smith").first()).toBeVisible();
    await expect(page).toHaveURL(/id=2$/);
  });

  test("muestra el 404 de un personaje inexistente", async ({ page }) => {
    await page.goto("/try");
    await page.getByRole("button", { name: /9999/ }).click();
    await expect(page.getByText("Personaje no encontrado. Intenta con otro ID.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Respuesta" }).getByText(/^404/)).toBeVisible();
  });

  test("valida IDs no numéricos sin enviar la petición", async ({ page }) => {
    await page.goto("/try");
    await page.getByLabel("ID del personaje").fill("abc");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.locator("#try-id-error")).toHaveText("El ID debe ser un número entero mayor que 0.");
    await expect(page.getByText("Aún no hay respuesta")).toBeVisible();
  });
});

test.describe("Navegación", () => {
  test("la búsqueda de la barra lleva a la ficha del personaje", async ({ page, isMobile }) => {
    await page.goto("/docs");
    await page.getByRole("button", { name: "Buscar personaje por ID" }).click();
    await page.locator("#nav-search").fill("3");
    await page.locator("#nav-search").press("Enter");
    await expect(page).toHaveURL(/\/character\/3$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Summer/i);
    test.info().annotations.push({ type: "viewport", description: isMobile ? "mobile" : "desktop" });
  });
});
