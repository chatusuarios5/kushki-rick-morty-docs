import type { Character } from "../rickandmorty";
import { FACT_FIELDS, type CharacterFacts } from "./types";

/**
 * Reduce el JSON del personaje a los datos que tienen valor narrativo.
 * Enviar menos contexto (sin URLs ni fechas) reduce tokens y elimina
 * material que el modelo podría malinterpretar o citar sin sentido.
 */
export function toFacts(character: Character): CharacterFacts {
  return {
    name: character.name,
    status: character.status,
    species: character.species,
    type: character.type,
    gender: character.gender,
    origin: character.origin.name,
    location: character.location.name,
    episodes: String(character.episode.length),
  };
}

export const SYSTEM_INSTRUCTION = `Eres el narrador de un archivo interdimensional que escribe fichas breves para fans de la ciencia ficción.

Reglas estrictas:
1. Usa ÚNICAMENTE los datos del JSON que recibes. No agregues familiares, poderes, eventos, frases célebres ni episodios concretos que no aparezcan en él.
2. Si un valor es "unknown" o una cadena vacía, preséntalo como un misterio. Nunca lo completes con suposiciones.
3. Escribe en español neutro, en exactamente 3 oraciones y con un máximo de 70 palabras.
4. Copia los nombres propios (name, origin y location) exactamente como aparecen en el JSON, sin traducirlos.
5. No escribas números que no estén en el JSON. Si mencionas los episodios, usa el valor de "episodes".
6. Puedes usar metáforas y un tono épico o con humor ácido, pero cada afirmación factual debe salir del JSON.
7. En "claims" lista cada dato del JSON que mencionaste, con el campo y el valor copiado literalmente del JSON.`;

export function buildUserPrompt(facts: CharacterFacts): string {
  return `Basado en los siguientes datos JSON de un personaje, escribe la ficha siguiendo las reglas.\n\n${JSON.stringify(facts, null, 2)}`;
}

/** Esquema de salida estructurada: obliga al modelo a declarar qué datos usó. */
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    claims: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          field: { type: "STRING", enum: [...FACT_FIELDS] },
          value: { type: "STRING" },
        },
        required: ["field", "value"],
      },
    },
  },
  required: ["summary", "claims"],
} as const;
