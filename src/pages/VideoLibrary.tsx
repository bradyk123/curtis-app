import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVideos, type VideoClip } from "../data/useVideos";
import { videoLibrary as staticVideos } from "../data/videoLibrary";

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
function ClipCard({ clip }: { clip: VideoClip }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Prefer the admin-set label; otherwise auto-detect from the file's metadata.
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
    <div className="clip-card">
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
      <div className="clip-name">{clip.name}</div>
    </div>
  );
}

export function VideoLibrary() {
  const { videos, loading } = useVideos();

  const categories = useMemo(() => {
    const cats = [...new Set(videos.map((c) => c.category))];
    return cats.sort((a, b) => catRank(a) - catRank(b) || a.localeCompare(b));
  }, [videos]);

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: "0 0 4px" }}>Video Library</h2>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {loading ? "Loading…" : `${videos.length} coaching clips, streamed from Supabase`}
        </p>
      </div>

      {categories.map((cat) => {
        const clips = videos.filter((c) => c.category === cat);
        return (
          <section className="category-section" key={cat}>
            <h3>
              {cat} <span style={{ fontWeight: 400 }}>· {clips.length}</span>
            </h3>
            <div className="clip-grid">
              {clips.map((c) => (
                <ClipCard key={c.id ?? c.videoUrl} clip={c} />
              ))}
            </div>
          </section>
        );
      })}

      <div style={{ height: 32 }} />
    </div>
  );
}
