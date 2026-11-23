import { Avatar } from "./Avatar";
import styles from "./SpaceDecor.module.css";

const avatar = (id: number) => `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`;

/** Portal verde giratorio. Se coloca en el borde inferior de un contenedor con overflow oculto. */
export function Portal({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.portalWrap} ${className}`} aria-hidden="true">
      <div className={styles.portalGlow} />
      <div className={styles.portal}>
        <div className={styles.portalCore} />
        <div className={`${styles.portalSwirl} ${styles.swirlA}`} />
        <div className={`${styles.portalSwirl} ${styles.swirlB}`} />
        <div className={styles.portalRim} />
      </div>
    </div>
  );
}

/** Planeta con anillo, dibujado en SVG con trazo de dibujo animado. */
export function Planet({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 200" aria-hidden="true">
      <defs>
        <radialGradient id="planet-body" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffd1ef" />
          <stop offset="45%" stopColor="#e27bd0" />
          <stop offset="100%" stopColor="#6a3aa8" />
        </radialGradient>
        <linearGradient id="planet-ring" x1="0" x2="1">
          <stop offset="0%" stopColor="#f7ee7a" />
          <stop offset="50%" stopColor="#fff7b0" />
          <stop offset="100%" stopColor="#e2c93a" />
        </linearGradient>
        <clipPath id="ring-back">
          <rect x="0" y="0" width="260" height="100" />
        </clipPath>
        <clipPath id="ring-front">
          <rect x="0" y="100" width="260" height="100" />
        </clipPath>
      </defs>
      <g transform="rotate(-18 130 100)">
        <ellipse cx="130" cy="100" rx="120" ry="30" fill="none" stroke="#111" strokeWidth="22" clipPath="url(#ring-back)" />
        <ellipse cx="130" cy="100" rx="120" ry="30" fill="none" stroke="url(#planet-ring)" strokeWidth="16" clipPath="url(#ring-back)" />
        <circle cx="130" cy="100" r="62" fill="url(#planet-body)" stroke="#111" strokeWidth="4" />
        <path d="M84 84c18 8 40 10 62 4M80 112c22 8 52 10 86 0" stroke="#b456b6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
        <ellipse cx="108" cy="72" rx="14" ry="8" fill="#fff" opacity="0.35" />
        <ellipse cx="130" cy="100" rx="120" ry="30" fill="none" stroke="#111" strokeWidth="22" clipPath="url(#ring-front)" />
        <ellipse cx="130" cy="100" rx="120" ry="30" fill="none" stroke="url(#planet-ring)" strokeWidth="16" clipPath="url(#ring-front)" />
      </g>
    </svg>
  );
}

/** Platillo volador con un personaje en la cúpula. */
export function Saucer({ className = "", pilotId = 2 }: { className?: string; pilotId?: number }) {
  return (
    <div className={`${styles.saucer} ${className}`} aria-hidden="true">
      <div className={styles.dome}>
        <Avatar src={avatar(pilotId)} alt="" width={120} height={120} className={styles.domeImage} />
        <span className={styles.domeShine} />
      </div>
      <svg className={styles.hull} viewBox="0 0 220 90">
        <defs>
          <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8edf2" />
            <stop offset="55%" stopColor="#9aa6b3" />
            <stop offset="100%" stopColor="#56606c" />
          </linearGradient>
        </defs>
        <ellipse cx="110" cy="40" rx="104" ry="28" fill="url(#hull)" stroke="#111" strokeWidth="4" />
        <ellipse cx="110" cy="56" rx="62" ry="16" fill="#6b7682" stroke="#111" strokeWidth="4" />
        {[40, 75, 110, 145, 180].map((x) => (
          <circle key={x} cx={x} cy={44} r="5" fill="#c4ff6b" stroke="#111" strokeWidth="2" />
        ))}
      </svg>
      <div className={styles.beam} />
    </div>
  );
}

/** Avatar recortado como pegatina, con borde blanco. */
export function Sticker({ id, className = "", size = 140 }: { id: number; className?: string; size?: number }) {
  return (
    <div className={`${styles.sticker} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Avatar src={avatar(id)} alt="" width={size * 2} height={size * 2} className={styles.stickerImage} />
    </div>
  );
}
