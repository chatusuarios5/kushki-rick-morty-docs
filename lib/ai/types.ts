/** Campos del personaje que la IA puede citar. Son los únicos datos que recibe. */
export const FACT_FIELDS = [
  "name",
  "status",
  "species",
  "type",
  "gender",
  "origin",
  "location",
  "episodes",
] as const;

export type FactField = (typeof FACT_FIELDS)[number];

/** Ficha reducida que se envía al modelo: sin URLs ni metadatos que no aportan a la narrativa. */
export type CharacterFacts = Record<FactField, string>;

/** Dato que el modelo declara haber usado, copiado tal cual de la ficha. */
export interface Claim {
  field: FactField;
  value: string;
}

export interface GeneratedSummary {
  summary: string;
  claims: Claim[];
}

export interface VerificationCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface Verification {
  verified: boolean;
  checks: VerificationCheck[];
}

export interface SummaryResponse {
  summary: string;
  source: "gemini" | "mock";
  model: string | null;
  /** Aviso para el usuario, p. ej. cuando Gemini estaba saturado y se usó el resumen local. */
  notice?: string;
  facts: CharacterFacts;
  verification: Verification;
}
