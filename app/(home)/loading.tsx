import { CardSkeletonGrid } from "@/components/CardSkeleton";

/** Pantalla esqueleto de la portada mientras el servidor obtiene la primera página de personajes. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando personajes" style={{ paddingTop: 36 }}>
      <div
        className="skeleton"
        style={{ height: "min(720px, 80vh)", borderRadius: "var(--radius-xl)", marginBottom: 120 }}
      />
      <div className="skeleton" style={{ height: 44, width: "min(420px, 80%)", marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 52, borderRadius: 999, marginBottom: 28 }} />
      <CardSkeletonGrid count={10} />
    </div>
  );
}
