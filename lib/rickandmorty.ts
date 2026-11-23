/**
 * Cliente mínimo y tipado para la API pública de Rick and Morty.
 * Los tipos reflejan las respuestas reales verificadas contra la API.
 */

export const API_BASE_URL = "https://rickandmortyapi.com/api";

export type CharacterStatus = "Alive" | "Dead" | "unknown";
export type CharacterGender = "Female" | "Male" | "Genderless" | "unknown";

export interface LocationRef {
  /** Nombre del lugar, o "unknown" si no se conoce. */
  name: string;
  /** URL del recurso de ubicación, o cadena vacía si no se conoce. */
  url: string;
}

export interface Character {
  id: number;
  name: string;
  status: CharacterStatus;
  species: string;
  /** Subespecie o variante; cadena vacía cuando no aplica. */
  type: string;
  gender: CharacterGender;
  origin: LocationRef;
  location: LocationRef;
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface CharacterPage {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: Character[];
}

export type CharacterResult =
  | { kind: "found"; character: Character }
  | { kind: "not_found" };

export function characterUrl(id: number | string): string {
  return `${API_BASE_URL}/character/${id}`;
}

/**
 * Convierte la entrada del usuario en un ID válido (entero positivo).
 * Devuelve null si la entrada no es válida, para no enviar peticiones
 * que la API respondería con un 500 (por ejemplo, "abc").
 */
export function parseCharacterId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const id = Number(trimmed);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Rutas propias que sirven datos e imágenes desde caché (ver app/api/characters y app/avatar). */
export const LOCAL_CHARACTERS_ENDPOINT = "/api/characters";

/** Convierte una URL de página de la API ("…/character/?page=2&status=dead") en la ruta propia equivalente. */
export function localPageUrl(url: string | null): string | null {
  if (!url) return null;
  const { pathname, search } = new URL(url, "http://local");
  return pathname.startsWith(LOCAL_CHARACTERS_ENDPOINT) ? pathname + search : LOCAL_CHARACTERS_ENDPOINT + search;
}

const AVATAR_PATTERN = /^https:\/\/rickandmortyapi\.com\/api\/character\/avatar\/(\d+)\.jpeg$/;

/** Los avatares se sirven desde /avatar/{id}.jpeg, con caché propia, en vez de pedirlos a la API. */
export function avatarSrc(url: string): string {
  const match = AVATAR_PATTERN.exec(url);
  return match ? `/avatar/${match[1]}.jpeg` : url;
}

// Las lecturas desde el servidor (getCharacter, getFirstCharacters) viven en characters.server.ts.

const RETRY_DELAYS_MS = [800, 2000, 5000];

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Pide una página del listado desde el navegador (scroll infinito), a través de /api/characters.
 * Si el servidor no logra respuesta de la API (503) o hay un corte de red, se reintenta con
 * espera creciente antes de mostrar el error al usuario.
 */
export async function fetchCharacterPage(url: string, signal?: AbortSignal): Promise<CharacterPage> {
  for (let attempt = 0; ; attempt++) {
    let retryable: boolean;
    let failure: Error;

    try {
      const response = await fetch(url, { signal });
      if (response.ok) return (await response.json()) as CharacterPage;
      retryable = response.status === 429 || response.status >= 500;
      failure = new Error(`La API de Rick and Morty respondió con ${response.status}.`);
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      retryable = error instanceof TypeError; // Error de red o CORS.
      failure = error as Error;
    }

    if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw failure;
    await wait(RETRY_DELAYS_MS[attempt], signal);
  }
}
