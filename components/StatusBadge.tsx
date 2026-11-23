import { STATUS_LABELS } from "@/lib/labels";
import type { CharacterStatus } from "@/lib/rickandmorty";

import styles from "./StatusBadge.module.css";

export function StatusBadge({ status, size = "md" }: { status: CharacterStatus; size?: "sm" | "md" }) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]}`} title={`status: "${status}"`}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
