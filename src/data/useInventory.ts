import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(
          "slug, name, sort_order, circuits ( slug, name, subtitle, sort_order, exercises ( slug, name, media_path, cues, sort_order ) )"
        )
        .order("sort_order");

      if (!active) return;

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
        name: c.name,
        circuits: [...(c.circuits ?? [])].sort(bySort).map((ci: any) => ({
          id: ci.slug,
          name: ci.name,
          subtitle: ci.subtitle ?? undefined,
          exercises: [...(ci.exercises ?? [])].sort(bySort).map((e: any) => ({
            id: e.slug,
            name: e.name,
            mediaUrl: e.media_path ? mediaBaseUrl + e.media_path : undefined,
            cues: e.cues ?? undefined,
          })),
        })),
      }));

      setCategories(mapped);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
