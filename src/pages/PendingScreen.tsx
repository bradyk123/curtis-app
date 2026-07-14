import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { useProfile, type Role } from "../lib/profile";

/** Shown to signed-in users who aren't approved yet. Collects details for the admin to review. */
export function PendingScreen() {
  const { signOut } = useAuth();
  const { profile, update } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [role, setRole] = useState<Role>(profile?.role ?? "athlete");
  const [school, setSchool] = useState(profile?.school ?? "");
  const [classYear, setClassYear] = useState(profile?.class_year ?? "");
  const [events, setEvents] = useState(profile?.events ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const rejected = profile?.status === "rejected";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    await update({
      display_name: displayName.trim() || null,
      role,
      school: school.trim() || null,
      class_year: classYear.trim() || null,
      events: events.trim() || null,
    });
    setBusy(false);
    setSaved(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <div className="auth-brand">
          <div className="auth-logo">🏖️</div>
          <h1>Beach Track Club</h1>
          {rejected ? (
            <p>Your account request wasn't approved. Contact your coach if you think this is a mistake.</p>
          ) : (
            <p>Your account is pending approval. Add your details so your coach can approve you.</p>
          )}
        </div>

        {!rejected && (
          <>
            <form onSubmit={submit} className="auth-form">
              <label>
                Name
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Full name" />
              </label>
              <label>
                I am a…
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                </select>
              </label>
              <label>
                School / Club
                <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Duke University" />
              </label>
              <label>
                Class / Year
                <input value={classYear} onChange={(e) => setClassYear(e.target.value)} placeholder="e.g. 2027" />
              </label>
              <label>
                Events
                <input value={events} onChange={(e) => setEvents(e.target.value)} placeholder="e.g. 100m, Long Jump" />
              </label>
              <button type="submit" className="auth-submit" disabled={busy}>
                {busy ? "Saving…" : "Save details"}
              </button>
            </form>
            {saved && <p className="auth-notice">Saved. You'll get in once your coach approves you.</p>}
          </>
        )}

        <p className="auth-switch">
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
