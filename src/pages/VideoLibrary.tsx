import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { videoLibrary, type VideoClip } from "../data/videoLibrary";

/** Plays a clip only while it's on screen — keeps a long grid of videos smooth on mobile. */
function ClipCard({ clip }: { clip: VideoClip }) {
  const ref = useRef<HTMLVideoElement>(null);
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
      <video ref={ref} src={clip.videoUrl} muted loop autoPlay playsInline preload="metadata" />
      <div className="clip-name">{clip.name}</div>
    </div>
  );
}

export function VideoLibrary() {
  const categories = [...new Set(videoLibrary.map((c) => c.category))];

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: "0 0 4px" }}>Video Library</h2>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {videoLibrary.length} coaching clips, streamed from Supabase
        </p>
      </div>

      {categories.map((cat) => {
        const clips = videoLibrary.filter((c) => c.category === cat);
        return (
          <section className="category-section" key={cat}>
            <h3>
              {cat} <span style={{ fontWeight: 400 }}>· {clips.length}</span>
            </h3>
            <div className="clip-grid">
              {clips.map((c) => (
                <ClipCard key={c.videoUrl} clip={c} />
              ))}
            </div>
          </section>
        );
      })}

      <div style={{ height: 32 }} />
    </div>
  );
}
