"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { GENDER_LABELS } from "@/lib/labels";
import { API_BASE_URL, characterUrl, parseCharacterId, type Character } from "@/lib/rickandmorty";

import { Avatar } from "./Avatar";
import { CodeSamples } from "./CodeSamples";
import { JsonBlock } from "./JsonBlock";
import { StatusBadge } from "./StatusBadge";
import styles from "./TryItOut.module.css";

type Phase = "idle" | "loading" | "success" | "not_found" | "error";
type ResponseTab = "preview" | "body" | "headers";

interface ResponseMeta {
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: [string, string][];
}

interface HistoryEntry {
  id: number;
  status: number | null;
  durationMs: number | null;
  at: number;
}

const PRESETS = [
  { id: "1", label: "Rick" },
  { id: "2", label: "Morty" },
  { id: "826", label: "Último" },
  { id: "9999", label: "404" },
];

const MAX_ID = 826;
const HISTORY_KEY = "try-history";
const HISTORY_LIMIT = 8;
const NOT_FOUND_MESSAGE = "Personaje no encontrado. Intenta con otro ID.";

function readHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Sin almacenamiento disponible (modo privado): el historial solo vive en memoria.
  }
}

export function TryItOut() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [idInput, setIdInput] = useState(() => searchParams.get("id") ?? "1");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tab, setTab] = useState<ResponseTab>("preview");
  const [meta, setMeta] = useState<ResponseMeta | null>(null);
  const [body, setBody] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const autoRunRef = useRef(false);

  const parsedId = parseCharacterId(idInput);

  useEffect(() => setHistory(readHistory()), []);

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory((previous) => {
      const next = [entry, ...previous.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT);
      writeHistory(next);
      return next;
    });
  }, []);

  const sendRequest = useCallback(
    async (rawId: string) => {
      const id = parseCharacterId(rawId);
      if (id === null) {
        // Validamos antes de enviar: la API responde 500 (no 400) a IDs no numéricos.
        setValidationError("El ID debe ser un número entero mayor que 0.");
        return;
      }
      setValidationError(null);

      // El ID queda en la URL: la consulta se puede compartir o recargar.
      router.replace(`${pathname}?id=${id}`, { scroll: false });

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase("loading");
      setMessage(null);
      let startedAt = performance.now();

      try {
        // Los códigos HTTP se muestran tal cual. Solo se reintentan los fallos de red: cuando la API
        // limita peticiones (429) responde sin cabeceras CORS y el navegador lo ve como error de red.
        let response: Response | null = null;
        for (const delay of [0, 1000, 3000]) {
          if (delay) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            if (controller.signal.aborted) return;
            startedAt = performance.now();
          }
          try {
            response = await fetch(characterUrl(id), { signal: controller.signal });
            break;
          } catch (error) {
            if (!(error instanceof TypeError)) throw error;
          }
        }
        if (!response) throw new TypeError("network");
        const text = await response.text();
        const durationMs = Math.round(performance.now() - startedAt);
        const headers: [string, string][] = [];
        response.headers.forEach((value, key) => headers.push([key, value]));

        setMeta({
          status: response.status,
          statusText: response.statusText || (response.ok ? "OK" : ""),
          durationMs,
          sizeBytes: new TextEncoder().encode(text).length,
          headers,
        });
        setBody(safeParse(text));
        pushHistory({ id, status: response.status, durationMs, at: Date.now() });

        if (response.status === 404) {
          setPhase("not_found");
          setMessage(NOT_FOUND_MESSAGE);
          setTab("preview");
        } else if (!response.ok) {
          setPhase("error");
          setMessage(`La API respondió con un error ${response.status}. Inténtalo de nuevo más tarde.`);
        } else {
          setPhase("success");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setPhase("error");
        setMeta(null);
        setBody(null);
        setMessage(
          "La API no respondió. Puede estar limitando las peticiones desde tu red (429); espera unos segundos y vuelve a intentarlo.",
        );
        pushHistory({ id, status: null, durationMs: null, at: Date.now() });
      }
    },
    [pathname, pushHistory, router],
  );

  // Si se llega con ?id=, la consulta se ejecuta sola.
  useEffect(() => {
    if (autoRunRef.current) return;
    autoRunRef.current = true;
    const initialId = searchParams.get("id");
    if (initialId) void sendRequest(initialId);
  }, [searchParams, sendRequest]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendRequest(idInput);
  }

  function run(id: string | number) {
    const value = String(id);
    setIdInput(value);
    void sendRequest(value);
  }

  function step(delta: number) {
    const current = parsedId ?? 1;
    run(Math.min(MAX_ID, Math.max(1, current + delta)));
  }

  function handleInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const current = parsedId ?? 0;
      const next = Math.max(1, current + (event.key === "ArrowUp" ? 1 : -1));
      setIdInput(String(next));
      setValidationError(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className="eyebrow">Consola interactiva</span>
          <h1 className={styles.pageTitle}>Try it out</h1>
          <p className={styles.pageLead}>
            Envía peticiones reales a la API y examina la respuesta. Usa <kbd>↑</kbd> <kbd>↓</kbd> en el campo para
            cambiar de ID y <kbd>Enter</kbd> para enviar.
          </p>
        </div>
        <span className="endpoint">
          <span className="method">GET</span>/character/&#123;id&#125;
        </span>
      </header>

      <div className={styles.layout}>
        {/* ------------------------------------------------------------ Petición */}
        <section className={styles.requestCol} aria-labelledby="req-title">
          <div className={styles.block}>
            <h2 id="req-title" className={styles.blockTitle}>
              <span>01</span> Petición
            </h2>

            <form className={styles.requestBar} onSubmit={handleSubmit} noValidate>
              <div className={`${styles.urlField} ${validationError ? styles.invalid : ""}`}>
                <span className="method">GET</span>
                <span className={styles.urlBase} title={`${API_BASE_URL}/character/`}>
                  …/character/
                </span>
                <label htmlFor="try-id" className="visually-hidden">
                  ID del personaje
                </label>
                <input
                  id="try-id"
                  className={styles.idInput}
                  value={idInput}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="id"
                  aria-invalid={validationError ? true : undefined}
                  aria-describedby={validationError ? "try-id-error" : undefined}
                  onKeyDown={handleInputKey}
                  onChange={(event) => {
                    setIdInput(event.target.value);
                    setValidationError(null);
                  }}
                />
              </div>
              <button type="submit" className={`btn btn-primary ${styles.send}`} disabled={phase === "loading"}>
                {phase === "loading" ? <span className="spinner" aria-hidden="true" /> : null}
                Enviar
              </button>
            </form>

            {validationError && (
              <p id="try-id-error" role="alert" className={styles.validation}>
                {validationError}
              </p>
            )}

            <div className={styles.controls}>
              <div className={styles.stepper} role="group" aria-label="Navegar por ID">
                <button type="button" onClick={() => step(-1)} aria-label="ID anterior" disabled={phase === "loading"}>
                  ←
                </button>
                <button type="button" onClick={() => step(1)} aria-label="ID siguiente" disabled={phase === "loading"}>
                  →
                </button>
                <button
                  type="button"
                  onClick={() => run(1 + Math.floor(Math.random() * MAX_ID))}
                  disabled={phase === "loading"}
                >
                  Aleatorio
                </button>
              </div>

              <div className={styles.presets} aria-label="Ejemplos rápidos">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.preset} ${preset.id === "9999" ? styles.presetError : ""}`}
                    onClick={() => run(preset.id)}
                  >
                    <code>{preset.id}</code>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.block}>
            <h2 className={styles.blockTitle}>
              <span>02</span> Código
            </h2>
            <CodeSamples id={parsedId ?? "{id}"} />
          </div>

          {history.length > 0 && (
            <div className={styles.block}>
              <div className={styles.blockHead}>
                <h2 className={styles.blockTitle}>
                  <span>03</span> Historial
                </h2>
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => {
                    setHistory([]);
                    writeHistory([]);
                  }}
                >
                  Limpiar
                </button>
              </div>
              <ol className={styles.history}>
                {history.map((entry) => (
                  <li key={`${entry.id}-${entry.at}`}>
                    <button type="button" onClick={() => run(entry.id)} className={styles.historyItem}>
                      <span className={`${styles.historyCode} ${toneFor(entry.status)}`}>{entry.status ?? "ERR"}</span>
                      <code>/character/{entry.id}</code>
                      <span className={styles.historyTime}>{entry.durationMs !== null ? `${entry.durationMs} ms` : "—"}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------ Respuesta */}
        <section
          className={`${styles.responseCol} ${phase === "loading" ? styles.isLoading : ""}`}
          aria-labelledby="res-title"
          aria-live="polite"
          aria-busy={phase === "loading"}
        >
          <div className={styles.responseHead}>
            <h2 id="res-title" className={styles.responseTitle}>
              Respuesta
            </h2>
            {meta && phase !== "loading" && <StatusLine meta={meta} />}
          </div>

          {phase !== "idle" && phase !== "loading" && body !== null && (
            <div className={styles.tabs} role="tablist" aria-label="Vista de la respuesta">
              {(
                [
                  ["preview", "Vista previa"],
                  ["body", "Body"],
                  ["headers", `Headers${meta ? ` (${meta.headers.length})` : ""}`],
                ] as [ResponseTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  className={styles.tab}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.responseBody}>
            <ResponseView phase={phase} tab={tab} meta={meta} body={body} message={message} onRetry={() => void sendRequest(idInput)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function ResponseView({
  phase,
  tab,
  meta,
  body,
  message,
  onRetry,
}: {
  phase: Phase;
  tab: ResponseTab;
  meta: ResponseMeta | null;
  body: unknown;
  message: string | null;
  onRetry: () => void;
}) {
  if (phase === "idle") {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>Aún no hay respuesta</p>
        <p>
          Escribe un ID y pulsa <strong>Enviar</strong>, o elige uno de los ejemplos.
        </p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingRow}>
          <div className="skeleton" style={{ width: 140, height: 140 }} />
          <div className={styles.loadingLines}>
            <div className="skeleton" style={{ height: 28, width: "70%" }} />
            <div className="skeleton" style={{ height: 16, width: "45%" }} />
            <div className="skeleton" style={{ height: 16, width: "55%" }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  if (tab === "body" && body !== null) {
    return <JsonBlock data={body} title="application/json" maxHeight={560} />;
  }

  if (tab === "headers" && meta) {
    return (
      <table className={styles.headers}>
        <tbody>
          {meta.headers.map(([key, value]) => (
            <tr key={key}>
              <th scope="row">{key}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={styles.response}>
      {phase === "success" && <CharacterPreview character={body as Character} />}

      {message && (
        <div className={`${styles.alert} ${phase === "not_found" ? styles.alertWarn : styles.alertError}`} role="alert">
          <strong>{message}</strong>
          {phase === "not_found" ? (
            <span>Los IDs válidos van del 1 al {MAX_ID}. Prueba, por ejemplo, con el 1 o el 826.</span>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {phase !== "success" && body !== null && <JsonBlock data={body} title="application/json" maxHeight={200} />}
    </div>
  );
}

function StatusLine({ meta }: { meta: ResponseMeta }) {
  return (
    <div className={styles.statusLine}>
      <span className={`${styles.code} ${toneFor(meta.status)}`}>
        {meta.status} {meta.statusText}
      </span>
      <span>
        <em>Tiempo</em> {meta.durationMs} ms
      </span>
      <span>
        <em>Tamaño</em> {formatBytes(meta.sizeBytes)}
      </span>
    </div>
  );
}

/** Muestra los cinco campos que pide el ejercicio, con su nombre en la API junto a cada valor. */
function CharacterPreview({ character }: { character: Character }) {
  return (
    <article className={styles.preview}>
      <div className={styles.previewMedia}>
        <Avatar
          key={character.id}
          src={character.image}
          alt={character.name}
          width={180}
          height={180}
          className={styles.previewImage}
        />
        <span className={styles.previewId}>#{character.id}</span>
      </div>
      <div className={styles.previewBody}>
        <p className={styles.previewName}>
          <code>name</code>
          {character.name}
        </p>
        <dl className={styles.previewFields}>
          <div>
            <dt>status</dt>
            <dd>
              <StatusBadge status={character.status} size="sm" />
            </dd>
          </div>
          <div>
            <dt>species</dt>
            <dd>{character.species}</dd>
          </div>
          <div>
            <dt>gender</dt>
            <dd>
              {character.gender} <span className={styles.translation}>· {GENDER_LABELS[character.gender]}</span>
            </dd>
          </div>
          <div>
            <dt>origin</dt>
            <dd>{character.origin.name}</dd>
          </div>
          <div>
            <dt>episodes</dt>
            <dd>{character.episode.length}</dd>
          </div>
        </dl>
        <Link href={`/character/${character.id}`} className={styles.previewLink}>
          Ver ficha completa →
        </Link>
      </div>
    </article>
  );
}

function toneFor(status: number | null): string {
  if (status === null || status >= 500) return styles.error;
  if (status >= 400) return styles.warn;
  return styles.ok;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}
