"use client";

import { useEffect, useState } from "react";

import type { SummaryResponse } from "@/lib/ai/types";

import styles from "./AiSummary.module.css";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; result: SummaryResponse }
  | { phase: "error"; message: string };

export function AiSummary({ characterId, characterName }: { characterId: number; characterName: string }) {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function generate() {
    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: characterId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo generar el resumen.");
      setState({ phase: "done", result: data as SummaryResponse });
    } catch (error) {
      setState({ phase: "error", message: (error as Error).message || "No se pudo generar el resumen." });
    }
  }

  const isLoading = state.phase === "loading";

  return (
    <section className={styles.panel} aria-labelledby="ai-title">
      <header className={styles.header}>
        <div>
          <span className="eyebrow">IA generativa</span>
          <h2 id="ai-title" className={styles.title}>
            Resumen del personaje
          </h2>
          <p className={styles.lead}>
            La IA escribe una ficha creativa de {characterName} usando solo los datos de la API.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={generate} disabled={isLoading}>
          {isLoading ? <span className="spinner" aria-hidden="true" /> : <SparkIcon />}
          {state.phase === "done" ? "Regenerar" : "Generar resumen con IA"}
        </button>
      </header>

      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && (
          <div className={styles.loading}>
            <div className="skeleton" style={{ height: 16, width: "95%" }} />
            <div className="skeleton" style={{ height: 16, width: "88%" }} />
            <div className="skeleton" style={{ height: 16, width: "60%" }} />
          </div>
        )}

        {state.phase === "error" && (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        )}

        {state.phase === "done" && <SummaryResult result={state.result} />}
      </div>
    </section>
  );
}

function SummaryResult({ result }: { result: SummaryResponse }) {
  const text = useTypewriter(result.summary);

  return (
    <div className={styles.result}>
      <blockquote className={styles.summary}>
        <p>
          {text}
          {text.length < result.summary.length && <span className={styles.caret} aria-hidden="true" />}
        </p>
        <footer className={styles.source}>
          {result.source === "gemini" ? (
            <>Generado con Google Gemini · {result.model}</>
          ) : (
            <>Resumen generado localmente (sin IA)</>
          )}
        </footer>
        {result.notice && <p className={styles.notice}>{result.notice}</p>}
      </blockquote>
    </div>
  );
}

/** Efecto de escritura progresiva. Se desactiva si el usuario prefiere menos movimiento. */
function useTypewriter(fullText: string): string {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(fullText.length);
      return;
    }
    setLength(0);
    const interval = setInterval(() => {
      setLength((current) => {
        if (current >= fullText.length) {
          clearInterval(interval);
          return current;
        }
        return current + 2;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [fullText]);

  return fullText.slice(0, length);
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2zm7 12l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" />
    </svg>
  );
}
