export default function Loading() {
  return (
    <div style={{ display: "grid", gap: 32, paddingTop: 72 }} aria-busy="true" aria-label="Cargando personaje">
      <div style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
        <div className="skeleton" style={{ width: 220, height: 220, borderRadius: 8 }} />
        <div style={{ display: "grid", gap: 14, flex: 1, minWidth: 220 }}>
          <div className="skeleton" style={{ height: 18, width: 80 }} />
          <div className="skeleton" style={{ height: 52, width: "70%" }} />
          <div className="skeleton" style={{ height: 28, width: "45%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );
}
