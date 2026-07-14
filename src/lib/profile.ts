import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Role = "athlete" | "coach";
export type Status = "pending" | "approved" | "rejected";
export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  team: string | null;
  status: Status;
  is_admin: boolean;
  school: string | null;
  class_year: string | null;
  events: string | null;
}

const COLS = "id,display_name,role,team,status,is_admin,school,class_year,events";
/** Fields a user is allowed to edit on their own profile (status/is_admin are guarded server-side). */
export type EditableProfile = Pick<
  Profile,
  "display_name" | "role" | "team" | "school" | "class_year" | "events"
>;

/**
 * Loads (and can update) the signed-in user's profile.
 * Degrades gracefully: if the table is missing or the user is signed out,
 * `profile` is null and nothing throws.
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select(COLS).eq("id", user.id).maybeSingle();
    if (error) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (!data) {
      const fallback = user.email ? user.email.split("@")[0] : null;
      const { data: created } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: fallback })
        .select(COLS)
        .maybeSingle();
      setProfile((created as Profile) ?? null);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (patch: Partial<EditableProfile>) => {
    if (!supabase || !user) return { error: "Not signed in." };
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select(COLS)
      .maybeSingle();
    if (!error && data) setProfile(data as Profile);
    return { error: error?.message };
  };

  return { profile, loading, reload: load, update };
}
