import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useProfile } from "../lib/profile";
import { usePreviewAthlete } from "../lib/viewAs";
import { updateInvRow, persistOrder, uploadExerciseMedia } from "../data/inventoryAdmin";
import { SortableList } from "../components/SortableList";
import type { Exercise } from "../types";

export function CircuitDetail() {
  const { circuitId } = useParams();
  const { categories, loading, reload, setCategories } = useInventory();
  const { profile } = useProfile();
  const previewing = usePreviewAthlete();
  const isAdmin = !!profile?.is_admin && !previewing;
  const [editState, setEdit] = useState(false);
  const edit = editState && isAdmin; // athlete-preview forces edit mode off
  const [msg, setMsg] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const mediaTarget = useRef<Exercise | null>(null);

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
  const reorderExercises = (reordered: Exercise[]) => {
    setCategories((cs) =>
      cs.map((c) => ({
        ...c,
        circuits: c.circuits.map((ci) => (ci.dbId === circuit!.dbId ? { ...ci, exercises: reordered } : ci)),
      }))
    );
    persistOrder("exercises", reordered.map((e) => e.dbId!)).then((r) => fail(r.error));
  };

  const pickMedia = (ex: Exercise) => {
    mediaTarget.current = ex;
    fileInput.current?.click();
  };
  const onMediaChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const ex = mediaTarget.current;
    if (!file || !ex) return;
    setUploadingId(ex.dbId!);
    setMsg(null);
    const { path, error } = await uploadExerciseMedia(file, ex.id);
    if (error || !path) {
      setUploadingId(null);
      setMsg(`GIF upload failed: ${error ?? "unknown error"}`);
      return;
    }
    fail((await updateInvRow("exercises", ex.dbId!, { media_path: path })).error);
    setUploadingId(null);
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
            {edit ? (
              <SortableList
                items={exercises}
                getId={(e) => e.dbId!}
                onReorder={reorderExercises}
                renderItem={(exercise, drag) => (
                  <div
                    className={`list-row editing-row${exercise.hidden ? " row-hidden" : ""}`}
                    ref={drag.rowProps.ref}
                    style={drag.rowProps.style}
                  >
                    <button className="drag-handle" title="Drag to reorder" {...drag.handleProps}>
                      ⠿
                    </button>
                    <button
                      className="thumb thumb-edit"
                      style={exercise.mediaUrl ? { backgroundImage: `url(${exercise.mediaUrl})` } : undefined}
                      onClick={() => pickMedia(exercise)}
                      title="Change GIF"
                      disabled={uploadingId === exercise.dbId}
                    >
                      <span className="thumb-overlay">{uploadingId === exercise.dbId ? "…" : "✎"}</span>
                    </button>
                    <input
                      className="edit-row-input"
                      defaultValue={exercise.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== exercise.name) rename(exercise, v);
                      }}
                    />
                    <div className="row-actions">
                      <button
                        className="text-btn"
                        disabled={uploadingId === exercise.dbId}
                        onClick={() => pickMedia(exercise)}
                      >
                        {uploadingId === exercise.dbId ? "Uploading…" : "GIF"}
                      </button>
                      <button className="text-btn" onClick={() => hide(exercise)}>
                        {exercise.hidden ? "Show" : "Hide"}
                      </button>
                    </div>
                  </div>
                )}
              />
            ) : (
              exercises.map((exercise) => (
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
              ))
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/gif,image/webp,image/png,image/jpeg,image/*"
        style={{ display: "none" }}
        onChange={onMediaChosen}
      />
    </div>
  );
}
