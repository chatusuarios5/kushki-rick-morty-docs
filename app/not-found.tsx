import Link from "next/link";

import styles from "./status-page.module.css";

export default function NotFound() {
  return (
    <section className={styles.wrapper}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Esta dimensión no existe</h1>
      <p className={styles.text}>La página que buscas no está en este universo.</p>
      <Link href="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </section>
  );
}
