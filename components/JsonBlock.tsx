import { highlightJson } from "@/lib/highlightJson";

import { CopyButton } from "./CopyButton";
import styles from "./JsonBlock.module.css";

interface JsonBlockProps {
  data: unknown;
  title?: string;
  maxHeight?: number;
}

/** Respuesta JSON cruda en un <pre>, con resaltado y botón de copiar. */
export function JsonBlock({ data, title = "Respuesta JSON", maxHeight = 420 }: JsonBlockProps) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <CopyButton text={json} />
      </div>
      <pre className={`code-block ${styles.pre}`} style={{ maxHeight }} tabIndex={0}>
        <code>{highlightJson(json)}</code>
      </pre>
    </div>
  );
}
