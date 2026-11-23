"use client";

import { useEffect, useState } from "react";

import styles from "./CopyButton.module.css";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles: el usuario aún puede seleccionar el texto manualmente.
    }
  }

  return (
    <button type="button" className={styles.button} onClick={copy} aria-live="polite">
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
