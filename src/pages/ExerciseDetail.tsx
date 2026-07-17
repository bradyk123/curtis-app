import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useVideos, type VideoClip } from "../data/useVideos";
import { useProfile } from "../lib/profile";
import { updateVideoFields } from "../data/videoAdmin";
import { ClipVideo } from "../components/ClipVideo";

export function ExerciseDetail() {
  const { circuitId, exerciseId } = useParams();
  const { categories, loading } = useInventory();
  const { videos, setVideos } = useVideos();
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;

  const [edit, setEdit] = useState(false);
  const [picker, setPicker] = useState(false);
  const [pq, setPq] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const circuit = categories.flatMap((c) => c.circuits).find((c) => c.id === circuitId);
  const exercise = circuit?.exercises.find((e) => e.id === exerciseId);

  if (!circuit || !exercise) {
    return <div className="empty-state">{loading ? "Loading…" : "Exercise not found."}</div>;
  }

  const exDbId = exercise.dbId;
  const attached =
    exDbId != null
      ? videos
          .filter((v) => v.exerciseId === exDbId && (edit || !v.hidden))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const fail = (e?: string) => e && setMsg(`Couldn't save: ${e}`);

  const attach = async (clip: VideoClip) => {
    if (exDbId == null) return;
    setVideos((vs) => vs.map((v) => (v.id === clip.id ? { ...v, exerciseId: exDbId } : v)));
    setPicker(false);
    fail((await updateVideoFields(clip.id!, { exercise_id: exDbId })).error);
  };

  const detach = async (clip: VideoClip) => {
    setVideos((vs) => vs.map((v) => (v.id === clip.id ? { ...v, exerciseId: null } : v)));
    fail((await updateVideoFields(clip.id!, { exercise_id: null })).error);
  };

  const q = pq.trim().toLowerCase();
  const pickerClips = videos
    .filter((v) => v.exerciseId !== exDbId)
    .filter((v) => !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const showVideos = attached.length > 0 || isAdmin;

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
          {!exercise.mediaUrl && "No image yet"}
        </div>
      </div>

      <div className="cues">
        <h3>{exercise.name}</h3>
        <p>{exercise.cues ?? "Cues coming soon."}</p>
      </div>

      {showVideos && (
        <div className="ex-videos">
          <div className="ex-videos-head">
            <h3>Coaching videos</h3>
            {isAdmin && (
              <button className={`vlib-edit-toggle${edit ? " on" : ""}`} onClick={() => setEdit((v) => !v)}>
                {edit ? "Done" : "Edit"}
              </button>
            )}
          </div>

          {msg && <div className="vlib-msg">{msg}</div>}

          {attached.length === 0 ? (
            isAdmin && <p className="ex-videos-empty">No videos attached yet.</p>
          ) : (
            <div className="clip-grid">
              {attached.map((clip) => (
                <div className={`clip-card${clip.hidden ? " hidden-clip" : ""}`} key={clip.id}>
                  <ClipVideo clip={clip} />
                  <div className="clip-name clip-name-row">
                    <span>{clip.name}</span>
                    {edit && (
                      <button className="text-btn danger" onClick={() => detach(clip)}>
                        Detach
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {edit && (
            <button
              className="attach-btn"
              onClick={() => {
                setPq("");
                setPicker(true);
              }}
            >
              + Attach video
            </button>
          )}
        </div>
      )}

      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(false)}>
          <div className="modal-card picker-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPicker(false)}>
              ×
            </button>
            <h2>Attach a video</h2>
            <div className="search-bar" style={{ marginTop: 0 }}>
              <span className="search-icon">⌕</span>
              <input
                placeholder="Search clips…"
                value={pq}
                onChange={(e) => setPq(e.target.value)}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="picker-list">
              {pickerClips.length === 0 ? (
                <div className="empty-state">No clips found.</div>
              ) : (
                pickerClips.map((clip) => (
                  <button className="picker-row" key={clip.id} onClick={() => attach(clip)}>
                    <span className="thumb thumb-video">▶</span>
                    <span className="label">
                      {clip.name}
                      <span className="result-meta">
                        {clip.category}
                        {clip.exerciseId != null && " · attached elsewhere"}
                      </span>
                    </span>
                    <span className="chevron">+</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
