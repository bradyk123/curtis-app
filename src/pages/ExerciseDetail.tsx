import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useInventory } from "../data/useInventory";
import { useVideos, type VideoClip } from "../data/useVideos";
import { useProfile } from "../lib/profile";
import { usePreviewAthlete } from "../lib/viewAs";
import { updateVideoFields } from "../data/videoAdmin";
import { updateInvRow } from "../data/inventoryAdmin";
import { ClipVideo } from "../components/ClipVideo";

/**
 * Shows the exercise demo: the higher-quality MP4 re-encode when available,
 * falling back to the original GIF if the video is missing or fails to load.
 */
function ExerciseMedia({ videoUrl, gifUrl }: { videoUrl?: string; gifUrl?: string }) {
  const [videoFailed, setVideoFailed] = useState(false);
  if (videoUrl && !videoFailed) {
    return (
      <video
        className="exercise-media"
        src={videoUrl}
        poster={gifUrl}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoFailed(true)}
      />
    );
  }
  return (
    <div
      className="exercise-media"
      style={gifUrl ? { backgroundImage: `url(${gifUrl})` } : undefined}
    >
      {!gifUrl && "No image yet"}
    </div>
  );
}

export function ExerciseDetail() {
  const { circuitId, exerciseId } = useParams();
  const { categories, loading, setCategories } = useInventory();
  const { videos, setVideos } = useVideos();
  const { profile } = useProfile();
  const previewing = usePreviewAthlete();
  const isAdmin = !!profile?.is_admin && !previewing;

  const [editState, setEdit] = useState(false);
  const edit = editState && isAdmin; // athlete-preview forces edit mode off
  const [picker, setPicker] = useState(false);
  const [pq, setPq] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [editingCuesState, setEditingCues] = useState(false);
  const editingCues = editingCuesState && isAdmin; // athlete-preview forces cues editor closed
  const [cuesDraft, setCuesDraft] = useState("");

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

  const saveCues = async () => {
    const text = cuesDraft.trim();
    setCategories((cs) =>
      cs.map((c) => ({
        ...c,
        circuits: c.circuits.map((ci) =>
          ci.dbId === circuit!.dbId
            ? {
                ...ci,
                exercises: ci.exercises.map((e) =>
                  e.dbId === exercise!.dbId ? { ...e, cues: text || undefined } : e
                ),
              }
            : ci
        ),
      }))
    );
    setEditingCues(false);
    fail((await updateInvRow("exercises", exercise!.dbId!, { cues: text || null })).error);
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
        <ExerciseMedia videoUrl={exercise.videoUrl} gifUrl={exercise.mediaUrl} />
      </div>

      <div className="cues">
        <h3>{exercise.name}</h3>
        {editingCues ? (
          <>
            <textarea
              className="cues-input"
              rows={4}
              placeholder="Coaching cues — e.g. drive the knee, stay tall, land soft…"
              value={cuesDraft}
              onChange={(e) => setCuesDraft(e.target.value)}
              autoFocus
            />
            <div className="cues-actions">
              <button className="text-btn primary" onClick={saveCues}>
                Save cues
              </button>
              <button className="text-btn" onClick={() => setEditingCues(false)}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{exercise.cues ?? "Cues coming soon."}</p>
            {isAdmin && (
              <button
                className="link-btn"
                onClick={() => {
                  setCuesDraft(exercise.cues ?? "");
                  setEditingCues(true);
                }}
              >
                {exercise.cues ? "Edit cues" : "Add cues"}
              </button>
            )}
          </>
        )}
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
