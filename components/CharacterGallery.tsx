"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  LOCAL_CHARACTERS_ENDPOINT,
  fetchCharacterPage,
  localPageUrl,
  type Character,
  type CharacterPage,
} from "@/lib/rickandmorty";

import { CharacterCard } from "./CharacterCard";
import { CardSkeleton } from "./CardSkeleton";
import styles from "./CharacterGallery.module.css";

type LoadState = "idle" | "loading" | "error" | "done";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "alive", label: "Vivos" },
  { key: "dead", label: "Muertos" },
  { key: "unknown", label: "Desconocido" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

/** Cuántos píxeles antes del final empezamos a pedir la siguiente página. */
const PREFETCH_MARGIN = "800px 0px";
const SKELETON_COUNT = 8;
/** Pausa mínima entre páginas: evita ráfagas al hacer scroll rápido y no dispara el límite de la API. */
const MIN_PAGE_INTERVAL_MS = 700;

/** Las páginas se piden a nuestra ruta /api/characters, que las sirve desde caché. */
function firstPageUrl(filter: Filter): string {
  return filter === "all" ? LOCAL_CHARACTERS_ENDPOINT : `${LOCAL_CHARACTERS_ENDPOINT}?status=${filter}`;
}

/**
 * Galería con scroll infinito y filtro por estado.
 * - La primera página llega renderizada desde el servidor (rápida y apta para SEO).
 * - Un IntersectionObserver vigila un "centinela" al final de la lista y pide la siguiente página.
 * - Un candado (loadingRef) impide peticiones duplicadas y un contador de generación descarta
 *   respuestas que llegan tarde tras cambiar de filtro.
 * - Las tarjetas usan `content-visibility: auto`: el navegador no pinta las que están fuera de
 *   pantalla, así la página sigue fluida aunque haya cientos de personajes.
 */
export function CharacterGallery({ initial }: { initial: CharacterPage }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<Character[]>(initial.results);
  const [nextUrl, setNextUrl] = useState<string | null>(localPageUrl(initial.info.next));
  const [total, setTotal] = useState(initial.info.count);
  const [state, setState] = useState<LoadState>(initial.info.next ? "idle" : "done");
  const [showTop, setShowTop] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const lastPageAtRef = useRef(0);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchInto = useCallback(async (url: string, reset: boolean) => {
    const generation = generationRef.current;
    loadingRef.current = true;
    setState("loading");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const sinceLast = performance.now() - lastPageAtRef.current;
      if (!reset && sinceLast < MIN_PAGE_INTERVAL_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_PAGE_INTERVAL_MS - sinceLast));
      }
      if (generation !== generationRef.current) return;
      lastPageAtRef.current = performance.now();

      const page = await fetchCharacterPage(url, controller.signal);
      if (generation !== generationRef.current) return;
      setItems((previous) => {
        if (reset) return page.results;
        const seen = new Set(previous.map((character) => character.id));
        return [...previous, ...page.results.filter((character) => !seen.has(character.id))];
      });
      setNextUrl(localPageUrl(page.info.next));
      setTotal(page.info.count);
      setState(page.info.next ? "idle" : "done");
    } catch (error) {
      if ((error as Error).name === "AbortError" || generation !== generationRef.current) return;
      setState("error");
    } finally {
      if (generation === generationRef.current) loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !nextUrl) return;
    void fetchInto(nextUrl, false);
  }, [fetchInto, nextUrl]);

  function selectFilter(next: Filter) {
    if (next === filter) return;
    generationRef.current += 1;
    abortRef.current?.abort();
    loadingRef.current = false;
    setFilter(next);

    if (topRef.current && topRef.current.getBoundingClientRect().top < 0) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }

    if (next === "all") {
      // La primera página de "Todos" ya la tenemos: no hace falta pedirla otra vez.
      setItems(initial.results);
      setNextUrl(localPageUrl(initial.info.next));
      setTotal(initial.info.count);
      setState(initial.info.next ? "idle" : "done");
    } else {
      setItems([]);
      void fetchInto(firstPageUrl(next), true);
    }
  }

  function retry() {
    if (items.length === 0) void fetchInto(firstPageUrl(filter), true);
    else loadMore();
  }

  // Observa el centinela. Se vuelve a enganchar cuando cambia la URL siguiente.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || state !== "idle") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, state]);

  // Cancela cualquier petición en curso al salir de la página.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Botón "volver arriba" solo cuando ya se ha bajado bastante.
  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShowTop(window.scrollY > 1400));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const progress = total > 0 ? Math.min(100, Math.round((items.length / total) * 100)) : 0;

  return (
    <>
      <div ref={topRef} className={styles.anchor} aria-hidden="true" />
      <div className={styles.toolbar}>
        <div className={styles.filters} role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={filter === item.key}
              className={styles.filter}
              onClick={() => selectFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.meter}>
          <p className={styles.counter} aria-live="polite">
            <strong>{items.length}</strong> / {total}
          </p>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Personajes cargados"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={items.length}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <ul className={styles.grid} data-testid="character-grid">
        {items.map((character, index) => (
          <li key={character.id} className={styles.item}>
            <CharacterCard character={character} priority={filter === "all" && index < 4} />
          </li>
        ))}
        {state === "loading" &&
          Array.from({ length: items.length === 0 ? SKELETON_COUNT * 1.5 : SKELETON_COUNT }, (_, index) => (
            <li key={`skeleton-${index}`} className={styles.item} aria-hidden="true">
              <CardSkeleton />
            </li>
          ))}
      </ul>

      <div ref={sentinelRef} className={styles.sentinel} data-testid="gallery-sentinel" aria-hidden="true" />

      <div className={styles.footer}>
        {state === "loading" && items.length > 0 && (
          <p className={styles.status}>
            <span className={styles.miniPortal} aria-hidden="true" /> Abriendo un portal a más personajes…
          </p>
        )}
        {state === "error" && (
          <div className={styles.errorBox} role="alert">
            <p>La API está limitando las peticiones. Espera unos segundos y vuelve a intentarlo.</p>
            <button type="button" className="btn btn-primary" onClick={retry}>
              Reintentar
            </button>
          </div>
        )}
        {state === "done" && (
          <p className={styles.end}>Has visto los {items.length} personajes de este filtro</p>
        )}
      </div>

      <button
        type="button"
        className={`${styles.toTop} ${showTop ? styles.toTopVisible : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver arriba"
        tabIndex={showTop ? 0 : -1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}
