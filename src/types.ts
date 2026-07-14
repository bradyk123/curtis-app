export interface Exercise {
  id: string;
  name: string;
  /** Path or URL to the demo GIF/image — drop files in public/media and set this. */
  mediaUrl?: string;
  /** Coaching cue text shown under the media. */
  cues?: string;
}

export interface Circuit {
  id: string;
  name: string;
  /** e.g. "10 reps each" — shown under the circuit title. */
  subtitle?: string;
  exercises: Exercise[];
}

export interface Category {
  id: string;
  name: string;
  circuits: Circuit[];
}
