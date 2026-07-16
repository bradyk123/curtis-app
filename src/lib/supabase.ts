import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once VITE_SUPABASE_* env vars are set — until then the app uses the bundled static data. */
export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null;

/** Public base URL for the exercise-media storage bucket. */
export const mediaBaseUrl = url ? `${url}/storage/v1/object/public/exercise-media/` : "";

/** Public base URL for the exercise-video storage bucket (video library clips). */
export const videoBaseUrl = url ? `${url}/storage/v1/object/public/exercise-video/` : "";
