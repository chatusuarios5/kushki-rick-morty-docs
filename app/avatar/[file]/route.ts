import { API_BASE_URL } from "@/lib/rickandmorty";
import { createCache, fetchUpstream } from "@/lib/upstream";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// ~830 avatares de ~15 KB: caben todos en memoria sin problema.
const cache = createCache<{ body: ArrayBuffer; type: string }>(900, WEEK_MS);

/**
 * Avatares de personaje servidos desde nuestro dominio (p. ej. /avatar/1.jpeg).
 * Se piden a la API una sola vez, con cola y reintentos, y se entregan con caché inmutable:
 * el navegador y la CDN no vuelven a pedirlos, y el límite de peticiones de la API deja de afectar.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^(\d{1,4})\.jpeg$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  try {
    const image = await cache(match[1], async () => {
      const response = await fetchUpstream(`${API_BASE_URL}/character/avatar/${match[1]}.jpeg`);
      if (!response.ok) throw new Error(String(response.status));
      return { body: await response.arrayBuffer(), type: response.headers.get("content-type") ?? "image/jpeg" };
    });

    return new Response(image.body, {
      headers: {
        "Content-Type": image.type,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    const status = (error as Error).message === "404" ? 404 : 503;
    return new Response(status === 404 ? "Not found" : "Upstream unavailable", {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
