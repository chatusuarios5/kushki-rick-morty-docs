"use client";

import { useId, useState } from "react";

import { characterUrl } from "@/lib/rickandmorty";

import { CopyButton } from "./CopyButton";
import styles from "./CodeSamples.module.css";

type Language = "curl" | "javascript" | "python";

const LANGUAGES: { key: Language; label: string }[] = [
  { key: "curl", label: "cURL" },
  { key: "javascript", label: "JavaScript" },
  { key: "python", label: "Python" },
];

function buildSample(language: Language, id: number | string): string {
  const url = characterUrl(id);
  switch (language) {
    case "curl":
      return `curl ${url}`;
    case "javascript":
      return `const response = await fetch("${url}");

if (response.status === 404) {
  console.log("Personaje no encontrado");
} else {
  const character = await response.json();
  console.log(character.name);
}`;
    case "python":
      return `import requests

response = requests.get("${url}")

if response.status_code == 404:
    print("Personaje no encontrado")
else:
    print(response.json()["name"])`;
  }
}

/** Fragmentos listos para copiar que se actualizan con el ID que escribe el usuario. */
export function CodeSamples({ id }: { id: number | string }) {
  const [language, setLanguage] = useState<Language>("curl");
  const baseId = useId();
  const code = buildSample(language, id);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="tablist" aria-label="Lenguaje del ejemplo">
        {LANGUAGES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${baseId}-${item.key}`}
            aria-selected={language === item.key}
            aria-controls={`${baseId}-panel`}
            className={styles.tab}
            onClick={() => setLanguage(item.key)}
          >
            {item.label}
          </button>
        ))}
        <span className={styles.copy}>
          <CopyButton text={code} />
        </span>
      </div>
      <pre
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${language}`}
        className={`code-block ${styles.pre}`}
        tabIndex={0}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
