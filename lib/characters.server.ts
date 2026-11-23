import "server-only";

import { API_BASE_URL, characterUrl, type Character, type CharacterPage, type CharacterResult } from "./rickandmorty";
import { createCache, fetchUpstream } from "./upstream";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Datos estables: la API los sirve con caché de 90 días, así que basta con revalidar a diario. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

/**
 * Lecturas de la API desde el servidor (páginas y /api/summary).
 * Usan la misma cola con reintentos y caché que el proxy: si la API limita peticiones (429),
 * se espera y se reintenta, y lo ya obtenido se sirve desde memoria durante un día.
 */
const characterCache = createCache<CharacterResult>(1000, DAY_MS);
const pageCache = createCache<CharacterPage>(50, DAY_MS);

export function getCharacter(id: number): Promise<CharacterResult> {
  return characterCache(String(id), async () => {
    const response = await fetchUpstream(characterUrl(id), REVALIDATE_SECONDS);
    if (response.status === 404) return { kind: "not_found" };
    if (!response.ok) throw new Error(`La API de Rick and Morty respondió con ${response.status}.`);
    return { kind: "found", character: (await response.json()) as Character };
  });
}

export function getFirstCharacters(): Promise<CharacterPage> {
  return pageCache("1", async () => {
    const response = await fetchUpstream(`${API_BASE_URL}/character`, REVALIDATE_SECONDS);
    if (!response.ok) throw new Error(`La API de Rick and Morty respondió con ${response.status}.`);
    return (await response.json()) as CharacterPage;
  });
}
