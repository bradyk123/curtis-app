import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

/**
 * Reads (and, for admins, writes) an app-wide feature flag from the `app_flags`
 * table. `enabled` falls back to `fallback` while loading or if unavailable.
 */
export function useFlag(key: string, fallback = false) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setEnabled(fallback);
      return;
    }
    const { data, error } = await supabase
      .from("app_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      setEnabled(fallback);
      return;
    }
    setEnabled(data ? data.enabled : fallback);
  }, [key, fallback]);

  useEffect(() => {
    load();
  }, [load]);

  const set = async (value: boolean) => {
    setEnabled(value); // optimistic
    if (!supabase) return { error: "Not connected to Supabase." };
    const { error } = await supabase
      .from("app_flags")
      .upsert({ key, enabled: value, updated_at: new Date().toISOString() });
    return { error: error?.message };
  };

  return { enabled: enabled ?? fallback, loading: enabled === null, setEnabled: set };
}
