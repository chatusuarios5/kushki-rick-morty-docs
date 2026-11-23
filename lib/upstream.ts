import "server-only";

/**
 * Acceso a la API pública desde el servidor, con:
 *  - un límite de peticiones simultáneas (la API responde 429 ante ráfagas),
 *  - reintentos con espera creciente ante 429/5xx, respetando Retry-After,
 *  - una caché en memoria para no volver a pedir lo que ya tenemos.
 * Así cada recurso se pide a la API una sola vez y luego se sirve a todos los usuarios.
 */

const MAX_CONCURRENT = 4;
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 600;

let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
    waiting.shift()?.();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = Number(response?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10_000);
  return BASE_DELAY_MS * 2 ** attempt + Math.random() * 300;
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Descarga con cola y reintentos. Devuelve la respuesta final (ok, o un error no reintentable).
 * Con `revalidateSeconds`, usa la caché de datos de Next (que solo guarda respuestas 200),
 * de modo que las páginas que lo usan siguen siendo estáticas/ISR.
 */
export async function fetchUpstream(url: string, revalidateSeconds?: number): Promise<Response> {
  let lastResponse: Response | null = null;
  const init: RequestInit & { next?: { revalidate: number } } =
    revalidateSeconds === undefined ? { cache: "no-store" } : { next: { revalidate: revalidateSeconds } };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await withSlot(() => fetch(url, { ...init, signal: AbortSignal.timeout(15_000) }));
      if (response.ok || (response.status !== 429 && response.status < 500)) return response;
      lastResponse = response;
    } catch {
      lastResponse = null; // Error de red: también se reintenta.
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(retryDelay(lastResponse, attempt));
  }

  throw new UpstreamError("La API de Rick and Morty no respondió tras varios intentos.", lastResponse?.status ?? 502);
}

/** Caché en memoria con tamaño máximo y caducidad; deduplica peticiones simultáneas al mismo recurso. */
export function createCache<T>(maxEntries: number, ttlMs: number) {
  const entries = new Map<string, { value: T; expires: number }>();
  const inflight = new Map<string, Promise<T>>();

  return async function cached(key: string, load: () => Promise<T>): Promise<T> {
    const hit = entries.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;

    const pending = inflight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((value) => {
        entries.delete(key);
        entries.set(key, { value, expires: Date.now() + ttlMs });
        if (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  };
}
