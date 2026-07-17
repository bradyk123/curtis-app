import { supabase, videoBaseUrl } from "../lib/supabase";
import type { VideoClip } from "./useVideos";

const COLS =
  "id, slug, name, category, storage_path, duration_label, trim_start, trim_end, sort_order, hidden, exercise_id";

/** "Box Jump 2.mov" → "box-jump-2" (also used to name the storage file). */
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/\.[^.]+$/, "") // strip extension if present
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "clip"
  );
}

/** Appends -2, -3, … until the slug is free. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** "box-jump-2.mov" → "Box Jump 2" — a friendly default name for a new upload. */
export function prettyName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Maps a DB row to a VideoClip. */
function toClip(v: any): VideoClip {
  return {
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
  };
}

/** Patch DB column(s) on one clip. Keys are snake_case column names. */
export async function updateVideoFields(id: number, patch: Record<string, unknown>) {
  if (!supabase) return { error: "Not connected to Supabase." };
  const { error } = await supabase.from("videos").update(patch).eq("id", id);
  return { error: error?.message };
}

export async function deleteVideoRow(id: number) {
  if (!supabase) return { error: "Not connected to Supabase." };
  const { error } = await supabase.from("videos").delete().eq("id", id);
  return { error: error?.message };
}

/** Uploads an MP4 to the exercise-video bucket, then inserts its row. Returns the new clip. */
export async function uploadNewVideo(opts: {
  file: File;
  slug: string;
  name: string;
  category: string;
  sortOrder: number;
}): Promise<{ clip?: VideoClip; error?: string }> {
  if (!supabase) return { error: "Not connected to Supabase." };
  const ext = (opts.file.name.match(/\.[^.]+$/)?.[0] || ".mp4").toLowerCase();
  const storagePath = opts.slug + ext;

  const up = await supabase.storage
    .from("exercise-video")
    .upload(storagePath, opts.file, { contentType: opts.file.type || "video/mp4", upsert: false });
  if (up.error) return { error: up.error.message };

  const { data, error } = await supabase
    .from("videos")
    .insert({
      slug: opts.slug,
      name: opts.name,
      category: opts.category,
      storage_path: storagePath,
      sort_order: opts.sortOrder,
    })
    .select(COLS)
    .single();
  if (error || !data) return { error: error?.message ?? "Could not save the video." };
  return { clip: toClip(data) };
}
