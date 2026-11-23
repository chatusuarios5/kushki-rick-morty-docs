"use client";

import styles from "./status-page.module.css";

/** Se muestra si la API de Rick and Morty no responde al renderizar una página. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className={styles.wrapper}>
      <span className={styles.code}>503</span>
      <h1 className={styles.title}>La API no responde en este momento</h1>
      <p className={styles.text}>
        No pudimos conectar con la API de Rick and Morty. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Reintentar
      </button>
    </section>
  );
}
