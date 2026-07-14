import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Profile, Status } from "../lib/profile";

const COLS = "id,display_name,role,team,status,is_admin,school,class_year,events";

export function AdminPanel() {
  const [pending, setPending] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(COLS)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPending((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, status: Status) => {
    if (!supabase) return;
    setBusyId(id);
    await supabase.from("profiles").update({ status }).eq("id", id);
    setPending((p) => p.filter((x) => x.id !== id));
    setBusyId(null);
  };

  return (
    <div>
      <Link className="back-link" to="/">
        &larr; Back
      </Link>
      <div style={{ padding: "16px 24px 0" }}>
        <h2 style={{ margin: "0 0 4px" }}>Pending approvals</h2>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {loading ? "Loading…" : `${pending.length} awaiting review`}
        </p>
      </div>

      <div style={{ padding: "16px 24px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {!loading && pending.length === 0 && (
          <div className="empty-state" style={{ padding: 0 }}>
            No one waiting — you're all caught up. 🎉
          </div>
        )}

        {pending.map((p) => (
          <div className="approve-card" key={p.id}>
            <div className="approve-info">
              <div className="approve-name">{p.display_name || "(no name)"}</div>
              <div className="approve-meta">
                <span className={`role-badge role-${p.role}`}>{p.role}</span>
                {p.school && <span>{p.school}</span>}
                {p.class_year && <span>Class of {p.class_year}</span>}
                {p.events && <span>{p.events}</span>}
              </div>
            </div>
            <div className="approve-actions">
              <button
                className="approve-btn"
                disabled={busyId === p.id}
                onClick={() => decide(p.id, "approved")}
              >
                Approve
              </button>
              <button
                className="reject-btn"
                disabled={busyId === p.id}
                onClick={() => decide(p.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
