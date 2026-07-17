import { useEffect, useRef, useState } from "react";
import type { VideoClip } from "../data/useVideos";

/** Seconds → "m:ss" (always, incl. 0:00). */
export function clock(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Seconds → "m:ss", or null when unknown (used for the badge). */
export function fmt(seconds: number) {
  return isFinite(seconds) && seconds > 0 ? clock(seconds) : null;
}

/**
 * Plays a clip only while it's on screen. Honors in/out trim points:
 * if the clip is trimmed, it loops within [trimStart, trimEnd] instead of the whole file.
 */
export function ClipVideo({ clip }: { clip: VideoClip }) {
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
