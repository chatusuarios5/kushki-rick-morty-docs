import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AiSummary } from "@/components/AiSummary";
import { Avatar } from "@/components/Avatar";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { GENDER_LABELS, formatDate, formatId } from "@/lib/labels";
import { getCharacter } from "@/lib/characters.server";
import { parseCharacterId, type Character } from "@/lib/rickandmorty";

import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadCharacter(rawId: string): Promise<Character> {
  const id = parseCharacterId(rawId);
  if (id === null) notFound();
  const result = await getCharacter(id);
  if (result.kind === "not_found") notFound();
  return result.character;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseCharacterId((await params).id);
  if (id === null) return { title: "Personaje no encontrado" };
  const result = await getCharacter(id).catch(() => null);
  return { title: result?.kind === "found" ? result.character.name : "Personaje no encontrado" };
}

export default async function CharacterPage({ params }: PageProps) {
  const character = await loadCharacter((await params).id);
  const episodes = character.episode.length;

  return (
    <article className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">← Personajes</Link>
        <span className="endpoint">
          <span className="method">GET</span>/character/{character.id}
        </span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.avatarWrap}>
          <Avatar
            key={character.id}
            src={character.image}
            alt={character.name}
            width={300}
            height={300}
            priority
            className={styles.avatar}
          />
        </div>
        <div>
          <span className={styles.id}>{formatId(character.id)}</span>
          <h1 className={styles.name}>{character.name}</h1>
          <div className={styles.tags}>
            <StatusBadge status={character.status} />
            <span className={styles.tag}>{character.species}</span>
            <span className={styles.tag}>{GENDER_LABELS[character.gender]}</span>
          </div>
          <p className={styles.summaryLine}>
            Visto por última vez en <strong>{character.location.name}</strong>. Aparece en{" "}
            <strong>{episodes === 1 ? "1 episodio" : `${episodes} episodios`}</strong>.
          </p>
        </div>
      </header>

      <section aria-labelledby="spec-title">
        <h2 id="spec-title" className={styles.sectionTitle}>
          Ficha técnica
          <span>Cada fila muestra el campo de la respuesta JSON del que sale el dato.</span>
        </h2>
        <dl className={styles.spec}>
          <SpecRow field="status" value={<StatusBadge status={character.status} size="sm" />} raw={character.status} />
          <SpecRow field="species" value={character.species} />
          <SpecRow
            field="type"
            value={character.type || <span className={styles.muted}>Sin subtipo (cadena vacía)</span>}
          />
          <SpecRow field="gender" value={GENDER_LABELS[character.gender]} raw={character.gender} />
          <SpecRow field="origin.name" value={character.origin.name} />
          <SpecRow field="location.name" value={character.location.name} />
          <SpecRow field="episode" value={`${episodes} ${episodes === 1 ? "episodio" : "episodios"}`} raw="array" />
          <SpecRow field="created" value={formatDate(character.created)} raw={character.created} />
        </dl>
      </section>

      <AiSummary characterId={character.id} characterName={character.name} />

      <details className={styles.raw}>
        <summary>Ver la respuesta JSON completa</summary>
        <JsonBlock data={character} title={`GET /character/${character.id} · 200 OK`} maxHeight={480} />
      </details>

      <nav className={styles.pager} aria-label="Personajes contiguos">
        {character.id > 1 ? (
          <Link href={`/character/${character.id - 1}`} className="btn btn-ghost">
            ← {formatId(character.id - 1)}
          </Link>
        ) : (
          <span />
        )}
        <Link href={`/character/${character.id + 1}`} className="btn btn-ghost">
          {formatId(character.id + 1)} →
        </Link>
      </nav>
    </article>
  );
}

function SpecRow({ field, value, raw }: { field: string; value: ReactNode; raw?: string }) {
  return (
    <div className={styles.specRow}>
      <dt>
        <code>{field}</code>
      </dt>
      <dd>
        {value}
        {raw && <code className={styles.rawValue}>{raw}</code>}
      </dd>
    </div>
  );
}
