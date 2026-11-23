import "server-only";

import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTION, buildUserPrompt } from "./prompt";
import { FACT_FIELDS, type CharacterFacts, type Claim, type GeneratedSummary } from "./types";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 20_000;

// gemini-2.5-flash ya no está disponible para cuentas nuevas de Google AI Studio.
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Modelos de respaldo, en orden. Los modelos más nuevos sufren picos de demanda (503) frecuentes;
 * si el principal está saturado, se pasa al siguiente en vez de fallar. Se puede cambiar con
 * GEMINI_FALLBACK_MODELS (lista separada por comas).
 */
export const DEFAULT_FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  error?: { message?: string };
}

/** Todos los modelos estaban saturados o no disponibles: se puede degradar a un resumen local. */
export class GeminiUnavailableError extends Error {}

/**
 * Llama a Gemini desde el servidor. La clave nunca llega al navegador:
 * se lee de process.env y viaja en una cabecera, no en la URL.
 * Recorre la lista de modelos hasta que uno responda; devuelve también el modelo usado.
 */
export async function generateWithGemini(
  facts: CharacterFacts,
  apiKey: string,
  models: string[],
): Promise<GeneratedSummary & { model: string }> {
  const failures: string[] = [];

  for (const model of models) {
    let status: number;
    let data: GeminiResponse;
    try {
      ({ status, data } = await requestGemini(facts, apiKey, model));
    } catch (error) {
      // Tiempo de espera agotado o corte de red: probamos el siguiente modelo.
      failures.push(`${model}: ${(error as Error).name}`);
      continue;
    }

    if (status >= 200 && status < 300) {
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      try {
        return { ...parseGeneratedSummary(text), model };
      } catch (error) {
        // Respuesta cortada (MAX_TOKENS) o fuera de esquema: probamos con el siguiente modelo.
        failures.push(`${model}: ${data.candidates?.[0]?.finishReason ?? (error as Error).message}`);
        continue;
      }
    }

    // 401/403: la clave no es válida o no tiene permiso. Ningún otro modelo lo arreglaría.
    if (status === 401 || status === 403) {
      throw new Error(data.error?.message ?? `Gemini respondió con ${status}.`);
    }
    // 503 (saturado), 429 (cuota), 404 (retirado) o 400 (opción no admitida por ese modelo):
    // el problema es de ese modelo concreto, así que pasamos al siguiente.
    failures.push(`${model}: ${status}`);
  }

  throw new GeminiUnavailableError(`Ningún modelo de Gemini respondió (${failures.join(", ")}).`);
}

async function requestGemini(
  facts: CharacterFacts,
  apiKey: string,
  model: string,
): Promise<{ status: number; data: GeminiResponse }> {
  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(facts) }] }],
      generationConfig: {
        // Creatividad moderada: suficiente para metáforas, sin desbordarse.
        temperature: 0.8,
        // Los modelos Gemini 3.x "piensan" antes de responder y ese razonamiento cuenta para el
        // límite de salida: con 1024 tokens el JSON salía cortado (finishReason MAX_TOKENS).
        // Razonamiento bajo y margen amplio: una ficha breve no necesita más.
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: "low" },
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const data = (await response.json().catch(() => ({}))) as GeminiResponse;
  return { status: response.status, data };
}

/** Valida la forma de la respuesta en lugar de confiar en que el modelo respetó el esquema. */
function parseGeneratedSummary(text: string): GeneratedSummary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("La IA devolvió una respuesta que no es JSON válido.");
  }

  const candidate = parsed as Partial<GeneratedSummary>;
  if (typeof candidate.summary !== "string" || candidate.summary.trim() === "") {
    throw new Error("La IA no devolvió ningún resumen.");
  }

  const claims: Claim[] = Array.isArray(candidate.claims)
    ? candidate.claims.filter(
        (claim): claim is Claim =>
          typeof claim?.value === "string" && (FACT_FIELDS as readonly string[]).includes(claim?.field),
      )
    : [];

  return { summary: candidate.summary.trim(), claims };
}
