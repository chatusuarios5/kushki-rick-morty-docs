import type { CharacterGender, CharacterStatus } from "./rickandmorty";

/** Traducciones para la interfaz. Los valores originales de la API se muestran siempre junto a ellas. */
export const STATUS_LABELS: Record<CharacterStatus, string> = {
  Alive: "Vivo",
  Dead: "Muerto",
  unknown: "Desconocido",
};

export const GENDER_LABELS: Record<CharacterGender, string> = {
  Female: "Femenino",
  Male: "Masculino",
  Genderless: "Sin género",
  unknown: "Desconocido",
};

export function formatId(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));
}
