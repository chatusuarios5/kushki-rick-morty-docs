import { GENDER_LABELS, STATUS_LABELS } from "../labels";
import type { CharacterGender, CharacterStatus } from "../rickandmorty";
import type { CharacterFacts, Claim, GeneratedSummary } from "./types";

/**
 * Resumen simulado para cuando no hay GEMINI_API_KEY.
 * Se construye solo con los datos de la ficha, así que pasa por el mismo
 * verificador que la respuesta real y permite probar todo el flujo.
 */
export function generateMock(facts: CharacterFacts): GeneratedSummary {
  const status = STATUS_LABELS[facts.status as CharacterStatus] ?? facts.status;
  const gender = GENDER_LABELS[facts.gender as CharacterGender] ?? facts.gender;
  const episodes = Number(facts.episodes);
  const claims: Claim[] = [
    { field: "name", value: facts.name },
    { field: "species", value: facts.species },
    { field: "status", value: facts.status },
    { field: "episodes", value: facts.episodes },
  ];

  const origin =
    facts.origin === "unknown"
      ? "un origen que ni los archivos de la Ciudadela han logrado rastrear"
      : `${facts.origin}`;
  if (facts.origin !== "unknown") claims.push({ field: "origin", value: facts.origin });

  const location =
    facts.location === "unknown"
      ? "Su paradero actual es un misterio multiversal"
      : `Hoy su rastro apunta a ${facts.location}`;
  if (facts.location !== "unknown") claims.push({ field: "location", value: facts.location });

  const subtype = facts.type ? `, variante ${facts.type},` : "";
  if (facts.type) claims.push({ field: "type", value: facts.type });

  const episodeText = episodes === 1 ? "1 episodio" : `${episodes} episodios`;

  const summary =
    `${facts.name}${subtype} es un ejemplar de la especie ${facts.species} que surgió de ${origin}. ` +
    `${location}, con estado «${status}» y género «${gender}» según el registro. ` +
    `Su señal aparece en ${episodeText}, suficiente para dejar huella en el multiverso.`;

  claims.push({ field: "gender", value: facts.gender });
  return { summary, claims };
}
