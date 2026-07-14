import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";

export function ExerciseDetail() {
  const { circuitId, exerciseId } = useParams();
  const { categories, loading } = useInventory();
  const circuit = categories.flatMap((c) => c.circuits).find((c) => c.id === circuitId);
  const exercise = circuit?.exercises.find((e) => e.id === exerciseId);

  if (!circuit || !exercise) {
    return <div className="empty-state">{loading ? "Loading…" : "Exercise not found."}</div>;
  }

  return (
    <div>
      <Link className="back-link" to={`/circuit/${circuit.id}`}>
        &larr; Back
      </Link>

      <div style={{ padding: "16px 24px 0" }}>
        <div
          className="exercise-media"
          style={exercise.mediaUrl ? { backgroundImage: `url(${exercise.mediaUrl})` } : undefined}
        >
          {!exercise.mediaUrl && "GIF/image goes here — set mediaUrl in inventory.ts"}
        </div>
      </div>

      <div className="cues">
        <h3>{exercise.name}</h3>
        <p>{exercise.cues ?? "Cues coming soon."}</p>
      </div>
    </div>
  );
}
