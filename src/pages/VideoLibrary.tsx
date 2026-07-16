import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useVideos, type VideoClip } from "../data/useVideos";
import { videoLibrary as staticVideos } from "../data/videoLibrary";
import { useProfile } from "../lib/profile";
import {
  slugify,
  uniqueSlug,
  prettyName,
  updateVideoFields,
  deleteVideoRow,
  uploadNewVideo,
} from "../data/videoAdmin";

/** Category display order, taken from the bundled library so sections stay in their familiar order. */
const CATEGORY_ORDER = [...new Set(staticVideos.map((c) => c.category))];
const catRank = (cat: string) => {
  const i = CATEGORY_ORDER.indexOf(cat);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/** Seconds → "m:ss" (always, incl. 0:00). */
function clock(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
/** Seconds → "m:ss", or null when unknown (used for the badge). */
function fmt(seconds: number) {
  return isFinite(seconds) && seconds > 0 ? clock(seconds) : null;
}

/**
 * Plays a clip only while it's on screen. Honors in/out trim points:
 * if the clip is trimmed, it loops within [trimStart, trimEnd] instead of the whole file.
 */
function ClipVideo({ clip }: { clip: VideoClip }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [detected, setDetected] = useState<number | null>(null);

  const start = clip.trimStart ?? 0;
  const hasEnd = clip.trimEnd != null && clip.trimEnd > start;
  const end = hasEnd ? (clip.trimEnd as number) : null;
  const trimmed = start > 0 || hasEnd;

  // Displayed length: admin label wins; else the trimmed span; else the full detected length.
  const badge =
    clip.durationLabel ||
    (trimmed ? fmt((end ?? detected ?? 0) - start) : detected != null ? fmt(detected) : null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (trimmed && (v.currentTime < start || (end != null && v.currentTime >= end))) {
            v.currentTime = start;
          }
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [start, end, trimmed]);

  const onTime = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!trimmed) return;
    const v = e.currentTarget;
    if (end != null && v.currentTime >= end) v.currentTime = start;
    else if (v.currentTime < start - 0.1) v.currentTime = start;
  };

  return (
    <div className="clip-media">
      <video
        ref={ref}
        src={clip.videoUrl}
        muted
        loop={!trimmed}
        autoPlay
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDetected(e.currentTarget.duration);
          if (trimmed) e.currentTarget.currentTime = start;
        }}
        onTimeUpdate={onTime}
      />
      {badge && <span className="clip-duration">{badge}</span>}
    </div>
  );
}

/** Read-only card (athletes + admins not in edit mode). */
function ClipCard({ clip, anchorId, flash }: { clip: VideoClip; anchorId?: string; flash?: boolean }) {
  return (
    <div className={`clip-card${flash ? " focus-flash" : ""}`} id={anchorId}>
      <ClipVideo clip={clip} />
      <div className="clip-name">{clip.name}</div>
    </div>
  );
}

/** Set in/out points by scrubbing. Non-destructive — saves seconds, never touches the file. */
function TrimEditor({
  clip,
  onSave,
  onReset,
  onCancel,
}: {
  clip: VideoClip;
  onSave: (start: number, end: number) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(clip.trimStart ?? 0);
  const [end, setEnd] = useState(clip.trimEnd ?? 0);
  const [ready, setReady] = useState(false);

  const seek = (t: number) => {
    const v = ref.current;
    if (v) v.currentTime = Math.max(0, Math.min(t, dur || t));
  };

  const onMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    setDur(d);
    const s = clip.trimStart ?? 0;
    const en = clip.trimEnd != null && clip.trimEnd > 0 ? clip.trimEnd : d;
    setStart(s);
    setEnd(en);
    e.currentTarget.currentTime = s;
    setReady(true);
  };

  const changeStart = (val: number) => {
    const v = Math.max(0, Math.min(val, end - 0.1));
    setStart(v);
    seek(v);
  };
  const changeEnd = (val: number) => {
    const v = Math.min(dur, Math.max(val, start + 0.1));
    setEnd(v);
    seek(v);
  };

  const preview = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = start;
    v.play().catch(() => {});
  };
  const onTime = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.currentTime >= end) {
      v.pause();
      v.currentTime = start;
    }
  };

  return (
    <div className="trim-editor">
      <video
        ref={ref}
        src={clip.videoUrl}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={onMeta}
        onTimeUpdate={onTime}
      />
      <div className="trim-controls">
        <div className="trim-row">
          <span>Start {clock(start)}</span>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={start}
            disabled={!ready}
            onChange={(e) => changeStart(parseFloat(e.target.value))}
          />
        </div>
        <div className="trim-row">
          <span>End {clock(end)}</span>
          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={end}
            disabled={!ready}
            onChange={(e) => changeEnd(parseFloat(e.target.value))}
          />
        </div>
        <div className="trim-meta">Plays {clock(Math.max(0, end - start))} of {clock(dur)}</div>
        <div className="trim-actions">
          <button className="text-btn" onClick={preview} disabled={!ready}>
            Preview
          </button>
          <button className="text-btn primary" onClick={() => onSave(start, end)} disabled={!ready}>
            Save trim
          </button>
          <button className="text-btn" onClick={onReset}>
            Reset
          </button>
          <button className="text-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditHandlers {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (name: string) => void;
  onCategory: (category: string) => void;
  onDuration: (label: string) => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onTrim: (start: number | null, end: number | null) => void;
}

/** Editable card (admins in edit mode). Fields save on blur. */
function EditableClipCard({ clip, h }: { clip: VideoClip; h: EditHandlers }) {
  const [trimming, setTrimming] = useState(false);
  const isTrimmed = clip.trimStart != null || clip.trimEnd != null;

  return (
    <div className={`clip-card editing${clip.hidden ? " hidden-clip" : ""}`}>
      {trimming ? (
        <TrimEditor
          clip={clip}
          onSave={(s, e) => {
            h.onTrim(s, e);
            setTrimming(false);
          }}
          onReset={() => {
            h.onTrim(null, null);
            setTrimming(false);
          }}
          onCancel={() => setTrimming(false)}
        />
      ) : (
        <>
          <ClipVideo clip={clip} />
          {clip.hidden && <div className="hidden-flag">Hidden from athletes</div>}
        </>
      )}
      <div className="clip-edit">
        <label className="clip-edit-field">
          <span>Name</span>
          <input
            defaultValue={clip.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== clip.name) h.onRename(v);
            }}
          />
        </label>
        <label className="clip-edit-field">
          <span>Category</span>
          <input
            list="vlib-categories"
            defaultValue={clip.category}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== clip.category) h.onCategory(v);
            }}
          />
        </label>
        <label className="clip-edit-field">
          <span>Duration label</span>
          <input
            className="dur-input"
            placeholder="auto"
            defaultValue={clip.durationLabel ?? ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (clip.durationLabel ?? "")) h.onDuration(v);
            }}
          />
        </label>
        <div className="clip-edit-actions">
          <button className="icon-btn" disabled={!h.canMoveUp} onClick={() => h.onMove(-1)} title="Move up">
            ↑
          </button>
          <button className="icon-btn" disabled={!h.canMoveDown} onClick={() => h.onMove(1)} title="Move down">
            ↓
          </button>
          <button className={`text-btn${isTrimmed ? " active" : ""}`} onClick={() => setTrimming((t) => !t)}>
            {trimming ? "Close" : isTrimmed ? "Trim ✓" : "Trim"}
          </button>
          <button className="text-btn" onClick={h.onToggleHidden}>
            {clip.hidden ? "Show" : "Hide"}
          </button>
          <button className="text-btn danger" onClick={h.onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function VideoLibrary() {
  const { videos, loading, setVideos } = useVideos();
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;

  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploadingCat, setUploadingCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string>("");
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");

  // Deep-link from global search: scroll to the clip and flash it.
  useEffect(() => {
    if (!focus || videos.length === 0) return;
    const el = document.getElementById(`clip-${focus}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(focus);
    const t = setTimeout(() => setFlashId(null), 2200);
    return () => clearTimeout(t);
  }, [focus, videos]);

  const q = edit ? "" : query.trim().toLowerCase();

  const categories = useMemo(() => {
    const cats = [...new Set(videos.map((c) => c.category))];
    return cats.sort((a, b) => catRank(a) - catRank(b) || a.localeCompare(b));
  }, [videos]);

  const clipsFor = (cat: string) =>
    videos
      .filter((c) => c.category === cat && (!q || c.name.toLowerCase().includes(q)))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // ── mutations (optimistic local update + persist) ──────────────────
  const patchLocal = (id: number, patch: Partial<VideoClip>) =>
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const fail = (e?: string) => {
    if (e) setMsg(`Couldn't save: ${e}`);
  };

  const rename = async (clip: VideoClip, name: string) => {
    patchLocal(clip.id!, { name });
    fail((await updateVideoFields(clip.id!, { name })).error);
  };

  const recategorize = async (clip: VideoClip, category: string) => {
    const maxOrder = Math.max(-1, ...videos.filter((v) => v.category === category).map((v) => v.sortOrder ?? 0));
    const sortOrder = maxOrder + 1;
    patchLocal(clip.id!, { category, sortOrder });
    fail((await updateVideoFields(clip.id!, { category, sort_order: sortOrder })).error);
  };

  const setDuration = async (clip: VideoClip, label: string) => {
    const value = label || null;
    patchLocal(clip.id!, { durationLabel: value });
    fail((await updateVideoFields(clip.id!, { duration_label: value })).error);
  };

  const setTrim = async (clip: VideoClip, start: number | null, end: number | null) => {
    const trim_start = start != null ? Math.round(start * 10) / 10 : null;
    const trim_end = end != null ? Math.round(end * 10) / 10 : null;
    patchLocal(clip.id!, { trimStart: trim_start, trimEnd: trim_end });
    fail((await updateVideoFields(clip.id!, { trim_start, trim_end })).error);
  };

  const toggleHidden = async (clip: VideoClip) => {
    const hidden = !clip.hidden;
    patchLocal(clip.id!, { hidden });
    fail((await updateVideoFields(clip.id!, { hidden })).error);
  };

  const remove = async (clip: VideoClip) => {
    if (!confirm(`Delete "${clip.name}"? This removes it from the library.`)) return;
    setVideos((vs) => vs.filter((v) => v.id !== clip.id));
    fail((await deleteVideoRow(clip.id!)).error);
  };

  const move = async (cat: string, index: number, dir: -1 | 1) => {
    const clips = clipsFor(cat);
    const j = index + dir;
    if (j < 0 || j >= clips.length) return;
    const a = clips[index];
    const b = clips[j];
    const aOrder = a.sortOrder ?? index;
    const bOrder = b.sortOrder ?? j;
    patchLocal(a.id!, { sortOrder: bOrder });
    patchLocal(b.id!, { sortOrder: aOrder });
    const r1 = await updateVideoFields(a.id!, { sort_order: bOrder });
    const r2 = await updateVideoFields(b.id!, { sort_order: aOrder });
    fail(r1.error || r2.error);
  };

  const pickUpload = (cat: string) => {
    uploadTarget.current = cat;
    fileInput.current?.click();
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const cat = uploadTarget.current;
    setUploadingCat(cat);
    setMsg(null);
    const taken = new Set(videos.map((v) => v.slug).filter(Boolean) as string[]);
    const slug = uniqueSlug(slugify(file.name), taken);
    const maxOrder = Math.max(-1, ...videos.filter((v) => v.category === cat).map((v) => v.sortOrder ?? 0));
    const { clip, error } = await uploadNewVideo({
      file,
      slug,
      name: prettyName(file.name),
      category: cat,
      sortOrder: maxOrder + 1,
    });
    setUploadingCat(null);
    if (error || !clip) {
      setMsg(`Upload failed: ${error ?? "unknown error"}`);
      return;
    }
    setVideos((vs) => [...vs, clip]);
  };

  const visibleCount = videos.filter((v) => !v.hidden).length;

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div className="vlib-head">
        <div>
          <h2 style={{ margin: "0 0 4px" }}>Video Library</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${visibleCount} coaching clips, streamed from Supabase`}
          </p>
        </div>
        {isAdmin && (
          <button className={`vlib-edit-toggle${edit ? " on" : ""}`} onClick={() => setEdit((v) => !v)}>
            {edit ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {msg && <div className="vlib-msg">{msg}</div>}

      {!edit && (
        <div className="vlib-search">
          <div className="search-bar">
            <span className="search-icon">⌕</span>
            <input
              placeholder="Search clips…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {edit && (
        <datalist id="vlib-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      )}

      {q && categories.every((cat) => clipsFor(cat).length === 0) && (
        <div className="empty-state">No clips match “{query.trim()}”.</div>
      )}

      {categories.map((cat) => {
        const clips = clipsFor(cat);
        if (clips.length === 0) return null;
        return (
          <section className="category-section" key={cat}>
            <h3>
              {cat} <span style={{ fontWeight: 400 }}>· {clips.length}</span>
              {edit && (
                <button className="cat-upload-btn" disabled={uploadingCat === cat} onClick={() => pickUpload(cat)}>
                  {uploadingCat === cat ? "Uploading…" : "+ Upload"}
                </button>
              )}
            </h3>
            <div className="clip-grid">
              {clips.map((c, i) =>
                edit ? (
                  <EditableClipCard
                    key={c.id ?? c.videoUrl}
                    clip={c}
                    h={{
                      canMoveUp: i > 0,
                      canMoveDown: i < clips.length - 1,
                      onRename: (name) => rename(c, name),
                      onCategory: (category) => recategorize(c, category),
                      onDuration: (label) => setDuration(c, label),
                      onToggleHidden: () => toggleHidden(c),
                      onDelete: () => remove(c),
                      onMove: (dir) => move(cat, i, dir),
                      onTrim: (s, e) => setTrim(c, s, e),
                    }}
                  />
                ) : (
                  <ClipCard
                    key={c.id ?? c.videoUrl}
                    clip={c}
                    anchorId={c.slug ? `clip-${c.slug}` : undefined}
                    flash={!!c.slug && c.slug === flashId}
                  />
                )
              )}
            </div>
          </section>
        );
      })}

      <input
        ref={fileInput}
        type="file"
        accept="video/mp4,video/quicktime,video/*"
        style={{ display: "none" }}
        onChange={onFileChosen}
      />

      <div style={{ height: 32 }} />
    </div>
  );
}
