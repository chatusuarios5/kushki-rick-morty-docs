import type { CharacterFacts, Claim, FactField, Verification, VerificationCheck } from "./types";

/**
 * Verificación automática de alucinaciones.
 *
 * No intenta "entender" el texto: aplica reglas deterministas y baratas que
 * detectan los errores más comunes de un modelo generativo con datos estructurados:
 *  1. Omitir o deformar el nombre del personaje.
 *  2. Contradecir el estado vital (decir que está vivo cuando está muerto).
 *  3. Declarar datos que no coinciden con la ficha original.
 *  4. Inventar cifras (episodios, edades, dimensiones).
 */
export function verifySummary(summary: string, claims: Claim[], facts: CharacterFacts): Verification {
  const checks: VerificationCheck[] = [
    checkName(summary, facts),
    checkStatus(summary, facts),
    checkClaims(summary, claims, facts),
    checkNumbers(summary, facts),
  ];
  return { verified: checks.every((check) => check.ok), checks };
}

const normalize = (value: string) => value.trim().toLowerCase();

function checkName(summary: string, facts: CharacterFacts): VerificationCheck {
  const ok = normalize(summary).includes(normalize(facts.name));
  return {
    label: "Nombre correcto",
    ok,
    detail: ok ? `Menciona «${facts.name}» tal como aparece en la API.` : `No menciona «${facts.name}» de forma literal.`,
  };
}

/** Expresiones que contradicen cada estado posible. */
const STATUS_CONTRADICTIONS: Record<string, RegExp> = {
  Alive: /\b(muert[oa]s?|fallecid[oa]s?|difunt[oa]s?|sin vida)\b/i,
  Dead: /\b(sigue viv[oa]|está viv[oa]|con vida)\b/i,
  unknown: /\b(está|sigue) (viv[oa]|muert[oa])\b/i,
};

function checkStatus(summary: string, facts: CharacterFacts): VerificationCheck {
  const pattern = STATUS_CONTRADICTIONS[facts.status];
  const match = pattern ? summary.match(pattern) : null;
  return {
    label: "Estado vital coherente",
    ok: !match,
    detail: match
      ? `Dice «${match[0]}», pero el estado en la API es «${facts.status}».`
      : `No contradice el estado «${facts.status}».`,
  };
}

/** Campos cuyo valor es un nombre propio y, por instrucción del prompt, debe aparecer literal en el texto. */
const LITERAL_FIELDS: FactField[] = ["name", "origin", "location"];

function checkClaims(summary: string, claims: Claim[], facts: CharacterFacts): VerificationCheck {
  if (claims.length === 0) {
    return { label: "Datos declarados", ok: false, detail: "La IA no declaró qué datos usó; no se puede auditar." };
  }

  const problems = claims.flatMap((claim) => {
    const expected = facts[claim.field];
    if (normalize(claim.value) !== normalize(expected)) {
      return [`${claim.field}: declaró «${claim.value}», la API dice «${expected}»`];
    }
    if (LITERAL_FIELDS.includes(claim.field) && !normalize(summary).includes(normalize(expected))) {
      return [`${claim.field}: declaró «${expected}», pero no aparece en el texto`];
    }
    return [];
  });

  return {
    label: "Datos declarados",
    ok: problems.length === 0,
    detail:
      problems.length === 0
        ? `${claims.length} datos citados, todos coinciden con la API.`
        : problems.join("; "),
  };
}

function checkNumbers(summary: string, facts: CharacterFacts): VerificationCheck {
  // Cifras legítimas: las que aparecen en cualquier valor de la ficha (p. ej., "C-137" o el total de episodios).
  const allowed = new Set(Object.values(facts).flatMap((value) => value.match(/\d+/g) ?? []));
  const invented = (summary.match(/\d+/g) ?? []).filter((number) => !allowed.has(number));
  return {
    label: "Sin cifras inventadas",
    ok: invented.length === 0,
    detail:
      invented.length === 0
        ? "Todas las cifras del texto provienen de la API."
        : `Cifras que no están en los datos: ${[...new Set(invented)].join(", ")}.`,
  };
}
