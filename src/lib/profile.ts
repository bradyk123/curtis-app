import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Role = "athlete" | "coach";
export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  team: string | null;
}

const COLS = "id,display_name,role,team";

/**
 * Loads (and can update) the signed-in user's profile.
 * Degrades gracefully: if the profiles table doesn't exist yet or the user is
 * signed out, `profile` is null and nothing throws.
 */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(COLS)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // table may not exist yet — fail quietly
      setProfile(null);
      setLoading(false);
      return;
    }
    if (!data) {
      // ensure a row exists for pre-existing accounts
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

  const update = async (patch: Partial<Omit<Profile, "id">>) => {
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
