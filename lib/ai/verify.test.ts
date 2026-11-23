import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CharacterFacts, Claim } from "./types.ts";
import { verifySummary } from "./verify.ts";

// Datos reales de GET /character/1.
const rick: CharacterFacts = {
  name: "Rick Sanchez",
  status: "Alive",
  species: "Human",
  type: "",
  gender: "Male",
  origin: "Earth (C-137)",
  location: "Citadel of Ricks",
  episodes: "51",
};

const honestClaims: Claim[] = [
  { field: "name", value: "Rick Sanchez" },
  { field: "origin", value: "Earth (C-137)" },
  { field: "episodes", value: "51" },
];

const failed = (summary: string, claims: Claim[]) =>
  verifySummary(summary, claims, rick)
    .checks.filter((check) => !check.ok)
    .map((check) => check.label);

describe("verifySummary", () => {
  it("aprueba un resumen fiel a los datos", () => {
    const summary =
      "Rick Sanchez, genio de Earth (C-137), sigue desafiando al multiverso. Su leyenda abarca 51 episodios. Nadie sabe qué hará después.";
    assert.equal(verifySummary(summary, honestClaims, rick).verified, true);
  });

  it("detecta un estado vital contradictorio", () => {
    const summary = "Rick Sanchez, de Earth (C-137), está muerto tras 51 episodios de caos.";
    assert.deepEqual(failed(summary, honestClaims), ["Estado vital coherente"]);
  });

  it("detecta cifras inventadas", () => {
    const summary = "Rick Sanchez, de Earth (C-137), tiene 70 años y 51 episodios a cuestas.";
    assert.deepEqual(failed(summary, honestClaims), ["Sin cifras inventadas"]);
  });

  it("detecta datos declarados que no coinciden con la API", () => {
    const claims: Claim[] = [...honestClaims, { field: "species", value: "Alien" }];
    const summary = "Rick Sanchez, de Earth (C-137), es un alien que suma 51 episodios.";
    assert.deepEqual(failed(summary, claims), ["Datos declarados"]);
  });

  it("detecta un nombre propio declarado pero traducido en el texto", () => {
    const summary = "Rick Sanchez viene de la Tierra C-137 y aparece en 51 episodios.";
    assert.deepEqual(failed(summary, honestClaims), ["Datos declarados"]);
  });

  it("rechaza un resumen sin datos declarados porque no se puede auditar", () => {
    assert.deepEqual(failed("Rick Sanchez es un científico.", []), ["Datos declarados"]);
  });
});
