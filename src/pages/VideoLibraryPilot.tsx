import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { sprintDrills, type PilotClip } from "../data/sprintPilot";

/** Plays the clip only while it's on screen (keeps 29 videos smooth on mobile). */
function ClipCard({ clip }: { clip: PilotClip }) {
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
      <video
        ref={ref}
        src={clip.videoUrl}
        poster={clip.posterUrl}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
      />
      <div className="clip-name">{clip.name}</div>
    </div>
  );
}

export function VideoLibraryPilot() {
  const groups = [...new Set(sprintDrills.map((c) => c.group))];
  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: "0 0 4px" }}>Sprint Drills — Video Library</h2>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          Preview · {sprintDrills.length} real video clips, streamed from Supabase
        </p>
      </div>

      {groups.map((g) => (
        <section className="category-section" key={g}>
          <h3>{g}</h3>
          <div className="clip-grid">
            {sprintDrills
              .filter((c) => c.group === g)
              .map((c) => (
                <ClipCard key={c.videoUrl} clip={c} />
              ))}
          </div>
        </section>
      ))}

      <div style={{ height: 32 }} />
    </div>
  );
}
