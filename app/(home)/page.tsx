import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { CharacterGallery } from "@/components/CharacterGallery";
import { Planet, Portal, Saucer, Sticker } from "@/components/SpaceDecor";
import { Wordmark } from "@/components/Wordmark";
import { getFirstCharacters } from "@/lib/characters.server";

import styles from "./page.module.css";

export default async function HomePage() {
  const firstPage = await getFirstCharacters();
  const { info, results } = firstPage;
  const featured = results.slice(0, 3);

  return (
    <>
      <section className={styles.stage} aria-labelledby="hero-title">
        <Sticker id={242} size={132} className={`${styles.float} ${styles.stickerLeft}`} />
        <Planet className={`${styles.float} ${styles.planet}`} />
        <Saucer pilotId={2} className={`${styles.float} ${styles.saucer}`} />

        <div className={styles.frame}>
          <div className={styles.stars} aria-hidden="true" />
          <Portal />

          <div className={styles.heroContent}>
            <h1 id="hero-title" className={styles.title}>
              <Wordmark as="span" />
              <span className={styles.subtitle}>API Docs</span>
            </h1>
            <p className={styles.lead}>
              Explora los {info.count} personajes del multiverso. Consulta el endpoint{" "}
              <code>GET /character/&#123;id&#125;</code>, prueba peticiones en vivo y genera resúmenes con IA.
            </p>
            <div className={styles.actions}>
              <Link href="/docs" className="btn btn-ghost">
                Ver documentación
              </Link>
              <Link href="/try" className="btn btn-primary">
                Probar la API
              </Link>
            </div>
          </div>

          <div className={styles.featured}>
            <div className={styles.featuredTabs}>
              <span className={styles.tabActive}>Personajes</span>
              <span className={styles.tabDivider} aria-hidden="true" />
              <Link href="/docs" className={styles.tabLink}>
                Endpoint
              </Link>
            </div>
            <p className={styles.featuredMeta}>
              Página 1 de {info.pages}
            </p>
            <div className={styles.thumbs}>
              {featured.map((character) => (
                <Link key={character.id} href={`/character/${character.id}`} className={styles.thumb}>
                  <Avatar
                    src={character.image}
                    alt={character.name}
                    width={300}
                    height={300}
                    priority
                    className={styles.thumbImage}
                  />
                  <span className={styles.thumbName}>{character.name}</span>
                </Link>
              ))}
              <a href="#gallery" className={styles.more}>
                Más <span aria-hidden="true">+</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className={styles.gallery} aria-labelledby="gallery-title">
        <header className={styles.galleryHeader}>
          <div>
            <span className="eyebrow">Multiverso</span>
            <h2 id="gallery-title" className="section-title">
              Todos los personajes
            </h2>
          </div>
          <p className={styles.galleryHint}>
            Filtra por estado y sigue bajando: los personajes se cargan solos mientras te desplazas.
          </p>
        </header>
        <CharacterGallery initial={firstPage} />
      </section>
    </>
  );
}
