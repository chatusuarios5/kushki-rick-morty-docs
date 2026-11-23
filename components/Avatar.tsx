"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { avatarSrc } from "@/lib/rickandmorty";

import styles from "./Avatar.module.css";

/** Esperas antes de cada reintento si la imagen falla. */
const RETRY_DELAYS_MS = [1500, 4000];

interface AvatarProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Imagen de personaje:
 * - se sirve desde /avatar/{id}.jpeg (caché propia) en lugar de la API, que limita las ráfagas;
 * - mientras descarga muestra un esqueleto con brillo animado;
 * - si falla, se reintenta y, como último recurso, muestra un marcador en vez de una imagen rota.
 */
export function Avatar({ src, alt, width, height, className = "", priority = false, sizes }: AvatarProps) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function handleError() {
    if (attempt >= RETRY_DELAYS_MS.length) {
      setFailed(true);
      return;
    }
    timerRef.current = setTimeout(() => setAttempt((current) => current + 1), RETRY_DELAYS_MS[attempt]);
  }

  if (failed) {
    return (
      <span className={`${className} ${styles.fallback}`} role="img" aria-label={alt}>
        <span className={styles.initial} aria-hidden="true">
          {alt.charAt(0)}
        </span>
      </span>
    );
  }

  return (
    <Image
      // Cambiar la key vuelve a montar la imagen y fuerza una nueva descarga.
      key={attempt}
      src={avatarSrc(src)}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority && attempt === 0}
      // El esqueleto es el fondo de la propia imagen: queda tapado en cuanto se pinta,
      // aunque onLoad no llegara a dispararse (imagen ya en caché antes de hidratar).
      className={`${className} ${styles.image} ${loaded ? styles.loaded : ""}`}
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  );
}
