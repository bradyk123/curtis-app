import { supabase } from "../lib/supabase";

export type InvTable = "categories" | "circuits" | "exercises";

/** Patch DB column(s) on one inventory row (snake_case keys). Admin-only (enforced by RLS). */
export async function updateInvRow(table: InvTable, id: number, patch: Record<string, unknown>) {
  if (!supabase) return { error: "Not connected to Supabase." };
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  return { error: error?.message };
}

/**
 * Persist a sibling list's order by writing sort_order = position for each id.
 * Robust even if the seeded sort_order values were all equal.
 */
export async function persistOrder(table: InvTable, orderedIds: number[]) {
  if (!supabase) return { error: "Not connected to Supabase." };
  const results = await Promise.all(orderedIds.map((id, i) => updateInvRow(table, id, { sort_order: i })));
  return { error: results.find((r) => r.error)?.error };
}
