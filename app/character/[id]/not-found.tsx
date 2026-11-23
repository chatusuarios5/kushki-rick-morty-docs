import Link from "next/link";

import styles from "../../status-page.module.css";

/** Equivalente visual del 404 de la API: { "error": "Character not found" }. */
export default function CharacterNotFound() {
  return (
    <section className={styles.wrapper}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Personaje no encontrado. Intenta con otro ID.</h1>
      <p className={styles.text}>
        La API respondió <code>{'{"error":"Character not found"}'}</code>. Los IDs válidos son enteros desde 1.
      </p>
      <div className={styles.actions}>
        <Link href="/" className="btn btn-primary">
          Ver personajes
        </Link>
        <Link href="/docs#errores" className="btn btn-ghost">
          Leer sobre errores
        </Link>
      </div>
    </section>
  );
}
