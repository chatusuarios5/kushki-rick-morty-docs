import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_URL } from "@/lib/rickandmorty";
import { UpstreamError, createCache, fetchUpstream } from "@/lib/upstream";

const STATUSES = new Set(["alive", "dead", "unknown"]);
const DAY_MS = 24 * 60 * 60 * 1000;
const cache = createCache<{ status: number; body: string }>(200, DAY_MS);

/**
 * Listado paginado de personajes, servido desde nuestro dominio.
 * La galería con scroll infinito lo usa en lugar de llamar a la API directamente: así las páginas
 * quedan en caché (servidor y CDN) y los usuarios no chocan con el límite de peticiones de la API.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page") ?? "1");
  const status = params.get("status");

  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) {
    return NextResponse.json({ error: "El parámetro page debe ser un entero positivo." }, { status: 400 });
  }
  if (status !== null && !STATUSES.has(status)) {
    return NextResponse.json({ error: "status debe ser alive, dead o unknown." }, { status: 400 });
  }

  const upstream = new URL(`${API_BASE_URL}/character`);
  upstream.searchParams.set("page", String(page));
  if (status) upstream.searchParams.set("status", status);

  try {
    const result = await cache(upstream.toString(), async () => {
      const response = await fetchUpstream(upstream.toString());
      return { status: response.status, body: await response.text() };
    });

    // Reescribimos los enlaces "next"/"prev" para que apunten a esta misma ruta.
    const body = result.body.replaceAll(`${API_BASE_URL}/character/?`, "/api/characters?").replaceAll(
      `${API_BASE_URL}/character?`,
      "/api/characters?",
    );

    return new NextResponse(body, {
      status: result.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control":
          result.status === 200 ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof UpstreamError ? 503 : 500;
    return NextResponse.json({ error: (error as Error).message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
