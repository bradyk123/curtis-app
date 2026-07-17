import { useState, type FormEvent } from "react";
import { useProfile, type Role } from "../lib/profile";
import { TwoFactorSetup } from "./TwoFactorSetup";

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, update } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [role, setRole] = useState<Role>(profile?.role ?? "athlete");
  const [team, setTeam] = useState(profile?.team ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await update({
      display_name: displayName.trim() || null,
      role,
      team: team.trim() || null,
    });
    setBusy(false);
    if (error) setError(error);
    else onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Your Profile</h2>

        <form onSubmit={submit} className="auth-form">
          <label>
            Name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Curtis Taylor"
            />
          </label>

          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="athlete">Athlete</option>
              <option value="coach">Coach</option>
            </select>
          </label>

          <label>
            Team <span style={{ opacity: 0.6 }}>(optional)</span>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Beach Track Club"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </form>

        <TwoFactorSetup />
      </div>
    </div>
  );
}
