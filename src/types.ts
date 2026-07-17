export interface Exercise {
  id: string;
  name: string;
  /** Path or URL to the demo GIF/image — drop files in public/media and set this. */
  mediaUrl?: string;
  /** Higher-quality MP4 re-encode of the demo (same basename as the GIF). Played
   *  in place of the GIF where present; the GIF is the automatic fallback. */
  videoUrl?: string;
  /** Coaching cue text shown under the media. */
  cues?: string;
  /** DB primary key (present when loaded from Supabase) — used for admin edits. */
  dbId?: number;
  hidden?: boolean;
  sortOrder?: number;
}

export interface Circuit {
  id: string;
  name: string;
  /** e.g. "10 reps each" — shown under the circuit title. */
  subtitle?: string;
  exercises: Exercise[];
  dbId?: number;
  hidden?: boolean;
  sortOrder?: number;
}

export interface Category {
  id: string;
  name: string;
  circuits: Circuit[];
  dbId?: number;
  hidden?: boolean;
  sortOrder?: number;
}
