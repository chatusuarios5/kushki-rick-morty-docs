import Link from "next/link";

import { GENDER_LABELS, formatId } from "@/lib/labels";
import type { Character } from "@/lib/rickandmorty";

import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import styles from "./CharacterCard.module.css";

function unknownAsText(value: string): string {
  return value === "unknown" ? "Desconocida" : value;
}

/**
 * Tarjeta de personaje: imagen, nombre, perfil (especie, subtipo, género), dónde se le vio
 * por última vez y en cuántos episodios aparece. El pie muestra la petición que devuelve
 * este personaje: la interfaz también documenta.
 */
export function CharacterCard({ character, priority = false }: { character: Character; priority?: boolean }) {
  const episodes = character.episode.length;
  const profile = [character.species, character.type, GENDER_LABELS[character.gender]].filter(Boolean).join(" · ");

  return (
    <Link href={`/character/${character.id}`} className={styles.card}>
      <div className={styles.media}>
        <Avatar
          src={character.image}
          alt={character.name}
          width={300}
          height={300}
          sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 240px"
          priority={priority}
          className={styles.image}
        />
        <span className={styles.id}>{formatId(character.id)}</span>
        <span className={styles.status}>
          <StatusBadge status={character.status} size="sm" />
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name} title={character.name}>
          {character.name}
        </h3>
        <p className={styles.profile} title={profile}>
          {profile}
        </p>

        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>
              <PinIcon />
              <span className="visually-hidden">Última ubicación</span>
            </dt>
            <dd title={`Última ubicación: ${character.location.name}`}>{unknownAsText(character.location.name)}</dd>
          </div>
          <div className={styles.fact}>
            <dt>
              <PlanetIcon />
              <span className="visually-hidden">Origen</span>
            </dt>
            <dd title={`Origen: ${character.origin.name}`}>{unknownAsText(character.origin.name)}</dd>
          </div>
        </dl>

        <div className={styles.footer}>
          <span className={styles.episodes}>
            {episodes} {episodes === 1 ? "episodio" : "episodios"}
          </span>
          <code className={styles.request}>
            <span>GET</span> /character/{character.id}
          </code>
        </div>
      </div>
    </Link>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PlanetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 15.5c-1.4 2.2 4 1.6 9.6-1.4 5.7-3 9.2-6.7 7.6-8.2-.6-.5-1.9-.4-3.6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
