import { NextResponse } from "next/server";

import {
  DEFAULT_FALLBACK_MODELS,
  DEFAULT_GEMINI_MODEL,
  GeminiUnavailableError,
  generateWithGemini,
} from "@/lib/ai/gemini";
import { generateMock } from "@/lib/ai/mock";
import { toFacts } from "@/lib/ai/prompt";
import type { CharacterFacts, GeneratedSummary, SummaryResponse } from "@/lib/ai/types";
import { verifySummary } from "@/lib/ai/verify";
import { getCharacter } from "@/lib/characters.server";

/**
 * POST /api/summary  { "id": 1 }
 *
 * El navegador solo envía el ID. El servidor obtiene los datos canónicos
 * de la API (no confía en un JSON que el cliente podría alterar), los envía
 * a la IA y verifica el resultado antes de devolverlo.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return errorResponse(400, "El ID debe ser un número entero mayor que 0.");
  }

  const result = await getCharacter(id).catch(() => null);
  if (!result) return errorResponse(502, "No pudimos consultar la API de Rick and Morty.");
  if (result.kind === "not_found") return errorResponse(404, "Personaje no encontrado. Intenta con otro ID.");

  const facts = toFacts(result.character);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const fallbacks = process.env.GEMINI_FALLBACK_MODELS?.split(",").map((model) => model.trim()).filter(Boolean);
  const models = [...new Set([primary, ...(fallbacks?.length ? fallbacks : DEFAULT_FALLBACK_MODELS)])];

  if (!apiKey) return NextResponse.json(buildPayload(generateMock(facts), facts, "mock", null));

  try {
    const generated = await generateWithGemini(facts, apiKey, models);
    return NextResponse.json(buildPayload(generated, facts, "gemini", generated.model));
  } catch (error) {
    // El detalle va al log del servidor; al usuario le damos un mensaje accionable.
    console.error("[api/summary]", error);

    if (error instanceof GeminiUnavailableError) {
      // Todos los modelos saturados: mejor un resumen local, verificado y etiquetado, que un error.
      return NextResponse.json(
        buildPayload(
          generateMock(facts),
          facts,
          "mock",
          null,
          "Gemini está saturado ahora mismo; este resumen se generó localmente con los datos de la API. Puedes regenerarlo en unos segundos.",
        ),
      );
    }
    return errorResponse(502, "La IA no respondió correctamente. Inténtalo de nuevo en unos segundos.");
  }
}

function buildPayload(
  generated: GeneratedSummary,
  facts: CharacterFacts,
  source: SummaryResponse["source"],
  model: string | null,
  notice?: string,
): SummaryResponse {
  return {
    summary: generated.summary,
    source,
    model,
    facts,
    verification: verifySummary(generated.summary, generated.claims, facts),
    ...(notice ? { notice } : {}),
  };
}

function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}
