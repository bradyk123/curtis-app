import { useCallback, useEffect, useState } from "react";
import { videoLibrary as staticVideos } from "./videoLibrary";
import { supabase, supabaseConfigured, videoBaseUrl } from "../lib/supabase";

/** A video-library clip. Fields beyond name/category/videoUrl exist only once loaded from Supabase. */
export interface VideoClip {
  name: string;
  category: string;
  videoUrl: string;
  id?: number;
  slug?: string;
  storagePath?: string;
  durationLabel?: string | null;
  trimStart?: number | null;
  trimEnd?: number | null;
  sortOrder?: number;
  hidden?: boolean;
  /** Attached training-inventory exercise (Phase 3); null = library-only. */
  exerciseId?: number | null;
}

const COLS =
  "id, slug, name, category, storage_path, duration_label, trim_start, trim_end, sort_order, hidden, exercise_id";

/** The bundled static clips, shaped as VideoClip — used before Supabase loads or if it fails. */
const staticClips: VideoClip[] = staticVideos.map((c) => ({
  name: c.name,
  category: c.category,
  videoUrl: c.videoUrl,
}));

/**
 * Loads the video library.
 *
 * - If Supabase is configured it fetches live, so admin edits show up without a
 *   redeploy. Admins also receive hidden clips (RLS returns them); everyone else
 *   only sees visible ones.
 * - Otherwise — or if the fetch fails — it falls back to the bundled static list
 *   in src/data/videoLibrary.ts, so the library is never empty.
 */
export function useVideos() {
  const [videos, setVideos] = useState<VideoClip[]>(supabaseConfigured ? [] : staticClips);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setVideos(staticClips);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select(COLS)
      .order("category")
      .order("sort_order");

    if (error || !data) {
      setError(error?.message ?? "Failed to load videos");
      setVideos(staticClips);
      setLoading(false);
      return;
    }

    setError(null);
    setVideos(
      (data as any[]).map((v) => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        category: v.category,
        storagePath: v.storage_path,
        videoUrl: videoBaseUrl + v.storage_path,
        durationLabel: v.duration_label,
        trimStart: v.trim_start,
        trimEnd: v.trim_end,
        sortOrder: v.sort_order,
        hidden: v.hidden,
        exerciseId: v.exercise_id,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { videos, loading, error, reload: load, setVideos };
}
