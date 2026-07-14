import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";

export function CircuitDetail() {
  const { circuitId } = useParams();
  const { categories, loading } = useInventory();
  const circuit = categories.flatMap((c) => c.circuits).find((c) => c.id === circuitId);

  if (!circuit) {
    return <div className="empty-state">{loading ? "Loading…" : "Circuit not found."}</div>;
  }

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: "0 0 4px" }}>{circuit.name}</h2>
        {circuit.subtitle && <p style={{ margin: 0, color: "var(--text-muted)" }}>{circuit.subtitle}</p>}
      </div>

      <div style={{ padding: 24 }}>
        {circuit.exercises.length === 0 ? (
          <div className="empty-state">No exercises added yet — populate src/data/inventory.ts.</div>
        ) : (
          <div className="list">
            {circuit.exercises.map((exercise) => (
              <Link
                className="list-row"
                to={`/circuit/${circuit.id}/exercise/${exercise.id}`}
                key={exercise.id}
              >
                <span
                  className="thumb"
                  style={exercise.mediaUrl ? { backgroundImage: `url(${exercise.mediaUrl})` } : undefined}
                />
                <span className="label">{exercise.name}</span>
                <span className="chevron">&gt;</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
