import styles from "./CardSkeleton.module.css";

/** Esqueleto con la misma forma que CharacterCard: la página no "salta" cuando llegan los datos. */
export function CardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`skeleton ${styles.media}`} />
      <div className={styles.body}>
        <div className="skeleton" style={{ height: 16, width: "72%" }} />
        <div className="skeleton" style={{ height: 11, width: "50%" }} />
        <div className={styles.fact}>
          <span className={`skeleton ${styles.icon}`} />
          <div className="skeleton" style={{ height: 11, flex: 1 }} />
        </div>
        <div className={styles.fact}>
          <span className={`skeleton ${styles.icon}`} />
          <div className="skeleton" style={{ height: 11, width: "60%" }} />
        </div>
        <div className={styles.footer}>
          <div className="skeleton" style={{ height: 18, width: 82, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 11, width: 90 }} />
        </div>
      </div>
    </div>
  );
}

/** Rejilla de esqueletos, para pantallas de carga completas. */
export function CardSkeletonGrid({ count = 10, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`${styles.grid} ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
