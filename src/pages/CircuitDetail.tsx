import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useProfile } from "../lib/profile";
import { updateInvRow, persistOrder } from "../data/inventoryAdmin";
import type { Exercise } from "../types";

export function CircuitDetail() {
  const { circuitId } = useParams();
  const { categories, loading, reload } = useInventory();
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const circuit = categories.flatMap((c) => c.circuits).find((c) => c.id === circuitId);

  if (!circuit) {
    return <div className="empty-state">{loading ? "Loading…" : "Circuit not found."}</div>;
  }

  const exercises = edit ? circuit.exercises : circuit.exercises.filter((e) => !e.hidden);
  const fail = (e?: string) => e && setMsg(`Couldn't save: ${e}`);

  const rename = async (ex: Exercise, name: string) =>
    fail((await updateInvRow("exercises", ex.dbId!, { name })).error);
  const hide = async (ex: Exercise) => {
    fail((await updateInvRow("exercises", ex.dbId!, { hidden: !ex.hidden })).error);
    reload();
  };
  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= exercises.length) return;
    const ids = exercises.map((e) => e.dbId!);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    fail((await persistOrder("exercises", ids)).error);
    reload();
  };

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div className="vlib-head">
        <div>
          <h2 style={{ margin: "0 0 4px" }}>{circuit.name}</h2>
          {circuit.subtitle && <p style={{ margin: 0, color: "var(--text-muted)" }}>{circuit.subtitle}</p>}
        </div>
        {isAdmin && (
          <button className={`vlib-edit-toggle${edit ? " on" : ""}`} onClick={() => setEdit((v) => !v)}>
            {edit ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {msg && <div className="vlib-msg">{msg}</div>}

      <div style={{ padding: 24 }}>
        {exercises.length === 0 ? (
          <div className="empty-state">No exercises here yet.</div>
        ) : (
          <div className="list">
            {exercises.map((exercise, i) =>
              edit ? (
                <div
                  className={`list-row editing-row${exercise.hidden ? " row-hidden" : ""}`}
                  key={exercise.id}
                >
                  <span
                    className="thumb"
                    style={exercise.mediaUrl ? { backgroundImage: `url(${exercise.mediaUrl})` } : undefined}
                  />
                  <input
                    className="edit-row-input"
                    defaultValue={exercise.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== exercise.name) rename(exercise, v);
                    }}
                  />
                  <div className="row-actions">
                    <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button className="icon-btn" disabled={i === exercises.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button className="text-btn" onClick={() => hide(exercise)}>
                      {exercise.hidden ? "Show" : "Hide"}
                    </button>
                  </div>
                </div>
              ) : (
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
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
