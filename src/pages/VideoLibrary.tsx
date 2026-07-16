import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

/** Seconds → "m:ss". */
function fmt(seconds: number) {
  if (!isFinite(seconds) || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Plays a clip only while it's on screen — keeps a long grid of videos smooth on mobile. */
function ClipVideo({ clip }: { clip: VideoClip }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const duration = clip.durationLabel || detected;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className="clip-media">
      <video
        ref={ref}
        src={clip.videoUrl}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => setDetected(fmt(e.currentTarget.duration))}
      />
      {duration && <span className="clip-duration">{duration}</span>}
    </div>
  );
}

/** Read-only card (athletes + admins not in edit mode). */
function ClipCard({ clip }: { clip: VideoClip }) {
  return (
    <div className="clip-card">
      <ClipVideo clip={clip} />
      <div className="clip-name">{clip.name}</div>
    </div>
  );
}

interface EditHandlers {
  categories: string[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (name: string) => void;
  onCategory: (category: string) => void;
  onDuration: (label: string) => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

/** Editable card (admins in edit mode). Fields save on blur. */
function EditableClipCard({ clip, h }: { clip: VideoClip; h: EditHandlers }) {
  return (
    <div className={`clip-card editing${clip.hidden ? " hidden-clip" : ""}`}>
      <ClipVideo clip={clip} />
      {clip.hidden && <div className="hidden-flag">Hidden from athletes</div>}
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
          <span>Duration</span>
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
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string>("");

  const categories = useMemo(() => {
    const cats = [...new Set(videos.map((c) => c.category))];
    return cats.sort((a, b) => catRank(a) - catRank(b) || a.localeCompare(b));
  }, [videos]);

  const clipsFor = (cat: string) =>
    videos
      .filter((c) => c.category === cat)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // ── mutations (optimistic local update + persist) ──────────────────
  const patchLocal = (id: number, patch: Partial<VideoClip>) =>
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const fail = (e?: string) => {
    if (e) {
      setMsg(`Couldn't save: ${e}`);
      // pull fresh truth back so the UI doesn't lie after a failed write
    }
  };

  const rename = async (clip: VideoClip, name: string) => {
    patchLocal(clip.id!, { name });
    fail((await updateVideoFields(clip.id!, { name })).error);
  };

  const recategorize = async (clip: VideoClip, category: string) => {
    // drop it at the end of the destination category
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
    e.target.value = ""; // allow re-selecting the same file later
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

      {edit && <datalist id="vlib-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>}

      {categories.map((cat) => {
        const clips = clipsFor(cat);
        return (
          <section className="category-section" key={cat}>
            <h3>
              {cat} <span style={{ fontWeight: 400 }}>· {clips.length}</span>
              {edit && (
                <button
                  className="cat-upload-btn"
                  disabled={uploadingCat === cat}
                  onClick={() => pickUpload(cat)}
                >
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
                      categories,
                      canMoveUp: i > 0,
                      canMoveDown: i < clips.length - 1,
                      onRename: (name) => rename(c, name),
                      onCategory: (category) => recategorize(c, category),
                      onDuration: (label) => setDuration(c, label),
                      onToggleHidden: () => toggleHidden(c),
                      onDelete: () => remove(c),
                      onMove: (dir) => move(cat, i, dir),
                    }}
                  />
                ) : (
                  <ClipCard key={c.id ?? c.videoUrl} clip={c} />
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
