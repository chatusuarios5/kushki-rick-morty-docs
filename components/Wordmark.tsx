import styles from "./Wordmark.module.css";

/** Giros y desplazamientos fijos por letra: dan el aire "dibujado a mano" sin ser aleatorios entre renders. */
const ROTATIONS = [-6, 4, -3, 5, -4, 3, -2, 6, -5];
const OFFSETS = [2, -3, 1, -2, 3, -1, 2, -3, 1];

function Wobbly({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {[...text].map((char, index) => {
        const i = (start + index) % ROTATIONS.length;
        return (
          <span
            key={index}
            className="logo-fill"
            style={{ transform: `rotate(${ROTATIONS[i]}deg) translateY(${OFFSETS[i]}%)` }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

interface WordmarkProps {
  variant?: "stacked" | "inline";
  as?: "h1" | "span" | "p";
  className?: string;
}

/** Rótulo tipo cartel inspirado en la estética de la serie (no es el logotipo oficial). */
export function Wordmark({ variant = "stacked", as: Tag = "span", className = "" }: WordmarkProps) {
  if (variant === "inline") {
    return (
      <Tag className={`display ${styles.wordmark} ${styles.inline} ${className}`}>
        <span className={styles.inlineInner} aria-hidden="true">
          <Wobbly text="Rick" />
          <span className={`logo-fill ${styles.and}`}>and</span>
          <Wobbly text="Morty" start={4} />
        </span>
      </Tag>
    );
  }

  return (
    <Tag className={`display display-logo ${styles.wordmark} ${styles.stacked} ${className}`} aria-label="Rick and Morty">
      <span className={styles.line} aria-hidden="true">
        <Wobbly text="Rick" />
        <span className={`logo-fill ${styles.amp}`}>&amp;</span>
      </span>
      <span className={`${styles.line} ${styles.lineTwo}`} aria-hidden="true">
        <Wobbly text="Morty" start={4} />
      </span>
    </Tag>
  );
}
