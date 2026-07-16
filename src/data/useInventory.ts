import { useCallback, useEffect, useState } from "react";
import type { Category } from "../types";
import { inventory as staticInventory } from "./inventory";
import { supabase, supabaseConfigured, mediaBaseUrl } from "../lib/supabase";

/**
 * Loads the training inventory.
 *
 * - If Supabase is configured (VITE_SUPABASE_* env vars set) it fetches live,
 *   so content edits show up without a redeploy.
 * - Otherwise — or if the fetch fails — it falls back to the bundled static
 *   inventory in src/data/inventory.ts, so the app is never empty.
 */
export function useInventory() {
  const [categories, setCategories] = useState<Category[]>(
    supabaseConfigured ? [] : staticInventory
  );
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured || !supabase) {
      setCategories(staticInventory);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, name, sort_order, hidden, circuits ( id, slug, name, subtitle, sort_order, hidden, exercises ( id, slug, name, media_path, cues, sort_order, hidden ) )"
      )
      .order("sort_order");

    if (error || !data) {
      // fall back to bundled data so the app still works offline / on error
      setError(error?.message ?? "Failed to load inventory");
      setCategories(staticInventory);
      setLoading(false);
      return;
    }

    const bySort = (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order;

    const mapped: Category[] = (data as any[]).map((c) => ({
      id: c.slug,
      dbId: c.id,
      name: c.name,
      hidden: c.hidden,
      sortOrder: c.sort_order,
      circuits: [...(c.circuits ?? [])].sort(bySort).map((ci: any) => ({
        id: ci.slug,
        dbId: ci.id,
        name: ci.name,
        subtitle: ci.subtitle ?? undefined,
        hidden: ci.hidden,
        sortOrder: ci.sort_order,
        exercises: [...(ci.exercises ?? [])].sort(bySort).map((e: any) => ({
          id: e.slug,
          dbId: e.id,
          name: e.name,
          mediaUrl: e.media_path ? mediaBaseUrl + e.media_path : undefined,
          cues: e.cues ?? undefined,
          hidden: e.hidden,
          sortOrder: e.sort_order,
        })),
      })),
    }));

    setError(null);
    setCategories(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, reload: load };
}
